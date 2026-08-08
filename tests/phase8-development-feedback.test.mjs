import test from 'node:test';
import assert from 'node:assert/strict';
import { growthFeedback } from '../src/components/radar.js';
import { applyGrowthToState } from '../src/core/playerDevelopmentEngine.js';
import { createDefaultState } from '../src/core/store.js';
import { completeOffSeason, settleSeason } from '../src/systems/honors/honorsSystem.js';

const ATTRS=['speed','shooting','passing','dribbling','defending','physical'];

function state(){
  const save=createDefaultState();
  save.player={name:'Phase 8',club:'Test FC',clubId:'test-fc',position:'CM',age:16,potential:91,dynamicPotential:91,developmentProfile:'wonderkid',style:'组织核心',stats:{speed:62,shooting:60,passing:65,dribbling:64,defending:58,physical:61},ovr:62,fatigue:12,fitness:92,morale:76,coachTrust:72};
  save.career.growthLog=[];
  return save;
}

function verifyFeedback(html,{before,after,beforeOvr,afterOvr}){
  const header=/data-before-ovr="([^"]+)" data-after-ovr="([^"]+)" data-ovr-delta="([^"]+)"/.exec(html);
  assert.ok(header,'OVR feedback is missing');
  assert.equal(Number(header[1]),beforeOvr);
  assert.equal(Number(header[2]),afterOvr);
  assert.equal(Number(header[3]),afterOvr-beforeOvr);
  const rows=[...html.matchAll(/data-attribute="([^"]+)" data-before="([^"]+)" data-after="([^"]+)" data-delta="([^"]+)"/g)];
  assert.equal(rows.length,6);
  for(const[,key,oldValue,newValue,delta]of rows){
    assert.equal(Number(oldValue),Number(before[key]));
    assert.equal(Number(newValue),Number(after[key]));
    assert.ok(Math.abs(Number(delta)-(Number(after[key])-Number(before[key])))<.001,key);
  }
  assert.match(html,/<animate attributeName="points"/,'radar must morph');
}

test('20 trainings, 20 matches, and 5 season reviews expose consistent animated growth feedback',()=>{
  const contexts=[];
  for(const[source,count,gains]of[['training',20,{passing:.55,dribbling:.42,physical:.18}],['match',20,{passing:.22,defending:.18,physical:.14}]]){
    const save=state();
    for(let index=0;index<count;index++){
      const before={...save.player.stats},beforeOvr=save.player.ovr;
      const result=applyGrowthToState(save,gains,{source:`${source}-${index}`,fatigue:10,facility:82,coachQuality:78,mode:'fast'});
      const html=growthFeedback({before,after:save.player.stats,beforeOvr,afterOvr:save.player.ovr,potential:save.player.potential,position:save.player.position,source});
      verifyFeedback(html,{before,after:save.player.stats,beforeOvr,afterOvr:save.player.ovr});
      assert.equal(result.player.ovr,save.player.ovr);
      contexts.push(source);
    }
  }

  const save=state();
  for(let index=0;index<5;index++){
    save.season={...save.season,year:`${2026+index}/${String(27+index).padStart(2,'0')}`,startOvr:save.player.ovr,startStats:{...save.player.stats},appearances:28,starts:22,minutes:2200,goals:7+index,assists:9,rating:7.35+index*.05,injuryAbsences:0};
    const settled=settleSeason(save),record=settled.record;
    assert.ok(record);
    assert.deepEqual(record.endStats,save.player.stats);
    assert.equal(record.endOvr,save.player.ovr);
    verifyFeedback(growthFeedback({before:record.startStats,after:record.endStats,beforeOvr:record.startOvr,afterOvr:record.endOvr,potential:save.player.potential,position:record.position,source:'season'}),{before:record.startStats,after:record.endStats,beforeOvr:record.startOvr,afterOvr:record.endOvr});
    contexts.push('season');
    completeOffSeason(save);
  }
  assert.deepEqual({training:contexts.filter(item=>item==='training').length,match:contexts.filter(item=>item==='match').length,season:contexts.filter(item=>item==='season').length},{training:20,match:20,season:5});
});
