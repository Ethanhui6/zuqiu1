import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EventEngine } from '../src/core/eventEngine.js';
import { createDefaultState } from '../src/core/store.js';

const events=JSON.parse(fs.readFileSync(new URL('../data/events/career-events.json',import.meta.url),'utf8'));
const requiredCategories=['coach','teammate','agent','transfer','contract','family','friends','fans','media','network','business','sponsor','training','injury','recovery','discipline','national','award','life','offseason','retirement'];
const positionGroups={GK:['GK'],CB:['CB'],FB:['LB','RB'],CDM:['CDM'],CM:['CM'],CAM:['CAM'],WING:['LW','RW'],ST:['ST']};
const grams=value=>{const text=String(value).replace(/[\s\p{P}\p{S}]/gu,'');const output=new Set();for(let index=0;index<text.length-2;index++)output.add(text.slice(index,index+3));return output};
const similarity=(left,right)=>{let common=0;for(const value of left)if(right.has(value))common++;return common/(left.size+right.size-common||1)};

test('phase 12 ships 500 distinct, playable career events instead of metadata-only counts',()=>{
  assert.ok(events.length>=500);
  assert.equal(new Set(events.map(event=>event.id)).size,events.length);
  assert.equal(new Set(events.map(event=>event.title)).size,events.length);
  for(const category of requiredCategories)assert.ok(events.filter(event=>event.categoryId===category).length>=20,`${category} coverage`);

  const titles=events.map(event=>grams(event.title));let similarPairs=0;
  for(let left=0;left<titles.length;left++)for(let right=left+1;right<titles.length;right++)if(similarity(titles[left],titles[right])>=.72)similarPairs++;
  assert.equal(similarPairs,0,'near-duplicate event titles are not allowed');

  const choices=events.flatMap(event=>event.choices),results=choices.flatMap(choice=>[choice.successText,choice.failureText]);
  assert.ok(events.every(event=>event.trigger&&event.conflict&&event.location&&event.participants?.length&&event.observations?.length));
  assert.ok(events.every(event=>event.conditions&&Number.isFinite(event.conditions.minAge)&&Number.isFinite(event.conditions.maxAge)&&Number.isFinite(event.conditions.minOvr)));
  assert.ok(events.every(event=>event.choices?.length===3&&event.choices.every(choice=>choice.id&&choice.label&&choice.hint&&choice.successText&&choice.failureText&&Object.keys(choice.effects||{}).length)));
  assert.equal(new Set(choices.map(choice=>choice.label)).size,choices.length,'exact choice text repetition is not allowed');
  assert.equal(new Set(results).size,results.length,'exact result text repetition is not allowed');
});

test('phase 12 position events obey position and trigger conditions',()=>{
  const engine=new EventEngine(events);
  for(const[group,positions]of Object.entries(positionGroups)){
    const templates=events.filter(event=>event.id.startsWith(`career-position-${group.toLowerCase()}-`));
    assert.equal(templates.length,8,`${group} event distribution`);
    for(const position of positions){
      const state=createDefaultState();state.player={...state.player,age:25,ovr:90,position};state.simulation.date='2026-09-01';
      assert.ok(templates.every(template=>engine.eligible(state,template)),`${position} must receive its own events`);
      const other=events.find(event=>event.positions?.length&&!event.positions.includes(position));
      assert.equal(engine.eligible(state,other),false,`${position} must reject another position's event`);
      const scheduled=engine.schedule(state,{forceTemplate:templates[0]});assert.ok(scheduled);const result=engine.resolve(state,scheduled.id,scheduled.choices[0].id);
      assert.ok(result.resultText);assert.equal(state.events.pending.length,0);assert.equal(state.events.history.length,1);
    }
  }
  const state=createDefaultState(),conditioned=events.find(event=>event.conditions.minAge>16||event.conditions.minOvr>48);
  state.player={...state.player,age:16,ovr:1,position:'CM'};assert.equal(engine.eligible(state,conditioned),false);
});

test('phase 12 production bootstrap keeps CareerDirector and EventEngine on the same instance',()=>{
  const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(app,/app\.events\.templates=dataRepository\.careerEvents/);
  assert.doesNotMatch(app,/app\.events=new EventEngine\(dataRepository\.careerEvents/);
});
