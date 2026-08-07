import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultState } from '../src/core/store.js';
import { settleSeason, seasonReviewNext } from '../src/systems/honors/honorsSystem.js';

function state() {
  const save = createDefaultState();
  save.player = { name: 'Review Player', club: 'Review FC', clubId: 'review-fc', age: 20, position: 'CM', potential: 86, stats: { speed: 70, shooting: 68, passing: 76, dribbling: 74, defending: 65, physical: 69 } };
  Object.assign(save.season, { appearances: 22, goals: 8, assists: 9, rating: 7.5, startOvr: 70, startMarketValue: 800000, startStats: { speed: 68, shooting: 66, passing: 73, dribbling: 71, defending: 63, physical: 67 } });
  save.career.contractMonths = 24;
  return save;
}

test('phase 12 settles each season once and always presents one named next step', () => {
  const save = state();
  const settledYear = save.season.year;
  assert.equal(settleSeason(save).alreadySettled, false);
  save.season.year = settledYear;
  assert.equal(settleSeason(save).alreadySettled, true);
  assert.equal(save.career.honors.seasons.length, 1);

  const routes = [];
  routes.push(seasonReviewNext(save));
  save.career.offSeason.status = 'complete';
  save.transfer.offers = [{ status: 'pending' }];
  routes.push(seasonReviewNext(save));
  save.transfer.offers = [];
  save.career.contractMonths = 0;
  routes.push(seasonReviewNext(save));
  save.career.contractMonths = 12;
  routes.push(seasonReviewNext(save));
  assert.deepEqual(routes.map(route => route.type), ['off-season', 'transfer', 'contract', 'next-season']);
  for (const route of routes) assert.ok(route.title && route.copy && route.button);

  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const review = app.slice(app.indexOf('openSeasonReview(record)'), app.indexOf('openCareerShare()', app.indexOf('openSeasonReview(record)')));
  assert.equal((review.match(/data-season-next/g) || []).length, 2);
  assert.match(review, /this\.navigate\(next\.type/);
});
