import { getMatchInteractionsForPosition, normalizePosition } from './interactiveMatchEngine.js';
import { miniGameForInteraction } from './miniGameLibrary.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const hash = value => { let result = 2166136261; for (const character of String(value)) result = Math.imul(result ^ character.charCodeAt(0), 16777619); return result >>> 0; };
const textOf = template => [template.title, template.trigger, ...(template.tags || [])].filter(Boolean).join(' ');
const groupPosition = (template, position) => (template.positions || []).some(value => normalizePosition(value) === position);
const zoneFor = text => /回防|抢断|拦截|盯人|上抢|封堵|门线|扑|解围/.test(text) ? 'defensive' : /终结|射门|内切|下底|禁区|单刀|后点|突破/.test(text) ? 'attacking' : 'middle';

const INTERACTION_HINTS = [
  [/扑点|门线|折射|扑救|封堵/, 'goalkeeper-save'],
  [/高空|角球|争顶/, 'aerial-claim'],
  [/脚下|出球|长传|回传/, 'distribution'],
  [/点球/, 'penalty'],
  [/单刀/, 'one-on-one'],
  [/射门|终结|禁区|内切|远射/, 'shooting'],
  [/传中|直塞|转移|组织|回做/, 'through-ball'],
  [/一对一|变向|突破|下底/, 'dribble-dodge'],
  [/抢断|拦截|盯人|上抢|反抢|回防/, 'tackle'],
  [/对抗|卡位|身体/, 'body-duel']
];

const STRATEGY_HINTS = {
  creative: /组织|直塞|传中|创造|回做|转移/,
  aggressive: /压迫|上抢|突破|内切|终结|射门/,
  balanced: /./
};

function interactionFor(template, position) {
  const allowed = getMatchInteractionsForPosition(position);
  const text = textOf(template);
  const preferred = INTERACTION_HINTS.find(([pattern]) => pattern.test(text))?.[1];
  return allowed.find(item => item.id === preferred)?.id || allowed[hash(`${template.id}:${position}`) % allowed.length].id;
}

function weightFor(template, state, tactic, position) {
  const text = textOf(template);
  const style = typeof tactic === 'string' ? tactic : tactic?.style || 'balanced';
  const keywords = Array.isArray(tactic?.keywords) ? tactic.keywords : [];
  const score = Number(state?.score?.home || 0) - Number(state?.score?.away || 0);
  const fatigue = Number(state?.player?.energy ?? 80);
  let weight = Math.max(1, Number(template.weight) || 1);
  if (keywords.some(keyword => text.includes(keyword))) weight += 4;
  if (STRATEGY_HINTS[style]?.test(text)) weight += style === 'balanced' ? 0 : 2;
  if (score < 0 && /进攻|终结|射门|突破|直塞/.test(text)) weight += 2;
  if (score > 0 && /回防|稳守|控制|保球|解围/.test(text)) weight += 2;
  if (Number(state?.matchMinute || 0) >= 70 && /末段|最后|终场|冲刺/.test(text)) weight += 2;
  if (fatigue < 35 && /高强度|冲刺|对抗|压迫/.test(text)) weight = Math.max(1, weight - 1);
  if (position === 'GK' && /射门突破|盘带闪避/.test(text)) weight = 0;
  return weight;
}

function copyFor(template, state, zone) {
  const score = `${state?.score?.home || 0}-${state?.score?.away || 0}`;
  const area = { defensive: '防守三区', middle: '中场', attacking: '进攻三区' }[zone] || '场上';
  return `${area}出现${template.tags?.[1] || '关键球权'}，当前比分 ${score}，你的处理会改变下一次攻势。`;
}

export class MatchEventEngine {
  constructor(templates = []) {
    this.templates = templates.filter(template => template?.category === '比赛');
  }

  eligible(state) {
    const position = normalizePosition(state?.player?.position);
    return this.templates.filter(template => groupPosition(template, position));
  }

  next(state, { tactic = 'balanced' } = {}) {
    const position = normalizePosition(state?.player?.position);
    const candidates = this.eligible(state);
    if (!candidates.length) return null;
    const recentEvents = new Set([...(state?.recentMatchEvents || []), ...(state?.recentHighlights || [])]);
    const recentGames = new Set(state?.recentMiniGames || []);
    const fresh = candidates.filter(template => {
      if (recentEvents.has(template.id) || recentEvents.has(template.tags?.[1])) return false;
      const interaction = interactionFor(template, position);
      return !recentGames.has(miniGameForInteraction(interaction)?.id);
    });
    const pool = fresh.length ? fresh : candidates;
    const weighted = pool.map(template => ({ template, weight: weightFor(template, state, tactic, position) })).filter(item => item.weight > 0);
    if (!weighted.length) return null;
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    const tacticId = typeof tactic === 'string' ? tactic : tactic?.id || tactic?.style || 'balanced';
    let roll = hash(`${state?.seed || state?.matchId || 0}:${state?.matchMinute || 0}:${state?.recentMatchEvents?.length || 0}:${position}:${tacticId}`) % total;
    const picked = weighted.find(item => (roll -= item.weight) < 0)?.template || weighted[0]?.template;
    if (!picked) return null;
    const interactionId = interactionFor(picked, position);
    const zone = zoneFor(textOf(picked));
    return {
      id: `match-${picked.id}`,
      templateId: picked.id,
      source: 'match',
      title: picked.title,
      copy: copyFor(picked, state, zone),
      interactionId,
      positions: picked.positions,
      tags: picked.tags || [],
      zone,
      minute: clamp((state?.matchMinute || 0) + 7 + hash(`${picked.id}:${state?.seed || 0}`) % 16, 6, 90),
      miniGame: miniGameForInteraction(interactionId)
    };
  }
}
