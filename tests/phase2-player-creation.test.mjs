import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultState, migrateState } from '../src/core/store.js';
import { CREATION_PACE_OPTIONS, CREATION_STEPS, playerStylesForPosition } from '../src/pages/createPlayer.js';

const source = fs.readFileSync(new URL('../src/pages/createPlayer.js', import.meta.url), 'utf8');

test('PH2 keeps the five-step creation contract and the three legacy pace choices', () => {
  assert.deepEqual(CREATION_STEPS, ['职业速度', '身份', '身体 / 位置 / 风格', '球员数据', '球队邀请']);
  assert.deepEqual(CREATION_PACE_OPTIONS, ['immersive', 'standard', 'fast']);
  assert.match(source, /data-pace/);
  assert.match(source, /data-height-range/);
  assert.match(source, /适配度/);
  assert.match(source, /发展路线/);
  assert.match(source, /data-reroll/);
  assert.match(source, /wizardDraft/);
});

test('PH2 exposes position-aware style and body controls without losing old saves', () => {
  for (const position of ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK']) {
    assert.ok(playerStylesForPosition(position).length > 0, `${position} should keep a valid style pool`);
  }
  const old = createDefaultState();
  old.creation = { rerollsUsed: 4, seed: 'old-creation' };
  const migrated = migrateState(old);
  assert.equal(migrated.creation.rerollsUsed, 4);
  assert.equal(migrated.creation.wizardStep, 0);
  assert.equal(migrated.creation.wizardDraft, null);
  const resumed = migrateState({ ...old, creation: { wizardStep: 3, wizardDraft: { paceMode: 'fast', position: 'GK', height: 190 } } });
  assert.equal(resumed.creation.wizardStep, 3);
  assert.equal(resumed.creation.wizardDraft.position, 'GK');
});
