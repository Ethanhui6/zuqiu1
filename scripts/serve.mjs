import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {MemoryLeaderboardRepository} from '../server/database/memoryLeaderboardRepository.js';
import {createRunSession,checkpointRun,listLeaderboard,submitRun,LeaderboardError} from '../server/leaderboard/leaderboardService.js';
import {AuthorityError,checkpoint,finishRun,listWorldLeaderboard,startRun,submitAction,updateLeaderboardPrivacy,withdrawLeaderboardEntry} from '../server/authority/authorityService.js';

const PROJECT_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8'};

async function readJson(request){
  const chunks=[];let size=0;
  for await(const chunk of request){size+=chunk.length;if(size>1024*1024)throw new LeaderboardError('请求体过大',413);chunks.push(chunk)}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{throw new LeaderboardError('请求体不是有效 JSON',400)}
}
function sendJson(response,status,data){const body=JSON.stringify(data);response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(body)}
async function api(request,response,url,repository){
  try{
    if(url.pathname==='/api/leaderboard'&&request.method==='GET'){sendJson(response,200,await listWorldLeaderboard(repository,Object.fromEntries(url.searchParams)));return true}
    if(url.pathname==='/api/leaderboard'&&request.method==='POST'){sendJson(response,201,await submitRun(repository,await readJson(request)));return true}
    if(url.pathname==='/api/leaderboard/session'&&request.method==='POST'){sendJson(response,201,await createRunSession(repository,await readJson(request)));return true}
    if(url.pathname==='/api/leaderboard/checkpoint'&&request.method==='POST'){sendJson(response,200,await checkpointRun(repository,await readJson(request)));return true}
    if(url.pathname==='/api/runs/start'&&request.method==='POST'){sendJson(response,201,await startRun(repository,await readJson(request)));return true}
    if(url.pathname==='/api/runs/action'&&request.method==='POST'){sendJson(response,200,await submitAction(repository,await readJson(request)));return true}
    if(url.pathname==='/api/runs/checkpoint'&&request.method==='POST'){sendJson(response,200,await checkpoint(repository,await readJson(request)));return true}
    if(url.pathname==='/api/runs/finish'&&request.method==='POST'){sendJson(response,201,await finishRun(repository,await readJson(request)));return true}
    if(url.pathname==='/api/leaderboard/publish'&&request.method==='POST'){sendJson(response,403,{error:'世界榜成绩只能由服务端完成运行结算后发布',code:'direct_publish_forbidden'});return true}
    if(url.pathname==='/api/leaderboard/privacy'&&request.method==='POST'){sendJson(response,200,await updateLeaderboardPrivacy(repository,await readJson(request)));return true}
    if(url.pathname==='/api/leaderboard/withdraw'&&request.method==='POST'){sendJson(response,200,await withdrawLeaderboardEntry(repository,await readJson(request)));return true}
    return false;
  }catch(error){const known=error instanceof LeaderboardError||error instanceof AuthorityError;sendJson(response,known?error.status:500,{error:known?error.message:'本地排行榜服务异常',code:error.code,details:error.details||[]});return true}
}
export function createAppServer({root=PROJECT_ROOT,repository=new MemoryLeaderboardRepository()}={}){
  const publicRoot=path.resolve(root);
  return http.createServer(async(request,response)=>{
    const url=new URL(request.url||'/',`http://${request.headers.host||'127.0.0.1'}`);
    if(url.pathname.startsWith('/api/')){if(await api(request,response,url,repository))return;sendJson(response,404,{error:'接口不存在'});return}
    if(!['GET','HEAD'].includes(request.method||'')){response.writeHead(405);response.end();return}
    let pathname=decodeURIComponent(url.pathname);if(pathname==='/'||!path.extname(pathname))pathname='/index.html';
    const target=path.resolve(publicRoot,`.${pathname}`);
    if(!target.startsWith(`${publicRoot}${path.sep}`)||/([\\/]|^)legacy([\\/]|$)/i.test(target)){response.writeHead(403);response.end('Forbidden');return}
    try{
      const data=await fs.readFile(target),type=MIME[path.extname(target).toLowerCase()]||'application/octet-stream';
      response.writeHead(200,{'Content-Type':type,'Cache-Control':url.searchParams.has('no-sw')?'no-store':'no-cache','X-Content-Type-Options':'nosniff'});if(request.method==='HEAD')response.end();else response.end(data);
    }catch{response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('Not Found')}
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const index=process.argv.indexOf('--port'),port=index>=0?Number(process.argv[index+1]):Number(process.env.PORT||8080),server=createAppServer();
  server.listen(port,'127.0.0.1',()=>{const address=server.address();console.log(`Local: http://127.0.0.1:${address.port}`)});
}
