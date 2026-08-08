const YEAR_PATTERN = /^(\d{4})\/(\d{2})$/;
import { applySeasonDevelopment } from '../../core/playerDevelopmentEngine.js';
import { createRealFixtures } from '../../core/simulationController.js';
import { advanceInjury } from '../../core/injuryEngine.js';
import { addNews } from '../../core/newsEngine.js';
import { activatePendingContent } from '../../core/contentVersion.js';

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
const PH12_OFF_SEASON_ACTIVITIES = [
  { id: 'award-ceremony', title: '\u9881\u5956\u793c', copy: '\u56de\u987e\u672c\u8d5b\u5b63\u7684\u5956\u676f\u3001\u4e2a\u4eba\u8363\u8a89\u548c\u672a\u83b7\u5956\u9879\u3002', fatigue: -2, fitness: 0, morale: 5, recoveryDays: 2 },
  { id: 'renewal', title: '\u7eed\u7ea6\u8c08\u5224', copy: '\u4e0e\u4ff1\u4e50\u90e8\u786e\u8ba4\u4e0b\u4e00\u4efd\u5408\u540c\u548c\u7403\u961f\u5730\u4f4d\u3002', fatigue: -4, fitness: 0, morale: 3, recoveryDays: 2 },
  { id: 'transfer-offer', title: '\u8f6c\u4f1a\u62a5\u4ef7', copy: '\u7ecf\u7eaa\u4eba\u5e26\u56de\u4e00\u4efd\u7403\u961f\u5173\u6ce8\uff0c\u53ef\u5728\u8f6c\u4f1a\u4e2d\u5fc3\u7ee7\u7eed\u8bc4\u4f30\u3002', fatigue: -2, fitness: 0, morale: 2, recoveryDays: 2 },
  { id: 'national-team', title: '\u56fd\u5bb6\u961f\u7a97\u53e3', copy: '\u56fd\u5bb6\u961f\u6559\u7ec3\u5df2\u8bb0\u5f55\u4f60\u7684\u8d5b\u5b63\u8868\u73b0\uff0c\u65b0\u8d5b\u5b63\u5c06\u4fdd\u7559\u5f81\u53ec\u8d44\u683c\u3002', fatigue: -3, fitness: 2, morale: 4, recoveryDays: 3 },
  { id: 'number-change', title: '\u7403\u8863\u53f7\u7801\u8c03\u6574', copy: '\u4ff1\u4e50\u90e8\u516c\u5e03\u4e86\u65b0\u8d5b\u5b63\u53f7\u7801\u5b89\u6392\u3002', fatigue: 0, fitness: 0, morale: 2, recoveryDays: 1 },
  { id: 'new-signings', title: '\u65b0\u63f4\u52a0\u76df', copy: '\u65b0\u63f4\u52a0\u5165\u540e\uff0c\u4f60\u7684\u4f4d\u7f6e\u7ade\u4e89\u548c\u6218\u672f\u9009\u62e9\u53d1\u751f\u53d8\u5316\u3002', fatigue: -5, fitness: 3, morale: 4, recoveryDays: 4 },
  { id: 'preseason-goals', title: '\u65b0\u8d5b\u5b63\u76ee\u6807', copy: '\u548c\u6559\u7ec3\u7ec4\u786e\u8ba4\u65b0\u8d5b\u5b63\u7684\u51fa\u573a\u3001\u8bc4\u5206\u4e0e\u8fdb\u653b\u76ee\u6807\u3002', fatigue: -4, fitness: 4, morale: 6, recoveryDays: 5 },
  { id: 'training-plan', title: '\u5b63\u524d\u8bad\u7ec3\u8ba1\u5212', copy: '\u4e3a\u65b0\u8d5b\u5b63\u9009\u5b9a\u4e00\u9879\u4e3b\u8981\u8bad\u7ec3\u8def\u7ebf\u3002', fatigue: -8, fitness: 5, morale: 3, recoveryDays: 5 }
];

const HONOR_TEXT = Object.freeze({
  leagueChampion: '\u8054\u8d5b\u51a0\u519b', domesticCup: '\u56fd\u5185\u676f\u8d5b\u51a0\u519b',
  goldenBoot: '\u91d1\u9774\u5956', assistsKing: '\u52a9\u653b\u738b', playerOfYear: '\u8d5b\u5b63\u6700\u4f73\u7403\u5458', youngPlayer: '\u8d5b\u5b63\u6700\u4f73\u5e74\u8f7b\u7403\u5458',
  goldenGlove: '\u91d1\u624b\u5957\u5956', bestDefender: '\u6700\u4f73\u540e\u536b', bestMidfielder: '\u6700\u4f73\u4e2d\u573a',
  bestForward: '\u6700\u4f73\u524d\u950b', bestXi: '\u8d5b\u5b63\u6700\u4f73\u9635\u5bb9', goldenBoy: '\u91d1\u7ae5\u5956',
  ballon: '\u91d1\u7403\u5956', nationalDebut: '\u56fd\u5bb6\u961f\u9996\u79c0', leagueTitle: '\u8054\u8d5b\u51a0\u519b\u6210\u5c31'
});

const MILESTONE_DEFINITIONS = Object.freeze([
  { id: 'debut', name: '\u751f\u6daf\u9996\u79c0', once: true, check: state => Number(state.season.appearances) > 0 },
  { id: 'first-goal', name: '\u751f\u6daf\u9996\u7403', once: true, check: state => Number(state.season.goals) > 0 || state.career.honors.seasons.some(item => Number(item.goals) > 0) },
  { id: 'first-assist', name: '\u9996\u6b21\u52a9\u653b', once: true, check: state => Number(state.season.assists) > 0 || state.career.honors.seasons.some(item => Number(item.assists) > 0) },
  { id: 'first-start', name: '\u9996\u6b21\u9996\u53d1', once: true, check: state => Number(state.season.starts) > 0 || state.career.honors.seasons.some(item => Number(item.starts) > 0) },
  { id: 'season-10-goals', name: '\u5355\u8d5b\u5b63 10 \u7403', once: false, check: state => Number(state.season.goals) >= 10 },
  { id: 'season-20-goals', name: '\u5355\u8d5b\u5b63 20 \u7403', once: false, check: state => Number(state.season.goals) >= 20 },
  { id: 'season-30-goals', name: '\u5355\u8d5b\u5b63 30 \u7403', once: false, check: state => Number(state.season.goals) >= 30 },
  { id: 'season-10-assists', name: '\u5355\u8d5b\u5b63 10 \u6b21\u52a9\u653b', once: false, check: state => Number(state.season.assists) >= 10 },
  { id: 'season-rating-75', name: '\u8d5b\u5b63\u8bc4\u5206 7.5', once: false, check: state => Number(state.season.rating) >= 7.5 },
  { id: 'season-clean-sheets-10', name: '\u5355\u8d5b\u5b63 10 \u6b21\u96f6\u5c01', once: false, check: state => Number(state.season.cleanSheets) >= 10 },
  { id: '100-appearances', name: '\u751f\u6daf\u767e\u573a', once: true, check: state => careerAppearances(state) >= 100 },
  { id: '200-appearances', name: '\u751f\u6daf\u4e24\u767e\u573a', once: true, check: state => careerAppearances(state) >= 200 },
  { id: '500-appearances', name: '\u751f\u6daf\u4e94\u767e\u573a', once: true, check: state => careerAppearances(state) >= 500 },
  { id: 'national-debut', name: HONOR_TEXT.nationalDebut, once: true, check: state => Boolean(state.season.nationalTeam?.calledUp && Number(state.season.nationalTeam?.appearances) > 0) },
  { id: 'league-title', name: HONOR_TEXT.leagueTitle, once: true, check: state => (state.season.trophies || []).some(item => item.assetId === 'league-title') },
  { id: 'continental-title', name: '\u6d32\u9645\u51a0\u519b\u6210\u5c31', once: true, check: state => (state.season.trophies || []).some(item => item.assetId === 'continental-title') },
  { id: 'world-cup-debut', name: '\u4e16\u754c\u676f\u9996\u79c0', once: true, check: state => state.season.nationalTournament === 'world-cup' && Number(state.season.nationalAppearances) > 0 },
  { id: 'world-cup-title', name: '\u4e16\u754c\u676f\u51a0\u519b\u6210\u5c31', once: true, check: state => state.season.nationalTournament === 'world-cup' && state.season.nationalChampion === true }
]);

function careerAppearances(state) {
  return Number(state.season?.appearances || 0) + (state.career?.honors?.seasons || []).reduce((total, item) => total + Number(item.appearances || 0), 0);
}

function leagueLabel(player) {
  const value = String(player?.league || player?.leagueCn || '').toLowerCase();
  if (/premier|英超|鑻辫秴/.test(value)) return '\u82f1\u8d85';
  if (/la liga|laliga|西甲|瑗跨敳/.test(value)) return '\u897f\u7532';
  if (/bundes|德甲|寰风敳/.test(value)) return '\u5fb7\u7532';
  if (/serie|意甲|鎰忕敳/.test(value)) return '\u610f\u7532';
  if (/ligue|法甲|娉曠敳/.test(value)) return '\u6cd5\u7532';
  if (/china|中超|涓秴/.test(value)) return '\u4e2d\u8d85';
  return '\u8054\u8d5b';
}

function objectiveValue(state, objective) {
  if (objective.kind === 'trophy') return (state.season.trophies || []).some(item => item.assetId === objective.assetId) ? 1 : 0;
  if (objective.kind === 'award') return (state.season.personalAwards || []).some(item => item.assetId === objective.assetId) ? 1 : 0;
  return Number(state.season[objective.metric] || 0);
}

function refreshSeasonObjectives(state, final = false) {
  const objectives = state.season.objectives || [];
  for (const objective of objectives) {
    const current = objectiveValue(state, objective);
    objective.current = current;
    objective.progress = Math.min(100, Math.round(current / Math.max(1, Number(objective.target || 1)) * 100));
    if (final) {
      objective.status = current >= objective.target ? 'complete' : 'missed';
      objective.reason = objective.status === 'complete' ? '\u8fbe\u6210\u672c\u8d5b\u5b63\u76ee\u6807' : `\u6700\u7ec8\u8fbe\u6210 ${current}/${objective.target}，\u4e0b\u4e00\u8d5b\u5b63\u4ecd\u53ef\u6311\u6218`;
    }
  }
  return objectives;
}

export function ensureSeasonObjectives(state) {
  if (!state?.player || !state.season) return [];
  if (!Array.isArray(state.season.objectives) || state.season.objectives.length === 0) {
    const position = state.player.position || 'CM';
    const personalMetric = position === 'GK' ? 'cleanSheets' : ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(position) ? 'assists' : 'goals';
    const personalTarget = personalMetric === 'cleanSheets' ? 10 : personalMetric === 'assists' ? 8 : 10;
    state.season.objectives = [
      { id: `${state.season.year}:league-title`, name: `${leagueLabel(state.player)}${HONOR_TEXT.leagueChampion}`, group: 'team', kind: 'trophy', assetId: 'league-title', target: 1, current: 0, progress: 0, status: 'active', reward: '\u7403\u961f\u5956\u676f\u5019\u9009' },
      { id: `${state.season.year}:personal-award`, name: personalMetric === 'cleanSheets' ? HONOR_TEXT.goldenGlove : personalMetric === 'assists' ? '\u52a9\u653b\u738b' : HONOR_TEXT.goldenBoot, group: 'personal', kind: 'metric', metric: personalMetric, target: personalTarget, current: 0, progress: 0, status: 'active', reward: '\u4e2a\u4eba\u8363\u8a89\u5019\u9009' },
      { id: `${state.season.year}:appearances`, name: '\u7a33\u5b9a\u51fa\u573a', group: 'achievement', kind: 'metric', metric: 'appearances', target: state.player.age <= 18 ? 12 : 20, current: 0, progress: 0, status: 'active', reward: '\u6559\u7ec3\u4fe1\u4efb +5' },
      { id: `${state.season.year}:rating`, name: '\u8d5b\u5b63\u5e73\u5747\u8bc4\u5206', group: 'achievement', kind: 'metric', metric: 'rating', target: 7.2, current: 0, progress: 0, status: 'active', reward: '\u89e3\u9501\u4e0b\u4e00\u53d1\u5c55\u8def\u7ebf' }
    ];
  }
  return refreshSeasonObjectives(state);
}

export function updateSeasonObjectives(state, { final = false } = {}) {
  ensureSeasonObjectives(state);
  return refreshSeasonObjectives(state, final);
}

function unlockAchievements(state) {
  const honors = ensureHonors(state), year = state.season.year, newly = [];
  for (const definition of MILESTONE_DEFINITIONS) {
    if (!definition.check(state)) continue;
    const existing = honors.achievements.find(item => item.id === definition.id);
    if (definition.once && existing) continue;
    if (!definition.once && existing?.seasons?.includes(year)) continue;
    const record = existing || { id: definition.id, name: definition.name, count: 0, seasons: [], repeatable: !definition.once, assetId: 'player-year' };
    record.count += 1;
    record.seasons = [...new Set([...(record.seasons || []), year])];
    if (!existing) honors.achievements.push(record);
    honors.achievementLog.push({ id: `${definition.id}:${year}`, achievementId: definition.id, name: definition.name, season: year, dataOrigin: 'generated-fallback' });
    newly.push({ ...record, season: year });
  }
  return newly;
}

export function ensureHonors(state) {
  const honors = state.career.honors = {
    trophies: [],
    personalAwards: [],
    seasons: [],
    pendingReviewId: null,
    retirement: null,
    legendProfile: null,
    ...(state.career.honors || {})
  };
  honors.trophies = Array.isArray(honors.trophies) ? honors.trophies : [];
  honors.personalAwards = Array.isArray(honors.personalAwards) ? honors.personalAwards : [];
  honors.seasons = Array.isArray(honors.seasons) ? honors.seasons : [];
  honors.achievements = Array.isArray(honors.achievements) ? honors.achievements : [];
  honors.achievementLog = Array.isArray(honors.achievementLog) ? honors.achievementLog : [];
  return honors;
}

function seasonPositionStats(position, season) {
  const items = position === 'GK'
    ? [['saves', '扑救'], ['cleanSheets', '零封'], ['penaltySaves', '扑点']]
    : ['CB', 'LB', 'RB'].includes(position)
      ? [['tackles', '抢断'], ['interceptions', '拦截'], ['cleanSheets', '零封']]
      : ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(position)
        ? [['keyPasses', '关键传球'], ['tackles', '抢断'], ['assists', '助攻']]
        : [['shots', '射门'], ['goals', '进球'], ['assists', '助攻']];
  return items.map(([key, label]) => ({ key, label, value: Number(season[key] || 0) }));
}

function seasonCompetitions(state, season, player) {
  const names = [...new Set((state.schedule || []).filter(item => !item.season || item.season === season.year).map(item => item.competition).filter(Boolean))];
  return String(season.competition || season.competitionName || player?.league || names.slice(0, 3).join('、') || '未记录');
}

function nextSeason(year) {
  const match = YEAR_PATTERN.exec(String(year || ''));
  const start = match ? Number(match[1]) : new Date().getUTCFullYear();
  return `${start + 1}/${String((start + 2) % 100).padStart(2, '0')}`;
}

function createOffSeason(nextYear) {
  const start = Number(String(nextYear).slice(0, 4)) || 0;
  const count = 1 + start % 3;
  const pool = [...OFF_SEASON_ACTIVITIES, ...PH12_OFF_SEASON_ACTIVITIES];
  const activities = [OFF_SEASON_ACTIVITIES[0]];
  for (let index = 1; index < count; index++) activities.push(pool[1 + (start + index - 1) % (pool.length - 1)]);
  return { season: nextYear, status: 'active', activities: activities.map(item => ({ ...item })), completed: [], completionRecovery: false, contentVersion: null };
}

function applyOffSeasonActivity(state, activity) {
  const player = state.player;
  const season = state.season?.year;
  if (activity.id === 'award-ceremony') {
    const honors = ensureHonors(state);
    state.career.awardCeremony = { season, trophies: honors.trophies.filter(item => item.season === season).length, personalAwards: honors.personalAwards.filter(item => item.season === season).length };
  } else if (activity.id === 'renewal') {
    const months = Number(state.career.contractMonths || 0);
    if (months <= 6) {
      state.career.contractMonths = 24;
      state.career.contractStatus = '\u6709\u6548';
      state.career.contractRenewal = { season, months: 24, date: state.simulation.date };
      state.ui.todos = (state.ui.todos || []).filter(item => !String(item.id).startsWith('contract-'));
    } else state.career.contractStatus = '\u5df2\u590d\u6838';
  } else if (activity.id === 'transfer-offer') {
    state.transfer ??= {};
    state.transfer.inbox = Array.isArray(state.transfer.inbox) ? state.transfer.inbox : [];
    const id = `offseason-interest-${season}`;
    if (!state.transfer.inbox.some(item => item.id === id)) state.transfer.inbox.push({ id, stage: 'agent_contact', stageLabel: '\u4f11\u8d5b\u671f\u5173\u6ce8', market: 'international', level: 'same', clubId: null, clubName: '\u6d77\u5916\u4ff1\u4e50\u90e8', score: 72, unread: true, copy: '\u7403\u961f\u6b63\u5728\u8bc4\u4f30\u4f60\u7684\u8d5b\u5b63\u8868\u73b0\u3002' });
  } else if (activity.id === 'national-team') {
    const team = player?.nation || player?.country || '\u56fd\u5bb6\u961f';
    state.career.nationalTeam = { ...(state.career.nationalTeam || {}), team, invited: true, lastInvitationSeason: season };
    state.season.nationalTeam = { ...(state.season.nationalTeam || {}), team, calledUp: true, appearances: 0, goals: 0 };
  } else if (activity.id === 'number-change' && player) {
    const from = Number(player.number || 10), to = from >= 99 ? 1 : from + 1;
    player.number = to;
    player.shirtNumberChange = { from, to, season };
  } else if (activity.id === 'new-signings') {
    state.career.squadUpdate = { season, newSignings: 2, competitionChanged: true };
  } else if (activity.id === 'preseason-goals') {
    state.career.preseasonGoals = { season, appearances: 20, goals: player?.position === 'GK' ? 0 : 10, assists: 6, rating: 7.2 };
  } else if (activity.id === 'training-plan') {
    state.training.preseasonPlan = { season, selected: 'balanced', confirmed: true };
    state.training.selectedPlan = null;
  }
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
  applyOffSeasonActivity(state, activity);
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
  const activated = activatePendingContent(state);
  state.season.contentVersion = state.content?.version || state.season?.contentVersion || null;
  offSeason.contentVersion = state.content?.version || null;
  offSeason.completedAt = state.simulation?.date || null;
  if (activated) {
    state.career.history.unshift({ date: state.simulation.date, type: 'content-update', title: '\u65b0\u5185\u5bb9\u5df2\u5e94\u7528', summary: `\u5185\u5bb9\u7248\u672c ${activated.version} \u5df2\u5728\u65b0\u8d5b\u5b63\u751f\u6548` });
    addNews(state, { id: `content-update-${activated.version}-${state.simulation.date}`, date: state.simulation.date, type: '\u66f4\u65b0', title: '\u65b0\u8d5b\u5b63\u5185\u5bb9\u5df2\u5c31\u7eea', copy: `\u5185\u5bb9\u7248\u672c ${activated.version} \u5df2\u5e94\u7528\uff0c\u5386\u53f2\u8d5b\u5b63\u4fdd\u6301\u539f\u6709\u6570\u636e\u3002`, read: false });
  }
  return true;
}

function addOnce(list, item) {
  if (list.some(existing => existing.id === item.id)) return false;
  list.push(item);
  return true;
}

function settleNationalTeamSeason(state) {
  const player = state.player, season = state.season;
  const supplied = season.nationalTeam && typeof season.nationalTeam === 'object' ? season.nationalTeam : null;
  const team = supplied?.team || supplied?.name || player?.nation || player?.country || player?.nationality || '未入选';
  const eligible = supplied ? Boolean(supplied.calledUp || Number(supplied.appearances || supplied.apps || 0) > 0) : Number(player?.age || 0) >= 18 && Number(player?.ovr || 0) >= (Number(player?.age || 0) <= 21 ? 70 : 73) && Number(season?.appearances || 0) >= 12 && Number(season?.rating || 0) >= 6.75;
  const group = player?.position === 'GK' ? 'keeper' : ['ST', 'SS', 'LW', 'RW'].includes(player?.position) ? 'attack' : 'other';
  const appearances = supplied ? Number(supplied.appearances || supplied.apps || 0) : eligible ? clamp(Math.round(2 + (Number(season.rating) - 6.5) * 5 + Number(player.ovr - 70) / 8), 2, 12) : 0;
  const goals = supplied ? Number(supplied.goals || 0) : eligible && group !== 'keeper' ? Math.max(0, Math.round(appearances * (group === 'attack' ? .28 : .08))) : 0;
  season.nationalTeam = { team, calledUp: eligible, appearances, goals };
  season.nationalAppearances = appearances;
  season.nationalGoals = goals;
  const previous = state.career.nationalTeam || { team, calledUp: false, appearances: 0, goals: 0 };
  state.career.nationalTeam = { team, calledUp: previous.calledUp || eligible, appearances: Number(previous.appearances || 0) + appearances, goals: Number(previous.goals || 0) + goals };
  if (eligible && !previous.calledUp) {
    const title = `首次入选${team}国家队`;
    state.career.history.unshift({ date: state.simulation.date, type: '国家队', title, summary: `${player.name}凭借俱乐部表现获得国家队征召。` });
    addNews(state, { id: `national-callup-${state.simulation.date}-${player.name}`, date: state.simulation.date, type: '国家队', title, copy: `${player.name}将在国际比赛窗口加入${team}国家队。`, importance: 3, scope: 'player' });
  }
  return season.nationalTeam;
}

function simulatedHonor(id, name, season, club, category, assetId) {
  return { id, assetId: assetId || 'legend', name, season, club, category, dataOrigin: 'generated-fallback', source: 'career simulation' };
}

export function settleSeason(state) {
  const honors = ensureHonors(state);
  const season = state.season;
  let player = state.player;
  const club = player?.club || 'Unknown club';
  const key = `${season.year}:${player?.clubId || club}`;
  const existing = honors.seasons.find(record => record.id === key);
  if (existing) return { alreadySettled: true, trophies: [], personalAwards: [], record: existing };

  ensureSeasonObjectives(state);
  settleNationalTeamSeason(state);

  const appearances = Number(season.appearances || 0);
  const goals = Number(season.goals || 0);
  const assists = Number(season.assists || 0);
  const rating = Number(season.rating || 0);
  const trophies = [];
  const personalAwards = [];
  const leagueChampion = season.leagueChampion ?? (appearances >= 12 && rating >= 7.4);
  const domesticChampion = season.domesticCupChampion ?? (appearances >= 10 && goals + assists >= 12);
  if (leagueChampion) trophies.push(simulatedHonor(`${key}:league`, `${leagueLabel(player)}${HONOR_TEXT.leagueChampion}`, season.year, club, 'team', 'league-title'));
  if (domesticChampion) trophies.push(simulatedHonor(`${key}:domestic`, HONOR_TEXT.domesticCup, season.year, club, 'team', 'domestic-cup'));
  if (goals >= 10) personalAwards.push(simulatedHonor(`${key}:golden-boot`, HONOR_TEXT.goldenBoot, season.year, club, 'personal', 'golden-boot'));
  if (assists >= 10) personalAwards.push(simulatedHonor(`${key}:assists-king`, HONOR_TEXT.assistsKing, season.year, club, 'personal', 'assists-king'));
  if (rating >= 7.8 && appearances >= 15) personalAwards.push(simulatedHonor(`${key}:player-year`, HONOR_TEXT.playerOfYear, season.year, club, 'personal', 'player-of-season'));
  if (player?.age <= 21 && rating >= 7.2 && appearances >= 12) personalAwards.push(simulatedHonor(`${key}:young`, HONOR_TEXT.youngPlayer, season.year, club, 'personal', 'young-player'));
  const position = player?.position || 'CM';
  if (position === 'GK' && season.cleanSheets >= 12 && appearances >= 15) personalAwards.push(simulatedHonor(`${key}:best-keeper`, HONOR_TEXT.goldenGlove, season.year, club, 'personal', 'best-keeper'));
  if (['CB', 'LB', 'RB', 'CDM'].includes(position) && rating >= 7.3 && appearances >= 15) personalAwards.push(simulatedHonor(`${key}:best-defender`, HONOR_TEXT.bestDefender, season.year, club, 'personal', 'best-defender'));
  if (['CAM', 'CM', 'CDM'].includes(position) && rating >= 7.4 && assists >= 8) personalAwards.push(simulatedHonor(`${key}:best-midfielder`, HONOR_TEXT.bestMidfielder, season.year, club, 'personal', 'best-midfielder'));
  if (['ST', 'SS', 'LW', 'RW'].includes(position) && rating >= 7.4 && goals >= 12) personalAwards.push(simulatedHonor(`${key}:best-forward`, HONOR_TEXT.bestForward, season.year, club, 'personal', 'best-forward'));
  if (rating >= 7.5 && appearances >= 15) personalAwards.push(simulatedHonor(`${key}:best-xi`, HONOR_TEXT.bestXi, season.year, club, 'personal', 'best-xi'));
  if (player?.age <= 21 && rating >= 7.8 && appearances >= 15 && !honors.personalAwards.some(item => item.assetId === 'golden-boy')) personalAwards.push(simulatedHonor(`${key}:golden-boy`, HONOR_TEXT.goldenBoy, season.year, club, 'personal', 'golden-boy'));
  if (rating >= 8.4 && appearances >= 20) personalAwards.push(simulatedHonor(`${key}:ballon`, HONOR_TEXT.ballon, season.year, club, 'personal', 'ballon'));
  if (rating >= 8.1 && appearances >= 20) personalAwards.push(simulatedHonor(`${key}:world-player`, '\u4e16\u754c\u5e74\u5ea6\u6700\u4f73\u7403\u5458', season.year, club, 'personal', 'world-player'));
  const worldCup = season.competitionId === 'world-cup' || season.nationalTournament === 'world-cup';
  if (worldCup && rating >= 8) personalAwards.push(simulatedHonor(`${key}:world-cup-golden-ball`, '\u4e16\u754c\u676f\u91d1\u7403\u5956', season.year, club, 'personal', 'world-cup-golden-ball'));
  if (worldCup && goals >= 5) personalAwards.push(simulatedHonor(`${key}:world-cup-golden-boot`, '\u4e16\u754c\u676f\u91d1\u9774\u5956', season.year, club, 'personal', 'world-cup-golden-boot'));
  if (worldCup && player?.age <= 21 && rating >= 7.4) personalAwards.push(simulatedHonor(`${key}:world-cup-best-young`, '\u4e16\u754c\u676f\u6700\u4f73\u5e74\u8f7b\u7403\u5458', season.year, club, 'personal', 'world-cup-best-young'));
  season.trophies = trophies.map(item => ({ ...item }));
  season.personalAwards = personalAwards.map(item => ({ ...item }));
  const objectiveResults = updateSeasonObjectives(state, { final: true }).map(item => ({ ...item }));
  const newAchievements = unlockAchievements(state);
  trophies.forEach(item => addOnce(honors.trophies, item));
  personalAwards.forEach(item => addOnce(honors.personalAwards, item));

  const startOvr = Number(season.startOvr ?? player?.ovr ?? 0);
  const startValue = Number(season.startMarketValue ?? state.career.marketValue ?? 0);
  const endValue = Number(state.career.marketValue ?? startValue);
  const startStats = { ...(season.startStats || player?.previousStats || player?.stats || {}) };
  if (player?.stats) {
    state.career.growthLog ??= [];
    applySeasonDevelopment(state);
    player = state.player;
  }
  const endOvr = Number(player?.ovr ?? startOvr);
  const endStats = { ...(player?.stats || {}) };
  const recordedHighlights = (season.highlights || []).map(item => typeof item === 'string' ? item : item?.title || item?.summary).filter(Boolean);
  const transferClub = season.transfer?.club || season.transfer?.clubName || season.transfer?.name;
  const highlights = [...new Set([...recordedHighlights, ...trophies.map(item => `赢得 ${item.name}`), ...personalAwards.map(item => `获得 ${item.name}`), ...(transferClub ? [`转会至 ${transferClub}`] : [])])];
  const grade = rating >= 8.4 ? 'SSS' : rating >= 7.8 ? 'SS' : rating >= 7.2 ? 'S' : 'A';
  const coachTrustEnd = Number(player?.coachTrust ?? state.relationships?.coach ?? 0);
  const coachTrustStart = Number(season.startCoachTrust ?? coachTrustEnd - Number(season.coachTrustChange || 0));
  const seasonStart = `${String(season.year).slice(0, 4)}-07-01`;
  const injuries = (season.injuries?.length ? season.injuries : state.injuries || []).filter(item => !item.createdAt || item.createdAt >= seasonStart).map(item => ({ type: item.type || '伤病', status: item.status || null, days: Number(item.originalDays || item.remainingDays || 0) }));
  const suspensionRecords = Array.isArray(season.suspensions) ? season.suspensions : (state.discipline?.suspensions || []).filter(item => !item.issuedAt || item.issuedAt >= seasonStart);
  const national = season.nationalTeam || state.career?.nationalTeam || {};
  const record = {
    id: key, year: season.year, club, clubId: player?.clubId || null, crestPath: player?.crestPath || null,
    clubRank: Number.isFinite(Number(season.clubRank ?? season.leagueRank)) && Number(season.clubRank ?? season.leagueRank) > 0 ? Number(season.clubRank ?? season.leagueRank) : null,
    competition: seasonCompetitions(state, season, player),
    age: player?.age ?? null, position: player?.position || '未知', appearances, starts: Number(season.starts || 0), minutes: Number(season.minutes || 0), goals, assists,
    shots: Number(season.shots || 0), keyPasses: Number(season.keyPasses || 0), tackles: Number(season.tackles || 0), interceptions: Number(season.interceptions || 0), cleanSheets: Number(season.cleanSheets || 0), saves: Number(season.saves || 0), penaltySaves: Number(season.penaltySaves || 0), yellowCards: Number(season.yellowCards || 0), redCards: Number(season.redCards || 0), injuryAbsences: Number(season.injuryAbsences || 0),
    rating, playerOfMatch: Number(season.playerOfMatch || 0), positionStats: seasonPositionStats(position, season), trophies: trophies.map(item => item.name), personalAwards: personalAwards.map(item => item.name), trophyItems: trophies.map(item => ({ ...item })), personalAwardItems: personalAwards.map(item => ({ ...item })), achievements: newAchievements.map(item => item.name), newAchievements: newAchievements.map(item => ({ ...item })), objectiveResults, missedObjectives: objectiveResults.filter(item => item.status === 'missed').map(item => ({ id: item.id, name: item.name, current: item.current, target: item.target, reason: item.reason })),
    startOvr, endOvr, ovrChange: Number((endOvr - startOvr).toFixed(2)), startValue, endValue, valueChange: endValue - startValue,
    weeklySalary: Number(state.career?.weeklySalary || 0), coachTrustStart, coachTrustEnd, coachTrustChange: Number((coachTrustEnd - coachTrustStart).toFixed(2)), grade, highlights, majorEvents: highlights, startStats, endStats, transfer: season.transfer || null,
    contract: season.contract || null, injuries, suspensions: Number.isFinite(Number(season.suspensions)) ? Number(season.suspensions) : Math.max(suspensionRecords.length, Number(season.redCards || 0)), nationalTeam: { team: national.team || national.name || player?.nation || player?.country || '未入选', calledUp: Boolean(national.calledUp || Number(season.nationalAppearances || national.appearances || national.apps || 0) > 0), appearances: Number(season.nationalAppearances || national.appearances || national.apps || 0), goals: Number(season.nationalGoals || national.goals || 0) }, teamRole: state.career?.teamRole || player?.status || player?.team || '未记录', acknowledgedAt: null, dataOrigin: 'generated-fallback'
  };
  record.contentVersion = state.content?.version || null;
  record.contentBuildVersion = state.content?.buildVersion || null;
  honors.seasons.unshift(record);
  state.career.history.unshift({ date: state.simulation.date, type: 'season-summary', title: `${season.year} season summary`, recordId: key, dataOrigin: 'generated-fallback' });
  const nextYear = nextSeason(season.year);
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
  state.simulation.date = `${String(nextYear).slice(0, 4)}-07-01`;
  state.season = { ...season, year: nextYear, week: 1, progress: 0, appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, shots: 0, keyPasses: 0, tackles: 0, interceptions: 0, rating: 0, cleanSheets: 0, saves: 0, penaltySaves: 0, yellowCards: 0, redCards: 0, suspensions: 0, playerOfMatch: 0, injuryAbsences: 0, nationalTeam: null, nationalAppearances: 0, nationalGoals: 0, trophies: [], personalAwards: [], objectives: [], keyNodes: 0, startOvr: player?.ovr ?? endOvr, startMarketValue: state.career.marketValue, startStats: { ...(player?.stats || {}) }, highlights: [], injuries: [] };
  ensureSeasonObjectives(state);
  state.season.contentVersion = state.content?.version || null;
  state.schedule = createRealFixtures(state);
  addNews(state, { id: `season-open-${nextYear}`, date: state.simulation.date, type: '赛季', title: `${nextYear}赛季注册完成`, copy: `${player?.club || club}已生成新赛程，年龄、身价、合同和能力快照已更新。`, read: false });
  // The achievement pass normalizes the honors object, so write the gate last.
  state.career.honors.pendingReviewId = key;
  return { alreadySettled: false, trophies, personalAwards, record };
}

export function acknowledgeSeasonReview(state, recordId) {
  const honors = ensureHonors(state);
  const record = honors.seasons.find(item => item.id === recordId);
  if (!record || honors.pendingReviewId !== recordId || record.acknowledgedAt) return false;
  record.acknowledgedAt = state.simulation?.date || new Date().toISOString().slice(0, 10);
  honors.pendingReviewId = null;
  return true;
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
    summary: `${totals.appearances} 次出场，${totals.goals} 个进球，${honors.trophies.length + honors.personalAwards.length} 项荣誉`,
    dataOrigin: 'generated-fallback'
  };
  state.career.retired = true;
  state.simulation.paused = true;
  state.schedule = (state.schedule || []).filter(match => match.status === 'played');
  if (state.training) state.training.currentOpportunity = null;
  if (state.player) state.player.status = '已退役';
  addNews(state, { id: `career-retirement-${state.simulation.date}-${state.player?.name}`, date: state.simulation.date, type: '退役', title: `${state.player?.name || '球员'}正式退役`, copy: honors.retirement.summary, importance: 3, scope: 'player' });
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
