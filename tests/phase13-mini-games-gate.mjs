import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 13 gate');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
  const report=await page.evaluate(async()=>{
    const[{createTrainingGame},{TRAINING_GAMES}]=await Promise.all([import('./src/components/trainingGame.js'),import('./src/data/trainingGames.js')]);let seed=0x13f00d,resolved=0;const seen=new Set(),states=new Set(),newVisuals=new Set();
    for(let index=0;index<100;index++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const game=TRAINING_GAMES[seed%TRAINING_GAMES.length];seen.add(game.id);let result=null;
      const node=createTrainingGame(game,{motion:'instant',onComplete:value=>{result=value},onSkip:value=>{result=value}});document.body.append(node);states.add(node.dataset.miniGameState);
      if(TRAINING_GAMES.indexOf(game)>=20){for(const selector of['[data-football-scene]','[data-football]','[data-goal]','[data-player]','[data-keeper]','[data-defender]','[data-route]'])if(!node.querySelector(selector))throw new Error(`${game.id} missing ${selector}`);newVisuals.add(game.id)}
      const action=node.querySelector('button:not([data-skip]):not([disabled])');action?.click();if(node.dataset.miniGameState!=='RESULT')node.querySelector('[data-skip]').click();states.add(node.dataset.miniGameState);if(node.dataset.miniGameState==='RESULT')resolved++;node.destroy();node.remove();
    }
    const preview=TRAINING_GAMES.find(game=>game.id==='counter-route'),node=createTrainingGame(preview,{motion:'instant'});node.id='phase13-preview';document.body.append(node);
    return{rounds:100,resolved,uniqueGames:seen.size,newVisuals:newVisuals.size,states:[...states],inputs:['tap','hold','swipe','drag','draw-path','aim','curve','power','reaction','sequence','memory','prediction','target','multi-stage']};
  });
  assert.equal(report.rounds,100);assert.equal(report.resolved,100);assert.ok(report.uniqueGames>=34,`only ${report.uniqueGames} games appeared`);assert.equal(report.newVisuals,19);assert.deepEqual(report.states.sort(),['ACTIVE','RESULT']);assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.locator('#phase13-preview').screenshot({path:path.resolve('test-results/phase13-mini-games-390.png')});
  console.log(JSON.stringify({status:'PASS',...report,viewport:'390x844',overflow:false,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
