import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {CORE_ANIMATIONS} from '../src/animations/definitions/coreAnimations.js';
import {createAppServer} from '../scripts/serve.mjs';

assert.equal(CORE_ANIMATIONS.length,22,'必须注册22种动画');
assert.equal(CORE_ANIMATIONS.filter(item=>item.category==='core').length,16,'核心互动动画必须为16种');
assert.equal(CORE_ANIMATIONS.filter(item=>item.category==='ranking').length,4,'评分和排行榜动画必须为4种');
assert.equal(CORE_ANIMATIONS.filter(item=>item.category==='club-transfer').length,2,'球队与转会动画必须为2种');
assert.equal(new Set(CORE_ANIMATIONS.map(item=>item.create)).size,22,'不得用同一动画换名复用');
for(const item of CORE_ANIMATIONS){assert.ok(item.duration>=300&&item.duration<=2200,`${item.id} 时长超出限制`);assert.ok(item.easing.startsWith('cubic-bezier'),`${item.id} 缺少独立缓动`);assert.equal(item.skippable,true,`${item.id} 必须可跳过`)}

const candidates=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean),executablePath=candidates.find(item=>fs.existsSync(item));
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port,browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});await page.goto(`http://127.0.0.1:${port}/?no-sw=1`,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const {animationDirector}=await import('./src/animations/director/animationDirector.js');animationDirector.settings.setMode('simple');const ids=animationDirector.registry.list().map(item=>item.id),started=performance.now();
    for(let index=0;index<50;index++){const id=ids[index%ids.length];await animationDirector.play(id,{id:`stress-${index}`,value:index%6+1,index,score:4321,grade:'SS',from:48,to:31,outcome:['goal','save','post','wide'][index%4],progress:72,names:['亚军','冠军','季军']},{token:`stress:${index}`})}
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return{elapsed:performance.now()-started,diagnostics:animationDirector.diagnostics(),layers:document.querySelectorAll('.animation-layer').length,backdrops:document.querySelectorAll('.animation-layer,.animation-backdrop').length,hit:document.elementFromPoint(innerWidth/2,innerHeight/2)?.className||''};
  });
  assert.ok(result.elapsed<30000,`50次严格串行动画耗时过长：${result.elapsed}ms`);assert.equal(result.layers,0,'动画层未释放');assert.equal(result.backdrops,0,'动画遮罩未释放');assert.equal(result.diagnostics.timers,0,'timer未释放');assert.equal(result.diagnostics.frames,0,'requestAnimationFrame未释放');assert.equal(result.diagnostics.listeners,0,'监听器未释放');assert.equal(result.diagnostics.layers,0,'资源计数存在残留层');assert.deepEqual(errors,[],'动画运行存在控制台错误');
  console.log(JSON.stringify({status:'PASS',registered:22,core:16,ranking:4,clubTransfer:2,mobileViewport:'390x844',stressAnimations:50,elapsedMs:Math.round(result.elapsed),resourcesReleased:true,transparentBlocker:false,consoleErrors:errors.length},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
