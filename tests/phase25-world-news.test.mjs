import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { CareerDirector } from '../src/core/simulationController.js';
import { EventEngine } from '../src/core/eventEngine.js';
import { resolveTrainingOpportunity } from '../src/core/trainingOpportunities.js';
import { completeOffSeason, settleSeason } from '../src/systems/honors/honorsSystem.js';
import { addNews, generateWorldNews, homeNews, WORLD_NEWS_TOPICS } from '../src/core/newsEngine.js';

function career() {
  const state = createDefaultState();
  state.settings.mode = 'fast';
  state.player = { name: '测试球员', club: '阿森纳', clubId: 'arsenal', nation: '中国', age: 20, position: 'CM', potential: 88, ovr: 76, fitness: 90, fatigue: 12, morale: 74, coachTrust: 70, stats: { speed: 74, shooting: 68, passing: 82, dribbling: 78, defending: 67, physical: 72 } };
  return state;
}

const clubs = Array.from({ length: 18 }, (_, index) => ({ id: `club-${index}`, cn: `世界球队${index}`, country: `国家${index % 6}`, leagueCn: `世界联赛${index % 4}` }));
clubs.unshift({ id: 'arsenal', cn: '阿森纳', country: '英格兰', leagueCn: '英格兰超级联赛' });
const players = clubs.slice(1).map((club, index) => ({ id: `player-${index}`, cn: `世界球员${index}`, clubId: club.id, nation: club.country, ovr: 72 + index % 15 }));

test('phase 25 produces diverse, unique world news across three seasons without player dominance', () => {
  const state = career();
  for (let season = 0; season < 3; season += 1) {
    state.season.year = `${2026 + season}/${String(27 + season).padStart(2, '0')}`;
    for (let month = 1; month <= 12; month += 1) {
      const date = `${2026 + season}-${String(month).padStart(2, '0')}-01`;
      state.simulation.date = date;
      generateWorldNews(state, clubs, players, date);
      addNews(state, { id: `player-${season}-${month}`, type: '比赛', title: `${state.season.year}${month}月个人比赛`, copy: `${state.player.name}完成当月关键比赛。`, scope: 'player' });
    }
  }

  const world = state.news.items.filter(item => item.scope === 'world');
  const player = state.news.items.filter(item => item.scope !== 'world');
  assert.equal(world.length, 72);
  assert.deepEqual([...new Set(world.map(item => item.topic))].sort(), [...WORLD_NEWS_TOPICS].sort());
  assert.equal(new Set(state.news.items.map(item => item.id)).size, state.news.items.length);
  assert.equal(new Set(state.news.items.map(item => item.title)).size, state.news.items.length);
  assert.equal(new Set(state.news.items.map(item => item.copy)).size, state.news.items.length);
  assert.ok(world.length > player.length);
  assert.ok(world.every(item => item.relatedClubId !== state.player.clubId && !item.title.includes(state.player.name)));
  assert.ok(homeNews(state).length >= 3 && homeNews(state).length <= 5);

  const before = state.news.items.length;
  const original = addNews(state, { id: 'dedupe-original', title: '唯一标题', copy: '同一句新闻内容。' });
  const duplicate = addNews(state, { id: 'dedupe-copy', title: '另一个标题', copy: '  同一句新闻内容。  ' });
  assert.equal(duplicate.id, original.id);
  assert.equal(state.news.items.length, before + 1);
});

test('phase 25 world news remains diverse through three real CareerDirector seasons', async () => {
  const state = career();
  const events = new EventEngine();
  const director = new CareerDirector({ get: () => state, set: update => update(state) }, events);
  for (let season = 0; season < 3; season += 1) {
    while (true) {
      const result = await director.advance('seasonEnd');
      if (result.stopReason === 'training') {
        resolveTrainingOpportunity(state, state.training.currentOpportunity.choices[0].id);
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
      assert.equal(settleSeason(state).alreadySettled, false);
      assert.equal(completeOffSeason(state), true);
      break;
    }
  }
  const world = state.news.items.filter(item => item.scope === 'world');
  const player = state.news.items.filter(item => item.scope !== 'world');
  assert.deepEqual([...new Set(world.map(item => item.topic))].sort(), [...WORLD_NEWS_TOPICS].sort());
  assert.ok(world.length > player.length, `${world.length} world vs ${player.length} player stories`);
});
