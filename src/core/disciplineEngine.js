import { activeInjury } from './injuryEngine.js';

export function matchAvailability(state = {}) {
  const injury = activeInjury(state.injuries);
  if (injury) return { type: 'injury', label: '伤病缺阵', copy: `${injury.type}尚未恢复，无法出场。` };
  const suspension = (state.discipline?.suspensions || []).find(item => item.status === 'active' && item.remainingMatches > 0);
  return suspension ? { type: 'suspension', label: '停赛', copy: `${suspension.reason === 'red-card' ? '红牌' : '纪律'}停赛，本场无法出场。`, suspension } : null;
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
  if (card === 'red') {
    const suspension = { id: `suspension-${entry.id}`, reason: 'red-card', remainingMatches: 1, status: 'active', issuedAt: date, servedMatchIds: [] };
    discipline.suspensions.push(suspension);
    entry.suspensionId = suspension.id;
  }
  return entry;
}

export function serveSuspension(state, matchId) {
  const suspension = matchAvailability(state)?.suspension;
  if (!suspension || suspension.servedMatchIds.includes(matchId)) return false;
  suspension.servedMatchIds.push(matchId);
  suspension.remainingMatches = Math.max(0, suspension.remainingMatches - 1);
  if (!suspension.remainingMatches) suspension.status = 'served';
  return true;
}
