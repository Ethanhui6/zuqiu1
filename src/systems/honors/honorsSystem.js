const YEAR_PATTERN = /^(\d{4})\/(\d{2})$/;
import { applyGrowthToState } from '../../core/playerDevelopmentEngine.js';
import { advanceInjury } from '../../core/injuryEngine.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const OFF_SEASON_ACTIVITIES = [
  { id: 'recovery', title: '集中恢复', copy: '医疗团队安排了恢复周期，优先降低疲劳与伤病风险。', fatigue: -42, fitness: 34, morale: 4, recoveryDays: 28 },
  { id: 'family', title: '回归生活', copy: '和家人短暂相处，重新整理赛季后的情绪与压力。', fatigue: -24, fitness: 14, morale: 12, recoveryDays: 14 },
  { id: 'agent', title: '经纪人会面', copy: '梳理新赛季目标与合同方向，保持职业选择的主动权。', fatigue: -10, fitness: 6, morale: 6, recoveryDays: 7 },
  { id: 'commercial', title: '商业邀约', copy: '完成有限的商业活动，换取球迷和市场关注。', fatigue: 4, fitness: -2, morale: 5, recoveryDays: 7 },
  { id: 'teammates', title: '队友聚会', copy: '在季前与队友重建默契，带着更好的气氛归队。', fatigue: -12, fitness: 8, morale: 10, recoveryDays: 10 },
  { id: 'media', title: '媒体专访', copy: '回应赛季焦点，让外界听见你的职业规划。', fatigue: 2, fitness: 0, morale: 4, recoveryDays: 7 },
  { id: 'fans', title: '球迷日', copy: '与支持者见面，为新赛季积累信心与连接。', fatigue: -4, fitness: 4, morale: 9, recoveryDays: 7 },
  { id: 'personal', title: '个人充电', copy: '暂时离开聚光灯，按自己的节奏完成生活安排。', fatigue: -30, fitness: 20, morale: 8, recoveryDays: 21 }
];
const OFF_SEASON_COMPLETION_RECOVERY = { fatigue: -8, fitness: 6, morale: 2, recoveryDays: 7 };

export function ensureHonors(state) {
  const honors = state.career.honors = {
    trophies: [],
    personalAwards: [],
    seasons: [],
    retirement: null,
    legendProfile: null,
    ...(state.career.honors || {})
  };
  honors.trophies = Array.isArray(honors.trophies) ? honors.trophies : [];
  honors.personalAwards = Array.isArray(honors.personalAwards) ? honors.personalAwards : [];
  honors.seasons = Array.isArray(honors.seasons) ? honors.seasons : [];
  return honors;
}

function nextSeason(year) {
  const match = YEAR_PATTERN.exec(String(year || ''));
  const start = match ? Number(match[1]) : new Date().getUTCFullYear();
  return `${start + 1}/${String((start + 2) % 100).padStart(2, '0')}`;
}

function createOffSeason(nextYear) {
  const start = Number(String(nextYear).slice(0, 4)) || 0;
  const count = 1 + start % 3;
  const activities = [OFF_SEASON_ACTIVITIES[0]];
  for (let index = 1; index < count; index++) activities.push(OFF_SEASON_ACTIVITIES[1 + (start + index - 1) % (OFF_SEASON_ACTIVITIES.length - 1)]);
  return { season: nextYear, status: 'active', activities: activities.map(item => ({ ...item })), completed: [], completionRecovery: false };
}

export function resolveOffSeasonActivity(state, activityId) {
  const offSeason = state.career?.offSeason;
  const activity = offSeason?.activities?.find(item => item.id === activityId);
  if (offSeason) offSeason.completed ??= [];
  if (!activity || offSeason.completed.includes(activityId)) return null;
  const player = state.player;
  if (player) {
    player.fatigue = clamp(Number(player.fatigue || 0) + activity.fatigue, 0, 100);
    player.fitness = clamp(Number(player.fitness || 100) + activity.fitness, 10, 100);
    player.morale = clamp(Number(player.morale || 50) + activity.morale, 0, 100);
  }
  state.injuries = (state.injuries || []).map(injury => advanceInjury(injury, activity.recoveryDays, { date: state.simulation.date, recoveryBonus: .35 }));
  offSeason.completed.push(activityId);
  state.career.history.unshift({ date: state.simulation.date, type: 'off-season', title: activity.title, summary: activity.copy });
  return activity;
}

export function completeOffSeason(state) {
  const offSeason = state.career?.offSeason;
  if (!offSeason || offSeason.status !== 'active') return false;
  if (!offSeason.completionRecovery) {
    const player = state.player;
    if (player) {
      player.fatigue = clamp(Number(player.fatigue || 0) + OFF_SEASON_COMPLETION_RECOVERY.fatigue, 0, 100);
      player.fitness = clamp(Number(player.fitness || 100) + OFF_SEASON_COMPLETION_RECOVERY.fitness, 10, 100);
      player.morale = clamp(Number(player.morale || 50) + OFF_SEASON_COMPLETION_RECOVERY.morale, 0, 100);
    }
    state.injuries = (state.injuries || []).map(injury => advanceInjury(injury, OFF_SEASON_COMPLETION_RECOVERY.recoveryDays, { date: state.simulation.date, recoveryBonus: .2 }));
    offSeason.completionRecovery = true;
  }
  offSeason.status = 'complete';
  return true;
}

function addOnce(list, item) {
  if (list.some(existing => existing.id === item.id)) return false;
  list.push(item);
  return true;
}

function simulatedHonor(id, name, season, club, category) {
  const assetId = /金靴|Golden Boot/.test(name) ? 'golden-boot' : /年轻|Young/.test(name) ? 'young' : /最佳|Player/.test(name) ? 'player-year' : /杯|Champion/.test(name) ? 'league' : 'legend';
  return { id, assetId: id.includes('domestic') ? 'domestic' : id.includes('league') ? 'league' : assetId, name, season, club, category, dataOrigin: 'generated-fallback', source: 'career simulation' };
}

function nextSeasonFixtures(state) {
  const opponents = ['河畔竞技', '北城学院', '海港青年队', '山城体育', '东港联队', '中央公园'];
  const start = String(state.season.year).slice(0, 4);
  return opponents.map((opponent, index) => ({
    id: `${state.season.year}-fixture-${index}`,
    date: `${Number(start)}-${String(7 + Math.floor(index / 2)).padStart(2, '0')}-${String(6 + (index % 2) * 7).padStart(2, '0')}`,
    competition: index % 3 === 0 ? '国内杯赛' : '青年联赛', opponent,
    venue: index % 2 ? '客场' : '主场', status: 'upcoming', season: state.season.year
  }));
}

export function settleSeason(state) {
  const honors = ensureHonors(state);
  const season = state.season;
  let player = state.player;
  const club = player?.club || 'Unknown club';
  const key = `${season.year}:${player?.clubId || club}`;
  if (honors.seasons.some(record => record.id === key)) return { alreadySettled: true, trophies: [], personalAwards: [], record: null };

  const appearances = Number(season.appearances || 0);
  const goals = Number(season.goals || 0);
  const assists = Number(season.assists || 0);
  const rating = Number(season.rating || 0);
  const trophies = [];
  const personalAwards = [];
  if (appearances >= 12 && rating >= 7.4) trophies.push(simulatedHonor(`${key}:league`, 'League Champion', season.year, club, 'team'));
  if (appearances >= 10 && goals + assists >= 12) trophies.push(simulatedHonor(`${key}:domestic`, 'Domestic Cup', season.year, club, 'team'));
  if (goals >= 10) personalAwards.push(simulatedHonor(`${key}:golden-boot`, 'Golden Boot', season.year, club, 'personal'));
  if (rating >= 7.8 && appearances >= 15) personalAwards.push(simulatedHonor(`${key}:player-year`, 'Player of the Year', season.year, club, 'personal'));
  if (player?.age <= 21 && rating >= 7.2 && appearances >= 12) personalAwards.push(simulatedHonor(`${key}:young`, 'Young Player of the Year', season.year, club, 'personal'));
  trophies.forEach(item => addOnce(honors.trophies, item));
  personalAwards.forEach(item => addOnce(honors.personalAwards, item));

  const startOvr = Number(season.startOvr ?? player?.ovr ?? 0);
  const endOvr = Number(player?.ovr ?? startOvr);
  const startValue = Number(season.startMarketValue ?? state.career.marketValue ?? 0);
  const endValue = Number(state.career.marketValue ?? startValue);
  const startStats = { ...(season.startStats || player?.previousStats || player?.stats || {}) };
  const endStats = { ...(player?.stats || {}) };
  const grade = rating >= 8.4 ? 'SSS' : rating >= 7.8 ? 'SS' : rating >= 7.2 ? 'S' : 'A';
  const record = {
    id: key, year: season.year, club, clubId: player?.clubId || null, crestPath: player?.crestPath || null,
    age: player?.age ?? null, position: player?.position || '未知', appearances, starts: Number(season.starts || 0), goals, assists,
    cleanSheets: Number(season.cleanSheets || 0), saves: Number(season.saves || 0), penaltySaves: Number(season.penaltySaves || 0),
    rating, playerOfMatch: Number(season.playerOfMatch || 0), trophies: trophies.map(item => item.name), personalAwards: personalAwards.map(item => item.name),
    startOvr, endOvr, ovrChange: Number((endOvr - startOvr).toFixed(2)), startValue, endValue, valueChange: endValue - startValue,
    coachTrustChange: Number(season.coachTrustChange || 0), grade, highlights: season.highlights || [], startStats, endStats, transfer: season.transfer || null,
    contract: season.contract || null, injuries: season.injuries || [], dataOrigin: 'generated-fallback'
  };
  honors.seasons.unshift(record);
  state.career.history.unshift({ date: state.simulation.date, type: 'season-summary', title: `${season.year} season summary`, recordId: key, dataOrigin: 'generated-fallback' });
  const nextYear = nextSeason(season.year);
  if (player?.stats) {
    state.career.growthLog ??= [];
    const age = Number(player.age || 18);
    applyGrowthToState(state, age <= 24 ? { passing: .08, physical: .08 } : { passing: .03, physical: -.04 }, { source: '赛季结算成长', fatigue: 0, facility: 74, coachQuality: 72, mode: 'standard', injured: false });
    player = state.player;
  }
  if (player) player.age = Number(player.age || 18) + 1;
  state.career ??= {};
  state.career.offSeason = createOffSeason(nextYear);
  state.career.marketValue = Math.max(0, Math.round(endValue * (1 + (endOvr - startOvr) / 100 + (Number(player?.age || 18) <= 25 ? .04 : -.02))));
  state.career.contractMonths = Math.max(0, Number(state.career.contractMonths || 0) - 12);
  if (state.career.contractMonths === 0) {
    state.career.contractStatus = '到期待处理';
    state.ui ??= {};
    state.ui.todos ??= [];
    if (!state.ui.todos.some(item => item.id === `contract-${nextYear}`)) state.ui.todos.push({ id: `contract-${nextYear}`, type: '合同', title: '合同到期，转会窗口已开启', date: state.simulation.date });
  }
  state.training ??= {};
  state.training.seasonTrainingCount = 0;
  state.training.currentOpportunity = null;
  state.training.completedWeek = 0;
  state.schedule = nextSeasonFixtures({ ...state, season: { ...season, year: nextYear } });
  state.simulation.date = `${String(nextYear).slice(0, 4)}-07-01`;
  state.season = { ...season, year: nextYear, week: 1, progress: 0, appearances: 0, starts: 0, goals: 0, assists: 0, rating: 0, cleanSheets: 0, saves: 0, penaltySaves: 0, playerOfMatch: 0, keyNodes: 0, startOvr: player?.ovr ?? endOvr, startMarketValue: state.career.marketValue, startStats: { ...(player?.stats || {}) }, highlights: [], injuries: [] };
  state.news ??= { items: [], unread: 0 };
  state.news.items ??= [];
  state.news.items.unshift({ id: `season-open-${nextYear}`, date: state.simulation.date, type: '赛季', title: `${nextYear}赛季注册完成`, copy: `${player?.club || club}已生成新赛程，年龄、身价、合同和能力快照已更新。`, read: false });
  state.news.items = state.news.items.slice(0, 40);
  state.news.unread = state.news.items.filter(item => !item.read).length;
  return { alreadySettled: false, trophies, personalAwards, record };
}

export function seasonReviewNext(state) {
  if (state.career?.offSeason?.status === 'active') return { type: 'off-season', title: '进入休赛期', copy: '赛季已结束。安排恢复与场外事务后，再开启新的赛程。', button: '安排休赛期' };
  if ((state.transfer?.offers || []).some(offer => ['pending', 'active'].includes(offer.status))) return { type: 'transfer', title: '查看转会报价', copy: '转会窗口中有待处理的报价。', button: '查看报价' };
  if (Number(state.career?.contractMonths || 0) === 0) return { type: 'contract', title: '处理续约或转会', copy: '当前合同已经到期，需要决定下一站。', button: '处理合同' };
  return { type: 'next-season', title: '进入下一赛季', copy: '新赛程已生成，继续你的职业生涯。', button: '开始新赛季' };
}

export function retireCareer(state) {
  const honors = ensureHonors(state);
  if (honors.retirement) return honors.retirement;
  const totals = honors.seasons.reduce((total, season) => ({
    appearances: total.appearances + season.appearances,
    goals: total.goals + season.goals,
    assists: total.assists + season.assists
  }), { appearances: 0, goals: 0, assists: 0 });
  const score = Math.min(100, 35 + honors.seasons.length * 8 + honors.trophies.length * 6 + honors.personalAwards.length * 5);
  const tier = score >= 90 ? 'all-time legend' : score >= 70 ? 'club legend' : score >= 50 ? 'fan favourite' : 'career professional';
  honors.legendProfile = { score, tier, player: state.player?.name || null, club: state.player?.club || null, dataOrigin: 'generated-fallback' };
  honors.retirement = {
    date: state.simulation.date,
    age: state.player?.age || null,
    club: state.player?.club || null,
    seasons: honors.seasons.length,
    trophies: honors.trophies.length,
    personalAwards: honors.personalAwards.length,
    totals,
    legendProfile: honors.legendProfile,
    summary: `${totals.appearances} appearances, ${totals.goals} goals, ${honors.trophies.length + honors.personalAwards.length} honors`,
    dataOrigin: 'generated-fallback'
  };
  return honors.retirement;
}

export function createCareerShareCard(state) {
  const honors = ensureHonors(state);
  const current = state.season || {};
  const totals = honors.seasons.reduce((total, season) => ({
    appearances: total.appearances + Number(season.appearances || 0),
    goals: total.goals + Number(season.goals || 0),
    assists: total.assists + Number(season.assists || 0)
  }), {
    appearances: Number(current.appearances || 0),
    goals: Number(current.goals || 0),
    assists: Number(current.assists || 0)
  });
  const legend = honors.legendProfile || { tier: '职业生涯进行中', score: Math.min(100, 35 + honors.seasons.length * 8 + honors.trophies.length * 6 + honors.personalAwards.length * 5) };
  const player = state.player?.displayName || state.player?.name || '我的球员';
  const club = state.player?.club || '自由球员';
  const text = `${player} · ${legend.tier}\n${club}\n${totals.appearances}场 ${totals.goals}球 ${totals.assists}助攻 · ${honors.trophies.length}座奖杯 · ${honors.personalAwards.length}项个人荣誉`;
  return { player, club, legend, totals, trophies: honors.trophies.length, personalAwards: honors.personalAwards.length, seasons: honors.seasons.length, text };
}
