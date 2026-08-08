import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 23 gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const [{ createDefaultState }, { settleSeason }] = await Promise.all([import('./src/core/store.js'), import('./src/systems/honors/honorsSystem.js')]);
    const state = createDefaultState();
    state.player = { name: '移动端验收球员', nation: '中国', club: '阿森纳', clubId: 'ENG1-ARS', crestPath: './assets/clubs/england/eng1-ars.svg', age: 21, position: 'CM', potential: 91, ovr: 78, coachTrust: 82, stats: { speed: 78, shooting: 73, passing: 84, dribbling: 82, defending: 70, physical: 75 } };
    Object.assign(state.career, { weeklySalary: 28500, marketValue: 18000000, contractMonths: 36, teamRole: '主力核心', nationalTeam: { team: '中国国家队', calledUp: true } });
    Object.assign(state.season, { competition: '英格兰超级联赛', clubRank: 2, appearances: 38, starts: 34, minutes: 3012, goals: 14, assists: 18, rating: 8.12, shots: 88, keyPasses: 116, tackles: 54, interceptions: 32, yellowCards: 4, redCards: 1, suspensions: 1, injuryAbsences: 3, injuries: [{ type: '腿筋拉伤', status: 'recovered', originalDays: 21 }], nationalTeam: { team: '中国国家队', calledUp: true, appearances: 8, goals: 3 }, startCoachTrust: 66, highlights: ['完成国家队首秀', '联赛争冠进入最后一轮'], startOvr: 76, startMarketValue: 12000000, startStats: { speed: 76, shooting: 70, passing: 81, dribbling: 79, defending: 68, physical: 72 } });
    settleSeason(state);
    localStorage.setItem('football-career-v20', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
  const review = page.locator('[data-season-review]');
  await review.waitFor();
  for (const text of ['赛季总结', '英格兰超级联赛', '俱乐部第 2 名', '出场', '首发', '分钟', '进球', '助攻', '评分', '位置数据', 'OVR', '身价', '周薪', '球队角色', '教练信任', '伤病', '停赛', '国家队', '团队奖杯', '个人奖项', '重大事件', '下一步']) assert.ok((await page.getByText(text, { exact: false }).count()) > 0, `missing ${text}`);
  assert.equal(await page.locator('[data-close-sheet]').count(), 0);
  await page.keyboard.press('Escape');
  assert.equal(await review.count(), 1);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-season-review]').waitFor();
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, sheetScrollTop: document.querySelector('.sheet').scrollTop, crestLoaded: [...document.images].some(image => image.alt.includes('阿森纳') && image.complete && image.naturalWidth > 0) }));
  assert.equal(layout.scrollWidth <= layout.width, true);
  assert.equal(layout.sheetScrollTop, 0);
  assert.equal(layout.crestLoaded, true);
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  await page.screenshot({ path: path.resolve('test-results/phase23-season-review-390.png'), fullPage: true });
  await page.locator('[data-season-next]').click();
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('football-career-v20')).career.honors);
  assert.equal(persisted.pendingReviewId, null);
  assert.ok(persisted.seasons[0].acknowledgedAt);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', refreshRecovery: true, explicitAcknowledgement: true, ...layout, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
