import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 8 gate');
const server=createAppServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
const errors=[];page.on('pageerror',error=>errors.push(error.message));

try{
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
  const start=await page.evaluate(async()=>{
    const{growthFeedback}=await import('./src/components/radar.js');
    const before={speed:62,shooting:60,passing:65,dribbling:64,defending:58,physical:61};
    const fixtures=[['训练成长',{...before,passing:68,dribbling:66},62,64],['比赛成长',{...before,defending:61,physical:63},62,63],['赛季成长',{speed:66,shooting:64,passing:71,dribbling:69,defending:61,physical:65},62,68]];
    document.querySelector('#app').innerHTML=`<main style="padding:12px;display:grid;gap:12px">${fixtures.map(([source,after,beforeOvr,afterOvr])=>growthFeedback({before,after,beforeOvr,afterOvr,potential:91,position:'CM',source})).join('')}</main>`;
    return[...document.querySelectorAll('.radar-current')].map(node=>node.animatedPoints.getItem(0).y);
  });
  await page.waitForTimeout(320);
  const middle=await page.locator('.radar-current').evaluateAll(nodes=>nodes.map(node=>node.animatedPoints.getItem(0).y));
  await page.waitForTimeout(500);
  const result=await page.evaluate(()=>({
    cards:document.querySelectorAll('[data-growth-feedback]').length,
    morphs:document.querySelectorAll('.radar-current animate').length,
    changed:document.querySelectorAll('.growth-attribute.is-changed').length,
    final:[...document.querySelectorAll('.radar-current')].map(node=>node.animatedPoints.getItem(0).y),
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
    labels:[...document.querySelectorAll('.growth-feedback__heading>span')].map(node=>node.textContent)
  }));
  assert.equal(result.cards,3);
  assert.equal(result.morphs,3);
  assert.ok(result.changed>=6);
  assert.ok(start.some((value,index)=>Math.abs(value-middle[index])>.01),'radar did not begin morphing');
  assert.ok(middle.some((value,index)=>Math.abs(value-result.final[index])>.01),'radar did not finish morphing');
  assert.equal(result.overflow,false);
  assert.deepEqual(result.labels,['训练成长','比赛成长','赛季成长']);
  assert.deepEqual(errors,[]);
  fs.mkdirSync(path.resolve('test-results'),{recursive:true});
  await page.screenshot({path:path.resolve('test-results/phase8-development-feedback-390.png'),fullPage:true});
  console.log(JSON.stringify({status:'PASS',viewport:'390x844',...result},null,2));
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
