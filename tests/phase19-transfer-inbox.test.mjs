import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createDefaultState } from '../src/core/store.js';
import { TRANSFER_STAGES, generateTransferActivity, recordTransferNegotiation, transferInterestScore } from '../src/core/transferInboxEngine.js';

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
  for (let index = 0; index < 100; index++) {
    const year = 2026 + Math.floor(index / 2);
    const month = index % 2 ? '01' : '07';
    state.simulation.date = `${year}-${month}-01`;
    state.player.age = 19 + Math.min(14, Math.floor(index / 7));
    state.player.ovr = 68 + index % 17;
    state.player.potential = Math.max(state.player.ovr, 90 - Math.floor(index / 10));
    state.season.rating = 6.5 + (index % 12) * .12;
    state.season.appearances = 12 + index % 27;
    state.career.contractMonths = 6 + index % 30;
    activities.push(...generateTransferActivity(state, clubs, state.simulation.date));
  }
  const stages = new Set(activities.map(item => item.stage));
  assert.deepEqual(stages, new Set(TRANSFER_STAGES.map(stage => stage.id)));
  assert.ok(activities.some(item => item.market === 'domestic'));
  assert.ok(activities.some(item => item.market === 'overseas'));
  assert.ok(activities.some(item => item.level === 'higher'));
  assert.ok(activities.some(item => item.level === 'lower'));
  assert.ok(state.transfer.offers.some(offer => offer.source === 'system' && offer.status === 'pending'));
  assert.equal(state.transfer.offers.some(offer => offer.clubId === current.id), false);
  assert.equal(new Set(state.transfer.inbox.map(item => item.id)).size, state.transfer.inbox.length);
  const record = recordTransferNegotiation(state, state.transfer.offers[0].id, '谈判');
  assert.equal(record.status, 'negotiating');
  assert.equal(state.transfer.offers[0].status, 'negotiating');
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
