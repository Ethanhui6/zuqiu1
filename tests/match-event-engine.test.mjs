import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MatchEventEngine } from '../src/core/matchEventEngine.js';
import { createMatchState, advanceMatchState } from '../src/core/matchState.js';
import { normalizePosition } from '../src/core/positionResolver.js';
import { getMatchInteractionsForPosition } from '../src/core/interactiveMatchEngine.js';

const templates = JSON.parse(fs.readFileSync(new URL('../data/events/position-events.json', import.meta.url), 'utf8'));

test('shipped match library is separate, position-scoped, and larger than 1000 events', () => {
  const matchTemplates = templates.filter(item => item.category === '比赛');
  assert.ok(matchTemplates.length > 1000);
  for (const position of ['GK', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'LW', 'ST']) {
    assert.ok(matchTemplates.filter(item => item.positions.some(value => normalizePosition(value) === position)).length >= 120, position);
  }
  assert.equal(new MatchEventEngine(templates).templates.length, matchTemplates.length);
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /new MatchEventEngine\(dataRepository\.positionEvents/);
});

test('match event runtime chooses a valid position interaction and avoids the previous event', () => {
  const engine = new MatchEventEngine(templates);
  const state = createMatchState({ match: { id: 'm1' }, player: { position: 'RW', ovr: 72, fitness: 84, morale: 70 }, seed: 41 });
  const first = engine.next(state, { tactic: 'creative' });
  assert.ok(first);
  assert.equal(first.source, 'match');
  assert.ok(getMatchInteractionsForPosition('RW').some(item => item.id === first.interactionId));
  assert.ok(!first.positions.includes('GK'));
  const nextState = advanceMatchState(state, first, { score: 82, success: true });
  const second = engine.next(nextState, { tactic: 'creative' });
  assert.ok(second);
  assert.notEqual(second.templateId, first.templateId);
});
