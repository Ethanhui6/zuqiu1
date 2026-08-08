import { icon } from '../components/icons.js';
import { statGrid } from '../components/ui.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';
import { ensureTransferInbox } from '../core/transferInboxEngine.js';

const money = value => `€${Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US')}`;
const safe = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const TABS = Object.freeze([
  ['received', '收到邀请'],
  ['agent', '经纪人推荐'],
  ['exploring', '主动探索'],
  ['watchlist', '关注'],
  ['history', '历史谈判']
]);

export function availableTransferClubs(state, clubs) {
  return clubs.filter(club => club.id !== state.player?.clubId && club.name !== state.player?.club && club.cn !== state.player?.club);
}

export function transferPage(app, state) {
  const transfer = ensureTransferInbox(state);
  const clubs = dataRepository.clubs?.length ? dataRepository.clubs : CLUBS;
  const current = clubs.find(club => club.id === state.player?.clubId) || clubs.find(club => (club.cn || club.name) === state.player?.club);
  const selected = availableTransferClubs(state, clubs).find(club => club.id === transfer.club);
  const activeOffers = transfer.offers.filter(offer => ['pending', 'inquiry', 'negotiating'].includes(offer.status));
  const root = document.createElement('section');
  root.className = 'page transfer-page';
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title">转会中心</h1><p class="page-subtitle">市场会主动关注你的表现，正式接触集中进入收件箱</p></div><span class="badge ${activeOffers.length ? 'orange' : 'blue'}">${activeOffers.length} 份待处理</span></div>
    <section class="surface-card transfer-contract"><div class="card-row"><div><div class="card-kicker">${icon('contract', 'sm')} 当前合同</div><h2 class="card-title">${safe(state.player.club)}</h2><p class="card-copy">剩余 ${Number(state.career.contractMonths || 0)} 个月 · 周薪 ${money(state.career.weeklySalary)} · 身价 ${money(state.career.marketValue)}</p></div><span class="badge blue">OVR ${state.player.ovr}</span></div>${statGrid([['经纪人建议', agentSummary(transfer)], ['赛季评分', state.season.rating || '—'], ['关注球队', transfer.watchlist.length], ['市场动态', transfer.inbox.length]])}<div class="transfer-contract-actions"><button class="app-button ghost" data-transfer-action="stay">留队争取位置</button><button class="app-button ghost" data-transfer-action="renew">请求续约</button><button class="app-button ghost" data-transfer-action="loan">请求外租</button><button class="app-button ghost" data-transfer-action="transfer-request">申请转会</button><button class="app-button secondary" data-transfer-action="agent-report">请求经纪人调查</button></div></section>
    <section class="surface-card transfer-inbox"><div class="card-row"><div><div class="card-kicker">${icon('message', 'sm')} Transfer Inbox</div><h2 class="card-title">转会收件箱</h2></div><span class="badge ${transfer.inbox.some(item => item.unread) ? 'orange' : 'green'}">${transfer.inbox.filter(item => item.unread).length} 条新动态</span></div><div class="transfer-inbox-tabs" role="tablist">${TABS.map(([id, label]) => `<button class="${transfer.activeTab === id ? 'active' : ''}" role="tab" aria-selected="${transfer.activeTab === id}" data-transfer-tab="${id}">${label}</button>`).join('')}</div><div class="transfer-inbox-panel">${inboxPanel(transfer.activeTab, state, clubs)}</div></section>
    <section class="surface-card transfer-focus"><div class="card-row"><div><div class="card-kicker">${icon('club', 'sm')} 主动探索入口</div><h2 class="card-title">按国家、赛事和位置寻找下一站</h2><p class="card-copy">主动接触会与系统发来的球探关注、传闻和正式报价分开记录。</p></div><button class="icon-button" data-open-clubs aria-label="打开俱乐部目录">${icon('chevron')}</button></div></section>
    ${selected ? `<section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('club', 'sm')} 球队详情</div><h2 class="card-title">${safe(selected.cn || selected.name)}</h2><p class="card-copy">${safe([selected.city, selected.leagueCn || selected.league].filter(Boolean).join(' · '))}</p></div><span class="badge green">适配 ${Math.round(((selected.academy || selected.youth || 60) + (selected.opportunity || selected.youthUsage || 60)) / 2)}%</span></div><div class="card-row" style="margin-top:14px"><button class="app-button ghost" data-club-action="compare">加入比较</button><button class="app-button secondary" data-club-action="agent">经纪人接触</button><button class="app-button primary" data-club-action="contact">请求沟通</button></div></section>` : ''}`;
  root.addEventListener('click', event => {
    if (event.target.closest('[data-open-clubs]')) return app.navigate('clubs');
    const tab = event.target.closest('[data-transfer-tab]')?.dataset.transferTab;
    if (tab) return app.store.set(next => { next.transfer.activeTab = tab; return next; });
    const transferAction = event.target.closest('[data-transfer-action]')?.dataset.transferAction;
    if (transferAction === 'agent-report') app.requestAgentReport(); else if (transferAction) app.handleClubAction(transferAction, current);
    const clubAction = event.target.closest('[data-club-action]')?.dataset.clubAction;
    if (clubAction) app.handleClubAction(clubAction, selected);
    const offerId = event.target.closest('[data-inbox-offer]')?.dataset.inboxOffer;
    if (offerId) {
      const offer = transfer.offers.find(item => item.id === offerId);
      const club = clubs.find(item => item.id === offer?.clubId);
      if (club) app.openTransferOffer(club, offer);
    }
  });
  return root;
}

function inboxPanel(tab, state, clubs) {
  const transfer = state.transfer;
  if (tab === 'received') return activityList(transfer.inbox, transfer, clubs, '还没有收到市场动态', '推进时间后，球探关注和俱乐部邀请会出现在这里。');
  if (tab === 'agent') return activityList(transfer.inbox.filter(item => item.stage === 'agent_contact'), transfer, clubs, '经纪人还没有新推荐', '当俱乐部进入接触阶段，经纪人会在这里汇总信息。');
  if (tab === 'exploring') {
    const actions = new Set(['compare', 'interest', 'agent', 'contact', 'expected-contract']);
    const rows = (state.clubInteractions?.history || []).filter(item => actions.has(item.action));
    return rows.length ? `<div class="transfer-inbox-list">${rows.map(item => `<article class="transfer-inbox-item"><span class="transfer-stage-icon">${icon('search', 'sm')}</span><div><strong>${safe(item.label || item.action)}</strong><p>${safe(clubs.find(club => club.id === item.clubId)?.cn || clubs.find(club => club.id === item.clubId)?.name || item.clubId)} · ${safe(item.date)}</p></div><span class="badge blue">主动</span></article>`).join('')}</div>` : empty('还没有主动探索', '从俱乐部目录加入比较、表达兴趣或联系球队。');
  }
  if (tab === 'watchlist') {
    const watched = transfer.watchlist.map(id => clubs.find(club => club.id === id)).filter(Boolean);
    return watched.length ? `<div class="transfer-inbox-list">${watched.map(club => `<article class="transfer-inbox-item"><span class="transfer-stage-icon">${icon('eye', 'sm')}</span><div><strong>${safe(club.cn || club.name)}</strong><p>${safe(club.country || '')} · ${safe(club.leagueCn || club.league || '')}</p></div><span class="badge purple">关注</span></article>`).join('')}</div>` : empty('关注列表为空', '在俱乐部目录中把有兴趣的球队加入比较。');
  }
  return transfer.negotiations.length ? `<div class="transfer-inbox-list">${transfer.negotiations.map(item => { const offer = transfer.offers.find(row => row.id === item.offerId); const club = clubs.find(row => row.id === (offer?.clubId || item.clubId)); return `<article class="transfer-inbox-item"><span class="transfer-stage-icon">${icon('contract', 'sm')}</span><div><strong>${safe(club?.cn || club?.name || item.clubId)}</strong><p>${safe(item.action)} · ${safe(item.date)}</p></div><span class="badge ${item.status === 'rejected' ? 'orange' : item.status === 'accepted' ? 'green' : 'blue'}">${statusLabel(item.status)}</span></article>`; }).join('')}</div>` : empty('还没有谈判记录', '查看正式报价并回应后，谈判轨迹会保存在这里。');
}

function activityList(items, transfer, clubs, title, copy) {
  if (!items.length) return empty(title, copy);
  return `<div class="transfer-inbox-list">${items.map(item => { const club = clubs.find(row => row.id === item.clubId); const offer = item.offerId ? transfer.offers.find(row => row.id === item.offerId) : null; return `<article class="transfer-inbox-item ${item.unread ? 'is-new' : ''}"><span class="transfer-stage-icon">${icon(item.stage === 'formal_offer' ? 'contract' : item.stage === 'agent_contact' ? 'agent' : 'transfer', 'sm')}</span><div><small>${safe(item.stageLabel)} · ${item.market === 'domestic' ? '国内' : '海外'} · ${levelLabel(item.level)}</small><strong>${safe(item.clubName)}</strong><p>${safe(item.copy)}</p></div>${offer && ['pending', 'inquiry', 'negotiating'].includes(offer.status) ? `<button class="app-button secondary" data-inbox-offer="${safe(offer.id)}">查看</button>` : `<span class="badge blue">${item.score}</span>`}</article>`; }).join('')}</div>`;
}

function empty(title, copy) { return `<div class="transfer-inbox-empty"><span>${icon('message')}</span><div><strong>${title}</strong><p>${copy}</p></div></div>`; }
function agentSummary(transfer) { return transfer.inbox.some(item => item.stage === 'formal_offer') ? '优先处理报价' : transfer.inbox.some(item => item.stage === 'agent_contact') ? '已有俱乐部接触' : '保持开放'; }
function levelLabel(level) { return level === 'higher' ? '更高平台' : level === 'lower' ? '更稳出场' : '同级'; }
function statusLabel(status) { return status === 'accepted' ? '已接受' : status === 'rejected' ? '已拒绝' : status === 'negotiating' ? '谈判中' : '待处理'; }
