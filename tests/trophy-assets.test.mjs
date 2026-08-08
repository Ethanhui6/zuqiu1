import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { OBTAINABLE_AWARD_IDS, TROPHY_ASSETS, trophyAsset, trophyMarkup } from '../src/components/trophyIcon.js';

const BASE_TROPHIES = JSON.parse(fs.readFileSync(new URL('../data/trophies.json', import.meta.url), 'utf8'));
const EXPANSION_TROPHIES = JSON.parse(fs.readFileSync(new URL('../data/world-expansion.json', import.meta.url), 'utf8')).trophies;
const TROPHIES = [...BASE_TROPHIES, ...EXPANSION_TROPHIES];

test('every generated award and registered trophy has an explicit local asset', () => {
  for (const id of TROPHIES.map(trophy => trophy.id)) {
    const asset = trophyAsset(id);
    assert.ok(asset, `missing asset mapping for ${id}`);
    assert.ok(fs.existsSync(new URL(`../${asset.slice(2)}`, import.meta.url)));
  }
});

test('every obtainable award uses its own local asset', () => {
  const assets = OBTAINABLE_AWARD_IDS.map(id => trophyAsset(id));
  assert.equal(new Set(assets).size, assets.length);
  assert.ok(assets.every(Boolean));
});

test('registered trophy assets exist and unknown awards never become league trophies', () => {
  assert.equal(TROPHIES.length, 44);
  assert.equal(Object.keys(TROPHY_ASSETS).length, 44);
  assert.equal(new Set(TROPHIES.map(trophy => trophy.image)).size, 44);
  for (const asset of Object.values(TROPHY_ASSETS)) assert.ok(fs.existsSync(new URL(`../${asset.slice(2)}`, import.meta.url)));
  const fallback = trophyMarkup({ id: 'unknown-award', name: 'Unknown award' });
  assert.match(fallback, /data-trophy-status="fallback"/);
  assert.doesNotMatch(fallback, /league\.svg/);
});
