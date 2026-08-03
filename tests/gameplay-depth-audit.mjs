import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../src/systems/career/careerSystem.js';
import {generateEvent,resolveEventChoice,consumeResolvedEvent,eventDiagnostics} from '../src/systems/event/eventEngine.js';
import {generateSeasonSchedule,COMPETITIONS} from '../src/systems/schedule/scheduleSystem.js';
import {PACE_MODES,SPEED_LEVELS,ADVANCE_TARGETS} from '../src/app/config.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const clubs=(await read('data/clubs.json')).clubs,templates=await read('data/legend-templates.json'),achievements=await read('data/achievements.json'),storyChains=await read('data/events/story-chains.json');
const eventFiles=(await fs.readdir(path.join(root,'data','events'))).filter(file=>file.endsWith('.json')&&!['index.json','story-chains.json'].includes(file));
let eventTemplates=0,eventChoices=0,effectiveCombinations=0,weakOutcomes=0;
for(const file of eventFiles){
  const raw=await read(path.join('data','events',file)),events=Array.isArray(raw)?raw:(raw.events||[]);
  for(const event of events){
    if(!event.choices?.length)continue;
    eventTemplates++;assert.ok(event.choices.length>=2&&event.choices.length<=5,`${file}/${event.id} 选择数不在2至5之间`);
    for(const choice of event.choices){
      eventChoices++;const outcomes=choice.outcomes||[];effectiveCombinations+=Math.max(1,outcomes.length);
      for(const outcome of outcomes)if(Object.entries(outcome.effects||{}).filter(([,value])=>Number(value)!==0).length<2)weakOutcomes++;
    }
  }
}
assert.ok(effectiveCombinations>=3000,`有效事件结果组合不足：${effectiveCombinations}`);
assert.equal(weakOutcomes,0,'存在只影响单一系统的事件结果');

assert.ok(clubs.length>=500,`球队数量不足：${clubs.length}`);
const requiredClubFields=['id','cn','en','country','city','leagueCn','level','rep','attack','defense','youth','finance','reputation','fanBase','tactic','youthUsage','recruitment','needs','dataSource'];
for(const club of clubs){for(const field of requiredClubFields)assert.ok(club[field]!==undefined,`${club.id} 缺少 ${field}`);assert.ok(club.dataSource.ratings,'球队模拟评分没有来源标记')}

const repo={clubs,templates,achievements,storyChains,getClub(id){return clubs.find(club=>club.id===id)||clubs[0]},async loadEventCategory(category){return read(path.join('data','events',`${category}.json`))}};
const seed='v18.7-gameplay-depth',talents=createTalentCandidates({seed,position:'CM',style:'全能中场',templates,count:3}),talent=talents[0],academyOffer=generateAcademyOffers({seed,nation:'中国',position:'CM',ovr:65,talent,clubs})[0],club=repo.getClub(academyOffer.clubId);
const save=createNewSave({seed,name:'深度审计球员',displayName:'审计',nation:'中国',age:17,birthDate:'2009-06-15',height:180,weight:72,foot:'右脚',number:8,position:'CM',style:'全能中场',talent,academyOffer,sourceTemplate:templates.find(item=>item.id===talent.sourceTemplateId),paceMode:'fast'},club,'depth');
resolveEventChoice(save,save.career.pending.event.choices[0].id);consumeResolvedEvent(save);
const categories=[];
for(let index=0;index<36;index++){
  const event=await generateEvent(save,repo);categories.push(event.category);
  assert.ok(event.choices.length>=2&&event.choices.length<=5);
  resolveEventChoice(save,event.choices[0].id);consumeResolvedEvent(save);
  if(categories.length>=3)assert.ok(!(categories.at(-1)===categories.at(-2)&&categories.at(-2)===categories.at(-3)),`连续三次出现${categories.at(-1)}事件`);
}
const diagnostics=eventDiagnostics(save);
assert.ok(diagnostics.recentCount<=20&&save.career.eventMemory.recentTags.length<=20&&save.career.eventMemory.recentCategories.length<=20,'事件近期记忆没有限制为20条');
assert.ok(save.career.eventMemory.chainsStarted.length>=1,'开局选择没有启动剧情链');

save.career.squadLevel='一线队';save.career.nationalTeam={calledUp:true};save.career.competitionState={level:Number(club.level||1),continentalQualified:true,history:[]};
const schedule=generateSeasonSchedule(save,repo,{force:true}),opponents=new Set(schedule.fixtures.map(fixture=>fixture.opponentId));
assert.ok(schedule.fixtures.length>=30,`赛季比赛数量不足：${schedule.fixtures.length}`);assert.ok(opponents.size>=15,`单赛季不同对手不足：${opponents.size}`);
assert.deepEqual(Object.keys(COMPETITIONS).sort(),['continental','cup','friendly','league','national','preseason','reserveLeague','youthLeague'].sort());
assert.equal(Object.keys(PACE_MODES).length,4);assert.deepEqual(SPEED_LEVELS.map(item=>item.id),['paused','normal','fast','faster','turbo']);assert.deepEqual(ADVANCE_TARGETS.map(item=>item.id),['nextEvent','nextMatch','week','month','window','season']);

console.log(JSON.stringify({status:'PASS',clubs:clubs.length,countries:new Set(clubs.map(item=>item.country)).size,leagues:new Set(clubs.map(item=>item.leagueId)).size,eventTemplates,eventChoices,effectiveCombinations,generatedEvents:categories.length,recentRepeatRate:diagnostics.recentRepeatRate,storyChainsStarted:save.career.eventMemory.chainsStarted.length,scheduleMatches:schedule.fixtures.length,differentOpponents:opponents.size,competitions:Object.values(COMPETITIONS).map(item=>item.name)},null,2));
