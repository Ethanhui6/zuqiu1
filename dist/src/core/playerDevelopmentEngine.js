import {ATTR_KEYS, ATTR_LABELS} from '../app/config.js';
import {calculateOvr} from '../systems/career/ovr.js';
import {clamp} from '../utils/format.js';

const ATTRS = ['speed', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
const THRESHOLD_OFFSET = {pac: 4, sho: 10, pas: 7, dri: 12, def: 2, phy: 14};
const DEFAULT_GROWTH = 82;

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const zeroMap = () => Object.fromEntries(ATTR_KEYS.map(key => [key, 0]));

function threshold(value, key) {
  return Math.max(52, Math.round(62 + (number(value, 50) - 50) * 4.5 + (THRESHOLD_OFFSET[key] || 0)));
}

function ageFactor(age) {
  if (age <= 18) return 1.35;
  if (age <= 21) return 1.22;
  if (age <= 24) return 1.1;
  if (age <= 28) return 1;
  if (age <= 32) return .72;
  return .42;
}

function attrProgress(save, key) {
  const p = save.player;
  const growth = p.growth;
  const value = number(p.attrs[key], 50);
  const base = clamp(number(growth.base[key], Math.floor(value)), 1, 99);
  const next = threshold(base, key);
  const xp = Math.max(0, number(p.xp[key], 0));
  return {
    key,
    value,
    display: Math.round(value),
    base,
    xp,
    next,
    remaining: Math.max(0, Math.ceil(next - xp)),
    progress: Math.min(100, Math.round(xp / next * 100))
  };
}

export function ensureDevelopmentState(save) {
  if (!save?.player) return null;
  const player = save.player;
  const growth = player.growth || (player.growth = {});
  player.attrs = {...Object.fromEntries(ATTR_KEYS.map(key => [key, 50])), ...(player.attrs || {})};
  player.xp = {...zeroMap(), ...(player.xp || {})};
  growth.version = 2;
  growth.base = growth.base || {};
  growth.seasonStart = growth.seasonStart || {};
  growth.seasonXp = {...zeroMap(), ...(growth.seasonXp || {})};
  growth.recent = growth.recent || {};
  growth.log = Array.isArray(growth.log) ? growth.log.slice(-120) : [];

  for (const key of ATTR_KEYS) {
    const value = clamp(number(player.attrs[key], 50), 1, 99);
    const storedBase = number(growth.base[key], NaN);
    const base = Number.isFinite(storedBase) ? clamp(storedBase, 1, 99) : Math.floor(value);
    const legacyFraction = Number.isFinite(storedBase) ? 0 : Math.max(0, value - base) * threshold(base, key);
    player.xp[key] = Math.max(0, number(player.xp[key], 0) + legacyFraction);
    growth.base[key] = base;
    growth.seasonStart[key] = clamp(number(growth.seasonStart[key], value), 1, 99);
    growth.seasonXp[key] = Math.max(0, number(growth.seasonXp[key], 0));
    growth.recent[key] = Array.isArray(growth.recent[key]) ? growth.recent[key].slice(-4) : [];
    player.attrs[key] = clamp(base + player.xp[key] / threshold(base, key), 1, Math.max(number(player.potential, DEFAULT_GROWTH), value));
  }
  player.potential = clamp(number(player.potential, DEFAULT_GROWTH), 50, 99);
  player.ovr = calculateOvr(player.attrs, player.position);
  return growth;
}

function developmentModifiers(save, {club, source = 'event', minutes = 0, trainingEfficiency = 1} = {}) {
  ensureDevelopmentState(save);
  const player = save.player;
  const hidden = player.hidden || {};
  const status = save.status || {};
  const facility = club ? clamp((number(club.youth, 60) + number(club.rep, 60)) / 200, .45, 1.15) : 1;
  const professionalism = clamp((number(hidden.professionalism, 55) + number(hidden.discipline, 55) + number(hidden.learning, 60)) / 300, .45, 1.1);
  const fatigue = clamp(1 - number(status.fatigue, 0) / 150, .45, 1);
  const injury = status.injury?.severity ? Math.max(.25, 1 - number(status.injury.severity, 0)) : 1;
  const minutesFactor = source === 'match' ? clamp(number(minutes, 0) / 90, .18, 1) : 1;
  const sourceFactor = source === 'match' ? .95 : source === 'event' ? .9 : 1;
  const talent = number(player.talent?.growthMultiplier, 1);
  const multiplier = clamp(ageFactor(number(player.age, 18)) * facility * professionalism * fatigue * injury * talent * minutesFactor * sourceFactor * number(trainingEfficiency, 1), .12, 1.9);
  return {multiplier, age: ageFactor(number(player.age, 18)), facility, professionalism, fatigue, injury, minutes: minutesFactor, source: sourceFactor};
}

function changeLabels(key) {
  return ATTR_LABELS?.outfield?.[key] || key;
}

function appendGrowthLog(save, event) {
  save.career ||= {};
  save.career.growthLog = Array.isArray(save.career.growthLog) ? save.career.growthLog : [];
  save.career.growthLog.push({
    date: save.career.gameClock?.currentDate || save.career.calendar?.week || save.career.year || '',
    source: event.source,
    reason: event.reason,
    changes: Object.fromEntries(event.changes.map(change => [change.key, change.delta])),
    xp: Object.fromEntries(event.changes.map(change => [change.key, change.xp])) ,
    ovrBefore: event.ovrBefore,
    ovrAfter: event.ovrAfter
  });
  save.career.growthLog = save.career.growthLog.slice(-120);
}

export function applyGrowthToState(save, gains = {}, {source = 'unknown', club, minutes = 0, trainingEfficiency = 1, reason = ''} = {}) {
  const growth = ensureDevelopmentState(save);
  if (!growth) return {changes: [], breakthroughs: [], upgrades: [], ovrBefore: 0, ovrAfter: 0, ovrDelta: 0, totalXp: 0};
  const player = save.player;
  const ovrBefore = player.ovr;
  const modifiers = developmentModifiers(save, {club, source, minutes, trainingEfficiency});
  const changes = [];
  const cap = Math.max(number(player.potential, DEFAULT_GROWTH), ...ATTR_KEYS.map(key => number(player.attrs[key], 0)));

  for (const key of ATTR_KEYS) {
    const requested = number(gains[key], 0);
    if (!requested) continue;
    const before = attrProgress(save, key);
    const label = changeLabels(key);
    if (requested < 0) {
      const afterValue = clamp(before.value + requested, 1, 99);
      player.attrs[key] = afterValue;
      growth.base[key] = Math.floor(afterValue);
      player.xp[key] = 0;
      const after = attrProgress(save, key);
      changes.push({key, label, requested, xp: 0, valueBefore: before.value, valueAfter: after.value, delta: after.value - before.value, levels: 0, displayBefore: before.display, displayAfter: after.display, progress: after.progress, next: after.next});
      continue;
    }

    const effective = requested * modifiers.multiplier * clamp(.68 + Math.max(0, cap - before.value) / 52, .55, 1.25);
    let xp = before.xp + effective;
    let base = before.base;
    let levels = 0;
    while (base < cap && xp >= threshold(base, key)) {
      xp -= threshold(base, key);
      base += 1;
      levels += 1;
    }
    if (base >= cap) xp = 0;
    growth.base[key] = base;
    player.xp[key] = Math.max(0, xp);
    player.attrs[key] = clamp(base + player.xp[key] / threshold(base, key), 1, cap);
    const after = attrProgress(save, key);
    growth.seasonXp[key] = number(growth.seasonXp[key], 0) + effective;
    growth.recent[key] = [...(growth.recent[key] || []), Number(effective.toFixed(2))].slice(-4);
    changes.push({key, label, requested: Number(requested.toFixed(2)), xp: Number(effective.toFixed(2)), valueBefore: Number(before.value.toFixed(2)), valueAfter: Number(after.value.toFixed(2)), delta: Number((after.value - before.value).toFixed(2)), levels, displayBefore: before.display, displayAfter: after.display, progress: after.progress, next: after.next});
  }

  if (number(gains.potential, 0)) player.potential = clamp(number(player.potential, DEFAULT_GROWTH) + number(gains.potential), 50, 99);
  player.ovr = calculateOvr(player.attrs, player.position);
  const event = {
    id: `growth-${source}-${save.career?.season || 0}-${save.career?.calendar?.week || 0}-${growth.log.length + 1}`,
    source, reason, season: save.career?.season || 1, week: save.career?.calendar?.week || 1,
    ovrBefore, ovrAfter: player.ovr, ovrDelta: player.ovr - ovrBefore, changes
  };
  if (changes.length) {
    growth.log.push(event);
    growth.log = growth.log.slice(-120);
    appendGrowthLog(save, event);
  }
  return {...event, modifiers, upgrades: changes.filter(change => change.levels > 0), breakthroughs: changes.filter(change => change.levels > 0).map(change => change.key), totalXp: changes.reduce((sum, change) => sum + change.xp, 0)};
}

export function settleSeasonDevelopment(save) {
  const growth = ensureDevelopmentState(save);
  if (!growth) return {changes: [], ovrBefore: 0, ovrAfter: 0, ovrDelta: 0};
  const age = number(save.player.age, 18);
  const ovrBefore = save.player.ovr;
  const changes = [];
  if (age >= 29) {
    const decline = {pac: Math.min(.55, (age - 28) * .08), phy: Math.min(.65, (age - 28) * .1)};
    for (const [key, delta] of Object.entries(decline)) {
      const before = attrProgress(save, key);
      const result = applyGrowthToState(save, {[key]: -delta}, {source: 'age', reason: '年龄阶段修正'});
      if (result.changes[0]) changes.push(result.changes[0]);
      if (before.value === attrProgress(save, key).value) changes.pop();
    }
  }
  growth.seasonStart = Object.fromEntries(ATTR_KEYS.map(key => [key, number(save.player.attrs[key], 50)]));
  growth.seasonXp = zeroMap();
  const ovrAfter = save.player.ovr;
  return {changes, ovrBefore, ovrAfter, ovrDelta: ovrAfter - ovrBefore};
}

export function developmentSummary(save) {
  ensureDevelopmentState(save);
  return ATTR_KEYS.map(key => {
    const progress = attrProgress(save, key);
    const seasonStart = number(save.player.growth.seasonStart[key], progress.value);
    const recent = save.player.growth.recent[key] || [];
    return {...progress, label: ATTR_LABELS?.outfield?.[key] || key, seasonDelta: Number((progress.value - seasonStart).toFixed(2)), recent: [...recent]};
  });
}

// Compatibility API for the pre-V20 player shape and its existing tests.
export function normalizePlayer(player) {
  if (!player) return player;
  const stats = {};
  for (const key of ATTRS) stats[key] = number(player.stats?.[key], 50);
  return {...player, stats, potential: clamp(number(player.potential, 75), 50, 99), ovr: computeOverall(stats, player.position)};
}

export function computeOverall(stats, position = '中场') {
  const text = String(position || '');
  const weights = text.includes('门将') || text === 'GK' ? {speed: .05, shooting: .02, passing: .18, dribbling: .05, defending: .35, physical: .35}
    : text.includes('后卫') || ['CB', 'LB', 'RB', 'DM', 'CDM'].includes(text) ? {speed: .16, shooting: .05, passing: .16, dribbling: .10, defending: .31, physical: .22}
      : text.includes('前锋') || text.includes('边锋') || ['ST', 'LW', 'RW', 'SS'].includes(text) ? {speed: .24, shooting: .29, passing: .12, dribbling: .20, defending: .03, physical: .12}
        : {speed: .15, shooting: .15, passing: .25, dribbling: .20, defending: .10, physical: .15};
  return Math.round(ATTRS.reduce((sum, key) => sum + (number(stats[key], 0) * weights[key]), 0));
}

export function applyDevelopment(target, gains = {}, context = {}) {
  if (target?.player?.attrs) return applyGrowthToState(target, gains, context);
  const next = normalizePlayer(structuredClone(target));
  const before = {...next.stats};
  const ageMultiplier = number(next.age, 18) <= 19 ? 1.35 : number(next.age, 18) <= 22 ? 1.08 : number(next.age, 18) <= 27 ? .72 : number(next.age, 18) <= 31 ? .32 : -.18;
  const fatigueFactor = clamp(1 - number(context.fatigue, 0) / 150, .45, 1.08);
  const injuryFactor = context.injured ? .45 : 1;
  const facilityFactor = 1 + (number(context.facility, 70) - 70) / 250;
  const coachFactor = 1 + (number(context.coachQuality, 70) - 70) / 300;
  const room = clamp((next.potential - next.ovr) / 25, .15, 1.25);
  const multiplier = Math.max(-.4, ageMultiplier * fatigueFactor * injuryFactor * facilityFactor * coachFactor * room);
  const changes = {};
  for (const key of ATTRS) {
    const raw = number(gains[key], 0) * multiplier;
    next.stats[key] = clamp(Number((next.stats[key] + raw).toFixed(3)), 1, 99.9);
    changes[key] = Number((next.stats[key] - before[key]).toFixed(3));
  }
  if (number(gains.potential, 0)) next.potential = clamp(Number((next.potential + gains.potential).toFixed(2)), 50, 99);
  const oldOvr = next.ovr;
  next.ovr = computeOverall(next.stats, next.position);
  return {player: next, changes, overallChange: next.ovr - oldOvr, breakthroughs: ATTRS.filter(key => Math.floor(next.stats[key]) > Math.floor(before[key]))};
}

export function seasonTargetRange(age, potential) {
  if (age <= 19 && potential >= 80) return [4, 9];
  if (age <= 22) return [2, 6];
  if (age <= 27) return [0, 3];
  return [-2, 1];
}
