import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as clock from '../src/systems/career/gameClock.js';
import {generateAcademyOffers} from '../src/systems/career/careerSystem.js';
import {migrateLegacy} from '../src/services/storage/migrations.js';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');

test('production boots the modular runtime and packages its fetched assets',()=>{
  const html=read('../index.html'),css=read('../styles.css'),build=read('../scripts/build.mjs'),sw=read('../sw.js');
  assert.match(html,/id="boot"/);
  assert.match(html,/src="\.\/src\/main\.js/);
  assert.doesNotMatch(html,/src="\.\/src\/app\.js/);
  for(const file of ['theme.css','base.css','components.css','pages.css','mobile-foundation.css','animations.css','v19-guidance.css','v20-product.css'])assert.ok(css.includes(file),file);
  for(const directory of ["'data'","'functions'","'server'"])assert.ok(build.includes(directory),directory);
  assert.match(sw,/src\/main\.js/);
  assert.doesNotMatch(sw,/src\/app\.js/);
});

test('indexed event packs expose at least one thousand event nodes',()=>{
  const index=JSON.parse(read('../data/events/index.json'));
  assert.ok(index.some(item=>item.category==='locker'));
  assert.ok(index.some(item=>item.category==='social'));
  assert.ok(index.reduce((sum,item)=>sum+Number(item.count||0),0)>=1000);
});

test('legacy V20 save maps attributes, position, club, and game date',()=>{
  const save=migrateLegacy({
    version:20,
    player:{name:'旧档球员',birth:'2008-03-18',position:'中场',clubId:'ajax',stats:{speed:71.5,shooting:62.25,passing:75.75,dribbling:74.5,defending:51.25,physical:60.5}},
    simulation:{date:'2027-03-18'},
    season:{year:'2026/27',week:31},
    career:{marketValue:900000}
  });
  assert.deepEqual(save.player.attrs,{pac:71.5,sho:62.25,pas:75.75,dri:74.5,def:51.25,phy:60.5});
  assert.equal(save.player.position,'CM');
  assert.match(save.career.clubId,/AJA/);
  assert.equal(save.player.birthDate,'2008-03-18');
  assert.equal(save.career.gameClock.currentDate,'2027-03-18');
});

test('age is derived from birth date and current game date',()=>{
  assert.equal(typeof clock.ageOnDate,'function');
  assert.equal(clock.ageOnDate('2008-03-18','2027-03-17'),18);
  assert.equal(clock.ageOnDate('2008-03-18','2027-03-18'),19);
  assert.equal(clock.ageOnDate('2008-03-18','2028-02-29'),19);
});

test('starting club allocation never crosses nationality as a fallback',()=>{
  const clubs=[
    {id:'ENG-A',country:'英格兰',rep:60,youth:70,youthUsage:80,needs:['CM']},
    {id:'ESP-A',country:'西班牙',rep:60,youth:70,youthUsage:80,needs:['CM']}
  ];
  const offers=generateAcademyOffers({seed:'local-only',nation:'冰岛',position:'CM',ovr:60,talent:{rarityKey:'common'},clubs});
  assert.deepEqual(offers,[]);
});
