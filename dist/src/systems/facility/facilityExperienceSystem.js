import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {applyRelation,relationshipScore} from '../relationship/relationshipSystem.js';
import {totalFans} from '../fan/fanSystem.js';

const MEDICAL_PLANS={
  rest:{id:'rest',name:'完全休息',speed:1,risk:-10,fitness:12,summary:'优先消除疲劳与复发风险，恢复速度稳定。'},
  light:{id:'light',name:'轻量恢复',speed:1,risk:-5,fitness:8,summary:'保持低强度活动，兼顾状态与恢复。'},
  rehab:{id:'rehab',name:'康复训练',speed:2,risk:1,fitness:6,summary:'在医疗团队监督下加快恢复，需要一定体能基础。'},
  early:{id:'early',name:'提前复出',speed:2,risk:12,fitness:-4,summary:'更快回到比赛，但复发风险明显上升。'},
  specialist:{id:'specialist',name:'专家会诊',speed:2,risk:-8,fitness:8,cost:800,summary:'支付费用换取更稳妥的恢复方案。'}
};
const LOCKER_ACTIONS={
  captain:{id:'captain',name:'主动和队长交流',summary:'提高队长信任与熟悉度。',effects:{captain:{trust:5,respect:3,familiarity:4},morale:2}},
  team:{id:'team',name:'参加团队活动',summary:'提升队友熟悉度和更衣室氛围。',effects:{teammates:{trust:3,familiarity:6,conflict:-2},morale:4}},
  youth:{id:'youth',name:'帮助年轻队友',summary:'提高尊重与领导力成长。',effects:{teammates:{respect:5,familiarity:3},leadership:2}},
  rival:{id:'rival',name:'与竞争者一起加练',summary:'可能改善竞争关系，也会增加疲劳。',effects:{teammates:{trust:2,rivalry:-2,familiarity:3},fatigue:5}},
  coach:{id:'coach',name:'私下和教练沟通',summary:'提高教练熟悉度，但近期表现会影响结果。',effects:{coach:{trust:4,familiarity:5},coachTrust:3}},
  quiet:{id:'quiet',name:'保持低调',summary:'降低冲突并稳定士气。',effects:{teammates:{conflict:-4},morale:1}}
};

export function ensureFacilityExperience(save){
  save.career.facilityCenter={
    medicalPlan:'light',medicalHistory:[],lockerHistory:[],analysisViewedAt:null,honoursViewedAt:null,lastLockerWeek:null,
    ...(save.career.facilityCenter||{})
  };
  save.career.facilityCenter.medicalHistory??=[];
  save.career.facilityCenter.lockerHistory??=[];
  return save.career.facilityCenter;
}

export function facilitySummaries(save){
  const state=ensureFacilityExperience(save);
  const unreadHonours=Math.max(0,(save.achievements?.unlocked||[]).length-(save.achievements?.notified||[]).length);
  const latestMatch=(save.career.matchHistory||[]).at(-1);
  const lockerScore=Math.round((relationshipScore(save.relations.teammates)+relationshipScore(save.relations.captain))/2);
  return{
    analysis:{title:'数据分析',status:`${(save.career.matchHistory||[]).length}场比赛样本`,value:`OVR ${save.player.ovr}`,attention:Boolean(latestMatch&&!state.analysisViewedAt)},
    medical:{title:'医疗中心',status:save.status.injury?`${save.status.injury.name} · 还需${save.status.injury.remainingMatches||1}场`:`体能${Math.round(save.status.fitness)} · 疲劳${Math.round(save.status.fatigue)}`,value:MEDICAL_PLANS[state.medicalPlan]?.name||'轻量恢复',attention:Boolean(save.status.injury||save.status.fatigue>=65)},
    locker:{title:'更衣室',status:`氛围 ${lockerScore}`,value:save.career.squadCompetition?.rank?`位置第${save.career.squadCompetition.rank}顺位`:'关系稳定',attention:Boolean((save.career.messages?.items||[]).some(m=>!m.read&&/队友|队长|更衣室/.test(`${m.source}${m.title}`)))},
    honours:{title:'荣誉室',status:`${save.career.careerStats?.titles||0}座奖杯 · ${save.achievements?.unlocked?.length||0}项成就`,value:unreadHonours?`${unreadHonours}项新记录`:'记录已同步',attention:unreadHonours>0}
  };
}

export function buildAnalysisSeries(save){
  const matches=(save.career.matchHistory||[]).slice(-12);
  const history=(save.career.history||[]).slice(-40);
  const fans=(save.fans.history||[]).slice(-12);
  const baseOvr=Math.max(35,save.player.ovr-Math.min(8,Math.floor(history.length/8)));
  const ovr=Array.from({length:Math.max(4,Math.min(12,matches.length||8))},(_,i)=>Math.min(save.player.ovr,baseOvr+Math.round(i*(save.player.ovr-baseOvr)/Math.max(1,(matches.length||8)-1))));
  return{
    rating:matches.map(item=>Number(item.playerResult?.rating||item.rating||0)).filter(Boolean),
    goals:matches.map(item=>Number(item.playerResult?.goals||item.goals||0)),
    assists:matches.map(item=>Number(item.playerResult?.assists||item.assists||0)),
    ovr,
    fans:fans.map(item=>Number(item.total||item.social||0)).filter(Number.isFinite),
    fitness:history.filter(item=>item.type==='training'||item.type==='match').slice(-12).map((_,index)=>clamp(save.status.fitness-(11-index)*1.2,0,100)),
    trust:history.slice(-12).map((_,index)=>clamp(save.status.coachTrust-(11-index)*.8,0,100))
  };
}

export function medicalPlans(save){const state=ensureFacilityExperience(save);return Object.values(MEDICAL_PLANS).map(plan=>({...plan,selected:state.medicalPlan===plan.id,available:!plan.cost||save.finance.cash>=plan.cost}))}
export function chooseMedicalPlan(save,club,planId){
  const plan=MEDICAL_PLANS[planId];if(!plan)throw new Error('未知康复方案');if(plan.cost&&save.finance.cash<plan.cost)throw new Error('现金不足，无法选择专家会诊');
  const state=ensureFacilityExperience(save);const before={fitness:save.status.fitness,fatigue:save.status.fatigue,injury:save.status.injury?structuredClone(save.status.injury):null};
  if(plan.cost)save.finance.cash-=plan.cost;
  state.medicalPlan=plan.id;save.status.fitness=clamp(save.status.fitness+plan.fitness,0,100);save.status.fatigue=clamp(save.status.fatigue-8-Math.abs(plan.risk)/2,0,100);
  if(save.status.injury){save.status.injury.remainingMatches=Math.max(0,Number(save.status.injury.remainingMatches||1)-plan.speed);save.status.injury.recurrenceRisk=clamp(Number(save.status.injury.recurrenceRisk||25)+plan.risk,2,85);if(save.status.injury.remainingMatches<=0)save.status.injury=null}
  else save.player.hidden.injuryProne=clamp(save.player.hidden.injuryProne+Math.round(plan.risk/4),5,95);
  const result={id:`medical-${save.career.gameClock?.currentDate}-${state.medicalHistory.length+1}`,plan:plan.name,summary:plan.summary,before,after:{fitness:save.status.fitness,fatigue:save.status.fatigue,injury:save.status.injury?structuredClone(save.status.injury):null},date:save.career.gameClock?.currentDate};
  state.medicalHistory.unshift(result);state.medicalHistory=state.medicalHistory.slice(0,30);save.career.history.push({type:'medical',year:save.career.year,title:`医疗方案：${plan.name}`,text:plan.summary});return result;
}

export function lockerActions(save){
  const state=ensureFacilityExperience(save),weekKey=`${save.career.gameClock?.seasonId}:${save.career.gameClock?.competitionWeek}`;
  return Object.values(LOCKER_ACTIONS).map(action=>({...action,available:state.lastLockerWeek!==weekKey}));
}
export function resolveLockerAction(save,actionId){
  const action=LOCKER_ACTIONS[actionId];if(!action)throw new Error('未知更衣室行动');const state=ensureFacilityExperience(save),weekKey=`${save.career.gameClock?.seasonId}:${save.career.gameClock?.competitionWeek}`;if(state.lastLockerWeek===weekKey)throw new Error('本周已经完成一次更衣室互动');
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const success=rng.bool(.72+(save.status.morale-50)/250);
  const effects=structuredClone(action.effects);
  if(!success){for(const rel of Object.values(effects))if(rel&&typeof rel==='object')for(const key of Object.keys(rel))rel[key]=Math.round(rel[key]*.35)}
  for(const [key,value] of Object.entries(effects)){
    if(['captain','teammates','coach'].includes(key))applyRelation(save,key,value);
    else if(key==='morale')save.status.morale=clamp(save.status.morale+value,0,100);
    else if(key==='fatigue')save.status.fatigue=clamp(save.status.fatigue+value,0,100);
    else if(key==='coachTrust')save.status.coachTrust=clamp(save.status.coachTrust+value,0,100);
    else if(key==='leadership')save.player.hidden.leadership=clamp(save.player.hidden.leadership+value,0,100);
  }
  const result={id:`locker-${weekKey}-${actionId}`,action:action.name,success,date:save.career.gameClock?.currentDate,summary:success?action.summary:'互动效果有限，但没有造成严重负面影响。'};
  state.lastLockerWeek=weekKey;state.lockerHistory.unshift(result);state.lockerHistory=state.lockerHistory.slice(0,30);save.rng=rng.snapshot();save.career.history.push({type:'locker',year:save.career.year,title:action.name,text:result.summary});return result;
}

export function markAnalysisViewed(save){ensureFacilityExperience(save).analysisViewedAt=Date.now()}
export function markHonoursViewed(save){const state=ensureFacilityExperience(save);state.honoursViewedAt=Date.now();save.achievements.notified=[...(save.achievements.unlocked||[])];return state.honoursViewedAt}
export function facilitySnapshot(save){return{fans:totalFans(save),coachTrust:save.status.coachTrust,fitness:save.status.fitness,fatigue:save.status.fatigue,lockerScore:Math.round((relationshipScore(save.relations.teammates)+relationshipScore(save.relations.captain))/2)}}
