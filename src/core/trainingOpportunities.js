import { trainingGameById, trainingGamesByPlan } from '../data/trainingGames.js';
import { keyedRandom } from '../services/rng.js';

const POOLS = Object.freeze({
  attack: [
    { id: 'attack-finishing', name: '禁区终结', icon: 'shooting', tags: ['终结', '比赛'], risk: 12, fatigue: 8, gains: { shooting: .62, dribbling: .12 }, skills: ['跑位', '第一脚', '射门'], gameId: 'shooting-target' },
    { id: 'attack-acceleration', name: '纵向爆发', icon: 'speed', tags: ['爆发', '冲刺'], risk: 15, fatigue: 10, gains: { speed: .58, physical: .16 }, skills: ['启动', '变向', '冲刺'], gameId: 'sprint-start' },
    { id: 'attack-dribble', name: '一对一突破', icon: 'dribbling', tags: ['技术', '对抗'], risk: 13, fatigue: 9, gains: { dribbling: .62, speed: .12 }, skills: ['触球', '变向', '护球'], gameId: 'slalom-dribble' },
    { id: 'attack-setpiece', name: '定位球脚法', icon: 'tactics', tags: ['专项', '低负荷'], risk: 6, fatigue: 5, gains: { shooting: .32, passing: .34 }, skills: ['弧线', '落点', '力度'], gameId: 'free-kick' }
  ],
  midfield: [
    { id: 'midfield-passing', name: '视野与组织', icon: 'passing', tags: ['稳健', '教练安排'], risk: 6, fatigue: 6, gains: { passing: .62, dribbling: .12 }, skills: ['扫描', '接应', '直塞'], gameId: 'passing-target' },
    { id: 'midfield-pressing', name: '压迫与回收', icon: 'physical', tags: ['强度', '团队'], risk: 11, fatigue: 9, gains: { defending: .35, physical: .28 }, skills: ['卡线', '反抢', '覆盖'], gameId: 'body-duel' },
    { id: 'midfield-carry', name: '小空间推进', icon: 'dribbling', tags: ['技术', '推进'], risk: 10, fatigue: 8, gains: { dribbling: .48, passing: .2 }, skills: ['转身', '带球', '分球'], gameId: 'through-ball' },
    { id: 'midfield-tactics', name: '战术判断', icon: 'tactics', tags: ['低负荷', '阅读'], risk: 4, fatigue: 4, gains: { passing: .34, defending: .16 }, skills: ['站位', '节奏', '选择'], gameId: 'tactical-choice' }
  ],
  defense: [
    { id: 'defense-positioning', name: '站位与拦截', icon: 'defending', tags: ['稳健', '防守'], risk: 7, fatigue: 7, gains: { defending: .62, passing: .12 }, skills: ['封堵', '预判', '拦截'], gameId: 'tackle-window' },
    { id: 'defense-duel', name: '身体对抗', icon: 'physical', tags: ['对抗', '高负荷'], risk: 14, fatigue: 10, gains: { physical: .48, defending: .22 }, skills: ['卡位', '争顶', '力量'], gameId: 'body-duel' },
    { id: 'defense-aerial', name: '防线制空', icon: 'ball', tags: ['头球', '保护'], risk: 10, fatigue: 8, gains: { physical: .4, defending: .24 }, skills: ['落点', '争顶', '解围'], gameId: 'header' },
    { id: 'defense-build', name: '后场出球', icon: 'passing', tags: ['传导', '低负荷'], risk: 5, fatigue: 5, gains: { passing: .45, defending: .16 }, skills: ['接球', '转移', '推进'], gameId: 'through-ball' }
  ],
  keeper: [
    { id: 'keeper-reflexes', name: '门线反应', icon: 'goalkeeper', tags: ['门将专属', '反应'], risk: 9, fatigue: 7, gains: { speed: .24, defending: .1 }, goalkeepingGains: { saves: .48, reaction: .58 }, skills: ['扑救', '反应', '侧扑'], gameId: 'keeper-save' },
    { id: 'keeper-command', name: '出击与制空', icon: 'goalkeeper', tags: ['门将专属', '判断'], risk: 11, fatigue: 8, gains: { defending: .28, physical: .12 }, goalkeepingGains: { positioning: .42, aerial: .38, saves: .18 }, skills: ['站位', '出击', '高空球'], gameId: 'keeper-high-ball' },
    { id: 'keeper-distribution', name: '门将开球', icon: 'goalkeeper', tags: ['门将专属', '出球'], risk: 5, fatigue: 5, gains: { passing: .3, physical: .06 }, goalkeepingGains: { distribution: .62, handling: .16 }, skills: ['手抛球', '长传', '落点'], gameId: 'keeper-distribution' },
    { id: 'keeper-charge', name: '一对一出击', icon: 'goalkeeper', tags: ['门将专属', '胆量'], risk: 13, fatigue: 8, gains: { speed: .2, defending: .28 }, goalkeepingGains: { positioning: .46, reaction: .24, saves: .24 }, skills: ['距离', '封角', '收球'], gameId: 'keeper-charge' }
  ],
  recovery: [{ id: 'recovery-reset', name: '恢复与活动度', icon: 'recovery', tags: ['医疗建议', '低风险'], risk: 2, fatigue: -9, gains: { physical: .12 }, skills: ['活动度', '呼吸', '负荷控制'], gameId: 'rehab-rhythm' }]
});

const normalizePosition = value => String(value || '').toUpperCase();
export const MAX_SEASON_TRAINING_NODES = 1;
export function trainingPositionGroup(position) {
  const value = normalizePosition(position);
  if (value.includes('门将') || value === 'GK') return 'keeper';
  if (value.includes('前锋') || value.includes('边锋') || value.includes('前腰') || ['ST', 'LW', 'RW', 'CAM', 'SS'].includes(value)) return 'attack';
  if (value.includes('后卫') || value.includes('中卫') || value.includes('边后卫') || ['CB', 'LB', 'RB'].includes(value)) return 'defense';
  return 'midfield';
}

function fitScore(plan, state) {
  const stats = state.player?.stats || {};
  const target = Object.entries(plan.gains).reduce((sum, [key, value]) => sum + (Number(value) * (100 - Number(stats[key] || 50))), 0);
  const fatigue = Number(state.player?.fatigue || 0);
  return target - (fatigue > 65 && plan.fatigue > 6 ? 18 : 0) - plan.risk;
}

export function trainingPool(position, state = {}) {
  const group = trainingPositionGroup(position);
  const tired = Number(state.player?.fatigue || 0) >= 72;
  const injured = (state.injuries || []).some(item => !['recovered', 'archived'].includes(item.status));
  if (injured) return POOLS.recovery;
  if (tired) return [...POOLS.recovery, ...POOLS[group].filter(plan => plan.fatigue <= 6)];
  return POOLS[group];
}

export function trainingPlanById(id) {
  return Object.values(POOLS).flat().find(plan => plan.id === id) || null;
}

export function createTrainingOpportunity(state, { seed = state.simulation?.date || 'training', force = false } = {}) {
  state.training ??= {};
  if (state.training.currentOpportunity) return state.training.currentOpportunity;
  if (!force && Number(state.training.seasonTrainingCount || 0) >= MAX_SEASON_TRAINING_NODES) return null;
  const pool = trainingPool(state.player?.position, state);
  if (!pool.length) return null;
  const group = pool.every(plan => plan.id === 'recovery-reset') ? 'recovery' : trainingPositionGroup(state.player?.position);
  const rng = keyedRandom(seed, state.player?.position || 'CM', state.season?.week || 1, state.training.seasonTrainingCount || 0);
  const count = Math.min(pool.length, 2 + rng.int(0, 2));
  const choices = [...pool].sort((a, b) => fitScore(b, state) - fitScore(a, state)).slice(0, count).map(plan => ({
    ...plan,
    group,
    game: rng.pick(trainingGamesByPlan(trainingGameById(plan.gameId).plan)) || trainingGameById(plan.gameId),
    fit: Math.max(42, Math.min(96, Math.round(62 + fitScore(plan, state) / 8)))
  }));
  const opportunity = {
    id: `training-${state.season?.year || 'season'}-${state.season?.week || 1}-${state.training.seasonTrainingCount || 0}`,
    seed: String(seed), position: state.player?.position || '中场', group: trainingPositionGroup(state.player?.position),
    createdAt: state.simulation?.date, week: state.season?.week || 1, choices, status: 'pending'
  };
  state.training.currentOpportunity = opportunity;
  state.training.opportunityHistory ??= [];
  state.training.opportunityHistory.push({ id: opportunity.id, seed: opportunity.seed, date: opportunity.createdAt, count: choices.length, group: opportunity.group });
  return opportunity;
}

export function resolveTrainingOpportunity(state, planId) {
  const current = state.training?.currentOpportunity;
  const plan = current?.choices?.find(item => item.id === planId) || trainingPlanById(planId);
  if (!plan) return null;
  if ((state.injuries || []).some(item => !['recovered', 'archived'].includes(item.status)) && plan.id !== 'recovery-reset') return null;
  state.training.currentOpportunity = null;
  state.training.seasonTrainingCount = Number(state.training.seasonTrainingCount || 0) + 1;
  state.training.resolvedNodes ??= [];
  state.training.resolvedNodes.push({ id: current?.id || `manual-${state.simulation.date}`, planId, date: state.simulation.date, seed: current?.seed || null });
  return plan;
}

export const trainingPositionPools = POOLS;
