import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 16 gate');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
  const country=page.locator('select[name="country"]');
  await country.selectOption({label:'日本'});const japaneseName=await page.locator('.identity-preview strong').textContent();
  await page.locator('select[name="country"]').selectOption({label:'英格兰'});const englishName=await page.locator('.identity-preview strong').textContent();
  assert.notEqual(japaneseName,englishName);assert.match(englishName,/^[A-Za-z '-]+$/);
  for(let step=0;step<4;step++)await page.locator('[data-next]').click();
  const cards=await page.locator('[data-club]').evaluateAll(nodes=>nodes.map(node=>node.textContent));
  assert.ok(cards.length>=3);assert.ok(cards.every(text=>text.includes('英格兰')));assert.ok(cards.every(text=>!text.includes('中国足球')));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
  fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase16-origin-sync-390.png'),fullPage:true});
  console.log(JSON.stringify({status:'PASS',viewport:'390x844',japaneseName,englishName,offers:cards.length,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
