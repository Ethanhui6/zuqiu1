import { MINI_GAME_LIBRARY } from './miniGameLibrary.js';

const ICON_BY_STAT = { speed: 'speed', shooting: 'shooting', passing: 'passing', dribbling: 'dribbling', defending: 'defending', physical: 'physical' };
const miniGameEntries = MINI_GAME_LIBRARY.flatMap(game => [
  [`mini-${game.id}-success`, { tone: 'success', icon: ICON_BY_STAT[game.stat] || 'match', effect: `mini-${game.id}-success`, title: `${game.name}完成`, burst: true, sound: 'success' }],
  [`mini-${game.id}-failure`, { tone: 'danger', icon: ICON_BY_STAT[game.stat] || 'match', effect: `mini-${game.id}-failure`, title: `${game.name}未达标`, burst: true, sound: 'failure' }]
]);

const matchEntries = [
  ['goal', '进球', 'record'], ['assist', '助攻', 'passing'], ['big-save', '关键扑救', 'goalkeeper'], ['key-pass', '关键传球', 'passing'], ['interception', '完成拦截', 'defending'], ['tackle-won', '抢断成功', 'defending'], ['tackle-lost', '抢断失败', 'risk'], ['woodwork', '击中门框', 'match'], ['offside', '越位', 'risk'], ['yellow-card', '黄牌警告', 'risk'], ['red-card', '红牌罚下', 'risk'], ['penalty', '赢得点球', 'match'], ['penalty-saved', '点球被扑', 'goalkeeper'], ['own-goal', '乌龙球', 'match'], ['var', 'VAR复核', 'analytics'], ['injury', '比赛受伤', 'injury'], ['winner', '制胜球', 'trophy'], ['clean-sheet', '零封对手', 'defending'], ['miss', '射门偏出', 'shooting'], ['blocked', '射门被封堵', 'defending']
].map(([id, title, icon]) => [`match-${id}`, { tone: ['tackle-lost', 'offside', 'yellow-card', 'red-card', 'penalty-saved', 'injury', 'miss', 'blocked'].includes(id) ? 'danger' : 'success', icon, effect: `match-${id}`, title, burst: true, sound: id === 'goal' || id === 'winner' ? 'success' : 'tap' }]);

const careerEntries = [
  ['growth-breakthrough', '能力突破', 'growth'], ['potential-rise', '潜力上升', 'potential'], ['trust-up', '教练信任提升', 'trust'], ['morale-up', '士气上升', 'morale'], ['value-up', '身价上涨', 'business'], ['starter-earned', '赢得首发', 'starter'], ['substitute-called', '进入替补名单', 'bench'], ['new-position', '解锁新位置', 'formation'], ['trait-unlocked', '解锁新特质', 'potential'], ['new-event', '新事件到达', 'message'], ['follow-up-event', '剧情后续到达', 'todo'], ['transfer-offer', '收到转会报价', 'transfer'], ['contract-signed', '完成签约', 'contract'], ['injury-alert', '伤病警报', 'injury'], ['recovery-complete', '恢复完成', 'recovery'], ['news-published', '新闻发布', 'media'], ['fans-rise', '球迷反应', 'fans'], ['season-record', '赛季纪录生成', 'calendar'], ['trophy-earned', '获得奖杯', 'trophy'], ['career-retired', '生涯回顾开启', 'trophy']
].map(([id, title, icon]) => [`career-${id}`, { tone: 'success', icon, effect: `career-${id}`, title, burst: true, sound: 'success' }]);

export const MEANINGFUL_FEEDBACK_CATALOG = Object.freeze(Object.fromEntries([...miniGameEntries, ...matchEntries, ...careerEntries]));
export const meaningfulFeedbackCount = Object.keys(MEANINGFUL_FEEDBACK_CATALOG).length;

export function miniGameFeedbackId(mechanic, success) {
  const id = `mini-${mechanic}-${success ? 'success' : 'failure'}`;
  return MEANINGFUL_FEEDBACK_CATALOG[id] ? id : null;
}
