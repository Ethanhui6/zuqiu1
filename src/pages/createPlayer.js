import { icon } from '../components/icons.js';
import { radarChart } from '../components/radar.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';
import { computeOverall } from '../core/playerDevelopmentEngine.js';

const positions=[
  {id:'门将',x:50,y:90,desc:'门线反应、出球与制空'},
  {id:'中后卫',x:50,y:75,desc:'对抗、站位与拦截'},
  {id:'左后卫',x:20,y:68,desc:'边路覆盖与推进'},
  {id:'右后卫',x:80,y:68,desc:'边路覆盖与推进'},
  {id:'后腰',x:50,y:57,desc:'保护防线与连接组织'},
  {id:'中场',x:50,y:43,desc:'节奏控制与攻守转换'},
  {id:'前腰',x:50,y:30,desc:'创造机会与最后一传'},
  {id:'左边锋',x:22,y:24,desc:'突破、内切与冲刺'},
  {id:'右边锋',x:78,y:24,desc:'突破、内切与冲刺'},
  {id:'前锋',x:50,y:13,desc:'跑位、终结与压迫'}
];
const styles={
  '爆发型':{speed:68,shooting:55,passing:48,dribbling:62,defending:38,physical:56},
  '技术型':{speed:58,shooting:55,passing:61,dribbling:69,defending:39,physical:45},
  '组织型':{speed:50,shooting:48,passing:70,dribbling:61,defending:46,physical:48},
  '终结型':{speed:61,shooting:70,passing:45,dribbling:57,defending:31,physical:58},
  '防守型':{speed:53,shooting:35,passing:54,dribbling:44,defending:70,physical:67},
  '全能型':{speed:57,shooting:56,passing:58,dribbling:57,defending:55,physical:58},
  '自定义混合':{speed:60,shooting:58,passing:60,dribbling:60,defending:48,physical:54}
};

function seeded(seed){ let x=0; for(const ch of seed)x=(x*31+ch.charCodeAt(0))>>>0; return ()=>((x=Math.imul(1664525,x)+1013904223>>>0)/4294967296); }
function scoutDraft(draft){ const rnd=seeded(`${draft.name}-${draft.birth}-${draft.position}-${draft.style}`); const base=styles[draft.style]||styles['全能型']; const stats=Object.fromEntries(Object.entries(base).map(([k,v])=>[k,Math.max(35,Math.min(78,Number((v+(rnd()-.5)*8).toFixed(2))))])); const potential=Math.round(70+rnd()*24); const tiers=potential>=93?'传奇迹象':potential>=89?'世代':potential>=86?'顶级':potential>=82?'精英':potential>=78?'优秀':potential>=74?'良好':'普通'; return {stats,potential,tier:tiers,confidence:Math.round(72+rnd()*23),strengths:Object.entries(stats).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k),weaknesses:Object.entries(stats).sort((a,b)=>a[1]-b[1]).slice(0,2).map(([k])=>k)}; }

export function createPlayerWizard(app){
  let step=0;
  const draft={name:'',shirtName:'',birth:'2008-03-18',country:'中国',height:178,weight:70,foot:'右脚',number:18,position:'中场',style:'技术型',club:''};
  let report=scoutDraft(draft);
  const root=document.createElement('div'); root.className='wizard-shell';
  const labels=['身份','位置','风格','球探报告','青年队','确认'];
  const render=()=>{
    report=scoutDraft(draft);
    root.innerHTML=`<div class="wizard"><div class="wizard-top"><div><div class="card-kicker">绿茵浮沉 · 创建球员</div><h1 class="page-title">${labels[step]}</h1></div><span class="badge blue">${step+1}/6</span></div><div class="stepper">${labels.map((_,i)=>`<span class="step-dot ${i<=step?'active':''}"></span>`).join('')}</div><div style="height:14px"></div><section class="surface-card">${body()}</section><div class="card-row" style="margin-top:14px"><button class="app-button ghost" data-prev ${step===0?'disabled':''}>${icon('back','sm')}上一步</button><button class="app-button primary" data-next>${step===5?'签约并开始生涯':'继续'}${icon(step===5?'check':'chevron','sm')}</button></div></div>`;
    bind();
  };
  const body=()=>{
    if(step===0)return `<div class="form-grid">${field('姓名','name',draft.name,'text','例如：林越')}${field('球衣名','shirtName',draft.shirtName,'text','例如：LIN')}${field('出生日期','birth',draft.birth,'date')}${field('国家或地区','country',draft.country)}${field('身高（cm）','height',draft.height,'number')}${field('体重（kg）','weight',draft.weight,'number')}${selectField('惯用脚','foot',['右脚','左脚','双足'],draft.foot)}${field('球衣号码','number',draft.number,'number')}</div>`;
    if(step===1)return `<div class="grid-2 position-step"><div class="pitch">${positions.map(p=>`<button class="position-node ${draft.position===p.id?'active':''}" style="left:${p.x}%;top:${p.y}%" data-position="${p.id}">${p.id}</button>`).join('')}</div><div class="surface-card" style="box-shadow:none;background:rgba(91,108,135,.05)"><div class="icon-tile">${icon('formation')}</div><h3 class="card-title">${draft.position}</h3><p class="card-copy">${positions.find(p=>p.id===draft.position)?.desc}</p><div class="tag-row"><span class="badge green">中文球场节点</span><span class="badge blue">职责联动</span></div></div></div>`;
    if(step===2)return `<div class="choice-grid">${Object.keys(styles).map(name=>`<button class="choice-card ${draft.style===name?'active':''}" data-style="${name}">${icon(name==='防守型'?'defending':name==='组织型'?'passing':name==='终结型'?'shooting':'growth')}<h3>${name}</h3><p>${styleCopy(name)}</p></button>`).join('')}</div>`;
    if(step===3)return `<div class="grid-2"><div class="surface-card scout-reveal"><div class="card-kicker">${icon('analytics','sm')} 球探可信度 ${report.confidence}%</div><div class="rarity">${report.tier}</div><p class="card-copy">模板倾向：${draft.style} · 成长风险：${report.potential>88?'高上限伴随高波动':'可控波动'}</p><div class="tag-row"><span class="badge green">优势 ${cn(report.strengths[0])}</span><span class="badge green">优势 ${cn(report.strengths[1])}</span><span class="badge orange">短板 ${cn(report.weaknesses[0])}</span></div></div>${radarChart(report.stats,report.stats,report.potential)}</div>`;
    if(step===4){ const clubs=academyClubs(draft.position); return `<div class="grid-2">${clubs.map(c=>`<button class="surface-card interactive ${draft.club===c.id?'glow':''}" data-club="${c.id}"><div class="card-row"><div class="icon-tile">${icon('academy')}</div><span class="badge blue">机会 ${c.opportunity}</span></div><h3 class="card-title">${c.name}</h3><p class="card-copy">${c.city||'城市资料未核实'} · ${c.league||c.leagueCn}<br>${c.style||c.tactic}</p><div class="plan-meta"><span>青训 ${c.academy}</span><span>竞争 ${c.competition}</span><span>适配 ${Math.round((c.academy+c.opportunity)/2)}</span></div></button>`).join('')}</div>`; }
    const club=academyClubs(draft.position).find(c=>c.id===draft.club)||academyClubs(draft.position)[0]; const ovr=computeOverall(report.stats,draft.position);
    return `<div class="grid-2"><div class="surface-card player-hero"><div class="card-row"><div><div class="ovr">${ovr}</div><div class="ovr-caption">综合能力</div></div><div class="avatar">${draft.number}</div></div><div class="hero-name">${draft.name||'未命名球员'}</div><p class="card-copy">${draft.country} · ${draft.position} · ${draft.foot}<br>${club.name} 青年队</p><div class="tag-row"><span class="badge purple">${report.tier}</span><span class="badge blue">潜力 ${report.potential}</span></div></div>${radarChart(report.stats,report.stats,report.potential)}</div><div class="result-panel" style="margin-top:14px"><strong>成长路线摘要</strong><p class="card-copy">以${draft.style}为起点，在${club.name}的${club.style}体系中争取青年联赛出场。返回上一步不会丢失已填写内容。</p></div>`;
  };
  const bind=()=>{
    root.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{draft[el.name]=el.type==='number'?Number(el.value):el.value;}));
    root.querySelectorAll('[data-position]').forEach(el=>el.onclick=()=>{draft.position=el.dataset.position;app.feedback.emit('newPosition',draft.position);render();});
    root.querySelectorAll('[data-style]').forEach(el=>el.onclick=()=>{draft.style=el.dataset.style;app.feedback.emit('select',draft.style);render();});
    root.querySelectorAll('[data-club]').forEach(el=>el.onclick=()=>{draft.club=el.dataset.club;app.feedback.emit('clubSelect',academyClubs(draft.position).find(c=>c.id===draft.club)?.name);render();});
    root.querySelector('[data-prev]')?.addEventListener('click',()=>{if(step>0){step--;render();}});
    root.querySelector('[data-next]')?.addEventListener('click',()=>{
      if(step===0 && !draft.name.trim()){app.feedback.emit('failure','请先填写球员姓名');return;}
      if(step<5){step++; if(step===3)app.feedback.emit('scoutReport','报告已生成'); if(step===4)app.feedback.emit('talentReveal',report.tier); render(); return;}
      const club=academyClubs(draft.position).find(c=>c.id===draft.club)||academyClubs(draft.position)[0]; const player={...draft,club:club.name,clubId:club.id,team:'青年队',age:Math.max(16,new Date().getUTCFullYear()-Number(draft.birth.slice(0,4))),stats:report.stats,potential:report.potential,ovr:computeOverall(report.stats,draft.position),fatigue:18,morale:72,fitness:84,coachTrust:52,status:'健康',previousStats:{...report.stats}};
      app.store.set(s=>{s.player=player;s.career.history.push({date:s.simulation.date,type:'签约',text:`加入${club.name}青年队`});return s;});
      app.feedback.emit('promoted',`正式加入${club.name}青年队`); app.mount();
    });
  };
  render(); return root;
}
function field(label,name,value,type='text',placeholder=''){return `<div class="field"><label>${label}</label><input class="input" name="${name}" type="${type}" value="${value??''}" placeholder="${placeholder}" /></div>`;}
function selectField(label,name,options,value){return `<div class="field"><label>${label}</label><select class="input" name="${name}">${options.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select></div>`;}
function styleCopy(name){return {爆发型:'速度和纵向冲击优先',技术型:'控球、变向和小空间处理',组织型:'视野、传球与节奏控制',终结型:'跑位、射门和禁区效率',防守型:'站位、拦截与身体对抗',全能型:'各项均衡，适应多位置','自定义混合':'在确认前保留二次调整空间'}[name];}
function cn(key){return {speed:'速度',shooting:'射门',passing:'传球',dribbling:'盘带',defending:'防守',physical:'身体'}[key]||key;}
function academyClubs(position){
  const clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS;
  return [...clubs].sort((a,b)=>{
    const fit=(club)=>Number(club.opportunity||club.youthUsage||0)+(club.needs||[]).includes(position)?25:0;
    return fit(b)-fit(a);
  }).slice(0,8);
}
