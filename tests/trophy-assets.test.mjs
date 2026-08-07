import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TROPHY_ASSETS, trophyAsset, trophyMarkup } from '../src/components/trophyIcon.js';

const GENERATED_AWARD_IDS = ['league-title', 'domestic-cup', 'continental-title', 'golden-boot', 'assists-king', 'golden-glove', 'best-defender', 'young-player', 'player-of-season', 'world-player', 'world-cup'];
const TROPHY_IDS = JSON.parse(fs.readFileSync(new URL('../data/trophies.json', import.meta.url), 'utf8')).map(trophy => trophy.id);

test('every generated award and registered trophy has an explicit local asset', () => {
  for (const id of [...new Set([...GENERATED_AWARD_IDS, ...TROPHY_IDS])]) {
    const asset = trophyAsset(id);
    assert.ok(asset, `missing asset mapping for ${id}`);
    assert.ok(fs.existsSync(new URL(`../${asset.slice(2)}`, import.meta.url)));
  }
});

test('registered trophy assets exist and unknown awards never become league trophies', () => {
  for (const asset of Object.values(TROPHY_ASSETS)) assert.ok(fs.existsSync(new URL(`../${asset.slice(2)}`, import.meta.url)));
  const fallback = trophyMarkup({ id: 'unknown-award', name: 'Unknown award' });
  assert.match(fallback, /data-trophy-status="fallback"/);
  assert.doesNotMatch(fallback, /league\.svg/);
});
