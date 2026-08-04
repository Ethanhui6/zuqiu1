import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeSave,repo} from './v19.1-test-fixture.mjs';
import {migrateLegacy} from '../src/services/storage/migrations.js';
import {resolveTraining} from '../src/systems/training/trainingSystem.js';
import {generateMatch,resolveMatch} from '../src/systems/match/matchSystem.js';
import {calculateOvr} from '../src/systems/career/ovr.js';
import {ATTR_KEYS} from '../src/app/config.js';
import {settleDevelopment} from '../src/systems/career/developmentSystem.js';
import {SaveManager} from '../src/services/storage/saveManager.js';
import {radarValues} from '../src/components/radarChart.js';

test('production entry loads only the current application',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(index,/src="\.\/src\/main\.js"/);assert.doesNotMatch(index,/(client\/|legacy\/|src\/app\.js)/);
});

test('legacy growth fields migrate into the current player schema',()=>{
  const save=migrateLegacy({name:'旧球员',age:20,pos:'CM',ovr:70,potential:82,attrs:{speed:71,shooting:62,passing:76,dribbling:74,defending:55,physical:66},clubId:'ajax'});
  assert.deepEqual(save.player.attrs,{pac:71,sho:62,pas:76,dri:74,def:55,phy:66});assert.equal(save.player.position,'CM');assert.ok(save.player.xp&&save.career.weekState);
});

test('training growth is deterministic and updates only the current save model',()=>{
  const a=makeSave({seed:'growth-training'}),b=structuredClone(a),club=repo.getClub(a.career.clubId),before=structuredClone(a.player.xp);
  const resultA=resolveTraining(a,club),resultB=resolveTraining(b,club);
  assert.deepEqual(resultA,resultB);assert.deepEqual(a.player,b.player);assert.ok(resultA.plan.focus.some(key=>a.player.xp[key]>before[key]));
});

test('match settlement uses the modular match system',()=>{
  const save=makeSave({seed:'growth-match'}),match=generateMatch(save,repo),result=resolveMatch(save,repo,match.keyChoices[0]?.id,{presentation:'instant'});
  assert.equal(match.resolved,true);assert.ok(Array.isArray(result.timeline));assert.ok(Array.isArray(result.score)&&result.score.length===2);assert.ok(Number.isFinite(save.player.ovr));
});

test('match XP crosses thresholds and survives save reload as radar input',()=>{
  const save=makeSave({seed:'growth-match-threshold',position:'ST'});
  save.career.squadLevel='一线队';save.status.coachTrust=100;save.player.attrs.pac=50;save.player.xp.pac=64;
  const beforeOvr=save.player.ovr=calculateOvr(save.player.attrs,save.player.position);
  const match=generateMatch(save,repo);match.starts=true;match.substitute=false;
  resolveMatch(save,repo,match.keyChoices[0]?.id,{presentation:'instant'});
  assert.equal(save.player.attrs.pac,51);assert.ok(save.player.xp.pac>=1&&save.player.xp.pac<65);
  assert.equal(save.player.ovr,calculateOvr(save.player.attrs,save.player.position));assert.ok(save.player.ovr>=beforeOvr);
  const values=new Map();globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const manager=new SaveManager();manager.save(save,'slot-growth');const reloaded=manager.load('slot-growth');
  assert.deepEqual(radarValues(reloaded.player.attrs),ATTR_KEYS.map(key=>save.player.attrs[key]));
});

test('large XP awards recalculate each level threshold and carry the remainder',()=>{
  const save=makeSave({seed:'growth-multi-level'});save.player.attrs.pac=50;save.player.xp.pac=0;save.player.potential=90;
  settleDevelopment(save,{pac:200});
  assert.equal(save.player.attrs.pac,52);assert.equal(save.player.xp.pac,65.5);
});

test('active runtime randomness stays deterministic',()=>{
  for(const file of ['../src/main.js','../src/systems/training/trainingSystem.js','../src/systems/match/matchSystem.js','../src/systems/event/eventEngine.js'])assert.doesNotMatch(fs.readFileSync(new URL(file,import.meta.url),'utf8'),/Math\.random/);
});

test('long simulation writes volatile reports only to ignored test results',()=>{
  const source=fs.readFileSync(new URL('./twenty-season-sim.mjs',import.meta.url),'utf8');assert.match(source,/test-results/);assert.doesNotMatch(source,/docs\/V19_20_SEASON_REPORT/);
});
