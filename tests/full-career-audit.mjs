import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../src/systems/career/careerSystem.js';
import {beginPhase,markEventDone,prepareMatch,markMatchDone,finishPhase} from '../src/systems/career/cycleSystem.js';
import {resolveEventChoice} from '../src/systems/event/eventEngine.js';
import {resolveMatch} from '../src/systems/match/matchSystem.js';
import {respondOffer,availableOfferActions} from '../src/systems/transfer/transferSystem.js';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const raw=await read('../data/clubs.json'),templates=await read('../data/legend-templates.json'),achievements=await read('../data/achievements.json');
const clubs=raw.clubs;const repo={clubs,templates,achievements,getClub(id){return clubs.find(c=>c.id===id)||clubs[0]},async loadEventCategory(cat){return read(`../data/events/${cat}.json`)}};
const talents=createTalentCandidates({seed:'full-retirement',position:'ST',style:'全能前锋',templates,count:3});const a=generateAcademyOffers({seed:'full-retirement',nation:'中国',position:'ST',ovr:64,talent:talents[0],clubs});const club=repo.getClub(a[0].clubId);const save=createNewSave({seed:'full-retirement',name:'全程测试',displayName:'全程',nation:'中国',age:17,birthDate:'2009-01-01',height:181,weight:76,foot:'右脚',number:9,position:'ST',style:'全能前锋',talent:talents[0],academyOffer:a[0],sourceTemplate:templates.find(x=>x.id===talents[0].sourceTemplateId)},club,'full');
let phases=0,accepts=0,rejects=0;
while(!save.career.retirement&&phases<260){
 let b;try{b=await beginPhase(save,repo)}catch(error){console.error(JSON.stringify({phase:phases,age:save.player.age,season:save.career.season,month:save.career.month,squad:save.career.squadLevel,stage:save.career.teamRole,ovr:save.player.ovr,triggered:save.career.eventMemory.triggered.length,error:error.message},null,2));throw error}assert.ok(b.event);const choice=b.event.choices[phases%b.event.choices.length];resolveEventChoice(save,choice.id);markEventDone(save);const m=prepareMatch(save,repo);resolveMatch(save,repo,m.keyChoices[phases%m.keyChoices.length].id);markMatchDone(save);const r=finishPhase(save,repo);
 for(const offer of [...(r.offers||[])]){const actions=availableOfferActions(save,offer);if(!actions.length)continue;if(phases%40===0&&actions.includes('accept')&&offer.type!=='续约'){respondOffer(save,repo,offer.id,'accept');accepts++;break}else if(actions.includes('reject')){respondOffer(save,repo,offer.id,'reject');rejects++;}}
 phases++;
}
assert.ok(save.career.retirement,'应在合理年龄结束职业生涯');assert.ok(save.player.age>=34);assert.ok(phases>=150);assert.ok(save.career.eventMemory.choices.length>100);assert.ok(save.career.careerStats.apps>0);assert.ok(save.achievements.unlocked.length>0);const restored=structuredClone(JSON.parse(JSON.stringify(save)));assert.deepEqual(restored.rng,save.rng);assert.deepEqual(restored.career.pending,save.career.pending);
console.log(JSON.stringify({status:'PASS',phases,age:save.player.age,seasons:save.career.season,ovr:save.player.ovr,apps:save.career.careerStats.apps,goals:save.career.careerStats.goals,accepts,rejects,clubs:save.career.clubHistory.length,achievements:save.achievements.unlocked.length,ending:save.career.retirement.name},null,2));
