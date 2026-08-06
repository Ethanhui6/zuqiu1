import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGeneratedPlayer, createWorldRegistry } from '../src/data/worldRegistry.js';

const read = file => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));

test('world registry validates the shipped world data and preserves its scale', () => {
  const clubs = read('clubs.json');
  const registry = createWorldRegistry({ clubs: clubs.clubs, leagues: clubs.leagues, players: read('players.json'), trophies: read('trophies.json') });
  assert.equal(registry.stats.clubs, 500);
  assert.equal(registry.validation.valid, true, registry.validation.errors.join('; '));
  assert.equal(registry.getClub('CHN1-SHA').dataOrigin.ratings, 'estimated');
  assert.equal(registry.trophies[0].dataOrigin, 'curated');
});

test('missing squad slots use explicitly marked deterministic fallback players', () => {
  const player = createGeneratedPlayer({ clubId: 'club-a', position: 'ST', index: 3, seed: 'test' });
  const same = createGeneratedPlayer({ clubId: 'club-a', position: 'ST', index: 3, seed: 'test' });
  assert.deepEqual(player, same);
  assert.equal(player.dataOrigin.identity, 'generated-fallback');
  assert.equal(player.dataOrigin.ratings, 'generated-fallback');
});
