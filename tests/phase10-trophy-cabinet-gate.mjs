import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the PH10 browser gate');
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
    const { createDefaultState } = await import('./src/core/store.js');
    const state = createDefaultState();
    state.route = 'more';
    state.player = { name: 'PH10 Browser', number: 10, club: 'Audit FC', clubId: 'audit-fc', age: 20, position: 'CM', ovr: 80, potential: 90, stats: { speed: 70, shooting: 70, passing: 80, dribbling: 76, defending: 60, physical: 65 } };
    state.career.honors = {
      trophies: [
        { id: 'league-2026', assetId: 'league-title', name: '联赛冠军', season: '2026/27', club: 'Audit FC', category: 'team' },
        { id: 'league-2027', assetId: 'league-title', name: '联赛冠军', season: '2027/28', club: 'Audit FC', category: 'team' }
      ],
      personalAwards: [{ id: 'assist-2027', assetId: 'assists-king', name: '助攻王', season: '2027/28', club: 'Audit FC', category: 'personal' }],
      achievements: [], achievementLog: [], seasons: [
        { id: '2026/27:audit-fc', year: '2026/27', club: 'Audit FC', appearances: 20, goals: 5, assists: 11, rating: 7.4, trophies: ['联赛冠军'], personalAwards: [] },
        { id: '2027/28:audit-fc', year: '2027/28', club: 'Audit FC', appearances: 30, goals: 8, assists: 15, rating: 7.8, trophies: ['联赛冠军'], personalAwards: ['助攻王'] }
      ], pendingReviewId: null, retirement: null, legendProfile: null
    };
    localStorage.setItem('football-career-v20', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-more="honors"]').click();
  await page.locator('[data-honors-cabinet]').waitFor();
  assert.equal(await page.locator('[data-honor-group]').count(), 2);
  assert.equal(await page.locator('[data-honor-count="2"]').count(), 1);
  await page.locator('[data-honor-group]').first().click();
  assert.match(await page.locator('.sheet').last().innerText(), /2026\/27|2027\/28/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', uniqueHonors: 2, repeatedCount: 2, detailSeasons: 2, overflow: false }, null, 2));
} finally {
  await page.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
