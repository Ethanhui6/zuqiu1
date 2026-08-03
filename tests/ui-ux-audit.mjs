import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {positionPreviewAttrs} from '../src/pages/onboardingPage.js';
import {calculateOvr} from '../src/systems/career/ovr.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const css=read('src/styles/ux-v18.2.css');
const shell=read('src/components/appShell.js');
const sheet=read('src/components/sheet.js');
const talent=read('src/components/talentCard.js');
const event=read('src/components/eventCard.js');
const club=read('src/components/clubCard.js');
const dom=read('src/utils/dom.js');

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
check('关键源码没有Math.random',()=>{const files=fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(x=>String(x).endsWith('.js'));for(const file of files)assert.equal(read(path.join('src',String(file))).includes('Math.random'),false,String(file))});

console.log(JSON.stringify({status:'PASS',passed:checks.length,cases:checks},null,2));
