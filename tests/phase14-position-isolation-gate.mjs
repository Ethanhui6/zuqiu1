import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';
import { playerStylesForPosition, secondaryTraitsForPosition } from '../src/pages/createPlayer.js';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 14 gate');
const positions=['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','LM','RM'];
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath}),report=[];
try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const position of positions){
    await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
    await page.locator('[data-next]').click();await page.locator(`[data-position="${position}"]`).click();await page.locator('[data-next]').click();
    const visibleStyles=await page.locator('[data-style]').evaluateAll(nodes=>nodes.map(node=>node.dataset.style));
    const visibleTraits=await page.locator('select[name="secondaryTrait"] option').allTextContents();
    assert.deepEqual(visibleStyles,playerStylesForPosition(position).map(style=>style.id),`${position} style UI bypassed eligibility`);
    assert.deepEqual(visibleTraits,secondaryTraitsForPosition(position).map(trait=>trait.name),`${position} trait UI bypassed eligibility`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,`${position} overflowed`);
    if(position==='GK'){
      await page.locator('[data-next]').click();
      assert.deepEqual(await page.locator('.radar-label').allTextContents(),['扑救','手控','开球','反应','站位','指挥']);
      fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase14-gk-isolation-390.png'),fullPage:true});
    }
    report.push({position,styles:visibleStyles,traits:visibleTraits});
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status:'PASS',viewport:'390x844',positions:report,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
