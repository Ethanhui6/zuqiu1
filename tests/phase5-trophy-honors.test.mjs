import test from 'node:test';
import assert from 'node:assert/strict';
import { settleSeason } from '../src/systems/honors/honorsSystem.js';

test('phase 5: simulated season honors retain distinct award asset IDs', () => {
  const state = {
    simulation: { date: '2027-06-30' },
    player: { club: 'Test FC', clubId: 'test-fc', age: 20 },
    season: { year: '2026/27', appearances: 20, goals: 12, assists: 8, rating: 8.1 },
    career: { history: [], honors: null }
  };
  const settled = settleSeason(state);
  assert.deepEqual(
    [...settled.trophies, ...settled.personalAwards].map(honor => honor.assetId).sort(),
    ['domestic-cup', 'golden-boot', 'league-title', 'player-of-season', 'young-player']
  );
});
