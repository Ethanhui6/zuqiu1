import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {applyFanChange} from '../fan/fanSystem.js';
import {applyRelation} from '../relationship/relationshipSystem.js';

const CATEGORY_BY_STAGE={
  青训期:['academy','training','coach','teammate','family','selection','match','fans'],
  突破期:['training','match','coach','teammate','locker','agent','media','transfer','rivalry','social'],
  成长期:['training','match','coach','locker','agent','contract','media','sponsor','national','leadership','tactics'],
  巅峰期:['match','leadership','contract','media','national','sponsor','rivalry','legacy','finance'],
  生涯末期:['legacy','leadership','contract','family','finance','recovery','media','national']
};

const PHASE_ALIASES={youth:'青训期',academy:'青训期',rotation:'突破期',breakthrough:'突破期',starter:'成长期',growth:'成长期',star:'巅峰期',peak:'巅峰期',veteran:'生涯末期',late:'生涯末期'};
function phaseValues(value){
  if(!value)return[];
  const values=Array.isArray(value)?value:[value];
  return values.flatMap(item=>String(item).split(/[,|/]/)).map(item=>item.trim()).filter(Boolean).map(item=>PHASE_ALIASES[item]||item);
}
function phaseEligible(value,current){
  const phases=phaseValues(value);if(!phases.length)return true;
  if(phases.includes(current))return true;
  // 旧事件库没有单独的“生涯末期”分组，允许成熟的巅峰期剧情继续用于老将阶段。
  if(current==='生涯末期'&&phases.includes('巅峰期'))return true;
  return false;
}
const STYLE_LABEL={safe:'稳健',gamble:'冒险',technical:'技术',heart:'情感',self:'个人',longterm:'长期',aggressive:'强硬',negotiate:'谈判',professional:'职业',team:'团队',counter:'反击',balanced:'均衡'};

function normalizeEvent(raw){
  const choices=(raw.choices||raw.options||[]).map((c,i)=>({
    id:c.id||`${raw.id}-choice-${i}`,text:c.text||c.label||`方案 ${i+1}`,hint:c.hint||c.style||'',style:c.style||'balanced',focus:c.focus||'pas',base:Number(c.base??.62),multiplier:Number(c.multiplier??1),effects:c.effects||{},outcomes:c.outcomes||null,delayedEffects:c.delayedEffects||[],hiddenEffects:c.hiddenEffects||{},unlockChain:c.unlockChain||null,closeChain:c.closeChain||null
  }));
  return{id:raw.id,title:raw.title,description:raw.description||raw.text||'',category:raw.category||'life',categoryCn:raw.categoryCn||raw.categoryName||'职业事件',phase:raw.phase||raw.stage||null,pressure:raw.pressure||'中压',tags:raw.tags||[raw.category||'life'],weight:Number(raw.weight||1),cooldown:Number(raw.cooldown||raw.cooldownSeasons||3),unique:Boolean(raw.unique||raw.major),repeatable:raw.repeatable!==false,prerequisite:raw.prerequisite||raw.prerequisites||[],next:raw.next||raw.nextEvent||null,conditions:raw.conditions||{},choices};
}
function stage(save){if(save.career.squadLevel!=='一线队')return'青训期';if(save.player.age<=21)return'突破期';if(save.player.age<=28)return'成长期';if(save.player.age<=32)return'巅峰期';return'生涯末期'}
function includesPosition(list,pos){return !Array.isArray(list)||!list.length||list.includes(pos)}
function eventEligible(event,save){
  const mem=save.career.eventMemory,c=event.conditions||{};
  if((event.unique||!event.repeatable)&&mem.triggered.includes(event.id))return false;
  if((mem.cooldowns[event.id]||0)>save.career.season)return false;
  if(!phaseEligible(event.phase,stage(save)))return false;
  if(event.prerequisite?.length&&!event.prerequisite.every(x=>mem.triggered.includes(x)||mem.chainsOpen.includes(x)))return false;
  if(c.minAge!==undefined&&save.player.age<Number(c.minAge))return false;if(c.maxAge!==undefined&&save.player.age>Number(c.maxAge))return false;
  if(!includesPosition(c.positions,save.player.position))return false;
  if(Array.isArray(c.squadLevels)&&c.squadLevels.length&&!c.squadLevels.includes(save.career.squadLevel))return false;
  if(c.injured===true&&!save.status.injury)return false;if(c.injured===false&&save.status.injury)return false;
  if(c.minOvr!==undefined&&save.player.ovr<Number(c.minOvr))return false;if(c.maxOvr!==undefined&&save.player.ovr>Number(c.maxOvr))return false;
  if(c.minCoachTrust!==undefined&&save.status.coachTrust<Number(c.minCoachTrust))return false;
  return event.choices.length>=2;
}
function choiceSignature(choices){return choices.map(x=>`${x.style||'balanced'}:${x.focus||'pas'}`).sort().join('|')}
function titleKey(title=''){return String(title).replace(/[“”‘’"'，。！？、：；（）\s]/g,'').slice(0,42)}
function ensureMemory(save){
  const mem=save.career.eventMemory;
  mem.triggered??=[];mem.recentTags??=[];mem.recentTitles??=[];mem.recentChoiceSignatures??=[];mem.choices??=[];mem.chainsOpen??=[];mem.chainsClosed??=[];mem.cooldowns??={};
  return mem;
}
function renderVariables(text,save,repo){
  const club=repo.getClub(save.career.clubId);
  return String(text||'').replaceAll('{球员}',save.player.name).replaceAll('{俱乐部}',club.cn).replaceAll('{位置}',save.player.position).replaceAll('{年龄}',String(save.player.age));
}
function selectChoices(event,rng,mem){
  const maxChoices=Math.min(5,event.choices.length);const optionCount=maxChoices<=2?maxChoices:clamp(rng.int(2,maxChoices),2,maxChoices);
  let best=null,bestPenalty=Infinity;
  for(let attempt=0;attempt<10;attempt++){
    const candidate=rng.shuffle(event.choices).slice(0,optionCount);const signature=choiceSignature(candidate);const styleCount=new Set(candidate.map(x=>x.style)).size;const focusCount=new Set(candidate.map(x=>x.focus)).size;
    const recentIndex=mem.recentChoiceSignatures.lastIndexOf(signature);const penalty=(recentIndex>=0?40+(mem.recentChoiceSignatures.length-recentIndex):0)+(optionCount-styleCount)*5+(optionCount-focusCount)*2;
    if(penalty<bestPenalty){best=candidate;bestPenalty=penalty}if(penalty===0)break;
  }
  return best||event.choices.slice(0,optionCount);
}

export async function generateEvent(save,repo){
  if(save.career.pending.event)return save.career.pending.event;
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const mem=ensureMemory(save),allowed=CATEGORY_BY_STAGE[stage(save)]||CATEGORY_BY_STAGE.成长期,recentCategories=mem.recentTags.slice(-4),recentTitles=new Set(mem.recentTitles.slice(-12));
  const categoryCandidates=allowed.map(category=>({category,weight:recentCategories.includes(category)?.15:1}));let category=rng.weighted(categoryCandidates,x=>x.weight)?.category||allowed[0];
  let pool=(await repo.loadEventCategory(category)).map(normalizeEvent).filter(e=>eventEligible(e,save));
  let fresh=pool.filter(e=>!recentTitles.has(titleKey(e.title)));
  if(fresh.length)pool=fresh;
  else{
    const alternatives=rng.shuffle(allowed.filter(x=>x!==category));
    for(const alternative of alternatives){const candidates=(await repo.loadEventCategory(alternative)).map(normalizeEvent).filter(e=>eventEligible(e,save)&&!recentTitles.has(titleKey(e.title)));if(candidates.length){category=alternative;pool=candidates;fresh=candidates;break}}
  }
  if(!pool.length){
    const fallbacks=[...new Set([...allowed,'training','academy','match','life'])];
    for(const fallback of fallbacks){
      let candidates=(await repo.loadEventCategory(fallback)).map(normalizeEvent).filter(e=>eventEligible(e,save));
      fresh=candidates.filter(e=>!recentTitles.has(titleKey(e.title)));if(fresh.length)candidates=fresh;
      if(candidates.length){category=fallback;pool=candidates;break}
    }
  }
  if(!pool.length)throw new Error('事件库没有符合当前职业状态的事件');
  const weighted=pool.map(e=>{const sameTitle=recentTitles.has(titleKey(e.title));const chainBoost=(mem.chainsOpen.includes(e.id)||e.prerequisite?.some(x=>mem.chainsOpen.includes(x)))?2.4:1;const tagPenalty=e.tags.some(t=>recentCategories.includes(t))?.35:1;return{...e,_w:e.weight*(sameTitle?.05:1)*chainBoost*tagPenalty}});
  const event=rng.weighted(weighted,x=>x._w)||pool[0];const choices=selectChoices(event,rng,mem);
  const generated={...event,title:renderVariables(event.title,save,repo),description:renderVariables(event.description,save,repo),choices:choices.map(c=>({...c,text:renderVariables(c.text,save,repo),hint:renderVariables(c.hint,save,repo)})),generatedAt:{season:save.career.season,month:save.career.month,rngState:rng.state},resolved:false};delete generated._w;
  save.career.pending.event=generated;save.rng=rng.snapshot();return generated;
}

function resolveOutcomeChoice(choice,rng,save){
  if(choice.outcomes?.length){const outcomes=choice.outcomes.map(o=>({...o,weight:Number(o.weight||1)}));return rng.weighted(outcomes,x=>x.weight)}
  const skill=save.player.attrs[choice.focus]||60,state=(save.status.morale+save.status.fitness+save.status.coachTrust)/300;
  const success=clamp(choice.base+(skill-60)/150+(state-.5)*.24-(save.status.fatigue/100)*.12,0.08,.94),roll=rng.next();
  const tier=roll<success*.2?'大成功':roll<success?'取得进展':roll<success+.2?'影响有限':'出现代价';
  const scale=(tier==='大成功'?1.6:tier==='取得进展'?1:tier==='影响有限'?.3:-.65)*Number(choice.multiplier||1),e=choice.effects||{};
  return{label:tier,effects:{xp:Math.round((e.xp||12)*scale),coach:Math.round((e.trust||e.coach||0)*scale),morale:Math.round((e.morale||0)*scale),fans:Math.round((e.fans||0)*scale),fitness:Math.round((e.fitness||0)*scale),money:Math.round((e.money||0)*scale),fatigue:scale<0?Math.round((e.injuryRisk||4)*.45):0},weight:1};
}
function addDelayed(save,choice,event,outcome,rng){
  const pending=save.career.pending.delayedEffects;
  for(const item of choice.delayedEffects||[])pending.push({...item,id:item.id||`DE-${event.id}-${choice.id}-${pending.length}`,dueSeason:Number(item.dueSeason||save.career.season+1),source:event.title});
  if(choice.style==='longterm'&&['大成功','取得进展'].includes(outcome.label))pending.push({id:`DE-${event.id}-${choice.id}-${save.career.season}`,dueSeason:save.career.season+1,type:'reputation',amount:outcome.label==='大成功'?3:1,source:event.title});
  if(rng.bool(.12)&&outcome.label==='大成功')pending.push({id:`DE-${event.id}-${choice.id}-bonus`,dueSeason:save.career.season+1,type:'fans',amount:800,source:event.title});
}

export function resolveEventChoice(save,choiceId){
  const event=save.career.pending.event;if(!event||event.resolved)throw new Error('没有待处理事件');const choice=event.choices.find(x=>x.id===choiceId);if(!choice)throw new Error('选择不存在');
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const outcome=resolveOutcomeChoice(choice,rng,save),effects=outcome.effects||{},focus=choice.focus||'pas';
  save.player.xp[focus]=(save.player.xp[focus]||0)+Math.max(0,effects.xp||0);save.status.coachTrust=clamp(save.status.coachTrust+(effects.coach||effects.trust||0),0,100);save.status.morale=clamp(save.status.morale+(effects.morale||0),0,100);save.status.fitness=clamp(save.status.fitness+(effects.fitness||0),0,100);save.status.fatigue=clamp(save.status.fatigue+(effects.fatigue||0),0,100);save.finance.cash=Math.max(0,save.finance.cash+(effects.money||0));
  applyFanChange(save,{club:(effects.fans||0)*.45,global:(effects.fans||0)*.1,social:(effects.fans||0)*.45,heat:Math.sign(effects.fans||0),reason:event.title});
  if(choice.style==='heart'||choice.style==='team')applyRelation(save,'teammates',{trust:3,respect:2,familiarity:4});if(choice.style==='negotiate')applyRelation(save,'agent',{trust:2,respect:2});if(choice.style==='aggressive')applyRelation(save,'coach',{respect:2,conflict:outcome.label==='出现代价'?8:2});if(choice.style==='safe'||choice.style==='professional')applyRelation(save,'coach',{trust:2});
  const mem=ensureMemory(save);if(!mem.triggered.includes(event.id))mem.triggered.push(event.id);mem.recentTags.push(...event.tags.slice(0,2));mem.recentTags=mem.recentTags.slice(-12);mem.recentTitles.push(titleKey(event.title));mem.recentTitles=mem.recentTitles.slice(-20);const signature=choiceSignature(event.choices);mem.recentChoiceSignatures.push(signature);mem.recentChoiceSignatures=mem.recentChoiceSignatures.slice(-16);mem.choices.push({eventId:event.id,title:event.title,choiceId,label:choice.text,outcome:outcome.label,season:save.career.season,month:save.career.month});mem.choices=mem.choices.slice(-600);mem.cooldowns[event.id]=save.career.season+event.cooldown;mem.lastChoiceSignature=signature;
  if(event.next&&!mem.chainsOpen.includes(event.next))mem.chainsOpen.push(event.next);if(choice.unlockChain&&!mem.chainsOpen.includes(choice.unlockChain))mem.chainsOpen.push(choice.unlockChain);if(choice.closeChain){mem.chainsOpen=mem.chainsOpen.filter(x=>x!==choice.closeChain);if(!mem.chainsClosed.includes(choice.closeChain))mem.chainsClosed.push(choice.closeChain)}
  addDelayed(save,choice,event,outcome,rng);event.resolved=true;event.selectedChoice=choice;event.outcome=outcome;save.rng=rng.snapshot();return{event,choice,outcome};
}

export function consumeResolvedEvent(save){const event=save.career.pending.event;if(event?.resolved)save.career.pending.event=null}
export function applyDelayedEffects(save){
  const due=save.career.pending.delayedEffects.filter(x=>x.dueSeason<=save.career.season),remaining=save.career.pending.delayedEffects.filter(x=>x.dueSeason>save.career.season);save.career.pending.delayedEffects=remaining;
  for(const e of due){if(e.type==='reputation')save.fans.mediaHeat=clamp(save.fans.mediaHeat+Number(e.amount||0),0,100);if(e.type==='fans')applyFanChange(save,{social:Number(e.amount||0),global:Math.round(Number(e.amount||0)*.18),reason:e.source||'延迟影响'});if(e.type==='morale')save.status.morale=clamp(save.status.morale+Number(e.amount||0),0,100);if(e.type==='coachTrust')save.status.coachTrust=clamp(save.status.coachTrust+Number(e.amount||0),0,100)}return due;
}
export function eventChoiceMeta(choice){return STYLE_LABEL[choice.style]||'综合'}
