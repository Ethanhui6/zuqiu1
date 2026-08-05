import {formatGameDate} from '../../utils/gameDate.js';

const TARGET_LABELS={nextEvent:'下一事件',nextMatch:'下一场比赛',week:'一周',month:'一个月',halfSeason:'半个赛季',window:'转会窗口',season:'赛季结束',milestone:'下一重大节点'};
const REASONS={event:'出现需要你决定的职业事件',match:'重要比赛需要你亲自处理',training:'自动训练已关闭',transfer:'收到需要你处理的转会或合同报价',injury:'出现重大伤病',paused:'推进速度处于暂停状态',user:'玩家停止推进',retirement:'职业生涯进入退役结算'};
const integerFormatter=new Intl.NumberFormat('zh-CN',{maximumFractionDigits:0});
function signed(value){const number=Number(value||0);return`${number>0?'+':''}${integerFormatter.format(number)}`}
function growthXp(value){const number=Number(value||0);return`${number>0?'+':''}${number.toFixed(1)} XP`}
function signedMoney(value){const number=Number(value||0),abs=Math.abs(number);let text;if(abs>=100000000)text=`${(abs/100000000).toFixed(abs>=1000000000?1:2).replace(/\.0+$|0+$/,'').replace(/\.$/,'')}亿`;else if(abs>=10000)text=`${(abs/10000).toFixed(abs>=100000?1:2).replace(/\.0+$|0+$/,'').replace(/\.$/,'')}万`;else text=integerFormatter.format(abs);return`${number>0?'+':number<0?'-':''}¥${text}`}
export function createAdvanceSummaryViewModel(result){
  const full=result.completedFullTarget&&!result.interrupted;
  let title='阶段推进总结';
  if(result.interrupted)title='推进提前暂停';
  else if(result.type==='week')title='本周总结';
  else if(result.type==='month')title='阶段月报';
  else if(result.type==='nextMatch')title='赛前推进总结';
  else if(result.type==='window')title='转会窗口前总结';
  else if(result.type==='season')title='赛季总结';
  else if(result.type==='halfSeason')title='半赛季总结';
  const subtitle=`${formatGameDate(result.startDate)}—${formatGameDate(result.actualEndDate)} · 共${result.elapsedDays}天${result.processedMatches.length?` · ${result.processedMatches.length}场比赛`:''}`;
  const durationLabel=result.elapsedDays>=7?`${result.elapsedDays}天 · 约${Number((result.elapsedDays/7).toFixed(1))}周`:`${result.elapsedDays}天`;
  const completionLabel=full?`已完成${TARGET_LABELS[result.type]||'目标推进'}`:`原计划推进${TARGET_LABELS[result.type]||'目标阶段'}，实际推进${result.elapsedDays}天`;
  const plannedLabel=`原计划：${formatGameDate(result.startDate)}—${formatGameDate(result.plannedEndDate)} · ${result.plannedElapsedDays??''}天`.replace(' · 天','');
  const interruptionLabel=result.interrupted?(result.interruptionReason||REASONS[result.reason]||'遇到关键节点而暂停'):'';
  const delta=result.statDelta||{},metrics=[];
  const entries=[['成长经验',delta.growthXp],['属性突破',delta.breakthroughs?.length?delta.breakthroughs.join('、'):null],['球队比赛',delta.processedMatchCount],['出场',delta.matchesPlayed],['进球',delta.goals],['助攻',delta.assists],['平均评分',delta.averageRating||null],['能力',delta.ovrChange],['教练信任',delta.coachTrustDelta],['粉丝',delta.fansDelta],['身价',delta.marketValueDelta]];
  for(const [label,value] of entries){
    if(value===null||value===undefined)continue;
    if(['球队比赛','出场','进球','助攻'].includes(label)&&Number(value)===0&&!delta.processedMatchCount)continue;
    if(!['球队比赛','出场','平均评分'].includes(label)&&Number(value)===0)continue;
    const display=label==='成长经验'?growthXp(value):label==='身价'?signedMoney(value):['能力','教练信任','粉丝'].includes(label)?signed(value):value;
    metrics.push({label,value:display});
  }
  if(!metrics.length)metrics.push({label:'阶段状态',value:'暂无显著变化'});
  const highlights=(result.importantEvents||[]).slice(0,5).map(item=>typeof item==='string'?item:item.title).filter(Boolean);
  if(!highlights.length&&delta.matchesPlayed===0)highlights.push('本阶段没有正式比赛，训练、恢复和职业状态已按日结算。');
  const headline=highlights[0]||[delta.goals||delta.assists?`贡献${delta.goals||0}球${delta.assists||0}次助攻`:null,delta.ovrChange?`综合能力${signed(delta.ovrChange)}`:null,delta.coachTrustDelta?`教练信任${signed(delta.coachTrustDelta)}`:null].find(Boolean)||completionLabel;
  return{title,subtitle,durationLabel,completionLabel,plannedLabel,interruptionLabel,metrics,highlights,headline};
}
