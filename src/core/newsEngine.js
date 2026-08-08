import { keyedRandom } from '../services/rng.js';

export const WORLD_NEWS_TOPICS = Object.freeze(['联赛', '转会', '冠军', '保级', '奖项', '国家队', '教练', '伤病', '新星', '退役', '纪录']);
export const MAX_NEWS_ITEMS = 120;

const MONTH_TOPICS = Object.freeze({
  1: ['转会', '奖项'], 2: ['奖项', '国家队'], 3: ['国家队', '纪录'], 4: ['保级', '教练'],
  5: ['冠军', '奖项'], 6: ['退役', '纪录'], 7: ['转会', '教练'], 8: ['新星', '联赛'],
  9: ['联赛', '新星'], 10: ['教练', '伤病'], 11: ['伤病', '纪录'], 12: ['纪录', '转会']
});

function ensureNews(state) {
  state.news ??= { items: [], unread: 0 };
  state.news.items = Array.isArray(state.news.items) ? state.news.items : [];
  return state.news;
}

const textKey = value => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const clubName = club => club?.cn || club?.nameZh || club?.name || club?.native || '一支职业球队';
const playerName = player => player?.cn || player?.name || '一名职业球员';

function worldSubject(state, clubs, players, date, offset, topic) {
  const currentClubId = state.player?.clubId;
  const currentName = state.player?.name;
  const clubPool = clubs.filter(club => club.id !== currentClubId && clubName(club) !== state.player?.club);
  let playerPool = players.filter(player => player.clubId !== currentClubId && playerName(player) !== currentName);
  if (topic === '退役') {
    const retired = new Set((state.news?.items || []).filter(item => item.topic === '退役').map(item => item.relatedPlayerId));
    playerPool = playerPool.filter(player => !retired.has(player.id));
  }
  if (topic === '新星') {
    const prospects = playerPool.filter(player => Number(player.ovr || 0) <= 85);
    if (prospects.length) playerPool = prospects;
  }
  const rng = keyedRandom('world-news', state.season?.year, date, topic, offset);
  const player = playerPool.length ? playerPool[rng.int(0, playerPool.length - 1)] : null;
  const playerClub = clubPool.find(club => club.id === player?.clubId);
  const club = playerClub || clubPool[rng.int(0, Math.max(0, clubPool.length - 1))] || null;
  const otherPool = clubPool.filter(item => item.id !== club?.id);
  const other = otherPool[rng.int(0, Math.max(0, otherPool.length - 1))] || club;
  return { club, other, player };
}

function worldStory(topic, subject, state, date) {
  const { club, other, player } = subject;
  const team = clubName(club), rival = clubName(other), footballer = playerName(player);
  const league = club?.leagueCn || club?.leagueNameZh || club?.league || '职业联赛';
  const season = state.season?.year || date.slice(0, 4), month = Number(date.slice(5, 7));
  const period = `${season}赛季${month}月`;
  const stories = {
    联赛: [`${period}联赛观察：${team}升至前列`, `${period}的${league}竞争升温，${team}与${rival}之间的积分差距继续缩小。`],
    转会: [`${period}转会观察：${footballer}受到关注`, `${rival}正在评估${footballer}的适配度，${team}尚未改变现有阵容计划。`],
    冠军: [`${team}赢得${season}赛季${league}冠军`, `${period}，${team}凭借稳定表现锁定冠军，${rival}位列主要竞争者。`],
    保级: [`${team}进入${period}保级决战`, `${league}保级形势收紧，${team}必须在与${rival}的直接交锋中争取积分。`],
    奖项: [`${footballer}当选${period}最佳球员`, `${footballer}代表${team}连续交出稳定表现，获得${league}月度奖项。`],
    国家队: [`${footballer}入选${period}国家队名单`, `${player?.nation || club?.country || '国家队'}公布新一期名单，${footballer}凭借在${team}的表现获得征召。`],
    教练: [`${team}在${period}调整主教练`, `${team}确认教练团队变动，新任团队将从对阵${rival}开始调整战术。`],
    伤病: [`${footballer}因伤暂别${period}赛事`, `${team}确认${footballer}进入恢复期，复出时间将根据后续医疗评估确定。`],
    新星: [`${footballer}成为${period}${league}新星`, `${footballer}在${team}获得稳定机会，近期表现已进入多家俱乐部的观察名单。`],
    退役: [`${footballer}宣布在${season}赛季后退役`, `${footballer}确认将在完成${team}本赛季任务后结束球员生涯。`],
    纪录: [`${footballer}刷新${period}${team}队史纪录`, `${footballer}在本月完成新的里程碑，${team}将其写入俱乐部纪录。`]
  };
  const [title, copy] = stories[topic];
  return { type: topic, topic, title, copy: `${period}：${copy}`, importance: ['冠军', '国家队', '退役', '纪录'].includes(topic) ? 3 : 2, scope: 'world', relatedClubId: club?.id || null, relatedClub: team, relatedPlayerId: player?.id || null, relatedPlayer: footballer };
}

function importance(item = {}) {
  if (Number.isFinite(Number(item.importance))) return Number(item.importance);
  if (item.priority === 'important' || ['赛季', '转会', '伤病'].includes(item.type)) return 3;
  if (['比赛', '联赛', '市场', '生涯'].includes(item.type)) return 2;
  return 1;
}

export function addNews(state, item) {
  const news = ensureNews(state);
  const title = String(item.title || '职业动态');
  const titleKey = textKey(title), copyKey = textKey(item.copy);
  const duplicate = news.items.find(existing => existing.id === item.id || textKey(existing.title) === titleKey || (copyKey && textKey(existing.copy) === copyKey));
  if (duplicate) return duplicate;
  const entry = { id: item.id || `news-${state.simulation?.date || 'date'}-${news.items.length}`, date: state.simulation?.date, type: '生涯', scope: 'player', read: false, ...item, title, importance: importance(item) };
  news.items.unshift(entry);
  news.items = news.items.slice(0, MAX_NEWS_ITEMS);
  news.unread = news.items.filter(item => !item.read).length;
  return entry;
}

export function generateWorldNews(state, clubs = [], players = [], date = state.simulation?.date, { count = 2 } = {}) {
  if (!state.player || !date || clubs.length < 2) return [];
  const topics = MONTH_TOPICS[Number(date.slice(5, 7))] || WORLD_NEWS_TOPICS;
  return Array.from({ length: Math.min(count, topics.length) }, (_, offset) => {
    const topic = topics[offset];
    return addNews(state, { id: `world-${state.season?.year || 'season'}-${date}-${topic}-${offset}`, date, ...worldStory(topic, worldSubject(state, clubs, players, date, offset, topic), state, date) });
  });
}

export function ensureHomeNews(state) {
  if (!state.player) return;
  const news = ensureNews(state);
  if (!news.items.length) addNews(state, { id: `career-start-${state.createdAt}`, type: '生涯', title: `${state.player.club}青训队发布新赛季名单`, copy: `${state.player.name}进入教练组观察名单，下一场比赛将影响出场顺位。`, relatedClub: state.player.club });
  if (news.items.length < 3) addNews(state, { id: `season-${state.season?.year || 'current'}-brief`, type: '联赛', title: `${state.season?.year || '本赛季'}赛程进入观察期`, copy: `${state.player.club}将根据近期训练、比赛评分和身体状态调整阵容。`, relatedClub: state.player.club });
  if (news.items.length < 3) addNews(state, { id: `market-${state.player.clubId || 'club'}-brief`, type: '市场', title: '经纪人更新了市场观察名单', copy: '俱乐部关注度会随真实存档中的表现、身价和出场时间变化。', relatedClub: state.player.club });
  news.unread = news.items.filter(item => !item.read).length;
  return news.items;
}

export function homeNews(state) {
  const ranked = [...ensureNews(state).items].sort((a, b) => importance(b) - importance(a));
  const featured = ranked.filter(item => importance(item) >= 2);
  return (featured.length >= 3 ? featured : ranked).slice(0, 5);
}
