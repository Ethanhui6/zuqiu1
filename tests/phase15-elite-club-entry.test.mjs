import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CLUB_ENTRY_ROUTES, evaluateClubFit, generateStartingClubOffers } from '../src/services/playerIdentity.js';

const elite={id:'elite',name:'Elite FC',country:'英格兰',city:'伦敦',rep:92,youth:92,opportunity:72,finance:90,needs:['ST']};
const route=(age,ovr,potential)=>evaluateClubFit({country:'英格兰',position:'ST',age,ovr,potential},elite).entryRoute;

test('phase 15 resolves all seven elite-club entry routes from age OVR and potential',()=>{
  assert.equal(route(18,90,92),'DIRECT_CONTRACT');
  assert.equal(route(16,50,92),'ACADEMY');
  assert.equal(route(19,60,86),'TRIAL');
  assert.equal(route(16,45,82),'SCOUT_WATCH');
  assert.equal(route(24,90,70),'RESERVE_TEAM');
  assert.equal(route(22,60,82),'LOAN_DEVELOPMENT');
  assert.equal(route(24,45,70),'REJECTED');
  const seen=new Set();
  for(const age of[16,18,20,24])for(const ovr of[45,60,75,90])for(const potential of[70,82,88,94])seen.add(route(age,ovr,potential));
  assert.deepEqual([...seen].sort(),Object.keys(CLUB_ENTRY_ROUTES).sort());
});

test('phase 15 gives low-OVR high-potential teenagers a real development route',()=>{
  for(const profile of[
    {age:16,ovr:45,potential:94},
    {age:18,ovr:52,potential:89},
    {age:20,ovr:58,potential:87},
    {age:22,ovr:60,potential:84}
  ])assert.notEqual(route(profile.age,profile.ovr,profile.potential),'REJECTED',JSON.stringify(profile));
  const clubs=JSON.parse(fs.readFileSync(new URL('../data/clubs.json',import.meta.url),'utf8')).clubs;
  const offers=generateStartingClubOffers({country:'英格兰',position:'ST',age:16,ovr:50,potential:92},{clubs},'phase15');
  assert.ok(offers.length>=3);assert.ok(offers.some(offer=>offer.entryRoute!=='REJECTED'));
  assert.ok(offers.every(offer=>CLUB_ENTRY_ROUTES[offer.entryRoute]&&offer.entryLabel&&offer.squad&&offer.contract));
});
