import {upcomingFixtures} from '../schedule/scheduleSystem.js';

const TERMINAL_OFFER_STATUS=new Set(['已接受','已拒绝','谈判破裂','已过期','选择留队']);

function activeOffers(save){
  return (save.career?.pending?.offers||[]).filter(offer=>!TERMINAL_OFFER_STATUS.has(offer.status));
}
function unresolvedEvent(save){
  const event=save.career?.pending?.event;
  return Boolean(event&&!event.resolved);
}
function unresolvedMatch(save){
  const match=save.career?.pending?.match;
  return Boolean(match&&!match.resolved);
}
function trainingDue(save){
  return save.career?.weekState?.trainingDone===false;
}
function objectivesDue(save){
  const active=save.career?.objectives?.active||[];
  return Math.max(0,Math.min(2,2-active.length));
}

function nextKnownFixture(save,repo){
  const fixtures=save.career?.schedule?.fixtures||[];
  const existing=fixtures.find(item=>!item.played);
  if(existing)return existing;
  return repo?upcomingFixtures(save,repo,1)[0]||null:null;
}

function unreadMessageCount(save){return(save.career?.messages?.items||[]).filter(item=>!item.read).length}
function requiredUnreadMessage(save){return(save.career?.messages?.items||[]).find(item=>!item.read&&item.type==='必须处理')}

function unseenAchievements(save){
  const unlocked=new Set(save.achievements?.unlocked||[]);
  const notified=new Set(save.achievements?.notified||[]);
  let count=0;for(const id of unlocked)if(!notified.has(id))count++;
  return count;
}

export function getNavigationAlerts(save,repo){
  const currentWeek=Number(save.career?.calendar?.week||1);
  const next=nextKnownFixture(save,repo);
  const dueFixture=Boolean(next&&Number(next.week)<=currentWeek&&!save.career?.weekState?.matchDone);
  const offers=activeOffers(save).length;
  const event=unresolvedEvent(save)?1:0;
  return{
    career:event+objectivesDue(save)+unreadMessageCount(save),
    match:unresolvedMatch(save)||dueFixture?1:0,
    training:trainingDue(save)?1:0,
    transfer:offers,
    more:unseenAchievements(save)
  };
}

export function getRecommendedAction(save,repo){
  const requiredMessage=requiredUnreadMessage(save);
  if(requiredMessage)return{id:'message',route:requiredMessage.action||'career',icon:'●',eyebrow:'必须处理',title:requiredMessage.title,detail:requiredMessage.text,tone:'urgent'};
  if(unresolvedEvent(save))return{id:'event',route:'career',icon:'✦',eyebrow:'优先事项',title:'处理关键职业事件',detail:'这项决定会改变后续剧情与职业状态。',tone:'urgent'};
  if(unresolvedMatch(save))return{id:'match',route:'match',icon:'⚽',eyebrow:'比赛待处理',title:'完成当前比赛',detail:'比赛结果已生成并等待你的关键选择。',tone:'urgent'};
  const offers=activeOffers(save);
  if(offers.length)return{id:'transfer',route:'transfer',icon:'↗',eyebrow:`${offers.length}项待处理`,title:'查看转会与合同报价',detail:'报价不会自动接受，过期前需要由你决定。',tone:'attention'};
  if(trainingDue(save))return{id:'training',route:'training',icon:'⌁',eyebrow:'本周计划',title:'确认训练方向',detail:'先安排本周训练，再继续推进职业时间。',tone:'normal'};
  if(objectivesDue(save)>0)return{id:'objective',route:'career',icon:'◎',eyebrow:'赛季目标',title:'选择阶段重点',detail:'阶段目标会改变训练建议、事件权重和赛季奖励。',tone:'normal'};
  const next=nextKnownFixture(save,repo);
  if(next){const club=repo.getClub(next.opponentId);return{id:'fixture',route:'match',icon:'⚽',eyebrow:'下一场比赛',title:`对阵${club?.cn||'下一位对手'}`,detail:`第${next.week}周 · ${next.competition} · ${next.home?'主场':'客场'}`,tone:'calm'};}
  return{id:'advance',route:'career',icon:'▶',eyebrow:'下一步',title:'推进到下一个职业节点',detail:'普通训练和比赛将按你的游戏节奏自动处理。',tone:'calm'};
}
