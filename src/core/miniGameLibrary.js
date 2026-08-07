import { normalizePosition } from './positionResolver.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const ALL_POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];

const define = (id, name, input, stat, renderer, positions = ALL_POSITIONS) => Object.freeze({ id, name, input, stat, renderer, positions });

export const MINI_GAME_LIBRARY = Object.freeze([
  define('reaction', '反应信号', 'reaction', 'speed', 'trainingGame'),
  define('rhythm', '节奏点击', 'rhythm', 'physical', 'trainingGame'),
  define('aim', '目标瞄准', 'target', 'shooting', 'trainingGame', ['ST', 'LW', 'RW', 'CAM']),
  define('three-choice', '三向选择', 'quick-choice', 'shooting', 'trainingGame', ['ST', 'LW', 'RW', 'CAM']),
  define('curve', '轨迹控制', 'trajectory', 'shooting', 'trainingGame', ['ST', 'LW', 'RW', 'CAM', 'CM']),
  define('dodge', '线路闪避', 'lane', 'dribbling', 'trainingGame', ['LW', 'RW', 'CAM', 'ST', 'LB', 'RB']),
  define('moving-target', '移动目标', 'target', 'passing', 'trainingGame', ['CM', 'CAM', 'LW', 'RW', 'ST', 'CB', 'CDM']),
  define('timing-window', '时机窗口', 'timing', 'passing', 'trainingGame', ['CM', 'CAM', 'LW', 'RW', 'ST']),
  define('aerial', '高空落点', 'timing', 'physical', 'trainingGame', ['CB', 'CM', 'ST', 'GK']),
  define('contact-window', '触球窗口', 'timing', 'defending', 'trainingGame', ['CB', 'LB', 'RB', 'CDM', 'CM']),
  define('balance', '重心稳定', 'range', 'physical', 'trainingGame', ['CB', 'LB', 'RB', 'CDM', 'CM', 'ST']),
  define('lights', '反应灯', 'reaction', 'speed', 'trainingGame'),
  define('memory', '位置记忆', 'memory', 'passing', 'trainingGame', ['CM', 'CAM', 'CDM', 'CB']),
  define('tactical', '战术判断', 'quick-choice', 'passing', 'trainingGame'),
  define('swipe', '方向滑动', 'swipe', 'defending', 'trainingGame', ['GK']),
  define('hold-release', '长按释放', 'hold', 'defending', 'trainingGame', ['GK']),
  define('drag-target', '拖动落点', 'drag', 'physical', 'trainingGame', ['GK']),
  define('power-target', '力度目标', 'power', 'passing', 'trainingGame', ['GK']),
  define('safe-rhythm', '康复节奏', 'rhythm', 'physical', 'trainingGame'),
  define('keep-zone', '安全区域', 'drag', 'physical', 'trainingGame'),
  define('aim-power', '方向与力度', 'power', 'shooting', 'interactiveMatch', ['ST', 'LW', 'RW', 'CAM']),
  define('decision', '瞬间决策', 'quick-choice', 'shooting', 'interactiveMatch'),
  define('lane', '传球线路', 'lane', 'passing', 'interactiveMatch'),
  define('moving-line', '跑位直塞', 'timing', 'passing', 'interactiveMatch'),
  define('sequence', '连续变向', 'sequence', 'dribbling', 'interactiveMatch'),
  define('timing', '抢断时机', 'timing', 'defending', 'interactiveMatch'),
  define('direction', '扑救方向', 'direction', 'defending', 'interactiveMatch', ['GK']),
  define('direction-clue', '脚型预判', 'direction', 'defending', 'interactiveMatch', ['GK']),
  define('position-window', '站位窗口', 'position', 'physical', 'interactiveMatch', ['GK']),
  define('target-power', '出球力度', 'power', 'passing', 'interactiveMatch', ['GK']),
  define('strategy-meter', '补时策略', 'strategy', 'physical', 'interactiveMatch')
]);

export const MINI_GAME_COUNT = MINI_GAME_LIBRARY.length;
const BY_ID = new Map(MINI_GAME_LIBRARY.map(item => [item.id, item]));
const INTERACTION_TO_GAME = Object.freeze({
  shooting: 'moving-target', penalty: 'aim-power', 'free-kick': 'curve', 'one-on-one': 'decision', header: 'moving-target',
  'passing-lane': 'lane', 'through-ball': 'moving-line', 'dribble-dodge': 'sequence', tackle: 'timing', 'body-duel': 'rhythm',
  'goalkeeper-save': 'direction', 'goalkeeper-charge': 'decision', 'penalty-save': 'direction-clue', 'aerial-claim': 'position-window', distribution: 'target-power', 'stoppage-decision': 'strategy-meter'
});

export function miniGameById(id) { return BY_ID.get(id) || null; }
export function miniGameForInteraction(id) { return miniGameById(INTERACTION_TO_GAME[id]); }

export function createMiniGameContext({ gameId, player = {}, opponent = {}, match = {} } = {}) {
  const game = miniGameById(gameId) || miniGameForInteraction(gameId) || MINI_GAME_LIBRARY[0];
  const position = normalizePosition(player.position);
  const skill = clamp(player.stats?.[game.stat] ?? player.ovr ?? 60, 1, 99);
  const opponentAbility = clamp(opponent[game.stat] ?? opponent.defense ?? opponent.rep ?? 60, 1, 99);
  const fatigue = clamp(player.fatigue ?? (100 - (player.fitness ?? 80)), 0, 100);
  const pressure = clamp(match.pressure ?? 50, 0, 100);
  const importance = clamp(match.importanceValue ?? 50, 0, 100);
  const positionFit = game.positions.includes(position) ? 1 : .65;
  const difficulty = Math.round(clamp(48 + (opponentAbility - skill) * .28 + fatigue * .16 + (pressure - 50) * .16 + (importance - 50) * .12 - positionFit * 8, 10, 90));
  return { game, position, skill, opponentAbility, fatigue, pressure, importance, positionFit, difficulty };
}
