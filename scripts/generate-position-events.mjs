import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const positions = {
  GK: ['扑点球', '单刀封堵', '高空球判断', '角球出击', '门线反应', '雨战脱手', '脚下出球', '人墙指挥', '二门竞争', '连续零封'],
  CB: ['盯人跟防', '高空争顶', '上抢时机', '补位封堵', '造越位', '防线指挥', '后场出球', '单刀回追', '定位球防守', '最后一分钟解围'],
  LB: ['套边传中', '回防对位', '内收保护', '边线一对一', '后点盯人', '低位推进', '翼卫覆盖', '换位协防', '逆足出球', '边路体能'],
  RB: ['套边传中', '回防对位', '内收保护', '边线一对一', '后点盯人', '低位推进', '翼卫覆盖', '换位协防', '逆足出球', '边路体能'],
  CDM: ['中路拦截', '卡位封线', '防守转换', '战术犯规', '后场出球', '协防边路', '二点球控制', '单后腰保护', '压迫触发', '比赛降速'],
  CM: ['控制节奏', '转移球', '中场覆盖', '后插上', '反抢连接', '第三人跑动', '肋部接应', '比赛降速', '双中场轮换', '终场管理'],
  LM: ['左路组织', '左路回防', '左脚传中', '内收连接', '边中协作', '弱侧转移', '左侧定位球', '中场覆盖', '对位边后卫', '末段保球'],
  RM: ['右路组织', '右路回防', '右脚传中', '内收连接', '边中协作', '弱侧转移', '右侧定位球', '中场覆盖', '对位边后卫', '末段保球'],
  CAM: ['最后一传', '肋部接球', '直塞选择', '创造机会', '定位球主罚', '被后腰盯防', '禁区前沿', '节奏假动作', '前场反抢', '落后时组织'],
  LW: ['左路内切', '左路下底', '左侧一对一', '逆足处理', '顺足传中', '与左后卫配合', '弱侧后点', '速度变向', '边锋回防', '末段突破'],
  RW: ['右路内切', '右路下底', '右侧一对一', '逆足处理', '顺足传中', '与右后卫配合', '弱侧后点', '速度变向', '边锋回防', '末段突破'],
  ST: ['禁区终结', '无球跑位', '身体对抗', '高空争顶', '单刀处理', '射手荒', '支点回做', '金靴竞争', '伪九号回撤', '最后一击']
};
const phases = ['青年队训练', '预备队比赛', '替补登场', '轮换首发', '主力竞争', '杯赛淘汰赛', '联赛冲刺', '客场逆境', '连续作战', '合同观察期', '转会考察', '国家队集训', '伤后复出', '低谷修复', '新教练上任', '战术改阵', '雨战', '高温客场', '人工草场', '强敌对位', '保级压力', '争冠压力', '德比周', '更衣室调整', '队长缺阵', '核心队友受伤', '纪律风波', '媒体关注', '球迷质疑', '数据分析复盘', '冬季轮换', '夏季窗口', '欧战资格', '国内杯决赛', '半决赛', '点球大战', '最后五轮', '客场长途', '密集赛程', '赛季收官', '续约谈判', '租借选择', '回归母队', '新城市适应', '家庭压力', '经纪人建议', '职业转型', '年龄增长', '退役规划'];
const positionNames = { GK: '门将', CB: '中后卫', LB: '左后卫', RB: '右后卫', CDM: '后腰', CM: '中前卫', LM: '左前卫', RM: '右前卫', CAM: '前腰', LW: '左边锋', RW: '右边锋', ST: '中锋' };
const effects = { GK: ['defending', 'passing', 'physical'], CB: ['defending', 'physical', 'passing'], LB: ['defending', 'speed', 'passing'], RB: ['defending', 'speed', 'passing'], CDM: ['defending', 'passing', 'physical'], CM: ['passing', 'dribbling', 'physical'], LM: ['passing', 'speed', 'dribbling'], RM: ['passing', 'speed', 'dribbling'], CAM: ['passing', 'dribbling', 'shooting'], LW: ['speed', 'dribbling', 'shooting'], RW: ['speed', 'dribbling', 'shooting'], ST: ['shooting', 'physical', 'speed'] };
const labels = ['执行教练方案', '主动承担风险', '先观察再调整'];
const eventList = [];
for (const [position, scenarios] of Object.entries(positions)) {
  for (let index = 0; index < 500; index += 1) {
    const scenario = scenarios[index % scenarios.length];
    const phase = phases[Math.floor(index / scenarios.length)];
    const [primary, secondary, tertiary] = effects[position];
    const level = 1 + (index % 5);
    eventList.push({
      id: `position-${position.toLowerCase()}-${String(index + 1).padStart(3, '0')}`,
      title: `${positionNames[position]} · ${scenario} · ${phase}`,
      category: index % 4 === 0 ? '比赛' : index % 4 === 1 ? '训练' : index % 4 === 2 ? '职业' : '关系',
      interaction: ['decision', 'observation', 'timing', 'risk', 'negotiation'][index % 5],
      positions: [position],
      minAge: 16 + (index % 7), maxAge: 35,
      requiredClubRole: index % 3 === 0 ? ['轮换', '主力'] : undefined,
      requiredLeagueLevel: [1 + (index % 3)],
      trigger: `${phase}阶段出现${scenario}节点，教练需要你在${level}个回合内完成职责判断。`,
      conflict: `对手类型、体能和球队目标同时变化；这不是单纯的属性练习。`,
      tags: [position.toLowerCase(), scenario, phase, `branch-${index % 9}`],
      cooldownSeasons: 2,
      maxOccurrences: 1,
      weight: 1 + (index % 4),
      choices: [
        { id: 'structure', label: labels[0], hint: `稳定${scenario}执行，优先保持球队结构。`, effects: { [primary]: .14 + level * .02, trust: 2, fatigue: 2 } },
        { id: 'challenge', label: labels[1], hint: `主动改变${scenario}的处理方式，收益和风险更高。`, effects: { [secondary]: .2 + level * .025, morale: 2, fatigue: 5, risk: 2 + level } },
        { id: 'read', label: labels[2], hint: `先读取${phase}的空间，再决定是否投入。`, effects: { [tertiary]: .16 + level * .018, relationship: 2, fatigue: 1, delayed: 1 } }
      ]
    });
  }
}
await fs.writeFile(path.join(root, 'data', 'events', 'position-events.json'), `${JSON.stringify(eventList)}\n`, 'utf8');
console.log(JSON.stringify({ status: 'PASS', total: eventList.length, positions: Object.fromEntries(Object.keys(positions).map(key => [key, 500])) }));
