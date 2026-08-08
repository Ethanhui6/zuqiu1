import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorldRegistry } from '../src/data/worldRegistry.js';
import { TROPHY_LIST } from '../src/data/trophyRegistry.js';

const read = file => JSON.parse(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const base = read('data/clubs.json');
const expansion = read('data/world-expansion.json');
const legacy = read('data/legendevo-clubs.json');
const legacyTrophies = read('data/legendevo-trophies.json');
const trophies = read('data/trophies.json');
const players = read('data/players.json');

test('PH11 imports the complete legacy catalogs with local assets', () => {
  assert.equal(legacy.sourceCount, 399);
  assert.equal(Object.keys(legacy.aliases).length + legacy.clubs.length, 399);
  assert.equal(legacy.sourceClubs.length, 399);
  assert.equal(legacyTrophies.length, 63);
  for (const club of legacy.clubs) assert.ok(fs.existsSync(new URL(`../${club.crest.slice(2)}`, import.meta.url)), club.id);
  for (const trophy of legacyTrophies) assert.ok(fs.existsSync(new URL(`../${trophy.image}`, import.meta.url)), trophy.id);
});

test('PH11 uses legacy trophy art and merges missing clubs without breaking the world registry', () => {
  assert.ok(TROPHY_LIST.every(item => !item.asset.endsWith('.svg')));
  const awards = TROPHY_LIST.filter(item => item.kind === 'award');
  assert.equal(new Set(awards.map(item => item.asset)).size, awards.length);
  const registry = createWorldRegistry({
    clubs: [...base.clubs, ...expansion.clubs, ...legacy.clubs],
    leagues: [...base.leagues, ...expansion.leagues, ...legacy.leagues],
    players,
    trophies: [...trophies, ...expansion.trophies, ...legacyTrophies],
    competitions: expansion.competitions
  });
  assert.equal(registry.audit.valid, true, registry.audit.errors.join('; '));
  assert.equal(registry.stats.clubs, 742);
  assert.equal(registry.stats.leagues, 74);
  assert.equal(registry.stats.trophies, 107);
});
