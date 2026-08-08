import test from 'node:test';
import assert from 'node:assert/strict';
import { SimulationController } from '../src/core/simulationController.js';
import { createDefaultState } from '../src/core/store.js';
import { resolveTrainingOpportunity } from '../src/core/trainingOpportunities.js';
import { completeOffSeason, resolveOffSeasonActivity, settleSeason } from '../src/systems/honors/honorsSystem.js';

function replayState() {
  const state = createDefaultState();
  state.settings = { ...state.settings, mode: 'fast', autoSkipLow: true, autoPauseCritical: true };
  state.schedule = [];
  state.player = {
    name: 'Replay Player', club: 'Replay FC', clubId: 'replay-fc', age: 16, position: 'CM', potential: 88, ovr: 62,
    stats: { speed: 62, shooting: 55, passing: 68, dribbling: 64, defending: 55, physical: 60 },
    previousStats: { speed: 62, shooting: 55, passing: 68, dribbling: 64, defending: 55, physical: 60 },
    fatigue: 12, fitness: 86, morale: 70, coachTrust: 52
  };
  state.season = { ...state.season, startOvr: 62, startMarketValue: state.career.marketValue, startStats: { ...state.player.stats } };
  return state;
}

test('phase 0 replay records three seasons of actions, age nodes, and blockers', async () => {
  const state = replayState();
  const store = { get: () => state, set: updater => updater(state) };
  const controller = new SimulationController(store, { schedule: () => null });
  const report = { advanceActions: 0, trainingChoices: 0, offSeasonActivities: 0, offSeasonCompletions: 0, seasons: [] };

  for (let index = 0; index < 3; index++) {
    const blockers = [];
    const season = state.season.year;
    const ageBefore = state.player.age;
    let settled = false;
    while (!settled) {
      const result = await controller.advance('seasonEnd');
      report.advanceActions++;
      blockers.push(result.stopReason);
      if (result.stopReason === 'training') {
        const plan = state.training.currentOpportunity?.choices?.[0];
        assert.ok(plan, 'training blocker must expose a selectable plan');
        resolveTrainingOpportunity(state, plan.id);
        report.trainingChoices++;
        continue;
      }
      assert.equal(result.stopReason, 'target');
      const review = settleSeason(state);
      assert.equal(review.alreadySettled, false);
      const activity = state.career.offSeason.activities[0];
      assert.ok(resolveOffSeasonActivity(state, activity.id));
      report.offSeasonActivities++;
      assert.equal(completeOffSeason(state), true);
      report.offSeasonCompletions++;
      report.seasons.push({ season, ageBefore, ageAfter: state.player.age, blockers });
      settled = true;
    }
  }

  assert.deepEqual(report.seasons.map(item => item.ageAfter), [17, 18, 19]);
  assert.ok(report.seasons.every(item => item.blockers.at(-1) === 'target'));
  assert.ok(report.seasons.every(item => item.blockers.filter(reason => reason === 'training').length === 1));
  assert.deepEqual({ ...report, seasons: report.seasons.map(item => item.blockers) }, {
    advanceActions: 6,
    trainingChoices: 3,
    offSeasonActivities: 3,
    offSeasonCompletions: 3,
    seasons: [['training', 'target'], ['training', 'target'], ['training', 'target']]
  });
});
