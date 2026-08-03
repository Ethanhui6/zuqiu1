import {TRAINING_PLANS} from '../../app/config.js';
import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {calculateOvr} from '../career/ovr.js';

export function getTrainingPlans(save){return TRAINING_PLANS.map(plan=>({...plan,selected:save.career.trainingPlan===plan.id}))}

export function selectTrainingPlan(save,planId){if(!TRAINING_PLANS.some(x=>x.id===planId))throw new Error('未知训练计划');save.career.trainingPlan=planId}

function ageFactor(age){if(age<=18)return 1.35;if(age<=21)return 1.22;if(age<=24)return 1.10;if(age<=28)return 1;if(age<=32)return .72;return .42}

export function resolveTraining(save,club){
  const plan=TRAINING_PLANS.find(x=>x.id===save.career.trainingPlan)||TRAINING_PLANS[6];
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const p=save.player,s=save.status,h=p.hidden;
  const facility=(club.youth+club.rep)/200;
  const professionalism=(h.professionalism+h.discipline+h.learning)/300;
  const fatiguePenalty=1-clamp(s.fatigue/150,0,.55);
  const injuryPenalty=s.injury?.severity?Math.max(.25,1-s.injury.severity):1;
  const talent=p.talent?.growthMultiplier||1;
  const multiplier=ageFactor(p.age)*facility*professionalism*fatiguePenalty*injuryPenalty*talent;
  const gains=[];
  for(const key of plan.focus){
    const base=plan.intensity*(4+rng.next()*5)*multiplier;
    p.xp[key]=(p.xp[key]||0)+base;
    const threshold=65+(p.attrs[key]-50)*4.5;
    let levels=0;
    while(p.xp[key]>=threshold&&p.attrs[key]<Math.min(99,p.potential+2)){p.xp[key]-=threshold;p.attrs[key]++;levels++}
    if(levels)gains.push({key,levels});
  }
  s.fatigue=clamp(s.fatigue+plan.fatigue,0,100);s.fitness=clamp(s.fitness-plan.intensity*2+(plan.id==='recovery'?16:0),0,100);
  const risk=clamp((plan.risk+(p.hidden.injuryProne||30)*.15+s.fatigue*.10-club.youth*.05)/100,0,.65);
  let injury=null;
  if(rng.bool(risk)){
    const severity=.08+rng.next()*.42;injury={name:severity>.34?'肌肉拉伤':'轻微不适',severity,remainingMatches:severity>.34?rng.int(2,5):1};s.injury=injury;s.fitness=clamp(s.fitness-15,0,100);
  }
  p.ovr=calculateOvr(p.attrs,p.position);save.rng=rng.snapshot();
  return{plan,gains,injury,multiplier:Number(multiplier.toFixed(2))};
}


/** 每个生涯阶段推进伤病与停赛状态，避免旧伤永久锁死球员。 */
export function progressRecovery(save,club){
  const result={recovered:false,remaining:0};
  if(save.status.suspension>0)save.status.suspension=Math.max(0,save.status.suspension-1);
  const injury=save.status.injury;if(!injury)return result;
  const medicalBonus=Math.max(0,((club?.youth||60)-55)/100);
  injury.remainingMatches=Math.max(0,Number(injury.remainingMatches||1)-1);
  save.status.fitness=clamp(save.status.fitness+Math.round(5+medicalBonus*5),0,100);
  result.remaining=injury.remainingMatches;
  if(injury.remainingMatches<=0){save.status.injury=null;save.status.fitness=clamp(save.status.fitness+8,0,100);save.career.history.push({type:'recovery',year:save.career.year,title:'伤愈复出',text:'医疗团队确认你已经可以恢复完整比赛负荷。'});result.recovered=true}
  return result;
}
