import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);

assert.ok(executablePath, 'Chrome or Edge is required for the Phase 0 browser gate');

const targetUrl = process.env.TARGET_URL?.replace(/\/+$/u, '');
const server = targetUrl ? null : createAppServer();
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const base = targetUrl ? `${targetUrl}/?no-sw=1` : `http://127.0.0.1:${server.address().port}/?no-sw=1`;
const errors = [];
const report = { status: 'IN_PROGRESS', target: targetUrl || 'current local build', viewport: '390x844', operations: [], seasons: [], transferActions: 0 };

page.on('pageerror', error => errors.push(error.message));

function snapshot() {
  return page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('football-career-v20'));
    return {
      route: state.route,
      date: state.simulation.date,
      age: state.player.age,
      season: state.season.year,
      reviews: state.career.honors?.seasons?.length || 0,
      latestReviewYear: state.career.honors?.seasons?.[0]?.year || null,
      offSeason: state.career.offSeason?.status || null,
      training: Boolean(state.training.currentOpportunity),
      pendingEvents: state.events.pending.length
    };
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
    state.settings.mode = 'fast';
    state.settings.autoSkipLow = true;
    state.settings.autoPauseCritical = true;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
  report.operations.push({ action: 'create-and-sign', ...await snapshot() });
}

async function completeTraining() {
  await page.locator('[data-training-plan]').first().waitFor();
  await page.locator('[data-training-plan]').first().click();
  await page.locator('.sheet [data-skip]').click();
  const close = page.locator('[data-training-result-close]');
  await close.waitFor();
  await close.evaluate(button => button.click()).catch(() => {});
  await page.locator('.career-page').waitFor();
}

async function completeEvent() {
  await page.locator('[data-choice]').first().waitFor();
  await page.locator('[data-choice]').first().click();
  const close = page.locator('[data-result-continue], [data-result-back]').first();
  await close.waitFor();
  await close.click();
}

async function completeMatch() {
  await page.locator('[data-play]').waitFor();
  await page.locator('[data-play]').click();
  await page.locator('[data-match-strategy]').first().waitFor();
  await page.locator('[data-match-strategy]').first().click();
  await page.locator('[data-interactive-match-host] [data-skip]').waitFor();
  await page.locator('[data-interactive-match-host] [data-skip]').click();
  await page.locator('[data-home]').waitFor();
  await page.locator('[data-home]').click();
}

async function completeReview() {
  const before = await snapshot();
  await page.locator('[data-season-next]').waitFor();
  await page.locator('[data-season-next]').click();
  await page.locator('.career-fixed-action [data-action="off-season"]').waitFor();
  await page.locator('.career-fixed-action [data-action="off-season"]').click();
  const activity = page.locator('[data-off-season]').first();
  if (await activity.count()) await activity.click();
  await page.locator('[data-off-season-complete]').click();
  const after = await snapshot();
  report.seasons.push({
    completedSeason: after.latestReviewYear,
    ageAfter: after.age,
    nextSeason: after.season,
    nextDate: after.date,
    reviewCount: after.reviews,
    offSeason: after.offSeason
  });
  report.operations.push({ action: 'season-review-and-off-season', ...after });
}

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await createCareer();

  await page.locator('[data-route="clubs"]').click();
  await page.locator('.clubs-page').waitFor();
  report.operations.push({ action: 'open-club-directory', ...await snapshot() });
  await page.locator('[data-route="transfer"]').click();
  await page.locator('[data-transfer-action="transfer-request"]').click();
  await page.locator('[data-club-choice]').first().click();
  await page.locator('[data-club-interaction-result="transfer-request"]').waitFor();
  await page.locator('[data-club-result-continue]').click();
  await page.locator('.clubs-page').waitFor();
  report.transferActions += 1;
  report.operations.push({ action: 'request-transfer', ...await snapshot() });
  await page.locator('[data-route="career"]').click();

  for (let guard = 0; report.seasons.length < 3 && guard < 60; guard += 1) {
    const review = page.locator('[data-season-next]');
    if (await review.count()) {
      await completeReview();
      continue;
    }

    const current = await snapshot();
    if (current.route !== 'career') {
      await page.locator('[data-route="career"]').click();
      await page.locator('.career-fixed-action [data-action]').waitFor();
      report.operations.push({ action: 'return-to-career', ...await snapshot() });
    }

    await page.locator('.career-fixed-action [data-action]').waitFor();
    const actionButton = page.locator('.career-fixed-action [data-action]').first();
    const action = await actionButton.getAttribute('data-action');
    const before = await snapshot();
    await actionButton.click();

    if (action === 'simulation') {
      await page.locator('[data-continue]').waitFor();
      await page.locator('[data-continue]').click();
      await page.waitForTimeout(200);
    } else if (action === 'training') {
      await completeTraining();
    } else if (action === 'event') {
      await completeEvent();
    } else if (action === 'match') {
      await completeMatch();
    } else if (action === 'off-season') {
      await page.locator('[data-off-season-complete]').click();
    } else {
      assert.fail(`Unexpected career action: ${action}`);
    }

    report.operations.push({ action, before, after: await snapshot() });
  }

  assert.equal(report.seasons.length, 3, 'three browser-driven seasons must complete');
  assert.deepEqual(report.seasons.map(item => item.ageAfter), [17, 18, 19]);
  assert.deepEqual(report.seasons.map(item => item.reviewCount), [1, 2, 3]);
  assert.ok(report.seasons.every(item => item.offSeason === 'complete'));
  assert.equal(report.transferActions, 1);
  assert.deepEqual(errors, []);
  report.status = 'PASS';
  report.final = await snapshot();
  const output = path.resolve('test-results/phase0-browser-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await page.close();
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
