import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 12 gate');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath}),report=[];
const positions=['GK','CB','LB','CDM','CM','CAM','LW','ST'];

try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const position of positions){
    await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
    const runtime=await page.evaluate(async position=>{
      const[{createDefaultState},{EventEngine},{dataRepository}]=await Promise.all([import('./src/core/store.js'),import('./src/core/eventEngine.js'),import('./src/services/dataRepository.js')]);
      await dataRepository.init();const state=createDefaultState(),club=dataRepository.clubs[0];
      state.player={name:`Phase 12 ${position}`,number:8,club:club.cn||club.name,clubId:club.id,country:'中国',position,age:25,ovr:90,potential:92,fitness:92,fatigue:18,morale:66,coachTrust:62,stats:{speed:75,shooting:75,passing:75,dribbling:75,defending:75,physical:75}};
      const templates=dataRepository.careerEvents.filter(event=>event.positions?.includes(position));
      const engine=new EventEngine(dataRepository.careerEvents),event=engine.schedule(state,{priority:'important',forceTemplate:templates[0]});
      localStorage.setItem('football-career-v20',JSON.stringify(state));return{count:dataRepository.careerEvents.length,templateId:event.templateId,title:event.title};
    },position);
    assert.equal(runtime.count,568);await page.reload({waitUntil:'networkidle'});await page.locator('.app-shell').waitFor();
    await page.locator('.app-button[data-action="event"]').click();const choices=page.locator('[data-choice]');assert.equal(await choices.count(),3);await choices.nth(positions.indexOf(position)%3).click();
    const result=page.locator('[data-result-animation]');await result.waitFor();assert.ok((await result.locator('.card-copy').first().textContent()).trim().length>10);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('football-career-v20')));assert.equal(saved.events.pending.length,0);assert.equal(saved.events.history.length,1);assert.ok(saved.events.history[0].resultText);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);report.push({position,templateId:runtime.templateId,choices:3,persisted:true});
    await page.locator('[data-result-continue]').click();
  }
  assert.deepEqual(errors,[]);fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase12-career-events-390.png'),fullPage:true});
  console.log(JSON.stringify({status:'PASS',runtimeEvents:568,viewports:['390x844'],positions:report,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
