import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MatchEventEngine } from '../src/core/matchEventEngine.js';
import { advanceMatchState, createMatchState } from '../src/core/matchState.js';
import { getMatchInteractionsForPosition } from '../src/core/interactiveMatchEngine.js';
import { trainingPool } from '../src/core/trainingOpportunities.js';

const templates = JSON.parse(fs.readFileSync(new URL('../data/events/position-events.json', import.meta.url), 'utf8'));

test('phase 8: training and match choices stay position-specific, with an independent keeper path', () => {
  const attack = trainingPool('ST').map(plan => plan.id);
  const defense = trainingPool('CB').map(plan => plan.id);
  const keeper = trainingPool('GK');
  assert.notDeepEqual(attack, defense);
  assert.ok(keeper.every(plan => plan.goalkeepingGains));
  assert.ok(getMatchInteractionsForPosition('GK').some(item => item.id === 'goalkeeper-save'));
  assert.ok(!getMatchInteractionsForPosition('GK').some(item => item.id === 'shooting'));
  assert.notDeepEqual(getMatchInteractionsForPosition('ST').map(item => item.id), getMatchInteractionsForPosition('GK').map(item => item.id));
});

test('phase 8: a match never repeats a mini game after it has been used', () => {
  const engine = new MatchEventEngine(templates);
  let state = createMatchState({ match: { id: 'phase8' }, player: { position: 'ST', ovr: 78, fitness: 86, morale: 72 }, seed: 81 });
  const used = new Set();
  for (let index = 0; index < 5; index += 1) {
    const event = engine.next(state, { tactic: 'aggressive' });
    assert.ok(event, `expected unused event ${index + 1}`);
    assert.ok(!used.has(event.miniGame.id), `repeated ${event.miniGame.id}`);
    used.add(event.miniGame.id);
    state = advanceMatchState(state, event, { score: 80, success: true });
  }
  assert.equal(engine.next(state, { tactic: 'aggressive' }), null);
});
