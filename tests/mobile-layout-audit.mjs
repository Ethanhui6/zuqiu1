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
    const page=await browser.newPage({viewport:{width,height},hasTouch:width<768}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(base,{waitUntil:'networkidle'});await page.locator('.save-select').waitFor();
    const geometry=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,app:Boolean(document.querySelector('#app')?.children.length),small:[...document.querySelectorAll('button')].filter(button=>{const rect=button.getBoundingClientRect(),style=getComputedStyle(button);return style.visibility!=='hidden'&&style.display!=='none'&&(rect.width<44||rect.height<44)}).length}));
    assert.equal(geometry.app,true);assert.ok(geometry.scrollWidth<=geometry.width+1,`${width}x${height} horizontal overflow`);assert.equal(geometry.small,0,`${width}x${height} has undersized visible buttons`);assert.deepEqual(errors,[]);
    await page.screenshot({path:path.join(shots,`${width}x${height}.png`),fullPage:true});results.push({width,height});await page.close();
  }

  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('.save-card--new').click();
  await page.locator('input[name="name"]').fill('验收球员');await page.locator('input[name="birthDate"]').fill('2008-03-18');await page.locator('.setup-actions .button--primary').click();
  await page.locator('select[name="nation"]').waitFor();await page.locator('.setup-actions .button--primary').click();
  await page.locator('.pitch-position[data-position="CM"]').click();await page.locator('.pitch-position[data-position="CM"].is-selected').waitFor();await page.locator('.setup-actions .button--primary').click();
  await page.locator('.selection-card').nth(1).click();await page.locator('.selection-card.is-selected').waitFor();await page.locator('.setup-actions .button--primary').click();
  await page.locator('.talent-card').first().click();await page.locator('.talent-card.is-selected').waitFor();await page.locator('.setup-actions .button--primary').click();
  await page.locator('.club-select-card').first().click();await page.locator('.club-select-card.is-selected').waitFor();await page.locator('.setup-actions .button--primary').click();
  await page.locator('.app-shell').waitFor();
  await page.locator('.v20-choice-card').first().click();
  await page.locator('.animation-skip').waitFor();await page.locator('.animation-skip').click({force:true});
  await page.locator('.sheet-footer .button--primary').click();await page.locator('.sheet-backdrop').waitFor({state:'detached'});
  const openingChoices=page.locator('.v20-choice-card');
  if(await openingChoices.count()){
    await openingChoices.first().click();
    await page.locator('.sheet-footer .button--primary').click();
    await page.locator('.sheet-backdrop').waitFor({state:'detached'});
  }

  for(const route of ['career','match','training','transfer','more']){await page.locator(`.tab-button[data-route="${route}"]`).click();await page.locator(`.tab-button[data-route="${route}"].is-active`).waitFor()}
  await page.locator('.tab-button[data-route="training"]').click();await page.locator('.training-plan-card').nth(1).click();await page.locator('.training-plan-card.is-selected').waitFor();
  await page.locator('.training-quick-actions .button--primary:disabled').waitFor();
  const saved=await page.evaluate(()=>{const id=localStorage.getItem('fc18:current-slot');return JSON.parse(localStorage.getItem(`fc18:save:${id}`))});
  assert.equal(saved.career.weekState.trainingDone,true);assert.ok(saved.career.trainingPlan);assert.equal(await page.locator('#overlay-root .overlay').count(),0);
  await page.reload({waitUntil:'networkidle'});assert.ok(await page.locator('.app-shell').isVisible());assert.equal(await page.locator('input[name="name"]').count(),0);assert.deepEqual(errors,[]);await context.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({status:'PASS',engine:'current index.html via system Chromium',viewports:results,flow:['save selector','six-step player creation','bottom navigation','training settlement','slot save reload'],screenshots:path.relative(process.cwd(),shots),physicalSafari:false},null,2));
