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
const requiredVariables = [
  '--header-height', '--bottom-nav-height', '--action-bar-height', '--safe-top', '--safe-bottom',
  '--page-padding', '--page-bottom-space', '--z-content', '--z-header', '--z-action', '--z-nav',
  '--z-sheet', '--z-modal', '--z-toast'
];

assert.ok(executablePath, 'Chrome or Edge is required for the Phase 2 layout gate');

async function createCareer(page) {
  await page.locator('[data-next]').click();
  await page.locator('[data-position="CM"]').click();
  await page.locator('[data-next]').click();
  await page.locator('[data-style]').first().click();
  await page.locator('[data-next]').click();
  await page.locator('[data-next]').click();
  await page.locator('[data-club]').first().click();
  await page.locator('.app-shell').waitFor();
}

async function layoutSnapshot(page) {
  return page.evaluate(names => {
    const rect = selector => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
    };
    const actionButton = document.querySelector('.page-fixed-action .app-button');
    const actionBox = actionButton?.getBoundingClientRect();
    const hit = actionBox ? document.elementFromPoint(actionBox.left + actionBox.width / 2, actionBox.top + actionBox.height / 2) : null;
    const style = getComputedStyle(document.documentElement);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      header: rect('.app-topbar'),
      main: rect('.app-main'),
      action: rect('.page-fixed-action'),
      nav: rect('.glass-tabbar'),
      actionHit: Boolean(actionButton && (hit === actionButton || hit?.closest('.app-button') === actionButton)),
      variables: Object.fromEntries(names.map(name => [name, style.getPropertyValue(name).trim()]))
    };
  }, requiredVariables);
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
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await createCareer(page);

    const geometry = await layoutSnapshot(page);
    assert.ok(Object.values(geometry.variables).every(Boolean), `${width}px is missing a layout variable`);
    assert.ok(geometry.scrollWidth <= width + 1, `${width}px has horizontal overflow`);
    assert.ok(geometry.header && geometry.main && geometry.action && geometry.nav, `${width}px is missing a global surface`);
    assert.ok(geometry.header.top >= 0 && geometry.header.bottom <= height, `${width}px header is outside viewport`);
    assert.ok(geometry.nav.left >= 0 && geometry.nav.right <= width && geometry.nav.bottom <= height, `${width}px nav is outside viewport`);
    assert.ok(geometry.action.left >= 0 && geometry.action.right <= width, `${width}px action bar is outside viewport`);
    assert.ok(geometry.action.bottom <= geometry.nav.top + 1, `${width}px action bar overlaps navigation`);
    assert.equal(geometry.actionHit, true, `${width}px action button is covered`);

    assert.ok(await page.locator('.toast').count() <= 3, `${width}px shows more than three creation toasts`);
    await page.locator('[data-top-save]').click();
    const toast = page.locator('.toast');
    await toast.last().waitFor();
    assert.ok(await toast.count() <= 3, `${width}px shows more than three toasts`);
    const toastGeometry = await toast.last().evaluate((node, headerBottom) => {
      const box = node.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, clearOfHeader: box.top >= headerBottom, pointerEvents: getComputedStyle(node).pointerEvents };
    }, geometry.header.bottom);
    assert.ok(toastGeometry.left >= 0 && toastGeometry.right <= width, `${width}px toast overflows`);
    assert.equal(toastGeometry.clearOfHeader, true, `${width}px toast overlaps header`);
    assert.equal(toastGeometry.pointerEvents, 'none', `${width}px toast intercepts pointer input`);
    assert.equal((await layoutSnapshot(page)).actionHit, true, `${width}px toast covers the action button`);

    await page.locator('[data-action="player-detail"]').click();
    const sheet = page.locator('.sheet');
    await sheet.waitFor();
    await sheet.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
    const sheetGeometry = await sheet.evaluate(node => {
      const box = node.getBoundingClientRect();
      const close = node.querySelector('[data-close-sheet]');
      const closeBox = close.getBoundingClientRect();
      const hit = document.elementFromPoint(closeBox.left + closeBox.width / 2, closeBox.top + closeBox.height / 2);
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, closeHit: hit === close || hit?.closest('[data-close-sheet]') === close };
    });
    assert.ok(sheetGeometry.left >= 0 && sheetGeometry.right <= width && sheetGeometry.top >= 0 && sheetGeometry.bottom <= height, `${width}px sheet is outside viewport: ${JSON.stringify(sheetGeometry)}`);
    assert.equal(sheetGeometry.closeHit, true, `${width}px sheet close button is covered`);
    assert.equal(await page.evaluate(() => document.body.classList.contains('has-open-sheet')), true);
    await page.locator('.sheet [data-close-sheet]').click();
    assert.equal(await page.locator('#overlay-root .overlay').count(), 0);
    assert.equal(await page.evaluate(() => document.body.classList.contains('has-open-sheet')), false);

    if (width === 390) {
      await page.locator('[data-route="more"]').click();
      await page.locator('[data-more="career"]').click();
      await page.locator('[data-retire]').click();
      const dialog = page.locator('.dialog');
      await dialog.waitFor();
      await dialog.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
      const dialogGeometry = await dialog.evaluate(node => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      });
      assert.ok(dialogGeometry.left >= 0 && dialogGeometry.right <= width && dialogGeometry.top >= 0 && dialogGeometry.bottom <= height, 'dialog is outside viewport');
      await dialog.locator('[data-close-sheet]').click();
      assert.equal(await page.locator('#overlay-root .overlay').count(), 0);
      await page.locator('[data-route="career"]').click();
      await page.setViewportSize({ width: 390, height: 650 });
      const compact = await layoutSnapshot(page);
      assert.ok(compact.action.bottom <= compact.nav.top + 1 && compact.actionHit, 'dynamic compact viewport overlaps fixed controls');
      await page.setViewportSize({ width: 390, height: 844 });
    }

    assert.deepEqual(errors, []);
    report.viewports.push({ width, height, geometry, toast: toastGeometry, sheet: sheetGeometry });
    await context.close();
  }

  report.status = 'PASS';
  const output = path.resolve('test-results/phase2-layout-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, viewports: report.viewports.map(item => `${item.width}x${item.height}`), variables: requiredVariables }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
