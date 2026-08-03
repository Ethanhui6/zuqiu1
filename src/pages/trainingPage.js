import {el,button,clear} from '../utils/dom.js';
import {getTrainingPlans,selectTrainingPlan} from '../systems/training/trainingSystem.js';
import {showToast} from '../components/toast.js';

export function renderTrainingPage(container,ctx){
  const {store,repo}=ctx,save=store.state,club=repo.getClub(save.career.clubId);clear(container);const page=el('section',{className:'page'});
  const currentLabel=el('strong',{text:getTrainingPlans(save).find(x=>x.selected)?.name||'战术课堂'});
  page.append(el('div',{className:'page-title'},[el('div',{},[el('span',{className:'eyebrow',text:'训练中心'}),el('h1',{text:'选择本阶段训练重点'}),el('p',{text:'训练会在下一次推进生涯时结算。强度越高，成长、疲劳与伤病风险越高。'})]),statusCard(save,club,currentLabel)]));
  const grid=el('div',{className:'training-grid'});getTrainingPlans(save).forEach(plan=>{
    const card=button('',{className:`training-card ${plan.selected?'is-selected':''}`});card.dataset.planId=plan.id;
    card.append(el('span',{className:'training-icon',text:plan.icon}),el('h3',{text:plan.name}),el('p',{text:plan.desc}),el('div',{className:'tag-row'},[el('span',{className:'tag',text:`强度 ${plan.intensity}/4`}),el('span',{className:'tag',text:`疲劳 ${plan.fatigue>0?'+':''}${plan.fatigue}`}),el('span',{className:`tag ${plan.risk>=12?'tag--danger':''}`,text:`风险 ${plan.risk}%`})]));
    card.addEventListener('click',()=>{store.update(s=>selectTrainingPlan(s,plan.id),'training-selected');grid.querySelectorAll('.training-card').forEach(x=>x.classList.toggle('is-selected',x.dataset.planId===plan.id));currentLabel.textContent=plan.name;showToast(`已选择：${plan.name}`,{type:'success'})});grid.append(card);
  });page.append(grid);container.append(page);return()=>{};
}
function statusCard(save,club,currentLabel){return el('section',{className:'glass-card compact-status'},[el('small',{text:'训练环境'}),el('strong',{text:`${club.cn} · 青训等级 ${club.youth}`}),el('p',{},[document.createTextNode(`体能 ${Math.round(save.status.fitness)} · 疲劳 ${Math.round(save.status.fatigue)} · 当前计划 `),currentLabel])])}
