import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 17 gate');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
  const roster=await page.evaluate(async()=>{const[{createDefaultState},{dataRepository}]=await Promise.all([import('./src/core/store.js'),import('./src/services/dataRepository.js')]);const club=dataRepository.getClub('ENG1-ARS'),real=dataRepository.registry.realRosterForClub(club.id,{limit:30,seasonYear:2026});const state=createDefaultState();state.route='clubs';state.transfer.club=club.id;state.player={name:'Phase 17 门禁',number:9,club:club.cn,clubId:club.id,country:'英格兰',position:'ST',age:20,ovr:72,potential:88,fitness:92,fatigue:8,morale:70,coachTrust:62,stats:{speed:72,shooting:74,passing:66,dribbling:70,defending:40,physical:72}};localStorage.setItem('football-career-v20',JSON.stringify(state));return real.map(player=>({name:player.name,origin:player.dataOrigin.identity}));});
  assert.ok(roster.length>=11);assert.ok(roster.some(player=>player.origin==='verified-public'));
  await page.reload({waitUntil:'networkidle'});await page.locator('.club-roster-section').waitFor();
  const text=await page.locator('.club-roster-section').innerText();assert.match(text,/Gyökeres|哲凯赖什|Havertz|哈弗茨/);assert.doesNotMatch(text,/Academy Prospect|Player \d|青年队球员/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
  fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase17-real-roster-390.png'),fullPage:true});
  console.log(JSON.stringify({status:'PASS',viewport:'390x844',realPlayers:roster.length,verifiedPlayers:roster.filter(player=>player.origin==='verified-public').length,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
