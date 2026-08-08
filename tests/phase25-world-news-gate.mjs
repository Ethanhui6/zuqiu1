import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 25 gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
  await page.goto(url, { waitUntil: 'networkidle' });
  const audit = await page.evaluate(async () => {
    const [{ createDefaultState }, news] = await Promise.all([import('./src/core/store.js'), import('./src/core/newsEngine.js')]);
    const state = createDefaultState();
    state.player = { name: '移动端测试球员', club: '测试主队', clubId: 'home-club', nation: '中国', age: 20, position: 'CM', potential: 88, ovr: 78, fitness: 90, fatigue: 12, morale: 74, coachTrust: 72, stats: { speed: 76, shooting: 70, passing: 84, dribbling: 80, defending: 68, physical: 73 } };
    const clubs = Array.from({ length: 18 }, (_, index) => ({ id: `world-club-${index}`, cn: `世界球队${index}`, country: `国家${index % 6}`, leagueCn: `世界联赛${index % 4}` }));
    clubs.unshift({ id: 'home-club', cn: '测试主队', country: '中国', leagueCn: '测试联赛' });
    const players = clubs.slice(1).map((club, index) => ({ id: `world-player-${index}`, cn: `世界球员${index}`, clubId: club.id, nation: club.country, ovr: 72 + index % 15 }));
    for (let season = 0; season < 3; season += 1) {
      state.season.year = `${2026 + season}/${String(27 + season).padStart(2, '0')}`;
      for (let month = 1; month <= 12; month += 1) news.generateWorldNews(state, clubs, players, `${2026 + season}-${String(month).padStart(2, '0')}-01`);
    }
    state.route = 'career';
    localStorage.setItem('football-career-v20', JSON.stringify(state));
    const world = state.news.items.filter(item => item.scope === 'world');
    return { total: state.news.items.length, world: world.length, topics: [...new Set(world.map(item => item.topic))], uniqueTitles: new Set(state.news.items.map(item => item.title)).size };
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.news-broadcast-item').first().waitFor();
  const featured = await page.locator('.news-broadcast-item').count();
  assert.ok(featured >= 3 && featured <= 5);
  await page.locator('[data-action="news"]').click();
  await page.locator('.sheet .news-item').first().waitFor();
  const centerText = await page.locator('.sheet').textContent();
  for (const topic of ['联赛', '转会', '冠军', '保级', '奖项', '国家队', '教练', '伤病', '新星', '退役', '纪录']) assert.ok(centerText.includes(topic), `missing ${topic}`);
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.equal(layout.scrollWidth <= layout.width, true);
  assert.equal(audit.world, 72);
  assert.equal(audit.topics.length, 11);
  assert.equal(audit.uniqueTitles, audit.total);
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  await page.screenshot({ path: path.resolve('test-results/phase25-world-news-390.png') });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', featured, ...audit, ...layout, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
