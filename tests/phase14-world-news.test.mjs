import test from 'node:test';
import assert from 'node:assert/strict';
import { addNews, homeNews } from '../src/core/newsEngine.js';

test('phase 14 homepage keeps three to five important news items without creating an interruption', () => {
  const state = { simulation: { date: '2026-08-01' }, events: { pending: [] }, news: { items: [], unread: 0 } };
  for (let index = 0; index < 7; index++) addNews(state, { id: `training-${index}`, type: '训练', title: `Routine training ${index}`, importance: 1 });
  for (let index = 0; index < 5; index++) addNews(state, { id: `headline-${index}`, type: '比赛', title: `Major headline ${index}`, importance: 2 + index % 2 });
  const featured = homeNews(state);
  assert.ok(featured.length >= 3 && featured.length <= 5);
  assert.ok(featured.every(item => item.importance >= 2));
  assert.deepEqual(state.events.pending, []);
});
