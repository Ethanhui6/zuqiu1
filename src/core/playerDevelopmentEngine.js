const ATTRS = ['speed','shooting','passing','dribbling','defending','physical'];
const AGE_MULTIPLIER = age => age <= 19 ? 1.35 : age <= 22 ? 1.08 : age <= 27 ? .72 : age <= 31 ? .32 : -.18;

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

export function normalizePlayer(player) {
  if (!player) return player;
  const stats = {};
  for (const key of ATTRS) stats[key] = Number(player.stats?.[key] ?? 50);
  return { ...player, stats, potential: clamp(Number(player.potential ?? 75), 50, 99), ovr: computeOverall(stats, player.position) };
}

export function computeOverall(stats, position = '中场') {
  const weights = position.includes('门将') ? {speed:.05,shooting:.02,passing:.18,dribbling:.05,defending:.35,physical:.35}
    : position.includes('后卫') ? {speed:.16,shooting:.05,passing:.16,dribbling:.10,defending:.31,physical:.22}
    : position.includes('前锋') || position.includes('边锋') ? {speed:.24,shooting:.29,passing:.12,dribbling:.20,defending:.03,physical:.12}
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
  const multiplier = Math.max(-.4, ageFactor * fatigueFactor * injuryFactor * facilityFactor * coachFactor * potentialRoom);
  const changes = {};
  for (const key of ATTRS) {
    const raw = Number(gains[key] || 0) * multiplier;
    next.stats[key] = clamp(Number((next.stats[key] + raw).toFixed(3)), 1, 99.9);
    changes[key] = Number((next.stats[key] - before[key]).toFixed(3));
  }
  if (gains.potential) next.potential = clamp(Number((next.potential + gains.potential).toFixed(2)), 50, 99);
  const oldOvr = next.ovr;
  next.ovr = computeOverall(next.stats, next.position);
  return { player: next, changes, overallChange: next.ovr - oldOvr, breakthroughs: ATTRS.filter(k => Math.floor(next.stats[k]) > Math.floor(before[k])) };
}

export function seasonTargetRange(age, potential) {
  if (age <= 19 && potential >= 80) return [4,9];
  if (age <= 22) return [2,6];
  if (age <= 27) return [0,3];
  return [-2,1];
}
