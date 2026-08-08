import { keyedRandom } from '../services/rng.js';

export const RESULT_ANIMATIONS = Object.freeze([
  'success-trails', 'failure-cracks', 'neutral-progress', 'hidden-flip', 'rare-scan', 'legend-spotlight', 'attribute-rise', 'attribute-drop', 'ovr-upgrade', 'potential-expand', 'trust-flow', 'morale-shift', 'value-counter', 'news-slide', 'offer-enter', 'transfer-sign', 'transfer-break', 'injury-alert', 'recovery-heal', 'season-close', 'season-open', 'var-scan', 'achievement-clear', 'trophy-rise', 'family-card', 'random-reveal', 'lineup-light', 'substitute-time', 'goal-net', 'retirement-replay'
]);

export const RANDOM_ANIMATIONS = Object.freeze([
  'coin-flip', 'dual-route', 'ball-zone', 'var-review', 'penalty-direction', 'keeper-dive', 'draw-ball', 'offer-counter', 'agent-call', 'medical-scan', 'weather-shift', 'referee-delay', 'pass-intercept', 'post-bounce', 'crowd-swing', 'headline-cut', 'coach-roll', 'national-list', 'award-roll', 'cup-draw', 'contract-reveal', 'medical-terms', 'family-reaction', 'season-surprise'
]);

export const EVENT_JUDGEMENT_ANIMATIONS = Object.freeze([...RESULT_ANIMATIONS, ...RANDOM_ANIMATIONS]);

export function pickOutcomeAnimation(type = 'success', seed = 'outcome') {
  const pool = type === 'random' ? RANDOM_ANIMATIONS : RESULT_ANIMATIONS;
  return keyedRandom(seed, type, pool.length).pick(pool);
}

export function pickEventJudgementAnimation(seed = 'event') {
  return keyedRandom(seed, 'event-judgement', EVENT_JUDGEMENT_ANIMATIONS.length).pick(EVENT_JUDGEMENT_ANIMATIONS);
}

export function resolveRandomOutcome(state, key, kind = 'random') {
  state.random ??= { seed: `career-${state.createdAt || 'save'}`, history: [], last: null };
  state.random.history = Array.isArray(state.random.history) ? state.random.history : [];
  const seed = `${state.random.seed}|${key}|${state.simulation?.date || ''}|${state.random.history.length}`;
  const rng = keyedRandom(seed);
  const value = Number(rng.next().toFixed(6));
  const outcome = value < .5 ? '低调结果' : value < .78 ? '机会结果' : '意外结果';
  const record = { seed, value, outcome, animationId: pickOutcomeAnimation('random', seed), kind, date: state.simulation?.date };
  state.random.history.push(record);
  state.random.history = state.random.history.slice(-80);
  state.random.last = record;
  return record;
}
