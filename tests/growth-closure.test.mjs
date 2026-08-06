import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyGrowthToState, computeOverall } from '../src/core/playerDevelopmentEngine.js';
import { createDefaultState, migrateState, Store } from '../src/core/store.js';
import { SimulationController } from '../src/core/simulationController.js';
import { radarChart } from '../src/components/radar.js';
import { trainingPreview } from '../src/pages/training.js';
import { createInjury } from '../src/core/injuryEngine.js';
import { keyedRandom } from '../src/services/rng.js';

const player={name:'test',position:'中场',age:18,potential:88,ovr:60,stats:{speed:60,shooting:56,passing:64,dribbling:63,defending:48,physical:55}};

test('production entry loads only the current application',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(index,/src="\.\/src\/app\.js"/);
  assert.doesNotMatch(index,/(client\/|legacy\/|src\/main\.js)/);
});

test('state migration normalizes player and required collections',()=>{
  const state=migrateState({player:{position:'中场',stats:{speed:'70',passing:80}},career:{growthLog:null},schedule:null});
  assert.deepEqual(Object.keys(state.player.stats),['speed','shooting','passing','dribbling','defending','physical']);
  assert.equal(state.player.ovr,computeOverall(state.player.stats,'中场'));
  assert.deepEqual(state.player.previousStats,state.player.stats);
  assert.deepEqual(state.schedule,[]);assert.deepEqual(state.career.growthLog,[]);
});

test('invalid imported JSON never replaces current state',()=>{
  globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
  const store=new Store(),before=store.get();assert.throws(()=>store.import('{bad json'));assert.equal(store.get(),before);
});

test('growth helper updates snapshot potential and log once',()=>{
  const state=createDefaultState();state.player=structuredClone(player);
  const out=applyGrowthToState(state,{passing:1,potential:.2},{source:'test growth'});
  assert.equal(state.player.previousStats.passing,64);assert.ok(state.player.stats.passing>64);
  assert.equal(state.player.potential,88.2);assert.equal(state.career.growthLog.length,1);assert.equal(out.player,state.player);
});

test('training and match route through one growth transaction each',()=>{
  const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const training=app.slice(app.indexOf('completeTraining('),app.indexOf('playMatch('));
  const match=app.slice(app.indexOf('playMatch('),app.indexOf('openInjuryCenter('));
  for(const method of [training,match]){
    assert.equal((method.match(/applyGrowthToState\(/g)||[]).length,1);
    assert.doesNotMatch(method,/applyDevelopment\(|growthLog\.push|previousStats\s*=/);
  }
});

test('simulation has season-relative week keys and exposes a match due today',async()=>{
  const state=createDefaultState();state.simulation.date='2027-06-29';state.schedule=[{id:'today',date:'2027-06-29',status:'upcoming'}];
  const store={get:()=>state,set:fn=>fn(state)};const controller=new SimulationController(store,{schedule:()=>null});
  const due=await controller.advance('nextMatch');assert.equal(due.match.id,'today');assert.equal(due.processed,0);
  state.schedule=[];await controller.advance('week');assert.ok(state.season.week>=1&&state.season.week<53);
  assert.ok(state.simulation.processedKeys.every(key=>!key.startsWith('micro:')||key.split(':').length===3));
});

test('radar and training preview use finite bounded calculated values',()=>{
  assert.doesNotMatch(radarChart({speed:Infinity,shooting:-5,passing:150},{speed:NaN},Infinity),/NaN|Infinity/);
  const preview=trainingPreview({gains:{passing:1},fatigue:5,risk:3},player,{injuries:[]});
  assert.ok(Number.isFinite(preview.changes.passing)&&preview.changes.passing>0&&preview.changes.passing!==1);
});

test('fast mode auto-settles ordinary fixtures into the career record',async()=>{
  const state=createDefaultState();state.settings.mode='fast';state.player=structuredClone(player);state.simulation.date='2026-07-05';
  const store={get:()=>state,set:fn=>fn(state)};const controller=new SimulationController(store,{schedule:()=>null});
  const result=await controller.advance('nextMatch');
  assert.equal(result.autoMatches,1);
  assert.equal(state.schedule[0].status,'played');
  assert.equal(state.schedule[0].auto,true);
  assert.equal(state.career.history.at(-1).auto,true);
  assert.ok(state.season.appearances>=0&&state.season.goals>=0&&state.season.assists>=0);
});

test('active injury and app randomness is deterministic and contains no Math.random',()=>{
  const a=createInjury({date:'2026-07-01',rng:keyedRandom('injury')});
  const b=createInjury({date:'2026-07-01',rng:keyedRandom('injury')});
  assert.deepEqual(a,b);
  for(const file of ['../src/app.js','../src/core/injuryEngine.js'])assert.doesNotMatch(fs.readFileSync(new URL(file,import.meta.url),'utf8'),/Math\.random/);
});

test('long simulation writes volatile reports only to ignored test results',()=>{
  const source=fs.readFileSync(new URL('./twenty-season-sim.mjs',import.meta.url),'utf8');
  assert.match(source,/test-results/);assert.doesNotMatch(source,/docs\/V19_20_SEASON_REPORT/);
});
