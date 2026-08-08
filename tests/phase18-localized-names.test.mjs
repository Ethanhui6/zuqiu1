import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LocalizedNameGenerator } from '../src/services/playerIdentity.js';
import { createWorldRegistry } from '../src/data/worldRegistry.js';

const profiles=Object.fromEntries(fs.readdirSync(new URL('../data/names/',import.meta.url)).filter(file=>file.endsWith('.json')).map(file=>[file.slice(0,-5),JSON.parse(fs.readFileSync(new URL(`../data/names/${file}`,import.meta.url),'utf8'))]));
const world=JSON.parse(fs.readFileSync(new URL('../data/clubs.json',import.meta.url),'utf8'));
const players=JSON.parse(fs.readFileSync(new URL('../data/players.json',import.meta.url),'utf8'));
const countries=[['中国','china'],['日本','japan'],['韩国','south-korea'],['英格兰','england'],['西班牙','spain'],['葡萄牙','portugal'],['法国','france'],['德国','germany'],['意大利','italy'],['荷兰','netherlands'],['比利时','belgium'],['巴西','brazil'],['阿根廷','argentina'],['美国','usa'],['墨西哥','mexico'],['沙特阿拉伯','saudi-arabia'],['土耳其','turkey'],['尼日利亚','nigeria'],['加纳','ghana'],['塞内加尔','senegal'],['摩洛哥','morocco'],['埃及','egypt']];
const forbidden=/Academy Prospect|Player\s*\d|Youth\s*\d|青年队球员\s*\d/i;

test('phase 18 generates one thousand unique culturally scoped names per major nationality',()=>{
  const generator=new LocalizedNameGenerator(profiles);
  for(const[country,file]of countries){
    const reserved=new Set(),names=[];
    for(let index=0;index<1000;index++)names.push(generator.generateUnique(country,`phase18-${country}-${index}`,reserved));
    assert.equal(reserved.size,1000,`${country} name pool repeated`);
    assert.ok(names.every(identity=>identity.locale===profiles[file].locale),`${country} locale mismatch`);
    assert.ok(names.every(identity=>identity.displayName.length<=40&&/[\p{L}\p{N}]/u.test(identity.displayName)&&!forbidden.test(identity.displayName)&&!identity.displayName.includes('  ')),`${country} invalid name`);
    if(country==='日本')assert.ok(names.every(identity=>!identity.displayName.includes(' ')&&/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+$/u.test(identity.displayName)),`${country} script mismatch`);
    if(country==='韩国')assert.ok(names.every(identity=>!identity.displayName.includes(' ')&&/^\p{Script=Hangul}+$/u.test(identity.displayName)),`${country} script mismatch`);
    if(country==='中国')assert.ok(names.every(identity=>!identity.displayName.includes(' ')&&/^[\p{Script=Han}]+$/u.test(identity.displayName)),`${country} script mismatch`);
  }
});

test('phase 18 keeps every future club roster unique and free of technical placeholders',()=>{
  const registry=createWorldRegistry({clubs:world.clubs,leagues:world.leagues,players,nameProfiles:profiles});
  for(const club of registry.clubs){
    const roster=registry.rosterForClub(club.id,{limit:18,seasonYear:2045,seed:'phase18-future'}),names=roster.map(player=>player.name);
    assert.equal(new Set(names).size,names.length,`${club.id} contains duplicate future names`);
    assert.equal(names.some(name=>forbidden.test(name)),false,`${club.id} exposes a technical placeholder`);
  }
  const fallback=registry.rosterForClub('missing-club',{limit:18,seasonYear:2045,seed:'phase18-missing'});
  assert.equal(new Set(fallback.map(player=>player.name)).size,18);
  assert.equal(fallback.some(player=>forbidden.test(player.name)),false);
});
