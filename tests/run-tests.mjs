import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../src/systems/career/careerSystem.js';
import {generateEvent,resolveEventChoice} from '../src/systems/event/eventEngine.js';
import {generateMatch,resolveMatch} from '../src/systems/match/matchSystem.js';
import {resolveTraining} from '../src/systems/training/trainingSystem.js';
import {generateOffers,respondOffer} from '../src/systems/transfer/transferSystem.js';
import {evaluateAchievements} from '../src/systems/achievement/achievementSystem.js';
import {migrateLegacy} from '../src/services/storage/migrations.js';
import {DeterministicRng} from '../src/services/rng.js';

const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const clubData=await read('../data/clubs.json');
const templates=await read('../data/legend-templates.json');
const achievements=await read('../data/achievements.json');
const repo={clubs:clubData.clubs.map((c,i)=>({...c,youth:c.youth??70,youthUsage:c.youthUsage??60,finance:c.finance??70,attack:c.rep,defense:c.rep,needs:['ST','CM','CB','GK'],tactic:'控球推进'})),templates,achievements,getClub(id){return this.clubs.find(c=>c.id===id)||this.clubs[0]},async loadEventCategory(cat){return read(`../data/events/${cat}.json`)}};

assert.equal(repo.clubs.length,500,'应包含500家球队');
assert.equal(templates.length,500,'应包含500个模板');
assert.equal(achievements.length,330,'应包含330项成就');

const rngA=new DeterministicRng('same-seed'),rngB=new DeterministicRng('same-seed');
assert.deepEqual(Array.from({length:20},()=>rngA.next()),Array.from({length:20},()=>rngB.next()),'同种子序列必须一致');

const talents=createTalentCandidates({seed:'test-seed',position:'ST',style:'禁区终结者',templates,count:3});
assert.equal(talents.length,3);assert.ok(talents.every(t=>t.potential>=72&&t.potential<=97));
const academy=generateAcademyOffers({seed:'test-seed',nation:'中国',position:'ST',ovr:65,talent:talents[0],clubs:repo.clubs});
assert.equal(academy.length,3,'应提供3个青年队邀请');
const club=repo.getClub(academy[0].clubId);
const save=createNewSave({seed:'test-seed',name:'测试球员',displayName:'测试',nation:'中国',age:17,birthDate:'2009-06-15',height:180,weight:72,foot:'右脚',number:9,position:'ST',style:'禁区终结者',talent:talents[0],academyOffer:academy[0],sourceTemplate:templates.find(t=>t.id===talents[0].sourceTemplateId)},club,'slot-test');
assert.equal(save.career.squadLevel.includes('青年'),true);
assert.ok(save.player.ovr>40&&save.player.ovr<85);

const save1=structuredClone(save),save2=structuredClone(save);
const ev1=await generateEvent(save1,repo),ev2=await generateEvent(save2,repo);
assert.equal(ev1.id,ev2.id,'同存档事件应一致');assert.deepEqual(ev1.choices.map(x=>x.id),ev2.choices.map(x=>x.id));assert.ok(ev1.choices.length>=2&&ev1.choices.length<=5);
const res1=resolveEventChoice(save1,ev1.choices[0].id),res2=resolveEventChoice(save2,ev2.choices[0].id);
assert.equal(res1.outcome.label,res2.outcome.label,'事件结果应稳定');

save1.career.phase={trainingDone:true,eventDone:true,matchDone:false};save2.career.phase={trainingDone:true,eventDone:true,matchDone:false};
const m1=generateMatch(save1,repo),m2=generateMatch(save2,repo);assert.equal(m1.id,m2.id);assert.deepEqual(m1.keyChoices,m2.keyChoices);
const mr1=resolveMatch(save1,repo,m1.keyChoices[0]?.id),mr2=resolveMatch(save2,repo,m2.keyChoices[0]?.id);assert.deepEqual(mr1.score,mr2.score);assert.equal(mr1.playerResult.rating,mr2.playerResult.rating);

const before=save.player.ovr;const tr=resolveTraining(save,club);assert.ok(tr.plan);assert.ok(save.player.ovr>=before-1);

save.career.month=1;save.player.ovr=88;save.player.potential=94;save.career.squadLevel='一线队';save.career.seasonStats={apps:32,starts:30,minutes:2500,goals:28,assists:8,cleanSheets:0,rating:8.1,yellow:0,red:0,shots:0,keyPasses:0,tackles:0,saves:0};save.fans.mediaHeat=70;save.status.form=86;
const offers=generateOffers(save,repo);assert.ok(Array.isArray(offers));if(offers.length){const target=offers[0];respondOffer(save,repo,target.id,'reject');assert.equal(target.status,'已拒绝')}

save.career.careerStats.apps=600;const unlocked1=evaluateAchievements(save,achievements);const count=save.achievements.unlocked.length;evaluateAchievements(save,achievements);assert.equal(save.achievements.unlocked.length,count,'成就不得重复发放');assert.ok(unlocked1.length>=1);

const migrated=migrateLegacy({name:'旧球员',age:25,pos:'CAM',ovr:78,potential:86,attrs:{pac:75,sho:72,pas:84,dri:82,def:45,phy:64},clubId:'CHN1-SHA',fans:10000,stats:{apps:120,goals:32,assists:44}});assert.equal(migrated.schemaVersion,22);assert.equal(migrated.player.name,'旧球员');assert.equal(migrated.career.careerStats.apps,120);

console.log(JSON.stringify({status:'PASS',clubs:repo.clubs.length,templates:templates.length,achievements:achievements.length,event:ev1.id,eventChoices:ev1.choices.length,matchScore:mr1.score,offers:offers.length,newAchievements:unlocked1.length},null,2));
