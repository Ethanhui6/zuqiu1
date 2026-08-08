import test from 'node:test';
import assert from 'node:assert/strict';
import { trophyAsset } from '../src/components/trophyIcon.js';
import { settleSeason } from '../src/systems/honors/honorsSystem.js';

function state(position, overrides = {}) {
  return {
    simulation: { date: '2030-06-30' },
    player: { club: 'Audit FC', clubId: 'audit-fc', age: 20, position, ...overrides.player },
    season: { year: '2029/30', appearances: 25, goals: 16, assists: 12, cleanSheets: 15, rating: 8.5, ...overrides.season },
    career: { history: [], honors: null, ...overrides.career }
  };
}

test('phase 22 position and global awards are obtainable with independent assets', () => {
  const scenarios = [state('GK'), state('CB'), state('CM'), state('ST')];
  const awards = scenarios.flatMap(item => settleSeason(item).personalAwards);
  const ids = new Set(awards.map(award => award.assetId));
  for (const expected of ['best-keeper', 'best-defender', 'best-midfielder', 'best-forward', 'best-xi', 'golden-boy', 'ballon', 'world-player']) assert.ok(ids.has(expected), expected);
  for (const id of ids) assert.ok(trophyAsset(id), id);
});

test('phase 22 World Cup personal awards are obtainable and independently rendered', () => {
  const settled = settleSeason(state('ST', { season: { competitionId: 'world-cup', goals: 8 } }));
  const ids = settled.personalAwards.map(award => award.assetId);
  for (const expected of ['world-cup-golden-ball', 'world-cup-golden-boot', 'world-cup-best-young']) assert.ok(ids.includes(expected), expected);
  assert.equal(new Set(ids.map(id => trophyAsset(id))).size, ids.length);
});

test('phase 22 uses the canonical assists-king key', () => {
  assert.ok(trophyAsset('assists-king'));
  assert.equal(trophyAsset('assist-king'), null);
});
