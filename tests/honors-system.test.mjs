import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureHonors, retireCareer, settleSeason } from '../src/systems/honors/honorsSystem.js';

function state() {
  return { simulation: { date: '2027-06-30' }, player: { name: 'Test Player', club: 'Test FC', clubId: 'test-fc', age: 20 }, season: { year: '2026/27', appearances: 20, goals: 12, assists: 6, rating: 8.1 }, career: { history: [], honors: null } };
}

test('season settlement creates simulated honors and a career record once', () => {
  const save = state();
  const first = settleSeason(save);
  const second = settleSeason(save);
  assert.equal(first.alreadySettled, false);
  assert.ok(first.trophies.length >= 1);
  assert.ok(first.personalAwards.length >= 2);
  assert.equal(second.record, null);
  assert.equal(save.career.honors.seasons.length, 1);
  assert.equal(save.career.honors.trophies[0].dataOrigin, 'generated-fallback');
  assert.equal(save.season.year, '2027/28');
});

test('honors migration and retirement preserve explicit collections', () => {
  const save = state();
  ensureHonors(save).trophies.push({ id: 'kept' });
  const retirement = retireCareer(save);
  assert.equal(save.career.honors.trophies[0].id, 'kept');
  assert.equal(retirement.trophies, 1);
  assert.equal(retireCareer(save), retirement);
});
