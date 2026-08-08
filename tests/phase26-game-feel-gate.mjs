import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 26 gate');

const routes = ['career', 'match', 'training', 'transfer', 'clubs', 'more'];
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const report = { status: 'IN_PROGRESS', viewports: [] };

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport, hasTouch: viewport.width < 600 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const { createDefaultState } = await import('./src/core/store.js');
      const state = createDefaultState();
      state.player = { name: 'Phase 26', club: 'Arsenal', clubId: 'arsenal', nation: 'China', number: 8, age: 20, team: 'First Team', position: 'CM', potential: 88, ovr: 77, fitness: 82, fatigue: 24, morale: 76, coachTrust: 71, stats: { speed: 75, shooting: 70, passing: 83, dribbling: 79, defending: 66, physical: 72 } };
      state.career.clubId = 'arsenal';
      state.route = 'career';
      localStorage.setItem('football-career-v20', JSON.stringify(state));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.app-shell').waitFor();

    const pages = [];
    for (const route of routes) {
      await page.locator(`[data-route="${route}"]`).click();
      const root = page.locator(`.${route === 'match' ? 'match-hub' : route}-page`);
      await root.waitFor();
      const snapshot = await root.evaluate((node, currentRoute) => {
        const style = getComputedStyle(node);
        const head = node.querySelector('.page-head');
        const club = node.querySelector('.club-profile');
        return {
          route: currentRoute,
          accent: style.getPropertyValue('--page-accent').trim(),
          headAccent: head ? getComputedStyle(head, '::after').backgroundColor : '',
          clubAccent: club ? getComputedStyle(club).getPropertyValue('--club-accent').trim() : '',
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth
        };
      }, route);
      assert.ok(snapshot.accent, `${route} has no page accent`);
      assert.ok(snapshot.headAccent && snapshot.headAccent !== 'rgba(0, 0, 0, 0)', `${route} has no visible heading accent`);
      assert.ok(snapshot.scrollWidth <= snapshot.width + 1, `${route} overflows at ${viewport.width}px`);
      if (route === 'clubs') assert.match(snapshot.clubAccent, /^#[0-9a-f]{6}$/i);
      pages.push(snapshot);
      if (viewport.width === 390) await page.screenshot({ path: path.resolve(`test-results/phase26-${route}-390.png`), fullPage: true });
    }
    assert.equal(new Set(pages.map(item => item.accent)).size, routes.length, 'main page accents must be distinct');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    assert.deepEqual(errors, []);
    report.viewports.push({ viewport: `${viewport.width}x${viewport.height}`, pages });
    await page.close();
  }
  report.status = 'PASS';
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  fs.writeFileSync(path.resolve('test-results/phase26-game-feel.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
