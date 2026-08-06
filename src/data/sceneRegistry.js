const groups = [
  ['媒体', [
    ['mixed-zone', '混合采访区', 'microphone'], ['post-match-press', '赛后新闻发布会', 'press'], ['pre-match-press', '赛前新闻发布会', 'press'],
    ['touchline-interview', '球场边线采访', 'camera'], ['training-interview', '训练基地采访', 'camera'], ['tv-studio', '电视演播室', 'screen'],
    ['sports-headline', '体育报纸头条', 'paper'], ['social-feed', '手机社交媒体动态', 'phone'], ['reporter-crowd', '记者围堵', 'crowd'], ['breaking-news', '争议新闻快讯', 'alert']
  ]],
  ['训练', [
    ['gym-strength', '健身房力量训练', 'weights'], ['outdoor-sprint', '室外冲刺训练', 'track'], ['indoor-recovery', '室内恢复训练', 'mat'],
    ['tactics-room', '战术会议室', 'board'], ['shooting-ground', '射门训练场', 'goal'], ['keeper-training', '门将扑救训练', 'keeper'],
    ['free-kick-ground', '任意球训练', 'wall'], ['dribble-obstacles', '盘带障碍训练', 'cones'], ['passing-lanes', '传球线路训练', 'lanes'], ['rehab-room', '康复理疗室', 'medical']
  ]],
  ['比赛', [
    ['player-tunnel', '球员通道', 'tunnel'], ['home-warmup', '主场赛前热身', 'warmup'], ['away-warmup', '客场赛前热身', 'warmup'],
    ['night-stadium', '夜间球场', 'night'], ['rain-match', '雨战', 'rain'], ['snow-match', '雪战', 'snow'],
    ['heat-match', '炎热天气比赛', 'heat'], ['penalty-moment', '点球时刻', 'penalty'], ['goal-celebration', '进球庆祝', 'celebrate'], ['keeper-save', '门将扑救', 'save'],
    ['card-dispute', '红黄牌争议', 'card'], ['stoppage-time', '伤停补时', 'clock'], ['halftime-locker', '更衣室中场休息', 'locker'], ['post-match-wave', '赛后谢场', 'wave']
  ]],
  ['俱乐部', [
    ['coach-office', '教练办公室', 'desk'], ['locker-talk', '更衣室谈话', 'talk'], ['teammate-dispute', '队友发生争执', 'dispute'], ['birthday-celebration', '队友庆祝生日', 'birthday'],
    ['medical-diagnosis', '医务室诊断', 'medical'], ['agent-office', '经纪人办公室', 'agent'], ['contract-room', '合同签约室', 'contract'], ['transfer-room', '转会谈判室', 'negotiate'],
    ['team-bus', '球队大巴', 'bus'], ['airport-departure', '机场出发', 'airport'], ['award-ceremony', '颁奖典礼', 'award'], ['champion-locker', '冠军更衣室', 'champion']
  ]],
  ['生活', [
    ['family-rest', '家庭休息', 'home'], ['endorsement-shoot', '商业代言拍摄', 'studio'], ['charity-day', '公益活动', 'charity'], ['fan-meet', '球迷见面会', 'fans'],
    ['night-solo-training', '夜间个人加练', 'night'], ['nutrition-plan', '饮食管理', 'food'], ['social-storm', '社交媒体风波', 'storm'], ['sponsor-event', '赞助商活动', 'sponsor'],
    ['city-street', '城市街头', 'city'], ['national-call', '国家队征召', 'national']
  ]]
];

const byCategory = Object.fromEntries(groups.map(([category, items]) => [category, items.map(([id]) => id)]));
const entries = groups.flatMap(([category, items]) => items.map(([id, name, motif], index) => ({
  id: `scene-${id}`,
  name,
  category,
  motif,
  accent: ['#1677ff', '#22a06b', '#8a5cf6', '#e8872b', '#d95065'][index % 5],
  art: `./assets/scenes/scene-${id}.svg`,
  ratio: '16 / 9',
  loading: 'lazy',
  license: '项目自制矢量图，MIT，无外部素材'
})));

export const SCENE_REGISTRY = Object.freeze(entries);
export const SCENE_COUNT = SCENE_REGISTRY.length;

export function getScene(id) {
  return SCENE_REGISTRY.find(scene => scene.id === id) || SCENE_REGISTRY[0];
}

export function scenesForCategory(category) {
  return SCENE_REGISTRY.filter(scene => scene.category === category);
}

export function selectScene(event, { recentIds = [], seed = 0 } = {}) {
  const category = event?.category === '媒体' ? '媒体' : event?.category === '训练' ? '训练' : event?.category === '比赛' ? '比赛' : event?.category === '转会' || event?.category === '合同' || event?.category === '关系' ? '俱乐部' : '生活';
  const candidates = scenesForCategory(category).filter(scene => !recentIds.includes(scene.id));
  const pool = candidates.length ? candidates : scenesForCategory(category);
  return pool[Math.abs(Number(seed) || 0) % pool.length] || SCENE_REGISTRY[0];
}

