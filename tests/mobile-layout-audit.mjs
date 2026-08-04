import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {createAppServer} from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath}),base=`http://127.0.0.1:${server.address().port}/?no-sw=1`,shots=path.resolve('test-results/mobile');fs.mkdirSync(shots,{recursive:true});
const viewports=[[320,568],[360,800],[375,812],[390,844],[393,852],[430,932],[768,1024],[1440,900]],results=[];
try{
  for(const [width,height] of viewports){
    const page=await browser.newPage({viewport:{width,height},hasTouch:width<768}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base,{waitUntil:'networkidle'});
    const geometry=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,app:Boolean(document.querySelector('#app')?.children.length),small:[...document.querySelectorAll('button')].filter(button=>{const r=button.getBoundingClientRect(),s=getComputedStyle(button);return s.visibility!=='hidden'&&s.display!=='none'&&(r.width<44||r.height<44)}).length}));
    assert.equal(geometry.app,true);assert.ok(geometry.scrollWidth<=geometry.width+1,`${width}x${height} horizontal overflow`);assert.equal(geometry.small,0,`${width}x${height} has undersized visible buttons`);assert.deepEqual(errors,[]);
    await page.screenshot({path:path.join(shots,`${width}x${height}.png`),fullPage:true});results.push({width,height});await page.close();
  }

  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('input[name="name"]').fill('验收球员');await page.locator('input[name="birth"]').fill('2008-03-18');await page.locator('[data-next]').click();
  await page.locator('[data-position]').nth(5).click();await page.locator('[data-next]').click();
  await page.locator('[data-style]').nth(1).click();await page.locator('[data-next]').click();
  assert.ok(await page.locator('.scout-reveal').isVisible());await page.locator('[data-next]').click();
  await page.locator('[data-club]').first().click();await page.locator('[data-next]').click();await page.locator('[data-next]').click();
  await page.locator('.app-shell').waitFor();

  for(const route of ['career','training','transfer','more']){await page.locator(`[data-route="${route}"]`).click();assert.ok(await page.locator(`[data-route="${route}"].active`).isVisible())}
  await page.locator('[data-route="training"]').click();await page.locator('[data-plan]').nth(1).click();await page.locator('[data-complete]').click();
  await page.locator('.sheet .result-panel').waitFor();const growth=await page.evaluate(()=>JSON.parse(localStorage.getItem('football-career-v20')).career.growthLog);assert.equal(growth.length,1);assert.ok(Object.values(growth[0].changes).some(value=>value>0));
  await page.locator('[data-close-sheet]').click();await page.waitForTimeout(200);assert.equal(await page.locator('#overlay-root .overlay').count(),0);

  await page.locator('[data-top-speed]').click();await page.locator('[data-sim="nextMatch"]').click();await page.waitForTimeout(250);await page.locator('[data-route="match"]').click();await page.locator('[data-play]').click();await page.locator('.sheet [data-home]').waitFor();
  const played=await page.evaluate(()=>JSON.parse(localStorage.getItem('football-career-v20')).schedule.some(match=>match.status==='played'));assert.equal(played,true);await page.locator('[data-close-sheet]').click();await page.waitForTimeout(200);assert.equal(await page.locator('#overlay-root .overlay').count(),0);
  await page.reload({waitUntil:'networkidle'});assert.ok(await page.locator('.app-shell').isVisible());assert.equal(await page.locator('input[name="name"]').count(),0);assert.deepEqual(errors,[]);await context.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({status:'PASS',engine:'current index.html via system Chromium',viewports:results,flow:['six-step player creation','bottom navigation','training growth settlement','match settlement','sheet cleanup','save reload'],screenshots:path.relative(process.cwd(),shots),physicalSafari:false},null,2));
