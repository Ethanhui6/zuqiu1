import { icon } from '../components/icons.js';
import { statGrid } from '../components/ui.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';
import { CLUB_TRANSFER_TABS, ensureContractOffer, ensureTransferInbox, transferMarketHeat } from '../core/transferInboxEngine.js';

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
  const contractOffer = ensureContractOffer(state, clubs, state.simulation?.date);
  if (contractOffer) app.store.save();
  const activeClubTab = CLUB_TRANSFER_TABS.some(tab => tab.id === transfer.clubTab) ? transfer.clubTab : 'current';
  const selected = availableTransferClubs(state, clubs).find(club => club.id === transfer.club);
  const activeOffers = [...transfer.offers, ...(contractOffer ? [contractOffer] : [])].filter(offer => ['pending', 'inquiry', 'negotiating'].includes(offer.status));
  const heat = transferMarketHeat(state);
  const root = document.createElement('section');
  root.className = 'page transfer-page';
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title">转会世界</h1><p class="page-subtitle">球队会根据表现主动考察、联系并报价</p></div><span class="badge ${activeOffers.length ? 'orange' : 'blue'}">${activeOffers.length} 份待处理</span></div>
    ${marketOverview(state, transfer, heat)}
    <section class="surface-card transfer-contract"><div class="card-row"><div><div class="card-kicker">${icon('contract', 'sm')} 当前合同</div><h2 class="card-title">${safe(state.player.club)}</h2><p class="card-copy">剩余 ${Number(state.career.contractMonths || 0)} 个月 · 周薪 ${money(state.career.weeklySalary)} · 身价 ${money(state.career.marketValue)}</p></div><span class="badge blue">OVR ${state.player.ovr}</span></div>${statGrid([['经纪人建议', agentSummary(transfer)], ['赛季评分', state.season.rating || '—'], ['关注球队', transfer.watchlist.length], ['市场动态', transfer.inbox.length]])}<div class="transfer-contract-actions"><button class="app-button ghost" data-transfer-action="stay">留队争取位置</button><button class="app-button ghost" data-transfer-action="renew">请求续约</button><button class="app-button ghost" data-transfer-action="loan">请求外租</button><button class="app-button ghost" data-transfer-action="transfer-request">申请转会</button><button class="app-button secondary" data-transfer-action="agent-report">请求经纪人调查</button></div></section>
    <section class="surface-card transfer-inbox"><div class="card-row"><div><div class="card-kicker">${icon('message', 'sm')} Transfer Inbox</div><h2 class="card-title">转会收件箱</h2></div><span class="badge ${transfer.inbox.some(item => item.unread) ? 'orange' : 'green'}">${transfer.inbox.filter(item => item.unread).length} 条新动态</span></div><div class="transfer-inbox-tabs" role="tablist">${TABS.map(([id, label]) => `<button class="${transfer.activeTab === id ? 'active' : ''}" role="tab" aria-selected="${transfer.activeTab === id}" data-transfer-tab="${id}">${label}</button>`).join('')}</div><div class="transfer-inbox-panel">${inboxPanel(transfer.activeTab, state, clubs)}</div></section>
    ${clubTransferHubMarkup(activeClubTab, state, current, clubs, transfer, contractOffer)}
    <section class="surface-card transfer-focus"><div class="card-row"><div><div class="card-kicker">${icon('club', 'sm')} 主动探索入口</div><h2 class="card-title">按国家、赛事和位置寻找下一站</h2><p class="card-copy">主动接触会与系统发来的球探关注、传闻和正式报价分开记录。</p></div><button class="icon-button" data-open-clubs aria-label="打开俱乐部目录">${icon('chevron')}</button></div></section>
    ${selected ? `<section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('club', 'sm')} 球队详情</div><h2 class="card-title">${safe(selected.cn || selected.name)}</h2><p class="card-copy">${safe([selected.city, selected.leagueCn || selected.league].filter(Boolean).join(' · '))}</p></div><span class="badge green">适配 ${Math.round(((selected.academy || selected.youth || 60) + (selected.opportunity || selected.youthUsage || 60)) / 2)}%</span></div><div class="card-row" style="margin-top:14px"><button class="app-button ghost" data-club-action="compare">加入比较</button><button class="app-button secondary" data-club-action="agent">经纪人接触</button><button class="app-button primary" data-club-action="contact">请求沟通</button></div></section>` : ''}`;
  root.addEventListener('click', event => {
    if (event.target.closest('[data-open-clubs]')) return app.navigate('clubs');
    const clubTab = event.target.closest('[data-club-transfer-tab]')?.dataset.clubTransferTab;
    if (clubTab) return app.store.set(next => { next.transfer.clubTab = clubTab; return next; });
    if (event.target.closest('[data-open-current-club]')) {
      if (current?.id) app.store.set(next => { next.transfer.club = current.id; return next; });
      return app.navigate('clubs');
    }
    const tab = event.target.closest('[data-transfer-tab]')?.dataset.transferTab;
    if (tab) return app.store.set(next => { next.transfer.activeTab = tab; return next; });
    const transferAction = event.target.closest('[data-transfer-action]')?.dataset.transferAction;
    if (transferAction === 'agent-report') app.requestAgentReport(); else if (transferAction) app.handleClubAction(transferAction, current);
    const clubAction = event.target.closest('[data-club-action]')?.dataset.clubAction;
    if (clubAction) app.handleClubAction(clubAction, selected);
    const offerId = event.target.closest('[data-inbox-offer]')?.dataset.inboxOffer;
    if (offerId) {
      const offer = transfer.offers.find(item => item.id === offerId) || (transfer.contractOffer?.id === offerId ? transfer.contractOffer : null);
      const club = clubs.find(item => item.id === offer?.clubId);
      if (club) app.openTransferOffer(club, offer);
    }
  });
  return root;
}

function marketOverview(state, transfer, heat) {
  const months = Number(state.career?.contractMonths || 0);
  const contract = months <= 0 ? '已到期' : months <= 6 ? `${months}个月 · 待续约` : `${months}个月`;
  const rumor = heat.recentRumor ? `${heat.recentRumor.clubName} · ${heat.recentRumor.copy}` : '暂无转会传闻';
  return `<section class="surface-card transfer-market-overview" data-market-heat="${heat.id}"><div class="transfer-market-head"><div><div class="card-kicker">Market Heat</div><h2 class="card-title">${heat.label} <span>${heat.score}</span></h2></div><span class="badge ${heat.tone}">${heat.formalOffers ? `${heat.formalOffers} 份报价` : `${heat.interestedClubs} 家关注`}</span></div><div class="transfer-market-facts"><div><small>球队兴趣</small><strong>${heat.interestedClubs ? `${heat.interestedClubs} 家` : '暂无'}</strong></div><div><small>合同状态</small><strong>${contract}</strong></div><div><small>经纪人建议</small><strong>${agentSummary(transfer)}</strong></div></div><p class="transfer-market-rumor"><span>近期传闻</span>${safe(rumor)}</p></section>`;
}

function clubTransferHubMarkup(tab, state, current, clubs, transfer, contractOffer) {
  const player = state.player || {};
  const currentName = current?.cn || current?.name || player.club || '\u5f53\u524d\u7403\u961f';
  const role = player.status || player.teamRole || (Number(player.ovr) >= 76 ? '\u4e3b\u529b\u7ade\u4e89' : '\u53d1\u5c55\u9636\u6bb5');
  const currentInterest = transfer.inbox.filter(item => item.clubId !== current?.id && item.stage !== 'formal_offer');
  const formalOffers = transfer.inbox.filter(item => item.stage === 'formal_offer' || item.offerId);
  let panel;
  if (tab === 'role') panel = `<section class="club-transfer-panel" data-club-transfer-section="role"><div class="card-kicker">\u9635\u5bb9\u5730\u4f4d</div><h2 class="card-title">${safe(currentName)} \u00b7 ${safe(role)}</h2><p class="card-copy">${safe(player.position || 'CM')} \u00b7 OVR ${Math.round(Number(player.ovr) || 0)} \u00b7 \u6559\u7ec3\u4fe1\u4efb ${Math.round(Number(player.coachTrust) || 0)}</p><div class="tag-row"><span class="badge green">\u9996\u53d1\u7ade\u4e89</span><span class="badge blue">\u4f4d\u7f6e\u9700\u6c42 ${current?.needs?.includes(player.position) ? '\u660e\u786e' : '\u4e00\u822c'}</span><span class="badge orange">\u4f53\u80fd ${Math.round(Number(player.fitness) || 0)}</span></div></section>`;
  else if (tab === 'squad') panel = `<section class="club-transfer-panel" data-club-transfer-section="squad"><div class="card-kicker">\u5b8c\u6574\u9635\u5bb9</div><h2 class="card-title">\u67e5\u770b ${safe(currentName)} \u7684\u5b8c\u6574\u9635\u5bb9</h2><p class="card-copy">\u8fdb\u5165\u4ff1\u4e50\u90e8\u6863\u6848\u540e\u53ef\u6309\u4f4d\u7f6e\u67e5\u770b\u771f\u5b9e\u7403\u5458\u3001\u961f\u5fbd\u3001\u9635\u5bb9\u7ade\u4e89\u548c\u6218\u672f\u4fe1\u606f\u3002</p><button type="button" class="app-button secondary" data-open-current-club>${icon('users', 'sm')} \u6253\u5f00\u5f53\u524d\u7403\u961f</button></section>`;
  else if (tab === 'contract') panel = `<section class="club-transfer-panel" data-club-transfer-section="contract"><div class="card-kicker">\u5408\u540c</div><h2 class="card-title">${Number(state.career?.contractMonths || 0)} \u4e2a\u6708\u5269\u4f59</h2><p class="card-copy">\u5468\u85aa ${money(state.career?.weeklySalary)} \u00b7 \u8eab\u4ef7 ${money(state.career?.marketValue)}</p><div class="tag-row"><span class="badge ${Number(state.career?.contractMonths || 0) <= 6 ? 'orange' : 'blue'}">${Number(state.career?.contractMonths || 0) <= 6 ? '\u9700\u8981\u5904\u7406' : '\u5408\u540c\u6709\u6548'}</span><span class="badge purple">${contractOffer ? '\u7eed\u7ea6\u65b9\u6848\u5df2\u5230\u8fbe' : '\u7b49\u5f85\u7eed\u7ea6\u7a97\u53e3'}</span></div><button type="button" class="app-button primary" data-transfer-action="renew">${contractOffer ? '\u67e5\u770b\u7eed\u7ea6\u65b9\u6848' : '\u9884\u7ea6\u7eed\u7ea6\u8c08\u5224'}</button></section>`;
  else if (tab === 'interest') panel = `<section class="club-transfer-panel" data-club-transfer-section="interest"><div class="card-kicker">\u7403\u961f\u5174\u8da3</div><h2 class="card-title">\u4e3b\u52a8\u5173\u6ce8\u4e0e\u7403\u961f\u52a8\u6001</h2>${activityList(currentInterest, transfer, clubs, '\u6682\u65e0\u7403\u961f\u5174\u8da3', '\u63a8\u8fdb\u8d5b\u5b63\u540e\uff0c\u7403\u63a2\u5173\u6ce8\u3001\u7ecf\u7eaa\u4eba\u8054\u7cfb\u548c\u7403\u961f\u5174\u8da3\u4f1a\u6309\u8868\u73b0\u9010\u7ea7\u51fa\u73b0\u3002')}</section>`;
  else if (tab === 'offers') panel = `<section class="club-transfer-panel" data-club-transfer-section="offers"><div class="card-kicker">\u6b63\u5f0f\u62a5\u4ef7</div><h2 class="card-title">${formalOffers.length} \u4efd\u6b63\u5f0f\u65b9\u6848</h2>${activityList(formalOffers, transfer, clubs, '\u6682\u65e0\u6b63\u5f0f\u62a5\u4ef7', '\u6b63\u5f0f\u62a5\u4ef7\u4f1a\u663e\u793a\u5408\u540c\u3001\u89d2\u8272\u548c\u51fa\u573a\u7a7a\u95f4\uff0c\u63a5\u53d7\u540e\u624d\u4f1a\u6539\u53d8\u5f53\u524d\u7403\u961f\u3002')}</section>`;
  else if (tab === 'agent') panel = `<section class="club-transfer-panel" data-club-transfer-section="agent"><div class="card-kicker">\u7ecf\u7eaa\u4eba</div><h2 class="card-title">\u7531\u8868\u73b0\u51b3\u5b9a\u4e0b\u4e00\u7ad9</h2><p class="card-copy">\u7ecf\u7eaa\u4eba\u4f1a\u7efc\u5408\u5e74\u9f84\u3001\u80fd\u529b\u3001\u6f5c\u529b\u3001\u8d5b\u5b63\u8868\u73b0\u3001\u8363\u8a89\u3001\u5408\u540c\u671f\u9650\u548c\u7403\u961f\u4f4d\u7f6e\u9700\u6c42\u63a8\u8fdb\u8c08\u5224\u3002</p><div class="tag-row"><span class="badge blue">\u5173\u6ce8 ${transfer.watchlist.length} \u961f</span><span class="badge green">\u52a8\u6001 ${transfer.inbox.length} \u6761</span><span class="badge purple">\u8bb0\u5f55 ${transfer.negotiations.length} \u6b21</span></div><button type="button" class="app-button secondary" data-transfer-action="agent-report">\u8bf7\u6c42\u7ecf\u7eaa\u4eba\u8c03\u67e5</button></section>`;
  else panel = `<section class="club-transfer-panel" data-club-transfer-section="current"><div class="card-kicker">\u5f53\u524d\u7403\u961f</div><h2 class="card-title">${safe(currentName)}</h2><p class="card-copy">${safe([current?.country, current?.leagueCn || current?.league].filter(Boolean).join(' · ') || '\u5f53\u524d\u6548\u529b\u7403\u961f')}</p><div class="tag-row"><span class="badge green">${safe(role)}</span><span class="badge blue">${safe(player.position || 'CM')}</span><span class="badge gold">OVR ${Math.round(Number(player.ovr) || 0)}</span></div><div class="card-row" style="margin-top:12px"><button type="button" class="app-button secondary" data-open-current-club>${icon('club', 'sm')} \u67e5\u770b\u7403\u961f\u6863\u6848</button><button type="button" class="app-button ghost" data-transfer-action="stay">\u7559\u961f\u7ade\u4e89</button></div></section>`;
  const tabs = CLUB_TRANSFER_TABS.map(item => `<button type="button" class="club-transfer-tab ${item.id === tab ? 'active' : ''}" role="tab" aria-selected="${item.id === tab}" data-club-transfer-tab="${item.id}">${safe(item.label)}</button>`).join('');
  return `<section class="club-transfer-hub" data-club-transfer-hub><div class="club-transfer-tabs" role="tablist" aria-label="俱乐部与转会菜单">${tabs}</div><div class="club-transfer-tabs-wrap" data-club-transfer-pane><div class="club-transfer-tab-indicator">${safe(currentName)}</div>${panel}</div></section>`;
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
function statusLabel(status) { return status === 'accepted' ? '已接受' : status === 'rejected' ? '已拒绝' : status === 'negotiating' ? '谈判中' : status === 'terms-agreed' ? '已达成' : status === 'counter-rejected' ? '未达成' : '待处理'; }
