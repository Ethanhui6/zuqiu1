import {calculateCareerScore,stableEvidenceHash,validateScoreEvidence} from '../../src/systems/scoring/scoringSystem.js';
import {validateCheckpointTransition,validateFinalSubmission} from '../antiCheat/validateSubmission.js';

export class LeaderboardError extends Error{constructor(message,status=400,details=[]){super(message);this.status=status;this.details=details}}
const cleanKey=(value,label)=>{const text=String(value||'').trim();if(!/^[a-z0-9-]{3,80}$/i.test(text))throw new LeaderboardError(`${label}无效`);return text};

export async function createRunSession(repository,payload,{now=Date.now(),id=crypto.randomUUID()}={}){
  const playerKey=cleanKey(payload?.playerKey,'球员标识'),seedHash=cleanKey(payload?.seedHash,'随机种子摘要'),evidence=payload?.evidence;
  const general=validateScoreEvidence(evidence);if(!general.ok)throw new LeaderboardError('新生涯证据无效',400,general.errors);
  if(stableEvidenceHash(evidence)!==String(payload?.evidenceHash||''))throw new LeaderboardError('新生涯证据摘要不匹配');
  const eligible=validateScoreEvidence(evidence,{initial:true}).ok;
  const session={id,playerKey,seedHash,startedAt:now,status:eligible?'tracking':'local-only',eligible,lastSequence:0,lastEvidence:evidence,lastEvidenceHash:stableEvidenceHash(evidence),lastCheckpointAt:now};
  await repository.createSession(session);
  return{runId:id,eligible,status:session.status,scoreVersion:evidence.scoreVersion};
}

export async function checkpointRun(repository,payload,{now=Date.now()}={}){
  const runId=cleanKey(payload?.runId,'运行会话'),session=await repository.getSession(runId);
  if(!session)throw new LeaderboardError('运行会话不存在',404);
  if(!session.eligible)throw new LeaderboardError('此运行会话仅支持本地榜',409);
  if(stableEvidenceHash(payload?.evidence)!==String(payload?.evidenceHash||''))throw new LeaderboardError('检查点证据摘要不匹配');
  const result=validateCheckpointTransition(session.lastEvidence,payload.evidence,{sequence:payload.sequence,lastSequence:session.lastSequence,reason:String(payload.reason||'')});
  if(!result.ok){await repository.rejectSession(runId,result.errors.join('；'),now);throw new LeaderboardError('检查点未通过反作弊验证',422,result.errors)}
  await repository.updateCheckpoint(runId,{sequence:Number(payload.sequence),evidence:payload.evidence,evidenceHash:result.hash,reason:String(payload.reason),at:now});
  return{ok:true,sequence:Number(payload.sequence),evidenceHash:result.hash};
}

export async function submitRun(repository,payload,{now=Date.now(),id=crypto.randomUUID()}={}){
  const runId=cleanKey(payload?.runId,'运行会话'),session=await repository.getSession(runId),validation=validateFinalSubmission(session,payload?.evidence,payload?.evidenceHash);
  if(!validation.ok)throw new LeaderboardError('世界榜提交未通过验证',422,validation.errors);
  const score=calculateCareerScore(payload.evidence),e=payload.evidence;
  const entry={id,runId,playerName:e.player.name,nation:e.player.nation,position:e.player.position,clubName:e.career.clubName,score:score.total,grade:score.grade,seasons:e.career.season,ending:e.career.ending||'',submittedAt:now,verified:true,evidenceHash:validation.hash};
  await repository.upsertEntry(entry);await repository.completeSession(runId,now);
  return{verified:true,score:score.total,grade:score.grade,entry};
}

export async function listLeaderboard(repository,limit=50){return{entries:await repository.listEntries(Math.max(1,Math.min(100,Number(limit)||50)))} }

