import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';
import { CURRENT_CLUB_ACTIONS } from '../src/core/clubInteractionEngine.js';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 10 gate');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath}),report=[];

try{
  for(const[viewportIndex,width]of[320,390,430].entries()){
    const page=await browser.newPage({viewport:{width,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
    await page.evaluate(async()=>{
      const[{createDefaultState},{dataRepository}]=await Promise.all([import('./src/core/store.js'),import('./src/services/dataRepository.js')]);
      const state=createDefaultState(),club=dataRepository.clubs[0];
      state.route='clubs';state.transfer.club=club.id;
      state.player={name:'俱乐部互动门禁',number:8,club:club.cn||club.name,clubId:club.id,country:'中国',position:'CM',age:20,ovr:72,potential:86,dynamicPotential:86,fitness:92,fatigue:18,morale:66,coachTrust:62,stats:{speed:68,shooting:65,passing:74,dribbling:71,defending:64,physical:67}};
      localStorage.setItem('football-career-v20',JSON.stringify(state));
    });
    await page.reload({waitUntil:'networkidle'});await page.locator('.clubs-page').waitFor();
    for(let index=0;index<CURRENT_CLUB_ACTIONS.length;index++){
      const action=CURRENT_CLUB_ACTIONS[index],button=page.locator(`[data-club-action="${action}"]`);
      await button.scrollIntoViewIfNeeded();await button.click();
      const interaction=page.locator(`[data-club-interaction="${action}"]`);await interaction.waitFor();
      const choices=page.locator('[data-club-choice]');assert.equal(await choices.count(),3,`${action} must show three choices at ${width}px`);
      await choices.nth((index+viewportIndex)%3).click();
      const result=page.locator(`[data-club-interaction-result="${action}"]`);await result.waitFor();
      const resultState=await result.evaluate(node=>({animation:node.dataset.resultAnimation,animationName:getComputedStyle(node).animationName,changes:node.querySelectorAll('.change-item').length}));
      assert.ok(resultState.animation);assert.notEqual(resultState.animationName,'none');assert.ok(resultState.changes>0);
      await page.waitForTimeout(800);assert.equal(await result.isVisible(),true,`${action} result must wait for acknowledgement`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);
      if(width===390&&index===CURRENT_CLUB_ACTIONS.length-1){fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase10-club-interactions-390.png'),fullPage:true})}
      await page.locator('[data-club-result-continue]').click();await page.locator('.clubs-page').waitFor();
    }
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('football-career-v20')));
    const history=state.clubInteractions.history.slice(0,10);
    assert.equal(history.length,10);assert.equal(new Set(history.map(item=>item.action)).size,10);assert.deepEqual(errors,[]);
    report.push({width,actions:history.length,choicesTested:history.map(item=>item.choiceId),overflow:false,errors});await page.close();
  }
  console.log(JSON.stringify({status:'PASS',viewports:report},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
