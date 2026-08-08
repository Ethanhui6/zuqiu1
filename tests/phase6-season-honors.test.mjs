import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureSeasonObjectives } from '../src/systems/honors/honorsSystem.js';
import { settleSeason } from '../src/systems/honors/honorsSystem.js';

function makeState(position = 'ST') {
  return {
    simulation: { date: '2027-06-30' }, player: { name: 'Honor Player', club: 'Test FC', clubId: 'test-fc', league: 'Premier League', age: 20, position, ovr: 78, stats: { speed: 78, shooting: 78, passing: 78, dribbling: 78, defending: 78, physical: 78 } },
    season: { year: '2026/27', appearances: 20, starts: 16, minutes: 1500, goals: 12, assists: 10, rating: 8.1, cleanSheets: position === 'GK' ? 12 : 0, trophies: [], personalAwards: [] },
    injuries: [], career: { marketValue: 1000000, weeklySalary: 4000, contractMonths: 24, history: [], honors: null }, relationships: { coach: 60 }, training: {}, schedule: []
  };
}

test('PH6 creates position-aware objectives and settles wins, misses, and achievements independently', () => {
  const state = makeState('GK');
  const objectives = ensureSeasonObjectives(state);
  assert.equal(objectives.length, 4);
  assert.equal(objectives.find(item => item.group === 'personal').metric, 'cleanSheets');
  const settled = settleSeason(state);
  assert.equal(settled.alreadySettled, false);
  assert.ok(settled.trophies.length >= 1);
  assert.ok(settled.personalAwards.some(item => item.assetId === 'best-keeper'));
  assert.ok(settled.record.objectiveResults.some(item => item.status === 'complete'));
  assert.ok(settled.record.newAchievements.some(item => item.id === 'debut'));
  assert.ok(settled.record.newAchievements.some(item => item.id === 'season-10-goals'));
  assert.ok(state.season.objectives.every(item => item.status === 'active'));
});

test('PH6 does not fabricate honors and does not repeat one-time achievements', () => {
  const missedState = makeState('ST');
  missedState.season = { ...missedState.season, appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, rating: 0, cleanSheets: 0 };
  const missed = settleSeason(missedState);
  assert.deepEqual(missed.trophies, []);
  assert.deepEqual(missed.personalAwards, []);
  assert.ok(missed.record.missedObjectives.length >= 3);

  const state = makeState('ST');
  const first = settleSeason(state);
  assert.ok(first.record.newAchievements.some(item => item.id === 'debut'));
  state.simulation.date = '2028-06-30';
  state.season = { ...state.season, appearances: 20, starts: 16, minutes: 1500, goals: 12, assists: 10, rating: 8.1, cleanSheets: 0 };
  const second = settleSeason(state);
  assert.equal(second.record.newAchievements.some(item => item.id === 'debut'), false);
  assert.equal(second.personalAwards.some(item => item.assetId === 'golden-boy'), false);
  assert.equal(state.career.honors.achievements.find(item => item.id === 'debut').count, 1);
});
