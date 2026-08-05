import {DeterministicRng} from '../../services/rng.js';
import {addGameDays,addGameMonths,compareGameDates,daysBetween,formatGameDate,parseGameDate} from '../../utils/gameDate.js';
import {resolveTraining,progressRecovery} from '../training/trainingSystem.js';
import {generateEvent,resolveEventChoice,consumeResolvedEvent,applyDelayedEffects} from '../event/eventEngine.js';
import {generateMatch,resolveMatch,consumeMatch} from '../match/matchSystem.js';
import {generateOffers,marketValue,expireOffers} from '../transfer/transferSystem.js';
import {updateCareerStage,advanceSeason,shouldRetire} from './careerSystem.js';
import {evaluateAchievements} from '../achievement/achievementSystem.js';
import {calculateEnding} from '../ending/endingSystem.js';
import {evaluateNationalTeam} from './nationalSystem.js';
import {settleSeasonAwards} from './seasonAwardSystem.js';
import {ensurePaceState,eventInterval,getPaceOptions,selectAutoEventChoice,selectAutoMatchChoice,shouldPauseForEvent,shouldPauseForMatch,matchPresentationFor,speedDelay,getSpeed,TRAINING_STRATEGIES,autoPauseEnabled,getPaceMode} from '../pace/paceSystem.js';
import {ensureSchedule,fixturesForDate,nextFixture,settleCompetitionState} from '../schedule/scheduleSystem.js';
import {generateObjectiveCandidates,settleObjectives,objectiveProgress} from './objectiveSystem.js';
import {totalFans} from '../fan/fanSystem.js';
import {advanceGameDay,assertClockInvariants,ensureGameClock,rollClockToNextSeason} from './gameClock.js';
import {applyWeeklyPlan} from '../planning/weeklyPlanSystem.js';
import {ensureSquadCompetition,updateSquadCompetition} from '../squad/squadCompetitionSystem.js';
import {generateAgentAdvice} from '../agent/agentSystem.js';
import {generateStateMessages} from '../messages/messageCenterSystem.js';
import {regressFormMomentum} from '../form/formMomentumSystem.js';
import {evaluateTraits} from '../trait/traitSystem.js';
import {simulateWorldMonth} from '../world/worldDynamicsSystem.js';
import {updateCareerDirector} from '../ai/careerAIDirector.js';
import {createAdvanceSummaryViewModel} from './advanceSummary.js';

const VALID_TARGETS=new Set(['nextEvent','nextMatch','week','month','halfSeason','window','season','milestone']);
function emptyWeekState(){return{trainingDone:false,eventDone:false,matchDone:false,trainingResult:null}}
function sumAttributes(save){return Object.values(save.player.attrs||{}).reduce((sum,value)=>sum+Number(value||0),0)}
function snapshot(save){return{date:ensureGameClock(save).currentDate,apps:save.career.careerStats.apps,goals:save.career.careerStats.goals,assists:save.career.careerStats.assists,ovr:save.player.ovr,totalAttributes:sumAttributes(save),coach:save.status.coachTrust,fitness:save.status.fitness,fans:totalFans(save),marketValue:save.finance.marketValue,offers:activeOfferCount(save),achievements:save.achievements.unlocked.length,clubId:save.career.clubId}}
function growthChanges(growth){if(Array.isArray(growth?.changes))return growth.changes;return Object.entries(growth?.changes||{}).map(([key,delta])=>({key,delta,xp:delta,levels:0}))}
function growthSummary(log){
  const byKey=new Map(),events=[];let totalXp=0;
  for(const item of log){
    const growths=[item.growth,...(item.growths||[])].filter(Boolean);
    for(const growth of growths){
      const changes=growthChanges(growth);if(!changes.length)continue;
      const declaredXp=Number(growth.totalXp),fallbackXp=changes.reduce((sum,change)=>sum+Math.max(0,Number(change.xp||0)),0);totalXp+=Number.isFinite(declaredXp)?declaredXp:fallbackXp;
      events.push({date:item.date||null,source:item.type,reason:growth.reason||item.title||'',ovrDelta:Number(growth.ovrDelta||0)});
      for(const change of changes){
        const key=change.key||'unknown',current=byKey.get(key)||{key,label:change.label||key,xp:0,delta:0,levels:0,valueBefore:change.valueBefore,valueAfter:change.valueAfter,displayBefore:change.displayBefore,displayAfter:change.displayAfter,progress:change.progress,next:change.next};
        current.label=change.label||current.label;current.xp+=Number(change.xp||0);current.delta+=Number(change.delta||0);current.levels+=Number(change.levels||0);
        for(const field of ['valueBefore','valueAfter','displayBefore','displayAfter','progress','next'])if(change[field]!==undefined)current[field]=change[field];
        byKey.set(key,current);
      }
    }
  }
  const changes=[...byKey.values()].map(change=>({...change,xp:Number(change.xp.toFixed(2)),delta:Number(change.delta.toFixed(2))}));
  return{totalXp:Number(totalXp.toFixed(2)),changes,breakthroughs:changes.filter(change=>change.levels>0).map(change=>change.label),events:events.slice(-20)};
}
function sleep(ms){return ms>0?new Promise(resolve=>setTimeout(resolve,ms)):Promise.resolve()}
function record(log,type,payload={}){log.push({date:payload.date||null,type,...payload})}
function interruptionText(result){const map={event:'出现需要你决定的职业事件',match:'重要比赛需要你亲自处理',training:'自动训练已关闭，需要先安排本周训练',transfer:'收到需要你亲自处理的转会或合同报价',injury:'出现重大伤病',paused:'推进速度已暂停',user:'你主动停止了推进',retirement:'职业生涯进入退役结算'};return result.interruptionReason||map[result.reason]||'出现关键节点'}
function nextWindowDate(currentDate){const {year,month}=parseGameDate(currentDate);if(month<7)return`${year}-07-01`;if(month<12)return`${year+1}-01-01`;return`${year+1}-07-01`}
function targetDateFor(type,save,repo){const clock=ensureGameClock(save);if(type==='week')return addGameDays(clock.currentDate,7);if(type==='month')return addGameMonths(clock.currentDate,1);if(type==='halfSeason')return addGameMonths(clock.currentDate,6);if(type==='window')return nextWindowDate(clock.currentDate);if(type==='season')return clock.seasonEndDate;if(type==='nextMatch')return nextFixture(save,repo)?.date||clock.seasonEndDate;if(type==='nextEvent')return save.career.calendar.nextEventDate||addGameDays(clock.currentDate,56);return addGameDays(clock.currentDate,730)}
function createAdvanceRequest(save,repo,type){const clock=ensureGameClock(save);return{id:`ADV-${Date.now()}-${save.rng.counter||0}`,type,startDate:clock.currentDate,requestedTargetDate:targetDateFor(type,save,repo),paceMode:getPaceMode(save).id,stopRules:{...save.settings.pace.autoPause},createdAt:Date.now()}}
function setNextEventDate(save){const clock=ensureGameClock(save),rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const interval=eventInterval(save,rng);save.career.calendar.nextEventDate=addGameDays(clock.currentDate,interval*7);save.career.calendar.nextEventWeek=clock.competitionWeek+interval;save.rng=rng.snapshot()}
function ensureStrategyTraining(save){const key=save.career.strategies?.training||'balanced',strategy=TRAINING_STRATEGIES[key]||TRAINING_STRATEGIES.balanced;if(key==='health'&&(save.status.fatigue>=45||save.status.fitness<=65||save.status.injury))save.career.trainingPlan='recovery';else save.career.trainingPlan=strategy.plan}
function pendingOfferPause(save,offers=save.career.pending.offers||[]){
  const active=offers.filter(offer=>!offer.autoPauseNotified&&!['已接受','已拒绝','谈判破裂','已过期','选择留队'].includes(offer.status));
  const renewals=active.filter(offer=>offer.type==='续约');if(renewals.length&&autoPauseEnabled(save,'contract')){for(const offer of renewals)offer.autoPauseNotified=true;return{status:'paused',reason:'transfer',pauseRule:'contract',offers:renewals}}
  const transfers=active.filter(offer=>offer.type!=='续约');if(transfers.length&&autoPauseEnabled(save,'transferOffer')){for(const offer of transfers)offer.autoPauseNotified=true;return{status:'paused',reason:'transfer',pauseRule:'transferOffer',offers:transfers}}return null;
}
async function pauseWithCategoryEvent(save,repo,category,rule){if(!autoPauseEnabled(save,rule))return null;const event=await generateEvent(save,repo,{category});return{status:'paused',reason:'event',pauseRule:rule,event,interruptionReason:`${event.title}需要你亲自决定`}}
function isWeekBoundary(save,previousWeek){return ensureGameClock(save).competitionWeek!==previousWeek}
function monthKey(date){return date.slice(0,7)}
function isMajorNode(result){return['event','match','transfer','injury','retirement'].includes(result.reason)||Boolean(result.pauseRule)}
function cloneSave(save){return typeof structuredClone==='function'?structuredClone(save):JSON.parse(JSON.stringify(save))}
function restoreSave(save,backup){for(const key of Object.keys(save))delete save[key];Object.assign(save,backup)}
function activeOfferCount(save){return(save.career.pending.offers||[]).filter(offer=>!['已接受','已拒绝','谈判破裂','已过期','选择留队'].includes(offer.status)).length}

export function assertAdvanceResultInvariants(save,result){
  const expected=Math.max(0,daysBetween(result.startDate,result.actualEndDate));
  if(expected!==result.elapsedDays)throw new Error(`推进天数校验失败：日期差为${expected}天，报告为${result.elapsedDays}天`);
  if(compareGameDates(result.actualEndDate,result.startDate)<0)throw new Error('推进结束日期早于开始日期');
  if(result.completedFullTarget&&compareGameDates(result.actualEndDate,result.plannedEndDate)<0)throw new Error('推进报告错误地标记为完整完成');
  for(const match of result.processedMatches||[]){
    if(!match.date||compareGameDates(match.date,result.startDate)<=0||compareGameDates(match.date,result.actualEndDate)>0)throw new Error(`比赛日期不在推进区间：${match.date||'缺失日期'}`);
  }
  const clock=ensureGameClock(save);
  if(compareGameDates(clock.currentDate,clock.lastProcessedDate)<0)throw new Error('游戏日期早于最后处理日期');
  return true;
}

function buildAdvanceResult(save,request,before,log,result){
  const growth=growthSummary(log),after=snapshot(save),matches=log.filter(item=>item.type==='match'),played=matches.filter(item=>item.played!==false),ratings=played.map(item=>Number(item.rating)).filter(Number.isFinite),events=log.filter(item=>item.type==='event'),trainings=log.filter(item=>item.type==='training');
  const actualEndDate=result.actualEndDate||ensureGameClock(save).currentDate,elapsedDays=Math.max(0,daysBetween(request.startDate,actualEndDate));
  const output={requestId:request.id,type:request.type,startDate:request.startDate,plannedEndDate:request.requestedTargetDate,actualEndDate,plannedElapsedDays:Math.max(0,daysBetween(request.startDate,request.requestedTargetDate)),elapsedDays,elapsedWeeks:Number((elapsedDays/7).toFixed(1)),completedFullTarget:compareGameDates(actualEndDate,request.requestedTargetDate)>=0&&!result.interrupted,interrupted:Boolean(result.interrupted),interruptionReason:result.interrupted?interruptionText(result):'',reason:result.reason||'target',processedMatches:matches,processedTrainingSessions:trainings,processedEvents:events,growth,statDelta:{processedMatchCount:matches.length,matchesPlayed:after.apps-before.apps,goals:after.goals-before.goals,assists:after.assists-before.assists,averageRating:ratings.length?Number((ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2)):null,ovrChange:after.ovr-before.ovr,totalAttributeDelta:after.totalAttributes-before.totalAttributes,growthXp:growth.totalXp,growthChanges:growth.changes,breakthroughs:growth.breakthroughs,coachTrustDelta:Math.round(after.coach-before.coach),fitnessDelta:Math.round(after.fitness-before.fitness),fansDelta:after.fans-before.fans,marketValueDelta:after.marketValue-before.marketValue,newOffers:Math.max(0,after.offers-before.offers),newAchievements:Math.max(0,after.achievements-before.achievements)},importantEvents:log.filter(item=>['node','highlight'].includes(item.type)||item.important).map(item=>item.title).filter(Boolean).slice(0,8)};
  assertAdvanceResultInvariants(save,output);output.viewModel=createAdvanceSummaryViewModel(output);output.headline=output.viewModel.headline;output.title=output.viewModel.title;output.subtitle=output.viewModel.subtitle;output.weeksAdvanced=Math.floor(output.elapsedDays/7);output.matches=output.statDelta.processedMatchCount;output.goals=output.statDelta.goals;output.assists=output.statDelta.assists;output.ovrChange=output.statDelta.ovrChange;output.coachTrustChange=output.statDelta.coachTrustDelta;output.fitnessChange=output.statDelta.fitnessDelta;output.fansChange=output.statDelta.fansDelta;output.newOffers=output.statDelta.newOffers;output.newAchievements=output.statDelta.newAchievements;output.nodes=output.importantEvents;return output;
}

export function ensureTimeState(save,repo){
  ensurePaceState(save);const clock=ensureGameClock(save);save.career.calendar={week:clock.competitionWeek,absoluteWeek:save.career.calendar?.absoluteWeek||1,nextEventWeek:save.career.calendar?.nextEventWeek||clock.competitionWeek,nextEventDate:save.career.calendar?.nextEventDate||null};
  save.career.weekState={...emptyWeekState(),...(save.career.weekState||{})};save.career.matchHistory??=[];save.career.majorNodes??=[];save.career.advance={running:false,lastSummary:null,history:[],activeRequest:null,...(save.career.advance||{})};save.career.advance.history??=[];
  ensureSchedule(save,repo);generateObjectiveCandidates(save);if(!save.career.calendar.nextEventDate)setNextEventDate(save);updateCareerDirector(save);ensureSquadCompetition(save,repo.getClub(save.career.clubId));generateStateMessages(save);assertClockInvariants(save);return clock;
}


function settleSeasonBoundary(save,repo,log,date){
  const clock=ensureGameClock(save),club=repo.getClub(save.career.clubId);
  if(compareGameDates(date,clock.seasonEndDate)<0)return null;
  const awards=settleSeasonAwards(save,club);if(awards.length)record(log,'node',{date,title:`赛季荣誉：${awards.map(item=>item.name).join('、')}`});
  const competition=settleCompetitionState(save,repo);if(competition.history.at(-1)?.outcome!=='留在当前级别')record(log,'node',{date,title:`联赛结果：${competition.history.at(-1)?.outcome}`});
  advanceSeason(save);rollClockToNextSeason(save);save.career.schedule=null;ensureSchedule(save,repo);if(!save.career.calendar.nextEventDate)setNextEventDate(save);generateObjectiveCandidates(save,{force:true});updateCareerDirector(save,{force:true});
  if(shouldRetire(save)){save.career.retirement=calculateEnding(save,repo);record(log,'node',{date,title:`职业结局：${save.career.retirement.name}`});return{status:'complete',reason:'retirement',interrupted:true,actualEndDate:date}}
  return{status:'season-complete',reason:'season-end',actualEndDate:date};
}

async function processGameDay(save,repo,{request,signal,onProgress,log,previousDate}){
  const previousWeek=ensureGameClock(save).competitionWeek,previousMonth=monthKey(previousDate),clock=advanceGameDay(save),date=clock.currentDate,club=repo.getClub(save.career.clubId);
  onProgress?.({season:save.career.season,date,week:clock.competitionWeek,month:parseGameDate(date).month,label:`处理${formatGameDate(date,{short:true})}`,progress:Math.min(100,Math.round(daysBetween(request.startDate,date)/Math.max(1,daysBetween(request.startDate,request.requestedTargetDate))*100))});
  if(signal?.aborted)return{status:'stopped',reason:'user',interrupted:true,actualEndDate:date};

  const offerPause=pendingOfferPause(save);if(offerPause)return{...offerPause,interrupted:true,actualEndDate:date};
  if(isWeekBoundary(save,previousWeek)){
    const plan=applyWeeklyPlan(save);if(plan)record(log,'training',{date,title:`执行${plan.name}`,plan:plan.name,gains:plan.growth?.changes||[],growth:plan.growth||null});
    if(!getPaceOptions(save).autoTraining)return{status:'paused',reason:'training',interrupted:true,actualEndDate:date};
    const recovery=progressRecovery(save,club);if(recovery.recovered)record(log,'node',{date,title:'伤愈复出'});
    ensureStrategyTraining(save);const training=resolveTraining(save,club,{scale:.24});record(log,'training',{date,title:training.plan.name,plan:training.plan.name,gains:training.gains,growth:training.growth,injury:training.injury?.name||null});
    if(training.injury){record(log,'node',{date,title:`训练伤病：${training.injury.name}`});const pause=await pauseWithCategoryEvent(save,repo,'injury','injury');if(pause)return{...pause,interrupted:true,actualEndDate:date}}
    updateSquadCompetition(save,club);regressFormMomentum(save);
  }

  applyDelayedEffects(save);
  if(save.career.pending.event&&!save.career.pending.event.resolved)return{status:'paused',reason:'event',event:save.career.pending.event,interrupted:true,actualEndDate:date};
  if(compareGameDates(date,save.career.calendar.nextEventDate)>=0){
    const event=await generateEvent(save,repo),critical=shouldPauseForEvent(save,event,{target:request.type});
    if(critical)return{status:'paused',reason:'event',event,interrupted:true,actualEndDate:date,interruptionReason:`${event.title}需要你亲自决定`};
    const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const choice=selectAutoEventChoice(save,event,rng);save.rng=rng.snapshot();const resolved=resolveEventChoice(save,choice.id);record(log,'event',{date,id:event.id,title:event.title,category:event.category,choice:choice.text,outcome:resolved.outcome.label,growth:resolved.growth});consumeResolvedEvent(save);setNextEventDate(save);
  }

  const fixtures=fixturesForDate(save,repo,date);
  for(const fixture of fixtures){
    const match=generateMatch(save,repo,{fixtureId:fixture.id});
    if(!getPaceOptions(save).autoMatch)return{status:'paused',reason:'match',match,interrupted:true,actualEndDate:date};
    if(shouldPauseForMatch(save,match,{target:request.type}))return{status:'paused',reason:'match',match,interrupted:true,actualEndDate:date,interruptionReason:`${match.competition}对阵${repo.getClub(match.opponentId).cn}需要你亲自处理`};
    const hadInjury=Boolean(save.status.injury),rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const choice=selectAutoMatchChoice(save,match,rng);save.rng=rng.snapshot();const resolved=resolveMatch(save,repo,choice?.id,{presentation:matchPresentationFor(save,match)});record(log,'match',{date,id:match.id,title:`${match.competition}：${repo.getClub(match.opponentId).cn}`,opponent:repo.getClub(match.opponentId).cn,competition:match.competition,score:resolved.score,starts:resolved.starts,played:resolved.playerResult?.played,rating:resolved.playerResult?.rating,goals:resolved.playerResult?.goals||0,assists:resolved.playerResult?.assists||0,growth:resolved.playerResult?.growth,growths:[resolved.miniChallenge?.growth].filter(Boolean),important:match.importance!=='普通联赛'&&match.importance!=='普通比赛'});consumeMatch(save);
    if(!hadInjury&&save.status.injury){record(log,'node',{date,title:`比赛伤病：${save.status.injury.name}`});const pause=await pauseWithCategoryEvent(save,repo,'injury','injury');if(pause)return{...pause,interrupted:true,actualEndDate:date}}
  }

  const oldSquad=save.career.squadLevel;updateCareerStage(save,club);if(oldSquad!==save.career.squadLevel){save.career.schedule=null;ensureSchedule(save,repo);record(log,'node',{date,title:`进入${save.career.squadLevel}`})}
  save.finance.marketValue=marketValue(save,club);const completedGoals=settleObjectives(save);for(const goal of completedGoals)record(log,'node',{date,title:`完成阶段目标：${goal.name}`});const traits=evaluateTraits(save);for(const trait of traits)record(log,'node',{date,title:`解锁特质：${trait.name}`});

  if(monthKey(date)!==previousMonth){
    expireOffers(save);const before=save.career.pending.offers.length,offers=generateOffers(save,repo);if(offers.length>before)record(log,'node',{date,title:`收到${offers.length-before}份转会报价`});
    const national=evaluateNationalTeam(save);if(national){record(log,'node',{date,title:'收到国家队征召'});const pause=await pauseWithCategoryEvent(save,repo,'national','nationalCall');if(pause)return{...pause,interrupted:true,actualEndDate:date}}
    const worldItems=simulateWorldMonth(save,repo);for(const item of worldItems.slice(0,2))record(log,'highlight',{date,title:item.title});generateAgentAdvice(save);updateCareerDirector(save,{force:true});generateStateMessages(save);const offerStop=pendingOfferPause(save,offers);if(offerStop)return{...offerStop,interrupted:true,actualEndDate:date};
  }
  const achievements=evaluateAchievements(save,repo.achievements);if(achievements.length)record(log,'node',{date,title:`解锁${achievements.length}项成就`});

  const seasonSettlement=settleSeasonBoundary(save,repo,log,date);if(seasonSettlement)return seasonSettlement;
  assertClockInvariants(save);return{status:'day-complete',reason:'day',actualEndDate:date};
}

export async function advanceCareer(save,repo,type,{signal,onProgress}={}){
  if(!VALID_TARGETS.has(type))throw new Error('未知推进目标');ensureTimeState(save,repo);
  const backup=cloneSave(save),request=createAdvanceRequest(save,repo,type),before=snapshot(save),log=[];save.career.advance.running=true;save.career.advance.activeRequest=request;
  const finishEarly=(status,step,extra={})=>{const result=buildAdvanceResult(save,request,before,log,step);save.career.advance.running=false;save.career.advance.activeRequest=null;save.career.advance.lastSummary=result;return{status,reason:step.reason,summary:result,advanceResult:result,...extra}};
  try{
    if(getSpeed(save).id==='paused')return finishEarly('stopped',{reason:'paused',interrupted:true,actualEndDate:request.startDate});
    if(save.career.pending.event&&!save.career.pending.event.resolved)return finishEarly('paused',{reason:'event',interrupted:true,actualEndDate:request.startDate},{event:save.career.pending.event});
    if(save.career.pending.match&&!save.career.pending.match.resolved)return finishEarly('paused',{reason:'match',interrupted:true,actualEndDate:request.startDate},{match:save.career.pending.match});
    const pendingOffers=pendingOfferPause(save);if(pendingOffers)return finishEarly('paused',{...pendingOffers,interrupted:true,actualEndDate:request.startDate},{offers:pendingOffers.offers,pauseRule:pendingOffers.pauseRule});
    let step={status:'complete',reason:'target',actualEndDate:request.startDate},safety=0,previousDate=request.startDate;
    if(type==='season'&&compareGameDates(ensureGameClock(save).currentDate,ensureGameClock(save).seasonEndDate)>=0){step=settleSeasonBoundary(save,repo,log,request.startDate)}
    while(compareGameDates(ensureGameClock(save).currentDate,request.requestedTargetDate)<0&&safety<800){
      safety++;step=await processGameDay(save,repo,{request,signal,onProgress,log,previousDate});previousDate=step.actualEndDate||ensureGameClock(save).currentDate;
      if(step.interrupted||['stopped','paused','complete'].includes(step.status))break;
      if(type==='nextEvent'&&log.some(item=>item.type==='event'))break;
      if(type==='nextMatch'&&log.some(item=>item.type==='match'))break;
      if(type==='milestone'&&log.some(item=>item.type==='node'))break;
      if(step.status==='season-complete'&&type==='season')break;
      await sleep(speedDelay(save));
    }
    if(safety>=800)throw new Error('时间推进超过安全上限，已停止以保护存档');
    const advanceResult=buildAdvanceResult(save,request,before,log,step);save.career.advance.running=false;save.career.advance.activeRequest=null;save.career.advance.lastSummary=advanceResult;save.career.advance.history.push({...advanceResult,at:Date.now()});save.career.advance.history=save.career.advance.history.slice(-60);
    return{status:step.interrupted?'paused':'complete',reason:step.reason||'target',pauseRule:step.pauseRule||null,interruptionReason:advanceResult.interruptionReason,event:step.event,match:step.match,offers:step.offers,summary:advanceResult,advanceResult,log,objectives:objectiveProgress(save)};
  }catch(error){restoreSave(save,backup);ensureTimeState(save,repo);save.career.advance.running=false;save.career.advance.activeRequest=null;throw error}
}

export const advanceOneWeek=(save,repo,options)=>advanceCareer(save,repo,'week',options);
export const advanceOneMonth=(save,repo,options)=>advanceCareer(save,repo,'month',options);
export const advanceHalfSeason=(save,repo,options)=>advanceCareer(save,repo,'halfSeason',options);
export const advanceToNextEvent=(save,repo,options)=>advanceCareer(save,repo,'nextEvent',options);
export const advanceToNextMatch=(save,repo,options)=>advanceCareer(save,repo,'nextMatch',options);
export const advanceToTransferWindow=(save,repo,options)=>advanceCareer(save,repo,'window',options);
export const advanceToSeasonEnd=(save,repo,options)=>advanceCareer(save,repo,'season',options);
export const advanceToNextMajorMilestone=(save,repo,options)=>advanceCareer(save,repo,'milestone',options);
export function acknowledgeEventDecision(save){consumeResolvedEvent(save);save.career.weekState??=emptyWeekState();save.career.weekState.eventDone=true;setNextEventDate(save)}
export function acknowledgeMatchDecision(save){consumeMatch(save);save.career.weekState??=emptyWeekState();save.career.weekState.matchDone=true}
