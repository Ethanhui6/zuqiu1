import { activeInjury } from './injuryEngine.js';

export const YELLOW_CARD_SUSPENSION_INTERVAL = 5;

export function activeSuspension(state = {}) {
  return (state.discipline?.suspensions || []).find(item => item.status === 'active' && item.remainingMatches > 0) || null;
}

export function matchAvailability(state = {}) {
  const suspension = activeSuspension(state);
  if (suspension) return { type: 'suspension', label: '停赛', copy: `${suspension.reason === 'red-card' ? '红牌' : '黄牌累计'}停赛，本场无法出场。`, suspension };
  const injury = activeInjury(state.injuries);
  return injury ? { type: 'injury', label: '伤病缺阵', copy: `${injury.type}尚未恢复，无法出场。`, injury } : null;
}

export function recordMatchCard(state, card, { date = state.simulation?.date, matchId } = {}) {
  if (!['yellow', 'red'].includes(card)) return null;
  const discipline = state.discipline ??= { yellowCards: 0, redCards: 0, suspensions: [], history: [] };
  discipline.suspensions ??= [];
  discipline.history ??= [];
  const key = card === 'yellow' ? 'yellowCards' : 'redCards';
  discipline[key] = Number(discipline[key] || 0) + 1;
  state.season[key] = Number(state.season[key] || 0) + 1;
  const entry = { id: `card-${matchId || date}-${discipline.history.length + 1}`, type: card, date, matchId: matchId || null };
  discipline.history.push(entry);
  const seasonYellows = Number(state.season.yellowCards || 0);
  const reason = card === 'red' ? 'red-card' : seasonYellows > 0 && seasonYellows % YELLOW_CARD_SUSPENSION_INTERVAL === 0 ? 'yellow-card-accumulation' : null;
  if (reason) {
    const suspension = { id: `suspension-${entry.id}`, reason, cards: reason === 'yellow-card-accumulation' ? seasonYellows : 1, remainingMatches: 1, status: 'active', issuedAt: date, servedMatchIds: [] };
    discipline.suspensions.push(suspension);
    entry.suspensionId = suspension.id;
    state.season.suspensions = Number(state.season.suspensions || 0) + 1;
    state.season.highlights ??= [];
    state.season.highlights.push(reason === 'red-card' ? '红牌停赛' : `${seasonYellows} 张黄牌累计停赛`);
  }
  state.career?.history?.push({ date, type: 'discipline', title: reason === 'red-card' ? '红牌停赛' : reason ? '黄牌累计停赛' : '比赛黄牌', summary: reason ? '下一场正式比赛无法进入名单。' : '纪律记录已写入本赛季。', card, suspensionId: entry.suspensionId || null });
  return entry;
}

export function serveSuspension(state, matchId) {
  const suspension = activeSuspension(state);
  if (!suspension || suspension.servedMatchIds.includes(matchId)) return false;
  suspension.servedMatchIds.push(matchId);
  suspension.remainingMatches = Math.max(0, suspension.remainingMatches - 1);
  if (!suspension.remainingMatches) suspension.status = 'served';
  return true;
}
