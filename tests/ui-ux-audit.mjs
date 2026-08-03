import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {positionPreviewAttrs} from '../src/pages/onboardingPage.js';
import {calculateOvr} from '../src/systems/career/ovr.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const allJs=fs.readdirSync(path.join(root,'src'),{recursive:true})
  .filter(file=>String(file).endsWith('.js'))
  .map(file=>read(path.join('src',String(file))))
  .join('\n');
const css=[
  'src/styles/theme.css',
  'src/styles/base.css',
  'src/styles/components.css',
  'src/styles/pages.css',
  'src/styles/mobile-v18.5.css'
].map(read).join('\n');
const index=read('index.html');
const shell=read('src/components/appShell.js');
const sheet=read('src/components/sheet.js');
const scrollLock=read('src/utils/scrollLock.js');
const viewport=read('src/utils/viewport.js');
const diagnostics=read('src/utils/uiDiagnostics.js');
const onboarding=read('src/pages/onboardingPage.js');
const formControls=read('src/components/formControls.js');
const club=read('src/components/clubCard.js');
const crest=read('src/components/clubCrest.js');
const transfer=read('src/pages/transferPage.js');
const match=read('src/pages/matchPage.js');
const format=read('src/utils/format.js');
const sw=read('sw.js');
const config=read('src/app/config.js');

const checks=[];
function check(name,fn){fn();checks.push(name)}

check('viewport允许缩放并适配安全区域',()=>{
  assert.match(index,/width=device-width, initial-scale=1, viewport-fit=cover/);
  assert.doesNotMatch(index,/maximum-scale|user-scalable=no/);
});
check('采用真正的移动端优先断点',()=>{
  for(const width of [480,768,1024,1440])assert.match(css,new RegExp(`@media\\s*\\(min-width:\\s*${width}px\\)`));
  assert.doesNotMatch(css,/min-width\s*:\s*1024px\s*;\s*}\s*body/i);
  assert.doesNotMatch(css,/transform\s*:\s*scale\([^)]*\)\s*;[^}]*\/\*[^}]*mobile/i);
});
check('AppShell统一动态视口和单一正文滚动容器',()=>{
  assert.match(css,/\.app-shell\{[\s\S]*grid-template-rows:auto minmax\(0,1fr\) auto auto/);
  assert.match(css,/\.page-container\{[\s\S]*overflow-y:auto[\s\S]*overflow-x:clip/);
  assert.match(css,/100dvh/);
  assert.match(viewport,/visualViewport/);
});
check('全局只有浅色iOS主题',()=>{
  assert.match(css,/--color-bg:\s*#f5f5f7/i);
  assert.match(css,/--color-text-primary:\s*#1d1d1f/i);
  assert.doesNotMatch(css,/:root\[data-theme=["']dark/);
  assert.match(config,/THEME_MODES\s*=\s*\['light'\]/);
});
check('安全区域覆盖顶部、底部和正文',()=>{
  for(const token of ['--safe-top','--safe-right','--safe-bottom','--safe-left'])assert.ok(css.includes(token),token);
  assert.match(css,/env\(safe-area-inset-bottom/);
});
check('所有触控按钮不小于44像素并使用manipulation',()=>{
  assert.match(css,/--tap-size:\s*44px/);
  assert.match(css,/min-height:\s*44px/);
  assert.match(css,/touch-action:\s*manipulation/);
});
check('底部导航固定为五个核心入口',()=>{
  for(const token of ["id:'career'","id:'match'","id:'training'","id:'transfer'","id:'more'"])assert.ok(config.includes(token),token);
  assert.match(css,/\.tab-bar\{[\s\S]*grid-template-columns:repeat\(5/);
  assert.ok(shell.includes('NAV_ITEMS'));
});
check('Bottom Sheet拥有稳定滚动锁和焦点恢复',()=>{
  assert.match(sheet,/lockPageScroll/);
  assert.match(sheet,/unlockPageScroll/);
  assert.match(sheet,/previousFocus/);
  assert.match(scrollLock,/position='fixed'/);
  assert.match(scrollLock,/scrollTo\(\{top:saved\.scrollY/);
  assert.match(css,/\.sheet-body\{[\s\S]*overflow-y:auto/);
});
check('生日使用原生date并保持纯日期字符串',()=>{
  assert.match(formControls,/type:'date'/);
  assert.match(formControls,/createDateField/);
  assert.match(onboarding,/min:'2007-01-01'/);
  assert.match(onboarding,/max:'2010-12-31'/);
  assert.match(onboarding,/parsePureDate/);
  assert.ok(onboarding.includes('\\d{4}')&&onboarding.includes('\\d{2}'));
  assert.doesNotMatch(onboarding,/toISOString\(/);
});
check('创建球员是六步单任务流程并持久化草稿',()=>{
  assert.match(onboarding,/const stepNames=\[/);
  assert.match(onboarding,/step:1/);
  assert.match(onboarding,/step===6/);
  assert.match(onboarding,/sessionStorage/);
  assert.match(css,/\.player-setup\{[\s\S]*grid-template-rows:auto minmax\(0,1fr\) auto/);
});
check('球队列表手机单列并使用本地队徽占位',()=>{
  assert.match(css,/\.club-grid\{[\s\S]*grid-template-columns:1fr/);
  assert.match(css,/@media\s*\(min-width:\s*768px\)[\s\S]*\.club-grid/);
  assert.match(crest,/placeholder\.svg/);
  assert.match(crest,/loading:'lazy'/);
  assert.match(crest,/decoding:'async'/);
  assert.match(club,/createClubCrest/);
});
check('转会报价使用移动端结构并保留真实操作',()=>{
  for(const token of ['transfer-offer-card','offer-header','offer-metrics','offer-context','offer-actions'])assert.ok(transfer.includes(token),token);
  for(const action of ['accept','reject','defer','negotiate'])assert.ok(transfer.includes(action),action);
  assert.match(css,/\.offer-metrics\{[\s\S]*repeat\(2,minmax\(0,1fr\)\)/);
});
check('比赛头部、模式和选择卡均为移动端安全结构',()=>{
  for(const token of ['match-header','match-team','match-center','mode-list','match-choice','match-result-page'])assert.ok(match.includes(token),token);
  assert.match(css,/\.match-header\{[\s\S]*minmax\(0,1fr\) auto minmax\(0,1fr\)/);
  assert.match(css,/\.mode-list\{[\s\S]*grid-template-columns:1fr/);
});
check('数据格式化层阻止对象、undefined、null和NaN直出',()=>{
  for(const token of ['formatStatLabel','formatStatValue','formatEffectList','formatClubName','formatCurrency','formatLocalDate','formatPercentage'])assert.ok(format.includes(token),token);
  assert.match(format,/Number\.isFinite/);
  assert.match(format,/typeof value===['"]object['"]/);
});
check('位置预览和综合能力按位置变化',()=>{
  const st=positionPreviewAttrs('ST'),cb=positionPreviewAttrs('CB'),gk=positionPreviewAttrs('GK');
  assert.notDeepEqual(st,cb);assert.notDeepEqual(st,gk);assert.ok(st.sho>st.def);assert.ok(cb.def>cb.sho);
  const attrs={pac:90,sho:92,pas:62,dri:82,def:38,phy:74};
  assert.notEqual(calculateOvr(attrs,'ST'),calculateOvr(attrs,'CB'));
});
check('开发诊断可报告溢出和点击命中层',()=>{
  assert.match(diagnostics,/getBoundingClientRect/);
  assert.match(diagnostics,/elementFromPoint/);
  assert.match(diagnostics,/composedPath/);
  assert.match(diagnostics,/overflow/);
});
check('Service Worker升级到V18.5并采用HTML网络优先',()=>{
  assert.match(sw,/v18\.5\.0/);
  assert.match(sw,/skipWaiting/);
  assert.match(sw,/clients\.claim/);
  assert.match(sw,/event\.request\.mode===['"]navigate['"]/);
  assert.match(sw,/cache:'no-store'/);
  assert.match(sw,/caches\.delete/);
});
check('关键源码不直接使用Math.random',()=>assert.equal(allJs.includes('Math.random'),false));
check('用户界面无指定内部英文和危险直出标记',()=>{
  const content=allJs+'\n'+index+'\n'+css;
  for(const word of ['[object Object]','Loading','Continue','Settings','Transfer Offer','Season Complete','Career Complete'])assert.equal(content.includes(word),false,word);
});

console.log(JSON.stringify({status:'PASS',version:'18.5.0',passed:checks.length,cases:checks},null,2));
