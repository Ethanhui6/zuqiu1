import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createDefaultState } from '../src/core/store.js';
import { TRANSFER_MARKET_HEAT_LEVELS, TRANSFER_STAGES, generateTransferActivity, recordTransferNegotiation, resolveTransferNegotiation, transferInterestScore, transferMarketHeat, transferNegotiationChoices } from '../src/core/transferInboxEngine.js';

const data = JSON.parse(await fs.readFile(new URL('../data/clubs.json', import.meta.url), 'utf8'));
const clubs = data.clubs;

function careerState() {
  const current = clubs.find(club => club.id === 'CHN1-SHA') || clubs[0];
  const state = createDefaultState();
  state.createdAt = '2026-07-01T00:00:00.000Z';
  state.random.seed = 'phase-19-100-windows';
  state.player = { name: 'Market Test', club: current.cn || current.name, clubId: current.id, country: current.country, nation: current.country, nationality: current.country, position: 'ST', age: 19, ovr: 76, potential: 90 };
  state.season = { ...state.season, appearances: 28, goals: 14, assists: 7, rating: 7.4 };
  state.career = { ...state.career, contractMonths: 12, marketValue: 18000000, weeklySalary: 18000 };
  return { state, current };
}

test('phase 19 simulates 100 windows with staged domestic, overseas, high and low interest', () => {
  const { state, current } = careerState();
  const activities = [];
  const windowCounts = [];
  assert.equal(transferMarketHeat(state).label, '冷淡');
  for (let index = 0; index < 100; index++) {
    const year = 2026 + Math.floor(index / 2);
    const month = index % 2 ? '01' : '07';
    state.simulation.date = `${year}-${month}-01`;
    const profile = index % 10;
    state.player.age = profile < 2 ? 24 : 19 + Math.min(14, Math.floor(index / 7));
    state.player.ovr = profile === 0 ? 40 : profile === 1 ? 45 : 68 + index % 17;
    state.player.potential = profile < 2 ? state.player.ovr : Math.max(state.player.ovr, 90 - Math.floor(index / 10));
    state.season.rating = profile < 2 ? 6.2 : 6.5 + (index % 12) * .12;
    state.season.appearances = profile < 2 ? 2 : 12 + index % 27;
    state.season.goals = profile < 2 ? 0 : 6 + index % 15;
    state.season.assists = profile < 2 ? 0 : 3 + index % 9;
    state.career.contractMonths = 6 + index % 30;
    const created = generateTransferActivity(state, clubs, state.simulation.date);
    windowCounts.push(created.length);
    activities.push(...created);
  }
  const stages = new Set(activities.map(item => item.stage));
  assert.deepEqual(stages, new Set(TRANSFER_STAGES.map(stage => stage.id)));
  assert.ok(activities.some(item => item.market === 'domestic'));
  assert.ok(activities.some(item => item.market === 'overseas'));
  assert.ok(activities.some(item => item.level === 'higher'));
  assert.ok(activities.some(item => item.level === 'lower'));
  assert.ok(windowCounts.includes(0));
  assert.ok(windowCounts.includes(1));
  assert.ok(windowCounts.some(count => count > 1));
  assert.ok(state.transfer.offers.some(offer => offer.source === 'system' && offer.status === 'pending'));
  assert.equal(state.transfer.offers.some(offer => offer.clubId === current.id), false);
  assert.equal(new Set(state.transfer.inbox.map(item => item.id)).size, state.transfer.inbox.length);
  const record = recordTransferNegotiation(state, state.transfer.offers[0].id, '谈判');
  assert.equal(record.status, 'negotiating');
  assert.equal(state.transfer.offers[0].status, 'negotiating');
  assert.deepEqual(TRANSFER_MARKET_HEAT_LEVELS.map(level => level.label), ['冷淡', '观察', '升温', '热门', '抢手']);
  assert.ok(['热门', '抢手'].includes(transferMarketHeat(state).label));
});

test('phase 19 market score responds to performance, contract, position need and nationality fit', () => {
  const { state, current } = careerState();
  const target = clubs.find(club => club.id !== current.id && (club.needs || []).includes('ST'));
  const baseline = transferInterestScore(state, target, current);
  const weaker = structuredClone(state);
  weaker.season = { ...weaker.season, rating: 5.9, appearances: 2, goals: 0, assists: 0 };
  weaker.career.contractMonths = 48;
  weaker.player.position = 'GK';
  weaker.player.country = 'not-target-country';
  weaker.player.nation = 'not-target-country';
  assert.ok(baseline > transferInterestScore(weaker, target, current));
});

test('phase 7 distributes 1000 dynamic transfer negotiations instead of repeating one probability', () => {
  const probabilitySets = [[], [], []];
  let identicalEvents = 0;
  for (let index = 0; index < 1000; index++) {
    const { state, current } = careerState();
    const candidates = clubs.filter(club => club.id !== current.id);
    const target = candidates[(index * 17) % candidates.length];
    state.random.seed = `phase-7-${index}`;
    state.simulation.date = `${2026 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}-01`;
    state.player.ovr = 55 + index % 36;
    state.player.potential = Math.min(96, state.player.ovr + index % 15);
    state.player.age = 17 + index % 20;
    state.player.morale = 35 + index % 61;
    state.player.fitness = 45 + index % 51;
    state.player.reputation = 25 + index % 71;
    state.season.rating = 5.8 + (index % 27) / 10;
    state.career.contractMonths = index % 49;
    state.career.agent = { negotiation: 25 + index % 71 };
    state.relationships.management = 25 + index % 71;
    const offer = { id: `negotiation-${index}`, clubId: target.id, role: '替补', interestScore: 55 + index % 41 };
    const choices = transferNegotiationChoices(state, target, offer);
    const probabilities = choices.map(choice => choice.probability);
    if (new Set(probabilities).size === 1) identicalEvents++;
    assert.equal(choices.length, 3);
    assert.ok(probabilities[0] > probabilities[1] && probabilities[1] > probabilities[2]);
    probabilities.forEach((value, choiceIndex) => probabilitySets[choiceIndex].push(value));
  }
  assert.equal(identicalEvents, 0);
  assert.ok(new Set(probabilitySets.flat()).size > 60);
  for (const values of probabilitySets) {
    assert.ok(Math.max(...values) - Math.min(...values) >= 20);
    const frequencies = new Map();
    for (const value of values) frequencies.set(value, (frequencies.get(value) || 0) + 1);
    assert.ok(Math.max(...frequencies.values()) < 200);
  }
});

test('phase 7 negotiation uses player, agent, club, contract and relationship context and resolves deterministically', () => {
  const { state, current } = careerState();
  const target = clubs.find(club => club.id !== current.id && (club.needs || []).includes('ST')) || clubs.find(club => club.id !== current.id);
  const offer = { id: 'phase-7-resolution', clubId: target.id, role: '替补', interestScore: 76, status: 'pending' };
  const strong = structuredClone(state);
  Object.assign(strong.player, { ovr: 88, potential: 94, age: 21, morale: 95, fitness: 95, reputation: 90, league: target.league });
  Object.assign(strong.season, { rating: 8.4, appearances: 34, goals: 20, assists: 11 });
  strong.career.contractMonths = 3;
  strong.career.agent = { negotiation: 95 };
  strong.relationships.management = 90;
  const weak = structuredClone(strong);
  Object.assign(weak.player, { ovr: 55, potential: 60, age: 32, morale: 35, fitness: 45, reputation: 25, position: 'GK', league: 'other' });
  Object.assign(weak.season, { rating: 5.8, appearances: 3, goals: 0, assists: 0 });
  weak.career.contractMonths = 48;
  weak.career.agent.negotiation = 25;
  weak.relationships.management = 25;
  const strongProbabilities = transferNegotiationChoices(strong, target, offer).map(choice => choice.probability);
  const weakProbabilities = transferNegotiationChoices(weak, target, offer).map(choice => choice.probability);
  assert.ok(strongProbabilities.every((value, index) => value > weakProbabilities[index]));
  strong.transfer.offers.push(structuredClone(offer));
  const replay = structuredClone(strong);
  const first = resolveTransferNegotiation(strong, target, offer.id, 'request-rotation');
  const second = resolveTransferNegotiation(replay, target, offer.id, 'request-rotation');
  assert.deepEqual([first.success, first.probability, first.roll], [second.success, second.probability, second.roll]);
  assert.equal(strong.transfer.negotiations[0].id, first.id);
  assert.equal(strong.transfer.offers[0].negotiationRound, 1);
});
