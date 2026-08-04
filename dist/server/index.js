import {D1LeaderboardRepository} from './database/d1LeaderboardRepository.js';
import {LeaderboardError,checkpointRun,createRunSession,listLeaderboard,submitRun} from './leaderboard/leaderboardService.js';
import {AuthorityError,checkpoint,finishRun,listWorldLeaderboard,myLeaderboardEntry,nearbyLeaderboard,reportLeaderboardEntry,startRun,submitAction,updateLeaderboardPrivacy,withdrawLeaderboardEntry} from './authority/authorityService.js';

const repository=env=>new D1LeaderboardRepository(env.DB);
async function bodyOf(request){try{return await request.json()}catch{throw new LeaderboardError('请求体不是有效 JSON',400)}}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function failure(error){
  console.error('leaderboard-api',error);
  if(error instanceof LeaderboardError)return json({error:error.message,details:error.details},error.status);
  if(error instanceof AuthorityError)return json({error:error.message,code:error.code,details:error.details},error.status);
  if(String(error?.message||'').includes('D1'))return json({error:'世界榜数据库尚未配置'},503);
  return json({error:'排行榜服务暂时不可用'},500);
}

async function listHandler({request,env}){try{const limit=new URL(request.url).searchParams.get('limit');return json(await listLeaderboard(repository(env),limit))}catch(error){return failure(error)}}
async function submitHandler({request,env}){try{return json(await submitRun(repository(env),await bodyOf(request)),201)}catch(error){return failure(error)}}
async function sessionHandler({request,env}){try{return json(await createRunSession(repository(env),await bodyOf(request)),201)}catch(error){return failure(error)}}
async function checkpointHandler({request,env}){try{return json(await checkpointRun(repository(env),await bodyOf(request)))}catch(error){return failure(error)}}
async function startRunHandler({request,env}){try{return json(await startRun(repository(env),await bodyOf(request)),201)}catch(error){return failure(error)}}
async function actionRunHandler({request,env}){try{return json(await submitAction(repository(env),await bodyOf(request)))}catch(error){return failure(error)}}
async function authorityCheckpointHandler({request,env}){try{return json(await checkpoint(repository(env),await bodyOf(request)))}catch(error){return failure(error)}}
async function finishRunHandler({request,env}){try{return json(await finishRun(repository(env),await bodyOf(request)),201)}catch(error){return failure(error)}}
async function worldListHandler({request,env}){try{const params=Object.fromEntries(new URL(request.url).searchParams);return json(await listWorldLeaderboard(repository(env),params))}catch(error){return failure(error)}}
async function nearbyHandler({request,env}){try{const url=new URL(request.url),payload={runId:url.searchParams.get('runId'),sessionToken:request.headers.get('X-Session-Token')};return json(await nearbyLeaderboard(repository(env),payload,Object.fromEntries(url.searchParams)))}catch(error){return failure(error)}}
async function meHandler({request,env}){try{const url=new URL(request.url);return json(await myLeaderboardEntry(repository(env),{runId:url.searchParams.get('runId'),sessionToken:request.headers.get('X-Session-Token')}))}catch(error){return failure(error)}}
async function withdrawHandler({request,env}){try{return json(await withdrawLeaderboardEntry(repository(env),await bodyOf(request)))}catch(error){return failure(error)}}
async function reportHandler({request,env}){try{return json(await reportLeaderboardEntry(repository(env),await bodyOf(request)),201)}catch(error){return failure(error)}}
async function privacyHandler({request,env}){try{return json(await updateLeaderboardPrivacy(repository(env),await bodyOf(request)))}catch(error){return failure(error)}}
async function publishHandler(){return json({error:'世界榜成绩只能由 /api/runs/finish 完成服务端结算后发布',code:'direct_publish_forbidden'},403)}

const apiRoutes=new Map([
  ['GET /api/leaderboard',worldListHandler],
  ['POST /api/leaderboard',submitHandler],
  ['POST /api/leaderboard/session',sessionHandler],
  ['POST /api/leaderboard/checkpoint',checkpointHandler]
  ,['POST /api/runs/start',startRunHandler]
  ,['POST /api/runs/action',actionRunHandler]
  ,['POST /api/runs/checkpoint',authorityCheckpointHandler]
  ,['POST /api/runs/finish',finishRunHandler]
  ,['GET /api/leaderboard/v2',worldListHandler]
  ,['GET /api/leaderboard/nearby',nearbyHandler]
  ,['GET /api/leaderboard/me',meHandler]
  ,['POST /api/leaderboard/publish',publishHandler]
  ,['POST /api/leaderboard/withdraw',withdrawHandler]
  ,['POST /api/leaderboard/report',reportHandler]
  ,['POST /api/leaderboard/privacy',privacyHandler]
]);

function apiFailure(message,status=404,allow='GET, POST'){
  return new Response(JSON.stringify({error:message}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Allow':allow}});
}

export default{
  async fetch(request,env,ctx){
    const url=new URL(request.url),key=`${request.method.toUpperCase()} ${url.pathname}`;
    const route=apiRoutes.get(key);
    if(route)return route({request,env,waitUntil:ctx?.waitUntil?.bind(ctx)});
    const runMatch=url.pathname.match(/^\/api\/runs\/([a-z0-9-]+)$/i);
    if(runMatch&&request.method==='GET'){
      try{const run=await repository(env).getAuthorityRun(runMatch[1]);if(!run)return json({error:'在线生涯不存在'},404);const token=request.headers.get('X-Session-Token');const {authenticatedRun}=await import('./authority/authorityService.js');const verified=await authenticatedRun(repository(env),{runId:run.id,sessionToken:token});return json({runId:verified.id,sequence:verified.sequence,stateHash:verified.stateHash,state:verified.state,status:verified.status,gameVersion:verified.gameVersion,configVersion:verified.configVersion})}catch(error){return failure(error)}
    }
    if(url.pathname.startsWith('/api/'))return apiFailure('接口不存在或请求方法不受支持',apiRoutes.has(`GET ${url.pathname}`)||apiRoutes.has(`POST ${url.pathname}`)?405:404);
    if(!env?.ASSETS?.fetch)return new Response('静态资源绑定不可用',{status:503});
    const response=await env.ASSETS.fetch(request);
    if(response.status!==404||request.method!=='GET'||!String(request.headers.get('Accept')||'').includes('text/html'))return response;
    const fallback=new URL('/index.html',request.url);
    return env.ASSETS.fetch(new Request(fallback,{headers:request.headers}));
  }
};
