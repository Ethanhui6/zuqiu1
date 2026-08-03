import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createAppServer} from '../scripts/serve.mjs';
import {MemoryLeaderboardRepository} from '../server/database/memoryLeaderboardRepository.js';
import {listWorldLeaderboard} from '../server/authority/authorityService.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),clubs=JSON.parse(await fsp.readFile(path.join(root,'data','clubs.json'),'utf8')).clubs;
let started=performance.now();for(let index=0;index<300;index++){const query=['中国','联赛','城','竞技'][index%4];clubs.filter(club=>club.cn.includes(query)||club.country.includes(query)).slice(0,24)}const clubListMs=performance.now()-started;
started=performance.now();const eventFiles=(await fsp.readdir(path.join(root,'data','events'))).filter(file=>file.endsWith('.json'));for(const file of eventFiles)JSON.parse(await fsp.readFile(path.join(root,'data','events',file),'utf8'));const eventDataMs=performance.now()-started;
const repo=new MemoryLeaderboardRepository();for(let index=0;index<1000;index++)repo.entries.set(`run-perf-${index}`,{runId:`run-perf-${index}`,userId:`u-${index}`,playerName:`球员${index}`,publicNickname:`玩家${index}`,nation:'中国',position:['ST','CM','CB','GK'][index%4],clubName:'性能测试队',score:10000-index,grade:index<10?'SS':'A',seasons:10,ending:'',gameVersion:'18.8.0',difficulty:'standard',category:'overall',submittedAt:index,verified:true,reviewStatus:'clear',withdrawn:false});
started=performance.now();for(let page=1;page<=40;page++)await listWorldLeaderboard(repo,{page,limit:25});const leaderboardMs=performance.now()-started;

const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port,candidates=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean),executablePath=candidates.find(item=>fs.existsSync(item)),browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
let web;
try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await page.addInitScript(()=>{window.__perfAudit={cls:0,longTasks:0};new PerformanceObserver(list=>{for(const item of list.getEntries())if(!item.hadRecentInput)window.__perfAudit.cls+=item.value}).observe({type:'layout-shift',buffered:true});try{new PerformanceObserver(list=>{window.__perfAudit.longTasks+=list.getEntries().length}).observe({type:'longtask',buffered:true})}catch{}});await page.goto(`http://127.0.0.1:${port}/?no-sw=1`,{waitUntil:'networkidle'});await page.waitForTimeout(350);web=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0],paint=performance.getEntriesByName('first-contentful-paint')[0];return{domContentLoaded:nav?.domContentLoadedEventEnd||0,load:nav?.loadEventEnd||0,fcp:paint?.startTime||0,cls:window.__perfAudit.cls,longTasks:window.__perfAudit.longTasks,heap:performance.memory?.usedJSHeapSize||0}});
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}

assert.ok(clubListMs<120,'500队列表筛选出现长任务');assert.ok(eventDataMs<250,'事件数据载入过慢');assert.ok(leaderboardMs<250,'排行榜分页过慢');assert.ok(web.fcp<1600,'首屏内容绘制过慢');assert.ok(web.cls<.1,'累计布局偏移过高');assert.ok(web.longTasks<=3,'首屏长任务过多');
console.log(JSON.stringify({status:'PASS',firstScreen:web,clubList:{clubs:clubs.length,iterations:300,ms:Number(clubListMs.toFixed(2))},eventLoad:{files:eventFiles.length,ms:Number(eventDataMs.toFixed(2))},leaderboardPagination:{entries:1000,pages:40,ms:Number(leaderboardMs.toFixed(2))},animationStress:'由 animation-system-audit.mjs 验证50次',longRun:'由 twenty-season-sim.mjs 验证20赛季',serviceWorker:'V18.9网络优先并清理旧缓存'},null,2));
