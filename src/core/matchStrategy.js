import { normalizePosition } from './positionResolver.js';

const define = (id, name, copy, style, keywords, rating, fatigue) => Object.freeze({ id, name, copy, style, keywords, mods: { rating, fatigue } });

const STRATEGIES = Object.freeze({
  keeper: [
    define('keeper-line', '稳守门线', '优先站位和扑救，不轻易离开门区。', 'balanced', ['扑点球', '门线反应', '远射', '折射'], .24, 4),
    define('keeper-sweep', '积极出击', '主动处理高空球和身后空间。', 'aggressive', ['高空球判断', '角球出击', '单刀封堵'], .18, 7),
    define('keeper-build', '出球参与', '更多接应回传并发动进攻。', 'creative', ['脚下出球', '长传', '手抛球'], .2, 5)
  ],
  centerBack: [
    define('cb-hold', '稳守防线', '保持阵型，优先封堵和解围。', 'balanced', ['盯人跟防', '补位封堵', '定位球防守'], .25, 4),
    define('cb-step', '主动上抢', '提前离开防线争夺球权。', 'aggressive', ['上抢时机', '单刀回追', '造越位'], .18, 7),
    define('cb-build', '后场出球', '用传球帮助球队越过第一线压迫。', 'creative', ['后场出球', '防线指挥', '转移球'], .22, 5)
  ],
  fullBack: [
    define('fb-hold', '限制边路', '先守住对位，再选择前插时机。', 'balanced', ['回防对位', '后点盯人', '换位协防'], .23, 5),
    define('fb-overlap', '套边冲击', '持续前插制造传中和二过一。', 'aggressive', ['套边传中', '边线一对一', '翼卫覆盖'], .18, 8),
    define('fb-invert', '内收组织', '进入中场接应并参与出球。', 'creative', ['内收保护', '低位推进', '逆足出球'], .22, 6)
  ],
  holding: [
    define('dm-screen', '保护防线', '封住中路线路，控制身后空间。', 'balanced', ['卡位封线', '单后腰保护', '协防边路'], .25, 5),
    define('dm-press', '主动压迫', '提高反抢和二点球争夺强度。', 'aggressive', ['中路拦截', '压迫触发', '防守转换'], .18, 8),
    define('dm-build', '拖后组织', '从后场控制节奏并寻找转移。', 'creative', ['后场出球', '比赛降速', '二点球控制'], .22, 5)
  ],
  central: [
    define('cm-control', '控制节奏', '优先接应、转移和保持球权。', 'balanced', ['控制节奏', '转移球', '终场管理'], .24, 5),
    define('cm-run', '全能冲击', '增加后插上、反抢和覆盖。', 'aggressive', ['后插上', '反抢连接', '中场覆盖'], .18, 8),
    define('cm-create', '向前创造', '更多尝试直塞和第三人配合。', 'creative', ['第三人跑动', '肋部接应', '直塞'], .22, 6)
  ],
  creator: [
    define('am-link', '串联进攻', '在中路接应并稳定推进。', 'balanced', ['肋部接球', '节奏假动作', '前场反抢'], .23, 5),
    define('am-shoot', '攻击球门', '更多进入禁区前沿完成终结。', 'aggressive', ['禁区前沿', '定位球主罚', '落后时组织'], .17, 7),
    define('am-create', '创造优先', '寻找最后一传和穿透线路。', 'creative', ['最后一传', '直塞选择', '创造机会'], .24, 6)
  ],
  wide: [
    define('wing-burst', '爆破边路', '更多一对一、变向和下底。', 'aggressive', ['一对一', '下底', '速度变向'], .17, 8),
    define('wing-cut', '内切攻击', '进入肋部寻找射门和后点机会。', 'aggressive', ['内切', '逆足处理', '弱侧后点'], .19, 7),
    define('wing-create', '创造优先', '通过传中和配合为队友制造机会。', 'creative', ['顺足传中', '边后卫配合', '边路组织'], .23, 6)
  ],
  striker: [
    define('st-finish', '禁区终结', '留在危险区域等待最后一击。', 'aggressive', ['禁区终结', '单刀处理', '最后一击'], .2, 6),
    define('st-link', '支点策应', '背身接球，为队友创造推进空间。', 'creative', ['支点回做', '身体对抗', '伪九号回撤'], .23, 7),
    define('st-run', '冲击身后', '持续攻击防线身后的空当。', 'aggressive', ['无球跑位', '单刀处理', '射手荒'], .18, 8)
  ]
});

function strategyGroup(position) {
  const code = normalizePosition(position);
  if (code === 'GK') return 'keeper';
  if (code === 'CB') return 'centerBack';
  if (['LB', 'RB'].includes(code)) return 'fullBack';
  if (code === 'CDM') return 'holding';
  if (code === 'CM') return 'central';
  if (code === 'CAM') return 'creator';
  if (['LW', 'RW'].includes(code)) return 'wide';
  return 'striker';
}

export function matchStrategiesForPosition(position) {
  return STRATEGIES[strategyGroup(position)];
}
