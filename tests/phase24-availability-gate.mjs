import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 24 gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
  await page.goto(url, { waitUntil: 'networkidle' });
  const seed = async mode => page.evaluate(async selected => {
    const [{ createDefaultState }, injury, discipline, training] = await Promise.all([import('./src/core/store.js'), import('./src/core/injuryEngine.js'), import('./src/core/disciplineEngine.js'), import('./src/core/trainingOpportunities.js')]);
    const state = createDefaultState();
    state.player = { name: '移动端可用性验收', nation: '中国', club: '阿森纳', clubId: 'ENG1-ARS', crestPath: './assets/clubs/england/eng1-ars.svg', age: 20, number: 8, position: 'CM', potential: 88, ovr: 78, fitness: 86, fatigue: 18, morale: 74, coachTrust: 72, stats: { speed: 76, shooting: 72, passing: 83, dribbling: 80, defending: 69, physical: 74 } };
    state.schedule = [{ id: 'phase24-next', date: '2026-07-01', opponent: '利物浦', opponentId: 'ENG1-LIV', competition: '英格兰足球超级联赛', venue: '主场', home: true, status: 'upcoming', important: true }];
    if (selected === 'injury' || selected === 'training') injury.recordInjury(state, injury.createInjury({ type: '腿筋拉伤', severity: 'moderate', date: state.simulation.date }));
    if (selected === 'training') { state.route = 'training'; training.createTrainingOpportunity(state, { seed: 'phase24-browser', force: true }); }
    else state.route = 'match';
    if (selected === 'yellow') for (let index = 0; index < 5; index += 1) discipline.recordMatchCard(state, 'yellow', { matchId: `phase24-yellow-${index}` });
    localStorage.setItem('football-career-v20', JSON.stringify(state));
  }, mode);

  await seed('injury');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('伤病缺阵', { exact: false }).waitFor();
  assert.equal(await page.getByText('未入选', { exact: true }).count() > 0, true);
  assert.equal(await page.locator('[data-play]').isDisabled(), true);
  assert.equal(await page.locator('[data-match-strategy]').count(), 0);

  await seed('training');
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-training-plan="recovery-reset"]').waitFor();
  assert.equal(await page.locator('[data-training-plan]').count(), 1);
  assert.equal(await page.getByText('恢复与活动度', { exact: true }).count(), 1);
  const beforeRecovery = await page.evaluate(() => JSON.parse(localStorage.getItem('football-career-v20')).injuries[0].remainingDays);
  await page.locator('[data-training-plan="recovery-reset"]').click();
  await page.locator('.sheet [data-skip]').waitFor();
  await page.locator('.sheet [data-skip]').click();
  await page.locator('[data-training-result-close]').waitFor();
  const afterRecovery = await page.evaluate(() => JSON.parse(localStorage.getItem('football-career-v20')).injuries[0].remainingDays);
  assert.ok(afterRecovery < beforeRecovery);

  await seed('yellow');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('黄牌累计停赛', { exact: false }).waitFor();
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.equal(layout.scrollWidth <= layout.width, true);
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  await page.screenshot({ path: path.resolve('test-results/phase24-yellow-suspension-390.png'), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', injurySelection: true, recoveryOnlyTraining: true, yellowSuspension: true, ...layout, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
