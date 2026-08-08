import test from 'node:test';
import assert from 'node:assert/strict';
import { completeOffSeason, resolveOffSeasonActivity, settleSeason, seasonReviewNext } from '../src/systems/honors/honorsSystem.js';
import { SimulationController } from '../src/core/simulationController.js';
import { migrateState } from '../src/core/store.js';

function state() {
  return { simulation: { date: '2027-06-30' }, settings: { mode: 'fast' }, player: { name: 'Test Player', club: 'Test FC', clubId: 'test-fc', age: 20, position: 'RW', potential: 88, ovr: 74, stats: { speed: 80, shooting: 74, passing: 73, dribbling: 79, defending: 48, physical: 68 } }, season: { year: '2026/27', appearances: 25, goals: 12, assists: 8, rating: 7.8, startOvr: 70, startMarketValue: 900000, startStats: { speed: 75, shooting: 70, passing: 69, dribbling: 74, defending: 47, physical: 66 } }, career: { marketValue: 1500000, contractMonths: 24, history: [], honors: null }, training: {}, transfer: { offers: [] }, ui: {} };
}

test('season settlement records radar snapshots, rolls date forward, and gives a next step', () => {
  const save = state();
  const settled = settleSeason(save);
  assert.deepEqual(settled.record.startStats, { speed: 75, shooting: 70, passing: 69, dribbling: 74, defending: 47, physical: 66 });
  assert.ok(settled.record.endStats.speed > 80);
  assert.deepEqual(settled.record.endStats, save.player.stats);
  assert.equal(settled.record.endOvr, save.player.ovr);
  assert.equal(settled.record.endOvr, save.season.startOvr);
  assert.equal(settled.record.ovrChange, Number((settled.record.endOvr - settled.record.startOvr).toFixed(2)));
  assert.equal(save.simulation.date, '2027-07-01');
  assert.equal(save.season.year, '2027/28');
  assert.equal(save.player.age, 21);
  assert.equal(save.season.startStats.passing, save.player.stats.passing);
  assert.equal(seasonReviewNext(save).type, 'off-season');
  const controller = new SimulationController({ get: () => save, set: update => update(save) }, { schedule: () => null });
  assert.equal(controller.nextNode(save).type, 'off-season');
  save.player.fatigue = 90;
  save.player.fitness = 30;
  const activity = resolveOffSeasonActivity(save, 'recovery');
  assert.equal(activity.id, 'recovery');
  assert.ok(save.player.fatigue < 90);
  assert.equal(completeOffSeason(save), true);
  assert.equal(seasonReviewNext(save).type, 'next-season');
  save.career.contractMonths = 0;
  assert.equal(seasonReviewNext(save).type, 'contract');
});

test('fast mode directs ordinary fixtures to a season-level simulation', () => {
  const save = state();
  save.schedule = [{ id: 'ordinary', date: '2027-07-08', status: 'upcoming', important: false }];
  const controller = new SimulationController({ get: () => save, set: update => update(save) }, { schedule: () => null });
  assert.equal(controller.nextNode(save).action, 'seasonEnd');
});

test('existing saves receive a season-start snapshot before their first review', () => {
  const migrated = migrateState({ player: { position: 'RW', stats: { speed: 80, shooting: 70, passing: 72, dribbling: 78, defending: 45, physical: 68 } } });
  assert.equal(migrated.season.startStats.dribbling, 78);
});
