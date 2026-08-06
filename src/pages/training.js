import { icon } from '../components/icons.js';
import { applyDevelopment } from '../core/playerDevelopmentEngine.js';
import { metric } from '../components/ui.js';

const PLANS=[
  {id:'speed',name:'爆发与冲刺',icon:'speed',tags:['爆发','冒险'],risk:18,fatigue:12,fit:'边锋/前锋',gains:{speed:.62,physical:.18},skills:['速度','爆发','冲刺']},
  {id:'shooting',name:'禁区终结',icon:'shooting',tags:['终结','高收益'],risk:14,fatigue:10,fit:'前锋/前腰',gains:{shooting:.66,dribbling:.12},skills:['射门','终结','跑位']},
  {id:'passing',name:'视野与组织',icon:'passing',tags:['稳健','教练建议'],risk:6,fatigue:7,fit:'中场/后腰',gains:{passing:.62,dribbling:.18},skills:['传球','视野','组织']},
  {id:'dribbling',name:'小空间控球',icon:'dribbling',tags:['技术','爆发'],risk:12,fatigue:9,fit:'边锋/前腰',gains:{dribbling:.68,speed:.12},skills:['盘带','控球','变向']},
  {id:'defending',name:'站位与拦截',icon:'defending',tags:['稳健','团队'],risk:7,fatigue:8,fit:'后卫/后腰',gains:{defending:.64,physical:.14},skills:['抢断','站位','拦截']},
  {id:'physical',name:'力量与耐力',icon:'physical',tags:['身体','高负荷'],risk:20,fatigue:14,fit:'全位置',gains:{physical:.66,speed:.08},skills:['对抗','耐力','核心']},
  {id:'setpiece',name:'定位球脚法',icon:'tactics',tags:['专项','比赛'],risk:8,fatigue:6,fit:'中场/前锋',gains:{shooting:.34,passing:.34},skills:['任意球','角球','落点']},
  {id:'aerial',name:'空中对抗',icon:'ball',tags:['头球','身体'],risk:11,fatigue:9,fit:'中卫/前锋',gains:{physical:.42,shooting:.22},skills:['头球','卡位','争顶']},
  {id:'recovery',name:'康复与恢复',icon:'recovery',tags:['恢复','医疗建议'],risk:1,fatigue:-14,fit:'伤病/疲劳',gains:{physical:.12},skills:['恢复','柔韧','风险控制']}
];

export function trainingPage(app,state){
  const p=state.player, selected=state.training.selectedPlan||recommend(p,state);
  const done=state.training.completedWeek===state.season.week;
  const root=document.createElement('section');root.className='page';
  const progress=done?100:Math.max(0,Math.min(99,Number(state.season.progress)||0));
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">训练中心</h1><p class="page-subtitle">点击项目立即开始，进度随游戏时间推进</p></div><span class="badge ${done?'green':'orange'}">${done?'本周已完成':'待训练'}</span></div>
  <section class="surface-card training-progress"><div class="card-row"><div><div class="card-kicker">${icon('calendar','sm')} 本周时间进度</div><h2 class="card-title">${progress}%</h2></div><span class="badge blue">第${Math.max(1,state.season.week)}周</span></div>${metric('训练窗口',progress,{tone:done?'green':'blue'})}</section>
  <section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('training','sm')} 当前训练核心</div><h2 class="card-title">${PLANS.find(x=>x.id===selected)?.name}</h2><p class="card-copy">${suggestion(p,state)}</p></div><span class="badge blue">推荐</span></div>${metric('当前体能',p.fitness,{tone:p.fitness<55?'orange':'green'})}${metric('疲劳',p.fatigue,{tone:p.fatigue>65?'red':'orange'})}</section>
  <div style="height:14px"></div><div class="grid-2">${PLANS.map(plan=>planCard(plan,selected)).join('')}</div>
  <div style="height:14px"></div><section class="surface-card"><div class="card-kicker">${icon('analytics','sm')} 训练后影响预览</div><div id="training-preview">${preview(PLANS.find(x=>x.id===selected),p)}</div><div class="card-row" style="margin-top:15px"><button class="app-button ghost" data-auto>自动策略：${state.training.autoStrategy}</button><span class="card-copy">${done?'已写入训练历史':'选择卡片后立即结算'}</span></div></section>`;
  root.querySelectorAll('[data-plan]').forEach(el=>el.onclick=()=>{const plan=PLANS.find(p=>p.id===el.dataset.plan);if(done)return app.feedback.emit('empty','本周训练已经完成');app.completeTraining(plan);});
  root.querySelector('[data-auto]').onclick=()=>app.openTrainingStrategy();
  return root;
}
function planCard(plan,selected){return `<button class="surface-card plan-card interactive ${selected===plan.id?'selected':''}" data-plan="${plan.id}"><div class="card-row"><div class="icon-tile">${icon(plan.icon)}</div><div class="tag-row">${plan.tags.map((t,i)=>`<span class="badge ${i?'':'blue'}">${t}</span>`).join('')}</div></div><h3 class="card-title">${plan.name}</h3><p class="card-copy">覆盖：${plan.skills.join('、')}<br>适配：${plan.fit}</p><div class="plan-meta"><span>风险 ${plan.risk}</span><span>疲劳 ${plan.fatigue>0?'+':''}${plan.fatigue}</span><span>适配 ${Math.max(65,96-plan.risk)}</span></div></button>`;}
export function trainingPreview(plan,p,state={}){return applyDevelopment(p,plan.gains,{fatigue:p.fatigue,injured:(state.injuries||[]).some(x=>x.status==='active'),facility:78,coachQuality:75});}
function preview(plan,p,state){if(!plan)return'';const calculated=trainingPreview(plan,p,state);return `<div class="change-grid" style="margin-top:13px">${Object.entries(calculated.changes).filter(([,v])=>v).map(([k,v])=>`<div class="change-item"><b>${cn(k)} +${v.toFixed(2)}</b><span>内部浮点成长，达到整数时突破</span></div>`).join('')}<div class="change-item"><b>疲劳 ${plan.fatigue>0?'+':''}${plan.fatigue}</b><span>当前 ${p.fatigue}</span></div><div class="change-item"><b>伤病风险 ${plan.risk}%</b><span>受体能和旧伤修正</span></div></div>`;}
function recommend(p,state){if(state.injuries.some(x=>x.status==='active')||p.fatigue>65)return'recovery';return Object.entries(p.stats).sort((a,b)=>a[1]-b[1])[0][0];}
function suggestion(p,state){if(state.injuries.some(x=>x.status==='active'))return'医疗组建议优先恢复，降低复发概率。';if(p.fatigue>65)return'疲劳偏高，继续高负荷训练会显著提高受伤风险。';return`当前最需要强化的是${cn(Object.entries(p.stats).sort((a,b)=>a[1]-b[1])[0][0])}，教练建议保持一个完整训练周期。`;}
function cn(k){return {speed:'速度',shooting:'射门',passing:'传球',dribbling:'盘带',defending:'防守',physical:'身体'}[k]||k;}
export { PLANS };
