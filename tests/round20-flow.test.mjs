import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultState, migrateState } from '../src/core/store.js';
import { createTrainingOpportunity, trainingPool } from '../src/core/trainingOpportunities.js';
import { SimulationController } from '../src/core/simulationController.js';
import { radarChart } from '../src/components/radar.js';

const player = { name: '验收球员', position: 'ST', age: 16, ovr: 60, potential: 88, stats: { speed: 60, shooting: 56, passing: 64, dribbling: 63, defending: 48, physical: 55 } };

test('training opportunities are position-filtered and capped at four choices', () => {
  const state = createDefaultState();
  state.player = structuredClone(player);
  const attack = trainingPool('ST', state).map(item => item.gameId);
  const keeper = trainingPool('GK', { ...state, player: { ...player, position: 'GK' } }).map(item => item.gameId);
  assert.ok(attack.includes('shooting-target'));
  assert.ok(!attack.some(id => id.startsWith('keeper-')));
  assert.equal(keeper.length, 4);
  const opportunity = createTrainingOpportunity(state, { seed: 'round20' });
  assert.ok(opportunity.choices.length >= 2 && opportunity.choices.length <= 4);
  assert.equal(new Set(opportunity.choices.map(item => item.gameId)).size, opportunity.choices.length);
});

test('ordinary weeks advance automatically and stop at a generated training node', async () => {
  const state = createDefaultState();
  state.settings.mode = 'fast';
  state.player = structuredClone(player);
  state.schedule = [];
  const store = { get: () => state, set: updater => updater(state) };
  const controller = new SimulationController(store, { schedule: () => null });
  const first = await controller.advance('month');
  assert.equal(first.stopReason, 'target');
  const second = await controller.advance('month');
  assert.equal(second.stopReason, 'training');
  assert.ok(state.training.currentOpportunity);
  assert.equal(state.training.currentOpportunity.choices.length >= 2, true);
  assert.equal(state.training.currentOpportunity.choices.length <= 4, true);
});

test('fast mode batches ordinary matches and stops at important matches', async () => {
  const state = createDefaultState();
  state.player = structuredClone(player);
  state.schedule = [
    { id: 'ordinary-1', date: '2026-07-08', competition: '青年联赛', opponent: '河畔竞技', status: 'upcoming', important: false },
    { id: 'ordinary-2', date: '2026-07-15', competition: '青年联赛', opponent: '北城学院', status: 'upcoming', important: false },
    { id: 'important-1', date: '2026-07-29', competition: '国内杯决赛', opponent: '海港青年队', status: 'upcoming', important: true }
  ];
  const store = { get: () => state, set: updater => updater(state) };
  const controller = new SimulationController(store, { schedule: () => null });
  assert.equal(controller.nextNode(state).action, 'month');
  const result = await controller.advance('month');
  assert.equal(result.stopReason, 'match');
  assert.equal(result.match.id, 'important-1');
  assert.equal(state.schedule.filter(match => match.auto).length, 2);
});

test('keeper radar uses the six goalkeeper fields and save migration keeps them', () => {
  const current = { speed: 70, shooting: 50, passing: 68, dribbling: 62, defending: 74, physical: 71, goalkeeping: { saves: 76, reaction: 81, positioning: 73, handling: 69, aerial: 65, distribution: 72 } };
  const html = radarChart(current, current, 90, 'GK');
  for (const label of ['扑救', '反应', '站位', '手控球', '出击', '开球']) assert.match(html, new RegExp(label));
  const migrated = migrateState({ player: { ...player, position: 'GK' } });
  assert.deepEqual(Object.keys(migrated.player.goalkeeping), ['saves', 'reaction', 'positioning', 'handling', 'aerial', 'distribution']);
});

test('production entry has no world route and does not expose exact event probability', () => {
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /worldPage|world:\['map'/);
  assert.match(app, /clubsPage/);
  assert.doesNotMatch(app.slice(app.lastIndexOf('function resultPanel')), /成功概率/);
});
