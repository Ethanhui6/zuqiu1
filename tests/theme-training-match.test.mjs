import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultState, migrateState } from '../src/core/store.js';
import { MATCH_INTERACTIONS, resolveMatchInteraction } from '../src/core/matchInteractions.js';

test('new saves are light-first while explicit theme choices survive migration', () => {
  assert.equal(createDefaultState().settings.theme, 'light');
  assert.equal(migrateState({}).settings.theme, 'light');
  assert.equal(migrateState({ settings: { theme: 'dark' } }).settings.theme, 'dark');
  assert.equal(migrateState({ settings: { theme: 'system' } }).settings.theme, 'system');
});

test('match interactions are eight deterministic attribute checks', () => {
  assert.equal(MATCH_INTERACTIONS.length, 8);
  const player = { ovr: 60, stats: { shooting: 80, passing: 60, dribbling: 60, defending: 60, physical: 60 } };
  const result = resolveMatchInteraction({ id: 'penalty', player, seed: 0 });
  assert.equal(result.option.name, '点球');
  assert.equal(result.success, true);
  assert.ok(result.score >= 25 && result.score <= 99);
});

test('production pages keep the revised player-facing flow', () => {
  const create = fs.readFileSync(new URL('../src/pages/createPlayer.js', import.meta.url), 'utf8');
  const training = fs.readFileSync(new URL('../src/pages/training.js', import.meta.url), 'utf8');
  const transfer = fs.readFileSync(new URL('../src/pages/transfer.js', import.meta.url), 'utf8');
  const world = fs.readFileSync(new URL('../src/pages/world.js', import.meta.url), 'utf8');
  assert.doesNotMatch(create, /field\('出生日期'/);
  assert.match(create, /age:16/);
  assert.match(create, /generatedBirth/);
  assert.doesNotMatch(training, /data-complete/);
  assert.match(training, /app\.completeTraining\(plan\)/);
  assert.doesNotMatch(transfer, /worldMapView/);
  assert.match(transfer, /data-open-world/);
  assert.match(world, /足球世界/);
});
