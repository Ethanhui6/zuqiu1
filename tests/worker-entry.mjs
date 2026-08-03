import assert from 'node:assert/strict';
import worker from '../server/worker.js';

const requested=[];
const env={ASSETS:{async fetch(request){const url=new URL(request.url);requested.push(url.pathname);return url.pathname==='/index.html'?new Response('<!doctype html><title>绿茵浮沉</title>',{headers:{'Content-Type':'text/html'}}):new Response('missing',{status:404})}}};

const navigation=await worker.fetch(new Request('https://example.test/game/career',{headers:{Accept:'text/html'}}),env,{});
assert.equal(navigation.status,200);
assert.match(await navigation.text(),/绿茵浮沉/);
assert.deepEqual(requested,['/game/career','/index.html']);

const missingApi=await worker.fetch(new Request('https://example.test/api/not-found'),env,{});
assert.equal(missingApi.status,404);
assert.equal((await missingApi.json()).error,'接口不存在或请求方法不受支持');

const directPublish=await worker.fetch(new Request('https://example.test/api/leaderboard/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env,{});
assert.equal(directPublish.status,403);assert.equal((await directPublish.json()).code,'direct_publish_forbidden');

const originalConsoleError=console.error;
console.error=()=>{};
const missingDb=await worker.fetch(new Request('https://example.test/api/leaderboard'),env,{}).finally(()=>{console.error=originalConsoleError});
assert.equal(missingDb.status,503);

console.log(JSON.stringify({status:'PASS',spaFallback:true,apiRouting:true,directPublishRejected:true,missingDatabaseGuard:true},null,2));
