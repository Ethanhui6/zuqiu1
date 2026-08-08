import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { CareerDirector } from '../src/core/simulationController.js';
import { EventEngine } from '../src/core/eventEngine.js';
import { resolveTrainingOpportunity } from '../src/core/trainingOpportunities.js';
import { createInjury, recordInjury } from '../src/core/injuryEngine.js';
import { acceptTransferOffer } from '../src/core/transferInboxEngine.js';
import { completeOffSeason, retireCareer, settleSeason } from '../src/systems/honors/honorsSystem.js';
import { buildCareerTimeline } from '../src/pages/career.js';
import { CLUBS } from '../src/data/clubs.js';

const scenarios = [
  { id: 'high-st', position: 'ST', ovr: 68, potential: 94, profile: 'wonderkid', start: 'arsenal', transfer: 'barcelona' },
  { id: 'low-rw-stay', position: 'RW', ovr: 57, potential: 67, profile: 'plateau', start: 'ajax', longStay: true },
  { id: 'late-cm', position: 'CM', ovr: 59, potential: 88, profile: 'late-bloomer', start: 'benfica', transfer: 'bayern' },
  { id: 'injured-cb', position: 'CB', ovr: 63, potential: 82, profile: 'injury-setback', start: 'dortmund', injury: true },
  { id: 'keeper', position: 'GK', ovr: 66, potential: 91, profile: 'late-bloomer', start: 'psg', longStay: true },
  { id: 'elite-st', position: 'ST', ovr: 72, potential: 96, profile: 'wonderkid', start: 'real-madrid', longStay: true },
  { id: 'international-rw', position: 'RW', ovr: 67, potential: 90, profile: 'balanced', start: 'river', transfer: 'liverpool' },
  { id: 'one-club-cm', position: 'CM', ovr: 64, potential: 84, profile: 'balanced', start: 'inter', longStay: true },
  { id: 'low-cb-injury', position: 'CB', ovr: 56, potential: 66, profile: 'injury-setback', start: 'boca', injury: true },
  { id: 'keeper-transfer', position: 'GK', ovr: 64, potential: 86, profile: 'balanced', start: 'atalanta', transfer: 'man-city' }
];

function club(id) {
  const result = CLUBS.find(item => item.id === id);
  assert.ok(result, `missing club ${id}`);
  return result;
}

function career(config) {
  const state = createDefaultState();
  state.settings.mode = 'fast';
  const current = club(config.start);
  const attributes = { speed: config.ovr, shooting: config.ovr, passing: config.ovr, dribbling: config.ovr, defending: config.ovr, physical: config.ovr };
  state.createdAt = `2026-07-01T00:00:00.000Z:${config.id}`;
  state.random.seed = `phase-27:${config.id}`;
  state.player = { name: `Phase 27 ${config.id}`, club: current.name, clubId: current.id, clubCountry: current.country, country: '中国', nation: '中国', nationality: '中国', age: 16, number: 1, team: '一线队', position: config.position, potential: config.potential, dynamicPotential: config.potential, developmentProfile: config.profile, ovr: config.ovr, stats: attributes, previousStats: { ...attributes }, fatigue: 8, fitness: 94, morale: 76, coachTrust: 70 };
  state.season = { ...state.season, startOvr: config.ovr, startStats: { ...attributes } };
  return state;
}

async function completeCareer(config) {
  const state = career(config);
  const events = new EventEngine();
  const director = new CareerDirector({ get: () => state, set: update => update(state) }, events);
  let injectedInjury = false, transferred = false;
  while (state.player.age < 38) {
    if (config.injury && !injectedInjury && state.player.age === 23) {
      recordInjury(state, createInjury({ type: '膝关节韧带伤', severity: 'major', bodyPart: '膝关节', date: state.simulation.date }));
      injectedInjury = true;
    }
    while (true) {
      const result = await director.advance('seasonEnd');
      if (result.stopReason === 'training') {
        assert.ok(resolveTrainingOpportunity(state, state.training.currentOpportunity.choices[0].id));
        continue;
      }
      if (result.stopReason === 'event') {
        while (state.events.pending.length) {
          const event = state.events.pending[0];
          events.resolve(state, event.id, event.choices[0].id);
        }
        continue;
      }
      assert.equal(result.stopReason, 'target');
      break;
    }
    assert.equal(settleSeason(state).alreadySettled, false);
    if (config.transfer && !transferred && state.player.age === 21) {
      const target = club(config.transfer);
      const offer = { id: `phase27-offer-${config.id}`, clubId: target.id, status: 'pending', salary: 32000, contractMonths: 48 };
      state.transfer.offers.push(offer);
      assert.ok(acceptTransferOffer(state, target, offer.id));
      transferred = true;
    }
    assert.equal(completeOffSeason(state), true);
  }
  const retirement = retireCareer(state);
  const blocked = await director.advance('seasonEnd');
  assert.equal(blocked.stopReason, 'retirement');
  const timeline = buildCareerTimeline(state);
  return { config, state, retirement, timeline, injectedInjury, transferred };
}

test('phase 27 accepts a real transfer into the production career state', () => {
  const state = career(scenarios[0]);
  const target = club('barcelona');
  state.schedule = [{ id: 'future', status: 'upcoming' }, { id: 'played', status: 'played' }];
  state.transfer.offers.push({ id: 'offer', clubId: target.id, status: 'pending', salary: 42000, contractMonths: 48 });
  const record = acceptTransferOffer(state, target, 'offer');
  assert.equal(state.player.clubId, target.id);
  assert.equal(state.career.weeklySalary, 42000);
  assert.equal(state.career.contractMonths, 48);
  assert.equal(state.transfer.offers[0].status, 'accepted');
  assert.equal(state.schedule.length, 1);
  assert.equal(state.season.transfer.clubId, target.id);
  assert.equal(record.type, '转会');
});

test('phase 27 completes ten differentiated production careers from age sixteen to retirement', { timeout: 120_000 }, async () => {
  const careers = [];
  for (const scenario of scenarios) careers.push(await completeCareer(scenario));

  for (const result of careers) {
    const { state, retirement, timeline, config } = result;
    assert.equal(state.player.age, 38, config.id);
    assert.equal(retirement.seasons, 22, config.id);
    assert.ok(retirement.totals.appearances >= 440, `${config.id}: appearances`);
    assert.equal(state.career.honors.seasons.length, 22, `${config.id}: season reviews`);
    assert.ok(state.career.growthLog.length >= 22, `${config.id}: growth`);
    assert.ok(state.news.items.length >= 50, `${config.id}: news`);
    assert.equal(timeline.filter(node => node.type === 'season').length, 22, `${config.id}: timeline seasons`);
    assert.equal(timeline.filter(node => node.type === 'retirement').length, 1, `${config.id}: retirement node`);
    assert.equal(timeline.some(node => node.type == null), false, `${config.id}: null timeline type`);
    assert.equal(state.simulation.paused, true, `${config.id}: simulation stopped`);
    assert.equal(state.schedule.some(match => match.status === 'upcoming'), false, `${config.id}: future fixtures removed`);
    assert.doesNotThrow(() => structuredClone(state));
  }

  assert.deepEqual(new Set(careers.map(item => item.config.position)), new Set(['ST', 'RW', 'CM', 'CB', 'GK']));
  assert.ok(careers.some(item => item.config.potential >= 94));
  assert.ok(careers.some(item => item.config.potential <= 67));
  assert.ok(careers.some(item => item.config.profile === 'late-bloomer'));
  assert.ok(careers.some(item => club(item.config.start).competition >= 82));
  assert.ok(careers.filter(item => item.config.longStay).every(item => new Set(item.state.career.honors.seasons.map(season => season.clubId)).size === 1));
  assert.ok(careers.filter(item => item.config.transfer).every(item => item.transferred && new Set(item.state.career.honors.seasons.map(season => season.clubId)).size >= 2));
  assert.ok(careers.some(item => item.state.career.history.some(record => record.type === '转会' && record.fromCountry && record.country && record.fromCountry !== record.country)));
  assert.ok(careers.filter(item => item.config.injury).every(item => item.injectedInjury && item.state.career.injuryLog.length > 0 && item.state.career.honors.seasons.some(season => season.injuries.length > 0)));
  assert.ok(careers.some(item => item.state.career.honors.seasons.some(season => season.nationalTeam.calledUp)));
  assert.ok(careers.some(item => item.state.career.honors.trophies.length + item.state.career.honors.personalAwards.length > 0));
});
