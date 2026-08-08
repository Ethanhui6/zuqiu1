import test from 'node:test';
import assert from 'node:assert/strict';
import { CAREER_PACE_RULES, seasonsPerRound } from '../src/core/simulationController.js';
import { buildSeasonTrack } from '../src/core/seasonTrack.js';
import { CAREER_PACE_MODES, PACE_MODES } from '../src/app/config.js';

test('PH5 exposes exactly three player-facing pace modes and keeps legacy loading', () => {
  assert.deepEqual(CAREER_PACE_MODES.map(mode => mode.id), ['immersive', 'standard', 'fast']);
  assert.equal(PACE_MODES.legend.visible, false);
  assert.deepEqual(CAREER_PACE_MODES.map(mode => mode.seasonsPerRound), [1, 2, 3]);
  assert.deepEqual(['immersive', 'standard', 'fast', 'legend'].map(seasonsPerRound), [1, 2, 3, 3]);
  assert.equal(CAREER_PACE_RULES.legend.legacyAlias, 'fast');
});

test('PH5 season track has twelve dated nodes and follows the real schedule', () => {
  const state = {
    simulation: { date: '2026-10-01' },
    season: { year: '2026/27' },
    career: { contractMonths: 5 },
    schedule: [
      { date: '2026-07-08', status: 'played', competition: '英格兰超级联赛', opponent: 'A' },
      { date: '2026-10-24', status: 'upcoming', competition: '英格兰足总杯', opponent: 'B' },
      { date: '2027-03-03', status: 'upcoming', competition: '欧洲冠军联赛', opponent: 'C' }
    ]
  };
  const track = buildSeasonTrack(state);
  assert.equal(track.nodes.length, 12);
  assert.equal(track.nodes[1].date, '2026-07-08');
  assert.equal(track.nodes.find(node => node.id === 'domestic-cup').date, '2026-10-24');
  assert.equal(track.nodes.find(node => node.id === 'continental').date, '2027-03-03');
  assert.ok(track.progress > 0 && track.progress < 100);
  assert.equal(track.currentNode.status, 'current');
  assert.equal(track.nextFixture.opponent, 'B');
  assert.equal(track.reminders.contractMonths, 5);
  assert.ok(track.completedNodes.every(node => node.status === 'complete'));
});

