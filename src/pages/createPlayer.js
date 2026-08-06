import { icon } from '../components/icons.js';
import { radarChart } from '../components/radar.js';
import { CLUBS } from '../data/clubs.js';
import { computeOverall } from '../core/playerDevelopmentEngine.js';

const positions=[
  {id:'??',x:50,y:90,desc:'??????????'},
  {id:'???',x:50,y:75,desc:'????????'},
  {id:'???',x:20,y:68,desc:'???????'},
  {id:'???',x:80,y:68,desc:'???????'},
  {id:'??',x:50,y:57,desc:'?????????'},
  {id:'??',x:50,y:43,desc:'?????????'},
  {id:'??',x:50,y:30,desc:'?????????'},
  {id:'???',x:22,y:24,desc:'????????'},
  {id:'???',x:78,y:24,desc:'????????'},
  {id:'??',x:50,y:13,desc:'????????'}
];
const styles={
  '???':{speed:68,shooting:55,passing:48,dribbling:62,defending:38,physical:56},
  '???':{speed:58,shooting:55,passing:61,dribbling:69,defending:39,physical:45},
  '???':{speed:50,shooting:48,passing:70,dribbling:61,defending:46,physical:48},
  '???':{speed:61,shooting:70,passing:45,dribbling:57,defending:31,physical:58},
  '???':{speed:53,shooting:35,passing:54,dribbling:44,defending:70,physical:67},
  '???':{speed:57,shooting:56,passing:58,dribbling:57,defending:55,physical:58},
  '?????':{speed:60,shooting:58,passing:60,dribbling:60,defending:48,physical:54}
};

function seeded(seed){ let x=0; for(const ch of seed)x=(x*31+ch.charCodeAt(0))>>>0; return ()=>((x=Math.imul(1664525,x)+1013904223>>>0)/4294967296); }
function scoutDraft(draft){ const rnd=seeded(`${draft.name}-${draft.birth}-${draft.position}-${draft.style}`); const base=styles[draft.style]||styles['???']; const stats=Object.fromEntries(Object.entries(base).map(([k,v])=>[k,Math.max(35,Math.min(78,Number((v+(rnd()-.5)*8).toFixed(2))))])); const potential=Math.round(70+rnd()*24); const tiers=potential>=93?'????':potential>=89?'??':potential>=86?'??':potential>=82?'??':potential>=78?'??':potential>=74?'??':'??'; return {stats,potential,tier:tiers,confidence:Math.round(72+rnd()*23),strengths:Object.entries(stats).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k),weaknesses:Object.entries(stats).sort((a,b)=>a[1]-b[1]).slice(0,2).map(([k])=>k)}; }

export function createPlayerWizard(app){
  let step=0;
  const draft={name:'',shirtName:'',birth:'2008-03-18',country:'??',height:178,weight:70,foot:'??',number:18,position:'??',style:'???',club:'ajax'};
  let report=scoutDraft(draft);
  const root=document.createElement('div'); root.className='wizard-shell';
  const labels=['??','??','??','????','???','??'];
  const render=()=>{
    report=scoutDraft(draft);
    root.innerHTML=`<div class="wizard"><div class="wizard-top"><div><div class="card-kicker">???? ? ????</div><h1 class="page-title">${labels[step]}</h1></div><span class="badge blue">${step+1}/6</span></div><div class="stepper">${labels.map((_,i)=>`<span class="step-dot ${i<=step?'active':''}"></span>`).join('')}</div><div style="height:14px"></div><section class="surface-card">${body()}</section><div class="card-row" style="margin-top:14px"><button class="app-button ghost" data-prev ${step===0?'disabled':''}>${icon('back','sm')}???</button><button class="app-button primary" data-next>${step===5?'???????':'??'}${icon(step===5?'check':'chevron','sm')}</button></div></div>`;
    bind();
  };
  const body=()=>{
    if(step===0)return `<div class="form-grid">${field('??','name',draft.name,'text','?????')}${field('???','shirtName',draft.shirtName,'text','???LIN')}${field('????','birth',draft.birth,'date')}${field('?????','country',draft.country)}${field('???cm?','height',draft.height,'number')}${field('???kg?','weight',draft.weight,'number')}${selectField('???','foot',['??','??','??'],draft.foot)}${field('????','number',draft.number,'number')}</div>`;
    if(step===1)return `<div class="grid-2"><div class="pitch">${positions.map(p=>`<button class="position-node ${draft.position===p.id?'active':''}" style="left:${p.x}%;top:${p.y}%" data-position="${p.id}">${p.id}</button>`).join('')}</div><div class="surface-card" style="box-shadow:none;background:rgba(91,108,135,.05)"><div class="icon-tile">${icon('formation')}</div><h3 class="card-title">${draft.position}</h3><p class="card-copy">${positions.find(p=>p.id===draft.position)?.desc}</p><div class="tag-row"><span class="badge green">??????</span><span class="badge blue">????</span></div></div></div>`;
    if(step===2)return `<div class="choice-grid">${Object.keys(styles).map(name=>`<button class="choice-card ${draft.style===name?'active':''}" data-style="${name}">${icon(name==='???'?'defending':name==='???'?'passing':name==='???'?'shooting':'growth')}<h3>${name}</h3><p>${styleCopy(name)}</p></button>`).join('')}</div>`;
    if(step===3)return `<div class="grid-2"><div class="surface-card scout-reveal"><div class="card-kicker">${icon('analytics','sm')} ????? ${report.confidence}%</div><div class="rarity">${report.tier}</div><p class="card-copy">?????${draft.style} ? ?????${report.potential>88?'????????':'????'}</p><div class="tag-row"><span class="badge green">?? ${cn(report.strengths[0])}</span><span class="badge green">?? ${cn(report.strengths[1])}</span><span class="badge orange">?? ${cn(report.weaknesses[0])}</span></div></div>${radarChart(report.stats,report.stats,report.potential)}</div>`;
    if(step===4){ const clubs=CLUBS.filter(c=>['ajax','dortmund','benfica','santos','atalanta','kashima'].includes(c.id)); return `<div class="grid-2">${clubs.map(c=>`<button class="surface-card interactive ${draft.club===c.id?'glow':''}" data-club="${c.id}"><div class="card-row"><div class="icon-tile">${icon('academy')}</div><span class="badge blue">?? ${c.opportunity}</span></div><h3 class="card-title">${c.name}</h3><p class="card-copy">${c.city} ? ${c.league}<br>${c.style}</p><div class="plan-meta"><span>?? ${c.academy}</span><span>?? ${c.competition}</span><span>?? ${Math.round((c.academy+c.opportunity)/2)}</span></div></button>`).join('')}</div>`; }
    const club=CLUBS.find(c=>c.id===draft.club); const ovr=computeOverall(report.stats,draft.position);
    return `<div class="grid-2"><div class="surface-card player-hero"><div class="card-row"><div><div class="ovr">${ovr}</div><div class="ovr-caption">????</div></div><div class="avatar">${draft.number}</div></div><div class="hero-name">${draft.name||'?????'}</div><p class="card-copy">${draft.country} ? ${draft.position} ? ${draft.foot}<br>${club.name} ???</p><div class="tag-row"><span class="badge purple">${report.tier}</span><span class="badge blue">?? ${report.potential}</span></div></div>${radarChart(report.stats,report.stats,report.potential)}</div><div class="result-panel" style="margin-top:14px"><strong>??????</strong><p class="card-copy">?${draft.style}?????${club.name}?${club.style}???????????????????????????</p></div>`;
  };
  const bind=()=>{
    root.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{draft[el.name]=el.type==='number'?Number(el.value):el.value;}));
    root.querySelectorAll('[data-position]').forEach(el=>el.onclick=()=>{draft.position=el.dataset.position;app.feedback.emit('newPosition',draft.position);render();});
    root.querySelectorAll('[data-style]').forEach(el=>el.onclick=()=>{draft.style=el.dataset.style;app.feedback.emit('select',draft.style);render();});
    root.querySelectorAll('[data-club]').forEach(el=>el.onclick=()=>{draft.club=el.dataset.club;app.feedback.emit('clubSelect',CLUBS.find(c=>c.id===draft.club)?.name);render();});
    root.querySelector('[data-prev]')?.addEventListener('click',()=>{if(step>0){step--;render();}});
    root.querySelector('[data-next]')?.addEventListener('click',()=>{
      if(step===0 && !draft.name.trim()){app.feedback.emit('failure','????????');return;}
      if(step<5){step++; if(step===3)app.feedback.emit('scoutReport','?????'); if(step===4)app.feedback.emit('talentReveal',report.tier); render(); return;}
      const club=CLUBS.find(c=>c.id===draft.club); const player={...draft,club:club.name,clubId:club.id,team:'???',age:Math.max(16,new Date().getUTCFullYear()-Number(draft.birth.slice(0,4))),stats:report.stats,potential:report.potential,ovr:computeOverall(report.stats,draft.position),fatigue:18,morale:72,fitness:84,coachTrust:52,status:'??',previousStats:{...report.stats}};
      app.store.set(s=>{s.player=player;s.career.history.push({date:s.simulation.date,type:'??',text:`??${club.name}???`});return s;});
      app.feedback.emit('promoted',`????${club.name}???`); app.mount();
    });
  };
  render(); return root;
}
function field(label,name,value,type='text',placeholder=''){return `<div class="field"><label>${label}</label><input class="input" name="${name}" type="${type}" value="${value??''}" placeholder="${placeholder}" /></div>`;}
function selectField(label,name,options,value){return `<div class="field"><label>${label}</label><select class="input" name="${name}">${options.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select></div>`;}
function styleCopy(name){return {???:'?????????',???:'???????????',???:'??????????',???:'??????????',???:'??????????',???:'??????????','?????':'????????????'}[name];}
function cn(key){return {speed:'??',shooting:'??',passing:'??',dribbling:'??',defending:'??',physical:'??'}[key]||key;}
