import test from 'node:test';
import assert from 'node:assert/strict';
import { FAST_SEASON_PACE, assessFastSeasonPace } from '../src/core/simulationController.js';
import { EventEngine, estimateEventChance } from '../src/core/eventEngine.js';
import { createDefaultState } from '../src/core/store.js';
import { createTrainingOpportunity, MAX_SEASON_TRAINING_NODES, resolveTrainingOpportunity } from '../src/core/trainingOpportunities.js';
import { EVENT_TEMPLATES } from '../src/data/events.js';

function state() {
  const save = createDefaultState();
  save.settings.mode = 'fast';
  save.player = { name: 'PH8', position: 'CM', age: 17, ovr: 64, potential: 88, dynamicPotential: 88, style: '组织核心', stats: { speed: 64, shooting: 60, passing: 68, dribbling: 64, defending: 55, physical: 62 }, fatigue: 12, fitness: 90, morale: 72, coachTrust: 58 };
  save.simulation.date = '2026-08-12';
  save.season.week = 6;
  return save;
}

test('PH8 offers one main training plan per season and keeps later growth automatic', () => {
  const save = state();
  const opportunity = createTrainingOpportunity(save, { seed: 'phase8-main-plan' });
  assert.ok(opportunity);
  assert.equal(MAX_SEASON_TRAINING_NODES, 1);
  assert.equal(resolveTrainingOpportunity(save, opportunity.choices[0].id)?.id, opportunity.choices[0].id);
  assert.equal(createTrainingOpportunity(save, { seed: 'phase8-second-plan' }), null);
  assert.equal(save.training.seasonTrainingCount, 1);
  assert.deepEqual(FAST_SEASON_PACE.trainingWeeks, [6]);
  assert.equal(FAST_SEASON_PACE.maxTrainingNodes, 1);
  assert.equal(assessFastSeasonPace({ advanceActions: 2, trainingChoices: 1, eventChoices: 0 }).estimatedSeconds, 15);
});

test('PH8 event choices expose deterministic chance input for the decision UI', () => {
  const save = state();
  const engine = new EventEngine();
  const event = engine.schedule(save, { priority: 'important', forceTemplate: EVENT_TEMPLATES[0] });
  assert.ok(event);
  const chance = estimateEventChance(save, event, event.choices[0]);
  assert.ok(chance >= .18 && chance <= .9);
  assert.ok(event.choices[0].risk >= 1);
  assert.ok(event.choices[0].rewardTypes.length >= 1);
});
