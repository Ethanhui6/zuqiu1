import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeSave,repo} from './v19.1-test-fixture.mjs';
import {migrateLegacy} from '../src/services/storage/migrations.js';
import {resolveTraining} from '../src/systems/training/trainingSystem.js';
import {generateMatch,resolveMatch} from '../src/systems/match/matchSystem.js';

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

test('active runtime randomness stays deterministic',()=>{
  for(const file of ['../src/main.js','../src/systems/training/trainingSystem.js','../src/systems/match/matchSystem.js','../src/systems/event/eventEngine.js'])assert.doesNotMatch(fs.readFileSync(new URL(file,import.meta.url),'utf8'),/Math\.random/);
});

test('long simulation writes volatile reports only to ignored test results',()=>{
  const source=fs.readFileSync(new URL('./twenty-season-sim.mjs',import.meta.url),'utf8');assert.match(source,/test-results/);assert.doesNotMatch(source,/docs\/V19_20_SEASON_REPORT/);
});
