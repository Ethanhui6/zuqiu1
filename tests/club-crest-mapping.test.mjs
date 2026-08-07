import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CLUB_CRESTS } from '../src/data/clubCrests.js';
import { DataRepository } from '../src/services/dataRepository.js';
import { crestSvg } from '../src/components/clubCrest.js';

test('high-frequency Chinese clubs resolve to local exact crest assets', () => {
  const clubs = new DataRepository().enrichClubs(Object.keys(CLUB_CRESTS).map(id => ({ id, rep: 70 })));
  for (const club of clubs) {
    assert.equal(club.crestStatus, 'exact');
    assert.ok(fs.existsSync(new URL(`../${club.crest.slice(2)}`, import.meta.url)));
    assert.ok(club.crestSource);
  }
});

test('unmapped clubs render a local shield instead of a letter placeholder', () => {
  const club = new DataRepository().enrichClubs([{ id: 'unknown-club', rep: 60 }])[0];
  assert.equal(club.crestStatus, 'fallback');
  assert.match(crestSvg(club), /data-crest-status="fallback"/);
  assert.match(crestSvg(club), /<svg/);
});
