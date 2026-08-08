import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { CLUB_TRANSFER_TABS, acceptTransferOffer, ensureContractOffer, requestTransferInterest } from '../src/core/transferInboxEngine.js';
import { CLUBS } from '../src/data/clubs.js';

function careerState() {
  const current = CLUBS[0];
  const state = createDefaultState();
  state.simulation.date = '2026-07-01';
  state.player = { name: 'PH9', clubId: current.id, club: current.cn || current.name, country: current.country, position: 'ST', age: 20, ovr: 78, potential: 90, status: '主力', fitness: 88, coachTrust: 70 };
  state.career.contractMonths = 6;
  state.career.weeklySalary = 18000;
  return { state, current };
}

test('PH9 exposes one unified club and transfer menu with seven stable tabs', () => {
  assert.deepEqual(CLUB_TRANSFER_TABS.map(tab => tab.id), ['current', 'role', 'squad', 'contract', 'interest', 'offers', 'agent']);
});

test('PH9 creates a renewal offer at six months and resolves an expired contract at zero', () => {
  const { state, current } = careerState();
  const offer = ensureContractOffer(state, CLUBS);
  assert.equal(offer.clubId, current.id);
  assert.equal(offer.source, 'contract');
  assert.equal(state.transfer.contractOffer.id, offer.id);
  acceptTransferOffer(state, current, offer.id);
  assert.equal(state.career.contractMonths, 24);
  assert.equal(state.career.contractStatus, 'active');
  state.career.contractMonths = 0;
  const expired = ensureContractOffer(state, CLUBS, '2028-07-01');
  assert.equal(expired.type, 'expired-renewal');
  assert.equal(expired.clubId, current.id);
});

test('PH9 keeps current club out of external requests and records loan or transfer intent', () => {
  const { state, current } = careerState();
  const target = CLUBS.find(club => club.id !== current.id && club.country !== current.country) || CLUBS[1];
  assert.equal(requestTransferInterest(state, CLUBS, current.id).reason, 'current-club');
  const result = requestTransferInterest(state, CLUBS, target.id, { loan: true });
  assert.equal(result.ok, true);
  assert.equal(result.item.requestType, 'loan');
  assert.equal(requestTransferInterest(state, CLUBS, target.id, { loan: true }).reason, 'duplicate');
  assert.equal(state.transfer.inbox.some(item => item.clubId === current.id && item.source === 'player-request'), false);
});
