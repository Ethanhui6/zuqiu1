import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 27 gate');

const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  page.setDefaultTimeout(120_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
  const simulation = await page.evaluate(async () => {
    const [{ createDefaultState }, { CareerDirector }, { EventEngine }, training, injuries, transfers, honors, { CLUBS }] = await Promise.all([
      import('./src/core/store.js'), import('./src/core/simulationController.js'), import('./src/core/eventEngine.js'),
      import('./src/core/trainingOpportunities.js'), import('./src/core/injuryEngine.js'), import('./src/core/transferInboxEngine.js'),
      import('./src/systems/honors/honorsSystem.js'), import('./src/data/clubs.js')
    ]);
    const state = createDefaultState(), start = CLUBS.find(club => club.id === 'arsenal'), target = CLUBS.find(club => club.id === 'barcelona');
    const stats = { speed: 68, shooting: 68, passing: 68, dribbling: 68, defending: 68, physical: 68 };
    state.createdAt = 'phase-27-browser';
    state.random.seed = 'phase-27-browser';
    state.player = { name: 'Phase 27 Browser', club: start.name, clubId: start.id, clubCountry: start.country, country: '中国', nation: '中国', nationality: '中国', age: 16, number: 9, team: '一线队', position: 'ST', potential: 94, dynamicPotential: 94, developmentProfile: 'wonderkid', ovr: 68, stats, previousStats: { ...stats }, fatigue: 8, fitness: 94, morale: 76, coachTrust: 72 };
    state.season = { ...state.season, startOvr: 68, startStats: { ...stats } };
    const events = new EventEngine(), director = new CareerDirector({ get: () => state, set: update => update(state) }, events);
    let transferred = false, injured = false;
    while (state.player.age < 38) {
      if (!injured && state.player.age === 23) {
        injuries.recordInjury(state, injuries.createInjury({ type: '膝关节韧带伤', severity: 'major', bodyPart: '膝关节', date: state.simulation.date }));
        injured = true;
      }
      while (true) {
        const result = await director.advance('seasonEnd');
        if (result.stopReason === 'training') { training.resolveTrainingOpportunity(state, state.training.currentOpportunity.choices[0].id); continue; }
        if (result.stopReason === 'event') { while (state.events.pending.length) { const event = state.events.pending[0]; events.resolve(state, event.id, event.choices[0].id); } continue; }
        if (result.stopReason === 'match') { const match = result.match || director.nextMatch(state); director.store.set(current => { director.settleAutoMatch(current, match); return current; }); continue; }
        if (result.stopReason !== 'target') throw new Error(`unexpected stop: ${result.stopReason}`);
        break;
      }
      honors.settleSeason(state);
      if (!transferred && state.player.age === 21) {
        const offer = { id: 'phase27-browser-offer', clubId: target.id, status: 'pending', salary: 42000, contractMonths: 48 };
        state.transfer.offers.push(offer);
        transfers.acceptTransferOffer(state, target, offer.id);
        transferred = true;
      }
      honors.completeOffSeason(state);
    }
    const retirement = honors.retireCareer(state);
    state.career.honors.pendingReviewId = null;
    for (const season of state.career.honors.seasons) season.acknowledgedAt ||= state.simulation.date;
    state.route = 'career';
    localStorage.setItem('football-career-v20', JSON.stringify(state));
    return { age: state.player.age, seasons: retirement.seasons, appearances: retirement.totals.appearances, news: state.news.items.length, transfers: state.career.history.filter(item => item.type === '转会').length, nationalApps: state.career.nationalTeam?.appearances || 0, injuries: state.career.injuryLog.length, honors: state.career.honors.trophies.length + state.career.honors.personalAwards.length };
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.career-timeline').waitFor();
  const timeline = await page.locator('.career-timeline').evaluate(node => ({
    seasons: node.querySelectorAll('[data-timeline-type="season"]').length,
    types: [...new Set([...node.querySelectorAll('[data-timeline-type]')].map(item => item.dataset.timelineType))],
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    status: document.querySelector('.page-head > .badge')?.textContent,
    primaryAction: document.querySelector('.career-fixed-action button')?.dataset.action
  }));
  assert.deepEqual({ age: simulation.age, seasons: simulation.seasons }, { age: 38, seasons: 22 });
  assert.ok(simulation.appearances >= 440);
  assert.ok(simulation.news >= 50 && simulation.transfers >= 1 && simulation.nationalApps > 0 && simulation.injuries >= 1 && simulation.honors > 0);
  assert.equal(timeline.seasons, 22);
  for (const type of ['transfer', 'national', 'injury', 'trophy', 'retirement']) assert.ok(timeline.types.includes(type), `missing ${type}`);
  assert.equal(timeline.types.includes('null'), false);
  assert.equal(timeline.status, '已退役');
  assert.equal(timeline.primaryAction, 'career-hub');
  assert.ok(timeline.scrollWidth <= timeline.width + 1);
  assert.deepEqual(errors, []);
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  await page.screenshot({ path: path.resolve('test-results/phase27-full-career-390.png') });
  await page.locator('[data-timeline-type="retirement"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.resolve('test-results/phase27-retirement-390.png') });
  await page.locator('[data-route="match"]').click();
  await page.locator('.match-hub-page').waitFor();
  assert.equal(await page.locator('[data-play]').count(), 0);
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', simulation, timeline, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
