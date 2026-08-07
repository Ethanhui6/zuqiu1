import { icon } from '../components/icons.js';
import { metric } from '../components/ui.js';
import { applyDevelopment } from '../core/playerDevelopmentEngine.js';
import { trainingPlanById } from '../core/trainingOpportunities.js';

const ATTR_CN = { speed: '速度', shooting: '射门', passing: '传球', dribbling: '盘带', defending: '防守', physical: '身体' };
const GROUP_CN = { attack: '前场', midfield: '中场', defense: '后场', keeper: '门将', recovery: '恢复' };

export function trainingPage(app, state) {
  const player = state.player;
  const opportunity = state.training.currentOpportunity;
  const root = document.createElement('section');
  root.className = 'page training-page';
  const choices = opportunity?.choices || [];
  const positionLabel = player.position === 'GK' || player.position.includes('门将') ? '门将' : player.position;
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title">训练机会</h1><p class="page-subtitle">训练只在关键节点出现，方案由位置、状态和近期表现生成</p></div><span class="badge ${opportunity ? 'orange' : 'blue'}">${opportunity ? '待选择' : '等待节点'}</span></div>
    <section class="surface-card training-status"><div class="card-row"><div><div class="card-kicker">${icon('training', 'sm')} 本赛季参与</div><h2 class="card-title">${state.training.seasonTrainingCount || 0} / 2 次关键训练</h2><p class="card-copy">日常训练在后台模拟，只有这里的训练会进入可操作小游戏。</p></div><span class="badge ${positionLabel === '门将' ? 'purple' : 'green'}">${GROUP_CN[opportunity?.group] || positionLabel}</span></div>${metric('当前体能', player.fitness, { tone: player.fitness < 55 ? 'orange' : 'green' })}${metric('疲劳', player.fatigue, { tone: player.fatigue > 65 ? 'red' : 'orange' })}</section>
    ${opportunity ? `<section class="training-opportunity"><div class="section-heading"><div><div class="card-kicker">${opportunity.createdAt} · 第${opportunity.week}周</div><h2 class="card-title">教练组为你准备了 ${choices.length} 个方案</h2><p class="card-copy">${opportunity.position}训练池 · 选择后才会进入对应的实战小游戏。</p></div><span class="badge orange">关键节点</span></div><div class="training-opportunity-grid">${choices.map(plan => planCard(plan, player, state)).join('')}</div></section>` : `<section class="empty-training"><div class="icon-tile">${icon('calendar')}</div><h2 class="card-title">当前没有待处理训练</h2><p class="card-copy">推进生涯会自动跳过普通周，在赛季关键节点生成 2 至 4 个适合你的位置训练。</p><button class="app-button primary" data-open-simulation>${icon('fast', 'sm')}推进到下一关键节点</button></section>`}
    <section class="surface-card training-note"><div class="card-kicker">位置分流</div><div class="tag-row"><span class="badge blue">${player.position}</span><span class="badge green">短板优先</span><span class="badge purple">结果写入存档</span></div><p class="card-copy">门将只会收到扑救、反应、站位、手控球、出击和开球路线；场上球员不会看到门将专项。</p></section>`;
  root.addEventListener('click', event => {
    const planId = event.target.closest('[data-training-plan]')?.dataset.trainingPlan;
    if (planId) return app.startTraining(choices.find(plan => plan.id === planId) || trainingPlanById(planId));
    if (event.target.closest('[data-open-simulation]')) app.openSimulation();
  });
  return root;
}

function planCard(plan, player, state) {
  const preview = trainingPreview(plan, player, state);
  const changes = Object.entries(preview.changes).filter(([, value]) => value > 0).slice(0, 3).map(([key, value]) => `${ATTR_CN[key] || key} +${value.toFixed(2)}`).join(' · ');
  const keeper = Object.entries(plan.goalkeepingGains || {}).map(([key, value]) => `${key} +${Number(value).toFixed(2)}`).join(' · ');
  return `<button class="surface-card interactive training-opportunity-card ${plan.group === 'keeper' ? 'keeper-training-card' : ''}" data-training-plan="${plan.id}"><div class="card-row"><div class="icon-tile">${icon(plan.icon)}</div><span class="badge ${plan.risk >= 12 ? 'orange' : 'green'}">${trainingRiskLabel(plan.risk)}</span></div><h3 class="card-title">${plan.name}</h3><p class="card-copy">${plan.skills.join(' · ')}</p><div class="tag-row">${plan.tags.map(tag => `<span class="badge blue">${tag}</span>`).join('')}</div><div class="plan-meta"><span>适配 ${plan.fit}%</span><span>疲劳 ${plan.fatigue > 0 ? '+' : ''}${plan.fatigue}</span></div><p class="training-card-growth">${changes || '状态调整'}${keeper ? `<br>${keeper}` : ''}</p><span class="card-footer"><span>选择后开始小游戏</span>${icon('chevron', 'sm card-arrow')}</span></button>`;
}

function trainingRiskLabel(value) { return Number(value) >= 12 ? '负荷偏高' : Number(value) >= 7 ? '中等负荷' : '低负荷'; }

export function trainingPreview(plan, player, state = {}) {
  const changes = applyDevelopment(player, plan.gains || {}, {
    fatigue: player.fatigue,
    injured: (state.injuries || []).some(item => !['recovered', 'archived'].includes(item.status)),
    facility: 78 + Number(state.training?.facilityLevel || 1) * 2,
    coachQuality: 75 + Number(state.training?.coachBonus || 0),
    mode: state.settings?.mode || 'standard'
  }).changes;
  return { changes, fatigue: plan.fatigue, risk: plan.risk };
}
