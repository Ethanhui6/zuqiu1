import {hashString} from '../rng.js';
import {checkpointAuthoritativeRun,finishAuthoritativeRun,sendAuthoritativeAction,startAuthoritativeRun} from './authoritativeRunApi.js';

const queues=new Map();
const excludedReasons=new Set(['load','ranking-session-started','ranking-sync-status','speed-changed','pace-mode','strategy-training','strategy-match','strategy-career','auto-pause','animation-mode']);
const actionFor=(reason)=>{
  if(reason==='training-selected')return{type:'training',payload:{focus:'technique'}};
  if(reason==='match-resolved')return{type:'match',payload:{mode:'interactive'}};
  if(reason==='event-resolved')return{type:'event',payload:{choice:0}};
  return null;
};

export async function ensureRankingRun(store,repo){
  const save=store.state;if(!save||save.meta?.ranking?.runId)return save?.meta?.ranking||null;
  try{
    const userId=`player-${hashString(save.player.id).toString(36)}`,result=await startAuthoritativeRun(save,repo.getClub(save.career.clubId).cn,userId);
    store.update(state=>{state.meta.ranking={...state.meta.ranking,runId:result.runId,sessionToken:result.sessionToken,serverSeed:result.serverSeed,stateHash:result.stateHash,eligible:true,lastSequence:0,lastSyncAt:Date.now(),status:'tracking',actionTypes:[]}},'ranking-session-started');
    return store.state.meta.ranking;
  }catch(error){save.meta.ranking={...save.meta.ranking,eligible:false,status:'local-only',lastError:error.message};return save.meta.ranking}
}

export function queueRankingCheckpoint(save,reason,repo,persist){
  const ranking=save?.meta?.ranking,action=actionFor(reason);
  if(!ranking?.runId||!ranking.eligible||excludedReasons.has(reason)||!action)return Promise.resolve(null);
  const previous=queues.get(ranking.runId)||Promise.resolve();
  const next=previous.catch(()=>null).then(()=>sendAuthoritativeAction(ranking,{...action,actionId:`${reason}-${Date.now()}-${Number(ranking.lastSequence)+1}`})).then(result=>{
    ranking.lastSequence=result.sequence;ranking.stateHash=result.stateHash;ranking.lastSyncAt=Date.now();ranking.status='tracking';ranking.actionTypes=[...new Set([...(ranking.actionTypes||[]),action.type])];persist?.();return result;
  }).catch(error=>{ranking.status='sync-pending';ranking.lastError=error.message;persist?.();return null});
  queues.set(ranking.runId,next);return next;
}

export async function syncAndSubmitRanking(save,repo,persist){
  const ranking=save?.meta?.ranking;
  if(!ranking?.runId||!ranking.eligible)throw new Error('此存档没有完整的服务器权威运行日志，只能进入本地榜');
  await(queues.get(ranking.runId)||Promise.resolve());
  const missing=['training','match','event'].filter(type=>!(ranking.actionTypes||[]).includes(type));
  if(missing.length)throw new Error(`完成训练、比赛和事件后才能发布世界榜，当前缺少 ${missing.length} 类验证动作`);
  const retire=await sendAuthoritativeAction(ranking,{type:'retire',actionId:`retire-${Date.now()}`,payload:{}});ranking.lastSequence=retire.sequence;ranking.stateHash=retire.stateHash;
  const snapshot=await checkpointAuthoritativeRun(ranking),result=await finishAuthoritativeRun(ranking);
  ranking.status=result.verified?'verified':'review';ranking.lastSyncAt=Date.now();ranking.serverScore=snapshot.score;ranking.serverGrade=snapshot.grade;persist?.();return result;
}
