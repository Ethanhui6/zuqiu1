import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 19 gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
  const generated = await page.evaluate(async () => {
    const [{ createDefaultState }, { dataRepository }, { generateTransferActivity }] = await Promise.all([import('./src/core/store.js'), import('./src/services/dataRepository.js'), import('./src/core/transferInboxEngine.js')]);
    const current = dataRepository.clubs.find(club => club.id === 'CHN1-SHA') || dataRepository.clubs[0];
    const state = createDefaultState();
    state.route = 'transfer';
    state.createdAt = '2026-07-01T00:00:00.000Z';
    state.random.seed = 'phase-19-browser';
    state.player = { name: '转会门禁球员', number: 9, club: current.cn || current.name, clubId: current.id, country: current.country, nation: current.country, nationality: current.country, position: 'ST', age: 20, ovr: 78, potential: 91, fitness: 92, fatigue: 8, morale: 74, coachTrust: 66, stats: { speed: 78, shooting: 80, passing: 72, dribbling: 76, defending: 42, physical: 75 } };
    state.season = { ...state.season, appearances: 31, goals: 17, assists: 8, rating: 7.6 };
    state.career = { ...state.career, contractMonths: 10, weeklySalary: 18000, marketValue: 22000000 };
    for (let index = 0; index < 14; index++) {
      const year = 2026 + Math.floor(index / 2), month = index % 2 ? '01' : '07';
      state.simulation.date = `${year}-${month}-01`;
      generateTransferActivity(state, dataRepository.clubs, state.simulation.date);
    }
    localStorage.setItem('football-career-v20', JSON.stringify(state));
    return { stages: [...new Set(state.transfer.inbox.map(item => item.stage))], offers: state.transfer.offers.length };
  });
  assert.deepEqual(new Set(generated.stages), new Set(['scout_attention', 'rumor', 'agent_contact', 'club_interest', 'formal_offer']));
  assert.ok(generated.offers > 0);
  await page.reload({ waitUntil: 'networkidle' });
  const tabs = page.locator('[data-transfer-tab]');
  assert.equal(await tabs.count(), 5);
  for (const tab of ['received', 'agent', 'exploring', 'watchlist', 'history']) {
    await page.locator(`[data-transfer-tab="${tab}"]`).click();
    assert.equal(await page.locator(`[data-transfer-tab="${tab}"]`).getAttribute('aria-selected'), 'true');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  }
  await page.locator('[data-transfer-tab="received"]').click();
  await page.locator('[data-inbox-offer]').first().click();
  await page.locator('[data-offer="谈判"]').click();
  await page.locator('[data-result-ack]').click();
  await page.locator('[data-transfer-tab="history"]').click();
  assert.match(await page.locator('.transfer-inbox-panel').innerText(), /谈判|谈判中/);
  assert.deepEqual(errors, []);
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  await page.screenshot({ path: path.resolve('test-results/phase19-transfer-inbox-390.png'), fullPage: true });
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', tabs: 5, stages: generated.stages, offers: generated.offers, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
