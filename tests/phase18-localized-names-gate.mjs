import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 18 gate');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{const[{createDefaultState},{dataRepository}]=await Promise.all([import('./src/core/store.js'),import('./src/services/dataRepository.js')]);const club=dataRepository.clubs.find(item=>item.country==='日本'),real=dataRepository.registry.realRosterForClub(club.id,{limit:30,seasonYear:2045}),roster=dataRepository.rosterForClub(club.id,{limit:18,seasonYear:2045,seed:'phase18-browser'});const state=createDefaultState();state.route='clubs';state.transfer.club=club.id;state.simulation.date='2045-08-08';state.player={name:'未来门禁球员',number:9,club:club.cn,clubId:club.id,country:'日本',position:'ST',age:20,ovr:72,potential:88,fitness:92,fatigue:8,morale:70,coachTrust:62,stats:{speed:72,shooting:74,passing:66,dribbling:70,defending:40,physical:72}};localStorage.setItem('football-career-v20',JSON.stringify(state));return{club:club.cn,real:real.length,names:roster.map(player=>player.name)}});
  assert.equal(result.real,0);assert.equal(new Set(result.names).size,18);assert.ok(result.names.every(name=>/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+$/u.test(name)));assert.equal(result.names.some(name=>/Academy Prospect|Player\s*\d|Youth\s*\d|青年队球员\s*\d/i.test(name)),false);
  await page.reload({waitUntil:'networkidle'});await page.locator('.club-roster-section').waitFor();const text=await page.locator('.club-roster-section').innerText();assert.doesNotMatch(text,/Academy Prospect|Player\s*\d|Youth\s*\d|青年队球员\s*\d/i);
  const realName=await page.evaluate(async()=>{const{dataRepository}=await import('./src/services/dataRepository.js');const real=dataRepository.players.find(player=>player.nationality==='日本'&&player.nameZh&&player.nameLatin&&player.nameZh!==player.nameLatin);const state=JSON.parse(localStorage.getItem('football-career-v20'));state.simulation.date='2026-08-08';state.transfer.club=real.clubId;state.player.clubId=real.clubId;state.player.club=dataRepository.getClub(real.clubId).cn;state.player.position=real.position;localStorage.setItem('football-career-v20',JSON.stringify(state));return{zh:real.nameZh,latin:real.nameLatin}});
  await page.reload({waitUntil:'networkidle'});await page.locator('.club-roster-section').waitFor();const realRosterText=await page.locator('.club-roster-section').innerText();assert.match(realRosterText,new RegExp(realName.zh));assert.doesNotMatch(realRosterText,new RegExp(realName.latin));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
  fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase18-localized-names-390.png'),fullPage:true});
  console.log(JSON.stringify({status:'PASS',viewport:'390x844',club:result.club,generatedNames:result.names.length,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
