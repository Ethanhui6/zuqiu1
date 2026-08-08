import test from 'node:test';
import assert from 'node:assert/strict';
import { assessFastSeasonPace, CareerDirector } from '../src/core/simulationController.js';
import { EventEngine } from '../src/core/eventEngine.js';
import { createDefaultState } from '../src/core/store.js';
import { resolveTrainingOpportunity } from '../src/core/trainingOpportunities.js';
import { completeOffSeason, retireCareer, settleSeason } from '../src/systems/honors/honorsSystem.js';

function careerState(seed){
  const state=createDefaultState();
  state.settings={...state.settings,mode:'fast',autoSkipLow:true,autoPauseCritical:true};
  state.player={name:`Pace ${seed}`,club:'Arsenal',clubId:'arsenal',country:'England',league:'Premier League',age:16,position:['ST','CM','CB','GK'][seed%4],potential:86,ovr:64,stats:{speed:64,shooting:62,passing:65,dribbling:64,defending:61,physical:64},previousStats:{speed:64,shooting:62,passing:65,dribbling:64,defending:61,physical:64},fatigue:8,fitness:92,morale:70,coachTrust:54};
  state.season={...state.season,startOvr:64,startMarketValue:state.career.marketValue,startStats:{...state.player.stats}};
  return state;
}

async function runCareer(seed,endAge){
  const state=careerState(seed),events=new EventEngine(),director=new CareerDirector({get:()=>state,set:update=>update(state)},events),seasons=[];
  while(state.player.age<endAge){
    const season={year:state.season.year,advanceActions:0,trainingChoices:0,eventChoices:0,interactiveMatches:0,autoMatches:0};
    while(true){
      const result=await director.advance('seasonEnd');
      season.advanceActions++;season.autoMatches+=Number(result.autoMatches||0);
      if(result.stopReason==='training'){
        assert.ok(resolveTrainingOpportunity(state,state.training.currentOpportunity.choices[0].id));
        season.trainingChoices++;
        continue;
      }
      if(result.stopReason==='event'){
        while(state.events.pending.length){
          const event=state.events.pending[0];
          events.resolve(state,event.id,event.choices[0].id);
          season.eventChoices++;
        }
        continue;
      }
      assert.equal(result.stopReason,'target');
      assert.equal(settleSeason(state).alreadySettled,false);
      assert.equal(completeOffSeason(state),true);
      break;
    }
    const pace=assessFastSeasonPace(season);
    assert.equal(season.trainingChoices,1,`${season.year}: training`);
    assert.ok(season.eventChoices>=2&&season.eventChoices<=4,`${season.year}: ${season.eventChoices} events`);
    assert.equal(season.interactiveMatches,0);
    assert.ok(season.autoMatches>=34,`${season.year}: ${season.autoMatches} automatic fixtures`);
    assert.ok(season.advanceActions>=2&&season.advanceActions<=4,`${season.year}: ${season.advanceActions} advance actions`);
    assert.equal(pace.withinTarget,true,`${season.year}: ${pace.estimatedSeconds} seconds`);
    seasons.push({...season,estimatedSeconds:pace.estimatedSeconds});
  }
  return {state,seasons};
}

test('phase 5 runs five careers from 16 to 30 without weekly input',async()=>{
  for(let seed=0;seed<5;seed++){
    const {state,seasons}=await runCareer(seed,30);
    assert.equal(state.player.age,30);
    assert.equal(seasons.length,14);
    assert.ok(seasons.every(season=>season.estimatedSeconds>=15&&season.estimatedSeconds<=30));
  }
});

test('phase 5 runs one fast career from 16 to retirement',async()=>{
  const {state,seasons}=await runCareer(9,38),retirement=retireCareer(state);
  assert.equal(state.player.age,38);
  assert.equal(seasons.length,22);
  assert.equal(retirement.age,38);
  assert.equal(retirement.seasons,22);
  assert.ok(retirement.totals.appearances>=20*22);
});
