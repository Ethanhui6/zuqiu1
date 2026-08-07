import test from 'node:test';
import assert from 'node:assert/strict';
import { CareerDirector, SimulationController } from '../src/core/simulationController.js';
import { createDefaultState } from '../src/core/store.js';

test('phase 2 CareerDirector auto-simulates ordinary matches and stops only for key matches', async () => {
  const state=createDefaultState();
  state.settings={...state.settings,mode:'standard',autoSkipLow:true};
  state.player={...state.player,name:'Director Player',club:'Director FC',clubId:'director-fc',position:'CM',age:16,ovr:62,potential:88,stats:{speed:62,shooting:55,passing:68,dribbling:64,defending:55,physical:60},previousStats:{speed:62,shooting:55,passing:68,dribbling:64,defending:55,physical:60},fatigue:12,fitness:86,morale:70,coachTrust:52};
  state.schedule=[
    {id:'ordinary',date:'2026-07-08',competition:'青年联赛',opponent:'河畔竞技',status:'upcoming',important:false},
    {id:'key',date:'2026-07-15',competition:'国内杯决赛',opponent:'北城学院',status:'upcoming',important:true}
  ];
  const director=new CareerDirector({get:()=>state,set:updater=>updater(state)},{schedule:()=>null});
  assert.equal(CareerDirector,SimulationController,'legacy imports resolve to the active director');
  assert.equal(director.nextNode(state).action,'seasonEnd');
  const result=await director.advance('seasonEnd');
  assert.equal(result.stopReason,'match');
  assert.equal(result.match.id,'key');
  assert.equal(result.autoMatches,1);
  assert.equal(state.schedule.find(match=>match.id==='ordinary').status,'played');
  assert.equal(state.schedule.find(match=>match.id==='key').status,'upcoming');
});
