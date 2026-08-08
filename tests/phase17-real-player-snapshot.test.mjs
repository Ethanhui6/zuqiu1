import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorldRegistry, REAL_SQUAD_SNAPSHOT_SEASON } from '../src/data/worldRegistry.js';

const read=file=>JSON.parse(fs.readFileSync(new URL(`../data/${file}`,import.meta.url),'utf8'));
const world=read('clubs.json'),players=read('players.json'),sources=read('player-snapshot-sources.json');
const registry=createWorldRegistry({clubs:world.clubs,leagues:world.leagues,players});
const wikidataPlayers=players.filter(player=>player.sourceName==='Wikidata');
const wikidataClubs=new Set(wikidataPlayers.map(player=>player.clubId));
const sampled=world.clubs.toSorted((a,b)=>Number(b.rep)-Number(a.rep)).filter(club=>wikidataClubs.has(club.id)).slice(0,50);

test('phase 17 stores a sourced offline snapshot for fifty important clubs',()=>{
  assert.equal(sampled.length,50);
  assert.ok(players.length>=600);
  assert.ok(wikidataPlayers.length>=500);
  assert.ok(wikidataClubs.size>=70);
  assert.equal(new Set(wikidataPlayers.map(player=>player.id)).size,wikidataPlayers.length);
  assert.ok(wikidataPlayers.every(player=>player.isReal&&player.snapshotSeason===REAL_SQUAD_SNAPSHOT_SEASON));
  assert.ok(wikidataPlayers.every(player=>player.sourceReference?.startsWith('https://www.wikidata.org/wiki/Q')));
  assert.ok(wikidataPlayers.every(player=>player.dataOrigin?.identity==='verified-public'&&player.dataOrigin?.ratings==='estimated'));
  const normalized=registry.players.filter(player=>player.sourceName==='Wikidata');
  assert.ok(normalized.every(player=>player.playerId&&player.nameZh&&player.nameLatin&&player.nameLocal&&player.clubId&&player.nationality&&player.birthYear&&player.position));
  assert.ok(sources.license==='CC0-1.0'&&sources.clubs.length>=75);
});

test('phase 17 real players lead every sampled roster instead of an all-NPC squad',()=>{
  for(const club of sampled){
    const real=registry.realRosterForClub(club.id,{limit:30,seasonYear:REAL_SQUAD_SNAPSHOT_SEASON});
    const roster=registry.rosterForClub(club.id,{limit:18,seasonYear:REAL_SQUAD_SNAPSHOT_SEASON,seed:'phase17'});
    assert.ok(real.some(player=>player.dataOrigin.identity==='verified-public'),`${club.id} has no verified public player`);
    assert.equal(roster[0].isReal,true,`${club.id} begins with an NPC`);
    assert.ok(roster.some(player=>player.isReal),`${club.id} is still all NPCs`);
  }
  assert.equal(registry.validation.valid,true,registry.validation.errors.join('\n'));
  assert.ok(registry.players.some(player=>player.name==='Kylian Mbappé'));
  assert.ok(registry.players.some(player=>player.name==='Cristiano Ronaldo'));
});
