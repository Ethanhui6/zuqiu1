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
const STYLE_LABEL={safe:'稳健',gamble:'冒险',technical:'技术',heart:'情感',self:'个人',longterm:'长期',aggressive:'强硬',negotiate:'谈判'};

function normalizeEvent(raw){
  const choices=(raw.choices||raw.options||[]).map((c,i)=>({
    id:c.id||`${raw.id}-choice-${i}`,text:c.text||c.label||`选择 ${i+1}`,hint:c.hint||c.style||'',style:c.style||'balanced',focus:c.focus||'pas',base:Number(c.base??.62),multiplier:Number(c.multiplier??1),effects:c.effects||{},outcomes:c.outcomes||null
  }));
  return{id:raw.id,title:raw.title,description:raw.description||raw.text||'',category:raw.category||'life',categoryCn:raw.categoryCn||raw.categoryName||'职业事件',phase:raw.phase||raw.stage||null,pressure:raw.pressure||'中压',tags:raw.tags||[raw.category||'life'],weight:Number(raw.weight||1),cooldown:Number(raw.cooldown||raw.cooldownSeasons||3),unique:Boolean(raw.unique||raw.major),repeatable:raw.repeatable!==false,prerequisite:raw.prerequisite||raw.prerequisites||[],next:raw.next||raw.nextEvent||null,choices};
}
function stage(save){if(save.career.squadLevel!=='一线队')return'青训期';if(save.player.age<=21)return'突破期';if(save.player.age<=28)return'成长期';if(save.player.age<=32)return'巅峰期';return'生涯末期'}
function eventEligible(event,save){
  const mem=save.career.eventMemory;if(event.unique&&mem.triggered.includes(event.id))return false;if((mem.cooldowns[event.id]||0)>save.career.season)return false;
  if(event.phase&&event.phase!==stage(save)&&!String(event.phase).includes(stage(save).slice(0,2)))return false;
  if(event.prerequisite?.length&&!event.prerequisite.every(x=>mem.triggered.includes(x)||mem.chainsOpen.includes(x)))return false;
  return true;
}
function choiceSignature(choices){return choices.map(x=>x.style||x.focus).sort().join('|')}

export async function generateEvent(save,repo){
  if(save.career.pending.event)return save.career.pending.event;
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const mem=save.career.eventMemory;const allowed=CATEGORY_BY_STAGE[stage(save)]||CATEGORY_BY_STAGE.成长期;
  let category=rng.pick(allowed);
  const recent=mem.recentTags.slice(-3);for(let attempt=0;attempt<5&&recent.includes(category);attempt++)category=rng.pick(allowed);
  let pool=(await repo.loadEventCategory(category)).map(normalizeEvent).filter(e=>eventEligible(e,save));
  if(!pool.length){
    const fallbacks=[...new Set([...allowed,'training','academy','match','life'])];
    for(const fallback of fallbacks){
      let candidates=(await repo.loadEventCategory(fallback)).map(normalizeEvent).filter(e=>eventEligible(e,save));
      if(!candidates.length)candidates=(await repo.loadEventCategory(fallback)).map(normalizeEvent).filter(e=>e.choices.length>=2);
      if(candidates.length){category=fallback;pool=candidates;break}
    }
  }
  if(!pool.length)throw new Error('事件库没有可用事件，请检查事件数据');
  const weighted=pool.map(e=>({...e,_w:e.weight*(recent.includes(e.category)?.15:1)*(e.next&&mem.chainsOpen.includes(e.next)?1.8:1)}));
  const event=rng.weighted(weighted,x=>x._w)||pool[0];
  const maxChoices=Math.min(5,event.choices.length);const optionCount=maxChoices<=2?maxChoices:clamp(rng.int(2,maxChoices),2,maxChoices);let choices=rng.shuffle(event.choices).slice(0,optionCount);
  const lastSignature=mem.lastChoiceSignature||'';if(choiceSignature(choices)===lastSignature&&event.choices.length>optionCount){choices=rng.shuffle(event.choices).slice(-optionCount)}
  const generated={...event,choices,generatedAt:{season:save.career.season,month:save.career.month},resolved:false};delete generated._w;
  save.career.pending.event=generated;save.rng=rng.snapshot();return generated;
}

function resolveOutcomeChoice(choice,rng,save){
  if(choice.outcomes?.length){
    const outcomes=choice.outcomes.map(o=>({...o,weight:Number(o.weight||1)}));return rng.weighted(outcomes,x=>x.weight);
  }
  const skill=save.player.attrs[choice.focus]||60;const state=(save.status.morale+save.status.fitness+save.status.coachTrust)/300;
  const success=clamp(choice.base+(skill-60)/150+(state-.5)*.24-(save.status.fatigue/100)*.12,0.08,.94);const roll=rng.next();
  const tier=roll<success*.2?'大成功':roll<success?'取得进展':roll<success+.2?'影响有限':'出现代价';
  const scale=tier==='大成功'?1.6:tier==='取得进展'?1:tier==='影响有限'?.3:-.65;
  const e=choice.effects||{};return{label:tier,effects:{xp:Math.round((e.xp||12)*scale),coach:Math.round((e.trust||e.coach||0)*scale),morale:Math.round((e.morale||0)*scale),fans:Math.round((e.fans||0)*scale),fitness:Math.round((e.fitness||0)*scale),money:Math.round((e.money||0)*scale),fatigue:scale<0?Math.round((e.injuryRisk||4)*.45):0},weight:1};
}

export function resolveEventChoice(save,choiceId){
  const event=save.career.pending.event;if(!event||event.resolved)throw new Error('没有待处理事件');const choice=event.choices.find(x=>x.id===choiceId);if(!choice)throw new Error('选择不存在');
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const outcome=resolveOutcomeChoice(choice,rng,save);const effects=outcome.effects||{};
  const focus=choice.focus||'pas';save.player.xp[focus]=(save.player.xp[focus]||0)+Math.max(0,effects.xp||0);save.status.coachTrust=clamp(save.status.coachTrust+(effects.coach||effects.trust||0),0,100);save.status.morale=clamp(save.status.morale+(effects.morale||0),0,100);save.status.fitness=clamp(save.status.fitness+(effects.fitness||0),0,100);save.status.fatigue=clamp(save.status.fatigue+(effects.fatigue||0),0,100);save.finance.cash=Math.max(0,save.finance.cash+(effects.money||0));
  applyFanChange(save,{club:(effects.fans||0)*.45,global:(effects.fans||0)*.1,social:(effects.fans||0)*.45,heat:Math.sign(effects.fans||0),reason:event.title});
  if(choice.style==='heart')applyRelation(save,'teammates',{trust:3,respect:2,familiarity:4});if(choice.style==='negotiate')applyRelation(save,'agent',{trust:2,respect:2});if(choice.style==='aggressive')applyRelation(save,'coach',{respect:2,conflict:outcome.label==='出现代价'?8:2});if(choice.style==='safe')applyRelation(save,'coach',{trust:2});
  const mem=save.career.eventMemory;mem.triggered.push(event.id);mem.triggered=mem.triggered.slice(-300);mem.recentTags.push(event.category);mem.recentTags=mem.recentTags.slice(-8);mem.choices.push({eventId:event.id,choiceId,label:choice.text,outcome:outcome.label,season:save.career.season});mem.choices=mem.choices.slice(-200);mem.cooldowns[event.id]=save.career.season+event.cooldown;mem.lastChoiceSignature=choiceSignature(event.choices);if(event.next&&!mem.chainsOpen.includes(event.next))mem.chainsOpen.push(event.next);
  if(rng.bool(.18)&&outcome.label==='大成功')save.career.pending.delayedEffects.push({dueSeason:save.career.season+1,type:'reputation',amount:2,source:event.title});
  event.resolved=true;event.selectedChoice=choice;event.outcome=outcome;save.rng=rng.snapshot();return{event,choice,outcome};
}

export function consumeResolvedEvent(save){const event=save.career.pending.event;if(event?.resolved)save.career.pending.event=null}
export function applyDelayedEffects(save){const due=save.career.pending.delayedEffects.filter(x=>x.dueSeason<=save.career.season);save.career.pending.delayedEffects=save.career.pending.delayedEffects.filter(x=>x.dueSeason>save.career.season);for(const e of due){if(e.type==='reputation')save.fans.mediaHeat=clamp(save.fans.mediaHeat+e.amount,0,100)}return due}
export function eventChoiceMeta(choice){return STYLE_LABEL[choice.style]||'综合'}
