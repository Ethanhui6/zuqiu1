import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCareerTimeline, careerPage, seasonHistory } from '../src/pages/career.js';
import { settleSeason } from '../src/systems/honors/honorsSystem.js';

function state() {
  return { simulation: { date: '2027-06-30' }, player: { name: 'Timeline Player', club: 'Timeline FC', clubId: 'timeline-fc', crestPath: './assets/clubs/test/crest.svg', age: 20, position: 'RW', potential: 88, ovr: 74, stats: { speed: 80, shooting: 74, passing: 73, dribbling: 79, defending: 48, physical: 68 } }, season: { year: '2026/27', appearances: 25, goals: 12, assists: 8, rating: 7.8, startOvr: 70, startMarketValue: 900000, startStats: { speed: 75, shooting: 70, passing: 69, dribbling: 74, defending: 47, physical: 66 }, highlights: ['完成职业生涯首个帽子戏法'], transfer: { club: 'Elite FC' } }, career: { marketValue: 1500000, contractMonths: 24, history: [], honors: null }, training: {}, transfer: { offers: [] }, ui: {} };
}

test('phase 11 timeline renders each season age, crest, OVR, data, honors and major nodes', () => {
  const save = state();
  settleSeason(save);
  const html = seasonHistory(save);
  for (const value of ['20岁', './assets/clubs/test/crest.svg', 'OVR 70', 'Golden Boot', '重大节点', '完成职业生涯首个帽子戏法', '转会至 Elite FC']) assert.match(html, new RegExp(value));
  assert.ok(buildCareerTimeline(save).some(node => node.type === 'season'));
  assert.equal(typeof careerPage, 'function');
});
