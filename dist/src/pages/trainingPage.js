import {el,button,clear} from '../utils/dom.js';
import {getTrainingPlans,selectTrainingPlan} from '../systems/training/trainingSystem.js';
import {TRAINING_STRATEGIES,setStrategies} from '../systems/pace/paceSystem.js';
import {showToast} from '../components/toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';

const ATTR_LABELS={pac:'速度',sho:'射门',pas:'传球',dri:'盘带',def:'防守',phy:'身体'};
const POSITION_FOCUS={GK:['def','pas','phy'],CB:['def','phy','pas'],LB:['pac','def','pas'],RB:['pac','def','pas'],DM:['def','pas','phy'],CM:['pas','dri','phy'],AM:['pas','dri','sho'],LW:['pac','dri','sho'],RW:['pac','dri','sho'],SS:['sho','dri','pas'],ST:['sho','pac','phy']};

export function renderTrainingPage(container,ctx){
  const {store,repo}=ctx,save=store.state,club=repo.getClub(save.career.clubId);clear(container);
  const plans=getTrainingPlans(save),recommendation=trainingRecommendation(save,plans),current=plans.find(plan=>plan.selected)||plans.find(plan=>plan.id==='tactics')||plans[0];
  const ranked=plans.map(plan=>({...plan,assessment:assessPlan(save,plan,recommendation.id)})).sort((a,b)=>b.assessment.fit-a.assessment.fit);
  const primary=uniquePlans([ranked.find(plan=>plan.id===current.id),ranked.find(plan=>plan.id===recommendation.id),...ranked]).slice(0,4);
  const secondary=ranked.filter(plan=>!primary.some(item=>item.id===plan.id));
  const page=el('section',{className:'page training-page training-control-center'});
  page.append(
    trainingSummary(save,club,current,recommendation),
    adviceBar(recommendation),
    strategyControl(save,store,ctx,recommendation),
    benefitPreview(save,current,assessPlan(save,current,recommendation.id)),
    planSection(primary,secondary,current,recommendation,selectPlan),
    actionBar(save,store,ctx,recommendation)
  );
  container.append(page);

  async function selectPlan(card,plan){
    if(card.disabled)return;card.disabled=true;
    await animationDirector.feedback(card,'training-select',{duration:280});
    store.update(state=>selectTrainingPlan(state,plan.id),'training-selected');
    ctx.refresh();
    showToast(`训练方向已切换为「${plan.name}」`,{type:'success',duration:1500});
  }
  return()=>{};
}

function trainingSummary(save,club,current,recommendation){
  const assessment=assessPlan(save,current,recommendation.id);
  return el('section',{className:'training-summary-card'},[
    el('div',{className:'training-summary-card__head'},[
      el('div',{className:'training-mode-icon icon-motion icon-motion--growth',text:current.icon,attrs:{'aria-hidden':'true'}}),
      el('div',{className:'training-summary-card__copy'},[
        el('span',{className:'eyebrow',text:'训练控制中心'}),
        el('h1',{text:current.name}),
        el('p',{text:`${club.cn} · 青训 ${club.youth} · 当前手动方案`})
      ]),
      el('span',{className:'training-active-pill',text:'已启用'})
    ]),
    el('div',{className:'training-vitals'},[
      vital('⚡','体能',Math.round(save.status.fitness),'fitness'),
      vital('◴','疲劳',Math.round(save.status.fatigue),'fatigue'),
      vital('△','风险',assessment.risk,'risk'),
      vital('◎','适配',assessment.fit,'fit')
    ])
  ]);
}

function adviceBar(recommendation){
  return el('section',{className:`coach-advice coach-advice--${recommendation.level}`,attrs:{role:'status','aria-live':'polite'}},[
    el('span',{className:`coach-advice__icon icon-motion icon-motion--${recommendation.iconMotion}`,text:recommendation.icon}),
    el('div',{},[el('strong',{text:recommendation.title}),el('p',{text:recommendation.message})]),
    el('span',{className:'recommendation-pulse',text:'推荐'})
  ]);
}

function strategyControl(save,store,ctx,recommendation){
  const strategies=Object.values(TRAINING_STRATEGIES),active=TRAINING_STRATEGIES[save.career.strategies.training]||TRAINING_STRATEGIES.balanced;
  const select=el('select',{className:'select-input training-strategy-select',attrs:{'aria-label':'自动训练策略'}});
  strategies.forEach(strategy=>select.append(el('option',{text:strategy.name,attrs:{value:strategy.id,selected:strategy.id===active.id}})));
  select.addEventListener('change',()=>{
    const strategy=TRAINING_STRATEGIES[select.value];
    store.update(state=>setStrategies(state,{training:strategy.id}),'training-strategy');
    ctx.refresh();showToast(`自动训练：${strategy.name}`,{type:'success',duration:1500});
  });
  const recommendedStrategy=strategies.find(strategy=>strategy.plan===recommendation.id)||TRAINING_STRATEGIES.balanced;
  const apply=button('采用教练建议',{className:'button button--light training-advice-action',onClick:async()=>{
    await animationDirector.feedback(apply,'confirm',{duration:260});
    store.update(state=>setStrategies(state,{training:recommendedStrategy.id}),'training-strategy');
    ctx.refresh();showToast(`自动训练已采用「${recommendedStrategy.name}」`,{type:'success',duration:1600});
  }});
  return el('section',{className:'training-strategy-card'},[
    el('div',{className:'training-section-title'},[el('div',{},[el('small',{text:'自动训练策略'}),el('strong',{text:active.name})]),el('span',{className:'strategy-state',text:'推进时生效'})]),
    el('div',{className:'training-strategy-row'},[select,apply]),
    el('p',{className:'training-strategy-reason',text:`教练建议：${recommendedStrategy.name} · ${recommendation.shortReason}`})
  ]);
}

function benefitPreview(save,plan,assessment){
  return el('section',{className:'training-preview'},[
    el('div',{className:'training-section-title'},[el('div',{},[el('small',{text:'下次训练预览'}),el('strong',{text:plan.name})]),el('span',{className:`risk-pill risk-pill--${assessment.risk>=16?'high':assessment.risk>=9?'mid':'low'}`,text:`风险 ${assessment.risk}%`})]),
    el('div',{className:'training-preview-grid'},[
      previewMetric('↑','核心收益',plan.focus.map(key=>ATTR_LABELS[key]||key).join(' · '),'growth'),
      previewMetric('◴','预计疲劳',`${plan.fatigue>0?'+':''}${plan.fatigue}`,'fatigue'),
      previewMetric('◎','位置适配',`${assessment.fit}%`,'fit'),
      previewMetric('◆','训练强度',`${plan.intensity}/4`,'intensity')
    ]),
    el('p',{className:'training-preview-note',text:assessment.reason})
  ]);
}

function planSection(primary,secondary,current,recommendation,onSelect){
  const section=el('section',{className:'training-plans-section'},[
    el('div',{className:'training-section-title'},[el('div',{},[el('small',{text:'手动训练计划'}),el('strong',{text:'优先方案'})]),el('span',{className:'muted',text:'点按即切换'})])
  ]);
  const grid=el('div',{className:'training-plan-grid'});primary.forEach(plan=>grid.append(planCard(plan,current,recommendation,onSelect)));section.append(grid);
  if(secondary.length){
    const details=el('details',{className:'training-more-plans'}),summary=el('summary',{text:`查看其他 ${secondary.length} 项训练`}),more=el('div',{className:'training-plan-grid training-plan-grid--more'});
    secondary.forEach(plan=>more.append(planCard(plan,current,recommendation,onSelect)));details.append(summary,more);section.append(details);
  }
  return section;
}

function planCard(plan,current,recommendation,onSelect){
  const selected=plan.id===current.id,recommended=plan.id===recommendation.id;
  const card=button('',{className:`training-plan-card ${selected?'is-selected':''} ${recommended?'is-recommended':''}`,pressed:selected});
  card.append(
    el('div',{className:'training-plan-card__top'},[
      el('span',{className:`training-plan-icon icon-motion ${selected?'is-active':''}`,text:plan.icon}),
      el('div',{},[el('strong',{text:plan.name}),el('small',{text:plan.focus.map(key=>ATTR_LABELS[key]||key).join(' · ')})]),
      selected?el('span',{className:'selected-check',text:'✓'}):recommended?el('span',{className:'recommended-mark',text:'荐'}):null
    ]),
    el('div',{className:'training-plan-facts'},[
      el('span',{text:`适配 ${plan.assessment.fit}%`}),
      el('span',{className:plan.assessment.risk>=16?'is-danger':'',text:`风险 ${plan.assessment.risk}%`}),
      el('span',{text:`疲劳 ${plan.fatigue>0?'+':''}${plan.fatigue}`})
    ]),
    el('p',{text:recommended?recommendation.shortReason:plan.assessment.reason})
  );
  card.addEventListener('click',()=>onSelect(card,plan));return card;
}

function actionBar(save,store,ctx,recommendation){
  const saveButton=button('保存方案',{className:'button button--secondary save-training-button',onClick:async()=>{
    store.saveNow();await animationDirector.feedback(saveButton,'save',{duration:360});showToast('训练方案已保存',{type:'success',duration:1400});
  }});
  return el('section',{className:'training-quick-actions'},[
    el('div',{className:'training-quick-actions__hint'},[el('span',{text:recommendation.icon}),el('small',{text:'速度可在下方直接切换'})]),
    saveButton,
    button('返回生涯推进',{className:'button button--primary',onClick:()=>ctx.navigate('career')})
  ]);
}

function trainingRecommendation(save,plans){
  const recent=(save.career.matchHistory||[]).slice(-3).map(match=>Number(match.rating||0)).filter(Boolean);
  const average=recent.length?recent.reduce((sum,value)=>sum+value,0)/recent.length:7;
  if(save.status.injury||save.status.fitness<55||save.status.fatigue>=62)return{id:'recovery',level:'warning',icon:'♥',iconMotion:'fatigue',title:'先恢复，再增长',message:`当前体能 ${Math.round(save.status.fitness)}、疲劳 ${Math.round(save.status.fatigue)}，高强度训练会放大伤病风险。`,shortReason:'体能负荷偏高，优先恢复',iconMotion:'fatigue'};
  const focus=POSITION_FOCUS[save.player.position]||['pac','pas','phy'];
  const weakest=[...focus].sort((a,b)=>(save.player.attrs[a]||0)-(save.player.attrs[b]||0))[0];
  const planByAttr={pac:'speed',sho:'shooting',pas:'passing',dri:'dribbling',def:'defending',phy:'physical'};
  if(average<6.7){const id=planByAttr[weakest]||'physical',plan=plans.find(item=>item.id===id);return{id,level:'attention',icon:'!',iconMotion:'warning',title:'近期比赛需要针对性补强',message:`最近 ${recent.length||3} 场平均评分 ${average.toFixed(1)}，建议优先提升${ATTR_LABELS[weakest]}。`,shortReason:`近期评分偏低，补强${ATTR_LABELS[weakest]}`,iconMotion:'warning'};}
  if((save.player.secondaryPositions||[]).length===0&&save.status.coachTrust>=66)return{id:'newPosition',level:'info',icon:'↗',title:'可以拓展第二位置',message:'教练信任已达到可尝试新位置的水平，增加战术用途有助于争取出场。',shortReason:'教练信任良好，适合开发新位置',iconMotion:'growth'};
  const id=planByAttr[weakest]||'tactics',plan=plans.find(item=>item.id===id);
  return{id,level:'success',icon:'↑',title:`本周推荐：${plan?.name||'战术课堂'}`,message:`当前状态稳定，${ATTR_LABELS[weakest]}是位置关键属性中的相对短板。`,shortReason:`位置短板：${ATTR_LABELS[weakest]}`,iconMotion:'growth'};
}

function assessPlan(save,plan,recommendedId){
  const focus=POSITION_FOCUS[save.player.position]||[];
  const positionHits=plan.focus.filter(key=>focus.includes(key)).length;
  const loadPenalty=Math.max(0,(55-save.status.fitness)*.7)+Math.max(0,save.status.fatigue-45)*.45;
  const risk=Math.max(0,Math.min(99,Math.round(plan.risk+loadPenalty)));
  let fit=58+positionHits*10+(plan.id===recommendedId?18:0)+(plan.selected?5:0)-Math.max(0,plan.intensity-2)*Math.max(0,60-save.status.fitness)*.35;
  if(plan.id==='recovery'&&save.status.fatigue<30&&save.status.fitness>80)fit-=18;
  fit=Math.max(20,Math.min(99,Math.round(fit)));
  const reason=plan.id===recommendedId?'符合当前教练建议':positionHits?`覆盖 ${positionHits} 项位置关键能力`:'属于长期专项储备';
  return{risk,fit,reason};
}

function vital(icon,label,value,type){return el('div',{className:`training-vital training-vital--${type}`},[el('span',{className:`icon-motion icon-motion--${type}`,text:icon}),el('div',{},[el('small',{text:label}),el('strong',{text:`${value}${type==='fitness'||type==='fatigue'?'':'%'}`})])])}
function previewMetric(icon,label,value,type){return el('div',{className:'training-preview-metric'},[el('span',{className:`icon-motion icon-motion--${type}`,text:icon}),el('small',{text:label}),el('strong',{text:value})])}
function uniquePlans(items){const seen=new Set();return items.filter(item=>item&&!seen.has(item.id)&&seen.add(item.id))}
