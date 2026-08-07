import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { settleSeason } from '../src/systems/honors/honorsSystem.js';

function fiveSeasonOverall(potential) {
  const state = createDefaultState();
  state.player = { name: `Prospect ${potential}`, club: 'Academy FC', clubId: `academy-${potential}`, position: 'CM', age: 16, potential, stats: { speed: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 } };
  for (let season = 0; season < 5; season++) {
    Object.assign(state.season, { appearances: 20, goals: 6, assists: 6, rating: 7.2 });
    settleSeason(state);
  }
  return state.player.ovr;
}

test('phase 10 differentiates 100 sixteen-year-old prospects across five seasons', () => {
  const overalls = Array.from({ length: 100 }, (_, index) => fiveSeasonOverall(60 + index % 40));
  const spread = Math.max(...overalls) - Math.min(...overalls);
  assert.ok(Math.min(...overalls) > 60);
  assert.ok(spread >= 10, `expected at least 10 OVR spread, got ${spread}`);
  assert.ok(new Set(overalls).size >= 10);
});
