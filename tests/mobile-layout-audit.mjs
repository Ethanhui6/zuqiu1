import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {createAppServer} from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath});const results=[],shots=path.resolve('test-results/mobile');fs.mkdirSync(shots,{recursive:true});
try{
  for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[1440,900]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:width<768});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
    const geometry=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,app:Boolean(document.querySelector('#app')?.children.length),buttons:[...document.querySelectorAll('button')].every(x=>x.getBoundingClientRect().height>=44)}));
    assert.equal(geometry.app,true);assert.ok(geometry.scrollWidth<=geometry.width+1);assert.equal(geometry.buttons,true);assert.deepEqual(errors,[]);
    await page.screenshot({path:path.join(shots,`${width}x${height}.png`),fullPage:true});results.push({width,height});await page.close();
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({status:'PASS',engine:'current index.html via system Chromium',viewports:results,physicalSafari:false},null,2));
