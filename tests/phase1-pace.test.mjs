import test from 'node:test';
import assert from 'node:assert/strict';
import { FAST_SEASON_PACE, assessFastSeasonPace, SimulationController } from '../src/core/simulationController.js';
import { createDefaultState } from '../src/core/store.js';
import { resolveTrainingOpportunity } from '../src/core/trainingOpportunities.js';

test('phase 1 fast season uses the fixed short-management pacing budget', async () => {
  const state=createDefaultState();
  state.settings={...state.settings,mode:'fast',autoSkipLow:true,autoPauseCritical:true};
  state.player={...state.player,name:'Pace Player',club:'Pace FC',clubId:'pace-fc',position:'CM',age:16,ovr:62,potential:88,stats:{speed:62,shooting:55,passing:68,dribbling:64,defending:55,physical:60},previousStats:{speed:62,shooting:55,passing:68,dribbling:64,defending:55,physical:60},fatigue:12,fitness:86,morale:70,coachTrust:52};
  state.schedule=[];
  const store={get:()=>state,set:updater=>updater(state)};
  let scheduledEvents=0;
  const controller=new SimulationController(store,{schedule:()=>{scheduledEvents++;return null;}});
  let advanceActions=0,trainingChoices=0,autoMatches=0;
  while(true){
    const result=await controller.advance('seasonEnd');
    advanceActions++;autoMatches+=result.autoMatches||0;
    if(result.stopReason==='training'){
      assert.ok(resolveTrainingOpportunity(state,state.training.currentOpportunity.choices[0].id));
      trainingChoices++;
      continue;
    }
    assert.equal(result.stopReason,'target');
    break;
  }
  const pacing=assessFastSeasonPace({advanceActions,trainingChoices,eventChoices:0});
  assert.deepEqual(FAST_SEASON_PACE.expectedActions,{advance:4,training:1,events:2});
  assert.deepEqual({advanceActions,trainingChoices},{advanceActions:2,trainingChoices:1});
  assert.equal(pacing.estimatedSeconds,15);
  assert.equal(pacing.withinTarget,true);
  assert.ok(autoMatches>=34,'ordinary fixtures must settle automatically');
  assert.equal(scheduledEvents,2,'fast mode must expose two deliberate career-event windows');
});
