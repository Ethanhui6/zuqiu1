import {calculateCareerScore} from '../../src/systems/scoring/scoringSystem.js';
import {applyAuthoritativeAction,authorityEvidence,CONFIG_VERSION,GAME_VERSION,initialAuthorityState} from './authoritativeEngine.js';

export class AuthorityError extends Error{constructor(message,status=400,code='invalid_action',details=[]){super(message);this.status=status;this.code=code;this.details=details}}
const buckets=new Map();
const clean=(value,label,pattern=/^[a-z0-9-]{3,100}$/i)=>{const output=String(value||'').trim();if(!pattern.test(output))throw new AuthorityError(`${label}无效`,400);return output};
const encode=(value)=>new TextEncoder().encode(value);
const hex=(bytes)=>[...bytes].map(value=>value.toString(16).padStart(2,'0')).join('');
export async function secureHash(value){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encode(typeof value==='string'?value:canonical(value)))))}
export function canonical(value){if(Array.isArray(value))return`[${value.map(canonical).join(',')}]`;if(value&&typeof value==='object')return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;return JSON.stringify(value)}
function rateLimit(key,now){const start=now-60000,recent=(buckets.get(key)||[]).filter(at=>at>start);if(recent.length>=90)throw new AuthorityError('请求过于频繁',429,'rate_limited');recent.push(now);buckets.set(key,recent)}
function version(payload){if(payload?.gameVersion!==GAME_VERSION)throw new AuthorityError('游戏版本不匹配',409,'version_mismatch');if(payload?.configVersion!==CONFIG_VERSION)throw new AuthorityError('配置版本不匹配',409,'config_mismatch')}

export async function startRun(repository,payload,{now=Date.now(),runId=crypto.randomUUID(),serverSeed=crypto.randomUUID(),sessionToken=crypto.randomUUID()}={}){
  version(payload);const userId=clean(payload?.userId||`guest-${crypto.randomUUID()}`,'用户标识'),state=initialAuthorityState(payload?.profile,now),stateHash=await secureHash(state);
  const run={id:runId,userId,serverSeed,sessionTokenHash:await secureHash(sessionToken),gameVersion:GAME_VERSION,configVersion:CONFIG_VERSION,difficulty:String(payload?.difficulty||'standard'),initialOvr:state.player.ovr,state,stateHash,sequence:0,status:'active',reviewStatus:'clear',startedAt:now,updatedAt:now};
  await repository.createAuthorityRun(run);
  return{runId,serverSeed,gameVersion:GAME_VERSION,configVersion:CONFIG_VERSION,initialState:state,sessionToken,stateHash,sequence:0};
}

async function reject(repository,runId,error,now,meta={}){try{await repository.addAntiCheatFlag({id:crypto.randomUUID(),runId:runId||'',code:error.code||'rejected',severity:error.status===429?'low':'high',details:{message:error.message,...meta},createdAt:now})}catch{}throw error}

export async function submitAction(repository,payload,{now=Date.now()}={}){
  const runId=clean(payload?.runId,'运行标识');rateLimit(runId,now);let run=await repository.getAuthorityRun(runId);
  if(!run)throw new AuthorityError('在线生涯不存在',404,'run_missing');
  try{
    version(payload);
    if(await secureHash(String(payload?.sessionToken||''))!==run.sessionTokenHash)throw new AuthorityError('会话令牌无效',401,'token_invalid');
    if(Number(payload?.sequence)!==run.sequence+1)throw new AuthorityError('动作顺序不连续',409,'sequence_invalid');
    const nonce=clean(payload?.nonce,'随机数');if(await repository.hasNonce(runId,nonce))throw new AuthorityError('请求已被重放',409,'replay');
    if(String(payload?.stateHash)!==run.stateHash)throw new AuthorityError('客户端状态摘要过期或被篡改',409,'state_hash_mismatch');
    const {state,result}=await applyAuthoritativeAction(run.state,payload.action,{serverSeed:run.serverSeed,sequence:Number(payload.sequence)}),stateHash=await secureHash(state);
    const event={id:crypto.randomUUID(),runId,sequence:Number(payload.sequence),nonce,action:payload.action,result,previousHash:run.stateHash,stateHash,createdAt:now};
    const committed=await repository.commitAuthorityAction(run,{state,stateHash,event,now});if(!committed)throw new AuthorityError('并发动作冲突，请同步后重试',409,'concurrent_write');
    return{runId,sequence:event.sequence,stateHash,state:structuredClone(state),result,serverConfirmed:true};
  }catch(error){return reject(repository,runId,error instanceof AuthorityError?error:new AuthorityError(error.message,422,'impossible_state'),now,{sequence:payload?.sequence,nonce:payload?.nonce})}
}

export async function checkpoint(repository,payload,{now=Date.now()}={}){
  const run=await authenticatedRun(repository,payload);const evidence=authorityEvidence(run),score=calculateCareerScore(evidence),snapshot={id:crypto.randomUUID(),runId:run.id,sequence:run.sequence,stateHash:run.stateHash,score:score.total,grade:score.grade,createdAt:now};await repository.addScoreSnapshot(snapshot);return{runId:run.id,sequence:run.sequence,stateHash:run.stateHash,score:score.total,grade:score.grade,serverConfirmed:true};
}

export async function finishRun(repository,payload,{now=Date.now()}={}){
  const run=await authenticatedRun(repository,payload);
  if(run.status!=='active')throw new AuthorityError('运行已经结算，不能重复发布',409,'duplicate_finish');
  if(!run.state.completed)throw new AuthorityError('必须先提交退役结算动作',409,'run_not_completed');
  if(run.sequence<4||run.state.counters.training<1||run.state.counters.match<1||run.state.counters.event<1)throw new AuthorityError('生涯完成速度异常',422,'speedrun_anomaly');
  const evidence=authorityEvidence(run),score=calculateCareerScore(evidence),suspicious=await repository.hasBlockingFlags(run.id);
  const group=['ST','SS','LW','RW'].includes(evidence.player.position)?'forward':['CM','CAM','CDM'].includes(evidence.player.position)?'midfield':['CB','LB','RB'].includes(evidence.player.position)?'defense':'keeper';
  const categories=['overall','week','month','season','history',group];if(evidence.career.clubs===1&&evidence.career.seasonsCompleted>=10)categories.push('one-club');if(evidence.career.lowLeagueStart)categories.push('low-league');if(evidence.career.stats.nationalApps>=80)categories.push('national');if(evidence.player.age>=35)categories.push('veteran');
  const entry={id:crypto.randomUUID(),runId:run.id,userId:run.userId,playerName:evidence.player.name,publicNickname:run.state.player.publicNickname,nation:evidence.player.nation,position:evidence.player.position,clubName:evidence.career.clubName,score:score.total,grade:score.grade,seasons:evidence.career.season,ending:evidence.career.ending,gameVersion:run.gameVersion,difficulty:run.difficulty,category:'overall',categories,submittedAt:now,verified:!suspicious,reviewStatus:suspicious?'pending':'clear',publicDetails:true,withdrawn:false,evidenceHash:await secureHash(evidence)};
  await repository.finishAuthorityRun(run.id,entry,now);
  if(suspicious)throw new AuthorityError('成绩已进入人工审核，暂不进入正式世界榜',202,'review_pending');
  const rank=await repository.rankFor(entry);return{verified:true,score:score.total,grade:score.grade,rank,entry:{...entry,userId:undefined}};
}

export async function authenticatedRun(repository,payload){
  const runId=clean(payload?.runId,'运行标识'),run=await repository.getAuthorityRun(runId);if(!run)throw new AuthorityError('在线生涯不存在',404,'run_missing');
  if(await secureHash(String(payload?.sessionToken||''))!==run.sessionTokenHash)throw new AuthorityError('会话令牌无效',401,'token_invalid');return run;
}

export async function listWorldLeaderboard(repository,params={}){
  const page=Math.max(1,Math.floor(Number(params.page)||1)),limit=Math.max(1,Math.min(100,Math.floor(Number(params.limit)||25))),offset=(page-1)*limit;
  const entries=await repository.listAuthorityEntries({limit,offset,position:String(params.position||''),gameVersion:String(params.gameVersion||''),difficulty:String(params.difficulty||''),category:String(params.category||'overall')});
  return{page,limit,entries:entries.map(entry=>({...entry,run_id:entry.runId,player_name:entry.playerName,public_nickname:entry.publicNickname,club_name:entry.clubName,game_version:entry.gameVersion,submitted_at:entry.submittedAt}))};
}

export async function nearbyLeaderboard(repository,payload,params={}){
  const run=await authenticatedRun(repository,payload),all=await repository.listAuthorityEntries({limit:10000,category:String(params.category||'overall')}),index=all.findIndex(entry=>entry.runId===run.id);
  if(index<0)return{entries:[],rank:null};return{rank:index+1,entries:all.slice(Math.max(0,index-3),index+4)};
}

export async function myLeaderboardEntry(repository,payload){
  const run=await authenticatedRun(repository,payload),entries=await repository.listAuthorityEntries({limit:10000});return{entry:entries.find(entry=>entry.runId===run.id)||null};
}

export async function withdrawLeaderboardEntry(repository,payload){
  const run=await authenticatedRun(repository,payload);if(!await repository.withdrawEntry(run.id,run.userId))throw new AuthorityError('没有可撤回的公开排名',404,'entry_missing');return{withdrawn:true};
}

export async function reportLeaderboardEntry(repository,payload,{now=Date.now()}={}){
  const targetRunId=clean(payload?.targetRunId,'被举报运行标识'),reason=String(payload?.reason||'异常成绩').slice(0,160);await repository.reportEntry({id:crypto.randomUUID(),targetRunId,reason,createdAt:now});return{reported:true};
}

export async function updateLeaderboardPrivacy(repository,payload){
  const run=await authenticatedRun(repository,payload),publicNickname=String(payload?.publicNickname||'绿茵玩家').trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,24)||'绿茵玩家',publicDetails=payload?.publicDetails!==false;
  if(!await repository.updateEntryPrivacy(run.id,run.userId,{publicNickname,publicDetails}))throw new AuthorityError('尚无可修改的公开排名',404,'entry_missing');return{updated:true,publicNickname,publicDetails};
}
