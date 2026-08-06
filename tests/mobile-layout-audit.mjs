import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {createAppServer} from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath}),base=`http://127.0.0.1:${server.address().port}/?no-sw=1`,shots=path.resolve('test-results/mobile');fs.mkdirSync(shots,{recursive:true});
const viewports=[[320,568],[360,800],[375,812],[390,844],[393,852],[428,926],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]],results=[];
try{
  for(const [width,height] of viewports){
    const page=await browser.newPage({viewport:{width,height},hasTouch:width<768}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base,{waitUntil:'networkidle'});
    const geometry=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,app:Boolean(document.querySelector('#app')?.children.length),small:[...document.querySelectorAll('button')].filter(button=>{const r=button.getBoundingClientRect(),s=getComputedStyle(button);return s.visibility!=='hidden'&&s.display!=='none'&&(r.width<44||r.height<44)}).length}));
    assert.equal(geometry.app,true);assert.ok(geometry.scrollWidth<=geometry.width+1,`${width}x${height} horizontal overflow`);assert.equal(geometry.small,0,`${width}x${height} has undersized visible buttons`);assert.deepEqual(errors,[]);
    await page.screenshot({path:path.join(shots,`${width}x${height}.png`),fullPage:true});results.push({width,height});await page.close();
  }

  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('[data-next]').click();
  await page.locator('[data-position]').nth(5).click();await page.locator('[data-next]').click();
  await page.locator('[data-style]').nth(1).click();await page.locator('[data-next]').click();
  assert.ok(await page.locator('.scout-reveal').isVisible());await page.locator('[data-next]').click();
  await page.locator('[data-club]').first().click();
  await page.locator('.app-shell').waitFor();

  for(const route of ['career','training','transfer','clubs','more']){await page.locator(`[data-route="${route}"]`).click();assert.ok(await page.locator(`[data-route="${route}"].active`).isVisible())}
  await page.locator('[data-route="transfer"]').click();assert.equal(await page.locator('.world-map-shell').count(),0);await page.locator('[data-open-clubs]').click();assert.ok(await page.locator('.clubs-page').isVisible());assert.match(await page.locator('.page-title').textContent(),/俱乐部/);
  await page.evaluate(()=>{const save=JSON.parse(localStorage.getItem('football-career-v20'));save.settings.mode='fast';save.schedule=[];save.simulation.date='2026-08-01';save.simulation.processedKeys=[];save.events.pending=[];save.events.history=[{id:'mobile-audit-seed'}];localStorage.setItem('football-career-v20',JSON.stringify(save));});await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-route="training"]').click();assert.equal(await page.locator('[data-training-plan]').count(),0);await page.locator('[data-open-simulation]').click();await page.locator('[data-continue]').click();await page.waitForTimeout(800);await page.locator('[data-training-plan]').first().waitFor();await page.locator('[data-training-plan]').first().click();
  await page.locator('.sheet [data-skip]').click();
  await page.locator('.sheet .result-panel').waitFor();const growth=await page.evaluate(()=>JSON.parse(localStorage.getItem('football-career-v20')).career.growthLog);assert.ok(growth.length>=1);assert.ok(Object.values(growth.at(-1).changes).some(value=>value>0));
  await page.waitForTimeout(2200);assert.equal(await page.locator('#overlay-root .overlay').count(),0);

  await page.locator('[data-route="match"]').click();assert.equal(await page.locator('[data-match-interaction]').count(),5);await page.locator('[data-match-interaction]').first().click();await page.locator('[data-play]').click();await page.locator('.sheet [data-home]').waitFor();
  const played=await page.evaluate(()=>JSON.parse(localStorage.getItem('football-career-v20')).schedule.some(match=>match.status==='played'));assert.equal(played,true);await page.locator('[data-close-sheet]').click();await page.waitForTimeout(200);assert.equal(await page.locator('#overlay-root .overlay').count(),0);
  await page.reload({waitUntil:'networkidle'});assert.ok(await page.locator('.app-shell').isVisible());assert.equal(await page.locator('input[name="name"]').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');assert.deepEqual(errors,[]);await context.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({status:'PASS',engine:'current index.html via system Chromium',viewports:results,flow:['five-step player creation with optional name and generated identity','direct club-card signing','bottom navigation','club directory and transfer separation','key-node training settlement','position-filtered match interactions from the sixteen-option catalog','sheet cleanup','save reload'],screenshots:path.relative(process.cwd(),shots),physicalSafari:false},null,2));
