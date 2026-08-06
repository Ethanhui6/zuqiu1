import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SCENE_REGISTRY, SCENE_COUNT } from '../src/data/sceneRegistry.js';
import { TRAINING_GAMES, TRAINING_GAME_COUNT } from '../src/data/trainingGames.js';
import { INTERACTION_REGISTRY, INTERACTION_COUNT } from '../src/data/interactionRegistry.js';
import { AUDIO_CATALOG } from '../src/core/audioManager.js';
import { animationDirector } from '../src/core/animationDirector.js';
import { createDefaultState, migrateState } from '../src/core/store.js';
import { EventEngine } from '../src/core/eventEngine.js';
import { EVENT_TEMPLATES } from '../src/data/events.js';

test('scene registry ships 56 unique self-authored local assets', () => {
  assert.equal(SCENE_COUNT, 56);
  assert.equal(new Set(SCENE_REGISTRY.map(scene => scene.id)).size, SCENE_COUNT);
  assert.equal(new Set(SCENE_REGISTRY.map(scene => scene.art)).size, SCENE_COUNT);
  for (const scene of SCENE_REGISTRY) assert.equal(fs.existsSync(new URL(`../${scene.art.slice(2)}`, import.meta.url)), true, scene.id);
});

test('training games expose twenty different input mechanisms', () => {
  assert.equal(TRAINING_GAME_COUNT, 20);
  assert.equal(new Set(TRAINING_GAMES.map(game => game.id)).size, TRAINING_GAME_COUNT);
  assert.equal(new Set(TRAINING_GAMES.map(game => game.mechanic)).size, TRAINING_GAME_COUNT);
  assert.ok(TRAINING_GAMES.every(game => game.instruction && game.target && game.risk >= 0));
});

test('interaction and audio registries are actionable and local', () => {
  assert.ok(INTERACTION_COUNT >= 100);
  assert.equal(new Set(INTERACTION_REGISTRY.map(item => item.id)).size, INTERACTION_COUNT);
  assert.ok(INTERACTION_REGISTRY.every(item => item.page && item.trigger && item.effect));
  assert.ok(AUDIO_CATALOG.length >= 20);
  assert.ok(AUDIO_CATALOG.every(item => item.source.includes('项目自制')));
});

test('training animation director export is available in the production module', () => {
  assert.equal(typeof animationDirector.pulse, 'function');
});

test('new training and scene state migrates without damaging old saves', () => {
  const state = migrateState({ training: { sessions: [{ score: 90 }] }, events: { sceneHistory: ['scene-mixed-zone'] } });
  assert.ok(Array.isArray(state.training.sessions));
  assert.ok(Array.isArray(state.events.sceneHistory));
  assert.equal(createDefaultState().training.facilityLevel, 1);
});

test('event scheduling chooses a registered scene and records cooldown history', () => {
  const state = createDefaultState();
  const eventEngine = new EventEngine();
  const template = EVENT_TEMPLATES.find(item => item.category === '媒体');
  const event = eventEngine.schedule(state, { forceTemplate: template });
  assert.ok(event.sceneId.startsWith('scene-'));
  assert.ok(event.art.endsWith('.svg'));
  assert.equal(state.events.sceneHistory.at(-1), event.sceneId);
  assert.ok(state.events.sceneCooldowns[event.sceneId]);
});
