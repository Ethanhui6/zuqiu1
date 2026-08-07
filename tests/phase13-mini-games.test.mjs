import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MINI_GAME_COUNT, MINI_GAME_LIBRARY, MINI_GAME_STATES, activateMiniGame, createMiniGameSession, resolveMiniGame } from '../src/core/miniGameLibrary.js';
import { MATCH_INTERACTIONS } from '../src/core/matchInteractions.js';
import { TRAINING_GAMES } from '../src/data/trainingGames.js';
import { createDefaultState } from '../src/core/store.js';
import { createTrainingOpportunity } from '../src/core/trainingOpportunities.js';

test('phase 13 ships fifty registered mechanisms and fifty-five production games',()=>{
  assert.equal(MINI_GAME_COUNT,50);assert.equal(TRAINING_GAMES.length,39);assert.equal(TRAINING_GAMES.length+MATCH_INTERACTIONS.length,55);
  assert.equal(new Set(MINI_GAME_LIBRARY.map(game=>game.id)).size,50);assert.ok(new Set(MINI_GAME_LIBRARY.map(game=>game.input)).size>=30);
  for(const game of TRAINING_GAMES)assert.ok(MINI_GAME_LIBRARY.find(item=>item.id===game.mechanic)?.renderers.includes('trainingGame'),game.id);
  const source=fs.readFileSync(new URL('../src/components/trainingGame.js',import.meta.url),'utf8');
  for(const token of['data-football','data-goal','data-player','data-keeper','data-defender','data-route','data-scene-target','advancedPath','advancedStages'])assert.ok(source.includes(token),token);
});

test('phase 13 rotates training variants and preserves READY ACTIVE RESULT',()=>{
  const seen=new Set();
  for(let index=0;index<100;index++){
    const state=createDefaultState();state.player={...state.player,position:['ST','CM','CB','GK'][index%4],fatigue:index%9===0?75:20};state.simulation.date=`2026-${String(1+index%9).padStart(2,'0')}-${String(1+index%27).padStart(2,'0')}`;state.training.seasonTrainingCount=0;
    const opportunity=createTrainingOpportunity(state,{seed:`phase13-${index}`,force:true});for(const choice of opportunity.choices)seen.add(choice.game.id);
    const session=createMiniGameSession(opportunity.choices[0].game.mechanic,'trainingGame'),active=activateMiniGame(session),result=resolveMiniGame(active,{score:60+index%40});
    assert.equal(session.status,MINI_GAME_STATES.READY);assert.equal(active.status,MINI_GAME_STATES.ACTIVE);assert.equal(result.status,MINI_GAME_STATES.RESULT);assert.equal(resolveMiniGame(result,{score:1}),result);
  }
  assert.ok(seen.size>=30,`only ${seen.size} training games surfaced across 100 nodes`);
});
