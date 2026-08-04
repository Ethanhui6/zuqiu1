import {buildScoreEvidence,stableEvidenceHash} from '../../systems/scoring/scoringSystem.js';
import {hashString} from '../rng.js';

async function request(path,{method='GET',body,timeout=7000}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetch(path,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||`排行榜服务返回 ${response.status}`);
    return payload;
  }finally{clearTimeout(timer)}
}

export function getWorldLeaderboard(options=50){
  const source=typeof options==='number'?{limit:options}:options||{},params=new URLSearchParams();
  params.set('limit',String(Math.max(1,Math.min(100,Number(source.limit)||25))));params.set('page',String(Math.max(1,Number(source.page)||1)));
  for(const key of ['category','position','gameVersion','difficulty'])if(source[key])params.set(key,String(source[key]));
  return request(`/api/leaderboard?${params}`);
}

export function startWorldRun(save,clubName){
  const evidence=buildScoreEvidence(save,clubName);
  return request('/api/leaderboard/session',{method:'POST',body:{playerKey:hashString(save.player.id).toString(36),seedHash:hashString(save.rng?.seed||'').toString(36),evidence,evidenceHash:stableEvidenceHash(evidence)}});
}

export function sendCheckpoint({runId,sequence,reason,evidence}){
  return request('/api/leaderboard/checkpoint',{method:'POST',body:{runId,sequence,reason,evidence,evidenceHash:stableEvidenceHash(evidence)}});
}

export function submitWorldRun({runId,evidence}){
  return request('/api/leaderboard',{method:'POST',body:{runId,evidence,evidenceHash:stableEvidenceHash(evidence)}});
}
