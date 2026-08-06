import { icon } from '../components/icons.js';
import { metric } from '../components/ui.js';
import { applyDevelopment } from '../core/playerDevelopmentEngine.js';

const PLANS=[
  {id:'speed',name:'?????',icon:'speed',tags:['??','??'],risk:18,fatigue:12,fit:'??/??',gains:{speed:.62,physical:.18},skills:['??','??','??']},
  {id:'shooting',name:'????',icon:'shooting',tags:['??','???'],risk:14,fatigue:10,fit:'??/??',gains:{shooting:.66,dribbling:.12},skills:['??','??','??']},
  {id:'passing',name:'?????',icon:'passing',tags:['??','????'],risk:6,fatigue:7,fit:'??/??',gains:{passing:.62,dribbling:.18},skills:['??','??','??']},
  {id:'dribbling',name:'?????',icon:'dribbling',tags:['??','??'],risk:12,fatigue:9,fit:'??/??',gains:{dribbling:.68,speed:.12},skills:['??','??','??']},
  {id:'defending',name:'?????',icon:'defending',tags:['??','??'],risk:7,fatigue:8,fit:'??/??',gains:{defending:.64,physical:.14},skills:['??','??','??']},
  {id:'physical',name:'?????',icon:'physical',tags:['??','???'],risk:20,fatigue:14,fit:'???',gains:{physical:.66,speed:.08},skills:['??','??','??']},
  {id:'recovery',name:'?????',icon:'recovery',tags:['??','????'],risk:1,fatigue:-14,fit:'??/??',gains:{physical:.12},skills:['??','??','????']}
];

export function trainingPage(app,state){
  const p=state.player, selected=state.training.selectedPlan||recommend(p,state);
  const done=state.training.completedWeek===state.season.week;
  const root=document.createElement('section');root.className='page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">????</h1><p class="page-subtitle">????????????</p></div><span class="badge ${done?'green':'orange'}">${done?'?????':'???'}</span></div>
  <section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('training','sm')} ??????</div><h2 class="card-title">${PLANS.find(x=>x.id===selected)?.name}</h2><p class="card-copy">${suggestion(p,state)}</p></div><span class="badge blue">??</span></div>${metric('????',p.fitness,{tone:p.fitness<55?'orange':'green'})}${metric('??',p.fatigue,{tone:p.fatigue>65?'red':'orange'})}</section>
  <div style="height:14px"></div><div class="grid-2">${PLANS.map(plan=>planCard(plan,selected)).join('')}</div>
  <div style="height:14px"></div><section class="surface-card"><div class="card-kicker">${icon('analytics','sm')} ???????</div><div id="training-preview">${preview(PLANS.find(x=>x.id===selected),p)}</div><div class="card-row" style="margin-top:15px"><button class="app-button ghost" data-auto>?????${state.training.autoStrategy}</button><button class="app-button primary" data-complete ${done?'disabled':''}>${icon('check','sm')}${done?'?????':'??????'}</button></div></section>`;
  root.querySelectorAll('[data-plan]').forEach(el=>el.onclick=()=>{app.store.set(s=>{s.training.selectedPlan=el.dataset.plan;return s;});app.feedback.emit('select',PLANS.find(p=>p.id===el.dataset.plan).name);app.render();});
  root.querySelector('[data-auto]').onclick=()=>app.openTrainingStrategy();
  root.querySelector('[data-complete]').onclick=()=>app.completeTraining(PLANS.find(x=>x.id===selected));
  return root;
}
function planCard(plan,selected){return `<button class="surface-card plan-card interactive ${selected===plan.id?'selected':''}" data-plan="${plan.id}"><div class="card-row"><div class="icon-tile">${icon(plan.icon)}</div><div class="tag-row">${plan.tags.map((t,i)=>`<span class="badge ${i?'':'blue'}">${t}</span>`).join('')}</div></div><h3 class="card-title">${plan.name}</h3><p class="card-copy">???${plan.skills.join('?')}<br>???${plan.fit}</p><div class="plan-meta"><span>?? ${plan.risk}</span><span>?? ${plan.fatigue>0?'+':''}${plan.fatigue}</span><span>?? ${Math.max(65,96-plan.risk)}</span></div></button>`;}
function preview(plan,p){if(!plan)return'';return `<div class="change-grid" style="margin-top:13px">${Object.entries(plan.gains).map(([k,v])=>`<div class="change-item"><b>${cn(k)} +${v.toFixed(2)}</b><span>??????????????</span></div>`).join('')}<div class="change-item"><b>?? ${plan.fatigue>0?'+':''}${plan.fatigue}</b><span>?? ${p.fatigue}</span></div><div class="change-item"><b>???? ${plan.risk}%</b><span>????????</span></div></div>`;}
export function trainingPreview(plan, player, context = {}) {
  const out = applyDevelopment(player, plan?.gains || {}, {
    ...context,
    injured: context.injured ?? context.injuries?.some(item => item.status === 'active')
  });
  return { ...out, changes: Object.fromEntries(Object.entries(out.changes).map(([key, value]) => [key, Number(value.toFixed(3))])) };
}
function recommend(p,state){if(state.injuries.some(x=>x.status==='active')||p.fatigue>65)return'recovery';return Object.entries(p.stats).sort((a,b)=>a[1]-b[1])[0][0];}
function suggestion(p,state){if(state.injuries.some(x=>x.status==='active'))return'?????????????????';if(p.fatigue>65)return'??????????????????????';return`?????????${cn(Object.entries(p.stats).sort((a,b)=>a[1]-b[1])[0][0])}????????????????`;}
function cn(k){return {speed:'??',shooting:'??',passing:'??',dribbling:'??',defending:'??',physical:'??'}[k]||k;}
export { PLANS };
