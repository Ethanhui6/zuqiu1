const STAT_LABELS = { speed: '速度', shooting: '射门', passing: '传球', dribbling: '盘带', defending: '防守', physical: '身体' };
const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const OUTFIELD_POSITIONS = ALL_POSITIONS.filter(position => position !== 'GK');

const profile = (stats, positions, bonus, weakness, body, behavior) => Object.freeze({
  stats: Object.freeze(stats), positions: Object.freeze(positions), bonus, weakness, body, behavior,
  keys: Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key]) => STAT_LABELS[key]).join('、')
});

export const PLAYER_STYLES = Object.freeze({
  '禁区终结者': profile({ speed: 61, shooting: 71, passing: 45, dribbling: 58, defending: 31, physical: 59 }, ['ST'], '射门与跑位', '背身组织有限', '爆发、冷静', '攻击六码区与后点'),
  '支点中锋': profile({ speed: 52, shooting: 64, passing: 55, dribbling: 50, defending: 34, physical: 72 }, ['ST'], '对抗与做球', '转身速度偏慢', '身高、力量', '背身接应并为队友创造空间'),
  '速度型边锋': profile({ speed: 72, shooting: 56, passing: 53, dribbling: 67, defending: 34, physical: 48 }, ['LW', 'RW'], '冲刺与一对一', '身体对抗较弱', '爆发、灵活', '拉开宽度后纵向突破'),
  '内切攻击手': profile({ speed: 66, shooting: 65, passing: 54, dribbling: 69, defending: 33, physical: 49 }, ['LW', 'RW', 'CAM'], '盘带与远射', '回防投入有限', '协调、惯用脚', '从边路内切进入射门区'),
  '组织核心': profile({ speed: 51, shooting: 51, passing: 72, dribbling: 65, defending: 44, physical: 48 }, ['CAM', 'CM', 'LW', 'RW'], '视野与传球', '无球冲刺一般', '视野、技术', '回撤接球并控制进攻节奏'),
  '全能中场': profile({ speed: 58, shooting: 56, passing: 64, dribbling: 59, defending: 58, physical: 62 }, ['CM', 'CDM'], '覆盖与攻守转换', '单项上限不突出', '耐力、均衡', '往返两个禁区并参与反抢'),
  '防守屏障': profile({ speed: 52, shooting: 37, passing: 58, dribbling: 46, defending: 71, physical: 68 }, ['CDM', 'CM'], '拦截与站位', '终结能力有限', '力量、耐力', '保护中卫并切断传球线路'),
  '出球后卫': profile({ speed: 54, shooting: 35, passing: 63, dribbling: 48, defending: 68, physical: 66 }, ['CB'], '防守与后场传导', '冒险传球可能失误', '身高、镇定', '持球吸引压迫后向前输送'),
  '进攻型边后卫': profile({ speed: 67, shooting: 42, passing: 60, dribbling: 58, defending: 61, physical: 59 }, ['LB', 'RB'], '套边与传中', '身后空间风险', '速度、耐力', '沿边线前插并快速回防'),
  '清道夫门将': profile({ speed: 55, shooting: 30, passing: 60, dribbling: 42, defending: 72, physical: 65 }, ['GK'], '扑救、站位与出球', '禁区外决策风险', '反应、身高', '主动出击并参与后场组织')
});

export const PLAYER_STYLE_DEFINITIONS = Object.freeze(Object.entries(PLAYER_STYLES).map(([id, definition]) => Object.freeze({ id, ...definition })));
export const SECONDARY_TRAITS = Object.freeze([
  { id: '稳定发挥', name: '稳定发挥', positions: ALL_POSITIONS },
  { id: '大场面球员', name: '大场面球员', positions: ALL_POSITIONS },
  { id: '逆足熟练', name: '逆足熟练', positions: ALL_POSITIONS },
  { id: '高强度压迫', name: '高强度压迫', positions: OUTFIELD_POSITIONS },
  { id: '定位球专家', name: '定位球专家', positions: ['ST', 'LW', 'RW', 'CAM', 'CM'] },
  { id: '领袖气质', name: '领袖气质', positions: ALL_POSITIONS },
  { id: '门将指挥', name: '门将指挥', positions: ['GK'] }
].map(Object.freeze));
