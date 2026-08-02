(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const boot=$('#boot'),app=$('#app'),topbar=$('#topbar'),view=$('#view'),nav=$('#nav'),overlay=$('#overlay'),sheet=$('#sheet'),toast=$('#toast');

const STORAGE='green-pitch-career-v18';
const ATTRS=['pac','sho','pas','dri','def','phy'];
const ATTR_CN={pac:'速度',sho:'射门',pas:'传球',dri:'盘带',def:'防守',phy:'身体'};
const POS_CN={ST:'中锋',LW:'左边锋',RW:'右边锋',CAM:'前腰',CM:'中前卫',CDM:'后腰',LB:'左后卫',CB:'中后卫',RB:'右后卫',GK:'门将'};
const POS_GROUP={ST:'attack',LW:'attack',RW:'attack',CAM:'creative',CM:'creative',CDM:'defense',LB:'defense',CB:'defense',RB:'defense',GK:'keeper'};
const POS_WEIGHTS={
 ST:[.19,.31,.08,.18,.03,.21],LW:[.28,.2,.13,.28,.02,.09],RW:[.28,.2,.13,.28,.02,.09],CAM:[.12,.17,.28,.31,.03,.09],
 CM:[.11,.12,.31,.25,.08,.13],CDM:[.07,.05,.22,.14,.31,.21],LB:[.2,.05,.15,.16,.27,.17],RB:[.2,.05,.15,.16,.27,.17],
 CB:[.05,.03,.11,.08,.41,.32],GK:[.04,.02,.12,.05,.45,.32]
};
const POS_FOCUS={
 ST:['sho','pac','phy'],LW:['pac','dri','sho'],RW:['pac','dri','sho'],CAM:['dri','pas','sho'],CM:['pas','dri','phy'],
 CDM:['def','pas','phy'],LB:['pac','def','pas'],RB:['pac','def','pas'],CB:['def','phy','pas'],GK:['def','phy','pas']
};
const ROUTES=[['home','⌂','生涯'],['career','↗','赛季'],['world','◎','世界'],['achievements','♛','成就']];
const PITCH_POS=[
 ['GK',50,91],['LB',18,73],['CB',41,76],['CB',59,76],['RB',82,73],['CDM',50,59],['CM',34,47],['CM',66,47],['LW',18,28],['CAM',50,31],['RW',82,28],['ST',50,12]
];
const NATIONS=['中国','日本','韩国','法国','英格兰','西班牙','德国','意大利','葡萄牙','巴西','阿根廷','荷兰','比利时','美国','尼日利亚','塞内加尔','摩洛哥','澳大利亚'];

const ROUTE_POOL=[
 {id:'tech',icon:'◈',name:'技术精进',desc:'本赛季更容易提升传球与盘带',focus:['pas','dri'],risk:6,perk:'细节训练'},
 {id:'finish',icon:'◎',name:'终结专项',desc:'把资源集中在射门和无球跑动',focus:['sho','pac'],risk:13,perk:'终结嗅觉'},
 {id:'power',icon:'⬡',name:'身体改造',desc:'速度与身体成长更快，但伤病风险上升',focus:['pac','phy'],risk:22,perk:'爆发训练'},
 {id:'tactic',icon:'⌁',name:'战术学习',desc:'提升教练信任与位置适应',focus:['pas','def'],risk:5,perk:'战术理解'},
 {id:'media',icon:'◫',name:'扩大声量',desc:'粉丝与商业机会更多，但舆论波动变大',focus:['dri'],risk:17,perk:'媒体热度'},
 {id:'recovery',icon:'◇',name:'恢复赛季',desc:'降低疲劳和伤病风险，成长略慢',focus:['phy'],risk:1,perk:'科学恢复'},
 {id:'leader',icon:'♛',name:'领袖路线',desc:'更衣室与教练关系收益更高',focus:['pas','phy'],risk:9,perk:'领袖气质'},
 {id:'loan',icon:'↗',name:'争取外租',desc:'更容易得到稳定出场与低级别核心定位',focus:['pac','pas'],risk:12,perk:'比赛经验'},
 {id:'wild',icon:'✦',name:'自由发挥',desc:'结果波动更大，更容易出现稀有事件',focus:['dri','sho'],risk:28,perk:'灵光一现'},
 {id:'position',icon:'▦',name:'开发新位置',desc:'获得第二位置与更广的球队需求',focus:['pas','def'],risk:11,perk:'多面手'},
 {id:'fans',icon:'♥',name:'球迷路线',desc:'主场表现和粉丝增长更快',focus:['sho','dri'],risk:8,perk:'球迷宠儿'},
 {id:'agent',icon:'◇',name:'经纪布局',desc:'转会与合同选项更丰富',focus:['pas'],risk:10,perk:'谈判筹码'}
];

const MATCH_SCENARIOS={
 attack:[
  ['单刀机会','你反越位成功，只剩门将。',['挑射','推射远角','大力抽射','过掉门将','横传队友']],
  ['禁区混战','皮球在六六码附近连续折射。',['第一时间捅射','停球后再打','抢前点','后撤找二点','制造点球']],
  ['反击二打一','你与队友高速推进。',['自己完成','提前直塞','吸引后横传','减速等待支援','远距离吊射']],
  ['背身拿球','中卫紧贴，你在禁区弧顶接球。',['强行转身','回做再前插','护球造犯规','脚后跟做球','拉边带走防守']],
  ['补时定位球','最后一次角球，你站在门前。',['前点冲顶','后点包抄','干扰门将','后撤远射','战术角球']]
 ],
 creative:[
  ['中路三打三','你在禁区前获得控球权。',['直塞身后','连续盘带','分到弱侧','远射','回传重组']],
  ['高压逼抢','对手中场接球失误。',['立即抢断','封锁传球线','呼叫队友夹击','回撤保护','犯规阻止反击']],
  ['定位球机会','禁区前任意球由你处理。',['直接射门','传后点','低平球配合','假跑战术','快速开出']],
  ['节奏失控','球队连续丢失球权。',['降低节奏','加快传递','更多个人带球','长传转移','回撤接应']],
  ['决赛最后十分钟','双方体能都接近极限。',['压上冒险','控制球权','寻找远射','持续传中','拖入加时']]
 ],
 defense:[
  ['对手快速反击','你身后出现大片空间。',['提前上抢','边退边防','战术犯规','呼叫协防','封锁内线']],
  ['禁区内一对一','对手准备变向射门。',['果断下脚','保持距离','封堵射门','逼向边线','等待门将出击']],
  ['高空球争顶','长传落向你负责的区域。',['正面争顶','保护第二点','提前卡位','回传门将','冒险头球解围']],
  ['最后一次角球','球队只领先一球。',['盯人防守','区域保护','守门线','准备反击','主动争顶']],
  ['后场出球','对手开始全场压迫。',['短传破解','直接长传','自己推进','回传门将','制造界外球']]
 ],
 keeper:[
  ['门线近距离扑救','对手在小禁区起脚。',['扩大封堵面积','提前倒地','等待射门方向','用脚挡出','出击抢球']],
  ['单刀球','前锋高速冲入禁区。',['迅速出击','留在门线','封住近角','诱导挑射','战术犯规']],
  ['点球大战','你面对对手头号罚球手。',['提前扑左','提前扑右','站中间','延迟移动','干扰罚球手']],
  ['高空传中','皮球落向六码区。',['直接摘球','双拳击出','留在门线','呼喊后卫解围','快速出击']],
  ['后场组织','对手封锁短传路线。',['长传边路','直传中场','继续短传','自己带球','开向前锋']]
 ]
};

let DATA={clubs:[],leagues:[],legendTemplates:[],achievements:[],eventIndex:[],events:{},version:null};
let state=null,route='home',createDraft=null,worldLimit=40,worldFilter='全部',worldSearch='',achievementLimit=40;

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
const fmt=n=>new Intl.NumberFormat('zh-CN').format(Math.round(n||0));
const money=n=>n>=1e8?`€${(n/1e8).toFixed(2)}亿`:n>=1e4?`€${(n/1e4).toFixed(n<1e6?1:0)}万`:`€${fmt(n)}`;
const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rngFrom=s=>{let x=hash(s)||123456789;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}};
const pick=(arr,r=Math.random)=>arr[Math.floor(r()*arr.length)];
const shuffle=(arr,r=Math.random)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const transition=fn=>document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches?document.startViewTransition(fn):fn();
const save=()=>state&&localStorage.setItem(STORAGE,JSON.stringify(state));
const load=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch{return null}};
const club=id=>DATA.clubs.find(c=>c.id===id)||DATA.clubs[0];
const attrLabel=k=>ATTR_CN[k]||k;

function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800)}
function openSheet(html,{locked=false}={}){overlay.hidden=false;sheet.hidden=false;sheet.dataset.locked=locked?'1':'';sheet.innerHTML=html;document.body.style.overflow='hidden'}
function closeSheet(){if(sheet.dataset.locked==='1')return;overlay.hidden=true;sheet.hidden=true;sheet.innerHTML='';document.body.style.overflow=''}
overlay.addEventListener('click',closeSheet);
function sheetShell(title,subtitle,body,progress=0,closable=true){return `<div class="sheet-handle"></div><div class="flow-progress"><i style="width:${progress}%"></i></div><div class="sheet-head"><div><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div>${closable?'<button class="close-btn" data-close>×</button>':''}</div>${body}`}
function wireClose(){const b=$('[data-close]',sheet);if(b)b.onclick=()=>{delete sheet.dataset.locked;closeSheet()}}

function ovrOf(attrs,pos){const w=POS_WEIGHTS[pos]||POS_WEIGHTS.ST;return Math.round(ATTRS.reduce((sum,k,i)=>sum+(attrs[k]||0)*w[i],0))}
function tierFromOvr(n){return n>=90?'传奇':n>=84?'世界级':n>=78?'顶级':n>=72?'优秀':n>=66?'职业级':'潜力股'}
function stageOf(s){if(s.youth)return'青训期';if(s.age<=21)return'突破期';if(s.age<=28)return'成长期';if(s.age<=32)return'巅峰期';return'生涯末期'}
function roleOf(s){const c=club(s.clubId);const score=s.ovr-c.rep+(s.coachTrust??50)*.08+(s.morale??70)*.04;
 if(s.youth)return s.ovr>=c.rep-7?'青年队核心':'青年队新人';
 if(score<-8)return'替补';if(score<-3)return'轮换';if(score<4)return'主力';if(score<10)return'核心';return'队长核心';}
function crestStyle(c){const h=hash(c.id);return `--c1:hsl(${h%360} 78% 59%);--c2:hsl(${(h+78)%360} 70% 48%)`}
function radarSvg(attrs,size=230){
 const cx=115,cy=115,R=78,levels=5,pts=[];
 for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;const v=clamp((attrs[ATTRS[i]]||0)/100,0,1);pts.push([cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v])}
 const poly=pts.map(p=>p.join(',')).join(' ');
 let grids='';for(let l=1;l<=levels;l++){const rr=R*l/levels;const p=[];for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}grids+=`<polygon class="grid" points="${p.map(x=>x.join(',')).join(' ')}"/>`}
 let axes='',labels='';for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;axes+=`<line class="axis" x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}"/>`;const lr=99;labels+=`<text x="${cx+Math.cos(a)*lr}" y="${cy+Math.sin(a)*lr+4}" text-anchor="middle">${ATTR_CN[ATTRS[i]]}</text>`}
 return `<svg class="radar" viewBox="0 0 230 230" width="${size}" height="${size}" aria-label="六边形能力图">${grids}${axes}<polygon class="shape" points="${poly}"/>${labels}</svg>`
}
function playerCard(s,{compact=false}={}){
 const c=club(s.clubId),skin=s.ovr>=88?'gold':s.rarity==='极品'?'elite':'';
 return `<article class="player-card ${skin}">
  <div class="card-top"><div class="rating-block"><b>${s.ovr}</b><span>${POS_CN[s.pos]}</span></div><div class="club-block"><b>${esc(s.nation)}</b><span>${esc(c.cn)}</span><span>${esc(c.leagueCn)}</span></div></div>
  <div class="player-name">${esc(s.name)}</div><div class="player-sub">${esc(s.templateName||tierFromOvr(s.ovr))} · 潜力 ${s.potential}</div>
  <div class="radar-wrap">${radarSvg(s.attrs)}</div>
  <div class="attr-row">${ATTRS.map(k=>`<div><small>${ATTR_CN[k]}</small><b>${s.attrs[k]}</b></div>`).join('')}</div>
  <div class="card-foot"><div><small>粉丝</small><b>${fmt(s.fans)}</b></div><div><small>身价</small><b>${money(s.value)}</b></div><div><small>队内角色</small><b>${esc(roleOf(s))}</b></div></div>
 </article>`
}

async function fetchJson(url){const r=await fetch(`${url}${url.includes('?')?'&':'?'}v=18.0.0`,{cache:'no-store'});if(!r.ok)throw new Error(`${url} 载入失败`);return r.json()}
async function loadData(){
 const [clubs,legendTemplates,achievements,eventIndex,version]=await Promise.all([
  fetchJson('data/clubs.json'),fetchJson('data/legend-templates.json'),fetchJson('data/achievements.json'),fetchJson('data/events/index.json'),fetchJson('data/version.json')
 ]);
 DATA.clubs=clubs.clubs;DATA.leagues=clubs.leagues;DATA.legendTemplates=legendTemplates;DATA.achievements=achievements;DATA.eventIndex=eventIndex;DATA.version=version;
}
async function loadEventCategory(cat){if(DATA.events[cat])return DATA.events[cat];const meta=DATA.eventIndex.find(x=>x.category===cat);if(!meta)return[];DATA.events[cat]=await fetchJson(meta.file);return DATA.events[cat]}

function renderTop(){
 topbar.hidden=false;view.classList.remove('creating-view');
 topbar.innerHTML=`<button class="brand" data-route="home"><span class="brand-mark">⚽</span><span class="brand-copy"><b>${state?esc(state.name):'绿茵浮沉'}</b><small>${state?`${club(state.clubId).cn} · ${state.age}岁 · 第${state.season}季`:'球员的一生'}</small></span></button><span class="top-spacer"></span>${state?`<span class="top-ovr"><small>总评</small><b>${state.ovr}</b></span>`:''}<button class="round-btn" data-menu>•••</button>`;
}
function renderNav(){nav.hidden=!state;nav.innerHTML=state?ROUTES.map(([r,i,t])=>`<button data-route="${r}" class="${route===r?'active':''}"><i>${i}</i><span>${t}</span></button>`).join(''):''}
function setRoute(r){route=r;renderTop();renderNav();transition(()=>({home:renderHome,career:renderCareer,world:renderWorld,achievements:renderAchievements}[r]||renderHome)());scrollTo({top:0,behavior:'instant'})}

function renderWelcome(){
 state=null;renderTop();renderNav();
 const demo={name:'你的名字',nation:'中国',pos:'CAM',ovr:68,potential:91,youth:true,attrs:{pac:72,sho:67,pas:76,dri:79,def:40,phy:64},clubId:DATA.clubs.find(c=>c.country==='中国'&&c.rep<=76)?.id||DATA.clubs[0].id,fans:1824,value:350000,templateName:'自由前场创造者'};
 view.innerHTML=`<section class="hero"><div class="hero-copy"><div class="eyebrow">V18 · 肉鸽生涯重构</div><h1>十分钟<br>走完球员一生</h1><p>从青年队开始。每个赛季都会出现不同路线、不同五项抉择、不同比赛瞬间和一次转会窗口。能力、粉丝、关系、伤病与隐藏天赋会把你送往完全不同的结局。</p><div class="hero-actions"><button class="primary" id="newCareer">创建新球员</button>${load()?'<button class="secondary" id="continueCareer">继续生涯</button>':''}</div><div class="tags" style="margin-top:18px"><span class="tag green">3200种独立选择</span><span class="tag gold">330项成就</span><span class="tag">500家真实俱乐部</span><span class="tag">500个传奇模板</span></div></div><div class="hero-visual">${playerCard(demo)}</div></section>`;
 $('#newCareer').onclick=()=>startCreation();
 const cont=$('#continueCareer');if(cont)cont.onclick=()=>{state=load();migrateState();setRoute('home')};
}

function startCreation(){
 topbar.hidden=true;nav.hidden=true;view.classList.add('creating-view');
 createDraft={step:1,name:'赵天佑',nation:'中国',pos:'ST',rerolls:3,candidates:[],selected:0,seed:`V18-${Date.now()}-${Math.floor(Math.random()*99999)}`};
 renderCreation();
}
function renderCreation(){
 const d=createDraft;
 const body=d.step===1?creationIdentity():d.step===2?creationPosition():d.step===3?creationTalent():creationConfirm();
 view.innerHTML=`<div class="create-shell"><div class="stepper">${[1,2,3,4].map(n=>`<span class="${n<=d.step?'active':''}"></span>`).join('')}</div><section class="card create-card">${body}</section></div>`;
 wireCreation();
}
function creationIdentity(){return `<div class="eyebrow">第一步 · 身份</div><h1>创建你的球员</h1><p>这一局从16岁青年队开始。姓名与国家会影响初始俱乐部、国家队路线和部分专属事件。</p><div class="form-grid"><div class="field"><label>球员姓名</label><input id="createName" value="${esc(createDraft.name)}" maxlength="12"></div><div class="field"><label>国籍</label><select id="createNation">${NATIONS.map(n=>`<option ${n===createDraft.nation?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="hero-actions"><button class="primary" data-next>选择位置</button></div>`}
function creationPosition(){return `<div class="eyebrow">第二步 · 位置</div><h1>在球场上选择位置</h1><p>位置不仅改变能力权重，也会改变比赛事件、统计数据、奖项与隐藏结局。</p><div class="pitch"><div class="box-top"></div><div class="box-bottom"></div>${PITCH_POS.map(([p,x,y],i)=>`<button class="pos-btn ${createDraft.pos===p?'active':''}" style="left:${x}%;top:${y}%" data-pos="${p}">${POS_CN[p]}</button>`).join('')}</div><div class="hero-actions"><button class="secondary" data-back>返回</button><button class="primary" data-next>抽取天赋</button></div>`}
function creationTalent(){
 if(!createDraft.candidates.length)createDraft.candidates=drawCandidates();
 return `<div class="eyebrow">第三步 · 球探抽签</div><h1>三名候选球员</h1><p>每次抽取都会改变初始能力、潜力和生涯模板。传奇模板出现概率很低，所有位置均匀分布。</p><div class="candidate-grid">${createDraft.candidates.map((c,i)=>`<button class="candidate ${i===createDraft.selected?'active':''}" data-candidate="${i}"><div class="mini-rating">${c.ovr}</div><h3>${esc(c.templateName)}</h3><p>${esc(c.description)}</p><span class="rarity ${c.rarity==='传奇模板'?'legend':''}">${c.rarity}</span><div class="mini-attrs">${ATTRS.map(k=>`<span>${ATTR_CN[k]}<b>${c.attrs[k]}</b></span>`).join('')}</div></button>`).join('')}</div><div class="hero-actions"><button class="secondary" data-back>返回</button><button class="ghost" id="reroll" ${createDraft.rerolls<=0?'disabled':''}>重抽（剩${createDraft.rerolls}）</button><button class="primary" data-next>确认候选人</button></div>`
}
function creationConfirm(){const c=createDraft.candidates[createDraft.selected];const temp={...c,name:createDraft.name,nation:createDraft.nation,pos:createDraft.pos,youth:true,clubId:starterClub(createDraft.nation,c.ovr).id,fans:120+Math.floor(hash(createDraft.seed)%500),value:120000,salary:0,coachTrust:42,morale:72};return `<div class="eyebrow">第四步 · 确认</div><h1>球探报告已完成</h1><p>你将进入${club(temp.clubId).cn}青年队。真正的能力成长、转会和荣誉要靠每个赛季的选择争取。</p><div class="grid-2"><div>${playerCard(temp)}</div><div class="stack"><div class="soft-card"><h3>球探结论</h3><div class="tags"><span class="tag gold">${esc(c.rarity)}</span><span class="tag green">潜力 ${c.potential}</span><span class="tag">${POS_CN[createDraft.pos]}</span><span class="tag">${esc(c.templateName)}</span></div><p style="color:var(--muted);line-height:1.7">${esc(c.description)}</p></div><div class="soft-card"><h3>青年队起点</h3><p>${club(temp.clubId).cn}<br>${club(temp.clubId).leagueCn}<br>队内角色：青年队新人</p></div><button class="primary full" id="startCareer">开始生涯</button><button class="secondary full" data-back>重新选择</button></div></div>`}
function wireCreation(){
 const n=$('#createName');if(n)n.oninput=e=>createDraft.name=e.target.value.trim()||'无名球员';
 const nat=$('#createNation');if(nat)nat.onchange=e=>createDraft.nation=e.target.value;
 $$('[data-pos]').forEach(b=>b.onclick=()=>{createDraft.pos=b.dataset.pos;renderCreation()});
 $$('[data-candidate]').forEach(b=>b.onclick=()=>{createDraft.selected=+b.dataset.candidate;renderCreation()});
 const rr=$('#reroll');if(rr)rr.onclick=()=>{if(createDraft.rerolls>0){createDraft.rerolls--;createDraft.candidates=drawCandidates();createDraft.selected=0;renderCreation()}};
 $$('[data-next]').forEach(b=>b.onclick=()=>{if(createDraft.step===1&&createDraft.name.length<2){showToast('姓名至少需要两个字');return}createDraft.step++;renderCreation()});
 $$('[data-back]').forEach(b=>b.onclick=()=>{createDraft.step=Math.max(1,createDraft.step-1);renderCreation()});
 const start=$('#startCareer');if(start)start.onclick=createStateFromDraft;
}
function baseCandidate(pos,r,rarity){
 const bases={ST:[66,68,57,63,36,66],LW:[70,61,60,70,34,57],RW:[70,61,60,70,34,57],CAM:[62,61,69,71,39,56],CM:[59,55,70,67,54,62],CDM:[56,48,62,57,70,68],LB:[68,48,59,61,67,65],RB:[68,48,59,61,67,65],CB:[53,42,54,51,72,72],GK:[48,39,58,44,73,71]};
 const add=rarity==='极品'?6:rarity==='稀有'?3:0,attrs={};ATTRS.forEach((k,i)=>attrs[k]=clamp(bases[pos][i]+add+Math.floor(r()*7)-3,38,78));
 const names={ST:['禁区终结者','高速冲击中锋','全能支点'],LW:['左路爆点','内切射手','自由边锋'],RW:['右路魔术师','内切终结者','创造型边锋'],CAM:['前场自由人','十号组织者','持球核心'],CM:['中场节拍器','全能八号位','推进型中场'],CDM:['防线屏障','组织后腰','抢断核心'],LB:['高速左闸','内收边卫','攻守全能左后卫'],RB:['高速右闸','组织边卫','攻守全能右后卫'],CB:['制空中卫','出球中卫','速度型中卫'],GK:['门线专家','清道夫门将','大赛门神']};
 return {templateName:pick(names[pos],r),description:rarity==='极品'?'同龄人中极少见的完整天赋，豪门会更早关注。':rarity==='稀有'?'有明确长板，正确培养可以进入顶级联赛。':'基础普通，但路线选择会决定最终上限。',rarity,attrs,potential:rarity==='极品'?92+Math.floor(r()*6):rarity==='稀有'?84+Math.floor(r()*9):74+Math.floor(r()*14)};
}
function drawCandidates(){
 const r=rngFrom(createDraft.seed+'-'+createDraft.rerolls+'-'+createDraft.pos),list=[];
 for(let i=0;i<3;i++){
  const roll=r();
  if(roll<.012){
   const pool=DATA.legendTemplates.filter(x=>x.position===createDraft.pos),t=pick(pool,r),attrs={};ATTRS.forEach(k=>attrs[k]=clamp(Math.round(t.attrs[k]*.73)+Math.floor(r()*5),55,78));
   list.push({templateName:`${t.name}式·${t.label.split('·').pop()}`,description:t.description,rarity:'传奇模板',attrs,potential:t.potential});
  }else list.push(baseCandidate(createDraft.pos,r,roll<.16?'极品':roll<.48?'稀有':'普通'));
 }
 if(!list.some(x=>x.rarity==='极品'||x.rarity==='传奇模板'))list[1]=baseCandidate(createDraft.pos,r,'极品');
 list.forEach(c=>c.ovr=ovrOf(c.attrs,createDraft.pos));return list;
}
function starterClub(nation,ovr){
 let pool=DATA.clubs.filter(c=>c.country===nation&&c.rep>=58&&c.rep<=74);
 if(!pool.length)pool=DATA.clubs.filter(c=>c.rep>=58&&c.rep<=71);
 const r=rngFrom(createDraft.seed+nation+ovr);return pick(pool,r);
}
function createStateFromDraft(){
 const c=createDraft.candidates[createDraft.selected],start=starterClub(createDraft.nation,c.ovr);
 state={
  version:18,id:`save-${Date.now()}`,seed:createDraft.seed,name:createDraft.name,nation:createDraft.nation,pos:createDraft.pos,age:16,season:1,year:2026,
  clubId:start.id,youth:true,attrs:{...c.attrs},ovr:c.ovr,potential:c.potential,rarity:c.rarity,templateName:c.templateName,
  fans:180+Math.floor(Math.random()*500),fame:2,value:120000,salary:300,money:2000,coachTrust:42,morale:72,fitness:88,fatigue:8,
  perks:[],curses:[],secondaryPos:[],history:[],seasonLogs:[],seenEvents:[],unlocked:[],hiddenEndings:[],honours:[],transfers:0,lastTransferSeason:0,
  stats:{apps:0,goals:0,assists:0,cleanSheets:0,tackles:0,saves:0,nationalApps:0,hatTricks:0,bigGames:0,trophies:0,goldenBoots:0,playerAwards:0,continentalTitles:0,worldCups:0,ballonDors:0,eliteSeasons:0,captainSeasons:0},
  seasonStats:{apps:0,goals:0,assists:0,cleanSheets:0,tackles:0,saves:0,rating:0},retired:false,updated:Date.now()
 };
 state.history.push({year:2026,title:`加入${start.cn}青年队`,text:`以${POS_CN[state.pos]}身份开启职业生涯。`});save();createDraft=null;setRoute('home');
}
function migrateState(){
 if(!state)return;state.version=18;state.perks=state.perks||[];state.curses=state.curses||[];state.secondaryPos=state.secondaryPos||[];state.history=state.history||[];state.seasonLogs=state.seasonLogs||[];state.seenEvents=state.seenEvents||[];state.unlocked=state.unlocked||[];state.hiddenEndings=state.hiddenEndings||[];state.honours=state.honours||[];state.stats=state.stats||{};state.seasonStats=state.seasonStats||{};for(const k of ['apps','goals','assists','cleanSheets','tackles','saves','nationalApps','hatTricks','bigGames','trophies','goldenBoots','playerAwards','continentalTitles','worldCups','ballonDors','eliteSeasons','captainSeasons'])state.stats[k]??=0;
}

function renderHome(){
 if(!state)return renderWelcome();if(state.retired)return renderRetirement();
 const c=club(state.clubId),stage=stageOf(state),next=state.age>=36?'进入退役总结':`模拟第${state.season}赛季`;
 view.innerHTML=`<div class="page-head"><div><div class="eyebrow">球员生涯 · ${stage}</div><h1>${esc(state.name)}</h1></div><p>每赛季一次路线、一次五项抉择、一次比赛瞬间和一次转会窗口。</p></div><div class="grid-2"><div>${playerCard(state)}</div><div class="pulse-panel"><section class="card"><div class="section-title" style="margin-top:0"><h2>生涯脉搏</h2><span>${c.cn}</span></div><div class="stat-chips"><div class="stat-chip"><small>粉丝总数</small><b>${fmt(state.fans)}</b><em>知名度 ${Math.round(state.fame)}</em></div><div class="stat-chip"><small>当前身价</small><b>${money(state.value)}</b><em>周薪 ${money(state.salary)}</em></div><div class="stat-chip"><small>教练信任</small><b>${Math.round(state.coachTrust)}</b><em>${roleOf(state)}</em></div><div class="stat-chip"><small>生涯阶段</small><b>${stage}</b><em>潜力 ${state.potential}</em></div></div><div class="progress-block" style="margin-top:16px">${progressRow('状态',state.morale)}${progressRow('体能',state.fitness)}${progressRow('疲劳',state.fatigue,true)}${progressRow('豪门关注',eliteInterest())}</div></section><section class="card"><div class="section-title" style="margin-top:0"><h2>肉鸽构筑</h2><span>${state.perks.length}项增益</span></div><div class="tags">${(state.perks.length?state.perks:['尚未获得生涯特性']).slice(-8).map(x=>`<span class="tag gold">${esc(x)}</span>`).join('')}${state.curses.slice(-4).map(x=>`<span class="tag red">${esc(x)}</span>`).join('')}</div></section><button class="primary full" id="simulateSeason">${next}</button></div></div><div class="section-title"><h2>最近动态</h2><span>选择会改变后续事件池</span></div><div class="timeline">${state.history.slice(-4).reverse().map(h=>timelineItem(h)).join('')||'<div class="empty">生涯刚刚开始</div>'}</div>`;
 $('#simulateSeason').onclick=()=>state.age>=36?finishCareer():beginSeason();
}
function progressRow(label,val,invert=false){const width=invert?100-val:val;return `<div class="progress-row"><span>${label}</span><div class="bar"><i style="width:${clamp(width,0,100)}%;${invert?'background:linear-gradient(90deg,#ffd35c,#ff8f5b)':''}"></i></div><b>${Math.round(val)}</b></div>`}
function eliteInterest(){return clamp((state.ovr-67)*3+state.fame*.5+state.potential-82,0,100)}
function timelineItem(h){return `<div class="timeline-item"><div class="timeline-year">${esc(h.year)}</div><div class="timeline-body"><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></div></div>`}

async function beginSeason(){
 if(state.age>=36)return finishCareer();
 const r=rngFrom(`${state.seed}-route-${state.season}`),routes=shuffle(ROUTE_POOL,r).slice(0,3);
 openSheet(sheetShell(`第${state.season}赛季：选择路线`,`${state.age}岁 · ${club(state.clubId).cn} · ${stageOf(state)}`,`<div class="route-grid">${routes.map((x,i)=>`<button class="route-card" data-routepick="${i}"><div class="icon">${x.icon}</div><strong>风险 ${x.risk}</strong><h3>${x.name}</h3><p>${x.desc}</p></button>`).join('')}</div><button class="primary full" id="routeConfirm" disabled style="margin-top:16px">先选一个路线</button>`,12,false),{locked:true});
 let selected=-1;$$('[data-routepick]',sheet).forEach(b=>b.onclick=()=>{selected=+b.dataset.routepick;$$('[data-routepick]',sheet).forEach(x=>x.classList.toggle('active',x===b));$('#routeConfirm').disabled=false;$('#routeConfirm').textContent=`采用：${routes[selected].name}`});
 $('#routeConfirm').onclick=()=>{const rt=routes[selected];applyRoute(rt);runMainEvent(rt)};
}
function applyRoute(rt){state.currentRoute=rt;for(const k of rt.focus)state.attrs[k]=clamp(state.attrs[k]+(Math.random()<.35?1:0),30,99);state.fatigue=clamp(state.fatigue+rt.risk*.15,0,100);if(!state.perks.includes(rt.perk)&&Math.random()<.4)state.perks.push(rt.perk);save()}
function eventCategoryForSeason(){
 const stage=stageOf(state),pool=stage==='青训期'?['academy','training','coach','rivalry','teammate']:stage==='突破期'?['training','tactics','match','rivalry','media','agent','transfer','national']:stage==='成长期'?['match','coach','media','fans','agent','transfer','contract','national','sponsor','leadership']:stage==='巅峰期'?['match','national','sponsor','leadership','legacy','contract','family','finance']:['injury','recovery','legacy','family','finance','leadership','contract'];
 const r=rngFrom(`${state.seed}-category-${state.season}`);return pick(pool,r);
}
async function runMainEvent(routeChoice){
 const cat=eventCategoryForSeason(),list=await loadEventCategory(cat),r=rngFrom(`${state.seed}-event-${state.season}-${cat}`);
 let pool=list.filter(e=>!state.seenEvents.includes(e.id));if(!pool.length)pool=list;const ev=pick(pool,r);state.seenEvents.push(ev.id);if(state.seenEvents.length>500)state.seenEvents=state.seenEvents.slice(-350);save();
 sheet.innerHTML=sheetShell(ev.title,`${ev.categoryCn} · ${ev.phase} · ${ev.pressure}`,`<div class="event-icon">${eventIcon(cat)}</div><p style="color:var(--muted);line-height:1.75">${esc(ev.description)}</p><div class="tags" style="margin:12px 0 18px"><span class="tag">${club(state.clubId).cn}</span><span class="tag green">${roleOf(state)}</span><span class="tag gold">路线：${routeChoice.name}</span></div><div class="choice-list">${ev.choices.map((ch,i)=>`<button class="choice-card" data-choice="${i}"><strong>选择 ${i+1}</strong><h3>${esc(ch.text)}</h3><p>${esc(ch.hint)}</p><span class="focus">重点：${ATTR_CN[ch.focus]}</span><span class="risk">${ch.style==='safe'||ch.style==='professional'?'稳健':ch.style==='gamble'?'高风险':'有波动'}</span></button>`).join('')}</div>`,35,false);
 $$('[data-choice]',sheet).forEach(b=>b.onclick=()=>resolveEventChoice(ev,ev.choices[+b.dataset.choice]));
}
function eventIcon(cat){return ({academy:'🎓',training:'↗',tactics:'▦',match:'⚽',rivalry:'⚔',coach:'♟',teammate:'🤝',media:'◫',fans:'♥',agent:'◇',transfer:'✈',contract:'⌁',injury:'✚',recovery:'♨',national:'⚑',sponsor:'★',family:'⌂',finance:'€',leadership:'♛',legacy:'🏆'})[cat]||'✦'}
function resolveEventChoice(ev,ch){
 const focus=state.attrs[ch.focus],seed=`${state.seed}-${state.season}-${ev.id}-${ch.id}`,r=rngFrom(seed);let p=ch.base+(focus-65)*.006+(state.morale-50)*.002+(state.coachTrust-50)*.0015;
 if(state.perks.includes('灵光一现'))p+=.03;if(state.curses.includes('舆论风暴')&&ev.category==='media')p-=.08;p=clamp(p,.18,.92);
 const roll=r(),quality=roll<p*.2?'great':roll<p?'good':roll<p+.18?'neutral':roll<p+.32?'bad':'disaster';
 showChanceAnimation(seed,()=>{applyChoiceOutcome(ch,quality);showChoiceResult(ev,ch,quality)});
}
function showChanceAnimation(seed,next){
 const modes=['wheel','cards','dice'],mode=modes[hash(seed)%modes.length];
 const visual=mode==='wheel'?'<div class="chance-wheel"></div>':mode==='cards'?'<div class="cards-anim"><i></i><i></i><i></i></div>':'<div class="dice">⚄</div>';
 sheet.innerHTML=sheetShell('正在判定结果','能力、状态、关系与风险共同决定概率',`<div class="result-stage">${visual}<h3 style="margin-top:20px">命运正在落下</h3></div>`,48,false);setTimeout(next,900);
}
function applyChoiceOutcome(ch,q){
 const mult={great:1.65,good:1,neutral:.35,bad:-.5,disaster:-1.05}[q],e=ch.effects;
 state.attrs[ch.focus]=clamp(state.attrs[ch.focus]+Math.max(0,Math.round(e.xp/28*mult)),30,99);
 state.coachTrust=clamp(state.coachTrust+e.trust*mult,0,100);state.morale=clamp(state.morale+e.morale*mult,0,100);state.fans=Math.max(0,state.fans+Math.round(e.fans*mult));state.fitness=clamp(state.fitness+e.fitness*mult,0,100);state.money=Math.max(0,state.money+Math.round(e.money*mult));state.fatigue=clamp(state.fatigue+(q==='bad'||q==='disaster'?7:-2),0,100);
 if((q==='great'||q==='disaster')&&Math.random()<.38){const pool=q==='great'?['大场面球员','冷静决策','训练狂热','关键先生','战术悟性','粉丝宠儿','逆境反击']:['舆论风暴','过度训练','信任裂痕','旧伤隐患','经纪冲突'];const trait=pick(pool);const target=q==='great'?state.perks:state.curses;if(!target.includes(trait))target.push(trait)}
 state.ovr=ovrOf(state.attrs,state.pos);save();
}
function showChoiceResult(ev,ch,q){
 const info={great:['大成功','这次决定打开了新的上限。','good'],good:['成功','选择带来了稳定收益。','good'],neutral:['结果平淡','没有巨大变化，但你保住了路线。','good'],bad:['付出代价','结果没有按计划发展。','bad'],disaster:['严重失误','这次选择改变了后续事件池。','bad']}[q];
 sheet.innerHTML=sheetShell('判定完成',ev.title,`<div class="result-stage"><span class="result-badge ${info[2]==='bad'?'bad':''}">${info[0]}</span><h2 class="result-title">${info[1]}</h2><p class="result-copy">${esc(ch.text)}。影响已经写入能力、关系、粉丝与肉鸽构筑。</p><div class="effect-grid"><div><small>总评</small><b>${state.ovr}</b></div><div><small>教练信任</small><b>${Math.round(state.coachTrust)}</b></div><div><small>粉丝</small><b>${fmt(state.fans)}</b></div><div><small>状态</small><b>${Math.round(state.morale)}</b></div><div><small>体能</small><b>${Math.round(state.fitness)}</b></div><div><small>特性</small><b>${state.perks.length}</b></div></div><button class="primary full" id="toMatch">进入比赛关键时刻</button></div>`,55,false);
 $('#toMatch').onclick=runMatchMoment;
}
function runMatchMoment(){
 const group=POS_GROUP[state.pos],r=rngFrom(`${state.seed}-match-${state.season}`),scenario=pick(MATCH_SCENARIOS[group],r),choices=shuffle(scenario[2],r).slice(0,5);
 sheet.innerHTML=sheetShell('比赛关键时刻',scenario[0],`<div class="event-icon">⚽</div><p style="color:var(--muted);line-height:1.75">${scenario[1]}。这次选择会直接影响赛季数据和教练评价。</p><div class="choice-list">${choices.map((x,i)=>`<button class="choice-card" data-matchchoice="${i}"><strong>${i+1}</strong><h3>${esc(x)}</h3><p>${matchHint(x)}</p><span class="risk">${i===0?'冒险':i===4?'稳健':'五五开'}</span></button>`).join('')}</div>`,66,false);
 $$('[data-matchchoice]',sheet).forEach((b,i)=>b.onclick=()=>resolveMatchChoice(choices[i],i));
}
function matchHint(x){const map={'挑射':'依赖射门与冷静','推射远角':'稳定但需要角度','大力抽射':'高收益高波动','过掉门将':'依赖盘带','横传队友':'依赖传球与团队关系','直塞身后':'依赖传球视野','连续盘带':'依赖盘带与状态','远射':'依赖射门','提前上抢':'依赖防守判断','边退边防':'稳健防守','战术犯规':'避免失球但可能吃牌','迅速出击':'依赖反应与站位'};return map[x]||'根据你的能力与当前状态判定'}
function resolveMatchChoice(text,index){
 const focus=matchFocus(text),r=rngFrom(`${state.seed}-matchresolve-${state.season}-${text}`),base=.42+(state.attrs[focus]-60)*.008+(state.morale-50)*.003-(state.fatigue)*.0015+(index===4?.08:0),success=r()<clamp(base,.18,.9),great=success&&r()<.22;
 if(success){state.attrs[focus]=clamp(state.attrs[focus]+(great?2:1),30,99);state.coachTrust=clamp(state.coachTrust+(great?5:2),0,100);state.fans+=great?3200:900;state.stats.bigGames++}else{state.morale=clamp(state.morale-5,0,100);state.coachTrust=clamp(state.coachTrust-2,0,100)}state.ovr=ovrOf(state.attrs,state.pos);save();
 showChanceAnimation(`${state.seed}-match-animation-${state.season}`,()=>{sheet.innerHTML=sheetShell('比赛结果',success?(great?'完美处理':'处理成功'):'机会失败',`<div class="result-stage"><span class="result-badge ${success?'':'bad'}">${success?'成功':'失败'}</span><h2 class="result-title">${success?`${text}改变了比赛`:`${text}没有奏效`}</h2><p class="result-copy">接下来将结算完整赛季：出场、数据、能力成长、荣誉与转会市场。</p><button class="primary full" id="settleSeason">结算本赛季</button></div>`,78,false);$('#settleSeason').onclick=settleSeason});
}
function matchFocus(text){if(/射|门将|进球/.test(text))return'sho';if(/传|横|回做|直塞/.test(text))return'pas';if(/盘|过掉|带球/.test(text))return'dri';if(/抢|防|封|卡位|解围/.test(text))return'def';if(/出击|争顶|对抗/.test(text))return'phy';return'pac'}

function settleSeason(){
 const before={...state.attrs},beforeOvr=state.ovr,c=club(state.clubId),role=roleOf(state),r=rngFrom(`${state.seed}-settle-${state.season}`);
 const youthApps=state.youth?Math.floor(12+r()*15):null;let apps=state.youth?youthApps:Math.max(3,Math.round(10+(state.ovr-c.rep)*1.4+state.coachTrust*.24+r()*12));apps=clamp(apps,0,46);
 const attack=['ST','LW','RW','CAM'].includes(state.pos),creative=['CAM','CM','LW','RW'].includes(state.pos),defense=['CDM','LB','CB','RB'].includes(state.pos),keeper=state.pos==='GK';
 const goals=keeper?0:Math.max(0,Math.round(apps*(attack?.34:creative?.14:defense?.035:.02)*(state.attrs.sho/75)*(0.65+r()*.7)));
 const assists=keeper?Math.round(apps*.02*r()):Math.max(0,Math.round(apps*(creative?.25:attack?.12:defense?.08:.03)*(state.attrs.pas/75)*(0.6+r()*.8)));
 const cleanSheets=keeper||defense?Math.round(apps*(.18+(state.attrs.def-55)*.008)*(0.65+r()*.55)):0;
 const tackles=defense?Math.round(apps*(1.4+r()*1.6)):Math.round(apps*(.15+r()*.4));
 const saves=keeper?Math.round(apps*(2.1+r()*1.7)):0;
 const rating=clamp(6.1+(goals+assists)*.025+cleanSheets*.018+(state.ovr-c.rep)*.025+(r()-.5)*.7,5.7,9.4);
 state.seasonStats={apps,goals,assists,cleanSheets,tackles,saves,rating:+rating.toFixed(2)};
 for(const k of ['apps','goals','assists','cleanSheets','tackles','saves'])state.stats[k]+=state.seasonStats[k];
 if(goals>=3&&r()<.3)state.stats.hatTricks++;
 const ageCurve=state.age<=20?1.7:state.age<=24?1.28:state.age<=28?.9:state.age<=31?.42:state.age<=34?.08:-.35;
 const perf=(rating-6.4)*1.35,space=Math.max(0,(state.potential-state.ovr)/12),route=state.currentRoute;
 for(const k of ATTRS){let delta=ageCurve+perf+space*.7+(route?.focus.includes(k)?.75:0)+(POS_FOCUS[state.pos].includes(k)?.3:0)-(state.fatigue>70?.6:0);if(state.age>32&&!POS_FOCUS[state.pos].includes(k))delta-=.4;const whole=Math.trunc(delta)+(r()<Math.abs(delta%1)?Math.sign(delta):0);state.attrs[k]=clamp(state.attrs[k]+whole,28,99)}
 state.ovr=ovrOf(state.attrs,state.pos);state.value=Math.max(80000,Math.round(Math.pow(Math.max(5,state.ovr-45),3)*520*(1+state.fame/80)*(state.age<29?1:Math.max(.35,1-(state.age-28)*.08))));state.salary=Math.max(300,Math.round(state.value/5000));
 state.fans=Math.max(0,state.fans+Math.round((goals*1300+assists*900+cleanSheets*700+apps*120)*(rating/7)));
 state.fame=clamp(state.fame+(rating-6.3)*3+(goals+assists)*.12,0,100);state.morale=clamp(state.morale+(rating-6.5)*7,0,100);state.fitness=clamp(78-state.fatigue*.22,30,100);state.fatigue=clamp(18+apps*.5,0,100);
 let promoted=false;if(state.youth&&(state.ovr>=68||state.season>=2||rating>=7.4)){state.youth=false;promoted=true;state.history.push({year:state.year,title:'升入一线队',text:`青年队表现打动教练组，获得正式一线队资格。`})}
 awardSeason(goals,assists,cleanSheets,rating,c,r);
 const log={season:state.season,year:state.year,age:state.age,clubId:state.clubId,role,stats:{...state.seasonStats},before,beforeOvr,after:{...state.attrs},afterOvr:state.ovr,promoted};state.seasonLogs.push(log);
 state.history.push({year:`${state.year}/${String(state.year+1).slice(-2)}`,title:`第${state.season}赛季完成`,text:`${apps}场 ${goals}球 ${assists}助，评分${rating.toFixed(1)}，总评${beforeOvr}→${state.ovr}。`});save();
 renderSeasonSummary(log);
}
function awardSeason(goals,assists,cleanSheets,rating,c,r){
 if(goals>=24){state.honours.push({year:state.year,name:`${c.leagueCn}金靴`});state.stats.goldenBoots++;state.stats.trophies++}
 if(assists>=18){state.honours.push({year:state.year,name:`${c.leagueCn}助攻王`});state.stats.trophies++}
 if((state.pos==='GK'||['LB','CB','RB','CDM'].includes(state.pos))&&cleanSheets>=16){state.honours.push({year:state.year,name:`${c.leagueCn}最佳防守球员`});state.stats.trophies++}
 if(rating>=8&&state.ovr>=84){state.honours.push({year:state.year,name:'年度最佳球员'});state.stats.playerAwards++;state.stats.trophies++}
 if(state.ovr>=90&&state.fame>=70&&r()<.35){state.honours.push({year:state.year,name:'金球奖'});state.stats.ballonDors++;state.stats.trophies++}
 const teamChance=clamp(.06+(c.rep-65)*.012+(rating-6.5)*.06,0.04,.62);
 if(r()<teamChance){state.honours.push({year:state.year,name:`${c.leagueCn}冠军`});state.stats.trophies++}
 if(c.rep>=82&&r()<clamp(.04+(c.rep-80)*.018+(rating-7)*.04,.03,.36)){state.honours.push({year:state.year,name:'洲际俱乐部冠军'});state.stats.continentalTitles++;state.stats.trophies++}
 const nationalChance=clamp((state.ovr-70)*.035+state.fame*.006,0,.9);
 if(!state.youth&&r()<nationalChance){const nApps=clamp(Math.round(2+r()*10+(state.ovr-75)*.25),1,14);state.stats.nationalApps+=nApps;if(r()<.22)state.honours.push({year:state.year,name:'国家队年度主力'})}
 if(state.year%4===2&&state.stats.nationalApps>=20&&state.ovr>=82&&r()<.12){state.honours.push({year:state.year,name:'世界杯冠军'});state.stats.worldCups++;state.stats.trophies++}
 if(c.rep>=86)state.stats.eliteSeasons++;
 if(roleOf(state)==='队长核心')state.stats.captainSeasons++;
}
function renderSeasonSummary(log){
 const delta=ATTRS.map(k=>({k,b:log.before[k],a:log.after[k]}));
 sheet.innerHTML=sheetShell('赛季总结',`${log.year}/${String(log.year+1).slice(-2)} · ${club(log.clubId).cn}`,`<div class="summary-hero"><div class="eyebrow">赛季完成</div><h2>总评 ${log.beforeOvr} → ${log.afterOvr}</h2><p>${log.promoted?'你已从青年队升入一线队。':'能力、粉丝、身价与球队地位已完成结算。'}</p><div class="summary-grid"><div><small>出场</small><b>${log.stats.apps}</b></div><div><small>进球</small><b>${log.stats.goals}</b></div><div><small>助攻</small><b>${log.stats.assists}</b></div><div><small>评分</small><b>${log.stats.rating}</b></div></div></div><div class="delta-list">${delta.map(x=>`<div class="delta-row"><span>${ATTR_CN[x.k]}</span><div class="delta-bar"><i style="width:${x.a}%"></i></div><b>${x.b}→${x.a}</b></div>`).join('')}</div><button class="primary full" id="transferWindow">进入本赛季转会窗口</button>`,86,false);
 $('#transferWindow').onclick=openTransferWindow;
}

function openTransferWindow(){
 const offers=generateOffers(),current=club(state.clubId);
 const cards=[{clubId:current.id,stay:true,role:roleOf(state),salary:state.salary,fit:100,reason:'继续当前路线，保留已有信任与位置'},...offers];
 sheet.innerHTML=sheetShell('转会窗口','每个赛季仅一次，所有决定由玩家完成',`<div class="offer-list">${cards.map((o,i)=>{const c=club(o.clubId);return `<button class="offer-card" data-offer="${i}"><div style="display:flex;gap:12px;align-items:center"><div class="crest" style="${crestStyle(c)}">${esc(c.code?.slice(0,2)||c.cn.slice(0,1))}</div><div style="flex:1"><h3>${o.stay?'留在 ':''}${esc(c.cn)}</h3><p>${esc(c.leagueCn)} · ${o.role} · 适配度${o.fit}%</p></div></div><div class="tags" style="margin-top:12px"><span class="tag green">周薪 ${money(o.salary)}</span><span class="tag">${esc(o.reason)}</span></div></button>`}).join('')}</div><button class="primary full" id="offerConfirm" disabled style="margin-top:16px">选择一支球队</button>`,93,false);
 let selected=-1;$$('[data-offer]',sheet).forEach(b=>b.onclick=()=>{selected=+b.dataset.offer;$$('[data-offer]',sheet).forEach(x=>x.classList.toggle('active',x===b));$('#offerConfirm').disabled=false;$('#offerConfirm').textContent=cards[selected].stay?'确认留队':`加盟${club(cards[selected].clubId).cn}`});
 $('#offerConfirm').onclick=()=>completeTransfer(cards[selected]);
}
function generateOffers(){
 const current=club(state.clubId),r=rngFrom(`${state.seed}-offers-${state.season}`),score=state.ovr+state.potential*.08+state.fame*.12+state.seasonStats.rating*1.3;
 let count=state.youth?1:score<78?(r()<.45?1:0):score<88?2+Math.floor(r()*2):3+Math.floor(r()*2);count=clamp(count,0,4);
 let maxRep=clamp(state.ovr+8+state.fame*.05,64,96),minRep=Math.max(55,current.rep-6);let pool=DATA.clubs.filter(c=>c.id!==current.id&&c.rep>=minRep&&c.rep<=maxRep);
 if(state.ovr<76)pool=pool.filter(c=>c.rep<82);if(state.ovr<82)pool=pool.filter(c=>c.rep<88);pool=shuffle(pool,r);
 const offers=[];for(const c of pool){if(offers.length>=count)break;const delta=state.ovr-c.rep,role=delta>=5?'核心':delta>=0?'主力':delta>=-4?'轮换':'替补';const fit=clamp(Math.round(82-Math.abs(delta)*3+r()*16),54,98);offers.push({clubId:c.id,role,fit,salary:Math.max(state.salary*1.15,c.rep*c.rep*3.5),reason:offerReason(c,r)})}return offers;
}
function offerReason(c,r){const reasons=['看中你的潜力','需要同位置年轻球员','你的能力符合球队战术','长期球探观察完成','希望买入后重点培养','国家队前景得到认可','你的比赛风格适配当前阵容'];return pick(reasons,r)}
function completeTransfer(o){
 const old=club(state.clubId);if(!o.stay){state.clubId=o.clubId;state.salary=Math.round(o.salary);state.transfers++;state.stats.transfers=state.transfers;state.coachTrust=48;state.history.push({year:state.year,title:`转会加盟${club(o.clubId).cn}`,text:`离开${old.cn}，以${o.role}定位开始新阶段。`})}else state.history.push({year:state.year,title:`选择留在${old.cn}`,text:'继续当前发展路线，保留教练信任。'});
 checkAchievements();advanceYear();save();
 if(state.age>=36){delete sheet.dataset.locked;closeSheet();finishCareer();return}
 sheet.innerHTML=sheetShell('转会窗口关闭',o.stay?'你选择继续留队':'新俱乐部已经完成注册',`<div class="result-stage"><span class="result-badge">赛季推进</span><h2 class="result-title">${o.stay?club(state.clubId).cn:`欢迎来到${club(state.clubId).cn}`}</h2><p class="result-copy">下一赛季将重新生成路线、五项选择、比赛瞬间与转会机会。</p><button class="primary full" id="seasonDone">进入第${state.season}赛季</button></div>`,100,false);
 $('#seasonDone').onclick=()=>{delete sheet.dataset.locked;closeSheet();setRoute('home')};
}
function advanceYear(){state.age++;state.season++;state.year++;state.currentRoute=null;state.morale=clamp(state.morale+3,0,100);state.fatigue=clamp(state.fatigue-20,0,100);state.fitness=clamp(state.fitness+15,0,100);state.stats.seasons=state.season-1}

function checkAchievements(){
 const metrics={...state.stats,fans:state.fans,value:state.value,ovr:state.ovr,seasons:state.season,transfers:state.transfers};
 for(const a of DATA.achievements){if(state.unlocked.includes(a.id))continue;let ok=false;
  if(a.type==='metric')ok=(metrics[a.metric]||0)>=a.value;
  else if(a.type==='position'&&a.position===state.pos){const thresholds=[1,3,5,10,18,25,35,50,70,90,110,140];const key=['GK','CB','LB','RB','CDM'].includes(state.pos)?'cleanSheets':['CM','CAM','LW','RW'].includes(state.pos)?'assists':'goals';ok=(state.stats[key]||0)>=thresholds[a.index];}
  else if(a.type==='special')ok=specialAchievementCheck(a.index);
  else if(a.type==='hidden')ok=hiddenCheck(a.index);
  if(ok){state.unlocked.push(a.id);if(a.hidden)state.hiddenEndings.push(a.id);state.fans+=a.reward*80;showToast(`解锁成就：${a.name}`)}
 }
}
function specialAchievementCheck(i){const s=state.stats;const checks=[state.youth===false,s.trophies>=1,s.trophies>=3,s.continentalTitles>=1,s.worldCups>=1,s.trophies>=5,state.seasonStats.apps>=30,state.ovr>=80,state.ovr<70&&state.season>=6,state.stats.bigGames>=3,state.seasonStats.rating>=8,state.seasonStats.rating>=7.5,state.transfers===0,state.transfers>=5,state.transfers>=9,state.transfers>=1,state.seasonStats.goals>=1,state.seasonStats.goals>=3,state.curses.includes('旧伤隐患')&&state.ovr>=82,state.stats.captainSeasons>=1,state.stats.captainSeasons>=5,state.stats.nationalApps>=1,state.stats.nationalApps>=50,state.stats.goals>=1,state.stats.bigGames>=5,state.stats.continentalTitles>=1,state.ovr>=80,state.stats.bigGames>=8,state.stats.continentalTitles>=2,state.stats.trophies>=10,state.stats.goldenBoots>=1,state.stats.assists>=18,state.stats.cleanSheets>=15,state.age<=21&&state.ovr>=82,state.stats.playerAwards>=1,state.stats.ballonDors>=1,state.stats.playerAwards>=2,state.fans>=100000,state.fans>=10000000,state.value>=100000000,state.transfers>=3,state.stats.captainSeasons>=3,state.youth===false&&state.transfers===0,state.stats.bigGames>=10,state.stats.bigGames>=15,state.stats.bigGames>=20,state.stats.bigGames>=25,state.stats.bigGames>=30,state.stats.goals>=10,state.stats.assists>=10,state.stats.cleanSheets>=10,state.stats.trophies>=5,state.seasonStats.apps>=35,state.morale>=80,state.stats.eliteSeasons>=3,state.ovr>=85&&club(state.clubId).rep<75,state.stats.continentalTitles>=1,state.stats.continentalTitles>=2,state.stats.continentalTitles>=3,state.ovr>=92];return !!checks[i%checks.length]}
function hiddenCheck(i){const checks=[state.nation==='中国'&&state.pos==='CAM'&&state.ovr>=90,state.nation==='中国'&&state.pos==='ST'&&state.ovr>=90,state.curses.length>=3&&state.ovr>=84,state.curses.includes('旧伤隐患')&&state.stats.trophies>=5,state.stats.captainSeasons>=8,state.transfers>=10,state.transfers===0&&state.stats.trophies>=8,club(state.clubId).rep<70&&state.ovr>=88,state.stats.eliteSeasons>=1&&state.ovr<75,state.seasonStats.apps<10&&state.seasonStats.goals>=5,state.pos==='CAM'&&state.stats.assists>=100,state.pos==='GK'&&state.stats.cleanSheets>=100,state.stats.trophies===0&&state.ovr>=90,state.stats.trophies>=20,state.transfers>=12,state.age>=35&&state.ovr>=85,state.curses.includes('旧伤隐患')&&state.stats.ballonDors>=1,state.transfers>=8,state.nation===club(state.clubId).country&&state.age>=34,state.fans<5000&&state.ovr>=88,state.age<=18&&state.fans>=100000,state.curses.includes('舆论风暴')&&state.ovr>=88,state.fans>=1000000,state.perks.includes('训练狂热')&&state.ovr>=88,state.potential>=95&&state.ovr<80,state.age>=29&&state.ovr>=90,state.age<=16&&state.youth===false,state.age>=36,state.transfers===0,state.transfers>=8,state.stats.nationalApps>=100,state.stats.captainSeasons>=5,state.stats.worldCups>=1,state.stats.continentalTitles>=1,state.stats.bigGames>=10,state.stats.bigGames>=15,state.stats.bigGames>=20,state.stats.bigGames>=25,state.seasonStats.goals>=4,state.stats.trophies===0&&state.stats.bigGames>=20,state.stats.ballonDors>=1&&club(state.clubId).rep<70,state.stats.eliteSeasons>=5&&club(state.clubId).rep<75,state.perks.includes('谈判筹码')===false&&state.transfers>=4,state.stats.trophies===0&&state.money<1000,state.money>=10000000,state.money===0,state.stats.captainSeasons>=10,state.curses.includes('信任裂痕')&&state.stats.trophies>=3,state.perks.includes('战术理解')&&state.age>=35,state.stats.ballonDors>=2];return !!checks[i%checks.length]}

function renderCareer(){
 const s=state.stats;
 view.innerHTML=`<div class="page-head"><div><div class="eyebrow">完整履历</div><h1>赛季与数据</h1></div><p>每个赛季的能力变化、球队、角色和关键选择都会被永久记录。</p></div><section class="card"><div class="summary-grid"><div><small>出场</small><b>${fmt(s.apps)}</b></div><div><small>进球</small><b>${fmt(s.goals)}</b></div><div><small>助攻</small><b>${fmt(s.assists)}</b></div><div><small>零封</small><b>${fmt(s.cleanSheets)}</b></div></div></section><div class="section-title"><h2>逐赛季履历</h2><span>${state.seasonLogs.length}个赛季</span></div><div class="timeline">${state.seasonLogs.slice().reverse().map(log=>`<div class="timeline-item"><div class="timeline-year">${log.year}</div><div class="timeline-body"><h3>${club(log.clubId).cn} · ${log.role}</h3><p>${log.stats.apps}场 ${log.stats.goals}球 ${log.stats.assists}助，评分${log.stats.rating}，总评${log.beforeOvr}→${log.afterOvr}</p></div></div>`).join('')||'<div class="empty card">完成第一个赛季后，这里会出现完整履历。</div>'}</div><div class="section-title"><h2>生涯特性</h2><span>影响后续概率</span></div><section class="card"><div class="tags">${state.perks.map(x=>`<span class="tag gold">${esc(x)}</span>`).join('')||'<span class="tag">尚未获得增益</span>'}${state.curses.map(x=>`<span class="tag red">${esc(x)}</span>`).join('')}</div></section>`;
}

function renderWorld(){
 const filtered=DATA.clubs.filter(c=>(worldFilter==='全部'||c.tier===worldFilter)&&(worldSearch===''||c.cn.includes(worldSearch)||c.country.includes(worldSearch)||c.leagueCn.includes(worldSearch)));
 view.innerHTML=`<div class="page-head"><div><div class="eyebrow">500家真实俱乐部</div><h1>足球世界</h1></div><p>俱乐部强度用于游戏化转会匹配，不复制任何官方专有评分数据库。</p></div><div class="filters">${['全部','S','A','B','C','D'].map(x=>`<button data-filter="${x}" class="${worldFilter===x?'active':''}">${x==='全部'?'全部球队':x+'级'}</button>`).join('')}</div><input class="search" id="clubSearch" placeholder="搜索球队、国家或联赛" value="${esc(worldSearch)}"><div class="club-list">${filtered.slice(0,worldLimit).map(c=>clubRow(c)).join('')}</div>${worldLimit<filtered.length?'<button class="secondary full" id="loadMore" style="margin-top:14px">继续显示</button>':''}`;
 $$('[data-filter]').forEach(b=>b.onclick=()=>{worldFilter=b.dataset.filter;worldLimit=40;renderWorld()});
 $('#clubSearch').oninput=e=>{worldSearch=e.target.value.trim();worldLimit=40;renderWorld();const s=$('#clubSearch');s.focus();s.setSelectionRange(s.value.length,s.value.length)};
 const more=$('#loadMore');if(more)more.onclick=()=>{worldLimit+=40;renderWorld()};
}
function clubRow(c){return `<div class="club-row"><div class="crest" style="${crestStyle(c)}">${esc(c.code?.slice(0,2)||c.cn.slice(0,1))}</div><div><h3>${esc(c.cn)}</h3><p>${esc(c.country)} · ${esc(c.leagueCn)}</p></div><div class="club-level"><b>${c.tier} · ${c.rep}</b><small>球队强度</small></div></div>`}

function renderAchievements(){
 const unlocked=new Set(state.unlocked),visible=DATA.achievements.filter(a=>!a.hidden||unlocked.has(a.id)),shown=visible.slice(0,achievementLimit);
 view.innerHTML=`<div class="page-head"><div><div class="eyebrow">330项成就与隐藏结局</div><h1>成就陈列室</h1></div><p>不同位置拥有不同目标。隐藏成就只在解锁后显示名称。</p></div><section class="card"><div class="summary-grid"><div><small>已解锁</small><b>${state.unlocked.length}</b></div><div><small>隐藏结局</small><b>${state.hiddenEndings.length}</b></div><div><small>奖项</small><b>${state.honours.length}</b></div><div><small>完成率</small><b>${Math.round(state.unlocked.length/DATA.achievements.length*100)}%</b></div></div></section><div class="section-title"><h2>奖项与纪录</h2><span>${state.honours.length}项</span></div><section class="card"><div class="tags">${state.honours.slice().reverse().map(x=>`<span class="tag gold">${x.year} · ${esc(x.name)}</span>`).join('')||'<span class="tag">尚未获得重要奖项</span>'}</div></section><div class="section-title"><h2>全部成就</h2><span>${shown.length}/${visible.length}项</span></div><div class="achievement-grid">${shown.map(a=>`<article class="achievement ${unlocked.has(a.id)?'':'locked'}"><div class="medal">${unlocked.has(a.id)?'🏆':'◌'}</div><h3>${esc(a.name)}</h3><p>${esc(a.description)}</p><small>${unlocked.has(a.id)?'已解锁':'未完成'}</small></article>`).join('')}</div>${achievementLimit<visible.length?'<button class="secondary full" id="loadAchievements" style="margin-top:14px">继续显示成就</button>':''}`;
 const more=$('#loadAchievements');if(more)more.onclick=()=>{achievementLimit+=40;renderAchievements()};
}

function finishCareer(){state.retired=true;checkAchievements();save();renderRetirement()}
function endingFor(){
 const s=state.stats;
 if(s.ballonDors>=3&&s.worldCups>=1)return['世界球王','你同时统治俱乐部与国家队，完成了足球史上最完整的生涯。'];
 if(state.transfers===0&&s.trophies>=8)return['一人一城','从青年队到退役，你把一支球队写进自己的名字。'];
 if(state.pos==='GK'&&s.cleanSheets>=120)return['门线守护神','你的职业生涯由无数次扑救和零封组成。'];
 if(club(state.clubId).rep<72&&state.ovr>=88)return['小球会奇迹','你没有依靠豪门，却成为整个联赛的传奇。'];
 if(state.curses.length>=3&&state.ovr>=86)return['逆境之王','伤病、舆论和关系危机没有阻止你登顶。'];
 if(s.trophies===0&&state.ovr>=88)return['无冕传奇','你没有捧起最多奖杯，却让所有对手记住了你的能力。'];
 if(state.ovr>=92)return['时代巨星','巅峰能力足以进入任何时代的最佳阵容。'];
 if(s.trophies>=10)return['冠军收割机','你把每一次转会都变成奖杯。'];
 return['职业球员的一生','没有唯一正确路线。你的选择组成了一段不可复制的足球人生。'];
}
function renderRetirement(){
 renderTop();renderNav();const [title,desc]=endingFor(),s=state.stats;
 view.innerHTML=`<div class="page-head"><div><div class="eyebrow">生涯结束 · ${state.age}岁</div><h1>${esc(title)}</h1></div><p>隐藏结局由整段生涯中的能力、俱乐部、伤病、荣誉和选择共同决定。</p></div><div class="grid-2"><div>${playerCard(state)}</div><div class="stack"><section class="card"><h2 style="font-size:30px;margin-top:0">${esc(desc)}</h2><div class="summary-grid"><div><small>赛季</small><b>${state.season-1}</b></div><div><small>出场</small><b>${fmt(s.apps)}</b></div><div><small>进球</small><b>${fmt(s.goals)}</b></div><div><small>助攻</small><b>${fmt(s.assists)}</b></div><div><small>奖项</small><b>${state.honours.length}</b></div><div><small>粉丝</small><b>${fmt(state.fans)}</b></div><div><small>最高总评</small><b>${Math.max(state.ovr,...state.seasonLogs.map(x=>x.afterOvr||0))}</b></div><div><small>俱乐部</small><b>${new Set(state.seasonLogs.map(x=>x.clubId)).size}</b></div></div></section><button class="primary full" id="restartCareer">开始另一段人生</button><button class="secondary full" data-route="career">查看完整履历</button></div></div>`;
 $('#restartCareer').onclick=()=>{localStorage.removeItem(STORAGE);startCreation()};
}

function openMenu(){
 openSheet(sheetShell('生涯菜单','存档只保存在当前浏览器',`<div class="stack"><button class="secondary full" id="exportSave">复制存档数据</button><button class="secondary full" id="newSave">创建新生涯</button><button class="danger full" id="deleteSave">删除当前存档</button><div class="soft-card"><b>V18.0.0</b><p style="color:var(--muted);line-height:1.6">500家俱乐部 · 500个传奇模板 · 3200种独立选择 · 330项成就</p></div></div>`,0,true));wireClose();
 $('#exportSave').onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(state));showToast('存档已复制')}catch{showToast('浏览器不允许复制')}};
 $('#newSave').onclick=()=>{delete sheet.dataset.locked;closeSheet();startCreation()};
 $('#deleteSave').onclick=()=>{if(confirm('确定删除当前生涯吗？')){localStorage.removeItem(STORAGE);delete sheet.dataset.locked;closeSheet();renderWelcome()}};
}

document.addEventListener('click',e=>{
 const r=e.target.closest('[data-route]');if(r&&state)setRoute(r.dataset.route);
 if(e.target.closest('[data-menu]'))openMenu();
});

async function init(){
 try{await loadData();boot.hidden=true;app.hidden=false;state=load();if(state){migrateState();setRoute('home')}else renderWelcome()}
 catch(err){console.error(err);boot.innerHTML=`<div class="boot-mark">!</div><strong>载入失败</strong><span>${esc(err.message)}</span><button class="primary" onclick="location.reload()">重新载入</button>`}
}
init();
})();
