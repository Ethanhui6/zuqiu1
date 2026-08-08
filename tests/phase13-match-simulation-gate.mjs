import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CareerDirector, createRealFixtures, recordMatchResult } from '../src/core/simulationController.js';
import { createDefaultState } from '../src/core/store.js';

const clubs = JSON.parse(fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8')).clubs;
const positions = ['ST', 'CM', 'CB', 'GK'];
const stats = { speed: 72, shooting: 70, passing: 72, dribbling: 70, defending: 68, physical: 70 };
let seasons = 0, totalMatches = 0, autoMatches = 0, interactiveMatches = 0, totalAppearances = 0;
const perSeason = [];

for (let index = 0; index < 100; index += 1) {
  const club = clubs[index % clubs.length];
  const state = createDefaultState();
  state.settings = { ...state.settings, mode: 'standard', autoSkipLow: true, autoPauseCritical: true };
  state.simulation.date = `${2026 + (index % 4)}-07-01`;
  state.season.year = `${2026 + index}/${String(27 + index).padStart(2, '0')}`;
  state.player = { ...state.player, name: `PH13 Player ${index}`, club: club.cn, clubId: club.id, country: club.country, position: positions[index % positions.length], age: 18 + (index % 10), ovr: 70, potential: 88, stats, previousStats: stats, fatigue: 8, fitness: 92, morale: 72, coachTrust: 60 };
  state.schedule = createRealFixtures(state, clubs);
  const store = { get: () => state, set: updater => updater(state) };
  const director = new CareerDirector(store, { schedule: () => null });
  let seasonAuto = 0, seasonInteractive = 0;
  for (const fixture of state.schedule) {
    if (director.shouldAutoSimulateMatch(fixture, state)) {
      assert.equal(director.settleAutoMatch(state, fixture), true);
      seasonAuto += 1;
    } else {
      assert.equal(fixture.important, true, `non-important fixture paused in season ${index}`);
      assert.equal(recordMatchResult(state, fixture, { played: true, starts: true, minutes: 90, rating: 7.2, score: '1-1' }), true);
      seasonInteractive += 1;
    }
  }
  assert.ok(state.season.appearances >= 20 && state.season.appearances <= 55, `season ${index}: ${state.season.appearances} appearances`);
  assert.ok(seasonInteractive >= 1 && seasonInteractive <= 3, `season ${index}: ${seasonInteractive} key matches`);
  assert.equal(state.schedule.every(match => match.status === 'played'), true);
  seasons += 1; totalMatches += state.schedule.length; autoMatches += seasonAuto; interactiveMatches += seasonInteractive; totalAppearances += state.season.appearances;
  perSeason.push({ year: state.season.year, appearances: state.season.appearances, auto: seasonAuto, interactive: seasonInteractive });
}

assert.equal(seasons, 100);
assert.ok(autoMatches > interactiveMatches * 8, `automatic matches ${autoMatches} are not dominant over interactive ${interactiveMatches}`);
assert.ok(interactiveMatches / totalMatches < 0.1, 'interactive matches should remain a small minority');
assert.ok(totalAppearances / seasons >= 20 && totalAppearances / seasons <= 55);
console.log(JSON.stringify({ status: 'PASS', seasons, totalMatches, autoMatches, interactiveMatches, interactiveRate: Number((interactiveMatches / totalMatches).toFixed(3)), averageAppearances: Number((totalAppearances / seasons).toFixed(2)), sample: perSeason.slice(0, 3) }, null, 2));
