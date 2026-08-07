import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CLUB_CRESTS } from '../src/data/clubCrests.js';
import { DataRepository } from '../src/services/dataRepository.js';

test('high-frequency Chinese clubs resolve to local exact crest assets', () => {
  const clubs = new DataRepository().enrichClubs(Object.keys(CLUB_CRESTS).map(id => ({ id, rep: 70 })));
  for (const club of clubs) {
    assert.equal(club.crestStatus, 'exact');
    assert.ok(fs.existsSync(new URL(`../${club.crest.slice(2)}`, import.meta.url)));
    assert.ok(club.crestSource);
  }
});
