import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorldRegistry } from '../src/data/worldRegistry.js';

const read = file => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
const base = read('clubs.json');
const expansion = read('world-expansion.json');
const registry = createWorldRegistry({
  clubs: [...base.clubs, ...expansion.clubs],
  leagues: [...base.leagues, ...expansion.leagues],
  players: read('players.json'),
  trophies: [...read('trophies.json'), ...(expansion.trophies || [])],
  competitions: expansion.competitions
});

test('PH4 release audit validates the full real-world registry', () => {
  assert.equal(registry.audit.valid, true, registry.audit.errors.join('; '));
  assert.deepEqual(registry.audit.counts, { clubs: 547, leagues: 51, players: 598, realPlayers: 598, competitions: 3 });
  assert.deepEqual(registry.audit.roster, { min: 30, max: 30, clubs: 547, missingPositions: [] });
  assert.equal(new Set(registry.players.map(player => player.id)).size, registry.players.length);
  assert.ok(registry.players.every(player => !player.id.startsWith('generated-')));
});

test('PH4 retains raw source coverage while de-duplicating the runtime roster', () => {
  const raw = read('players.json');
  assert.equal(raw.length, 601);
  assert.equal(new Set(raw.filter(player => player.sourceName === 'Wikidata').map(player => player.id)).size, 519);
  assert.equal(registry.players.length, 598);
  assert.equal(registry.stats.realPlayers, 598);
});
