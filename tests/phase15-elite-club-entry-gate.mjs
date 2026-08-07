import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';
import { scoutDraft } from '../src/pages/createPlayer.js';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 15 gate');
let previewSeed='';
for(let index=0;index<1000;index++){
  const draft={previewSeed:`phase15-${index}`,name:'',country:'中国',position:'CM',style:'全能中场',secondaryTrait:'稳定发挥',height:178,weight:70};
  if(scoutDraft(draft).potential>=90){previewSeed=draft.previewSeed;break}
}
assert.ok(previewSeed,'a high-potential deterministic seed is required');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));const url=`http://127.0.0.1:${server.address().port}/?no-sw=1`;
  await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(async seed=>{const{createDefaultState}=await import('./src/core/store.js');const state=createDefaultState();state.creation.seed=seed;localStorage.setItem('football-career-v20',JSON.stringify(state))},previewSeed);await page.reload({waitUntil:'networkidle'});
  for(let step=0;step<4;step++)await page.locator('[data-next]').click();
  const cards=await page.locator('[data-entry-route]').evaluateAll(nodes=>nodes.map(node=>({route:node.dataset.entryRoute,text:node.textContent,disabled:node.disabled})));
  const allowed=['DIRECT_CONTRACT','ACADEMY','TRIAL','SCOUT_WATCH','RESERVE_TEAM','LOAN_DEVELOPMENT','REJECTED'];
  assert.ok(cards.length>=3);assert.ok(cards.every(card=>allowed.includes(card.route)));assert.ok(cards.some(card=>card.route!=='REJECTED'&&!card.disabled));
  assert.ok(cards.some(card=>['ACADEMY','TRIAL','SCOUT_WATCH','LOAN_DEVELOPMENT'].includes(card.route)),'high-potential player received no development route');
  assert.ok(cards.every(card=>!card.text.includes('未达门槛')));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
  fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase15-elite-entry-390.png'),fullPage:true});
  console.log(JSON.stringify({status:'PASS',viewport:'390x844',previewSeed,cards:cards.map(({route,disabled})=>({route,disabled})),errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
