import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {createAppServer} from '../scripts/serve.mjs';
const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath});
try{for(const width of [320,390,430]){const page=await browser.newPage({viewport:{width,height:800},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});const blockers=await page.evaluate(()=>[...(document.querySelector('#overlay-root')?.children||[])].filter(x=>getComputedStyle(x).pointerEvents!=='none').length);assert.equal(blockers,0);assert.deepEqual(errors,[]);await page.close()}}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({status:'PASS',interactiveBlockers:0},null,2));
