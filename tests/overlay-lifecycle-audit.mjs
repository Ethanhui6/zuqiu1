import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {createAppServer} from '../scripts/serve.mjs';

const candidates=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean);
const executablePath=candidates.find(item=>fs.existsSync(item));
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  for(const width of [320,360,375,390,393,414,430]){
    const page=await browser.newPage({viewport:{width,height:800},isMobile:true,hasTouch:true});const errors=[];
    page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`,{waitUntil:'networkidle'});
    const result=await page.evaluate(async()=>{
      const {showToast}=await import('./src/components/toast.js');
      const {overlayManager}=await import('./src/services/overlay/overlayManager.js');
      const {animationDirector}=await import('./src/animations/director/animationDirector.js');
      const overlay=document.createElement('div');overlay.id='overlay-root';overlay.className='overlay-root';
      const toasts=document.createElement('div');toasts.id='toast-root';toasts.className='toast-root';document.body.append(overlay,toasts);
      showToast('时间推进速度已切换为 2倍',{duration:600});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const black=document.querySelector('.toast'),blackRect=black.getBoundingClientRect(),blackComputed=getComputedStyle(black),blackStyle={top:blackComputed.top,bottom:blackComputed.bottom,pointer:blackComputed.pointerEvents};
      showToast('训练方案已保存',{type:'success',duration:600});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const green=document.querySelector('.toast'),greenRect=green.getBoundingClientRect(),greenComputed=getComputedStyle(green),greenStyle={top:greenComputed.top,bottom:greenComputed.bottom,pointer:greenComputed.pointerEvents};
      const running=animationDirector.play('training-ring',{id:`cancel-${innerWidth}`,progress:82,label:'训练方向已更新'},{token:`cancel-${innerWidth}`});
      await new Promise(resolve=>setTimeout(resolve,40));animationDirector.cancelAll('test-route-change');await running;
      await new Promise(resolve=>setTimeout(resolve,30));
      return{
        black:{width:blackRect.width,height:blackRect.height,top:blackStyle.top,bottom:blackStyle.bottom,pointer:blackStyle.pointer},
        green:{width:greenRect.width,height:greenRect.height,top:greenStyle.top,bottom:greenStyle.bottom,pointer:greenStyle.pointer},
        managed:document.querySelectorAll('[data-overlay-managed=true]').length,
        layers:document.querySelectorAll('.animation-layer,.sheet-backdrop,.toast').length,
        diagnostics:animationDirector.diagnostics(),overlayDiagnostics:overlayManager.diagnostics(),
        centerHit:document.elementFromPoint(innerWidth/2,innerHeight/2)?.className||''
      };
    });
    for(const toast of [result.black,result.green]){
      assert.ok(toast.height>=35&&toast.height<80,`${width}px Toast 被错误拉伸：${toast.height}px`);
      assert.equal(toast.pointer,'none',`${width}px Toast 阻挡点击`);
    }
    assert.equal(result.managed,0,`${width}px 页面切换后存在托管浮层残留`);
    assert.equal(result.layers,0,`${width}px 页面切换后存在动画/弹窗/提示残留`);
    assert.equal(result.diagnostics.layers,0,`${width}px 动画资源计数未归零`);
    assert.equal(result.overlayDiagnostics.total,0,`${width}px Overlay Manager 未清空`);
    assert.deepEqual(errors,[],`${width}px 控制台存在错误`);await page.close();
  }
  console.log(JSON.stringify({status:'PASS',viewports:[320,360,375,390,393,414,430],toastStretchFixed:true,routeCleanup:true,interactiveBlockers:0},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
