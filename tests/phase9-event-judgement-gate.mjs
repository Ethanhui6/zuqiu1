import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 9 gate');

const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
  const queued = await page.evaluate(async () => {
    const [{ createDefaultState }, { EventEngine }, { dataRepository }] = await Promise.all([
      import('./src/core/store.js'),
      import('./src/core/eventEngine.js'),
      import('./src/services/dataRepository.js')
    ]);
    await dataRepository.init();
    const state = createDefaultState();
    const club = dataRepository.clubs[0];
    state.player = { name: 'Phase 9', number: 8, club: club.cn || club.name, clubId: club.id, country: '中国', position: 'CM', age: 24, ovr: 82, potential: 88, fitness: 88, fatigue: 12, morale: 70, coachTrust: 68, stats: { speed: 77, shooting: 75, passing: 84, dribbling: 81, defending: 70, physical: 76 } };
    const engine = new EventEngine(dataRepository.careerEvents);
    const templates = dataRepository.careerEvents.filter(event => event.choices?.length >= 2).slice(0, 100);
    for (const template of templates) engine.schedule(state, { forceTemplate: template });
    localStorage.setItem('football-career-v20', JSON.stringify(state));
    return state.events.pending.length;
  });
  assert.equal(queued, 100);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.app-shell').waitFor();
  await page.locator('[data-action="event"]').first().click();

  const animationIds = new Set();
  for (let index = 0; index < 100; index += 1) {
    const choice = page.locator('[data-choice]').first();
    await choice.waitFor();
    await choice.click();
    assert.equal(await page.locator('[data-result-animation]').count(), 0, `event ${index + 1} revealed directly`);
    const judgement = page.locator('[data-event-judgement]');
    await judgement.waitFor();
    assert.equal(await judgement.getAttribute('data-phase'), 'rolling');
    const animationId = await judgement.getAttribute('data-animation-id');
    assert.ok(animationId, `event ${index + 1} has no animation id`);
    animationIds.add(animationId);
    assert.ok(await judgement.locator('[data-judgement-motif]').getAttribute('data-judgement-motif'));
    assert.notEqual(await judgement.locator('.event-roll-ring').evaluate(node => getComputedStyle(node, '::after').animationName), 'none');
    if (index === 0) {
      fs.mkdirSync(path.resolve('test-results'), { recursive: true });
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.resolve('test-results/phase9-event-judgement-390.png'), fullPage: true });
    }
    await page.locator('[data-result-animation]').waitFor();
    if (index < 99) await page.locator('[data-result-next]').click();
    else await page.locator('[data-result-continue]').click();
  }

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('football-career-v20')));
  assert.equal(saved.events.pending.length, 0);
  assert.equal(saved.events.history.length, 100);
  assert.ok(animationIds.size >= 35, `only ${animationIds.size} animation variants appeared`);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', events: 100, persisted: saved.events.history.length, animationVariants: animationIds.size, viewport: '390x844', errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
