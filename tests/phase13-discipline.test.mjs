import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { createMatchState, advanceMatchState } from '../src/core/matchState.js';
import { matchAvailability, recordMatchCard } from '../src/core/disciplineEngine.js';
import { CareerDirector } from '../src/core/simulationController.js';

test('phase 13 records cards and keeps a red-carded player out of the next match', () => {
  const state = createDefaultState();
  state.player = { name: 'Disciplined Player', club: 'Test FC', position: 'CB', ovr: 70, stats: { speed: 70, shooting: 50, passing: 65, dribbling: 60, defending: 76, physical: 75 } };
  const live = advanceMatchState(createMatchState({ player: state.player }), { id: 'late-tackle', interactionId: 'tackle', title: 'Late tackle' }, { score: 10, success: false });
  assert.equal(live.cards.red, 1);
  recordMatchCard(state, 'yellow', { matchId: 'first-match' });
  recordMatchCard(state, 'red', { matchId: 'red-card-match' });
  assert.equal(state.season.yellowCards, 1);
  assert.equal(state.season.redCards, 1);
  assert.equal(matchAvailability(state).type, 'suspension');

  const fixture = { id: 'next-match', date: '2026-07-08', opponent: 'Next FC', competition: 'League', status: 'upcoming' };
  state.schedule = [fixture];
  const director = new CareerDirector({ get: () => state, set: update => update(state) }, { schedule: () => null });
  assert.equal(director.settleAutoMatch(state, fixture), true);
  assert.equal(fixture.status, 'played');
  assert.equal(fixture.unavailable, 'suspension');
  assert.equal(state.season.appearances, 0);
  assert.equal(state.discipline.suspensions[0].status, 'served');
});
