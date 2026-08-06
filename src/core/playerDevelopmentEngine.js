const ATTRS = ['speed','shooting','passing','dribbling','defending','physical'];
const GK_ATTRS = ['saves','reaction','positioning','handling','aerial','distribution'];
const GK_FROM_STATS = { saves: 'defending', reaction: 'speed', positioning: 'defending', handling: 'dribbling', aerial: 'physical', distribution: 'passing' };
const AGE_MULTIPLIER = age => age <= 19 ? 1.35 : age <= 22 ? 1.08 : age <= 27 ? .72 : age <= 31 ? .32 : -.18;
const MODE_MULTIPLIER = { fast: 1.55, standard: 1, legend: .72, ultra: 1.25 };

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

export function normalizePlayer(player) {
  if (!player) return player;
  const stats = {};
  for (const key of ATTRS) stats[key] = Number(player.stats?.[key] ?? 50);
  const goalkeeping = Object.fromEntries(GK_ATTRS.map(key => [key, Number(player.goalkeeping?.[key] ?? stats[GK_FROM_STATS[key]])]));
  return { ...player, stats, goalkeeping, potential: clamp(Number(player.potential ?? 75), 50, 99), ovr: computeOverall(stats, player.position) };
}

export function computeOverall(stats, position = '中场') {
  const weights = position === 'GK' || position.includes('门将') ? {speed:.05,shooting:.02,passing:.18,dribbling:.05,defending:.35,physical:.35}
    : ['LB','RB','CB'].includes(position) || position.includes('后卫') ? {speed:.16,shooting:.05,passing:.16,dribbling:.10,defending:.31,physical:.22}
    : ['ST','LW','RW'].includes(position) || position.includes('前锋') || position.includes('边锋') ? {speed:.24,shooting:.29,passing:.12,dribbling:.20,defending:.03,physical:.12}
    : ['CAM','LM','RM'].includes(position) || position.includes('前腰') || position.includes('前卫') ? {speed:.16,shooting:.13,passing:.27,dribbling:.25,defending:.06,physical:.13}
    : {speed:.15,shooting:.15,passing:.25,dribbling:.20,defending:.10,physical:.15};
  return Math.round(ATTRS.reduce((sum,key)=>sum + (Number(stats[key])||0)*weights[key],0));
}

export function applyDevelopment(player, gains, context = {}) {
  const next = normalizePlayer(structuredClone(player));
  const before = { ...next.stats };
  const ageFactor = AGE_MULTIPLIER(Number(next.age || 18));
  const fatigueFactor = clamp(1 - (context.fatigue || 0)/150, .45, 1.08);
  const injuryFactor = context.injured ? .45 : 1;
  const facilityFactor = 1 + ((context.facility || 70)-70)/250;
  const coachFactor = 1 + ((context.coachQuality || 70)-70)/300;
  const potentialRoom = clamp((next.potential - next.ovr)/25, .15, 1.25);
  const modeFactor = MODE_MULTIPLIER[context.mode] || 1;
  const multiplier = Math.max(-.4, ageFactor * fatigueFactor * injuryFactor * facilityFactor * coachFactor * potentialRoom * modeFactor);
  const changes = {};
  for (const key of ATTRS) {
    const raw = Number(gains[key] || 0) * multiplier;
    next.stats[key] = clamp(Number((next.stats[key] + raw).toFixed(3)), 1, 99.9);
    changes[key] = Number((next.stats[key] - before[key]).toFixed(3));
  }
  if (next.position?.includes('门将') || next.position === 'GK') {
    next.goalkeeping ??= Object.fromEntries(GK_ATTRS.map(key => [key, next.stats[GK_FROM_STATS[key]]]));
    for (const key of GK_ATTRS) {
      const raw = Number(gains.goalkeeping?.[key] || gains[key] || 0) * multiplier;
      next.goalkeeping[key] = clamp(Number((Number(next.goalkeeping[key] || 0) + raw).toFixed(3)), 1, 99.9);
    }
  }
  if (gains.potential) next.potential = clamp(Number((next.potential + gains.potential).toFixed(2)), 50, 99);
  const oldOvr = next.ovr;
  next.ovr = computeOverall(next.stats, next.position);
  return { player: next, changes, overallChange: next.ovr - oldOvr, breakthroughs: ATTRS.filter(k => Math.floor(next.stats[k]) > Math.floor(before[k])) };
}

export function applyGrowthToState(state,gains,{source='成长',date=state.simulation?.date,...context}={}) {
  const before={...state.player.stats};
  const out=applyDevelopment(state.player,gains,context);
  state.player={...out.player,previousStats:before};
  state.career.growthLog.push({date,source,changes:out.changes,before});
  return {...out,player:state.player};
}

export function seasonTargetRange(age, potential) {
  if (age <= 19 && potential >= 80) return [4,9];
  if (age <= 22) return [2,6];
  if (age <= 27) return [0,3];
  return [-2,1];
}
