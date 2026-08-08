import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);
const viewports = [[320, 568], [375, 812], [390, 844], [393, 852], [414, 896], [428, 926], [430, 932], [1440, 900]];

assert.ok(executablePath, 'Chrome or Edge is required for the Phase 3 creation gate');

async function snapshot(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('.pace-mode-card')].map(node => {
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return { left: box.left, right: box.right, width: box.width, selected: node.classList.contains('is-selected'), pressed: node.getAttribute('aria-pressed'), background: style.backgroundColor, border: style.borderColor, facts: node.querySelectorAll('.pace-mode-card__facts div').length, label: node.querySelector('.pace-mode-card__label')?.textContent.trim() };
    });
    const action = document.querySelector('.wizard-actions')?.getBoundingClientRect();
    const next = document.querySelector('[data-next]');
    const nextBox = next?.getBoundingClientRect();
    const hit = nextBox && document.elementFromPoint(nextBox.left + nextBox.width / 2, nextBox.top + nextBox.height / 2);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      cards,
      outerCard: document.querySelector('.pace-selection-step')?.classList.contains('surface-card'),
      action: action && { left: action.left, right: action.right, top: action.top, bottom: action.bottom },
      nextHit: Boolean(next && (hit === next || hit?.closest('[data-next]') === next))
    };
  });
}

const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const base = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
const report = { status: 'IN_PROGRESS', viewports: [] };
fs.mkdirSync(path.resolve('test-results'), { recursive: true });

try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });

    const initial = await snapshot(page);
    assert.equal(initial.scrollWidth <= width + 1, true, `${width}px has horizontal overflow`);
    assert.equal(initial.outerCard, false, `${width}px still wraps pace choices in one giant card`);
    assert.equal(initial.cards.length, 3, `${width}px does not show three pace cards`);
    assert.equal(initial.cards.filter(card => card.selected && card.pressed === 'true').length, 1, `${width}px has no explicit single selection`);
    assert.ok(initial.cards.every(card => card.left >= 0 && card.right <= width && card.facts === 2 && card.label), `${width}px has an incomplete or overflowing pace card`);
    assert.ok(Math.max(...initial.cards.map(card => card.width)) - Math.min(...initial.cards.map(card => card.width)) < 1, `${width}px pace cards are misaligned`);
    assert.ok(initial.action && initial.action.left >= 0 && initial.action.right <= width && initial.action.top >= 0 && initial.action.bottom <= height, `${width}px action dock is outside the viewport`);
    assert.equal(initial.nextHit, true, `${width}px Continue is covered`);
    if (width === 390) await page.screenshot({ path: path.resolve('test-results/phase3-creation-mobile.png'), fullPage: true });
    if (width === 1440) await page.screenshot({ path: path.resolve('test-results/phase3-creation-desktop.png'), fullPage: true });

    await page.locator('[data-pace="immersive"]').click();
    await page.waitForTimeout(280);
    const selected = await snapshot(page);
    assert.equal(selected.cards[0].pressed, 'true');
    assert.notEqual(selected.cards[0].background, selected.cards[1].background, `${width}px selected card has no color state`);
    assert.notEqual(selected.cards[0].border, selected.cards[1].border, `${width}px selected card has no border state`);
    assert.deepEqual(errors, []);

    if (width === 390) {
      await page.locator('[data-next]').click();
      assert.equal(await page.locator('.page-title').textContent(), '身份');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('.page-title').textContent(), '身份', 'wizard step was not restored after reload');
      await page.locator('[data-next]').click();
      assert.ok(await page.locator('[data-style]').count() >= 5, 'position step has fewer than five styles');
      await page.locator('[data-next]').click();
      assert.equal(await page.locator('[data-reroll]').count(), 1);
      await page.locator('[data-next]').click();
      assert.ok(await page.locator('[data-club]').count() >= 3, 'starting club step has fewer than three offers');
      assert.equal(await page.locator('[data-prev]').isVisible(), true, 'starting club step cannot go back');
      await page.locator('[data-prev]').click();
      assert.equal(await page.locator('.page-title').textContent(), '球员数据');
    }
    report.viewports.push(`${width}x${height}`);
    await context.close();
  }
  report.status = 'PASS';
  fs.writeFileSync(path.resolve('test-results/phase3-creation-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
