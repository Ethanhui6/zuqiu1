import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 5 gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const base = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
const report = { status: 'IN_PROGRESS', viewports: [] };
fs.mkdirSync(path.resolve('test-results'), { recursive: true });

try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 700 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const [{ createDefaultState }, { dataRepository }] = await Promise.all([import('./src/core/store.js'), import('./src/services/dataRepository.js')]);
      const club = dataRepository.getClub('ESP1-RMA');
      const state = createDefaultState();
      state.route = 'clubs';
      state.transfer.club = club.id;
      state.simulation.date = '2026-08-08';
      state.player = { name: '测试中场', number: 8, club: club.cn, clubId: club.id, country: '中国', position: 'CM', age: 18, ovr: 78, potential: 90, fitness: 92, fatigue: 8, morale: 74, coachTrust: 66, stats: { speed: 70, shooting: 68, passing: 80, dribbling: 77, defending: 62, physical: 68 } };
      localStorage.setItem('football-career-v20', JSON.stringify(state));
    });
    await page.reload({ waitUntil: 'networkidle' });
    const rows = page.locator('[data-competition-player]');
    await rows.first().waitFor();
    const details = await rows.evaluateAll(nodes => nodes.map(node => ({ name: node.dataset.playerName, age: node.dataset.playerAge, ovr: node.dataset.playerOvr, role: node.dataset.playerRole, rank: node.dataset.playerRank, form: node.dataset.playerForm, source: node.dataset.playerSource })));
    assert.ok(details.length >= 3, `${width}px has too few competitors`);
    assert.ok(details.every(item => item.name && Number(item.age) >= 16 && Number(item.age) <= 45 && Number(item.ovr) > 0 && item.role && item.rank && item.form));
    assert.ok(details.some(item => item.source === '真实阵容'), `${width}px has no real competitor`);
    assert.equal(details.some(item => /Academy Prospect|Player\s*\d|Youth\s*\d|青年队球员\s*\d/i.test(item.name)), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
    await page.locator('[data-competition-player][data-player-source="真实阵容"]').first().click();
    const sheet = page.locator('.competition-player-sheet');
    await sheet.waitFor();
    const sheetText = await sheet.innerText();
    assert.match(sheetText, /OVR/);
    assert.match(sheetText, /年龄/);
    assert.match(sheetText, /预计顺位/);
    assert.match(sheetText, /近期状态/);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.resolve(`test-results/phase5-position-competition-${width}.png`), fullPage: true });
    report.viewports.push({ width, height, competitors: details.length });
    await page.close();
  }
  report.status = 'PASS';
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
