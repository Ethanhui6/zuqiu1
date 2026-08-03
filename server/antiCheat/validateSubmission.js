import {validateScoreEvidence,stableEvidenceHash} from '../shared/scoringSystem.js';

export const ALLOWED_CHECKPOINT_REASONS=new Set([
  'career-advanced','event-resolved','match-resolved','advance-to-match','advance-error','objective-selected',
  'offer-response','interest-submitted','stay-chosen','transfer-state-checked','training-selected','training-strategy',
  'facility-medical','facility-locker','leaderboard-submit'
]);

export function validateCheckpointTransition(previous,current,{sequence,lastSequence,reason}={}){
  const errors=[];
  const base=validateScoreEvidence(current);if(!base.ok)errors.push(...base.errors);
  if(!previous||typeof previous!=='object')errors.push('缺少服务器侧上一检查点');
  if(Number(sequence)!==Number(lastSequence)+1)errors.push('检查点顺序不连续');
  if(!ALLOWED_CHECKPOINT_REASONS.has(reason))errors.push('检查点动作类型不允许');
  if(errors.length||!previous)return{ok:false,errors};
  for(const key of ['name','nation','position'])if(String(previous.player?.[key])!==String(current.player?.[key]))errors.push(`球员${key}在运行中被修改`);
  if(Number(previous.createdAt)!==Number(current.createdAt))errors.push('存档创建时间被修改');
  const monotonic=[
    ['career.season',previous.career.season,current.career.season],['career.seasonsCompleted',previous.career.seasonsCompleted,current.career.seasonsCompleted],['career.absoluteWeek',previous.career.absoluteWeek,current.career.absoluteWeek],
    ...Object.keys(previous.career.stats||{}).map(key=>[`career.stats.${key}`,previous.career.stats[key],current.career.stats?.[key]]),
    ['career.trophies',previous.career.trophies,current.career.trophies],['achievements.unlocked',previous.achievements.unlocked,current.achievements?.unlocked]
  ];
  monotonic.forEach(([label,before,after])=>{if(Number(after)<Number(before))errors.push(`${label}不能倒退`)});
  const weekDelta=Math.max(0,Number(current.career.absoluteWeek)-Number(previous.career.absoluteWeek));
  const seasonDelta=Math.max(0,Number(current.career.season)-Number(previous.career.season));
  const appsDelta=Number(current.career.stats.apps)-Number(previous.career.stats.apps);
  const goalsDelta=Number(current.career.stats.goals)-Number(previous.career.stats.goals);
  const assistsDelta=Number(current.career.stats.assists)-Number(previous.career.stats.assists);
  if(seasonDelta>1)errors.push('单次检查点不能跨越多个赛季');
  if(weekDelta>45)errors.push('单次检查点推进周数异常');
  if(appsDelta>weekDelta*2+2)errors.push('出场增量超过推进周数允许范围');
  if(goalsDelta>appsDelta*3+3||assistsDelta>appsDelta*3+3)errors.push('进球或助攻增量异常');
  if(Number(current.player.ovr)-Number(previous.player.ovr)>Math.max(2,Math.ceil(weekDelta*1.5)+seasonDelta*4))errors.push('综合能力增长异常');
  if(Number(current.career.trophies)-Number(previous.career.trophies)>seasonDelta*6+1)errors.push('奖杯增长异常');
  if(Number(current.achievements.unlocked)-Number(previous.achievements.unlocked)>weekDelta*5+12)errors.push('成就增长异常');
  return{ok:errors.length===0,errors,hash:stableEvidenceHash(current)};
}

export function validateFinalSubmission(session,evidence,evidenceHash){
  const errors=[],check=validateScoreEvidence(evidence);if(!check.ok)errors.push(...check.errors);
  const hash=stableEvidenceHash(evidence);if(hash!==String(evidenceHash||''))errors.push('客户端证据摘要不匹配');
  if(!session)errors.push('运行会话不存在');
  else{
    if(!session.eligible)errors.push('运行会话不具备世界榜资格');
    if(Number(session.lastSequence)<1)errors.push('运行会话没有有效检查点');
    if(String(session.lastEvidenceHash)!==hash)errors.push('最终证据没有通过最后检查点');
    if(session.status==='rejected')errors.push('运行会话已被拒绝');
  }
  return{ok:errors.length===0,errors,hash};
}
