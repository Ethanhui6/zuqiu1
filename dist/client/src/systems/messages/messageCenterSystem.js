import {ensureGameClock} from '../career/gameClock.js';

export function ensureMessages(save){save.career.messages??={items:[],seen:[],lastGeneratedDate:null};save.career.messages.items??=[];save.career.messages.seen??=[];return save.career.messages}
export function addMessage(save,{source,type='信息通知',title,text,action=null,uniqueKey=null}){
  const state=ensureMessages(save),clock=ensureGameClock(save),key=uniqueKey||`${clock.currentDate}|${source}|${title}`;
  if(state.items.some(item=>item.key===key))return null;
  const item={id:`msg-${state.items.length+1}-${clock.currentDate}`,key,date:clock.currentDate,source,type,title,text,action,read:false};state.items.unshift(item);state.items=state.items.slice(0,80);return item;
}
export function generateStateMessages(save){
  const state=ensureMessages(save),clock=ensureGameClock(save);if(state.lastGeneratedDate===clock.currentDate)return state.items;
  if(save.status.injury)addMessage(save,{source:'医疗团队',type:'必须处理',title:'康复计划仍在进行',text:`当前伤病：${save.status.injury.name}，预计还需${save.status.injury.remainingMatches||1}场比赛恢复。`,action:'training',uniqueKey:`injury-${clock.currentDate}`});
  if(save.career.agent?.advice)addMessage(save,{source:'经纪人',type:save.career.agent.advice.type,title:save.career.agent.advice.title,text:save.career.agent.advice.text,action:'transfer',uniqueKey:`agent-${save.career.agent.advice.date}-${save.career.agent.advice.title}`});
  if(save.career.squadCompetition?.rank>=3)addMessage(save,{source:'教练组',type:'建议处理',title:'需要提高队内顺位',text:`你目前处于同位置第${save.career.squadCompetition.rank}顺位，训练表现和比赛状态会影响下一次选择。`,action:'training',uniqueKey:`rank-${clock.currentDate}-${save.career.squadCompetition.rank}`});
  state.lastGeneratedDate=clock.currentDate;return state.items;
}
export function unreadMessages(save){return ensureMessages(save).items.filter(item=>!item.read)}
export function markMessageRead(save,id){const item=ensureMessages(save).items.find(message=>message.id===id);if(item)item.read=true;return item}
