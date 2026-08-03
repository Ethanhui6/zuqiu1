import {CAREER_SETTINGS} from '../../app/config.js';
import {DeterministicRng} from '../../services/rng.js';
import {resolveTraining,progressRecovery} from '../training/trainingSystem.js';
import {generateEvent,resolveEventChoice,consumeResolvedEvent,applyDelayedEffects} from '../event/eventEngine.js';
import {generateMatch,resolveMatch,consumeMatch} from '../match/matchSystem.js';
import {generateOffers,marketValue,expireOffers} from '../transfer/transferSystem.js';
import {updateCareerStage,advanceSeason,shouldRetire} from './careerSystem.js';
import {evaluateAchievements} from '../achievement/achievementSystem.js';
import {calculateEnding} from '../ending/endingSystem.js';
import {evaluateNationalTeam} from './nationalSystem.js';
import {settleSeasonAwards} from './seasonAwardSystem.js';
import {ensurePaceState,eventInterval,selectAutoEventChoice,selectAutoMatchChoice,shouldPauseForEvent,shouldPauseForMatch,matchPresentationFor,speedDelay,getSpeed,TRAINING_STRATEGIES,autoPauseEnabled} from '../pace/paceSystem.js';
import {ensureSchedule,fixturesForWeek,settleCompetitionState,SEASON_WEEKS} from '../schedule/scheduleSystem.js';
import {generateObjectiveCandidates,settleObjectives,objectiveProgress} from './objectiveSystem.js';
import {totalFans} from '../fan/fanSystem.js';

function emptyWeekState(){return{trainingDone:false,eventDone:false,matchDone:false,trainingResult:null}}
function snapshot(save){return{season:save.career.season,week:save.career.calendar?.week||1,month:save.career.month,apps:save.career.careerStats.apps,goals:save.career.careerStats.goals,assists:save.career.careerStats.assists,ovr:save.player.ovr,coach:save.status.coachTrust,fitness:save.status.fitness,fans:totalFans(save),offers:save.career.pending.offers.length,achievements:save.achievements.unlocked.length,clubId:save.career.clubId}}
function sleep(ms){return ms>0?new Promise(resolve=>setTimeout(resolve,ms)):Promise.resolve()}
function setNextEventWeek(save){const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;save.career.calendar.nextEventWeek=(save.career.calendar.week||1)+eventInterval(save,rng);save.rng=rng.snapshot()}
function targetReached(target,start,save){
  const week=save.career.calendar.week,season=save.career.season,month=save.career.month;
  if(target==='week')return season>start.season||week>start.week;
  if(target==='month')return season>start.season||month>start.month;
  if(target==='season')return season>start.season;
  if(target==='window')return (season>start.season||month!==start.month)&&[CAREER_SETTINGS.summerWindowMonth,CAREER_SETTINGS.winterWindowMonth].includes(month);
  return false;
}
function ensureStrategyTraining(save){
  const key=save.career.strategies?.training||'balanced',strategy=TRAINING_STRATEGIES[key]||TRAINING_STRATEGIES.balanced;
  if(key==='health'&&(save.status.fatigue>=45||save.status.fitness<=65||save.status.injury))save.career.trainingPlan='recovery';
  else save.career.trainingPlan=strategy.plan;
}
function record(log,type,payload={}){log.push({type,...payload})}

function pendingOfferPause(save,offers=save.career.pending.offers||[]){
  const active=offers.filter(offer=>!offer.autoPauseNotified&&!['已接受','已拒绝','谈判破裂','已过期','选择留队'].includes(offer.status));
  const renewals=active.filter(offer=>offer.type==='续约');
  if(renewals.length&&autoPauseEnabled(save,'contract')){for(const offer of renewals)offer.autoPauseNotified=true;return{status:'paused',reason:'transfer',pauseRule:'contract',offers:renewals}}
  const transfers=active.filter(offer=>offer.type!=='续约');
  if(transfers.length&&autoPauseEnabled(save,'transferOffer')){for(const offer of transfers)offer.autoPauseNotified=true;return{status:'paused',reason:'transfer',pauseRule:'transferOffer',offers:transfers}}
  return null;
}

async function pauseWithCategoryEvent(save,repo,category,rule){
  if(!autoPauseEnabled(save,rule))return null;
  const event=await generateEvent(save,repo,{category});
  return{status:'paused',reason:'event',pauseRule:rule,event};
}
function summaryFrom(save,start,log,target,status,reason){
  const end=snapshot(save),matches=log.filter(x=>x.type==='match'),events=log.filter(x=>x.type==='event'),trainings=log.filter(x=>x.type==='training'),nodes=log.filter(x=>x.type==='node'),newOffers=Math.max(0,end.offers-start.offers),newAchievements=Math.max(0,end.achievements-start.achievements);
  const summary={
    target,status,reason,weeksAdvanced:Math.max(0,(save.career.calendar.absoluteWeek||0)-(start.absoluteWeek||0)),
    seasonFrom:start.season,seasonTo:end.season,monthFrom:start.month,monthTo:end.month,
    matches:matches.length,starts:matches.filter(x=>x.starts).length,goals:end.goals-start.goals,assists:end.assists-start.assists,
    eventCount:events.length,trainingCount:trainings.length,ovrChange:end.ovr-start.ovr,coachTrustChange:Math.round(end.coach-start.coach),fitnessChange:Math.round(end.fitness-start.fitness),fansChange:end.fans-start.fans,
    newOffers,newAchievements,nodes:[]
  };
  summary.nodes=[...nodes.map(x=>x.title),...events.filter(x=>x.critical).map(x=>x.title),...matches.filter(x=>x.important).map(x=>`${x.competition}：${x.opponent}`)].slice(0,6);
  summary.headline=summary.nodes[0]||(summary.goals||summary.assists?`本阶段贡献 ${summary.goals} 球 ${summary.assists} 次助攻`:summary.ovrChange?`综合能力 ${summary.ovrChange>0?'+':''}${summary.ovrChange}`:`完成 ${summary.weeksAdvanced} 周推进`);
  return summary;
}

export function ensureTimeState(save,repo){
  ensurePaceState(save);
  save.career.calendar={week:1,absoluteWeek:1,nextEventWeek:1,...(save.career.calendar||{})};
  save.career.weekState={...emptyWeekState(),...(save.career.weekState||{})};
  save.career.matchHistory??=[];save.career.majorNodes??=[];
  ensureSchedule(save,repo);generateObjectiveCandidates(save);
  if(!Number.isFinite(Number(save.career.calendar.nextEventWeek)))setNextEventWeek(save);
  save.career.month=Math.max(1,Math.min(CAREER_SETTINGS.monthsPerSeason,Math.ceil(save.career.calendar.week/4)));
  save.career.seasonProgress=Math.min(100,Math.round((save.career.calendar.week-1)/SEASON_WEEKS*100));
  return save.career.calendar;
}

async function processCurrentWeek(save,repo,{target,signal,onProgress,log}){
  ensureTimeState(save,repo);const calendar=save.career.calendar,week=calendar.week,state=save.career.weekState,club=repo.getClub(save.career.clubId);
  const existingOfferPause=pendingOfferPause(save);if(existingOfferPause)return existingOfferPause;
  if(week===1){
    const beforeOffers=save.career.pending.offers.length,offers=generateOffers(save,repo);
    if(offers.length>beforeOffers)record(log,'node',{title:`夏季窗口收到${offers.length-beforeOffers}份报价`});
    const offerPause=pendingOfferPause(save,offers);if(offerPause)return offerPause;
  }
  onProgress?.({season:save.career.season,week,month:save.career.month,label:'训练与恢复',progress:Math.round((week-1)/SEASON_WEEKS*100)});
  if(!state.trainingDone){
    ensureStrategyTraining(save);const result=resolveTraining(save,club,{scale:.25});state.trainingDone=true;state.trainingResult=result;record(log,'training',{plan:result.plan.name,gains:result.gains,injury:result.injury?.name||null});
    if(result.injury){record(log,'node',{title:`训练伤病：${result.injury.name}`});const injuryPause=await pauseWithCategoryEvent(save,repo,'injury','injury');if(injuryPause)return injuryPause}
  }
  if(signal?.aborted)return{status:'stopped',reason:'user'};

  if(save.career.pending.event&&!save.career.pending.event.resolved)return{status:'paused',reason:'event',event:save.career.pending.event};
  if(!state.eventDone){
    const due=Boolean(save.career.pending.event)||week>=Number(calendar.nextEventWeek||1);
    if(due){
      const event=await generateEvent(save,repo);const critical=shouldPauseForEvent(save,event,{target});
      if(critical)return{status:'paused',reason:'event',event};
      const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const choice=selectAutoEventChoice(save,event,rng);save.rng=rng.snapshot();const result=resolveEventChoice(save,choice.id);record(log,'event',{id:event.id,title:event.title,category:event.category,critical:false,choice:choice.text,outcome:result.outcome.label});consumeResolvedEvent(save);setNextEventWeek(save);
    }
    state.eventDone=true;
  }
  if(signal?.aborted)return{status:'stopped',reason:'user'};

  if(save.career.pending.match&&!save.career.pending.match.resolved)return{status:'paused',reason:'match',match:save.career.pending.match};
  if(!state.matchDone){
    const fixtures=fixturesForWeek(save,repo,week);
    if(fixtures.length){
      const match=generateMatch(save,repo,{fixtureId:fixtures[0].id});
      if(match&&shouldPauseForMatch(save,match,{target}))return{status:'paused',reason:'match',match};
      if(match){
        const hadInjury=Boolean(save.status.injury),rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const choice=selectAutoMatchChoice(save,match,rng);save.rng=rng.snapshot();const presentation=matchPresentationFor(save,match);const result=resolveMatch(save,repo,choice?.id,{presentation});record(log,'match',{id:match.id,opponent:repo.getClub(match.opponentId).cn,competition:match.competition,score:result.score,starts:result.starts,rating:result.playerResult.rating,important:match.importance!=='普通联赛'&&match.importance!=='普通比赛'});consumeMatch(save);
        if(!hadInjury&&save.status.injury){state.matchDone=true;record(log,'node',{title:`比赛伤病：${save.status.injury.name}`});const injuryPause=await pauseWithCategoryEvent(save,repo,'injury','injury');if(injuryPause)return injuryPause}
      }
    }
    state.matchDone=true;
  }
  if(signal?.aborted)return{status:'stopped',reason:'user'};

  applyDelayedEffects(save);const recovery=progressRecovery(save,club);if(recovery.recovered)record(log,'node',{title:'伤愈复出'});
  const beforeSquad=save.career.squadLevel;updateCareerStage(save,club);if(beforeSquad!==save.career.squadLevel){save.career.schedule=null;ensureSchedule(save,repo);record(log,'node',{title:`进入${save.career.squadLevel}`})}
  save.finance.marketValue=marketValue(save,club);settleObjectives(save);
  const oldMonth=save.career.month;calendar.week++;calendar.absoluteWeek=(calendar.absoluteWeek||1)+1;save.career.month=Math.min(CAREER_SETTINGS.monthsPerSeason,Math.ceil(calendar.week/4));save.career.seasonProgress=Math.min(100,Math.round((calendar.week-1)/SEASON_WEEKS*100));save.career.weekState=emptyWeekState();

  let seasonEnded=false;
  if(calendar.week>SEASON_WEEKS){
    seasonEnded=true;const awards=settleSeasonAwards(save,club);if(awards.length)record(log,'node',{title:`赛季荣誉：${awards.map(x=>x.name).join('、')}`});const competition=settleCompetitionState(save,repo);if(competition.history.at(-1)?.outcome!=='留在当前级别')record(log,'node',{title:`联赛结果：${competition.history.at(-1)?.outcome}`});advanceSeason(save);save.career.calendar={week:1,absoluteWeek:calendar.absoluteWeek,nextEventWeek:1};save.career.weekState=emptyWeekState();save.career.schedule=null;generateObjectiveCandidates(save,{force:true});ensureSchedule(save,repo);if(shouldRetire(save)){save.career.retirement=calculateEnding(save,repo);record(log,'node',{title:`职业结局：${save.career.retirement.name}`});return{status:'complete',reason:'retirement',seasonEnded:true}}
  }
  if(!seasonEnded&&save.career.month!==oldMonth){
    expireOffers(save);
    const beforeOffers=save.career.pending.offers.length,offers=generateOffers(save,repo);if(offers.length>beforeOffers)record(log,'node',{title:`收到${offers.length-beforeOffers}份转会报价`});
    const national=evaluateNationalTeam(save);if(national){record(log,'node',{title:`国家队征召：${national.apps}次出场`});const nationalPause=await pauseWithCategoryEvent(save,repo,'national','nationalCall');if(nationalPause)return nationalPause}
    const offerPause=pendingOfferPause(save,offers);if(offerPause)return offerPause;
    const achievements=evaluateAchievements(save,repo.achievements);if(achievements.length)record(log,'node',{title:`解锁${achievements.length}项成就`});
  }else evaluateAchievements(save,repo.achievements);
  return{status:'week-complete',seasonEnded};
}

export async function advanceCareer(save,repo,target,{signal,onProgress}={}){
  if(!['nextEvent','nextMatch','week','month','window','season'].includes(target))throw new Error('未知推进目标');
  ensureTimeState(save,repo);
  if(getSpeed(save).id==='paused')return{status:'stopped',reason:'paused',summary:{target,status:'stopped',reason:'paused',weeksAdvanced:0,headline:'推进已暂停',matches:0,eventCount:0,trainingCount:0,nodes:[]}};
  const start={...snapshot(save),absoluteWeek:save.career.calendar.absoluteWeek||1},log=[];save.career.advance.running=true;
  if(save.career.pending.event&&!save.career.pending.event.resolved){const summary=summaryFrom(save,start,log,target,'paused','event');save.career.advance.running=false;return{status:'paused',reason:'event',event:save.career.pending.event,summary}}
  if(save.career.pending.match&&!save.career.pending.match.resolved){const summary=summaryFrom(save,start,log,target,'paused','match');save.career.advance.running=false;return{status:'paused',reason:'match',match:save.career.pending.match,summary}}
  const maxWeeks=target==='week'?1:target==='month'?6:target==='nextEvent'||target==='nextMatch'?SEASON_WEEKS*2:target==='window'?SEASON_WEEKS*2:SEASON_WEEKS+2;
  let result={status:'complete',reason:'target'};
  for(let i=0;i<maxWeeks;i++){
    if(signal?.aborted){result={status:'stopped',reason:'user'};break}
    if(getSpeed(save).id==='paused'){result={status:'stopped',reason:'paused'};break}
    result=await processCurrentWeek(save,repo,{target,signal,onProgress,log});
    if(['paused','stopped'].includes(result.status)||save.career.retirement)break;
    if(target==='nextEvent'&&log.some(x=>x.type==='event'))break;
    if(target==='nextMatch'&&log.some(x=>x.type==='match'))break;
    if(targetReached(target,start,save))break;
    await sleep(speedDelay(save));
  }
  const summary=summaryFrom(save,start,log,target,result.status,result.reason);save.career.advance.running=false;save.career.advance.lastSummary=summary;save.career.advance.history.push({...summary,at:Date.now()});save.career.advance.history=save.career.advance.history.slice(-60);return{...result,summary,log,objectives:objectiveProgress(save)};
}

export function acknowledgeEventDecision(save){consumeResolvedEvent(save);save.career.weekState??=emptyWeekState();save.career.weekState.eventDone=true;setNextEventWeek(save)}
export function acknowledgeMatchDecision(save){consumeMatch(save);save.career.weekState??=emptyWeekState();save.career.weekState.matchDone=true}
