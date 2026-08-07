import test from 'node:test';
import assert from 'node:assert/strict';
import { completeOffSeason, resolveOffSeasonActivity, settleSeason } from '../src/systems/honors/honorsSystem.js';

function state() {
  return {
    simulation:{date:'2027-06-30'},
    player:{name:'Off Season Player',club:'Off Season FC',clubId:'off-season-fc',age:20,position:'CM',ovr:72,potential:88,stats:{speed:72,shooting:64,passing:76,dribbling:73,defending:62,physical:68},fatigue:82,fitness:40,morale:48},
    injuries:[{id:'injury',status:'active',remainingDays:28,relapseRisk:18,treatment:'steady'}],
    season:{year:'2026/27',appearances:24,goals:8,assists:9,rating:7.4,startOvr:70,startMarketValue:800000,startStats:{speed:70,shooting:62,passing:74,dribbling:71,defending:60,physical:66}},
    career:{marketValue:1200000,contractMonths:24,history:[],honors:null},training:{},ui:{}
  };
}

test('phase 3 creates one review and one to three recoverable off-season activities', () => {
  const save=state();
  const settled=settleSeason(save);
  const offSeason=save.career.offSeason;
  assert.equal(settled.alreadySettled,false);
  assert.equal(save.career.honors.seasons.length,1);
  assert.equal(save.career.history.filter(item=>item.type==='season-summary').length,1);
  assert.ok(offSeason.activities.length>=1&&offSeason.activities.length<=3);
  assert.equal(new Set(offSeason.activities.map(item=>item.id)).size,offSeason.activities.length);
  const fatigueBefore=save.player.fatigue,fitnessBefore=save.player.fitness,injuryBefore=save.injuries[0].remainingDays;
  for (const activity of offSeason.activities) assert.ok(resolveOffSeasonActivity(save,activity.id));
  assert.equal(completeOffSeason(save),true);
  const afterCompletion={fatigue:save.player.fatigue,fitness:save.player.fitness,injuryDays:save.injuries[0].remainingDays};
  assert.equal(offSeason.status,'complete');
  assert.equal(offSeason.completionRecovery,true);
  assert.ok(afterCompletion.fatigue<fatigueBefore);
  assert.ok(afterCompletion.fitness>fitnessBefore);
  assert.ok(afterCompletion.injuryDays<injuryBefore);
  assert.equal(completeOffSeason(save),false);
  assert.deepEqual({fatigue:save.player.fatigue,fitness:save.player.fitness,injuryDays:save.injuries[0].remainingDays},afterCompletion);
});
