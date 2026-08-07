import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchStrategiesForPosition } from '../src/core/matchStrategy.js';

test('each position group receives three distinct personal match strategies', () => {
  for (const position of ['GK', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'ST']) {
    const strategies = matchStrategiesForPosition(position);
    assert.equal(strategies.length, 3, position);
    assert.equal(new Set(strategies.map(item => item.id)).size, 3, position);
    assert.ok(strategies.every(item => item.name && item.copy && item.style && item.keywords.length && Number.isFinite(item.mods.rating)));
  }
  assert.deepEqual(matchStrategiesForPosition('RW').map(item => item.name), ['爆破边路', '内切攻击', '创造优先']);
  assert.deepEqual(matchStrategiesForPosition('GK').map(item => item.name), ['稳守门线', '积极出击', '出球参与']);
});

test('match center opens strategy selection before starting runtime events', () => {
  const page = fs.readFileSync(new URL('../src/pages/match.js', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(page, /app\.openMatchStrategy\(match\)/);
  assert.match(app, /openMatchStrategy\(match\)/);
  assert.match(app, /new MatchEventEngine\(dataRepository\.positionEvents\|\|\[\]\)\.next\(matchState,\{tactic\}\)/);
});
