import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {createAppServer} from '../scripts/serve.mjs';
const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath});
try{const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});const result=await page.evaluate(async()=>{const button=document.querySelector('button');if(button){for(let i=0;i<20;i++){button.dispatchEvent(new PointerEvent('pointerenter'));button.dispatchEvent(new PointerEvent('pointerleave'))}await new Promise(r=>setTimeout(r,350))}return{button:Boolean(button),animations:document.getAnimations().length,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}});assert.equal(result.button,true);assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',productionInteractionStress:20,...result},null,2))}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
