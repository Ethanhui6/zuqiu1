import { normalizePosition } from './positionResolver.js';
import { miniGameForInteraction } from './miniGameLibrary.js';

const HIGHLIGHTS = Object.freeze([
  { id: 'pressing-turnover', title: '高位压迫后的二点球', copy: '对手回传出现迟疑，下一步取决于你的处理。', interactionId: 'tackle', positions: ['CB', 'LB', 'RB', 'CDM', 'CM'], zone: 'defensive', weight: 3 },
  { id: 'midfield-window', title: '中场出现传球窗口', copy: '队友开始前插，短暂的线路正在打开。', interactionId: 'passing-lane', positions: ['CB', 'LB', 'RB', 'CDM', 'CM', 'CAM'], zone: 'middle', weight: 4 },
  { id: 'through-ball-run', title: '锋线启动，越位线同步移动', copy: '直塞时机只有一瞬间，跑位质量会改变攻势。', interactionId: 'through-ball', positions: ['CM', 'CAM', 'LW', 'RW', 'ST'], zone: 'middle', weight: 4 },
  { id: 'wide-isolation', title: '边路形成一对一', copy: '防守者的重心偏向内侧，边线空间已经出现。', interactionId: 'dribble-dodge', positions: ['LB', 'RB', 'CAM', 'LW', 'RW', 'ST'], zone: 'attacking', weight: 3 },
  { id: 'box-arrival', title: '禁区前沿获得射门角度', copy: '防线没有完全落位，出脚时机决定镜头质量。', interactionId: 'shooting', positions: ['CAM', 'LW', 'RW', 'ST'], zone: 'attacking', weight: 4 },
  { id: 'aerial-duel', title: '后点高球落下', copy: '落点和起跳窗口同时进入视野。', interactionId: 'header', positions: ['CB', 'CM', 'ST'], zone: 'attacking', weight: 2 },
  { id: 'contact-duel', title: '中路身体对抗', copy: '对手贴身逼抢，保持重心才能继续推进。', interactionId: 'body-duel', positions: ['CB', 'LB', 'RB', 'CDM', 'CM', 'ST'], zone: 'middle', weight: 3 },
  { id: 'keeper-angle', title: '门将面对射门角度', copy: '射门方向的线索已经出现，先读再动。', interactionId: 'goalkeeper-save', positions: ['GK'], zone: 'defensive', weight: 5 },
  { id: 'keeper-cross', title: '高空球进入小禁区', copy: '站位和起跳时机必须连续完成。', interactionId: 'aerial-claim', positions: ['GK'], zone: 'defensive', weight: 4 },
  { id: 'keeper-build', title: '门将拿球准备发动反击', copy: '第一脚出球将决定球队是否能快速脱离压力。', interactionId: 'distribution', positions: ['GK'], zone: 'defensive', weight: 3 },
  { id: 'late-game-choice', title: '伤停补时，比分仍未锁定', copy: '时间、比分和体能共同进入最后决策。', interactionId: 'stoppage-decision', positions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'], zone: 'middle', weight: 2 }
]);

function hash(seed, value) {
  let result = Math.abs(Number(seed) || 0) + value.length * 31;
  for (const character of value) result = (result * 33 + character.charCodeAt(0)) % 2147483647;
  return result;
}

export class HighlightDirector {
  constructor({ seed = 0 } = {}) { this.seed = Number(seed) || 0; }

  next(state) {
    const position = normalizePosition(state?.player?.position);
    const recent = new Set([...(state?.recentHighlights || []), ...(state?.recentMatchEvents || [])]);
    const recentMiniGames = new Set(state?.recentMiniGames || []);
    let pool = HIGHLIGHTS.filter(item => item.positions.includes(position) && !recent.has(item.id) && !recentMiniGames.has(miniGameForInteraction(item.interactionId)?.id));
    if (!pool.length) pool = HIGHLIGHTS.filter(item => item.positions.includes(position));
    if (!pool.length) pool = HIGHLIGHTS.filter(item => !recent.has(item.id));
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = hash(this.seed + (state?.highlights?.length || 0) * 97, position) % total;
    const selected = pool.find(item => (roll -= item.weight) < 0) || pool[0];
    const minute = Math.min(90, Math.max(6, (state?.matchMinute || 0) + 8 + hash(this.seed, selected.id) % 18));
    return { ...selected, minute, miniGame: miniGameForInteraction(selected.interactionId) };
  }
}

export function selectHighlight(state, { seed = state?.seed || 0 } = {}) {
  return new HighlightDirector({ seed }).next(state);
}

export { HIGHLIGHTS };
