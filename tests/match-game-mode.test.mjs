import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMatchState, advanceMatchState } from '../src/core/matchState.js';
import { HighlightDirector } from '../src/core/highlightDirector.js';
import { createMiniGameContext } from '../src/core/miniGameLibrary.js';

const player = { position: 'ST', ovr: 68, fitness: 82, morale: 70 };

test('match state is serializable and starts with bounded live values', () => {
  const state = createMatchState({ match: { id: 'm1', competition: '联赛', opponent: '北城', venue: '主场' }, player, seed: 42 });
  assert.deepEqual(state.score, { home: 0, away: 0 });
  assert.equal(state.player.position, 'ST');
  assert.equal(state.matchMinute, 0);
  assert.ok(state.pressure >= 20 && state.pressure <= 90);
  assert.doesNotThrow(() => JSON.stringify(state));
});
test('highlight director is deterministic, position-aware, and avoids immediate repetition', () => {
  const state = createMatchState({ player, seed: 77 });
  const firstDirector = new HighlightDirector({ seed: 77 });
  const secondDirector = new HighlightDirector({ seed: 77 });
  const first = firstDirector.next(state);
  assert.deepEqual(first, secondDirector.next(state));
  assert.ok(first.positions.includes('ST'));
  const nextState = advanceMatchState(state, first, { score: 86, success: true });
  const second = firstDirector.next(nextState);
  assert.notEqual(second.id, first.id);
  assert.ok(second.minute > first.minute);
});

test('match mini game context carries a bounded difficulty into the live state', () => {
  const context = createMiniGameContext({ gameId: 'shooting', player, opponent: { defense: 72 }, match: { pressure: 68, importanceValue: 70 } });
  const state = createMatchState({ player, seed: 8 });
  state.miniGame = { id: context.game.id, difficulty: context.difficulty };
  assert.equal(state.miniGame.id, 'moving-target');
  assert.ok(state.miniGame.difficulty >= 10 && state.miniGame.difficulty <= 90);
});

test('match center exposes one direct game-mode action', () => {
  const page = fs.readFileSync(new URL('../src/pages/match.js', import.meta.url), 'utf8');
  const game = fs.readFileSync(new URL('../src/components/interactiveMatch.js', import.meta.url), 'utf8');
  assert.match(page, /data-play/);
  assert.doesNotMatch(page, /data-tactic|data-match-interaction/);
  assert.match(game, /data-mini-pitch-host/);
  assert.match(game, /matchState/);
});
