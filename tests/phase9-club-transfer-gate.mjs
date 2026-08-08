import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the PH9 browser gate');
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
    const [{ createDefaultState }, { dataRepository }] = await Promise.all([import('./src/core/store.js'), import('./src/services/dataRepository.js')]);
    const current = dataRepository.clubs[0];
    const state = createDefaultState();
    state.route = 'transfer';
    state.player = { name: 'PH9 Browser', number: 9, club: current.cn || current.name, clubId: current.id, country: current.country, position: 'ST', age: 20, ovr: 78, potential: 90, status: '主力', fitness: 88, coachTrust: 70, stats: { speed: 76, shooting: 80, passing: 70, dribbling: 75, defending: 38, physical: 74 } };
    state.career = { ...state.career, contractMonths: 0, weeklySalary: 18000, marketValue: 22000000 };
    localStorage.setItem('football-career-v20', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
  const tabs = page.locator('[data-club-transfer-tab]');
  assert.equal(await tabs.count(), 7);
  for (const tab of ['current', 'role', 'squad', 'contract', 'interest', 'offers', 'agent']) {
    await page.locator(`[data-club-transfer-tab="${tab}"]`).click();
    assert.equal(await page.locator(`[data-club-transfer-tab="${tab}"]`).getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator(`[data-club-transfer-section="${tab}"]`).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  }
  await page.locator('[data-club-transfer-tab="contract"]').click();
  assert.match(await page.locator('[data-club-transfer-pane]').innerText(), /续约方案已到达|查看续约方案/);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', tabs: await tabs.count(), renewalPath: true, overflow: false }, null, 2));
} finally {
  await page.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
