const ATTRS = ['speed','shooting','passing','dribbling','defending','physical'];
const GK_ATTRS = ['saves','reaction','positioning','handling','aerial','distribution'];
const GK_FROM_STATS = { saves: 'defending', reaction: 'speed', positioning: 'defending', handling: 'dribbling', aerial: 'physical', distribution: 'passing' };
const AGE_MULTIPLIER = age => age <= 19 ? 1.35 : age <= 22 ? 1.08 : age <= 27 ? .72 : age <= 31 ? .32 : -.18;
const MODE_MULTIPLIER = { fast: 1.55, standard: 1, legend: .72, ultra: 1.25 };
const DEVELOPMENT_PROFILES = new Set(['balanced','wonderkid','late-bloomer','early-peak','plateau','injury-setback','career-revival']);
const POSITION_FOCUS = {
  GK: ['defending','physical','passing'], ST: ['shooting','speed','physical'], LW: ['speed','dribbling','shooting'], RW: ['speed','dribbling','shooting'],
  CAM: ['passing','dribbling','shooting'], CM: ['passing','dribbling','physical'], CDM: ['defending','passing','physical'],
  LB: ['speed','defending','passing'], RB: ['speed','defending','passing'], CB: ['defending','physical','passing']
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function hash(value) { let result=2166136261; for(const char of String(value||''))result=Math.imul(result^char.codePointAt(0),16777619); return result>>>0; }
function inferredProfile(player) {
  if (DEVELOPMENT_PROFILES.has(player.developmentProfile)) return player.developmentProfile;
  if (Number(player.potential || 0) >= 91) return 'wonderkid';
  return ['late-bloomer','early-peak','plateau','injury-setback','career-revival','balanced','balanced','balanced'][hash(`${player.name}|${player.birthDate}|${player.position}`)%8];
}

export function normalizePlayer(player) {
  if (!player) return player;
  const stats = {};
  for (const key of ATTRS) stats[key] = Number(player.stats?.[key] ?? 50);
  const goalkeeping = Object.fromEntries(GK_ATTRS.map(key => [key, Number(player.goalkeeping?.[key] ?? stats[GK_FROM_STATS[key]])]));
  const potential=clamp(Number(player.potential??75),50,99);
  return { ...player, stats, goalkeeping, potential, dynamicPotential:clamp(Number(player.dynamicPotential??potential),50,99), developmentProfile:inferredProfile({...player,potential}), leagueLevel:clamp(Number(player.leagueLevel??3),1,5), ovr:computeOverall(stats,player.position) };
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
  const potentialRoom = clamp((next.dynamicPotential - next.ovr)/25, .08, 1.25);
  const modeFactor = MODE_MULTIPLIER[context.mode] || 1;
  const multiplier = Math.max(-.4, ageFactor * fatigueFactor * injuryFactor * facilityFactor * coachFactor * potentialRoom * modeFactor);
  const changes = {};
  for (const key of ATTRS) {
    const raw = Number(gains[key] || 0) * multiplier;
    const ceiling=Math.max(next.stats[key],next.dynamicPotential+2);
    next.stats[key] = clamp(Number((next.stats[key] + raw).toFixed(3)), 1, raw>0?Math.min(99.9,ceiling):99.9);
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

function ageDelta(age,keeper){
  if(keeper){if(age<=18)return 2.35;if(age<=21)return 1.85;if(age<=24)return 1.25;if(age<=29)return .55;if(age<=32)return .1;if(age<=34)return-.55;return-1.15;}
  if(age<=18)return 3.1;if(age<=21)return 2.05;if(age<=24)return 1.05;if(age<=28)return .35;if(age<=30)return 0;if(age<=33)return-.72;return-1.5;
}

function profileDelta(profile,age,rating,injuryAbsences){
  if(profile==='wonderkid')return age<=20?.9:age>=32?-.12:.12;
  if(profile==='late-bloomer')return age<=20?-1.15:age<=28?.9:age<=32?.35:0;
  if(profile==='early-peak')return age<=19?1:age>=27?-.72:age>=23?-.25:0;
  if(profile==='plateau')return age>=20&&age<=29?-.45:0;
  if(profile==='injury-setback')return injuryAbsences?-(.45+Math.min(1.2,injuryAbsences*.12)):-.12;
  if(profile==='career-revival')return age>=29&&age<=32&&rating>=7.25?1.05:0;
  return 0;
}

function trajectoryPhase(age,keeper){
  if(keeper)return age<=21?'快速成长':age<=25?'明显成长':age<=32?'巅峰期':age<=34?'稳定期':'衰退期';
  return age<=18?'快速成长':age<=21?'明显成长':age<=24?'成熟期':age<=28?'巅峰期':age<=30?'稳定期':age<=33?'缓慢下降':'明显下降';
}

function developmentFocus(player){
  const style=String(player.style||'');
  if(/门将|清道夫/.test(style))return POSITION_FOCUS.GK;
  if(/终结|中锋|射门/.test(style))return['shooting','physical','speed'];
  if(/速度|边锋|内切/.test(style))return['speed','dribbling','shooting'];
  if(/组织|出球|传球/.test(style))return['passing','dribbling','defending'];
  if(/防守|屏障|后卫/.test(style))return['defending','physical','passing'];
  return POSITION_FOCUS[player.position]||POSITION_FOCUS.CM;
}

export function applySeasonDevelopment(state,context={}){
  const current=normalizePlayer(state.player),before={...current.stats},age=Number(current.age||18),keeper=current.position==='GK'||current.position?.includes('门将');
  const season=state.season||{},minutes=Number(context.minutes??season.minutes??0),rating=Number(context.rating??season.rating??6.6),training=Number(context.training??state.training?.seasonTrainingCount??0),injuryAbsences=Number(context.injuryAbsences??season.injuryAbsences??0);
  const leagueLevel=clamp(Number(context.leagueLevel??current.leagueLevel??3),1,5),facility=clamp(Number(context.facility??70+Number(state.training?.facilityLevel||1)*4),45,100),coach=clamp(Number(context.coach??current.coachTrust??state.relationships?.coach??55),20,100),morale=clamp(Number(context.morale??current.morale??60),0,100);
  const performance=clamp(.72+minutes/4500+(rating-6.5)*.16,.55,1.28),environment=clamp(.82+training*.055+(facility-65)/260+(coach-50)/420+(morale-50)/500+(leagueLevel-3)*.025,.62,1.28);
  const potentialChange=rating>=7.65&&minutes>=1800?.45:rating<6.45||minutes<500?-.35:0;
  current.dynamicPotential=clamp(Number((current.dynamicPotential+potentialChange-injuryAbsences*.035).toFixed(2)),Math.max(50,current.potential-8),Math.min(99,current.potential+4));
  const room=clamp((current.dynamicPotential-current.ovr)/18,.08,1.18),profile=current.developmentProfile;
  let delta=ageDelta(age,keeper)+profileDelta(profile,age,rating,injuryAbsences)+(hash(`${current.name}|${age}|${profile}`)%101-50)/180;
  if(profile==='plateau'&&age>=20&&age<=29)delta*=.58;
  if(delta>=0)delta*=performance*environment*room;else delta*=clamp(1.12-(rating-6.5)*.08+injuryAbsences*.055,.78,1.42);
  delta=clamp(delta,-2.8,5.2);
  const focus=developmentFocus(current),changes={};
  for(const key of ATTRS){
    const scale=delta>=0?(focus.includes(key)?1.12:.82):(['speed','physical'].includes(key)?1.2:focus.includes(key)?.92:.72);
    const ceiling=Math.max(current.stats[key],current.dynamicPotential+2);
    current.stats[key]=clamp(Number((current.stats[key]+delta*scale).toFixed(3)),1,delta>=0?Math.min(99.9,ceiling):99.9);
    changes[key]=Number((current.stats[key]-before[key]).toFixed(3));
  }
  if(keeper)for(const key of GK_ATTRS){const scale=['reaction','saves','positioning'].includes(key)?1.1:.88;current.goalkeeping[key]=clamp(Number((current.goalkeeping[key]+delta*scale).toFixed(3)),1,99.9);}
  const previousOvr=current.ovr;current.ovr=computeOverall(current.stats,current.position);current.peakOvr=Math.max(Number(current.peakOvr||previousOvr),current.ovr);current.peakAge=current.ovr>Number(state.player.peakOvr||previousOvr)?age:Number(current.peakAge??age);
  state.player={...current,previousStats:before};state.career.growthLog??=[];
  const report={date:state.simulation?.date,source:'赛季成长结算',age,phase:trajectoryPhase(age,keeper),profile,dynamicPotential:current.dynamicPotential,overallChange:current.ovr-previousOvr,beforeOvr:previousOvr,afterOvr:current.ovr,changes,before,factors:{minutes,rating,training,leagueLevel,facility,coach,morale,injuryAbsences}};
  state.career.growthLog.push(report);return report;
}

export { DEVELOPMENT_PROFILES };
