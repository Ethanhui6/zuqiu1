import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultState, migrateState } from '../src/core/store.js';
import { createRealFixtures, FICTIONAL_OPPONENTS } from '../src/core/simulationController.js';
import { rerollPlayerDraft, scoutDraft } from '../src/pages/createPlayer.js';
import { evaluateClubFit } from '../src/services/playerIdentity.js';

const clubs = JSON.parse(fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8')).clubs;
const draft = { name:'', shirtName:'', country:'中国', birthplace:'上海', height:178, weight:70, foot:'右脚', number:18, position:'CM', style:'全能中场', secondaryTrait:'稳定发挥', lockName:false, lockCountry:false, previewSeed:'creation-test' };

test('player rerolls replace the whole profile and persist a strict ten-use cap', () => {
  let next = draft;
  const identities = new Set();
  for (let index = 1; index <= 10; index++) {
    next = rerollPlayerDraft(next, index);
    identities.add([next.country,next.position,next.style,next.height,next.weight,next.number,next.foot].join(':'));
  }
  assert.ok(identities.size >= 8);
  const state = createDefaultState();
  state.creation.rerollsUsed = 13;
  assert.equal(migrateState(state).creation.rerollsUsed, 10);
});

test('generated attributes are integers and follow position/body profiles', () => {
  const winger = scoutDraft({ ...draft, position:'LW', style:'速度型边锋', height:168, weight:61, previewSeed:'winger' });
  const centreBack = scoutDraft({ ...draft, position:'CB', style:'出球后卫', height:194, weight:91, previewSeed:'centre-back' });
  assert.ok(Object.values(winger.stats).every(Number.isInteger));
  assert.ok(Object.values(centreBack.stats).every(Number.isInteger));
  assert.ok(winger.stats.speed > winger.stats.physical);
  assert.ok(centreBack.stats.defending > centreBack.stats.speed);
  assert.ok(centreBack.stats.physical > winger.stats.physical);
});

test('fixtures build a full season from real clubs and signing fit has an explicit threshold', () => {
  const state = createDefaultState();
  const current = clubs[0];
  state.player = { name:'测试球员', clubId:current.id, club:current.cn, country:current.country, position:'ST', age:16, ovr:60, potential:84 };
  const fixtures = createRealFixtures(state, clubs);
  assert.ok(fixtures.length >= 34 && fixtures.length <= 55);
  assert.equal(new Set(fixtures.map(item => item.id)).size, fixtures.length);
  assert.ok(fixtures.every(item => clubs.some(club => club.id === item.opponentId)));
  assert.ok(fixtures.every(item => !FICTIONAL_OPPONENTS.has(item.opponent)));
  const fit = evaluateClubFit(state.player, current);
  assert.equal(typeof fit.eligible, 'boolean');
  assert.ok(Number.isFinite(fit.score) && Number.isFinite(fit.required));
});
