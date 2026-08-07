import test from 'node:test';
import assert from 'node:assert/strict';
import { MATCH_INTERACTIONS } from '../src/core/matchInteractions.js';
import { TRAINING_GAMES } from '../src/data/trainingGames.js';
import { MINI_GAME_STATES, activateMiniGame, createMiniGameSession, miniGameById, miniGameForInteraction, resolveMiniGame } from '../src/core/miniGameLibrary.js';

test('phase 6: every production mini game is registered for its renderer', () => {
  for (const game of TRAINING_GAMES) assert.ok(miniGameById(game.mechanic)?.renderers.includes('trainingGame'), `${game.id} is not registered for training`);
  for (const interaction of MATCH_INTERACTIONS) assert.ok(miniGameForInteraction(interaction.id)?.renderers.includes('interactiveMatch'), `${interaction.id} is not registered for matches`);
});

test('phase 6: mini games follow READY, ACTIVE, RESULT exactly once', () => {
  const ready = createMiniGameSession('shooting', 'interactiveMatch');
  assert.equal(ready.status, MINI_GAME_STATES.READY);
  assert.equal(resolveMiniGame(ready, { score: 99 }), ready);
  const active = activateMiniGame(ready);
  assert.equal(active.status, MINI_GAME_STATES.ACTIVE);
  const result = resolveMiniGame(active, { score: 84 });
  assert.equal(result.status, MINI_GAME_STATES.RESULT);
  assert.equal(result.result.score, 84);
  assert.equal(activateMiniGame(result), result);
  assert.equal(resolveMiniGame(result, { score: 10 }), result);
});
