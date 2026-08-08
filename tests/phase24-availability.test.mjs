import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { createInjury, recordInjury } from '../src/core/injuryEngine.js';
import { activeSuspension, matchAvailability, recordMatchCard } from '../src/core/disciplineEngine.js';
import { applyDevelopment } from '../src/core/playerDevelopmentEngine.js';
import { createTrainingOpportunity, resolveTrainingOpportunity, trainingPool } from '../src/core/trainingOpportunities.js';
import { CareerDirector } from '../src/core/simulationController.js';
import { settleSeason } from '../src/systems/honors/honorsSystem.js';

function career() {
  const state = createDefaultState();
  state.player = { name: 'Availability Gate', nation: '中国', club: 'Gate FC', clubId: 'gate-fc', age: 20, position: 'CM', potential: 88, ovr: 74, fitness: 88, fatigue: 18, morale: 72, coachTrust: 68, stats: { speed: 72, shooting: 68, passing: 78, dribbling: 76, defending: 66, physical: 71 } };
  return state;
}

function director(state) { return new CareerDirector({ get: () => state, set: update => update(state) }, { schedule: () => null }); }

test('phase 24 injury changes selection, training, growth and the career record', () => {
  const state = career();
  const injury = createInjury({ type: '腿筋拉伤', severity: 'moderate', date: '2026-08-01' });
  assert.ok(recordInjury(state, injury));
  assert.equal(recordInjury(state, injury), false);
  assert.equal(matchAvailability(state).type, 'injury');
  assert.deepEqual(trainingPool('CM', state).map(plan => plan.id), ['recovery-reset']);
  const opportunity = createTrainingOpportunity(state, { seed: 'injured-training', force: true });
  assert.deepEqual(opportunity.choices.map(plan => plan.id), ['recovery-reset']);
  assert.equal(resolveTrainingOpportunity(state, 'midfield-passing'), null);
  assert.equal(resolveTrainingOpportunity(state, 'recovery-reset').id, 'recovery-reset');

  const healthy = applyDevelopment(state.player, { passing: 1 }, { injured: false, fatigue: 18, facility: 80, coachQuality: 80 });
  const injured = applyDevelopment(state.player, { passing: 1 }, { injured: true, fatigue: 18, facility: 80, coachQuality: 80 });
  assert.ok(healthy.changes.passing > injured.changes.passing);
  assert.equal(state.season.injuries.length, 1);
  assert.equal(state.career.injuryLog.length, 1);
  assert.equal(state.career.history.filter(item => item.type === 'injury').length, 1);

  Object.assign(state.season, { appearances: 20, starts: 18, minutes: 1500, rating: 7.1, injuryAbsences: 2, startOvr: state.player.ovr, startStats: { ...state.player.stats } });
  const review = settleSeason(state).record;
  assert.equal(review.injuries[0].type, '腿筋拉伤');
  assert.equal(review.injuryAbsences, 2);
});

test('phase 24 red card and fifth yellow card each block and consume the next match', () => {
  for (const card of ['red', 'yellow']) {
    const state = career();
    if (card === 'yellow') for (let index = 1; index <= 4; index += 1) {
      recordMatchCard(state, 'yellow', { matchId: `yellow-${index}` });
      assert.equal(activeSuspension(state), null);
    }
    const entry = recordMatchCard(state, card, { matchId: `${card}-trigger` });
    assert.ok(entry.suspensionId);
    assert.equal(matchAvailability(state).type, 'suspension');
    assert.equal(activeSuspension(state).reason, card === 'red' ? 'red-card' : 'yellow-card-accumulation');
    const fixture = { id: `${card}-next-match`, date: '2026-08-08', opponent: 'Next FC', competition: 'League', status: 'upcoming' };
    state.schedule = [fixture];
    assert.equal(director(state).settleAutoMatch(state, fixture), true);
    assert.equal(fixture.unavailable, 'suspension');
    assert.equal(state.season.appearances, 0);
    assert.equal(activeSuspension(state), null);
    assert.equal(state.season.suspensions, 1);
    assert.ok(state.season.highlights.some(item => item.includes('停赛')));
    assert.ok(state.career.history.some(item => item.suspensionId === entry.suspensionId));
  }
});

test('phase 24 serves a suspension before an overlapping injury absence', () => {
  const state = career();
  recordInjury(state, createInjury({ date: '2026-08-01' }));
  recordMatchCard(state, 'red', { matchId: 'overlap-red' });
  assert.equal(matchAvailability(state).type, 'suspension');
  const first = { id: 'overlap-first', date: '2026-08-08', opponent: 'A', competition: 'League', status: 'upcoming' };
  const second = { id: 'overlap-second', date: '2026-08-15', opponent: 'B', competition: 'League', status: 'upcoming' };
  state.schedule = [first, second];
  director(state).settleAutoMatch(state, first);
  assert.equal(first.unavailable, 'suspension');
  assert.equal(matchAvailability(state).type, 'injury');
  director(state).settleAutoMatch(state, second);
  assert.equal(second.unavailable, 'injury');
  assert.equal(state.season.injuryAbsences, 1);
});
