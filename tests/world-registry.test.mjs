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
  assert.equal(registry.getClub('COL1-01').continent, '南美洲');
  assert.equal(registry.getClub('CHI1-01').continent, '南美洲');
  assert.equal(registry.getClub('URU1-01').continent, '南美洲');
  assert.equal(registry.trophies[0].dataOrigin, 'curated');
});

test('missing squad slots use explicitly marked deterministic fallback players', () => {
  const player = createGeneratedPlayer({ clubId: 'club-a', position: 'ST', index: 3, seed: 'test' });
  const same = createGeneratedPlayer({ clubId: 'club-a', position: 'ST', index: 3, seed: 'test' });
  assert.deepEqual(player, same);
  assert.equal(player.dataOrigin.identity, 'generated-fallback');
  assert.equal(player.dataOrigin.ratings, 'generated-fallback');
});

test('generated fallback rosters keep names unique within a club', () => {
  const profile = { china: { givenNamesMale: ['A', 'B', 'C', 'D', 'E', 'F'], familyNames: ['G', 'H', 'I', 'J', 'K', 'L'], nameOrder: 'family-given', separator: '' } };
  const registry = createWorldRegistry({ clubs: [{ id: 'CHN1-TEST', country: 'CN', rep: 60 }], leagues: [], players: [], trophies: [], nameProfiles: profile });
  const roster = registry.rosterForClub('CHN1-TEST', { limit: 18, seed: 'unique-roster' });
  assert.equal(new Set(roster.map(player => player.name)).size, roster.length);
});

test('generated squad names follow the supplied national profile', () => {
  const profile = { china: { givenNamesMale: ['子豪'], familyNames: ['陈'], nameOrder: 'family-given', separator: '' } };
  const player = createGeneratedPlayer({ clubId: 'CHN1-SHA', country: '中国', index: 1, seed: 'test', nameProfiles: profile });
  assert.equal(player.name, '陈子豪');
  assert.equal(player.cn, '陈子豪');
});
