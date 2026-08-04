import {upcomingFixtures} from '../schedule/scheduleSystem.js';
import {objectiveProgress} from '../career/objectiveSystem.js';
import {unreadMessages} from '../messages/messageCenterSystem.js';

const LEVEL_WEIGHT={info:1,suggestion:2,important:3,urgent:4};
const TERMINAL_OFFERS=new Set(['已接受','已拒绝','谈判破裂','已过期','选择留队']);

export function ensureAttentionState(save){
  save.career.ui??={};
  save.career.ui.attention={read:{},lastViewed:{},...(save.career.ui.attention||{})};
  save.career.ui.attention.read??={};
  save.career.ui.attention.lastViewed??={};
  return save.career.ui.attention;
}

function item(id,route,level,title,detail,icon,action=null){return{id,route,level,title,detail,icon,action:action||route}}
function offers(save){return(save.career.pending?.offers||[]).filter(offer=>!TERMINAL_OFFERS.has(offer.status))}

export function collectAttentionItems(save,repo){
  ensureAttentionState(save);
  const items=[];
  const pendingEvent=save.career.pending?.event;
  if(pendingEvent&&!pendingEvent.resolved)items.push(item(`event:${pendingEvent.id}`,'career','urgent','处理关键职业事件','这项决定会改变后续剧情和职业状态。','✦'));
  const pendingMatch=save.career.pending?.match;
  if(pendingMatch&&!pendingMatch.resolved)items.push(item(`match:${pendingMatch.id}`,'match','urgent','完成当前比赛','比赛正在等待你的关键选择。','⚽'));
  const activeOffers=offers(save);
  if(activeOffers.length)items.push(item(`offers:${activeOffers.map(x=>x.id).join(',')}`,'transfer','important',`${activeOffers.length}份报价等待处理`,'报价不会自动接受，过期前需要由你决定。','↗'));
  if(save.career.weekState?.trainingDone===false){
    const detail=save.status.injury?'当前处于恢复阶段，建议先安排低风险训练。':save.status.fatigue>=65?'疲劳偏高，建议恢复或战术学习。':'本周训练尚未完成，训练结果会影响教练信任和上场机会。';
    items.push(item(`training:${save.career.gameClock?.currentDate||save.career.calendar?.week}`,'training',save.status.fatigue>=65?'important':'suggestion','安排本周训练',detail,'⌁'));
  }
  const activeObjectives=save.career.objectives?.active||[];
  if(activeObjectives.length<2)items.push(item(`objective:${save.career.objectives?.cycleId||0}`,'career','suggestion','选择阶段重点','阶段目标会改变训练建议、事件权重和赛季奖励。','◎','objective'));
  if(save.status.injury)items.push(item(`medical:${save.status.injury.name}:${save.status.injury.remainingMatches}`,'more','important','调整康复方案',`${save.status.injury.name}预计还需${save.status.injury.remainingMatches||1}场恢复。`,'✚','medical'));
  const messages=unreadMessages(save);
  for(const message of messages.slice(0,3))items.push(item(`message:${message.id}`,message.action||'more',message.type==='必须处理'?'important':'info',message.title,message.text,'●',message.action||'messages'));
  const unseen=(save.achievements?.unlocked||[]).filter(id=>!(save.achievements?.notified||[]).includes(id));
  if(unseen.length)items.push(item(`honours:${unseen.join(',')}`,'more','info',`${unseen.length}项新成就待查看`,'荣誉室已经记录新的里程碑。','🏆','honours'));
  const next=upcomingFixtures(save,repo,1)[0];
  if(next){const opponent=repo.getClub(next.opponentId);items.push(item(`fixture:${next.id}`,'match','info',`下一场对阵${opponent?.cn||'对手'}`,`${next.competition} · ${next.home?'主场':'客场'} · ${next.importance}`,'⚽'))}
  return items.sort((a,b)=>(LEVEL_WEIGHT[b.level]||0)-(LEVEL_WEIGHT[a.level]||0));
}

export function primaryAttention(save,repo){return collectAttentionItems(save,repo)[0]||item('advance','career','info','规划下一段职业时间','检查训练、目标和下一场比赛后继续推进。','▶')}

export function navigationAttention(save,repo){
  const counts={career:0,match:0,training:0,transfer:0,more:0};
  for(const entry of collectAttentionItems(save,repo)){
    const route=['world','profile','rankings'].includes(entry.route)?'more':entry.route;
    if(route in counts&&entry.level!=='info')counts[route]++;
  }
  return counts;
}

export function markAttentionRead(save,id){const state=ensureAttentionState(save);state.read[id]=Date.now();return id}
export function markSectionViewed(save,section){const state=ensureAttentionState(save);state.lastViewed[section]=Date.now();return state.lastViewed[section]}
export function currentObjectiveSummary(save){
  const progress=objectiveProgress(save).filter(goal=>goal.active);
  const lead=progress.sort((a,b)=>a.ratio-b.ratio)[0];
  if(!lead)return{title:'尚未选择阶段重点',progress:'0/2',ratio:0,reward:'完成后获得成长经验与教练评价'};
  return{title:lead.name,progress:`${Number(lead.current||0).toFixed(Number.isInteger(lead.current)?0:1)}/${lead.target}`,ratio:lead.ratio,reward:lead.completed?'目标已完成，奖励将在阶段结算时发放':'影响训练建议、事件权重和职业路线'};
}
