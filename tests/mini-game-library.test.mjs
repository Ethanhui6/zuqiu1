import test from 'node:test';
import assert from 'node:assert/strict';
import { MINI_GAME_COUNT, MINI_GAME_LIBRARY, createMiniGameContext, miniGameForInteraction } from '../src/core/miniGameLibrary.js';

test('mini game library exposes 30+ real renderer-backed mechanisms', () => {
  assert.ok(MINI_GAME_COUNT >= 30);
  assert.equal(new Set(MINI_GAME_LIBRARY.map(item => item.id)).size, MINI_GAME_COUNT);
  assert.ok(MINI_GAME_LIBRARY.every(item => item.input && item.stat && ['trainingGame', 'interactiveMatch'].includes(item.renderer)));
  assert.ok(new Set(MINI_GAME_LIBRARY.map(item => item.input)).size >= 10);
  for (const position of ['ST', 'LW', 'CM', 'CB', 'GK']) assert.ok(MINI_GAME_LIBRARY.some(item => item.positions.includes(position)));
});

test('mini game difficulty uses skill, opponent, fatigue, pressure, importance and position fit', () => {
  const calm = createMiniGameContext({ gameId: 'shooting', player: { position: 'ST', ovr: 80, stats: { shooting: 85 }, fatigue: 10 }, opponent: { defense: 55 }, match: { pressure: 35, importanceValue: 25 } });
  const hard = createMiniGameContext({ gameId: 'shooting', player: { position: 'CB', ovr: 55, stats: { shooting: 45 }, fatigue: 80 }, opponent: { defense: 85 }, match: { pressure: 90, importanceValue: 90 } });
  assert.ok(calm.difficulty < hard.difficulty);
  assert.equal(miniGameForInteraction('goalkeeper-save').id, 'direction');
  assert.ok(miniGameForInteraction('stoppage-decision').positions.includes('GK'));
});
