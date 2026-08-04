import { keyedRandom } from '../services/rng.js';
const SEVERITY = { minor: { weeks:[1,2], risk:8 }, moderate:{weeks:[3,6],risk:18}, major:{weeks:[8,20],risk:30} };
export function createInjury({ type='脚踝扭伤', severity='minor', date, bodyPart='脚踝', rng=keyedRandom('injury',date,type,severity,bodyPart) }={}) {
  const [min,max] = SEVERITY[severity].weeks;
  const weeks = rng.int(min,max);
  return { id:`inj-${date||'undated'}-${rng.int(0,1679615).toString(36).padStart(4,'0')}`,type,severity,bodyPart,status:'active',remainingDays:weeks*7,progress:0,relapseRisk:SEVERITY[severity].risk,treatment:'steady',createdAt:date || new Date().toISOString().slice(0,10) };
}
export function advanceInjury(injury, days=1, context={}) {
  const next={...injury};
  if (['recovered','archived'].includes(next.status)) return next;
  const treatmentRate = next.treatment==='aggressive' ? 1.25 : next.treatment==='light' ? .72 : 1;
  const recoveryBonus = Number(context.recoveryBonus || 0);
  const loadPenalty = context.played ? .55 : context.trainedHard ? .25 : 0;
  const progress = Math.max(.15, treatmentRate + recoveryBonus - loadPenalty);
  next.remainingDays = Math.max(0, Number((next.remainingDays - days*progress).toFixed(2)));
  next.progress = Math.min(100, Math.round((1-next.remainingDays/Math.max(1,(next.originalDays||next.remainingDays+days*progress)))*100));
  if (!next.originalDays) next.originalDays = next.remainingDays + days*progress;
  if (next.remainingDays <= 0) { next.status='recovered'; next.progress=100; next.recoveredAt=context.date || new Date().toISOString().slice(0,10); }
  else if (next.remainingDays <= 7) next.status='returning';
  else next.status='active';
  next.relapseRisk = Math.max(2, Math.round(next.relapseRisk + (context.played ? 3 : -0.35*days)));
  return next;
}
export function chooseTreatment(injury, treatment) {
  const map = { light:{label:'轻量恢复',risk:-1}, steady:{label:'稳妥治疗',risk:-3}, aggressive:{label:'激进复出',risk:5} };
  const next={...injury,treatment};
  next.relapseRisk=Math.max(1,next.relapseRisk+(map[treatment]?.risk||0));
  return next;
}
export function activeInjury(injuries=[]) { return injuries.find(i=>!['recovered','archived'].includes(i.status)) || null; }
