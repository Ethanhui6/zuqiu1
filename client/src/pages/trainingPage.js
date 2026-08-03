import {el,button,clear} from '../utils/dom.js';
import {getTrainingPlans,selectTrainingPlan} from '../systems/training/trainingSystem.js';
import {TRAINING_STRATEGIES,setStrategies} from '../systems/pace/paceSystem.js';
import {showToast} from '../components/toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';

export function renderTrainingPage(container,ctx){
  const {store,repo}=ctx,save=store.state,club=repo.getClub(save.career.clubId);clear(container);const page=el('section',{className:'page training-page'});
  const currentLabel=el('strong',{text:getTrainingPlans(save).find(x=>x.selected)?.name||'战术课堂'});
  page.append(el('div',{className:'page-title'},[
    el('div',{},[el('span',{className:'eyebrow',text:'训练中心'}),el('h1',{text:'设定成长方向'}),el('p',{text:'手动计划决定下一次训练；自动策略会在快速推进中根据体能和目标选择合适计划。'})]),statusCard(save,club,currentLabel)
  ]));
  page.append(strategyPanel(save,store,ctx));
  const grid=el('div',{className:'training-grid'});getTrainingPlans(save).forEach(plan=>{
    const card=button('',{className:`training-card ${plan.selected?'is-selected':''}`});card.dataset.planId=plan.id;
    card.append(el('span',{className:'training-icon',text:plan.icon}),el('h3',{text:plan.name}),el('p',{text:plan.desc}),el('div',{className:'tag-row'},[el('span',{className:'tag',text:`强度 ${plan.intensity}/4`}),el('span',{className:'tag',text:`疲劳 ${plan.fatigue>0?'+':''}${plan.fatigue}`}),el('span',{className:`tag ${plan.risk>=12?'tag--danger':''}`,text:`风险 ${plan.risk}%`})]));
    card.addEventListener('click',async()=>{if(card.disabled)return;card.disabled=true;store.update(s=>selectTrainingPlan(s,plan.id),'training-selected');grid.querySelectorAll('.training-card').forEach(x=>x.classList.toggle('is-selected',x.dataset.planId===plan.id));currentLabel.textContent=plan.name;await animationDirector.play('training-ring',{id:`${save.career.season}:${save.career.calendar.week}:${plan.id}`,progress:Math.max(20,100-plan.risk),label:`训练计划：${plan.name}`},{token:`training:${save.career.season}:${save.career.calendar.week}:${plan.id}`});card.disabled=false;showToast(`下一次训练：${plan.name}`,{type:'success'})});grid.append(card);
  });page.append(grid);container.append(page);return()=>{};
}
function strategyPanel(save,store,ctx){
  const section=el('section',{className:'glass-card strategy-panel'},[
    el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'自动训练策略'}),el('h2',{text:'快速推进时如何训练'})]),el('small',{className:'muted',text:'立即写入存档'})])
  ]),grid=el('div',{className:'strategy-chip-grid'});
  Object.values(TRAINING_STRATEGIES).forEach(strategy=>{
    const active=save.career.strategies.training===strategy.id;
    grid.append(button('',{className:`strategy-chip ${active?'is-selected':''}`,pressed:active,onClick:()=>{store.update(s=>setStrategies(s,{training:strategy.id}),'training-strategy');showToast(`自动训练已改为：${strategy.name}`,{type:'success'});ctx.refresh()}},[el('strong',{text:strategy.name}),el('small',{text:strategy.desc})]));
  });section.append(grid);return section;
}
function statusCard(save,club,currentLabel){return el('section',{className:'glass-card compact-status'},[el('small',{text:'训练环境'}),el('strong',{text:`${club.cn} · 青训等级 ${club.youth}`}),el('p',{},[document.createTextNode(`体能 ${Math.round(save.status.fitness)} · 疲劳 ${Math.round(save.status.fatigue)} · 手动计划 `),currentLabel])])}
