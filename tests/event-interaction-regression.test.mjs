import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { EventEngine } from '../src/core/eventEngine.js';

const positions = ['ST', 'CM', 'CB', 'GK'];
const stats = { speed: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 };

test('events remain resolvable across positions and reject duplicate resolution', () => {
  const engine = new EventEngine();
  let resolved = 0;
  for (const position of positions) {
    const state = createDefaultState();
    state.player = { position, stats: { ...stats }, morale: 72, fatigue: 8, coachTrust: 52 };
    for (let index = 0; index < 8; index += 1) {
      state.simulation.date = new Date(Date.UTC(2026, 6, 1 + index * 9)).toISOString().slice(0, 10);
      const event = engine.schedule(state);
      assert.ok(event, `${position} should receive event ${index + 1}`);
      assert.ok(event.choices.length >= 2);
      const result = engine.resolve(state, event.id, event.choices[0].id);
      assert.equal(result.eventId, event.id);
      assert.equal(state.events.pending.length, 0);
      assert.throws(() => engine.resolve(state, event.id, event.choices[0].id), /事件不存在/);
      resolved += 1;
    }
  }
  assert.equal(resolved, 32);
});
