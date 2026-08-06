import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generatePlayerName, generateStartingClubOffers, validatePlayerName } from '../src/services/playerIdentity.js';

const profiles = Object.fromEntries(fs.readdirSync(new URL('../data/names/', import.meta.url)).filter(file => file.endsWith('.json')).map(file => [file.slice(0, -5), JSON.parse(fs.readFileSync(new URL(`../data/names/${file}`, import.meta.url), 'utf8'))]));
const clubs = JSON.parse(fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8')).clubs;

test('country name generation is deterministic and uses separate cultural pools', () => {
  const china = generatePlayerName('中国', 'identity-seed', profiles);
  const japan = generatePlayerName('日本', 'identity-seed', profiles);
  const repeat = generatePlayerName('中国', 'identity-seed', profiles);
  assert.equal(china.displayName, repeat.displayName);
  assert.notEqual(china.displayName, japan.displayName);
  assert.ok(china.displayName.length >= 2);
  assert.ok(japan.displayName.length >= 2);
});

test('manual names are optional but invalid input is rejected', () => {
  assert.equal(validatePlayerName('   ').valid, true);
  assert.equal(validatePlayerName('   ').empty, true);
  assert.equal(validatePlayerName('验收球员').valid, true);
  assert.equal(validatePlayerName('<script>').valid, false);
});

test('starting offers stay in the selected country and differ by route', () => {
  const offers = generateStartingClubOffers({ country: '中国', position: 'ST', birthplace: '上海', ovr: 58 }, { clubs }, 'club-seed');
  assert.ok(offers.length >= 3 && offers.length <= 5);
  assert.ok(offers.every(item => item.club.country === '中国'));
  assert.ok(new Set(offers.map(item => item.type)).size >= 2);
  assert.ok(offers.every(item => item.reason && item.positionFit));
});
