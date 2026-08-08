import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 11 gate');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath}),report=[];

async function createCareer(page){
  await page.evaluate(async()=>{
    const[{createDefaultState},{dataRepository}]=await Promise.all([import('./src/core/store.js'),import('./src/services/dataRepository.js')]);
    const state=createDefaultState(),club=dataRepository.clubs[0];
    state.player={name:'Toast 门禁',number:8,club:club.cn||club.name,clubId:club.id,country:'中国',position:'CM',age:20,ovr:72,potential:86,fitness:92,fatigue:18,morale:66,coachTrust:62,stats:{speed:68,shooting:65,passing:74,dribbling:71,defending:64,physical:67}};
    localStorage.setItem('football-career-v20',JSON.stringify(state));
  });
  await page.reload({waitUntil:'networkidle'});await page.locator('.app-shell').waitFor();
}

try{
  for(const width of[320,390,430]){
    const page=await browser.newPage({viewport:{width,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});await createCareer(page);
    await page.evaluate(()=>{const button=document.querySelector('[data-top-save]');for(let index=0;index<20;index++)button.click()});
    const toast=page.locator('.toast');await toast.waitFor();assert.equal(await toast.count(),1);await page.waitForTimeout(400);assert.equal(await toast.count(),1);
    const geometry=await toast.evaluate(node=>{const box=node.getBoundingClientRect();return{left:box.left,right:box.right,pointerEvents:getComputedStyle(node).pointerEvents}});
    assert.ok(geometry.left>=0&&geometry.right<=width);assert.equal(geometry.pointerEvents,'none');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);
    await page.waitForTimeout(1700);await page.locator('[data-top-save]').click();assert.equal(await toast.count(),1);await page.waitForTimeout(700);assert.equal(await toast.count(),1);
    if(width===390){fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase11-toast-system-390.png'),fullPage:true})}
    assert.deepEqual(errors,[]);report.push({width,rapidClicks:20,maxVisible:1,overflow:false,errors});await page.close();
  }
  console.log(JSON.stringify({status:'PASS',cooldownMs:2000,viewports:report},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
