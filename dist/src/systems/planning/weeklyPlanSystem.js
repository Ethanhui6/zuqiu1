import {clamp} from '../../utils/format.js';
import {ensureGameClock} from '../career/gameClock.js';

export const WEEKLY_ACTIONS={
  teamTraining:{id:'teamTraining',name:'团队训练',desc:'提高战术理解和教练评价。',trainingPlan:'tactics'},
  personalTraining:{id:'personalTraining',name:'个人训练',desc:'提高主要能力经验，但增加疲劳。',trainingPlan:'personal'},
  recovery:{id:'recovery',name:'恢复',desc:'恢复体能并降低疲劳。',trainingPlan:'recovery'},
  tactics:{id:'tactics',name:'战术学习',desc:'提高传球、防守理解和战术适配。',trainingPlan:'tactics'},
  weakFoot:{id:'weakFoot',name:'弱势脚',desc:'提高射门与传球经验。',trainingPlan:'weakFoot'},
  newPosition:{id:'newPosition',name:'新位置',desc:'积累第二位置熟练度。',trainingPlan:'newPosition'},
  teammate:{id:'teammate',name:'队友互动',desc:'改善熟悉度、信任和士气。',trainingPlan:'tactics'},
  coach:{id:'coach',name:'教练沟通',desc:'根据近期表现争取信任。',trainingPlan:'tactics'},
  media:{id:'media',name:'媒体活动',desc:'增加关注与商业价值，但略增疲劳。',trainingPlan:'tactics'},
  commercial:{id:'commercial',name:'商业活动',desc:'增加收入和粉丝，但占用恢复时间。',trainingPlan:'recovery'},
  video:{id:'video',name:'观看比赛录像',desc:'提高传球、防守和比赛阅读经验。',trainingPlan:'tactics'}
};

export const WEEKLY_PLAN_PRESETS={
  balanced:{id:'balanced',name:'均衡周',actions:['teamTraining','personalTraining','recovery'],trainingPlan:'tactics'},
  growth:{id:'growth',name:'成长周',actions:['personalTraining','personalTraining','video'],trainingPlan:'personal'},
  recovery:{id:'recovery',name:'恢复周',actions:['recovery','recovery','tactics'],trainingPlan:'recovery'},
  compete:{id:'compete',name:'竞争周',actions:['teamTraining','coach','video'],trainingPlan:'physical'},
  social:{id:'social',name:'关系周',actions:['teammate','coach','media'],trainingPlan:'tactics'},
  versatile:{id:'versatile',name:'多面手周',actions:['newPosition','weakFoot','tactics'],trainingPlan:'newPosition'}
};

function weekKey(save){const clock=ensureGameClock(save);return`${clock.seasonId}-W${clock.competitionWeek}`}
function normalizeActions(actions=[]){return actions.filter(id=>WEEKLY_ACTIONS[id]).slice(0,3)}
export function ensureWeeklyPlan(save){
  save.career.weeklyPlan??={selected:'balanced',customActions:[],appliedWeeks:[],history:[]};
  const state=save.career.weeklyPlan;
  if(state.selected!=='custom'&&!WEEKLY_PLAN_PRESETS[state.selected])state.selected='balanced';
  state.customActions=normalizeActions(state.customActions);state.appliedWeeks??=[];state.history??=[];return state;
}
export function currentWeeklyPlan(save){
  const state=ensureWeeklyPlan(save);
  if(state.selected==='custom'&&state.customActions.length===3){
    const trainingPlan=state.customActions.map(id=>WEEKLY_ACTIONS[id].trainingPlan).find(id=>id==='recovery'&&save.status.fitness<65)||WEEKLY_ACTIONS[state.customActions[0]]?.trainingPlan||'tactics';
    return{id:'custom',name:'自定义周',actions:[...state.customActions],trainingPlan};
  }
  return WEEKLY_PLAN_PRESETS[state.selected]||WEEKLY_PLAN_PRESETS.balanced;
}
export function weeklyActionNames(actions=[]){return actions.map(id=>WEEKLY_ACTIONS[id]?.name||id)}
export function selectWeeklyPlan(save,id){if(!WEEKLY_PLAN_PRESETS[id])throw new Error('每周计划不存在');const state=ensureWeeklyPlan(save);state.selected=id;return currentWeeklyPlan(save)}
export function selectWeeklyAction(save,id){
  if(!WEEKLY_ACTIONS[id])throw new Error('每周行动不存在');const state=ensureWeeklyPlan(save);
  if(state.customActions.length>=3)throw new Error('每周最多分配3点行动');state.customActions.push(id);state.selected='custom';return currentWeeklyPlan(save);
}
export function removeWeeklyAction(save,index){const state=ensureWeeklyPlan(save);if(index<0||index>=state.customActions.length)return state;state.customActions.splice(index,1);state.selected='custom';return state}
export function clearWeeklyActions(save){const state=ensureWeeklyPlan(save);state.customActions=[];state.selected='custom';return state}

function applyAction(save,id){
  if(id==='recovery'){save.status.fitness=clamp(save.status.fitness+3,0,100);save.status.fatigue=clamp(save.status.fatigue-5,0,100)}
  if(id==='teamTraining'){save.status.coachTrust=clamp(save.status.coachTrust+1,0,100);save.player.xp.pas=(save.player.xp.pas||0)+3;save.player.xp.def=(save.player.xp.def||0)+3;save.status.fatigue=clamp(save.status.fatigue+2,0,100)}
  if(id==='personalTraining'){const focus=save.player.position==='GK'?'def':save.player.position.includes('F')||save.player.position.includes('W')?'sho':'pas';save.player.xp[focus]=(save.player.xp[focus]||0)+8;save.status.fatigue=clamp(save.status.fatigue+4,0,100)}
  if(id==='coach'){const rating=Number(save.career.seasonStats.rating||0),gain=rating>=7?2:rating>=6.5?1.5:1;save.status.coachTrust=clamp(save.status.coachTrust+gain,0,100)}
  if(id==='teammate'){save.relations.teammates.trust=clamp(save.relations.teammates.trust+2,0,100);save.relations.teammates.familiarity=clamp((save.relations.teammates.familiarity||0)+2,0,100);save.status.morale=clamp(save.status.morale+1,0,100)}
  if(id==='media'){save.fans.social+=320;save.fans.mediaHeat=clamp(save.fans.mediaHeat+1,0,100);save.status.fatigue=clamp(save.status.fatigue+1,0,100)}
  if(id==='commercial'){save.finance.cash+=Math.max(300,Math.round(save.finance.weeklyWage*.08));save.fans.social+=180;save.status.fatigue=clamp(save.status.fatigue+2,0,100)}
  if(id==='video'){save.player.xp.pas=(save.player.xp.pas||0)+5;save.player.xp.def=(save.player.xp.def||0)+4}
  if(id==='tactics'){save.player.xp.pas=(save.player.xp.pas||0)+4;save.player.xp.def=(save.player.xp.def||0)+4;save.status.coachTrust=clamp(save.status.coachTrust+.5,0,100)}
  if(id==='weakFoot'){save.player.xp.sho=(save.player.xp.sho||0)+5;save.player.xp.pas=(save.player.xp.pas||0)+5}
  if(id==='newPosition'){save.player.xp.dri=(save.player.xp.dri||0)+5;save.player.xp.pas=(save.player.xp.pas||0)+3;save.career.positionTrainingProgress=(save.career.positionTrainingProgress||0)+1}
}

export function applyWeeklyPlan(save){
  const state=ensureWeeklyPlan(save),key=weekKey(save);if(state.appliedWeeks.includes(key))return null;
  let plan=currentWeeklyPlan(save);
  if(plan.id==='custom'&&plan.actions.length!==3){plan=WEEKLY_PLAN_PRESETS.balanced;state.selected='balanced'}
  save.career.trainingPlan=plan.trainingPlan;
  for(const action of plan.actions)applyAction(save,action);
  state.appliedWeeks.push(key);state.appliedWeeks=state.appliedWeeks.slice(-70);state.history.push({week:key,plan:plan.id,actions:[...plan.actions]});state.history=state.history.slice(-70);return{...plan,actionNames:weeklyActionNames(plan.actions)};
}
