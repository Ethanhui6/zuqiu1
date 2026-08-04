import {DeterministicRng} from '../../services/rng.js';
import {clamp,round} from '../../utils/format.js';
import {performanceFanDelta,applyFanChange} from '../fan/fanSystem.js';
import {applyRelation} from '../relationship/relationshipSystem.js';
import {ensureSchedule,nextFixture,markFixturePlayed} from '../schedule/scheduleSystem.js';
import {assignMiniChallenge,resolveMiniChallenge} from '../challenge/miniChallengeSystem.js';
import {updateFormMomentum} from '../form/formMomentumSystem.js';
import {ensureSquadCompetition} from '../squad/squadCompetitionSystem.js';

const WEATHER=['晴朗','小雨','大雨','低温','炎热','强风'];
const TIMELINE_TYPES=['射门','扑救','抢断','犯规','黄牌','换人','关键传球','视频助理裁判','点球','失误'];
const CHOICES={
 attack:[['尝试个人突破','dri','高风险制造机会'],['快速传给空位队友','pas','团队收益稳定'],['直接远射','sho','可能成为英雄'],['保护球等待支援','phy','降低失误'],['回传控制节奏','pas','保存体能']],
 midfield:[['送出直塞','pas','创造高质量机会'],['持球推进','dri','突破中场防线'],['远射试探','sho','结果波动较大'],['控制节奏','pas','提高球队稳定性'],['战术犯规阻止反击','def','有吃牌风险']],
 defense:[['果断上抢','def','成功可发动反击'],['保持站位','def','降低被突破概率'],['身体对抗','phy','强硬但有犯规风险'],['长传解围','pas','迅速解除危险'],['呼叫队友协防','pas','依赖默契']],
 spectator:[['记录对手防线习惯','pas','提高战术理解'],['主动为队友提供观察信息','def','改善团队关系'],['完整热身保持待命','phy','保护体能和职业态度']],
 keeper:[['迅速出击','phy','缩小射门角度'],['留在门线','pac','依赖反应'],['封锁近角','pas','稳定选择'],['用脚挡出','sho','高难度扑救'],['指挥后卫封堵','def','提高整体防守']]
};
function group(pos){if(pos==='GK')return'keeper';if(['CB','LB','RB','CDM'].includes(pos))return'defense';if(['CM','CAM'].includes(pos))return'midfield';return'attack'}
function tacticImpact(tactic=''){if(/压迫/.test(tactic))return{attack:2.2,defense:1.2,variance:.18};if(/反击/.test(tactic))return{attack:1.4,defense:1.8,variance:.24};if(/控球|渗透/.test(tactic))return{attack:1.8,defense:1.1,variance:.12};if(/传中/.test(tactic))return{attack:1.5,defense:.8,variance:.2};return{attack:1,defense:1,variance:.16}}
function fixtureForCurrentWeek(save,repo){return nextFixture(save,repo,{fromDate:save.career.gameClock?.currentDate});}

export function generateMatch(save,repo,{fixtureId}={}){
  if(save.career.pending.match)return save.career.pending.match;
  const schedule=ensureSchedule(save,repo),fixture=fixtureId?schedule.fixtures.find(f=>f.id===fixtureId&&!f.played):fixtureForCurrentWeek(save,repo);
  if(!fixture)return null;
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const current=repo.getClub(save.career.clubId),opp=repo.getClub(fixture.opponentId);if(!opp)throw new Error('赛程中的对手不存在');
  const weather=rng.pick(WEATHER),youth=save.career.squadLevel!=='一线队',playerActive=save.career.teamRole!=='未进入名单'&&!save.status.injury&&save.status.suspension<=0,competition=ensureSquadCompetition(save,current),rankFactor=(3-competition.rank)*.09,formFactor=Number(save.career.formMomentum?.value||0)*.018;
  const baseChance=clamp((youth?.7:.4)+(save.player.ovr-current.rep)*.018+(save.status.coachTrust-50)*.004+rankFactor+formFactor,0.08,.94),starts=playerActive&&rng.bool(baseChance),substitute=playerActive&&!starts&&rng.bool(clamp(.62+(4-competition.rank)*.05,.42,.82)),minute=starts?1:substitute?rng.int(52,78):null;
  const choicePool=playerActive?(CHOICES[group(save.player.position)]||CHOICES.midfield):CHOICES.spectator,keyChoices=rng.shuffle(choicePool).slice(0,rng.int(2,Math.min(5,choicePool.length))).map((x,i)=>({id:`match-choice-${i}`,text:x[0],focus:x[1],hint:x[2]}));
  const match={id:`M-${fixture.id}-${rng.state}`,fixtureId:fixture.id,date:fixture.date,week:fixture.week,round:fixture.round||1,roundLabel:fixture.roundLabel||`第${fixture.round||1}轮`,competition:fixture.competition,competitionType:fixture.competitionType,opponentId:opp.id,home:fixture.home,weather,importance:fixture.importance,starts,substitute,minute,keyChoices,choice:null,resolved:false,timeline:[],score:null,playerResult:null,presentation:null,generatedRngState:rng.state};
  assignMiniChallenge(save,match);save.career.pending.match=match;save.rng=rng.snapshot();return match;
}
function eventMinute(rng,used){let m,attempt=0;do{m=rng.int(3,90);attempt++}while(used.has(m)&&attempt<100);while(used.has(m)&&m<90)m++;used.add(m);return m}
function timelineText(type,team,opponent){const texts={射门:`${team}完成一次有威胁的射门`,扑救:`门将化解了${opponent}的攻门`,抢断:`${team}在中场完成关键抢断`,犯规:`${team}阻止了一次推进`,黄牌:`裁判向${team}球员出示黄牌`,换人:`${team}作出人员调整`,关键传球:`${team}送出穿透防线的传球`,视频助理裁判:'裁判通过视频回放复核判罚',点球:`${team}获得点球机会`,失误:`${team}后场处理球出现失误`};return texts[type]||team}
function buildTimeline({rng,used,current,opp,scoreA,scoreB,playerGoals,playerAssists,playerName,presentation}){
  const timeline=[],goalSlots=[];for(let i=0;i<scoreA;i++)goalSlots.push({team:current.cn,player:i<playerGoals,assist:i<playerAssists});for(let i=0;i<scoreB;i++)goalSlots.push({team:opp.cn,player:false,assist:false});
  for(const goal of rng.shuffle(goalSlots)){const minute=eventMinute(rng,used);timeline.push({minute,type:'进球',team:goal.team,text:goal.player?`${playerName}为${current.cn}取得进球`:`${goal.team}取得进球`});if(goal.assist&&!goal.player)timeline.push({minute,type:'助攻',team:current.cn,text:`${playerName}送出助攻`})}
  const genericCount=presentation==='instant'?3:presentation==='timeline'?rng.int(6,8):rng.int(8,12);for(let i=0;i<genericCount;i++){const type=rng.pick(TIMELINE_TYPES),team=rng.bool(.52)?current.cn:opp.cn,other=team===current.cn?opp.cn:current.cn;timeline.push({minute:eventMinute(rng,used),type,team,text:timelineText(type,team,other)})}
  if(playerAssists&&!timeline.some(x=>x.type==='助攻'&&x.text.includes(playerName)))for(let i=0;i<playerAssists;i++)timeline.push({minute:eventMinute(rng,used),type:'助攻',team:current.cn,text:`${playerName}送出助攻`});
  return timeline.sort((a,b)=>a.minute-b.minute||a.type.localeCompare(b.type,'zh-CN'));
}

export function resolveMatch(save,repo,choiceId,{presentation='interactive'}={}){
  const match=save.career.pending.match;if(!match||match.resolved)throw new Error('没有待结算比赛');
  const beforeStatus={coachTrust:save.status.coachTrust,morale:save.status.morale,fitness:save.status.fitness,fatigue:save.status.fatigue,form:save.status.form};
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const current=repo.getClub(save.career.clubId),opp=repo.getClub(match.opponentId),choice=match.keyChoices.find(x=>x.id===choiceId)||null,playerActive=save.career.teamRole!=='未进入名单'&&!save.status.injury&&save.status.suspension<=0;match.choice=choice;match.presentation=presentation;
  const homeBonus=match.home?2.6:0,fitness=(save.status.fitness-50)*.04,morale=(save.status.morale-50)*.03,currentTactic=tacticImpact(current.tactic),oppTactic=tacticImpact(opp.tactic);
  const teamPower=current.attack*.45+current.defense*.39+current.rep*.16+homeBonus+currentTactic.attack,oppPower=opp.attack*.45+opp.defense*.39+opp.rep*.16+oppTactic.attack;
  let teamXg=clamp(1.05+(teamPower-oppPower)*.036+rng.next()*(.65+currentTactic.variance),0.15,4.1),oppXg=clamp(.98+(oppPower-teamPower)*.036+rng.next()*(.65+oppTactic.variance),0.15,4.1),contribution=0;
  if(choice&&playerActive){const skill=save.player.attrs[choice.focus]||60,superSub=(save.career.traits?.unlocked||[]).includes('super-sub')&&match.substitute?.08:0,chance=clamp(.34+(skill-55)*.009+fitness*.02+morale*.02-(save.status.fatigue*.002)+superSub,.08,.9);if(rng.bool(chance)){contribution=1;teamXg+=.38}else if(rng.bool(.25)){contribution=-1;oppXg+=.22}}
  const scoreA=Math.min(7,Math.max(0,Math.round(teamXg+(rng.next()-.5)*1.15))),scoreB=Math.min(7,Math.max(0,Math.round(oppXg+(rng.next()-.5)*1.15)));match.score=[scoreA,scoreB];
  const played=match.starts||match.substitute,pos=group(save.player.position);let goals=0,assists=0,saves=0,tackles=0,keyPasses=0,cleanSheets=0;
  if(played){if(pos==='attack'){goals=scoreA>0&&rng.bool(clamp((save.player.attrs.sho-45)/80+teamXg*.08,0,.68))?rng.int(1,Math.min(3,scoreA)):0;assists=scoreA>goals&&rng.bool(clamp((save.player.attrs.pas-45)/100,0,.46))?1:0}else if(pos==='midfield'){assists=scoreA>0&&rng.bool(clamp((save.player.attrs.pas-42)/75,0,.72))?rng.int(1,Math.min(2,scoreA)):0;goals=scoreA>assists&&rng.bool(clamp((save.player.attrs.sho-55)/130,0,.3))?1:0;keyPasses=rng.int(1,5)}else if(pos==='defense'){tackles=rng.int(2,7);goals=scoreA>0&&rng.bool(.05)?1:0}else{saves=rng.int(2,8)}}
  goals=Math.min(goals,scoreA);assists=Math.min(assists,Math.max(0,scoreA));if(played&&scoreB===0&&['defense','keeper'].includes(pos))cleanSheets=1;
  const resultBonus=scoreA>scoreB?.35:scoreA===scoreB?.05:-.28,bigGame=(save.career.traits?.unlocked||[]).includes('big-game')&&match.importance!=='普通联赛'&&match.importance!=='普通比赛',variance=bigGame?.42:.75,bigGameBonus=bigGame?.12:0;let rating=played?6.15+resultBonus+goals*1.15+assists*.75+saves*.08+tackles*.05+keyPasses*.04+cleanSheets*.3+contribution*.35+bigGameBonus+(rng.next()-.5)*variance:6;rating=clamp(round(rating,1),4.2,10);
  const used=new Set();match.timeline=buildTimeline({rng,used,current,opp,scoreA,scoreB,playerGoals:goals,playerAssists:assists,playerName:save.player.name,presentation});
  match.playerResult={played,starts:match.starts,minutes:played?(match.starts?rng.int(75,90):90-match.minute):0,goals,assists,saves,tackles,keyPasses,cleanSheets,rating};match.resolved=true;
  const ss=save.career.seasonStats,cs=save.career.careerStats;if(played){const oldApps=ss.apps;ss.apps++;if(match.starts)ss.starts++;ss.minutes+=match.playerResult.minutes;ss.goals+=goals;ss.assists+=assists;ss.cleanSheets+=cleanSheets;ss.saves+=saves;ss.tackles+=tackles;ss.keyPasses+=keyPasses;ss.rating=round(((ss.rating*oldApps)+rating)/Math.max(1,ss.apps),2);cs.apps++;cs.goals+=goals;cs.assists+=assists;cs.cleanSheets+=cleanSheets;cs.hatTricks=(cs.hatTricks||0)+(goals>=3?1:0);cs.bigGames=(cs.bigGames||0)+(match.importance!=='普通联赛'&&match.importance!=='普通比赛'&&rating>=7?1:0);cs.saves=(cs.saves||0)+saves;cs.tackles=(cs.tackles||0)+tackles;cs.bestRating=Math.max(cs.bestRating||0,rating);const focus=pos==='attack'?['sho','pac','dri']:pos==='midfield'?['pas','dri','phy']:pos==='defense'?['def','phy','pas']:['pac','sho','pas'];for(const key of focus)save.player.xp[key]=(save.player.xp[key]||0)+Math.max(2,(rating-5.5)*4+1.5)}
  save.status.form=clamp(save.status.form+(rating-6.5)*5,0,100);save.status.morale=clamp(save.status.morale+(scoreA>scoreB?4:scoreA<scoreB?-3:1)+(rating-6.5)*2,0,100);save.status.fitness=clamp(save.status.fitness-(played?rng.int(8,17):2),0,100);save.status.fatigue=clamp(save.status.fatigue+(played?rng.int(6,12):1),0,100);save.status.coachTrust=clamp(save.status.coachTrust+(rating-6.4)*3,0,100);applyRelation(save,'coach',{trust:Math.round((rating-6.3)*2),respect:rating>=8?3:0});applyFanChange(save,{...performanceFanDelta({rating,goals,assists,importance:match.importance==='冠军争夺战'?1.7:match.importance==='德比战'?1.35:1,clubRep:current.rep}),reason:`对阵${opp.cn}`});
  const injuryChance=clamp((save.status.fatigue*.003+(100-save.status.fitness)*.002+(save.player.hidden.injuryProne||30)*.0015),0,.38);if(played&&rng.bool(injuryChance)){const severity=round(.12+rng.next()*.45,2);save.status.injury={name:severity>.38?'比赛中肌肉损伤':'轻微碰撞',severity,remainingMatches:severity>.38?rng.int(2,6):1};save.career.history.push({type:'injury',year:save.career.year,title:'比赛伤病',text:save.status.injury.name})}
  if(match.starts&&!save.career.records.firstStart){save.career.records.firstStart={season:save.career.season,week:save.career.calendar?.week||1,opponentId:opp.id};save.career.majorNodes??=[];save.career.majorNodes.push({type:'first-start',season:save.career.season,week:save.career.calendar?.week||1,title:'职业生涯首次首发'})}
  save.career.matchHistory??=[];save.career.matchHistory.push({id:match.id,fixtureId:match.fixtureId,date:match.date,season:save.career.season,week:save.career.calendar?.week||1,clubId:current.id,opponentId:opp.id,competition:match.competition,score:[scoreA,scoreB],rating,played,goals,assists,presentation});save.career.matchHistory=save.career.matchHistory.slice(-800);
  markFixturePlayed(save,match.fixtureId,{score:[scoreA,scoreB],rating,played,goals,assists});
  save.career.eventMemory??={};save.career.eventMemory.recentOpponents??=[];save.career.eventMemory.recentOpponents.push(opp.id);save.career.eventMemory.recentOpponents=save.career.eventMemory.recentOpponents.slice(-20);
  match.coachEvaluation=rating>=8?'决定比赛走势，教练认为你已经具备承担核心责任的能力。':rating>=7?'执行明确，教练认可你的比赛阅读和团队贡献。':rating>=6?'完成了基本职责，但关键处理仍需要更稳定。':'没有达到比赛计划要求，训练和出场顺位会受到压力。';
  match.statusChanges=[
    ['教练信任','coachTrust'],['士气','morale'],['体能','fitness'],['疲劳','fatigue'],['状态','form']
  ].map(([label,key])=>({label,before:Math.round(beforeStatus[key]),after:Math.round(save.status[key]),delta:Math.round(save.status[key]-beforeStatus[key])}));
  if(save.status.injury)match.statusChanges.push({label:'伤病',before:'健康',after:save.status.injury.name,delta:null});
  resolveMiniChallenge(save,match);updateFormMomentum(save,match);save.rng=rng.snapshot();return match;
}
export function consumeMatch(save){if(save.career.pending.match?.resolved)save.career.pending.match=null}
