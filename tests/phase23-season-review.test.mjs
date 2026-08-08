import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultState } from '../src/core/store.js';
import { acknowledgeSeasonReview, completeOffSeason, settleSeason } from '../src/systems/honors/honorsSystem.js';

function career() {
  const state = createDefaultState();
  state.player = { name: 'Review Gate', nation: '中国', club: 'Review FC', clubId: 'review-fc', crestPath: './assets/clubs/england/eng1-ars.svg', age: 16, position: 'CM', potential: 91, ovr: 70, coachTrust: 64, stats: { speed: 70, shooting: 68, passing: 76, dribbling: 74, defending: 65, physical: 69 } };
  Object.assign(state.career, { weeklySalary: 5200, contractMonths: 180, teamRole: '主力轮换', nationalTeam: { team: '中国国家队', calledUp: true } });
  return state;
}

test('phase 23 produces exactly one complete acknowledged review for ten consecutive seasons', () => {
  const state = career();
  const completed = [];
  for (let index = 0; index < 10; index += 1) {
    const year = state.season.year;
    Object.assign(state.season, {
      competition: '测试超级联赛', clubRank: index + 1, appearances: 24 + index, starts: 20 + index, minutes: 1800 + index * 80,
      goals: 6 + index, assists: 8 + index, rating: 7.2 + index * .03, shots: 45 + index, keyPasses: 52 + index,
      tackles: 31 + index, interceptions: 18 + index, yellowCards: 2, redCards: index % 3 ? 0 : 1, injuryAbsences: index % 4,
      suspensions: index % 3 ? 0 : 1, injuries: index % 4 ? [] : [{ type: '脚踝扭伤', status: 'recovered', originalDays: 14 }],
      nationalTeam: { team: '中国国家队', calledUp: true, appearances: index + 2, goals: index }, startCoachTrust: 58,
      highlights: [`第 ${index + 1} 赛季重大节点`], startOvr: state.player.ovr, startMarketValue: state.career.marketValue, startStats: { ...state.player.stats }
    });
    state.player.coachTrust = 64 + index;
    const settled = settleSeason(state);
    const record = settled.record;
    assert.equal(settled.alreadySettled, false);
    assert.equal(state.career.honors.pendingReviewId, record.id);
    assert.deepEqual({ year: record.year, clubRank: record.clubRank, competition: record.competition, appearances: record.appearances, starts: record.starts, minutes: record.minutes }, { year, clubRank: index + 1, competition: '测试超级联赛', appearances: 24 + index, starts: 20 + index, minutes: 1800 + index * 80 });
    assert.deepEqual({ weeklySalary: record.weeklySalary, teamRole: record.teamRole, suspensions: record.suspensions }, { weeklySalary: 5200, teamRole: '主力轮换', suspensions: index % 3 ? 0 : 1 });
    assert.deepEqual(record.nationalTeam, { team: '中国国家队', calledUp: true, appearances: index + 2, goals: index });
    assert.equal(record.positionStats.length, 3);
    assert.equal(record.majorEvents[0], `第 ${index + 1} 赛季重大节点`);
    assert.equal(record.coachTrustStart, 58);
    assert.equal(record.coachTrustEnd, 64 + index);
    assert.ok(Number.isFinite(record.ovrChange));
    assert.ok(record.startStats && record.endStats);
    const nextYear = state.season.year;
    state.season.year = year;
    assert.equal(settleSeason(state).alreadySettled, true);
    assert.equal(state.career.honors.seasons.length, index + 1);
    state.season.year = nextYear;
    assert.equal(acknowledgeSeasonReview(state, record.id), true);
    assert.ok(record.acknowledgedAt);
    assert.equal(state.career.honors.pendingReviewId, null);
    assert.equal(acknowledgeSeasonReview(state, record.id), false);
    assert.equal(completeOffSeason(state), true);
    completed.push(record.id);
  }
  assert.equal(completed.length, 10);
  assert.equal(new Set(completed).size, 10);
  assert.equal(state.career.honors.seasons.length, 10);
  assert.equal(state.player.age, 26);
});

test('phase 23 review remains a mandatory explicit acknowledgement', () => {
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const review = app.slice(app.indexOf('openSeasonReview(record)'), app.indexOf('openCareerShare()', app.indexOf('openSeasonReview(record)')));
  assert.match(review, /dismissible:false/);
  assert.match(review, /acknowledgeSeasonReview/);
  assert.match(app, /pendingReviewId/);
  assert.equal((review.match(/data-season-next/g) || []).length, 2);
});
