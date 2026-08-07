import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);

async function createCareer(page, position) {
  await page.locator('[data-next]').click();
  await page.locator(`[data-position="${position}"]`).click();
  await page.locator('[data-next]').click();
  await page.locator('[data-style]').first().click();
  await page.locator('[data-next]').click();
  await page.locator('[data-next]').click();
  await page.locator('[data-club]').first().click();
  await page.locator('.app-shell').waitFor();
}

async function queueEvent(page, position, index) {
  return page.evaluate(async ({ position, index }) => {
    const key = 'football-career-v20';
    const state = JSON.parse(localStorage.getItem(key));
    state.player.position = position;
    state.simulation.date = `2026-08-${String(index + 1).padStart(2, '0')}`;
    state.events.pending = [];
    state.events.cooldowns = {};
    state.events.sceneCooldowns = {};
    state.events.lastInteractionIds = [];
    state.events.sceneHistory = [];
    const { EventEngine } = await import('/src/core/eventEngine.js');
    const event = new EventEngine().schedule(state);
    assertEvent(event);
    localStorage.setItem(key, JSON.stringify(state));
    return { id: event.id, choices: event.choices.length };

    function assertEvent(value) {
      if (!value || value.choices.length < 2) throw new Error('scheduled event has fewer than two choices');
    }
  }, { position, index });
}

async function resolveEvent(page, expectedHistory) {
  await page.locator('[data-action="event"]').first().click();
  const choice = page.locator('[data-choice]').first();
  await choice.waitFor();
  await choice.scrollIntoViewIfNeeded();
  const eventText = await page.locator('#overlay-root .overlay').innerText();
  assert.doesNotMatch(eventText, /可能影响：|消耗：|当前状态适配|后续Flag/);
  const hit = await choice.evaluate(element => {
    const box = element.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return {
      disabled: element.disabled,
      pointerEvents: getComputedStyle(element).pointerEvents,
      hit: top === element || element.contains(top),
      box: { left: box.left, top: box.top, width: box.width, height: box.height },
      top: top ? { tag: top.tagName, className: top.className, text: top.textContent?.slice(0, 40) } : null,
      viewport: { width: innerWidth, height: innerHeight },
      scroll: { pageY: scrollY, sheet: element.closest('.sheet')?.scrollTop || 0 }
    };
  });
  assert.equal(hit.disabled, false);
  assert.equal(hit.pointerEvents, 'auto');
  assert.equal(hit.hit, true, JSON.stringify(hit));
  await choice.evaluate(element => { element.click(); element.click(); });
  await page.locator('[data-result-back]').waitFor();
  const resolved = await page.evaluate(() => JSON.parse(localStorage.getItem('football-career-v20')));
  assert.equal(resolved.events.pending.length, 0);
  assert.equal(resolved.events.history.length, expectedHistory);
  assert.equal(await page.locator('[data-close-sheet]').count(), 0);
  await page.locator('[data-result-continue]').click();
  await page.waitForTimeout(30);
  assert.equal(await page.locator('#overlay-root .overlay').count(), 0);
}

test('event choices stay clickable on mobile and desktop across 30 resolutions', async t => {
  if (!executablePath) return t.skip('Chrome or Edge is not installed');
  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath });
  const base = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
  try {
    for (const [position, viewport, hasTouch, count] of [
      ['ST', { width: 390, height: 844 }, true, 8],
      ['CM', { width: 375, height: 812 }, true, 7],
      ['CB', { width: 428, height: 926 }, true, 7],
      ['GK', { width: 1280, height: 720 }, false, 8]
    ]) {
      const page = await browser.newPage({ viewport, hasTouch });
      await page.goto(base, { waitUntil: 'networkidle' });
      await createCareer(page, position);
      for (let index = 0; index < count; index += 1) {
        await queueEvent(page, position, index);
        await page.reload({ waitUntil: 'networkidle' });
        await resolveEvent(page, index + 1);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
