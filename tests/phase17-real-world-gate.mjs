import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorldRegistry } from '../src/data/worldRegistry.js';

const read = file => JSON.parse(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const base = read('data/clubs.json');
const expansion = read('data/world-expansion.json');
const legacy = read('data/legendevo-clubs.json');
const players = read('data/players.json');
const national = read('data/events/national.json');
const nationalTeam = read('data/events/national-team.json');
const clubs = [...base.clubs, ...expansion.clubs, ...legacy.clubs];
const leagues = [...base.leagues, ...expansion.leagues, ...legacy.leagues];
const registry = createWorldRegistry({ clubs, leagues, players, trophies: [...read('data/trophies.json'), ...expansion.trophies, ...read('data/legendevo-trophies.json')], competitions: expansion.competitions });
const requiredCountries = ['CHN', 'JPN', 'KOR', 'KSA', 'AUS', 'THA', 'VNM', 'ENG', 'ESP', 'GER', 'ITA', 'FRA', 'POR', 'NED', 'BEL', 'AUT', 'SUI', 'DEN', 'NOR', 'SWE', 'BRA', 'ARG', 'URU', 'COL', 'USA', 'MEX'];
for (const club of clubs) {
  for (const field of ['id', 'cn', 'country', 'countryCode', 'leagueId', 'rep', 'crest', 'dataSource']) assert.ok(club[field] !== undefined && club[field] !== null && club[field] !== '', `${club.id} missing ${field}`);
  assert.ok(fs.existsSync(new URL(`../${club.crest.slice(2)}`, import.meta.url)), `${club.id} crest missing`);
}
assert.equal(registry.audit.valid, true, registry.audit.errors.join('; '));
assert.equal(clubs.length, 742);
assert.ok(requiredCountries.every(code => clubs.some(club => club.countryCode === code)), 'required region coverage is incomplete');
assert.ok(players.length >= 600 && players.every(player => player.id && player.clubId && player.cn && player.isReal), 'real player snapshot is incomplete');
assert.ok(new Set(players.map(player => player.id)).size === players.length, 'real player IDs repeat');
assert.ok(new Set(players.map(player => player.clubId)).size >= 70, 'real player clubs are too narrow');
assert.ok(national.length >= 24 && nationalTeam.length >= 8, 'national team event content is incomplete');
console.log(JSON.stringify({ status: 'PASS', clubs: clubs.length, leagues: leagues.length, countries: new Set(clubs.map(club => club.countryCode)).size, realPlayers: players.length, realPlayerClubs: new Set(players.map(player => player.clubId)).size, competitions: expansion.competitions.length, nationalEvents: national.length + nationalTeam.length, requiredRegions: requiredCountries.length }, null, 2));
