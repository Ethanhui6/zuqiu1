import { keyedRandom } from '../services/rng.js';
import { addNews } from './newsEngine.js';

export const TRANSFER_STAGES = Object.freeze([
  { id: 'scout_attention', label: '球探关注' },
  { id: 'rumor', label: '转会传闻' },
  { id: 'agent_contact', label: '经纪人联系' },
  { id: 'club_interest', label: '俱乐部兴趣' },
  { id: 'formal_offer', label: '正式报价' }
]);

export const CLUB_TRANSFER_TABS = Object.freeze([
  { id: 'current', label: '当前球队' },
  { id: 'role', label: '阵容地位' },
  { id: 'squad', label: '完整阵容' },
  { id: 'contract', label: '合同' },
  { id: 'interest', label: '球队兴趣' },
  { id: 'offers', label: '正式报价' },
  { id: 'agent', label: '经纪人' }
]);

const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
const clubRep = club => Number(club?.rep ?? club?.reputation ?? club?.competition ?? 60);
const clubName = club => club.cn || club.name || club.nameZh || club.id;
const isWindow = date => ['01', '07'].includes(String(date).slice(5, 7));
const stageCeiling = (score, date) => score >= 76 && isWindow(date) ? 4 : score >= 66 ? 3 : score >= 57 ? 2 : score >= 49 ? 1 : 0;

export function ensureTransferInbox(state) {
  state.transfer ??= {};
  state.transfer.offers = Array.isArray(state.transfer.offers) ? state.transfer.offers : [];
  state.transfer.watchlist = Array.isArray(state.transfer.watchlist) ? state.transfer.watchlist : [];
  state.transfer.inbox = Array.isArray(state.transfer.inbox) ? state.transfer.inbox : [];
  state.transfer.negotiations = Array.isArray(state.transfer.negotiations) ? state.transfer.negotiations : [];
  state.transfer.evaluatedMonths = Array.isArray(state.transfer.evaluatedMonths) ? state.transfer.evaluatedMonths : [];
  state.transfer.pipelines = state.transfer.pipelines && typeof state.transfer.pipelines === 'object' ? state.transfer.pipelines : {};
  state.transfer.contractOffer = state.transfer.contractOffer && typeof state.transfer.contractOffer === 'object' ? state.transfer.contractOffer : null;
  state.transfer.activeTab ||= 'received';
  return state.transfer;
}

function currentClub(state, clubs) {
  return clubs.find(club => club.id === state.player?.clubId)
    || clubs.find(club => clubName(club) === state.player?.club)
    || null;
}

export function ensureContractOffer(state, clubs, date = state.simulation?.date) {
  const transfer = ensureTransferInbox(state);
  const current = currentClub(state, clubs);
  const months = Number(state.career?.contractMonths ?? 0);
  if (!current || !state.player || months > 6) return null;
  const existing = transfer.contractOffer?.clubId === current.id && ['pending', 'negotiating'].includes(transfer.contractOffer.status) ? transfer.contractOffer : null;
  if (existing) return existing;
  const salary = Math.max(500, Math.round(Number(state.career?.weeklySalary || 1800) * (months === 0 ? 1.08 : 1.16) / 100) * 100);
  const offer = {
    id: `contract-${date || 'undated'}-${current.id}`,
    clubId: current.id,
    clubName: clubName(current),
    date,
    status: 'pending',
    type: months === 0 ? 'expired-renewal' : 'renewal',
    source: 'contract',
    salary,
    weeklySalary: salary,
    contractMonths: months === 0 ? 36 : 24,
    role: state.player.status || '竞争位置',
    interestScore: Math.round(62 + Number(state.player.ovr || 50) * .22),
    decisionLog: []
  };
  transfer.contractOffer = offer;
  transfer.inbox.unshift({
    id: `contract-inbox-${offer.id}`,
    date,
    clubId: current.id,
    clubName: clubName(current),
    stage: 'formal_offer',
    stageLabel: months === 0 ? '合同已到期' : '续约窗口',
    market: 'domestic',
    level: 'peer',
    score: offer.interestScore,
    title: `${clubName(current)}续约方案`,
    copy: months === 0 ? '合同已经到期，俱乐部仍保留续约机会；确认后即可解除合同死锁。' : '合同进入最后六个月，俱乐部已送出续约方案。',
    offerId: offer.id,
    unread: true
  });
  return offer;
}

export function requestTransferInterest(state, clubs, clubId, { loan = false } = {}) {
  const transfer = ensureTransferInbox(state);
  const target = clubs.find(club => club.id === clubId);
  const current = currentClub(state, clubs);
  if (!target || !current || target.id === current.id) return { ok: false, reason: 'current-club' };
  const existing = transfer.inbox.find(item => item.clubId === target.id && item.source === 'player-request' && item.status === 'active');
  if (existing) return { ok: false, reason: 'duplicate', item: existing };
  const item = {
    id: `player-request-${state.simulation?.date || 'undated'}-${target.id}-${loan ? 'loan' : 'transfer'}`,
    date: state.simulation?.date,
    clubId: target.id,
    clubName: clubName(target),
    stage: 'agent_contact',
    stageLabel: loan ? '外租意向' : '转会意向',
    market: target.country === current.country ? 'domestic' : 'overseas',
    level: clubRep(target) >= clubRep(current) + 5 ? 'higher' : clubRep(target) <= clubRep(current) - 5 ? 'lower' : 'peer',
    score: Math.round(transferInterestScore(state, target, current)),
    title: `${clubName(target)}${loan ? '外租' : '转会'}意向`,
    copy: loan ? '经纪人已向球队询问外租角色，等待对方确认出场计划。' : '经纪人已提交转会意向，球队会先评估位置需求与合同空间。',
    source: 'player-request',
    requestType: loan ? 'loan' : 'transfer',
    status: 'active',
    unread: true
  };
  transfer.inbox.unshift(item);
  transfer.pipelines[target.id] = { ...(transfer.pipelines[target.id] || {}), playerRequest: item.requestType, requestDate: item.date };
  transfer.watchlist = [...new Set([...transfer.watchlist, target.id])];
  return { ok: true, item };
}

export function transferInterestScore(state, club, currentClub) {
  const player = state.player || {};
  const season = state.season || {};
  const rating = Number(season.rating || 6.2);
  const performance = (rating - 6) * 8 + Number(season.appearances || 0) * .14 + Number(season.goals || 0) * .3 + Number(season.assists || 0) * .24;
  const youth = Number(player.age || 24) <= 21 ? Math.max(0, Number(player.potential || player.ovr) - Number(player.ovr || 0)) * .38 : 0;
  const contract = Math.max(0, 30 - Number(state.career?.contractMonths || 0)) * .16;
  const needs = club.needs || club.need || [];
  const positionNeed = needs.includes(player.position) || needs.includes('所有位置') ? 9 : -2;
  const reputationGap = clubRep(club) - Number(player.ovr || 50);
  const levelFit = reputationGap > 14 ? -(reputationGap - 14) * 1.8 : reputationGap < -16 ? -4 : 3;
  const nationalityFit = club.country && [player.country, player.nation, player.nationality].includes(club.country) ? 4 : 0;
  const currentGap = currentClub ? Math.abs(clubRep(club) - clubRep(currentClub)) * .08 : 0;
  return clamp(Number(player.ovr || 50) * .66 + youth + performance + contract + positionNeed + levelFit + nationalityFit - currentGap);
}

export function generateTransferActivity(state, clubs, date = state.simulation?.date) {
  const transfer = ensureTransferInbox(state);
  ensureContractOffer(state, clubs, date);
  const month = String(date || '').slice(0, 7);
  if (!state.player || !month || transfer.evaluatedMonths.includes(month)) return [];
  transfer.evaluatedMonths.push(month);
  transfer.evaluatedMonths = transfer.evaluatedMonths.slice(-120);

  const current = clubs.find(club => club.id === state.player.clubId || clubName(club) === state.player.club);
  const candidates = clubs.filter(club => club.id !== current?.id && clubName(club) !== state.player.club).map(club => ({
    club,
    score: transferInterestScore(state, club, current)
  })).filter(item => item.score >= 42 && Number(transfer.pipelines[item.club.id]?.stage ?? -1) < stageCeiling(item.score, date));
  if (!candidates.length) return [];

  const rng = keyedRandom(state.random?.seed || state.createdAt || 'career', 'transfer-market', month, state.player.ovr, state.player.age);
  const ranked = candidates.map(item => ({ ...item, rank: item.score + rng.next() * 10 })).sort((a, b) => b.rank - a.rank);
  const domestic = ranked.find(item => item.club.country && item.club.country === current?.country);
  const overseas = ranked.find(item => item.club.country && item.club.country !== current?.country);
  const higher = ranked.find(item => clubRep(item.club) >= clubRep(current) + 5);
  const lower = ranked.find(item => clubRep(item.club) <= clubRep(current) - 5);
  const levelPick = transfer.evaluatedMonths.length % 2 ? higher : lower;
  const picks = [...new Map([domestic, overseas, levelPick].filter(Boolean).map(item => [item.club.id, item])).values()];
  if (!picks.length) picks.push(ranked[0]);

  const created = [];
  for (const { club, score } of picks) {
    const previous = Number(transfer.pipelines[club.id]?.stage ?? -1);
    const ceiling = stageCeiling(score, date);
    const stageIndex = Math.min(ceiling, previous + 1);
    if (stageIndex <= previous) continue;
    const stage = TRANSFER_STAGES[stageIndex];
    const market = club.country && club.country === current?.country ? 'domestic' : 'overseas';
    const level = clubRep(club) >= clubRep(current) + 5 ? 'higher' : clubRep(club) <= clubRep(current) - 5 ? 'lower' : 'peer';
    const item = {
      id: `market-${month}-${club.id}-${stage.id}`,
      date,
      clubId: club.id,
      clubName: clubName(club),
      country: club.country || '',
      league: club.leagueCn || club.league || '',
      stage: stage.id,
      stageLabel: stage.label,
      market,
      level,
      score: Math.round(score),
      title: `${clubName(club)}：${stage.label}`,
      copy: activityCopy(stage.id, club, state.player),
      unread: true
    };
    if (stage.id === 'formal_offer') {
      const wage = Math.max(500, Math.round((clubRep(club) * 420 + Number(state.player.ovr || 50) * 260) / 100) * 100);
      const offer = { id: `offer-${month}-${club.id}`, clubId: club.id, date, status: 'pending', type: 'formal', source: 'system', salary: wage, role: score >= 84 ? '核心轮换' : score >= 78 ? '一线队轮换' : '竞争位置', interestScore: Math.round(score) };
      if (!transfer.offers.some(existing => existing.id === offer.id)) transfer.offers.unshift(offer);
      item.offerId = offer.id;
    }
    transfer.pipelines[club.id] = { stage: stageIndex, score: Math.round(score), lastDate: date };
    transfer.inbox.unshift(item);
    created.push(item);
  }
  transfer.inbox = transfer.inbox.slice(0, 80);
  return created;
}

export function recordTransferNegotiation(state, offerId, action) {
  const transfer = ensureTransferInbox(state);
  const offer = transfer.offers.find(item => item.id === offerId);
  if (!offer) return null;
  const status = action === '接受意向' ? 'accepted' : action === '拒绝' ? 'rejected' : action === '谈判' ? 'negotiating' : 'pending';
  offer.status = status;
  const record = { id: `negotiation-${state.simulation?.date}-${offerId}-${transfer.negotiations.length}`, date: state.simulation?.date, offerId, clubId: offer.clubId, action, status };
  transfer.negotiations.unshift(record);
  transfer.negotiations = transfer.negotiations.slice(0, 80);
  return record;
}

export function acceptTransferOfferLegacy(state, club, offerId = null) {
  const transfer = ensureTransferInbox(state);
  const clubName = club.cn || club.name || club.nameZh || club.id;
  const offer = transfer.offers.find(item => item.id === offerId) || (transfer.contractOffer?.id === offerId ? transfer.contractOffer : null);
  const isRenewal = offer?.source === 'contract' || offer?.type === 'renewal' || offer?.type === 'expired-renewal';
  if (!state.player || !club?.id || (!isRenewal && club.id === state.player.clubId)) return null;
  if (offer) recordTransferNegotiation(state, offer.id, '接受意向');
  if (isRenewal) {
    state.career.contractMonths = Math.max(12, Number(offer.contractMonths || 24));
    state.career.weeklySalary = Math.max(500, Number(offer.weeklySalary || offer.salary || state.career.weeklySalary || 1800));
    state.career.contractStatus = 'active';
    state.season ??= {};
    state.season.contract = { type: 'renewal', clubId: club.id, date: state.simulation?.date, months: state.career.contractMonths, weeklySalary: state.career.weeklySalary };
    state.career.history ??= [];
    state.career.history.unshift({ date: state.simulation?.date, type: 'contract-renewal', title: `${clubName(club)}续约完成`, clubId: club.id, months: state.career.contractMonths, weeklySalary: state.career.weeklySalary });
    transfer.offers = transfer.offers.filter(item => item.id !== offer?.id);
    if (transfer.contractOffer?.id === offer?.id) transfer.contractOffer = null;
    transfer.inbox = transfer.inbox.filter(item => item.offerId !== offer?.id);
    return state.season.contract;
  }
  const previous = { id: state.player.clubId, name: state.player.club, country: state.player.clubCountry || null };
  const salary = Math.max(500, Number(offer?.salary) || Math.round(Number(state.career?.weeklySalary || 1800) * 1.2));
  const record = { date: state.simulation?.date, type: '转会', title: `转会至 ${clubName}`, summary: `${state.player.name} 从 ${previous.name} 转会至 ${clubName}。`, fromClubId: previous.id, fromClub: previous.name, fromCountry: previous.country, clubId: club.id, club: clubName, country: club.country || '', offerId: offer?.id || null };
  state.player.clubId = club.id;
  state.player.club = clubName;
  state.player.clubCountry = club.country || '';
  state.player.league = club.leagueCn || club.league || '';
  state.player.crestPath = club.crestPath || club.crest || null;
  state.career.weeklySalary = salary;
  state.career.contractMonths = Math.max(24, Number(offer?.contractMonths || 36));
  state.career.history ??= [];
  state.career.history.push(record);
  state.season ??= {};
  state.season.transfer = { ...record, salary };
  state.season.highlights = [...new Set([...(state.season.highlights || []), record.title])];
  state.schedule = (state.schedule || []).filter(match => match.status === 'played');
  transfer.club = club.id;
  addNews(state, { id: `transfer-complete-${state.simulation?.date}-${club.id}`, date: state.simulation?.date, type: '转会', title: record.title, copy: record.summary, relatedClubId: club.id, relatedClub: clubName, importance: 3, scope: 'player' });
  return record;
}

export function acceptTransferOffer(state, club, offerId = null) {
  const transfer = ensureTransferInbox(state);
  const offer = transfer.offers.find(item => item.id === offerId) || (transfer.contractOffer?.id === offerId ? transfer.contractOffer : null);
  const renewal = offer?.source === 'contract' || offer?.type === 'renewal' || offer?.type === 'expired-renewal';
  if (!state.player || !club?.id || (!renewal && club.id === state.player.clubId)) return null;
  if (offer) recordTransferNegotiation(state, offer.id, '\u63a5\u53d7\u610f\u5411');
  const targetName = clubName(club);
  if (renewal) {
    state.career.contractMonths = Math.max(12, Number(offer.contractMonths || 24));
    state.career.weeklySalary = Math.max(500, Number(offer.weeklySalary || offer.salary || state.career.weeklySalary || 1800));
    state.career.contractStatus = 'active';
    state.season ??= {};
    state.season.contract = { type: 'renewal', clubId: club.id, date: state.simulation?.date, months: state.career.contractMonths, weeklySalary: state.career.weeklySalary };
    state.career.history ??= [];
    state.career.history.unshift({ date: state.simulation?.date, type: 'contract-renewal', title: `${targetName}\u7eed\u7ea6\u5b8c\u6210`, clubId: club.id, months: state.career.contractMonths, weeklySalary: state.career.weeklySalary });
    transfer.offers = transfer.offers.filter(item => item.id !== offer?.id);
    if (transfer.contractOffer?.id === offer?.id) transfer.contractOffer = null;
    transfer.inbox = transfer.inbox.filter(item => item.offerId !== offer?.id);
    return state.season.contract;
  }
  const previous = { id: state.player.clubId, name: state.player.club, country: state.player.clubCountry || null };
  const salary = Math.max(500, Number(offer?.salary) || Math.round(Number(state.career?.weeklySalary || 1800) * 1.2));
  const record = { date: state.simulation?.date, type: '\u8f6c\u4f1a', title: `\u8f6c\u4f1a\u81f3${targetName}`, summary: `${state.player.name} \u4ece${previous.name} \u8f6c\u4f1a\u81f3${targetName}`, fromClubId: previous.id, fromClub: previous.name, fromCountry: previous.country, clubId: club.id, club: targetName, country: club.country || '', offerId: offer?.id || null };
  state.player.clubId = club.id;
  state.player.club = targetName;
  state.player.clubCountry = club.country || '';
  state.player.league = club.leagueCn || club.league || '';
  state.player.crestPath = club.crestPath || club.crest || null;
  state.career.weeklySalary = salary;
  state.career.contractMonths = Math.max(24, Number(offer?.contractMonths || 36));
  state.career.history ??= [];
  state.career.history.push(record);
  state.season ??= {};
  state.season.transfer = { ...record, salary };
  state.season.highlights = [...new Set([...(state.season.highlights || []), record.title])];
  state.schedule = (state.schedule || []).filter(match => match.status === 'played');
  transfer.club = club.id;
  addNews(state, { id: `transfer-complete-${state.simulation?.date}-${club.id}`, date: state.simulation?.date, type: '\u8f6c\u4f1a', title: record.title, copy: record.summary, relatedClubId: club.id, relatedClub: targetName, importance: 3, scope: 'player' });
  return record;
}

function activityCopy(stage, club, player) {
  const name = clubName(club);
  if (stage === 'scout_attention') return `${name} 已派球探跟踪你在 ${player.position} 位置的近期表现。`;
  if (stage === 'rumor') return `市场消息把你与 ${name} 联系在一起，目前尚未进入正式接触。`;
  if (stage === 'agent_contact') return `经纪人收到 ${name} 的背景询问，正在核对角色和合同空间。`;
  if (stage === 'club_interest') return `${name} 已表达明确兴趣，位置需求与赛季表现将决定下一步。`;
  return `${name} 已送达正式方案，可在收件箱中查看并回应。`;
}
