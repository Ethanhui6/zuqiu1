const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

export const MATCH_INTERACTIONS = Object.freeze([
  { id: 'shooting', name: '射门时机', mechanic: 'moving-target', icon: 'shooting', stat: 'shooting', copy: '点击停住移动指针，越接近甜蜜区越接近死角。', positions: ['ST', 'LW', 'RW', 'CAM'] },
  { id: 'penalty', name: '点球瞄准', mechanic: 'aim-power', icon: 'target', stat: 'shooting', copy: '选择方向与力度，门将会根据预判扑救。', positions: ['ST', 'LW', 'RW', 'CAM'] },
  { id: 'free-kick', name: '任意球弧线', mechanic: 'curve', icon: 'tactics', stat: 'shooting', copy: '拖动弧线、旋转和力度，绕过人墙。', positions: ['ST', 'LW', 'RW', 'CAM', 'CM'] },
  { id: 'one-on-one', name: '单刀决策', mechanic: 'decision', icon: 'goal', stat: 'shooting', copy: '读取门将站位，在推射、挑射和过人间决策。', positions: ['ST', 'LW', 'RW', 'CAM'] },
  { id: 'header', name: '头球抢点', mechanic: 'moving-target', icon: 'ball', stat: 'physical', copy: '在落点窗口点击起跳，争顶高度影响结果。', positions: ['ST', 'CB', 'CM'] },
  { id: 'passing-lane', name: '传球线路', mechanic: 'lane', icon: 'passing', stat: 'passing', copy: '防守球员移动时选择安全线路。', positions: ['CB', 'LB', 'RB', 'CDM', 'CM', 'CAM'] },
  { id: 'through-ball', name: '直塞时机', mechanic: 'moving-line', icon: 'passing', stat: 'passing', copy: '在越位线与跑位交汇的瞬间送出直塞。', positions: ['CM', 'CAM', 'LW', 'RW', 'ST'] },
  { id: 'dribble-dodge', name: '盘带闪避', mechanic: 'sequence', icon: 'dribbling', stat: 'dribbling', copy: '按顺序回应防守方向，连续成功才能突破。', positions: ['LB', 'RB', 'CM', 'CAM', 'LW', 'RW', 'ST'] },
  { id: 'tackle', name: '抢断时机', mechanic: 'timing', icon: 'defending', stat: 'defending', copy: '对手触球暴露时点击，过早会犯规。', positions: ['CB', 'LB', 'RB', 'CDM', 'CM'] },
  { id: 'body-duel', name: '身体对抗', mechanic: 'rhythm', icon: 'physical', stat: 'physical', copy: '跟随节奏点击稳定区，保持身体重心。', positions: ['CB', 'LB', 'RB', 'CDM', 'CM', 'ST'] },
  { id: 'goalkeeper-save', name: '门将扑救', mechanic: 'direction', icon: 'goalkeeper', stat: 'defending', copy: '读出射门方向，在限定时间内滑向正确区域。', positions: ['GK'] },
  { id: 'goalkeeper-charge', name: '门将出击', mechanic: 'decision', icon: 'goalkeeper', stat: 'defending', copy: '在留门线、出击摘球、封堵之间选择。', positions: ['GK'] },
  { id: 'penalty-save', name: '门将扑点球', mechanic: 'direction-clue', icon: 'goalkeeper', stat: 'defending', copy: '观察助跑和脚型，再选择扑救方向。', positions: ['GK'] },
  { id: 'aerial-claim', name: '门将高空球', mechanic: 'position-window', icon: 'goalkeeper', stat: 'physical', copy: '先选站位，再在落点窗口内起跳摘球。', positions: ['GK'] },
  { id: 'distribution', name: '门将手抛球或长传', mechanic: 'target-power', icon: 'passing', stat: 'passing', copy: '选择队友目标和力度，避免被反抢。', positions: ['GK'] },
  { id: 'stoppage-decision', name: '伤停补时决策', mechanic: 'strategy-meter', icon: 'tactics', stat: 'physical', copy: '在拖延、冒险进攻和稳守反击间配合局势。', positions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'] }
]);

const POSITION_ALIASES = {
  GK: 'GK', '门将': 'GK',
  CB: 'CB', '中后卫': 'CB',
  LB: 'LB', '左后卫': 'LB', '翼卫': 'LB',
  RB: 'RB', '右后卫': 'RB',
  CDM: 'CDM', '后腰': 'CDM',
  CM: 'CM', '中场': 'CM', '中前卫': 'CM',
  CAM: 'CAM', '前腰': 'CAM',
  LW: 'LW', '左边锋': 'LW', '边锋': 'LW',
  RW: 'RW', '右边锋': 'RW',
  ST: 'ST', '中锋': 'ST', '前锋': 'ST'
};

export const POSITION_EVENT_POOL = Object.freeze({
  GK: ['goalkeeper-save', 'goalkeeper-charge', 'penalty-save', 'aerial-claim', 'distribution', 'stoppage-decision'],
  CB: ['tackle', 'header', 'body-duel', 'passing-lane', 'stoppage-decision'],
  LB: ['tackle', 'passing-lane', 'dribble-dodge', 'through-ball', 'stoppage-decision'],
  RB: ['tackle', 'passing-lane', 'dribble-dodge', 'through-ball', 'stoppage-decision'],
  CDM: ['tackle', 'body-duel', 'passing-lane', 'through-ball', 'stoppage-decision'],
  CM: ['passing-lane', 'through-ball', 'body-duel', 'tackle', 'stoppage-decision'],
  CAM: ['through-ball', 'dribble-dodge', 'free-kick', 'shooting', 'stoppage-decision'],
  LW: ['dribble-dodge', 'through-ball', 'shooting', 'penalty', 'stoppage-decision'],
  RW: ['dribble-dodge', 'through-ball', 'shooting', 'penalty', 'stoppage-decision'],
  ST: ['shooting', 'penalty', 'one-on-one', 'header', 'free-kick', 'stoppage-decision']
});

export function normalizePosition(position) {
  return POSITION_ALIASES[position] || 'CM';
}

export function getMatchInteractionsForPosition(position) {
  const code = normalizePosition(position);
  const allowed = new Set(POSITION_EVENT_POOL[code] || POSITION_EVENT_POOL.CM);
  return MATCH_INTERACTIONS.filter(item => allowed.has(item.id));
}

function deterministicScore(seed, stat) {
  const roll = Math.abs(Number(seed) || 0) % 100;
  return clamp(stat * .72 + roll * .28);
}

export function resolveMatchInteraction({ id = 'shooting', player, seed = 0, input = null } = {}) {
  const option = MATCH_INTERACTIONS.find(item => item.id === id) || MATCH_INTERACTIONS[0];
  const stats = player?.stats || {};
  const stat = Number(stats[option.stat] || player?.ovr || 50);
  const stateTarget = Number(input?.matchState?.miniGame?.difficulty);
  const target = Number.isFinite(stateTarget) ? clamp(stateTarget, 35, 90) : clamp(54 + stat * .23, 60, 86);
  const manualScore = Number(input?.score);
  const score = Number.isFinite(manualScore) ? clamp(manualScore) : deterministicScore(seed, stat);
  const success = input?.skipped ? false : score >= target;
  const attacking = ['shooting', 'penalty', 'free-kick', 'one-on-one', 'header'].includes(option.id);
  return {
    option,
    stat,
    score: Math.round(score),
    target: Math.round(target),
    success,
    skipped: Boolean(input?.skipped),
    ratingBonus: (success ? .24 : -.18) + (input?.skipped ? -.04 : 0),
    goalChance: success && attacking ? (option.id === 'penalty' ? .72 : option.id === 'one-on-one' ? .48 : .28) : 0
  };
}
