import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import clubsData from '../data/clubs.json' with { type: 'json' };
import { DataRepository } from '../src/services/dataRepository.js';

test('phase 4 ships a valid local crest asset for every world club', () => {
  const clubs=clubsData.clubs;
  assert.equal(clubs.length,500);
  const enriched=new DataRepository().enrichClubs(clubs);
  assert.equal(enriched.filter(club=>club.crestStatus==='fallback').length,0);
  for(const club of clubs){
    assert.match(club.crest,/^\.\/assets\/clubs\/[^/]+\/[^/]+\.(svg|png|webp)$/);
    const file=new URL(`../${club.crest.slice(2)}`,import.meta.url);
    assert.equal(fs.existsSync(file),true,club.id);
    if(file.pathname.endsWith('.svg')) {
      const svg=fs.readFileSync(file,'utf8');
      assert.match(svg,/<svg\b/i,club.id);
      assert.doesNotMatch(svg,/(?:href|src)\s*=\s*["']https?:/i,club.id);
    }
    assert.ok(club.crestSource?.sourcePage,club.id);
  }
});
