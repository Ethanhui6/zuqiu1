import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rerollPlayerDraft } from '../src/pages/createPlayer.js';
import { createPlayerOriginProfile, generatePlayerName, generateStartingClubOffers } from '../src/services/playerIdentity.js';

const profiles = Object.fromEntries(fs.readdirSync(new URL('../data/names/', import.meta.url)).filter(file => file.endsWith('.json')).map(file => [file.slice(0, -5), JSON.parse(fs.readFileSync(new URL(`../data/names/${file}`, import.meta.url), 'utf8'))]));
const clubs = JSON.parse(fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8')).clubs;
const world = { clubs, nameProfiles: profiles };
const countries = ['中国','日本','韩国','英格兰','西班牙','葡萄牙','法国','德国','意大利','荷兰','比利时','巴西','阿根廷','美国','墨西哥','沙特阿拉伯','土耳其','尼日利亚','加纳','塞内加尔','摩洛哥','埃及'];
const base = { name:'',shirtName:'',country:'中国',birthplace:'上海',height:178,weight:70,foot:'右脚',number:18,position:'CM',style:'全能中场',secondaryTrait:'稳定发挥',lockName:false,lockCountry:false,previewSeed:'phase16' };

function verifyOrigin(draft, seed) {
  const origin = draft.originProfile || createPlayerOriginProfile(draft.country, world);
  const identity = generatePlayerName(origin.nationality, seed, profiles);
  const offers = generateStartingClubOffers({ ...draft, age:16, ovr:60, potential:86, originProfile:origin }, world, seed);
  assert.equal(origin.nationality, draft.country);
  assert.equal(identity.locale, origin.nameLocale);
  assert.ok(origin.region && origin.language && origin.startingCountry);
  assert.ok(origin.startingClubPool.length >= 3, `${draft.country} has ${origin.startingClubPool.length} starting clubs`);
  assert.ok(origin.startingLeaguePool.length >= 1, `${draft.country} has no starting league`);
  assert.ok(offers.length >= 3 && offers.length <= 5);
  assert.ok(offers.every(offer => origin.startingClubPool.includes(offer.clubId)));
  assert.ok(offers.every(offer => origin.startingLeaguePool.includes(offer.club.leagueId || offer.club.leagueCn || offer.club.league)));
  return identity.displayName;
}

test('phase 16 builds one coherent origin profile for every selectable nationality', () => {
  for (const country of countries) verifyOrigin({ ...base, country, originProfile:createPlayerOriginProfile(country, world) }, `country-${country}`);
});

test('phase 16 keeps nationality name locale and starting pools aligned across 100 rerolls', () => {
  let draft = base;
  const seen = new Set();
  for (let index = 1; index <= 100; index++) {
    draft = rerollPlayerDraft(draft, index, world);
    verifyOrigin(draft, draft.previewSeed);
    seen.add(draft.country);
  }
  assert.ok(seen.size >= 15, `only ${seen.size} nationalities were reached`);
});

test('locking nationality keeps its origin while generated names continue to reroll', () => {
  let draft = { ...base, country:'日本', lockCountry:true };
  const names = new Set();
  for (let index = 1; index <= 100; index++) {
    draft = rerollPlayerDraft(draft, index, world);
    assert.equal(draft.country, '日本');
    names.add(verifyOrigin(draft, draft.previewSeed));
  }
  assert.ok(names.size >= 80, `only ${names.size} generated names were unique`);
});
