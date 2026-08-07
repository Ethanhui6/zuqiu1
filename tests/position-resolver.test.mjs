import test from 'node:test';
import assert from 'node:assert/strict';
import { PositionResolver, getPositionProfile, normalizePosition } from '../src/core/positionResolver.js';
import { resolveMatchInteraction } from '../src/core/interactiveMatchEngine.js';

test('position resolver normalizes aliases without losing role-specific pools', () => {
  const resolver = new PositionResolver();
  assert.equal(resolver.resolve('左翼卫'), 'LB');
  assert.equal(normalizePosition('影锋'), 'ST');
  assert.equal(getPositionProfile('门将').group, 'keeper');
  assert.ok(getPositionProfile('门将').interactions.includes('goalkeeper-save'));
});

test('off-position interaction is explicitly harder while manual score stays deterministic', () => {
  const player = { position: 'ST', ovr: 70, stats: { shooting: 72 } };
  const natural = resolveMatchInteraction({ id: 'shooting', player, seed: 12 });
  const outOfPosition = resolveMatchInteraction({ id: 'shooting', player: { ...player, position: 'CB' }, seed: 12 });
  assert.equal(natural.score, outOfPosition.score);
  assert.equal(natural.positionFit, 1);
  assert.equal(outOfPosition.positionFit, .65);
  assert.ok(outOfPosition.target > natural.target);
});
