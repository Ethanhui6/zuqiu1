import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PLAYER_STYLE_DEFINITIONS } from '../src/data/playerProfiles.js';
import { playerStylesForPosition, scoutDraft } from '../src/pages/createPlayer.js';
import { generateStartingClubOffers } from '../src/services/playerIdentity.js';

const clubs = JSON.parse(fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8')).clubs;

test('PH3 supplies at least five position-specific styles for every creation position', () => {
  for (const position of ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK']) {
    const styles = playerStylesForPosition(position);
    assert.ok(styles.length >= 5, `${position} exposes ${styles.length} styles`);
    assert.equal(new Set(styles.map(style => style.id)).size, styles.length);
    assert.ok(styles.every(style => style.bonus && style.weakness && style.body && style.behavior && style.keys));
  }
  assert.ok(PLAYER_STYLE_DEFINITIONS.length >= 35);
});

test('PH3 extraction stays integer-based and starting offers are real, distinct and position-aware', () => {
  const base = { name: '', country: '中国', birthplace: '上海', height: 178, weight: 70, foot: '右脚', number: 18, position: 'CM', style: playerStylesForPosition('CM')[0].id, secondaryTrait: '稳定发挥', previewSeed: 'ph3-pool' };
  const report = scoutDraft(base);
  assert.ok(Object.values(report.stats).every(Number.isInteger));
  assert.ok(Number.isInteger(report.potential));
  const offers = generateStartingClubOffers({ ...base, nation: base.country, ovr: 62, potential: report.potential }, { clubs }, 'ph3-offers');
  assert.ok(offers.length >= 3);
  assert.equal(new Set(offers.map(offer => offer.clubId)).size, offers.length);
  assert.ok(offers.every(offer => offer.club?.cn && offer.club?.crest));
  assert.ok(offers.some(offer => offer.positionFit));
});
