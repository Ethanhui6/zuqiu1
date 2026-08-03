import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createAppServer} from '../scripts/serve.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const shots=path.join(root,'docs','screenshots-v19');fs.mkdirSync(shots,{recursive:true});
const viewports=[[320,568],[360,800],[375,667],[390,844],[393,852],[412,915],[414,896],[430,932],[768,1024],[1024,768],[1440,900]];
const candidates=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean);
const executablePath=candidates.find(item=>fs.existsSync(item));
const server=createAppServer({root});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];

async function audit(page,label){
  const geometry=await page.evaluate(()=>{
    const visible=node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
    const overlap=(a,b)=>{const x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);return x>2&&y>2};
    const collisions=[];
    for(const parent of document.querySelectorAll('.club-card__header,.offer-header,.match-header,.setup-actions,.tab-bar')){
      const children=[...parent.children].filter(visible);
      for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++)if(overlap(children[i].getBoundingClientRect(),children[j].getBoundingClientRect()))collisions.push(`${parent.className}:${children[i].className}|${children[j].className}`);
    }
    const transparentBlockers=[...document.querySelectorAll('body *')].filter(node=>{
      if(!visible(node))return false;const s=getComputedStyle(node),r=node.getBoundingClientRect();
      return ['fixed','absolute'].includes(s.position)&&Number(s.opacity)<.05&&s.pointerEvents!=='none'&&r.width>innerWidth*.7&&r.height>innerHeight*.5;
    }).map(node=>node.className||node.tagName);
    return{
      rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      mainOverflow:(document.querySelector('.page-container')?.scrollWidth||0)-(document.querySelector('.page-container')?.clientWidth||0),
      small:[...document.querySelectorAll('button')].filter(node=>visible(node)&&(()=>{const r=node.getBoundingClientRect();return r.width<43.5||r.height<43.5})()).map(node=>({text:node.innerText.slice(0,24),width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height})),
      vertical:[...document.querySelectorAll('h1,h2,h3,p,strong,small,span')].filter(node=>{if(!visible(node))return false;const r=node.getBoundingClientRect(),s=getComputedStyle(node),text=(node.textContent||'').trim();return text.length>2&&(s.writingMode!=='horizontal-tb'||(r.width<18&&r.height>r.width*3))}).slice(0,10).map(node=>node.textContent.trim().slice(0,40)),
      transparentBlockers,collisions,
      speedDockCount:document.querySelectorAll('.speed-dock,.speed-control,.speed-controls').length,
      floatingNav:(()=>{const nav=document.querySelector('.tab-bar');if(!nav||!visible(nav))return null;const r=nav.getBoundingClientRect(),s=getComputedStyle(nav);return{left:r.left,right:r.right,bottom:r.bottom,height:r.height,position:s.position,backdrop:s.backdropFilter||s.webkitBackdropFilter,borderRadius:s.borderRadius}})(),
      viewportWidth:innerWidth,viewportHeight:innerHeight,
      appRegions:['.AppHeader','.MainViewport','.BottomNavigation','.OverlayRoot','.ToastRoot'].filter(selector=>document.querySelector(selector)).length
    };
  });
  assert.ok(geometry.rootOverflow<=1,`${label} 根节点横向溢出 ${geometry.rootOverflow}`);
  assert.ok(geometry.mainOverflow<=1,`${label} 正文横向溢出 ${geometry.mainOverflow}`);
  assert.deepEqual(geometry.small,[],`${label} 存在小于44×44的按钮`);
  assert.deepEqual(geometry.vertical,[],`${label} 出现竖排或极窄文本`);
  assert.deepEqual(geometry.transparentBlockers,[],`${label} 存在透明点击遮罩`);
  assert.deepEqual(geometry.collisions,[],`${label} 关键布局子项重叠`);
  assert.equal(geometry.speedDockCount,0,`${label} 仍存在常驻比赛速度控制栏`);
  if(geometry.floatingNav){
    assert.equal(geometry.floatingNav.position,'fixed',`${label} 底栏不是悬浮固定布局`);
    assert.ok(geometry.floatingNav.left>=7&&geometry.floatingNav.right<=geometry.viewportWidth+1,`${label} 玻璃底栏超出视口`);
    assert.ok(geometry.floatingNav.bottom<=geometry.viewportHeight+1,`${label} 玻璃底栏被裁切`);
    assert.notEqual(geometry.floatingNav.backdrop,'none',`${label} 玻璃底栏没有背景模糊`);
  }
  return geometry;
}

async function closeCareerEvent(page,{resume=false}={}){
  await page.locator('.event-choice').first().waitFor({state:'visible'});
  await page.locator('.event-choice').first().click();
  await page.getByRole('heading',{name:'选择结果'}).waitFor();
  await page.getByRole('button',{name:resume?'继续推进':'返回生涯',exact:true}).click();
}

async function fullFlow(page){
  const date=page.locator('input[type=date]');
  await date.click();
  await date.fill('2009-07-16');
  await date.dispatchEvent('input');await date.dispatchEvent('change');
  await page.keyboard.press('Tab');
  assert.equal(await date.inputValue(),'2009-07-16','生日没有按纯日期字符串保存');
  assert.equal(await page.locator('.sheet-backdrop').count(),0,'原生日期关闭后残留遮罩');
  await page.getByRole('button',{name:'下一步',exact:true}).click();
  await page.getByRole('button',{name:'上一步',exact:true}).click();
  assert.equal(await date.inputValue(),'2009-07-16','返回上一步后创建草稿丢失');
  await page.getByRole('button',{name:'下一步',exact:true}).click();
  await page.getByRole('button',{name:'下一步',exact:true}).click();
  await page.getByRole('button',{name:'中前卫',exact:true}).click();
  await page.getByRole('button',{name:'下一步',exact:true}).click();
  await page.locator('.selection-card').first().click();
  await page.getByRole('button',{name:'下一步',exact:true}).click();
  await page.locator('.talent-card').first().click();
  await page.getByRole('button',{name:'下一步',exact:true}).click();
  await page.locator('.club-select-card').first().click();
  await page.getByRole('button',{name:/快速模式/}).click();
  await page.getByRole('button',{name:'开始职业生涯',exact:true}).click();
  await page.getByRole('heading',{name:'关键职业事件'}).waitFor();
  await closeCareerEvent(page);
  await page.getByRole('heading',{name:'职业生涯控制台'}).waitFor();
  assert.equal(await page.locator('.speed-dock,.speed-control,.speed-controls').count(),0,'生涯首页仍存在常驻速度控制栏');
  await page.locator('.guidance-banner').waitFor({state:'visible'});
  assert.ok(await page.locator('.tab-badge:not([hidden])').count()>0,'底部导航没有显示真实待办提醒');
  await page.waitForTimeout(420);
  if(await page.locator('.scroll-hint.is-visible').count()){
    await page.locator('.scroll-hint.is-visible').click();
    await page.waitForTimeout(380);
    assert.ok(await page.locator('.page-container').evaluate(node=>node.scrollTop>0),'滚动提示没有推动正文滚动');
    await page.locator('.page-container').evaluate(node=>node.scrollTo({top:0,behavior:'instant'}));
  }
  await page.locator('.header-pace-button').click();
  await page.getByRole('heading',{name:'游戏节奏',exact:true}).waitFor();
  await page.getByRole('button',{name:'2倍',exact:true}).click();
  await page.getByRole('button',{name:'快速',exact:true}).click();
  const autoTraining=page.getByRole('checkbox',{name:'自动推进普通训练'});
  if(await autoTraining.isChecked())await autoTraining.uncheck();
  await page.getByRole('button',{name:'关闭弹窗'}).click();
  await page.waitForTimeout(320);
  assert.equal(await page.locator('.sheet-backdrop').count(),0,'游戏节奏Sheet关闭后残留遮罩');
  assert.match(await page.locator('.header-pace-button').innerText(),/2倍/,'速度设置没有立即更新到小型状态标记');
  const paceStored=await page.evaluate(()=>JSON.parse(localStorage.getItem('green-pitch-v19-pace')||'null'));
  assert.equal(paceStored?.speed,'fast','速度没有写入本地偏好');
  assert.equal(paceStored?.eventAnimationSpeed,'fast','事件动画速度没有写入本地偏好');
  assert.equal(paceStored?.autoTraining,false,'自动训练开关没有写入本地偏好');
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'职业生涯控制台'}).waitFor();
  assert.match(await page.locator('.header-pace-button').innerText(),/2倍/,'刷新后速度设置没有保持');
  await audit(page,'390×844 生涯首页');
  const careerFirstScreen=await page.evaluate(()=>{const main=document.querySelector('.page-container')?.getBoundingClientRect(),advance=document.querySelector('.advance-panel')?.getBoundingClientRect();return{visible:Boolean(main&&advance&&advance.top<main.bottom),screens:document.querySelector('.page-container').scrollHeight/document.querySelector('.page-container').clientHeight}});
  assert.equal(careerFirstScreen.visible,true,'生涯页时间推进入口没有出现在首屏');
  assert.ok(careerFirstScreen.screens<2.2,`生涯页仍然过长：${careerFirstScreen.screens.toFixed(2)}屏`);
  await page.screenshot({path:path.join(shots,'career-390x844.png'),fullPage:false});

  await page.evaluate(async()=>{
    const {gameStore}=await import('./src/app/store.js');
    gameStore.update(save=>{save.career.calendar.nextEventWeek=999;save.settings.pace.speed='normal';save.settings.pace.autoTraining=true;save.settings.pace.autoMatch=true},'load');
  });
  await page.getByRole('button',{name:'比赛',exact:true}).click();
  for(let attempt=0;attempt<5;attempt++){
    await page.getByRole('button',{name:'推进至下一场比赛',exact:true}).click();
    const state=await Promise.race([
      page.locator('.match-header-card').waitFor({state:'visible',timeout:20000}).then(()=> 'match'),
      page.locator('.event-choice').first().waitFor({state:'visible',timeout:20000}).then(()=> 'event'),
      page.locator('.transfer-offer-card').first().waitFor({state:'visible',timeout:20000}).then(()=> 'transfer'),
      page.waitForTimeout(3500).then(()=> 'other')
    ]);
    if(state==='match')break;
    if(state==='transfer'){
      await page.evaluate(async()=>{
        const {gameStore}=await import('./src/app/store.js');
        gameStore.update(save=>{for(const offer of save.career.pending.offers)if(offer.status==='pending')offer.status='rejected'},'load');
      });
      await page.getByRole('button',{name:'比赛',exact:true}).click();
      continue;
    }
    if(state==='other'){
      const debug=await page.evaluate(()=>({title:document.title,headings:[...document.querySelectorAll('h1,h2,h3')].map(node=>node.textContent?.trim()).filter(Boolean),buttons:[...document.querySelectorAll('button')].filter(node=>getComputedStyle(node).display!=='none').map(node=>node.textContent?.trim()).filter(Boolean).slice(0,20),path:location.hash}));
      throw new Error(`推进下一场进入未处理状态：${JSON.stringify(debug)}`);
    }
    await closeCareerEvent(page);
    await page.getByRole('button',{name:'比赛',exact:true}).click();
  }
  await page.locator('.match-header-card').waitFor({timeout:20000});
  await page.getByRole('button',{name:/互动比赛/}).click();
  await page.locator('.match-choice').first().click();
  await page.locator('.match-result-page').waitFor();
  await page.getByText('教练评价',{exact:true}).waitFor();
  await audit(page,'390×844 比赛结算');
  await page.waitForTimeout(2300);
  await page.screenshot({path:path.join(shots,'match-result-390x844.png'),fullPage:false});

  await page.getByRole('button',{name:'更多',exact:true}).click();
  await page.getByRole('button',{name:/球队世界/}).click();
  await page.locator('.club-card').first().waitFor();
  assert.ok(await page.locator('.club-card').count()>2,'球队世界没有渲染球队卡');
  await audit(page,'390×844 球队世界');
  await page.waitForTimeout(360);
  await page.screenshot({path:path.join(shots,'world-390x844.png'),fullPage:false});
  await page.locator('.club-card').first().click();
  await page.getByRole('heading',{name:/俱乐部|足球|队/}).first().waitFor().catch(()=>{});
  await page.getByRole('button',{name:'关闭弹窗'}).click();
  await page.waitForTimeout(320);
  assert.equal(await page.locator('.sheet-backdrop').count(),0,'球队详情关闭后仍残留遮罩');

  await page.evaluate(async()=>{
    const {gameStore}=await import('./src/app/store.js');
    gameStore.update(save=>{
      save.player.ovr=88;save.player.potential=94;save.career.squadLevel='一线队';save.career.teamRole='主力';save.career.month=1;
      save.career.seasonStats={...save.career.seasonStats,apps:30,starts:28,goals:18,assists:10,rating:8.1};save.fans.mediaHeat=75;save.status.form=86;save.career.pending.offers=[];save.career.transferWindows={};
      if(save.meta?.ranking)save.meta.ranking.eligible=false;
    },'load');
  });
  await page.getByRole('button',{name:'转会',exact:true}).click();
  await page.locator('.transfer-offer-card').first().waitFor();
  assert.ok(await page.locator('.transfer-offer-card').count()>0,'高水平球员在开放窗口没有收到可测试报价');
  await page.getByText('转会费',{exact:true}).first().waitFor();
  await page.getByText('战术适配度',{exact:true}).first().waitFor();
  await audit(page,'390×844 转会报价');
  await page.waitForTimeout(360);
  await page.screenshot({path:path.join(shots,'transfer-390x844.png'),fullPage:false});
  await page.getByRole('button',{name:'谈判',exact:true}).first().click();
  await page.locator('.negotiation-option').first().waitFor();
  await page.getByRole('button',{name:'关闭弹窗'}).click();
  await page.waitForTimeout(320);
  const hit=await page.evaluate(()=>document.elementFromPoint(innerWidth/2,innerHeight/2)?.closest('.sheet-backdrop')===null);
  assert.equal(hit,true,'关闭谈判后透明遮罩仍命中点击');

  await page.getByRole('button',{name:'训练',exact:true}).click();
  await page.locator('.training-control-center').waitFor();
  await page.locator('.training-plan-card').first().click();
  await page.waitForTimeout(520);
  await audit(page,'390×844 训练');
  const trainingFirstScreen=await page.evaluate(()=>{const main=document.querySelector('.page-container')?.getBoundingClientRect(),selectors=['.training-summary-card','.coach-advice','.training-strategy-card','.training-preview','.training-plan-card'];const visible=selectors.every(selector=>{const rect=document.querySelector(selector)?.getBoundingClientRect();return rect&&rect.top<main.bottom&&rect.bottom>main.top});const toast=document.querySelector('.toast')?.getBoundingClientRect();return{visible,screens:document.querySelector('.page-container').scrollHeight/document.querySelector('.page-container').clientHeight,toastHeight:toast?.height||0,toastPointer:document.querySelector('.toast')?getComputedStyle(document.querySelector('.toast')).pointerEvents:'none'}});
  assert.equal(trainingFirstScreen.visible,true,'训练方向、建议、收益或首个方案没有同时出现在首屏');
  assert.ok(trainingFirstScreen.screens<2,`训练页仍然过长：${trainingFirstScreen.screens.toFixed(2)}屏`);
  assert.ok(trainingFirstScreen.toastHeight<80,'训练成功提示被错误拉伸为竖向遮挡层');
  assert.equal(trainingFirstScreen.toastPointer,'none','训练提示阻挡页面点击');
  await page.screenshot({path:path.join(shots,'training-390x844.png'),fullPage:false});

  await page.getByRole('button',{name:'更多',exact:true}).click();
  await page.getByRole('button',{name:/生涯排行榜/}).click();
  await page.getByText('本地存档榜',{exact:true}).waitFor();
  await page.getByText('联网世界榜',{exact:true}).waitFor();
  await page.waitForTimeout(1550);
  await audit(page,'390×844 本地与世界排行榜');
  await page.screenshot({path:path.join(shots,'rankings-390x844.png'),fullPage:false});

  await page.getByRole('button',{name:'更多',exact:true}).click();
  await page.getByRole('button',{name:/我的生涯/}).click();
  await page.getByText('成就系统',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'设置',exact:true}).waitFor();
  await audit(page,'390×844 成就与设置');
  await page.screenshot({path:path.join(shots,'profile-settings-390x844.png'),fullPage:false});
}

try{
  for(const [width,height] of viewports){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<768,hasTouch:true});
    const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
    page.on('response',async response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()} ${await response.text().catch(()=> '')}`)});
    await page.goto(`http://127.0.0.1:${port}/?no-sw=1`,{waitUntil:'networkidle'});
    await page.getByRole('button',{name:/创建新生涯/}).click();
    assert.equal(await page.locator('input[type=date]').getAttribute('type'),'date');
    const initial=await audit(page,`${width}×${height} 创建球员`);
    if([320,375,390,430,1024,1440].includes(width))await page.screenshot({path:path.join(shots,`onboarding-${width}x${height}.png`),fullPage:false});
    if(width===390)await fullFlow(page);
    assert.deepEqual(errors,[],`${width}×${height} 存在控制台错误`);
    results.push({width,height,rootOverflow:initial.rootOverflow,mainOverflow:initial.mainOverflow,touchTargets:true,verticalText:false,transparentBlockers:0,consoleErrors:errors.length});
    await page.close();
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}

console.log(JSON.stringify({status:'PASS',engine:'真实生产入口 + Chromium',viewports:results,version:'19.1.0',v19Features:['下一步引导','待办徽标','滚动提示','iOS玻璃底栏','游戏节奏Sheet','刷新保持设置'],fullFlow:['创建球员','原生日期','位置','踢球风格','天赋','青年队','职业节奏','生涯首页','比赛准备','比赛模式','比赛选择','比赛结算','球队世界','转会报价','训练','本地排行榜','世界排行榜','成就','设置'],screenshots:path.relative(root,shots)},null,2));
