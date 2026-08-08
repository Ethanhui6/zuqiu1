import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);
const viewports = [[320, 568], [375, 812], [390, 844], [393, 852], [414, 896], [428, 926], [430, 932]];
const requiredSurfaces = ['creation', 'career', 'match', 'lineups', 'match-mini-game', 'training', 'training-mini-game', 'transfer', 'clubs', 'medical', 'news', 'honors', 'season-review', 'retirement'];

assert.ok(executablePath, 'Chrome or Edge is required for the Phase 28 gate');

async function auditSurface(page, label, expectOverlay = false) {
  if (!expectOverlay) await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  await page.waitForTimeout(120);
  const snapshot = await page.evaluate(({ label, expectOverlay }) => {
    const visible = node => {
      if (!(node instanceof Element)) return false;
      const style = getComputedStyle(node), box = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    };
    const rect = node => {
      const box = node?.getBoundingClientRect();
      return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
    };
    const overlays = [...document.querySelectorAll('#overlay-root .overlay')].filter(visible);
    const scope = expectOverlay ? overlays.at(-1) : document.querySelector('#app');
    const nav = document.querySelector('.glass-tabbar'), action = document.querySelector('.page-fixed-action');
    const navBlock = visible(nav) ? nav.getBoundingClientRect() : null, actionBlock = visible(action) ? action.getBoundingClientRect() : null;
    const coveredButtons = [...(scope?.querySelectorAll('button:not([disabled])') || [])].flatMap(button => {
      if (!visible(button)) return [];
      const box = button.getBoundingClientRect();
      if (box.left < 0 || box.right > innerWidth || box.top < 0 || box.bottom > innerHeight) return [];
      if ((actionBlock && box.bottom > actionBlock.top) || (navBlock && box.bottom > navBlock.top)) return [];
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return !button.contains(hit) && hit?.closest('button') !== button ? [`${button.outerHTML.slice(0, 80)} @ ${Math.round(box.top)}-${Math.round(box.bottom)} hit ${hit?.outerHTML?.slice(0, 80) || 'none'}`] : [];
    });
    const toasts = [...document.querySelectorAll('.toast')].filter(visible).map(rect);
    const toastOverlap = toasts.some((a, index) => toasts.slice(index + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    const navBox = visible(nav) ? rect(nav) : null, actionBox = visible(action) ? rect(action) : null;
    const sheet = overlays.at(-1)?.querySelector('.sheet,.dialog'), sheetBox = visible(sheet) ? rect(sheet) : null;
    const sheetBody = sheet?.querySelector('.sheet-body');
    const sheetBodyBox = rect(sheetBody);
    const sheetOverflowNodes = sheetBodyBox ? [...sheetBody.querySelectorAll('*')].filter(node => {
      if (!visible(node)) return false;
      const box = node.getBoundingClientRect();
      return box.left < sheetBodyBox.left - 1 || box.right > sheetBodyBox.right + 1 || node.scrollWidth > node.clientWidth + 1;
    }).slice(0, 8).map(node => `${node.tagName.toLowerCase()}.${node.className || ''}:${node.scrollWidth}/${node.clientWidth}`) : [];
    return {
      label,
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      overlayCount: overlays.length,
      bodyLocked: document.body.classList.contains('has-open-sheet'),
      coveredButtons,
      toastCount: toasts.length,
      toastOverlap,
      navBox,
      navPosition: nav ? getComputedStyle(nav).position : null,
      actionBox,
      actionPosition: action ? getComputedStyle(action).position : null,
      sheetBox,
      sheetOverflow: sheetBody ? sheetBody.scrollWidth - sheetBody.clientWidth : 0,
      sheetOverflowNodes
    };
  }, { label, expectOverlay });

  assert.ok(snapshot.scrollWidth <= snapshot.width + 1, `${label}: horizontal overflow ${snapshot.scrollWidth}/${snapshot.width}`);
  assert.equal(snapshot.coveredButtons.length, 0, `${label}: covered controls ${snapshot.coveredButtons.join(', ')}`);
  assert.equal(snapshot.toastOverlap, false, `${label}: stacked toasts overlap`);
  assert.ok(snapshot.toastCount <= 3, `${label}: too many toasts`);
  if (snapshot.navBox) {
    assert.equal(snapshot.navPosition, 'fixed', `${label}: BottomNav is not fixed`);
    assert.ok(snapshot.navBox.left >= 0 && snapshot.navBox.right <= snapshot.width + 1 && snapshot.navBox.bottom <= snapshot.height + 1, `${label}: BottomNav drifted outside viewport`);
  }
  if (snapshot.actionBox) {
    assert.equal(snapshot.actionPosition, 'fixed', `${label}: action bar is not fixed`);
    assert.ok(snapshot.actionBox.left >= 0 && snapshot.actionBox.right <= snapshot.width + 1, `${label}: action bar drifted horizontally`);
    if (snapshot.navBox) assert.ok(snapshot.actionBox.bottom <= snapshot.navBox.top + 1, `${label}: action bar overlaps BottomNav`);
  }
  assert.equal(snapshot.overlayCount, expectOverlay ? 1 : 0, `${label}: overlay lifecycle mismatch`);
  assert.equal(snapshot.bodyLocked, expectOverlay, `${label}: body lock mismatch`);
  if (expectOverlay) {
    assert.ok(snapshot.sheetBox && snapshot.sheetBox.left >= 0 && snapshot.sheetBox.right <= snapshot.width + 1 && snapshot.sheetBox.top >= 0 && snapshot.sheetBox.bottom <= snapshot.height + 1, `${label}: sheet is outside viewport`);
    assert.ok(snapshot.sheetOverflow <= 1, `${label}: sheet overflows horizontally by ${snapshot.sheetOverflow}px (${snapshot.sheetOverflowNodes.join(', ')})`);
  }
  return snapshot;
}

async function closeSheet(page) {
  await page.locator('#overlay-root .overlay .sheet [data-close-sheet], #overlay-root .overlay .dialog [data-close-sheet]').last().click();
  await page.waitForFunction(() => document.querySelectorAll('#overlay-root .overlay').length === 0);
}

async function createCareer(page, audit) {
  await audit('creation');
  await page.locator('[data-next]').click();
  await audit('creation');
  await page.locator('[data-position="CM"]').click();
  await page.locator('[data-next]').click();
  await audit('creation');
  await page.locator('[data-style]').first().click();
  await page.locator('[data-next]').click();
  await page.locator('.scout-reveal').waitFor();
  await audit('creation');
  await page.locator('[data-next]').click();
  await page.locator('[data-club]').first().click();
  await page.locator('.app-shell').waitFor();
}

const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const base = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
const report = { status: 'IN_PROGRESS', engine: 'current local app in system Chromium', viewports: [] };

try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    const errors = [], surfaces = new Set(), snapshots = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    const audit = async (label, overlay = false) => {
      surfaces.add(label);
      snapshots.push(await auditSurface(page, label, overlay));
    };

    await createCareer(page, audit);
    await audit('career');

    await page.locator('[data-route="match"]').click();
    await page.locator('.match-hub-page').waitFor();
    await audit('match');
    await page.locator('[data-lineups]').click();
    await page.locator('[data-formation-sheet]').waitFor();
    await audit('lineups', true);
    await page.locator('[data-lineup-side]').last().click();
    assert.equal(await page.locator('.formation-node').count(), 11);
    await closeSheet(page);

    await page.locator('[data-play]').click();
    await page.locator('.sheet [data-match-strategy]').first().click();
    const matchGame = page.locator('.interactive-match');
    await matchGame.waitFor();
    assert.equal(await matchGame.getAttribute('data-mini-game-state'), 'READY');
    await audit('match-mini-game', true);
    await matchGame.locator('[data-skip]').click();
    await page.locator('.sheet .result-panel').waitFor();
    await audit('match-mini-game', true);
    await page.locator('.sheet [data-home]').click();
    await page.waitForFunction(() => document.querySelectorAll('#overlay-root .overlay').length === 0);

    await page.evaluate(async () => {
      const state = JSON.parse(localStorage.getItem('football-career-v20'));
      const { createTrainingOpportunity } = await import('./src/core/trainingOpportunities.js');
      state.route = 'training';
      state.events.pending = [];
      state.events.history.push({ id: 'phase28-seed' });
      state.training.currentOpportunity = null;
      state.training.seasonTrainingCount = 0;
      createTrainingOpportunity(state, { seed: `phase28-${innerWidth}`, force: true });
      localStorage.setItem('football-career-v20', JSON.stringify(state));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.training-page').waitFor();
    await audit('training');
    await page.locator('[data-training-plan]').first().click();
    const trainingGame = page.locator('.training-game');
    await trainingGame.waitFor();
    assert.equal(await trainingGame.getAttribute('data-mini-game-state'), 'READY');
    await audit('training-mini-game', true);
    await trainingGame.locator('[data-skip]').click();
    await page.locator('[data-training-result-close]').waitFor();
    await audit('training-mini-game', true);
    await page.locator('[data-training-result-close]').click();
    await page.waitForFunction(() => document.querySelectorAll('#overlay-root .overlay').length === 0);

    for (const route of ['transfer', 'clubs']) {
      await page.locator(`[data-route="${route}"]`).click();
      await page.locator(`.${route}-page`).waitFor();
      await audit(route);
    }

    await page.locator('[data-route="career"]').click();
    await page.locator('[data-action="facilities"]').click();
    await page.locator('[data-facility="medical"]').click();
    await audit('medical', true);
    await closeSheet(page);

    await page.locator('[data-action="news"]').click();
    await audit('news', true);
    await closeSheet(page);

    await page.locator('[data-route="more"]').click();
    await page.locator('[data-more="honors"]').click();
    await audit('honors', true);
    await closeSheet(page);

    await page.evaluate(async () => {
      const state = JSON.parse(localStorage.getItem('football-career-v20'));
      const { settleSeason } = await import('./src/systems/honors/honorsSystem.js');
      state.route = 'career';
      state.player.age = 21;
      state.player.ovr = 78;
      state.player.potential = 91;
      state.player.coachTrust = 82;
      Object.assign(state.season, { appearances: 38, starts: 34, minutes: 3012, goals: 14, assists: 18, rating: 8.12, shots: 88, keyPasses: 116, tackles: 54, interceptions: 32, startCoachTrust: 66, startOvr: 76, startMarketValue: 12000000, startStats: { speed: 76, shooting: 70, passing: 81, dribbling: 79, defending: 68, physical: 72 } });
      settleSeason(state);
      localStorage.setItem('football-career-v20', JSON.stringify(state));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('[data-season-review]').waitFor();
    await audit('season-review', true);
    await page.locator('[data-season-next]').click();
    await page.waitForFunction(() => document.querySelectorAll('#overlay-root .overlay').length === 0);

    await page.locator('[data-route="more"]').click();
    await page.locator('[data-more="career"]').click();
    await page.locator('[data-retire]').click();
    await audit('retirement', true);
    await page.locator('[data-confirm-retire]').click();
    await page.locator('[data-result-ack]').waitFor();
    await audit('retirement', true);
    await page.locator('[data-result-ack]').click();
    await closeSheet(page);
    await page.locator('[data-route="career"]').click();
    assert.match(await page.locator('.page-head > .badge').textContent(), /retired|\u5df2\u9000\u5f79/i);
    await audit('retirement');
    await page.locator('[data-route="match"]').click();
    assert.equal(await page.locator('[data-play]').count(), 0);
    await audit('retirement');

    assert.deepEqual([...surfaces].sort(), [...requiredSurfaces].sort(), `${width}px missed a required surface`);
    assert.deepEqual(errors, [], `${width}px runtime errors`);
    if (width === 390) {
      const shots = path.resolve('test-results/phase28');
      fs.mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: path.join(shots, 'retirement-390x844.png'), fullPage: true });
    }
    report.viewports.push({ width, height, surfaces: [...surfaces], checks: snapshots.length });
    await context.close();
  }

  report.status = 'PASS';
  const output = path.resolve('test-results/phase28-final-mobile.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, viewports: report.viewports.map(item => `${item.width}x${item.height}`), surfaces: requiredSurfaces, checks: report.viewports.reduce((sum, item) => sum + item.checks, 0) }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
