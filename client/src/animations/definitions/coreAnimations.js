const node = (tag, className, value) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = String(value);
  return element;
};

const wrap = (className, ...children) => {
  const element = node('div', className);
  children.flat().filter(Boolean).forEach((child) => element.append(child));
  return element;
};

const text = (value, className = '') => node('span', className, value);
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function dice(result = {}) {
  const value = Math.max(1, Math.min(6, Math.round(number(result.value, 1))));
  const cube = wrap('anim-die', ...Array.from({ length: 6 }, (_, index) =>
    text(index + 1, `anim-die__face anim-die__face--${index + 1}`)));
  cube.style.setProperty('--dice-face', String(value));
  return wrap('anim-scene anim-scene--dice',
    wrap('anim-dice-space', cube, text('', 'anim-dice-shadow')),
    text(`判定结果 ${value}`, 'anim-result-label'));
}

function wheel(result = {}) {
  const labels = (result.labels || ['稳健', '突破', '观察', '冒险', '协作', '坚持']).slice(0, 8);
  const index = Math.max(0, Math.floor(number(result.index, 0))) % labels.length;
  const disc = wrap('anim-wheel', ...labels.map((label, itemIndex) =>
    text(label, `anim-wheel__segment anim-wheel__segment--${itemIndex}`)));
  disc.style.setProperty('--wheel-turn', `${1080 + index * (360 / labels.length)}deg`);
  return wrap('anim-scene anim-scene--wheel', text('', 'anim-wheel-pointer'), disc,
    text(result.label || labels[index], 'anim-result-label'));
}

function slot(result = {}) {
  const values = (result.values || ['体能', '机会', '信任', '状态', '战术', '成长']).slice(0, 6);
  const reels = values.map((value) => wrap('anim-slot-reel',
    wrap('anim-slot-track', text('◆'), text('●'), text(value, 'is-result'))));
  return wrap('anim-scene anim-scene--slot', wrap('anim-slot-frame', ...reels),
    text(values.join(' · '), 'anim-result-label'));
}

function cards(result = {}) {
  const values = (result.cards || ['成长', '技术', '意志']).slice(0, 3);
  const chosen = Math.max(0, Math.min(values.length - 1, Math.floor(number(result.chosen, 1))));
  const fan = wrap('anim-card-fan', ...values.map((value, index) =>
    wrap(`anim-draw-card ${index === chosen ? 'is-chosen' : ''} rarity-${result.rarity || 'normal'}`,
      wrap('anim-draw-card__inner',
        wrap('anim-draw-card__back', text('GP')),
        wrap('anim-draw-card__front', text(value))))));
  return wrap('anim-scene anim-scene--cards', fan,
    text(result.label || values[chosen], 'anim-result-label'));
}

function coin(result = {}) {
  const side = result.side === 'back' ? 'back' : 'front';
  return wrap('anim-scene anim-scene--coin',
    wrap(`anim-coin is-${side}`, wrap('anim-coin__front', text('攻')), wrap('anim-coin__back', text('守'))),
    text('', 'anim-coin-shadow'),
    text(side === 'front' ? '进攻机会' : '防守考验', 'anim-result-label'));
}

function radar(result = {}) {
  const score = Math.max(0, Math.min(100, number(result.score, 72)));
  const radarNode = wrap('anim-radar', text('', 'anim-radar__grid'), text('', 'anim-radar__sweep'),
    ...Array.from({ length: 4 }, (_, index) => text('●', `anim-radar__blip blip-${index + 1}`)));
  radarNode.style.setProperty('--radar-score', `${score}%`);
  return wrap('anim-scene anim-scene--radar', radarNode,
    text(`球探匹配度 ${score}%`, 'anim-result-label'));
}

function hex(result = {}) {
  const oldValues = (result.oldValues || [55, 58, 51, 62, 54, 57]).map((value) => Math.max(10, Math.min(100, number(value, 50))));
  const newValues = (result.newValues || [62, 66, 58, 68, 61, 64]).map((value) => Math.max(10, Math.min(100, number(value, 60))));
  const labels = (result.labels || ['速度', '射门', '传球', '盘带', '防守', '体能']).slice(0, 6);
  const chart = wrap('anim-hex', text('', 'anim-hex__grid'), text('', 'anim-hex__old'), text('', 'anim-hex__new'),
    ...labels.map((label, index) => text(label, `anim-hex__axis axis-${index + 1}`)));
  chart.style.setProperty('--old-scale', String(oldValues.reduce((sum, value) => sum + value, 0) / 600));
  chart.style.setProperty('--new-scale', String(newValues.reduce((sum, value) => sum + value, 0) / 600));
  return wrap('anim-scene anim-scene--hex', chart,
    text(result.keeper ? '门将六轴成长' : '球员六轴成长', 'anim-result-label'));
}

function football(result = {}) {
  const outcome = ['goal', 'save', 'post', 'wide'].includes(result.outcome) ? result.outcome : 'goal';
  const labels = { goal: '射门成功', save: '被门将扑出', post: '击中门柱', wide: '射偏' };
  return wrap(`anim-scene anim-scene--football outcome-${outcome}`,
    wrap('anim-goal', text('', 'anim-goal__net'), text('', 'anim-keeper'), text('⚽', 'anim-ball')),
    text(labels[outcome], 'anim-result-label'));
}

function timeline(result = {}) {
  const events = (result.events || ['开场', '机会', '关键时刻', '终场']).slice(0, 6);
  return wrap('anim-scene anim-scene--timeline',
    wrap('anim-timeline-rail', text('', 'anim-timeline-progress'), ...events.map((label, index) =>
      wrap('anim-timeline-node', text(String(result.minutes?.[index] ?? index * 30)), text(label)))),
    text(result.label || '比赛进程已确认', 'anim-result-label'));
}

function contract(result = {}) {
  const clauses = (result.clauses || ['合同期限已确认', '周薪条款已确认', '球队角色已确认']).slice(0, 4);
  return wrap('anim-scene anim-scene--contract',
    wrap('anim-contract-paper', text(result.club || '俱乐部合同', 'anim-contract-title'),
      wrap('anim-contract-clauses', ...clauses.map((clause) => text(clause))),
      wrap('anim-signature', ...['签', '名', '确', '认'].map((character) => text(character))),
      text('已签署', 'anim-contract-stamp')),
    text(result.label || '合同正式生效', 'anim-result-label'));
}

function envelope(result = {}) {
  return wrap('anim-scene anim-scene--envelope',
    wrap('anim-envelope', text('', 'anim-envelope__back'),
      wrap('anim-offer-letter', text(result.club || '新报价', 'anim-offer-club'), text(result.value || '条款待查看', 'anim-offer-value')),
      text('', 'anim-envelope__front'), text('', 'anim-envelope__flap')),
    text(result.label || '报价已经送达', 'anim-result-label'));
}

function calendar(result = {}) {
  return wrap('anim-scene anim-scene--calendar',
    wrap('anim-calendar', text(result.from || '第1周', 'anim-calendar__back'), text(result.to || '第2周', 'anim-calendar__front'),
      wrap('anim-calendar-rings', text(''), text(''))),
    text(result.label || '时间已推进', 'anim-result-label'));
}

function training(result = {}) {
  const value = Math.max(0, Math.min(100, number(result.progress, 78)));
  const ring = wrap('anim-training-ring', wrap('anim-training-ring__core', text(`${value}%`)), text('', 'anim-training-ring__orbit'));
  ring.style.setProperty('--training-progress', `${value * 3.6}deg`);
  return wrap('anim-scene anim-scene--training', ring,
    wrap('anim-training-bars', ...Array.from({ length: 5 }, (_, index) => text('', `bar-${index + 1}`))),
    text(result.label || '训练结算完成', 'anim-result-label'));
}

function trophy(result = {}) {
  return wrap('anim-scene anim-scene--trophy',
    wrap('anim-trophy', text('', 'anim-trophy__cup'), text('', 'anim-trophy__stem'), text('', 'anim-trophy__base'), text('', 'anim-trophy__shine')),
    text(result.label || '荣誉已解锁', 'anim-result-label'));
}

function fans(result = {}) {
  const delta = Math.max(0, number(result.delta, 1200));
  return wrap('anim-scene anim-scene--fans',
    wrap('anim-crowd', ...Array.from({ length: 12 }, (_, index) => text('●', `fan-${index % 4 + 1}`))),
    wrap('anim-sound-wave', text(''), text(''), text(''), text('')),
    text(`球迷 +${delta.toLocaleString('zh-CN')}`, 'anim-result-label'));
}

function status(result = {}) {
  const risk = Math.max(0, Math.min(100, number(result.risk, 35)));
  const level = risk >= 65 ? 'high' : risk >= 35 ? 'mid' : 'low';
  return wrap(`anim-scene anim-scene--status risk-${level}`,
    wrap('anim-status-monitor', text('', 'anim-status-pulse'), text('', 'anim-status-beacon')),
    text(result.label || `风险 ${risk}%`, 'anim-result-label'));
}

function score(result = {}) {
  const value = Math.max(0, Math.min(10000, number(result.score, 0)));
  const digits = String(Math.round(value)).padStart(5, '0').split('');
  return wrap('anim-scene anim-scene--score',
    wrap('anim-score-columns', ...digits.map((digit) => wrap('anim-score-column', text('8'), text(digit, 'is-result')))),
    text(result.label || '生涯评分结算', 'anim-result-label'));
}

function grade(result = {}) {
  const value = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'].includes(result.grade) ? result.grade : 'A';
  return wrap(`anim-scene anim-scene--grade grade-${value.toLowerCase()}`,
    wrap('anim-grade-mark', text(value), text('', 'anim-grade-ring ring-one'), text('', 'anim-grade-ring ring-two')),
    text(result.label || `${value} 级生涯`, 'anim-result-label'));
}

function rank(result = {}) {
  const from = Math.max(1, number(result.from, 18));
  const to = Math.max(1, number(result.to, 12));
  return wrap('anim-scene anim-scene--rank',
    wrap('anim-rank-list',
      wrap('anim-rank-row ghost', text(`#${Math.max(1, from - 1)}`), text('其他球员')),
      wrap('anim-rank-row is-player', text(`#${from}`, 'from-rank'), text(result.name || '我的球员')),
      wrap('anim-rank-row target', text(`#${to}`, 'to-rank'), text(result.name || '我的球员'))),
    text(result.label || `世界排名升至 ${to}`, 'anim-result-label'));
}

function podium(result = {}) {
  const names = (result.names || ['亚军', '冠军', '季军']).slice(0, 3);
  return wrap('anim-scene anim-scene--podium',
    wrap('anim-podium',
      wrap('anim-podium-place place-2', text(names[0]), text('2')),
      wrap('anim-podium-place place-1', text(names[1]), text('1')),
      wrap('anim-podium-place place-3', text(names[2]), text('3'))),
    text(result.label || '世界前三', 'anim-result-label'));
}

function crest(result = {}) {
  return wrap('anim-scene anim-scene--crest',
    wrap('anim-crest-build', text('', 'anim-crest-piece piece-left'), text('', 'anim-crest-piece piece-right'),
      text('', 'anim-crest-piece piece-top'), text(result.monogram || 'GP', 'anim-crest-core')),
    text(result.label || result.club || '球队身份确认', 'anim-result-label'));
}

function route(result = {}) {
  const stops = (result.stops || ['原俱乐部', '谈判', '新俱乐部']).slice(0, 4);
  return wrap('anim-scene anim-scene--route',
    wrap('anim-route-map', text('', 'anim-route-line'), ...stops.map((label, index) =>
      wrap(`anim-route-stop stop-${index + 1}`, text('●'), text(label))), text('⚽', 'anim-route-token')),
    text(result.label || '转会路线已确认', 'anim-result-label'));
}

const definitions = [
  ['dice-roll', '骰子判定', 'core', 980, 'cubic-bezier(.18,.82,.3,1.18)', dice, '事件选择'],
  ['fate-wheel', '命运转盘', 'core', 1380, 'cubic-bezier(.12,.72,.2,1)', wheel, '重大事件'],
  ['six-slot-fate', '六槽机械命运轮', 'core', 1260, 'cubic-bezier(.2,.7,.25,1)', slot, '传奇事件'],
  ['card-draw', '卡牌抽取和翻面', 'core', 1120, 'cubic-bezier(.2,.8,.2,1)', cards, '天赋报告'],
  ['coin-toss', '硬币抛掷', 'core', 880, 'cubic-bezier(.24,.75,.3,1.15)', coin, '比赛判定'],
  ['scout-radar', '球探雷达扫描', 'core', 1040, 'cubic-bezier(.2,.72,.25,1)', radar, '球探报告'],
  ['hex-growth', '六边形能力图生长', 'core', 1050, 'cubic-bezier(.22,1,.36,1)', hex, '能力变化'],
  ['football-trajectory', '足球轨迹判定', 'core', 900, 'cubic-bezier(.2,.75,.25,1)', football, '比赛结算'],
  ['match-timeline', '比赛时间轴推进', 'core', 1200, 'cubic-bezier(.25,.7,.2,1)', timeline, '快速时间线'],
  ['contract-sign', '合同签署和印章', 'core', 1500, 'cubic-bezier(.18,.8,.28,1)', contract, '合同签署'],
  ['offer-envelope', '报价信封揭晓', 'core', 900, 'cubic-bezier(.22,1,.36,1)', envelope, '转会报价'],
  ['calendar-flip', '日历翻页', 'core', 620, 'cubic-bezier(.3,.72,.25,1)', calendar, '时间推进'],
  ['training-ring', '训练进度环', 'core', 820, 'cubic-bezier(.22,1,.36,1)', training, '训练结算'],
  ['trophy-reveal', '奖杯轮廓显现', 'core', 1280, 'cubic-bezier(.16,.82,.25,1)', trophy, '成就与荣誉'],
  ['fan-surge', '粉丝增长和声浪', 'core', 920, 'cubic-bezier(.2,.82,.32,1)', fans, '球迷增长'],
  ['status-pulse', '状态脉冲和风险预警', 'core', 700, 'cubic-bezier(.25,.72,.3,1)', status, '伤病与风险'],
  ['career-score', '生涯评分滚动结算', 'ranking', 1350, 'cubic-bezier(.2,.75,.2,1)', score, '排行榜'],
  ['grade-reveal', '等级揭晓', 'ranking', 1700, 'cubic-bezier(.16,.82,.24,1)', grade, '排行榜'],
  ['world-rank-change', '世界排名变化', 'ranking', 1250, 'cubic-bezier(.2,.8,.25,1)', rank, '世界排行榜'],
  ['world-podium', '世界前三领奖台', 'ranking', 1850, 'cubic-bezier(.18,.8,.26,1)', podium, '世界排行榜'],
  ['crest-assemble', '队徽拼合', 'club-transfer', 900, 'cubic-bezier(.2,.85,.25,1)', crest, '球队详情'],
  ['transfer-route', '转会路线', 'club-transfer', 1400, 'cubic-bezier(.18,.78,.28,1)', route, '完成转会']
].map(([id, name, category, duration, easing, create, scene]) => ({
  id, name, category, duration, easing, create, scene,
  importance: ['six-slot-fate', 'contract-sign', 'trophy-reveal', 'grade-reveal', 'world-podium', 'transfer-route'].includes(id) ? 'major' : 'normal',
  skippable: true
}));

export const CORE_ANIMATIONS = Object.freeze(definitions);
