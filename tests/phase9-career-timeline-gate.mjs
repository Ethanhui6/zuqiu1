import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath=['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath,'Chrome or Edge is required for the Phase 9 gate');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath}),report=[];
const crestPaths=['usa/usa1-sea.svg','usa/usa1-por.svg','usa/usa1-nyr.svg','usa/usa1-nyc.svg','usa/usa1-mia.svg','usa/usa1-lag.svg','usa/usa1-lafc.svg','usa/usa1-clb.svg','usa/usa1-cin.svg','usa/usa1-atl.svg'].map(value=>`./assets/clubs/${value}`);

try{
  for(const width of[320,390,430]){
    const page=await browser.newPage({viewport:{width,height:844},hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
    await page.locator('.wizard-shell').waitFor();
    await page.evaluate(async crestPaths=>{
      const{seasonHistory}=await import('./src/pages/career.js');
      const seasons=Array.from({length:10},(_,index)=>({id:`season-${index}`,year:`${2026+index}/${String(27+index).padStart(2,'0')}`,club:`Club ${index+1}`,clubId:`club-${index+1}`,crestPath:crestPaths[index],age:16+index,position:index===5?'RW':'CM',startOvr:64+index,endOvr:66+index,appearances:22+index,goals:5+index,assists:7+index,rating:7.1+index*.05,trophies:index%3===0?['League Champion']:[],personalAwards:index===1?['Young Player of the Year']:[],highlights:[index===4?'转会至 Club 5':index===5?'首次代表国家队出场':index===6?'脚踝伤病':`第${index+1}赛季节点`],injuries:[],transfer:index===4?{club:'Club 5'}:null}));
      const state={career:{history:[],honors:{seasons:seasons.reverse(),trophies:[],personalAwards:[],retirement:{date:'2036-07-01',age:26,summary:'十季职业生涯结束。'}}}};
      document.querySelector('#app').innerHTML=`<main style="padding:12px">${seasonHistory(state)}</main>`;
    },crestPaths);
    await page.locator('.career-timeline').waitFor();const images=page.locator('.career-timeline img');for(let index=0;index<await images.count();index++){await images.nth(index).scrollIntoViewIfNeeded();await page.waitForTimeout(50)}await page.waitForFunction(()=>[...document.querySelectorAll('.career-timeline img')].every(image=>image.complete));
    const result=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[data-timeline-id]')].map(node=>node.dataset.timelineId),images=[...document.querySelectorAll('.career-timeline img')];return{seasons:document.querySelectorAll('[data-timeline-type="season"]').length,nodes:ids.length,unique:new Set(ids).size,crests:images.length,loaded:images.filter(image=>image.complete).length,broken:images.filter(image=>image.complete&&!image.naturalWidth).length,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}});
    assert.deepEqual(errors,[]);assert.equal(result.seasons,10);assert.equal(result.nodes,result.unique);assert.equal(result.crests,10);assert.equal(result.loaded,10);assert.equal(result.broken,0);assert.equal(result.overflow,false);report.push({width,...result});
    if(width===390){fs.mkdirSync(path.resolve('test-results'),{recursive:true});await page.screenshot({path:path.resolve('test-results/phase9-career-timeline-390.png'),fullPage:true})}
    await page.close();
  }
  console.log(JSON.stringify({status:'PASS',viewports:report},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
