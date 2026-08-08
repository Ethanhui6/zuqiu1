import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 20 gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
  const runtime = await page.evaluate(async () => {
    const [{ createDefaultState }, { dataRepository }] = await Promise.all([import('./src/core/store.js'), import('./src/services/dataRepository.js')]);
    await dataRepository.init();
    const state = createDefaultState();
    state.route = 'clubs';
    state.transfer.club = 'THA1-BUR';
    state.player = { name: 'Phase 20 门禁', number: 9, club: '武里南联', clubId: 'THA1-BUR', country: '泰国', position: 'ST', age: 20, ovr: 72, potential: 88, fitness: 92, fatigue: 8, morale: 70, coachTrust: 62, stats: { speed: 72, shooting: 74, passing: 66, dribbling: 70, defending: 40, physical: 72 } };
    localStorage.setItem('football-career-v20', JSON.stringify(state));
    return { clubs: dataRepository.clubs.length, leagues: dataRepository.leagues.length, competitions: dataRepository.competitions.length };
  });
  assert.deepEqual(runtime, { clubs: 544, leagues: 50, competitions: 3 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.club-filter-panel summary').click();
  const found = [];
  for (const name of ['武里南联', '费伦茨瓦罗斯', '山谷独立']) {
    await page.locator('[data-club-query]').fill(name);
    const card = page.locator('.club-directory-card');
    await card.first().waitFor();
    assert.match(await card.first().innerText(), new RegExp(name));
    found.push(name);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  assert.deepEqual(errors, []);
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  await page.screenshot({ path: path.resolve('test-results/phase20-world-expansion-390.png'), fullPage: true });
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', ...runtime, found, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
