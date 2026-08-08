import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGeneratedPlayer, createWorldRegistry } from '../src/data/worldRegistry.js';
import { icon, iconCount, iconNames } from '../src/components/icons.js';
import { feedbackScenarioCount, FEEDBACK_CATALOG } from '../src/core/feedbackDirector.js';

const read = file => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));

test('football data keeps provenance and deterministic fallback metadata', () => {
  const clubs = read('clubs.json');
  const registry = createWorldRegistry({ clubs: clubs.clubs, leagues: clubs.leagues, players: read('players.json'), trophies: read('trophies.json') });
  const club = registry.getClub('CHN1-SHA');
  assert.equal(registry.validation.valid, true, registry.validation.errors.join('; '));
  assert.equal(club.isReal, true);
  assert.equal(club.provenance.dataOrigin, 'curated');
  assert.ok(club.sourceName);
  assert.ok(club.provenance.sourceName);
  assert.ok(registry.countries.length >= 20);
  assert.equal(registry.stats.availablePlayers, 9000);
  assert.ok(registry.rosterForClub(club.id).length >= 11);
  assert.equal(registry.rosterForClub('missing-club', { seed: 'stable' })[0].isReal, false);
  assert.equal(createGeneratedPlayer({ clubId: club.id, seed: 'stable' }).provenance.dataOrigin, 'generated-fallback');
});

test('visual registry exposes 500 unique SVG assets and 100 feedback scenarios', () => {
  assert.ok(iconCount >= 576, `icon count ${iconCount}`);
  assert.equal(new Set(iconNames).size, iconCount);
  assert.match(icon('asset-feedback-006'), /<svg[\s\S]*<path/);
  assert.ok(feedbackScenarioCount >= 100, `feedback count ${feedbackScenarioCount}`);
  assert.ok(FEEDBACK_CATALOG['scenario-100']);
});

test('production shell starts light and keeps dark mode available', () => {
  const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(css, /:root:not\(\[data-theme\]\)\s*{[\s\S]*?color-scheme:\s*light/);
  assert.match(css, /--bg:\s*#f4f7fb/);
  assert.match(css, /:root\[data-theme="dark"\]\s*{\s*color-scheme:\s*dark/);
  assert.match(html, /theme-color" content="#f4f7fb"/);
});
