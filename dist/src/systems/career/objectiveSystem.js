import {ensureRngState,keyedRandom} from '../../services/rng.js';
import {POSITION_CONFIG} from '../../app/config.js';
import {clamp} from '../../utils/format.js';
import {addGameDays,compareGameDates} from '../../utils/gameDate.js';
import {ensureGameClock} from './gameClock.js';

const DEFINITIONS=[
  {id:'starter',name:'争取进入首发',stages:['youth','first'],metric:'starts',target:4,reward:{coachTrust:5,morale:4},desc:'通过训练表现和比赛评分进入稳定首发。'},
  {id:'trust',name:'增加教练信任',stages:['youth','first'],metric:'coachTrust',target:65,reward:{coachTrust:4},desc:'保持职业态度，完成教练要求。'},
  {id:'physical',name:'提高身体能力',stages:['youth'],metric:'attr:phy',target:70,reward:{xp:45,focus:'phy'},desc:'提高对抗与连续比赛能力。'},
  {id:'new-position',name:'尝试新位置',stages:['youth','first'],metric:'secondaryPositions',target:1,reward:{morale:4},desc:'通过专项训练增加战术用途。'},
  {id:'promotion',name:'获得一线队机会',stages:['youth'],metric:'firstTeam',target:1,reward:{coachTrust:7,morale:7},desc:'用青年比赛表现争取提拔。'},
  {id:'goals',name:'完成阶段进球目标',stages:['first'],groups:['attack','creative'],metric:'goals',target:5,reward:{fans:2600,morale:5},desc:'用稳定得分提高球队地位。'},
  {id:'assists',name:'冲击阶段助攻目标',stages:['first'],groups:['midfield','creative','attack'],metric:'assists',target:4,reward:{fans:2200,coachTrust:4},desc:'通过创造机会提升核心地位。'},
  {id:'clean-sheets',name:'打造稳定防线',stages:['first'],groups:['defense','keeper'],metric:'cleanSheets',target:4,reward:{coachTrust:5,morale:4},desc:'用零封和稳定防守赢得认可。'},
  {id:'national',name:'进入国家队视野',stages:['first'],metric:'nationalApps',target:1,reward:{fans:6000,morale:7},desc:'提高能力、声望与关键比赛表现。'},
  {id:'transfer-interest',name:'获得高水平球队关注',stages:['first'],metric:'offers',target:1,reward:{fans:1800},desc:'提高比赛表现和市场关注。'},
  {id:'renewal',name:'完成续约',stages:['first'],metric:'contractYears',target:3,reward:{morale:5},desc:'通过表现争取更稳定的合同。'},
  {id:'rating',name:'保持稳定高评分',stages:['youth','first'],metric:'rating',target:7,reward:{coachTrust:5,fans:1600},desc:'持续交出高质量比赛。'},
  {id:'healthy',name:'保持健康状态',stages:['youth','first'],metric:'fitness',target:75,reward:{morale:3},desc:'控制疲劳和受伤风险，完成阶段安排。'}
];

function stage(save){return save.career.squadLevel==='一线队'?'first':'youth'}
function group(save){return POSITION_CONFIG[save.player.position]?.group||'attack'}
function eligible(save,definition){return definition.stages.includes(stage(save))&&(!definition.groups||definition.groups.includes(group(save)))}
function targetValue(save,def){
  const s=save.career.seasonStats,c=save.career.careerStats;
  if(def.metric==='starts')return s.starts;
  if(def.metric==='coachTrust')return save.status.coachTrust;
  if(def.metric==='secondaryPositions')return save.player.secondaryPositions.length;
  if(def.metric==='firstTeam')return save.career.squadLevel==='一线队'?1:0;
  if(def.metric==='goals')return s.goals;
  if(def.metric==='assists')return s.assists;
  if(def.metric==='cleanSheets')return s.cleanSheets;
  if(def.metric==='nationalApps')return c.nationalApps;
  if(def.metric==='offers')return save.career.offerHistory.filter(x=>x.createdSeason===save.career.season).length+save.career.pending.offers.length;
  if(def.metric==='contractYears')return save.career.contract.years;
  if(def.metric==='rating')return s.rating;
  if(def.metric==='fitness')return save.status.injury?0:save.status.fitness;
  if(def.metric.startsWith('attr:'))return save.player.attrs[def.metric.split(':')[1]]||0;
  return 0;
}
function personalized(def,save){let target=def.target;if(def.id==='goals')target=Math.max(3,Math.round(3+(save.player.ovr-60)*.16));if(def.id==='assists')target=Math.max(3,Math.round(3+(save.player.ovr-60)*.12));if(def.id==='starter')target=save.career.squadLevel==='一线队'?5:3;return{...def,target}}
export function ensureObjectives(save){
  save.career.objectives??={season:save.career.season,cycleId:0,generatedDate:null,expiresDate:null,candidates:[],active:[],completed:[],rewarded:[]};
  for(const key of ['candidates','active','completed','rewarded'])save.career.objectives[key]??=[];return save.career.objectives;
}
export function generateObjectiveCandidates(save,{force=false}={}){
  const state=ensureObjectives(save),clock=ensureGameClock(save),expired=state.expiresDate&&compareGameDates(clock.currentDate,state.expiresDate)>=0;
  if(!force&&!expired&&state.candidates.length===3)return state.candidates;
  const rngState=ensureRngState(save,{seed:`objectives-${clock.seasonId}-${save.career.clubId}`});
  const cycleId=(state.cycleId||0)+1,rng=keyedRandom(rngState.seed,'objectives',clock.seasonId,cycleId,save.career.clubId,save.player.position),pool=rng.shuffle(DEFINITIONS.filter(def=>eligible(save,def)).map(def=>personalized(def,save))),duration=rng.int(28,56);
  state.season=save.career.season;state.cycleId=cycleId;state.generatedDate=clock.currentDate;state.expiresDate=addGameDays(clock.currentDate,duration);state.candidates=pool.slice(0,3).map(def=>({...def,progress:0,completed:false,baseline:targetValue(save,def)}));state.active=[];
  return state.candidates;
}
export function selectObjective(save,id){const state=ensureObjectives(save),candidate=state.candidates.find(x=>x.id===id);if(!candidate)throw new Error('阶段目标不存在');if(state.active.includes(id)){state.active=state.active.filter(x=>x!==id);return state.active}if(state.active.length>=2)throw new Error('最多同时选择两个重点目标');state.active.push(id);return state.active}
export function objectiveProgress(save){const state=ensureObjectives(save);generateObjectiveCandidates(save);return state.candidates.map(def=>{const raw=targetValue(save,def),current=['coachTrust','fitness','firstTeam','secondaryPositions','contractYears','rating'].includes(def.metric)?raw:Math.max(0,raw-Number(def.baseline||0)),ratio=clamp(current/Math.max(.01,def.target),0,1);def.progress=current;def.completed=ratio>=1;return{...def,current,ratio,active:state.active.includes(def.id)}})}
export function settleObjectives(save){const state=ensureObjectives(save),newly=[];for(const goal of objectiveProgress(save)){if(!goal.completed||state.rewarded.includes(`${state.cycleId}:${goal.id}`))continue;state.completed.push({id:goal.id,cycleId:state.cycleId,season:save.career.season,date:ensureGameClock(save).currentDate});state.rewarded.push(`${state.cycleId}:${goal.id}`);newly.push(goal);const reward=goal.reward||{};if(reward.coachTrust)save.status.coachTrust=clamp(save.status.coachTrust+reward.coachTrust,0,100);if(reward.morale)save.status.morale=clamp(save.status.morale+reward.morale,0,100);if(reward.xp&&reward.focus)save.player.xp[reward.focus]=(save.player.xp[reward.focus]||0)+reward.xp;if(reward.fans){save.fans.social+=reward.fans;save.fans.club+=Math.round(reward.fans*.35)}save.career.history.push({type:'objective',year:save.career.year,season:save.career.season,title:`完成阶段目标：${goal.name}`,text:goal.desc})}return newly}
export function activeObjectiveTags(save){return ensureObjectives(save).active}
