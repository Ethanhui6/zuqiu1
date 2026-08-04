import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

class MockResponse{
  constructor(body,{status=200}={}){this.body=body;this.status=status;this.ok=status>=200&&status<300}
  clone(){return new MockResponse(this.body,{status:this.status})}
  static error(){return new MockResponse('',{status:0})}
}

function workerRuntime(fetchImpl=async()=>new MockResponse('network')){
  const listeners={},stored=new Map(),deleted=[],calls={claim:0,navigate:0,skipWaiting:0,fetch:[]};
  const key=request=>typeof request==='string'?request:request.url;
  const cache={addAll:async()=>{},put:async(request,response)=>stored.set(key(request),response.clone()),match:async request=>stored.get(key(request))};
  const clients=[{id:'client-1',url:'https://app.test/',navigate:async()=>{calls.navigate++}}];
  const self={location:{origin:'https://app.test'},addEventListener:(type,handler)=>listeners[type]=handler,skipWaiting:async()=>{calls.skipWaiting++},clients:{claim:async()=>{calls.claim++},matchAll:async()=>clients}};
  const caches={open:async()=>cache,keys:async()=>['old-cache','career-__BUILD_ID__'],delete:async name=>{deleted.push(name);return true},match:cache.match};
  const fetch=async request=>{calls.fetch.push(key(request));return fetchImpl(request)};
  vm.runInNewContext(source,{self,caches,fetch,URL,Response:MockResponse});
  async function dispatch(type,event={}){
    let pending,response;
    listeners[type]({...event,waitUntil:value=>pending=value,respondWith:value=>response=value});
    if(pending)await pending;
    return response?await response:undefined;
  }
  return{calls,deleted,stored,dispatch};
}

test('worker waits for explicit update and activation never navigates clients',async()=>{
  const runtime=workerRuntime();
  await runtime.dispatch('install');
  assert.equal(runtime.calls.skipWaiting,0);
  await runtime.dispatch('message',{data:{type:'SKIP_WAITING'}});
  assert.equal(runtime.calls.skipWaiting,1);
  await runtime.dispatch('activate');
  assert.equal(runtime.calls.claim,1);assert.equal(runtime.calls.navigate,0);assert.deepEqual(runtime.deleted,['old-cache']);
  const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const controllerBlock=main.match(/addEventListener\('controllerchange',[\s\S]*?\n    \}\);/)?.[0]||'';
  assert.equal((controllerBlock.match(/location\.reload\(\)/g)||[]).length,1);
});

test('worker serves offline navigation and unhashed static assets but never HTML for APIs',async()=>{
  const offline=workerRuntime(async()=>{throw new Error('offline')});
  offline.stored.set('./index.html',new MockResponse('app shell'));
  offline.stored.set('https://app.test/assets/player.png',new MockResponse('player image'));
  const navigation=await offline.dispatch('fetch',{request:{url:'https://app.test/career',method:'GET',mode:'navigate'}});
  const asset=await offline.dispatch('fetch',{request:{url:'https://app.test/assets/player.png',method:'GET',mode:'no-cors'}});
  const api=await offline.dispatch('fetch',{request:{url:'https://app.test/api/rankings',method:'GET',mode:'cors'}});
  assert.equal(navigation.body,'app shell');assert.equal(asset.body,'player image');assert.equal(api.status,0);
});

test('worker caches only successful same-origin static responses',async()=>{
  const runtime=workerRuntime(async request=>new MockResponse('missing',{status:404}));
  const request={url:'https://app.test/assets/missing.png',method:'GET',mode:'no-cors'};
  const response=await runtime.dispatch('fetch',{request});
  assert.equal(response.status,404);assert.equal(runtime.stored.has(request.url),false);
});
