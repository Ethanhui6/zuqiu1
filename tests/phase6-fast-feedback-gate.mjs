import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);

assert.ok(executablePath, 'Chrome or Edge is required for the Phase 6 gate');

const appSource = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const overlaySource = fs.readFileSync(new URL('../src/components/ui.js', import.meta.url), 'utf8');
for (const result of ['事件结果', '比赛结果', '赛季总结', '训练结算']) {
  assert.match(appSource, new RegExp(`sheet\\('${result}'.*dismissible:false`, 's'), `${result} must require acknowledgement`);
}
for (const result of ['治疗路线已确认', '经纪人沟通结果', '退役档案已生成']) assert.match(appSource, new RegExp(`openAcknowledgement\\('${result}`));
assert.match(overlaySource, /dismissible&&e\.key==='Escape'/);
assert.match(overlaySource, /if\(dismissible&&\(e\.target===overlay/);

const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const base = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
const report = { status: 'IN_PROGRESS', viewport: '390x844', nodes: [], seasons: [], extraResults: [] };
const errors = [];
page.on('pageerror', error => errors.push(error.message));

async function snapshot() {
  return page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('football-career-v20'));
    return { route: state.route, date: state.simulation.date, age: state.player.age, season: state.season.year, reviews: state.career.honors?.seasons?.length || 0 };
  });
}

async function createCareer() {
  await page.locator('[data-next]').click();
  await page.locator('[data-position="CM"]').click();
  await page.locator('[data-next]').click();
  await page.locator('[data-style]').first().click();
  await page.locator('[data-next]').click();
  await page.locator('[data-next]').click();
  await page.locator('[data-club]').first().click();
  await page.locator('.app-shell').waitFor();
  await page.evaluate(() => {
    const key = 'football-career-v20';
    const state = JSON.parse(localStorage.getItem(key));
    Object.assign(state.settings, { mode: 'fast', autoSkipLow: true, autoPauseCritical: true, sound: false });
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
}

async function acknowledge(selector, type, { longHold = false, extra = false } = {}) {
  const button = page.locator(selector).first();
  await button.waitFor();
  const sheet = page.locator('.sheet[data-dismissible="false"]');
  await sheet.waitFor();
  assert.equal(await sheet.locator('[data-close-sheet]').count(), 0, `${type} exposes a close button`);
  await page.keyboard.press('Escape');
  await page.locator('#overlay-root > .overlay').evaluate(node => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(longHold ? 2200 : 40);
  assert.equal(await button.isVisible(), true, `${type} disappeared before acknowledgement`);
  const item = { index: report.nodes.length + 1, type, ...await snapshot() };
  (extra ? report.extraResults : report.nodes).push(item);
  await button.evaluate(node => node.click());
}

async function completeTraining() {
  await page.locator('[data-training-plan]').first().waitFor();
  await page.locator('[data-training-plan]').first().click();
  await page.locator('.sheet [data-skip]').click();
  await acknowledge('[data-training-result-close]', 'training', { longHold: !report.nodes.some(item => item.type === 'training') });
  await page.locator('.career-page').waitFor();
}

async function completeEvent() {
  await page.locator('[data-choice]').first().waitFor();
  await page.locator('[data-choice]').first().click();
  await acknowledge('[data-result-continue]', 'event');
}

async function completeReview() {
  const before = await snapshot();
  await acknowledge('[data-season-next]', 'season-review');
  await page.locator('.career-fixed-action [data-action="off-season"]').waitFor();
  await page.locator('.career-fixed-action [data-action="off-season"]').click();
  await page.locator('[data-off-season-complete]').click();
  const after = await snapshot();
  report.seasons.push({ completed: before.season, age: after.age, nextSeason: after.season, reviewCount: after.reviews });
}

async function completeMatch(extra = false) {
  await page.locator('[data-play]').waitFor();
  await page.locator('[data-play]').click();
  await page.locator('[data-match-strategy]').first().waitFor();
  await page.locator('[data-match-strategy]').first().click();
  await page.locator('[data-interactive-match-host] [data-skip]').waitFor();
  await page.locator('[data-interactive-match-host] [data-skip]').click();
  await acknowledge('[data-home]', 'match', { extra });
}

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await createCareer();

  for (let guard = 0; report.seasons.length < 6 && guard < 120; guard += 1) {
    if (await page.locator('[data-season-next]').count()) {
      await completeReview();
      continue;
    }
    if (!(await page.locator('.career-page').count())) {
      await page.locator('[data-route="career"]').click();
      await page.locator('.career-page').waitFor();
    }
    const actionButton = page.locator('.career-fixed-action [data-action]').first();
    await actionButton.waitFor();
    const action = await actionButton.getAttribute('data-action');
    await actionButton.click();
    if (action === 'simulation') {
      await page.locator('[data-continue]').click();
      await page.waitForTimeout(250);
    } else if (action === 'training') await completeTraining();
    else if (action === 'event') await completeEvent();
    else if (action === 'match') await completeMatch();
    else if (action === 'off-season') await page.locator('[data-off-season-complete]').click();
    else assert.fail(`Unexpected career action: ${action}`);
  }

  assert.equal(report.seasons.length, 6, 'six fast seasons must complete');
  assert.deepEqual(report.seasons.map(item => item.age), [17, 18, 19, 20, 21, 22]);
  assert.ok(report.nodes.length >= 30, `expected at least 30 result nodes, received ${report.nodes.length}`);
  assert.equal(report.nodes.filter(item => item.type === 'training').length, 6);
  assert.ok(report.nodes.filter(item => item.type === 'event').length >= 12);
  assert.equal(report.nodes.filter(item => item.type === 'season-review').length, 6);

  await page.evaluate(() => {
    const key = 'football-career-v20';
    const state = JSON.parse(localStorage.getItem(key));
    state.route = 'match';
    const match = state.schedule.find(item => item.status === 'upcoming');
    match.date = state.simulation.date;
    match.important = true;
    state.player.ovr = 99;
    state.player.fitness = 100;
    state.injuries = [];
    state.discipline.suspensions = [];
    Object.keys(state.player.stats).forEach(key => { state.player.stats[key] = 95; });
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await completeMatch(true);

  await page.locator('[data-route="career"]').click();
  await page.locator('[data-action="facilities"]').click();
  await page.locator('[data-facility="medical"]').click();
  if (await page.locator('[data-demo-injury]').count()) await page.locator('[data-demo-injury]').click();
  await page.locator('[data-treatment]').first().click();
  await acknowledge('[data-result-ack]', 'injury', { extra: true });

  await page.locator('[data-route="clubs"]').click();
  await page.locator('.club-directory-card:not(.is-active)').first().click();
  await page.locator('[data-club-action="contact"]').click();
  await page.locator('[data-offer]').first().click();
  await acknowledge('[data-result-ack]', 'transfer', { extra: true });

  await page.locator('[data-route="more"]').click();
  await page.locator('[data-more="career"]').click();
  await page.locator('[data-retire]').click();
  await page.locator('[data-confirm-retire]').click();
  await acknowledge('[data-result-ack]', 'retirement', { extra: true });

  assert.deepEqual(report.extraResults.map(item => item.type), ['match', 'injury', 'transfer', 'retirement']);
  assert.deepEqual(errors, []);
  report.status = 'PASS';
  report.firstThirty = report.nodes.slice(0, 30).map(item => item.type);
  const output = path.resolve('test-results/phase6-fast-feedback-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, nodes: report.nodes.length, firstThirty: report.firstThirty, seasons: report.seasons, extraResults: report.extraResults.map(item => item.type) }, null, 2));
} finally {
  await page.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
