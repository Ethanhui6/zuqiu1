import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CareerDirector, createRealFixtures, recordMatchResult, SEASON_STAT_FIELDS } from '../src/core/simulationController.js';
import { createDefaultState } from '../src/core/store.js';

const clubs=JSON.parse(fs.readFileSync(new URL('../data/clubs.json',import.meta.url),'utf8')).clubs;
const positions=['ST','CM','CB','GK'];

function seasonState(index,position){
  const state=createDefaultState(),club=clubs[index%clubs.length],start=2026+index;
  state.settings.mode='standard';
  state.simulation.date=`${start}-07-01`;
  state.season.year=`${start}/${String((start+1)%100).padStart(2,'0')}`;
  state.player={name:`Player ${index}`,club:club.cn,clubId:club.id,country:club.country,league:club.leagueCn,position,age:18,ovr:68,potential:84,stats:{speed:68,shooting:68,passing:68,dribbling:68,defending:68,physical:68},previousStats:{speed:68,shooting:68,passing:68,dribbling:68,defending:68,physical:68},fatigue:0,fitness:100,morale:70,coachTrust:55};
  state.schedule=createRealFixtures(state,clubs);
  return state;
}

test('phase 4 simulates 100 complete seasons with rare key matches and position-specific records',()=>{
  const totals=Object.fromEntries(positions.map(position=>[position,{shots:0,keyPasses:0,tackles:0,interceptions:0,saves:0,cleanSheets:0}]));
  for(let index=0;index<100;index++){
    const position=positions[index%positions.length],state=seasonState(index,position);
    assert.ok(state.schedule.length>=34&&state.schedule.length<=40,`season ${index}: ${state.schedule.length} fixtures`);
    assert.ok(state.schedule.filter(match=>match.important).length<=2);
    assert.ok(state.schedule.every((match,fixtureIndex)=>match.round===fixtureIndex+1&&clubs.some(club=>club.id===match.opponentId)));
    const director=new CareerDirector({get:()=>state,set:update=>update(state)},{schedule:()=>null});
    for(const fixture of state.schedule)assert.equal(director.settleAutoMatch(state,fixture),true);
    assert.ok(state.season.appearances>=20&&state.season.appearances<=40,`season ${index}: ${state.season.appearances} appearances`);
    for(const field of SEASON_STAT_FIELDS)assert.ok(Number.isFinite(state.season[field])&&state.season[field]>=0,`season ${index}: ${field}`);
    assert.equal(state.schedule.filter(match=>match.status==='played').length,state.schedule.length);
    const fixtureNumericFields=SEASON_STAT_FIELDS.filter(field=>!['appearances','starts'].includes(field));
    assert.ok(state.schedule.every(match=>match.playerStats&&typeof match.playerStats.starts==='boolean'&&fixtureNumericFields.every(field=>Number.isFinite(match.playerStats[field]))));
    for(const field of Object.keys(totals[position]))totals[position][field]+=state.season[field];
  }
  assert.equal(totals.ST.saves+totals.CM.saves+totals.CB.saves,0);
  assert.ok(totals.GK.saves>totals.CB.saves);
  assert.ok(totals.ST.shots>totals.CB.shots);
  assert.ok(totals.CB.tackles>totals.ST.tackles);
  assert.ok(totals.CB.interceptions>totals.CM.interceptions);
  assert.ok(totals.CM.keyPasses>totals.ST.keyPasses);
  assert.ok(totals.GK.cleanSheets>0&&totals.CB.cleanSheets>0);
});

test('phase 4 shared recorder applies interactive match fields once',()=>{
  const state=seasonState(0,'CM'),fixture=state.schedule[0];
  assert.equal(recordMatchResult(state,fixture,{played:true,starts:true,minutes:90,goals:1,assists:1,shots:3,keyPasses:4,tackles:2,interceptions:1,saves:0,cleanSheets:0,rating:8.6,score:'2-0'}),true);
  assert.equal(recordMatchResult(state,fixture,{played:true,rating:9}),false);
  assert.deepEqual({appearances:state.season.appearances,starts:state.season.starts,minutes:state.season.minutes,goals:state.season.goals,assists:state.season.assists,shots:state.season.shots,keyPasses:state.season.keyPasses,tackles:state.season.tackles,interceptions:state.season.interceptions,playerOfMatch:state.season.playerOfMatch},{appearances:1,starts:1,minutes:90,goals:1,assists:1,shots:3,keyPasses:4,tackles:2,interceptions:1,playerOfMatch:1});
  assert.deepEqual(fixture.playerStats,{played:true,starts:true,minutes:90,rating:8.6,yellowCards:0,redCards:0,playerOfMatch:1,injuryAbsences:0,goals:1,assists:1,shots:3,keyPasses:4,tackles:2,interceptions:1,saves:0,cleanSheets:0});
});
