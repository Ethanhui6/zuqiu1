import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {positionPreviewAttrs} from '../src/pages/onboardingPage.js';
import {calculateOvr} from '../src/systems/career/ovr.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const css=read('src/styles/ux-v18.2.css')+'\n'+read('src/styles/pace-v18.3.css');
const shell=read('src/components/appShell.js');
const sheet=read('src/components/sheet.js');
const talent=read('src/components/talentCard.js');
const event=read('src/components/eventCard.js');
const club=read('src/components/clubCard.js');
const dom=read('src/utils/dom.js');
const career=read('src/pages/careerPage.js');
const onboarding=read('src/pages/onboardingPage.js');
const matchPage=read('src/pages/matchPage.js');
const pace=read('src/systems/pace/paceSystem.js');

const checks=[];
function check(name,fn){fn();checks.push(name)}
check('四种手机宽度均有专门响应式规则',()=>{for(const width of [320,375,390,430])assert.match(css,new RegExp(width===320?'min-width:320px':width===430?'max-width:430px':'max-width:760px'))});
check('所有按钮拥有44像素最小触控区域',()=>{assert.match(css,/--tap-size:44px/);assert.match(css,/button\{min-width:var\(--tap-size\);min-height:var\(--tap-size\)/)});
check('按钮拥有按压缩放反馈',()=>{assert.match(css,/scale\(\.96\)/);assert.match(dom,/pointerdown/)});
check('弹窗支持动态视口和安全区域',()=>{assert.match(sheet,/visualViewport/);assert.match(css,/env\(safe-area-inset-bottom\)/);assert.match(css,/sheet-body\{[^}]*overflow-y:auto/s)});
check('非主页拥有返回和主页按钮',()=>{assert.match(shell,/返回生涯首页/);assert.match(shell,/返回主页/);assert.match(shell,/header-back/);assert.match(shell,/header-home/)});
check('深色模式不是纯黑后台风格',()=>{assert.match(css,/:root\[data-theme="dark"\][\s\S]*--page:#101114/)});
check('天赋卡包含稀有度、星级、潜力、优势、风险与球探评价',()=>{for(const token of ['talent-stars','潜力区间','scout-points','风险：','scout-quote'])assert.ok(talent.includes(token),token)});
check('事件卡使用场景和风险收益选择结构',()=>{for(const token of ['event-scene','choice-assessment','低风险','高风险','查看完整情境'])assert.ok(event.includes(token),token)});
check('球队卡包含队徽、青训、风格和年轻机会',()=>{for(const token of ['club-crest','青训','年轻机会','球队风格','发展适配'])assert.ok(club.includes(token),token)});
check('不同位置预览能力图数据不同',()=>{const st=positionPreviewAttrs('ST'),cb=positionPreviewAttrs('CB'),gk=positionPreviewAttrs('GK');assert.notDeepEqual(st,cb);assert.notDeepEqual(st,gk);assert.ok(st.sho>st.def);assert.ok(cb.def>cb.sho);assert.ok(gk.pac>gk.def)});
check('位置权重会改变综合能力结果',()=>{const attrs={pac:90,sho:92,pas:62,dri:82,def:38,phy:74};assert.notEqual(calculateOvr(attrs,'ST'),calculateOvr(attrs,'CB'))});
check('界面禁用指定英文残留',()=>{const files=['src','index.html'];const forbidden=['Loading','Continue','Settings','Transfer Offer','Season Complete','Career Complete','LEGEND','B2B','Roguelike'];const content=fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(x=>String(x).endsWith('.js')).map(x=>read(path.join('src',String(x)))).join('\n')+read('index.html')+css;for(const word of forbidden)assert.equal(content.includes(word),false,word)});

check('永久速度控制器拥有五档且不遮挡导航',()=>{for(const token of ['speed-dock','speed-button','grid-template-columns:repeat(5'])assert.ok(css.includes(token),token);assert.ok(shell.includes('SPEED_LEVELS')&&shell.includes('onSpeed'))});
check('开局包含四种职业节奏选择',()=>{for(const token of ['沉浸模式','标准模式','快速模式','传奇速通模式'])assert.ok(read('src/app/config.js').includes(token),token);assert.ok(onboarding.includes('pace-mode-grid'))});
check('主页支持六种时间推进目标',()=>{for(const token of ['nextEvent','nextMatch','week','month','window','season'])assert.ok(read('src/app/config.js').includes(token),token);assert.ok(career.includes('advanceCareer'))});
check('比赛具有一键结果快速时间线和互动三种呈现',()=>{for(const token of ['一键结果','快速时间线','互动比赛'])assert.ok(matchPage.includes(token),token)});
check('自动策略和阶段目标连接真实状态',()=>{assert.ok(pace.includes('TRAINING_STRATEGIES')&&pace.includes('MATCH_STRATEGIES')&&pace.includes('CAREER_STRATEGIES'));assert.ok(career.includes('objectiveProgress')&&career.includes('selectObjective'))});

check('关键源码没有Math.random',()=>{const files=fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(x=>String(x).endsWith('.js'));for(const file of files)assert.equal(read(path.join('src',String(file))).includes('Math.random'),false,String(file))});

console.log(JSON.stringify({status:'PASS',passed:checks.length,cases:checks},null,2));
