import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorldRegistry, REAL_SQUAD_SNAPSHOT_SEASON } from '../src/data/worldRegistry.js';

const read = file => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));

test('real squad snapshots lead the first season and retire deterministically', () => {
  const clubs = read('clubs.json');
  const registry = createWorldRegistry({ clubs: clubs.clubs, leagues: clubs.leagues, players: read('players.json') });
  const first = registry.rosterForClub('ENG1-ARS', { limit: 18, seasonYear: REAL_SQUAD_SNAPSHOT_SEASON, seed: 'snapshot' });
  const real = registry.realRosterForClub('ENG1-ARS', { limit: 18, seasonYear: REAL_SQUAD_SNAPSHOT_SEASON });
  assert.ok(real.length >= 11);
  assert.deepEqual(first.slice(0, real.length).map(player => player.id), real.map(player => player.id));
  assert.ok(real.every(player => player.isReal && player.snapshotSeason === REAL_SQUAD_SNAPSHOT_SEASON));

  const futureA = registry.rosterForClub('ENG1-ARS', { limit: 18, seasonYear: 2040, seed: 'snapshot' });
  const futureB = registry.rosterForClub('ENG1-ARS', { limit: 18, seasonYear: 2040, seed: 'snapshot' });
  assert.deepEqual(futureA, futureB);
  assert.equal(futureA.some(player => player.isReal), false);
  const realNames = new Set(registry.players.filter(player => player.isReal).map(player => player.name));
  assert.equal(futureA.some(player => realNames.has(player.name)), false);
});
