import { icon } from '../components/icons.js';
import { metric, statGrid } from '../components/ui.js';
import { crestSvg } from '../components/clubCrest.js';
import { ensureHonors } from '../systems/honors/honorsSystem.js';

export function careerPage(app, state) {
  const player = state.player;
  const next = state.schedule.find(match => match.status === 'upcoming' && match.date >= state.simulation.date);
  const injury = state.injuries.find(item => !['recovered', 'archived'].includes(item.status));
  const pending = state.events.pending[0];
  const opportunity = state.training.currentOpportunity;
  const urgent = injury ? { icon: 'medical', tone: 'critical', title: '医疗路线待确认', copy: `${injury.type} · 预计剩余 ${Math.ceil(injury.remainingDays)} 天`, action: 'medical', label: '立即处理' }
    : pending ? { icon: 'message', title: pending.title, copy: `${pending.location || '职业现场'} · ${(pending.participants || []).join('、')}`, action: 'event', label: '处理事件' }
    : opportunity ? { icon: 'training', title: '关键训练机会已到达', copy: `${opportunity.position} · ${opportunity.choices.length} 个方案可选`, action: 'training', label: '选择方案' }
    : next ? { icon: 'match', title: '下一场比赛准备', copy: `${next.date} · ${next.venue} 对阵 ${next.opponent}`, action: 'match', label: '查看准备' } : null;
  const lastGrowth = state.training.lastResult?.changes || state.career.growthLog.at(-1)?.changes || {};
  const news = state.news.items.slice(0, 3);
  const root = document.createElement('section');
  root.className = 'page career-page';
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title">生涯控制台</h1><p class="page-subtitle">${state.simulation.date} · ${state.season.year} 第${Math.max(1, state.season.week)}周</p></div><span class="badge ${state.simulation.paused ? 'orange' : 'green'}">${state.simulation.paused ? '已暂停' : '推进中'}</span></div>
    ${urgent ? `<button class="surface-card notice-card ${urgent.tone || ''}" data-action="${urgent.action}"><div class="card-row"><div class="card-row" style="justify-content:flex-start"><div class="notice-icon">${icon(urgent.icon)}</div><div><div class="card-kicker">现在需要处理</div><h2 class="card-title">${urgent.title}</h2><p class="card-copy">${urgent.copy}</p></div></div><span class="app-button secondary">${urgent.label}</span></div></button><div style="height:14px"></div>` : ''}
    <div class="hero-grid"><button class="surface-card player-hero interactive" data-action="player-detail"><div class="card-row"><div><div class="ovr">${player.ovr}</div><div class="ovr-caption">OVR · 潜力 ${Math.round(player.potential)}</div></div><div class="avatar">${player.number}</div></div><div class="hero-name">${player.name}</div><p class="card-copy">${player.club} · ${player.team}<br>${player.position} · ${player.age}岁 · €${Math.round(state.career.marketValue / 1000)}K</p><div class="tag-row"><span class="badge ${injury ? 'orange' : 'green'}">${injury ? '恢复中' : '健康'}</span><span class="badge blue">${player.status || '首发竞争'}</span></div></button>
      <button class="surface-card interactive" data-action="career-data"><div class="card-row"><div><div class="card-kicker">${icon('calendar', 'sm')} 赛季轨道</div><h2 class="card-title">完成度 ${state.season.progress}%</h2></div><span class="badge blue">第${Math.max(1, state.season.week)}周</span></div>${statGrid([['出场', state.season.appearances], ['进球', state.season.goals], ['助攻', state.season.assists], ['评分', state.season.rating || '—']])}${metric('体能', player.fitness, { tone: 'green' })}${metric('士气', player.morale)}${metric('教练信任', player.coachTrust, { tone: 'orange' })}<div class="card-footer"><span class="card-copy">${next ? `${next.competition} · ${next.opponent}` : '暂无近期比赛'}</span>${icon('chevron', 'sm card-arrow')}</div></button></div>
    ${newsBroadcast(news)}${growthHighlight(lastGrowth, state)}${seasonHistory(state)}
    <div style="height:14px"></div><div class="grid-2">${compactCard('todo', '赛季目标', state.season.objectives.length ? `${state.season.objectives.length}项进行中` : '尚未选择阶段重点', 'goals', state.season.objectives.length ? 'green' : 'orange')}${compactCard('analytics', '数据与设施', '分析、医疗、更衣室、荣誉室', 'facilities', 'blue')}${compactCard('growth', '成长趋势', `${recentGrowth(state)} · OVR ${player.ovr}`, 'growth', 'purple')}${compactCard('training', '训练机会', opportunity ? `${opportunity.choices.length} 个方案待选择` : '普通周自动模拟', 'training', opportunity ? 'orange' : 'green')}${compactCard('message', '待处理事件', pending ? pending.title : '当前没有未处理事件', 'events', pending ? 'red' : 'green')}${compactCard('fast', '推进控制', state.simulation.paused ? '已暂停，可继续推进' : `当前${modeLabel(state.settings.mode)}模式`, 'simulation', 'blue')}</div>`;
  root.addEventListener('click', event => { const action = event.target.closest('[data-action]')?.dataset.action; if (action) handle(action, app, state); });
  return root;
}

function newsBroadcast(items) {
  return `<section class="news-broadcast"><div class="section-heading"><div><div class="card-kicker">${icon('message', 'sm')} 今日动态</div><h2 class="card-title">生涯新闻播报</h2></div><button class="icon-button" data-action="news" aria-label="打开新闻中心">${icon('chevron')}</button></div>${items.length ? `<div class="news-broadcast-list">${items.map(item => `<article class="news-broadcast-item"><span class="badge ${item.type === '比赛' ? 'blue' : item.type === '训练' ? 'green' : 'purple'}">${item.type}</span><div><strong>${item.title}</strong><p>${item.copy}</p><time>${item.date}</time></div></article>`).join('')}</div>` : '<p class="card-copy">推进后，球队、比赛和市场动态会出现在这里。</p>'}</section>`;
}

function growthHighlight(changes, state) {
  const entries = Object.entries(changes).filter(([, value]) => Number(value) > 0).slice(0, 3);
  return `<section class="surface-card growth-highlight"><div class="card-row"><div><div class="card-kicker">${icon('growth', 'sm')} 最近一次成长</div><h2 class="card-title">${entries.length ? entries.map(([key, value]) => `${cn(key)} +${Number(value).toFixed(2)}`).join(' · ') : '等待下一次关键反馈'}</h2></div><span class="badge purple">OVR ${state.player.ovr}</span></div><p class="card-copy">${state.training.lastResult?.detail || '完成关键训练或比赛后，成长与教练评价会在这里高亮。'}</p></section>`;
}

function seasonHistory(state) {
  const rows = ensureHonors(state).seasons || [];
  if (!rows.length) return '';
  return `<section class="season-timeline"><div class="section-heading"><div><div class="card-kicker">${icon('calendar', 'sm')} 永久赛季履历</div><h2 class="card-title">你的成长时间轴</h2></div><span class="badge gold">${rows.length} 个赛季</span></div><div class="stack">${rows.map((row, index) => `<details class="season-record" ${index === 0 ? 'open' : ''}><summary><span class="season-crest">${crestSvg({ id: row.clubId || row.club, name: row.club }, { size: 38 })}</span><span class="season-record-main"><strong>${row.year} · ${row.club}</strong><small>${row.position || '未知位置'} · ${row.appearances} 场 · 评分 ${row.rating || '—'}</small></span><span class="badge ${index === 0 ? 'blue' : 'green'}">${row.grade || 'A'}</span></summary><div class="season-record-body"><div class="stat-grid">${[['出场', row.appearances], ['进球', row.goals], ['助攻', row.assists], ['赛季末 OVR', row.endOvr || '—'], ['身价变化', row.valueChange > 0 ? `+${Math.round(row.valueChange / 1000)}K` : `${Math.round(row.valueChange / 1000)}K`], ['荣誉', (row.trophies || []).length + (row.personalAwards || []).length]].map(([label, value]) => `<div class="stat-cell"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`).join('')}</div><p class="card-copy season-highlight">${(row.highlights || []).join(' · ') || `赛季初 OVR ${row.startOvr || '—'} → 赛季末 OVR ${row.endOvr || '—'} · ${row.grade || 'A'} 级赛季`}</p></div></details>`).join('')}</div></section>`;
}

function compactCard(iconName, title, copy, action, tone) { return `<button class="surface-card interactive" data-action="${action}"><div class="card-row"><div class="icon-tile">${icon(iconName)}</div><span class="badge ${tone}">${title === '待处理事件' ? '待办' : '详情'}</span></div><h3 class="card-title">${title}</h3><p class="card-copy">${copy}</p><div class="card-footer"><span class="card-copy">点击查看</span>${icon('chevron', 'sm card-arrow')}</div></button>`; }
function recentGrowth(state) { const last = state.career.growthLog.at(-1); if (!last) return '等待首次关键反馈'; const entries = Object.entries(last.changes || {}).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]); return entries.length ? `${cn(entries[0][0])} +${entries[0][1].toFixed(2)}` : '近期保持稳定'; }
function cn(key) { return { speed: '速度', shooting: '射门', passing: '传球', dribbling: '盘带', defending: '防守', physical: '身体' }[key] || key; }
function modeLabel(value) { return { standard: '标准', fast: '快速', legend: '传奇', ultra: '极速' }[value] || '标准'; }
function trainingSuggestion(player, injury) { if (injury) return '伤病恢复中，等待下一次康复安排'; if (player.fitness < 60) return '体能偏低，后台自动降低负荷'; const entries = Object.entries(player.stats).sort((a, b) => a[1] - b[1]); return `${cn(entries[0][0])}短板会影响下一次训练机会`; }
function handle(action, app, state) { if (action === 'player-detail') return app.openPlayerDetail(); if (action === 'career-data') return app.openCareerData(); if (action === 'medical') return app.openMedical(); if (action === 'event') { const event = state.events.pending[0]; return event ? app.openEvent(event) : app.feedback.emit('empty', '当前没有待处理事件'); } if (action === 'training') return app.navigate('training'); if (action === 'events') return app.openEventCenter(); if (action === 'news') return app.openNewsCenter(); if (action === 'simulation') return app.openSimulation(); if (action === 'goals') return app.openGoals(); if (action === 'facilities') return app.openFacilities(); if (action === 'growth') return app.openGrowth(); if (action === 'match') return app.navigate('match'); }
