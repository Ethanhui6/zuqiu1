import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = file => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
const clubs = [...read('clubs.json').clubs, ...read('world-expansion.json').clubs];
const hash = value => [...value].reduce((total, char) => Math.imul(total ^ char.codePointAt(0), 16777619) >>> 0, 2166136261);

test('phase 21 has no missing, broken, duplicated, remote, watermarked or letter-placeholder crest', () => {
  assert.equal(clubs.length, 544);
  assert.equal(new Set(clubs.map(club => club.crest)).size, clubs.length);
  for (const club of clubs) {
    assert.match(club.crest, /^\.\/assets\/clubs\/[^/]+\/[^/]+\.(svg|png|webp)$/i, club.id);
    assert.equal(path.basename(club.crest, path.extname(club.crest)).toLowerCase(), club.id.toLowerCase(), club.id);
    const file = new URL(`../${club.crest.slice(2)}`, import.meta.url);
    assert.equal(fs.existsSync(file), true, club.id);
    assert.ok(club.crestSource?.sourcePage, club.id);
    if (file.pathname.endsWith('.svg')) {
      const svg = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(svg, /(?:href|src)\s*=\s*["']https?:|watermark|googleusercontent|gstatic/i, club.id);
      if (club.crestSource.generated) assert.doesNotMatch(svg, /<text\b/i, club.id);
    }
  }
});

test('phase 21 fixed random sample contains 100 correctly mapped club assets', () => {
  const sample = [...clubs].sort((a, b) => hash(`${a.id}|phase21`) - hash(`${b.id}|phase21`)).slice(0, 100);
  assert.equal(sample.length, 100);
  assert.equal(sample.filter(club => path.basename(club.crest, path.extname(club.crest)).toLowerCase() !== club.id.toLowerCase()).length, 0);
  assert.equal(new Set(sample.map(club => club.crest)).size, 100);
});
