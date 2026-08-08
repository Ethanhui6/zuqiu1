import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CareerDirector, createRealFixtures, recordMatchResult } from '../src/core/simulationController.js';
import { createDefaultState } from '../src/core/store.js';

const world = JSON.parse(fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8'));
const clubs = world.clubs || world;
const leagueClubs = clubs.filter(club => club.leagueId === 'ENG2');

function stateFor(club = leagueClubs[0]) {
  const state = createDefaultState();
  state.settings.mode = 'standard';
  state.player = { name: 'Match Player', club: club.cn || club.name, clubId: club.id, position: 'CM', age: 18, ovr: 68, potential: 84, fitness: 90, morale: 70, stats: { speed: 68, shooting: 68, passing: 68, dribbling: 68, defending: 68, physical: 68 }, previousStats: { speed: 68, shooting: 68, passing: 68, dribbling: 68, defending: 68, physical: 68 } };
  state.schedule = createRealFixtures(state, leagueClubs);
  return state;
}

test('PH7 generates a complete home-and-away league core plus cup fixtures', () => {
  const state = stateFor();
  const leagueMatches = state.schedule.filter(match => match.competitionType === 'league');
  const opponents = new Set(leagueMatches.map(match => match.opponentId));
  assert.ok(leagueMatches.length >= 34);
  for (const opponentId of opponents) {
    const pair = leagueMatches.filter(match => match.opponentId === opponentId);
    assert.equal(pair.length, 2, `league opponent ${opponentId} must appear home and away`);
    assert.deepEqual(new Set(pair.map(match => match.home)), new Set([true, false]));
  }
  assert.ok(state.schedule.some(match => match.competitionType === 'domestic-cup'));
  assert.ok(state.schedule.some(match => match.competitionType === 'continental'));
});

test('PH7 separates starter, substitute appearance, substitute benching, and unavailable auto-settlement', () => {
  const state = stateFor();
  const store = { get: () => state, set: update => update(state) };
  const director = new CareerDirector(store, { schedule: () => null });
  const fixture = state.schedule[0];
  assert.equal(recordMatchResult(state, fixture, { played: true, starts: false, minutes: 24, rating: 6.9, score: '1-1' }), true);
  assert.equal(state.season.appearances, 1);
  assert.equal(state.season.starts, 0);
  const benchFixture = state.schedule[1];
  assert.equal(recordMatchResult(state, benchFixture, { played: false, unavailable: 'bench', score: '0-0' }), true);
  assert.equal(state.season.appearances, 1);
  state.player.ovr = 35;
  const unavailableFixture = state.schedule[2];
  assert.equal(director.shouldAutoSimulateMatch(unavailableFixture, state), true);
  assert.equal(director.settleAutoMatch(state, unavailableFixture), true);
  assert.equal(state.season.appearances, 1);
  assert.equal(unavailableFixture.playerStats.played, false);
  assert.equal(unavailableFixture.unavailable, 'selection');
});
