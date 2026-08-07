import { normalizePosition } from './positionResolver.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

const ZONES = ['defensive', 'middle', 'attacking'];

export function createMatchState({ match = {}, player = {}, seed = 0, tactic = 'balanced' } = {}) {
  const morale = clamp(player.morale ?? 60, 0, 100);
  const fitness = clamp(player.fitness ?? 80, 0, 100);
  return {
    status: 'live',
    matchId: match.id || 'match',
    competition: match.competition || '比赛',
    opponent: match.opponent || '对手',
    home: match.venue === '主场',
    seed: Number(seed) || 0,
    matchMinute: 0,
    score: { home: 0, away: 0 },
    possession: 50,
    player: {
      position: normalizePosition(player.position),
      role: player.ovr >= 64 ? 'starter' : 'substitute',
      energy: fitness,
      morale,
      rating: 6
    },
    teamMomentum: 50,
    opponentMomentum: 50,
    pressure: clamp(70 - morale * .45, 20, 90),
    cards: { yellow: 0, red: 0 },
    injuries: [],
    zone: 'middle',
    tacticalContext: { id: tactic },
    miniGame: null,
    recentHighlights: [],
    recentMiniGames: [],
    highlights: []
  };
}

export function advanceMatchState(state, highlight, { score = 50, success = false, skipped = false } = {}) {
  if (!state || !highlight) return state;
  const next = structuredClone(state);
  const quality = clamp(score, 0, 100);
  const momentum = success ? 7 : skipped ? -2 : -5;
  const minute = Math.max(next.matchMinute + 1, Number(highlight.minute) || next.matchMinute + 1);
  next.matchMinute = clamp(minute, 0, 90);
  next.score = { ...next.score, home: Number(next.score.home) || 0, away: Number(next.score.away) || 0 };
  next.possession = clamp(next.possession + (success ? 4 : -3), 15, 85);
  next.teamMomentum = clamp(next.teamMomentum + momentum, 0, 100);
  next.opponentMomentum = clamp(next.opponentMomentum - momentum * .55, 0, 100);
  next.pressure = clamp(100 - next.teamMomentum + next.opponentMomentum * .35, 10, 96);
  next.player = {
    ...next.player,
    energy: clamp(next.player.energy - (success ? 7 : 5), 0, 100),
    rating: Number(clamp(6 + (quality - 50) / 45, 4, 9.6).toFixed(1))
  };
  if (success && next.zone !== 'attacking') next.zone = ZONES[Math.min(ZONES.indexOf(next.zone) + 1, 2)];
  if (!success && next.zone !== 'defensive') next.zone = ZONES[Math.max(ZONES.indexOf(next.zone) - 1, 0)];
  const record = { id: highlight.id, minute: next.matchMinute, title: highlight.title, zone: next.zone, score: quality, success };
  next.highlights.push(record);
  next.recentHighlights = [...next.recentHighlights, highlight.id].slice(-4);
  if (highlight.miniGame?.id) next.recentMiniGames = [...next.recentMiniGames, highlight.miniGame.id].slice(-4);
  return next;
}
