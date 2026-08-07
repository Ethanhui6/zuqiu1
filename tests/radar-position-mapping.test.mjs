import test from 'node:test';
import assert from 'node:assert/strict';
import { radarChart } from '../src/components/radar.js';

const stats = {
  speed: 74, shooting: 68, passing: 71, dribbling: 73, defending: 64, physical: 70,
  goalkeeping: { saves: 76, reaction: 75, positioning: 74, handling: 73, aerial: 72, distribution: 71 }
};

test('only goalkeeper positions render the goalkeeper radar', () => {
  assert.match(radarChart(stats, stats, 88, 'GK'), /radar--keeper/);
  for (const position of ['CB', 'LB', 'LWB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'CF']) {
    assert.doesNotMatch(radarChart(stats, stats, 88, position), /radar--keeper/, position);
  }
});
