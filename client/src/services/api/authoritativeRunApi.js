import {APP_VERSION} from '../../app/config.js';

export const AUTHORITY_CONFIG_VERSION='authority-1';

async function request(path,{method='GET',body,headers={},timeout=9000}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetch(path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(payload.error||`在线验证服务返回 ${response.status}`);error.code=payload.code;error.status=response.status;throw error}
    return payload;
  }finally{clearTimeout(timer)}
}

export function startAuthoritativeRun(save,clubName,userId){
  return request('/api/runs/start',{method:'POST',body:{userId,gameVersion:APP_VERSION,configVersion:AUTHORITY_CONFIG_VERSION,difficulty:save.settings?.pace?.mode||'standard',profile:{name:save.player.name,publicNickname:save.player.displayName||'绿茵玩家',nation:save.player.nation,position:save.player.position,ovr:save.player.ovr,potential:save.player.potential,clubName,lowLeagueStart:Boolean(save.meta?.lowLeagueStart)}}});
}

export function sendAuthoritativeAction(ranking,action){
  return request('/api/runs/action',{method:'POST',body:{runId:ranking.runId,sessionToken:ranking.sessionToken,sequence:Number(ranking.lastSequence)+1,nonce:crypto.randomUUID(),stateHash:ranking.stateHash,gameVersion:APP_VERSION,configVersion:AUTHORITY_CONFIG_VERSION,action:{...action,actionId:action.actionId||crypto.randomUUID()}}});
}

export function checkpointAuthoritativeRun(ranking){return request('/api/runs/checkpoint',{method:'POST',body:{runId:ranking.runId,sessionToken:ranking.sessionToken}})}
export function finishAuthoritativeRun(ranking){return request('/api/runs/finish',{method:'POST',body:{runId:ranking.runId,sessionToken:ranking.sessionToken}})}
export function getAuthoritativeRun(ranking){return request(`/api/runs/${encodeURIComponent(ranking.runId)}`,{headers:{'X-Session-Token':ranking.sessionToken}})}
export function withdrawWorldEntry(ranking){return request('/api/leaderboard/withdraw',{method:'POST',body:{runId:ranking.runId,sessionToken:ranking.sessionToken}})}
export function reportWorldEntry(targetRunId,reason){return request('/api/leaderboard/report',{method:'POST',body:{targetRunId,reason}})}
export function updateWorldPrivacy(ranking,{publicNickname,publicDetails}){return request('/api/leaderboard/privacy',{method:'POST',body:{runId:ranking.runId,sessionToken:ranking.sessionToken,publicNickname,publicDetails}})}
