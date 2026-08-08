import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorldRegistry } from '../src/data/worldRegistry.js';

const read = file => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
const base = read('clubs.json');
const expansion = read('world-expansion.json');
const trophies = [...read('trophies.json'), ...expansion.trophies];
const registry = createWorldRegistry({
  clubs: [...base.clubs, ...expansion.clubs],
  leagues: [...base.leagues, ...expansion.leagues],
  players: read('players.json'),
  trophies,
  competitions: expansion.competitions
});

test('phase 20 adds complete Asian, European and American league snapshots', () => {
  assert.equal(expansion.clubs.length, 47);
  assert.deepEqual(Object.fromEntries(expansion.leagues.map(league => [league.id, expansion.clubs.filter(club => club.leagueId === league.id).length])), { THA1: 16, HUN1: 12, ECU1: 16, VNM1: 3 });
  for (const source of expansion.clubs) {
    const club = registry.getClub(source.id);
    for (const value of [club.id, club.nameZh, club.nameEn, club.country, club.leagueId, club.crest]) assert.ok(value, `${source.id} missing required identity`);
    for (const value of [club.level, club.strength, club.academy, club.reputation]) assert.ok(Number.isFinite(Number(value)), `${source.id} missing required rating`);
    assert.ok(fs.existsSync(new URL(`../${club.crest.replace(/^\.\//, '')}`, import.meta.url)), `${source.id} crest missing`);
  }
});

test('phase 20 competitions resolve rules, participants, honors and local trophies', () => {
  assert.equal(expansion.competitions.length, 3);
  for (const competition of expansion.competitions) {
    assert.ok(competition.rules && Object.keys(competition.rules).length);
    assert.equal(competition.participantClubIds.length, competition.rules.teamCount);
    assert.ok(competition.honor);
    const trophy = trophies.find(item => item.id === competition.trophyId);
    assert.ok(trophy, `${competition.id} trophy missing`);
    assert.ok(fs.existsSync(new URL(`../${trophy.image}`, import.meta.url)), `${competition.id} trophy asset missing`);
    assert.ok(competition.participantClubIds.every(id => registry.getClub(id)?.leagueId === competition.leagueId));
    assert.equal(registry.competitionForLeague(competition.leagueId)?.id, competition.id);
  }
});

test('phase 20 world registry validates the expanded runtime scale', () => {
  assert.equal(registry.validation.valid, true, registry.validation.errors.join('; '));
  assert.deepEqual({ clubs: registry.stats.clubs, leagues: registry.stats.leagues, countries: registry.stats.countries, competitions: registry.stats.competitions }, { clubs: 547, leagues: 51, countries: 41, competitions: 3 });
  assert.equal(registry.getClub('THA1-BUR').continent, '亚洲');
  assert.equal(registry.getClub('HUN1-FER').continent, '欧洲');
  assert.equal(registry.getClub('ECU1-IDV').continent, '南美洲');
  assert.equal(registry.competitionsForClub('ECU1-IDV').length, 1);
});
