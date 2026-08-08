import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the PH8 browser gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  const base = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const [{ createDefaultState }, { createTrainingOpportunity }, { EventEngine }, { EVENT_TEMPLATES }, { ensureSeasonObjectives }] = await Promise.all([
      import('./src/core/store.js'), import('./src/core/trainingOpportunities.js'), import('./src/core/eventEngine.js'), import('./src/data/events.js'), import('./src/systems/honors/honorsSystem.js')
    ]);
    const state = createDefaultState();
    state.player = { name: 'PH8 浏览器球员', club: 'Test FC', clubId: 'test-fc', position: 'CM', age: 17, ovr: 64, potential: 88, dynamicPotential: 88, style: '组织核心', stats: { speed: 64, shooting: 60, passing: 68, dribbling: 64, defending: 55, physical: 62 }, fatigue: 12, fitness: 90, morale: 72, coachTrust: 58 };
    state.season.week = 6;
    ensureSeasonObjectives(state);
    createTrainingOpportunity(state, { seed: 'phase8-browser-training' });
    const engine = new EventEngine();
    engine.schedule(state, { priority: 'important', forceTemplate: EVENT_TEMPLATES[0] });
    localStorage.setItem('football-career-v20', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.page-title').first().textContent(), '生涯');
  assert.equal(await page.locator('[data-season-targets]').count(), 1);
  await page.locator('.notice-card[data-action="event"]').click();
  await page.locator('[data-choice]').first().waitFor();
  const eventText = await page.locator('.sheet').textContent();
  for (const label of ['预计成功率', '风险', '收益', '失败损失']) assert.match(eventText, new RegExp(label));
  await page.locator('[data-choice]').first().click();
  await page.locator('[data-result-continue]').click();
  await page.locator('[data-route="training"]').click();
  await page.locator('[data-training-plan]').first().click();
  await page.locator('[data-skip]').click();
  await page.locator('[data-training-outcome]').waitFor();
  const trainingText = await page.locator('[data-training-outcome]').textContent();
  for (const label of ['整数能力变化', 'OVR变化', '教练评价', '风格成长', '成就进度']) assert.match(trainingText, new RegExp(label));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('football-career-v20')));
  assert.equal(saved.training.seasonTrainingCount, 1);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', homepageTargets: true, eventMetadata: true, trainingFeedback: true }, null, 2));
} finally {
  await page.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
