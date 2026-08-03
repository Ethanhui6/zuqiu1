import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../src/systems/career/careerSystem.js';
import {beginPhase,markEventDone,prepareMatch,markMatchDone,finishPhase} from '../src/systems/career/cycleSystem.js';
import {resolveEventChoice} from '../src/systems/event/eventEngine.js';
import {resolveMatch} from '../src/systems/match/matchSystem.js';
import {respondOffer} from '../src/systems/transfer/transferSystem.js';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const rawClubs=await read('../data/clubs.json');const templates=await read('../data/legend-templates.json');const achievements=await read('../data/achievements.json');
const clubs=rawClubs.clubs.map((c,i)=>({...c,attack:c.attack??c.rep,defense:c.defense??c.rep,youth:c.youth??70,finance:c.finance??70,youthUsage:c.youthUsage??60,needs:c.needs??['ST','CM','CB'],tactic:c.tactic??'控球推进'}));
const repo={clubs,templates,achievements,getClub(id){return clubs.find(c=>c.id===id)||clubs[0]},async loadEventCategory(cat){return read(`../data/events/${cat}.json`)}};
const talents=createTalentCandidates({seed:'long-career',position:'CAM',style:'前场创造者',templates,count:3});
const offers=generateAcademyOffers({seed:'long-career',nation:'中国',position:'CAM',ovr:64,talent:talents[1],clubs});
const club=repo.getClub(offers[0].clubId);
const save=createNewSave({seed:'long-career',name:'长期测试',displayName:'测试',nation:'中国',age:17,birthDate:'2009-01-01',height:177,weight:68,foot:'左脚',number:10,position:'CAM',style:'前场创造者',talent:talents[1],academyOffer:offers[0],sourceTemplate:templates.find(x=>x.id===talents[1].sourceTemplateId)},club,'slot-long');
const ids=[];
for(let phase=0;phase<24&&!save.career.retirement;phase++){
  const begun=await beginPhase(save,repo);assert.ok(begun.event,'阶段必须生成事件');assert.ok(begun.event.choices.length>=2&&begun.event.choices.length<=5);ids.push(begun.event.id);
  resolveEventChoice(save,begun.event.choices[0].id);markEventDone(save);
  const match=prepareMatch(save,repo);assert.ok(match.keyChoices.length>=2);resolveMatch(save,repo,match.keyChoices[0].id);markMatchDone(save);
  const result=finishPhase(save,repo);for(const offer of result.offers||[]){if(offer.status==='待决定')respondOffer(save,repo,offer.id,'reject')}
}
assert.ok(save.career.season>=3,'应推进多个赛季');assert.ok(save.career.careerStats.apps>0,'应产生出场数据');
for(let i=1;i<ids.length;i++)assert.notEqual(ids[i],ids[i-1],'不应连续出现相同事件');
assert.ok(save.career.eventMemory.choices.length>=20,'事件选择历史应保存');
console.log(JSON.stringify({status:'PASS',seasons:save.career.season,age:save.player.age,ovr:save.player.ovr,apps:save.career.careerStats.apps,events:ids.length,uniqueEvents:new Set(ids).size,achievements:save.achievements.unlocked.length},null,2));
