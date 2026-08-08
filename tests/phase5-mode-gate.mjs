import test from 'node:test';
import assert from 'node:assert/strict';
import { CareerDirector, recordMatchResult, seasonsPerRound } from '../src/core/simulationController.js';
import { createDefaultState } from '../src/core/store.js';
import { resolveTrainingOpportunity } from '../src/core/trainingOpportunities.js';
import { completeOffSeason, settleSeason } from '../src/systems/honors/honorsSystem.js';

function stateFor(mode) {
  const state = createDefaultState();
  state.settings = { ...state.settings, mode, autoSkipLow: true, autoPauseCritical: true };
  state.player = {
    name: `${mode} player`, club: 'Arsenal', clubId: 'arsenal', country: 'England', league: 'Premier League',
    age: 16, position: 'CM', potential: 86, ovr: 64,
    stats: { speed: 64, shooting: 62, passing: 65, dribbling: 64, defending: 61, physical: 64 },
    previousStats: { speed: 64, shooting: 62, passing: 65, dribbling: 64, defending: 61, physical: 64 },
    fatigue: 8, fitness: 92, morale: 70, coachTrust: 54
  };
  state.season = { ...state.season, startOvr: 64, startMarketValue: state.career.marketValue, startStats: { ...state.player.stats } };
  return state;
}

async function finishOneSeason(mode) {
  const state = stateFor(mode);
  const store = { get: () => state, set: update => update(state) };
  const director = new CareerDirector(store, { schedule: () => null });
  let result;
  for (let guard = 0; guard < 80; guard += 1) {
    result = await director.advance('seasonEnd');
    if (result.stopReason === 'training') {
      assert.ok(resolveTrainingOpportunity(state, state.training.currentOpportunity.choices[0].id));
      continue;
    }
    if (result.stopReason === 'match') {
      assert.ok(result.match);
      assert.ok(recordMatchResult(state, result.match, { played: true, starts: true, minutes: 90, rating: 7.2, score: '1-0' }));
      continue;
    }
    assert.equal(result.stopReason, 'target');
    break;
  }
  assert.equal(result.stopReason, 'target', `${mode} must reach the season target`);
  const review = settleSeason(state);
  assert.equal(review.alreadySettled, false);
  assert.equal(completeOffSeason(state), true);
  return { state, review };
}

test('PH5 completes one independently settled season in all three player modes', async () => {
  for (const mode of ['immersive', 'standard', 'fast']) {
    const { state, review } = await finishOneSeason(mode);
    assert.equal(seasonsPerRound(mode), { immersive: 1, standard: 2, fast: 3 }[mode]);
    assert.equal(state.career.honors.seasons.length, 1);
    assert.equal(review.record.year, '2026/27');
    assert.equal(state.player.age, 17);
    assert.equal(state.season.progress, 0);
    assert.ok(state.schedule.length >= 34);
  }
});
