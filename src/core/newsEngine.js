function ensureNews(state) {
  state.news ??= { items: [], unread: 0 };
  state.news.items = Array.isArray(state.news.items) ? state.news.items : [];
  return state.news;
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
  if (news.items.some(existing => existing.id === item.id || existing.title === title)) return news.items.find(existing => existing.id === item.id || existing.title === title);
  const entry = { id: item.id || `news-${state.simulation?.date || 'date'}-${news.items.length}`, date: state.simulation?.date, type: '生涯', read: false, ...item, title, importance: importance(item) };
  news.items.unshift(entry);
  news.items = news.items.slice(0, 40);
  news.unread = news.items.filter(item => !item.read).length;
  return entry;
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
