import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';
import { freeKickTrajectory } from '../src/core/freeKickTrajectory.js';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);

test('phase 7: curve, angle and power each change the live free-kick path and landing point', () => {
  const base = freeKickTrajectory({ curve: 50, angle: 50, power: 50 });
  const curved = freeKickTrajectory({ curve: 80, angle: 50, power: 50 });
  const angled = freeKickTrajectory({ curve: 50, angle: 80, power: 50 });
  const powered = freeKickTrajectory({ curve: 50, angle: 50, power: 80 });
  assert.notEqual(curved.path, base.path);
  assert.notEqual(curved.controlX, base.controlX);
  assert.notEqual(angled.targetX, base.targetX);
  assert.notEqual(powered.targetY, base.targetY);
  assert.notEqual(powered.path, base.path);
});

test('phase 7: match free-kick preview redraws while controls move', async t => {
  if (!executablePath) return t.skip('Chrome or Edge is not installed');
  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
    const result = await page.evaluate(async () => {
      const { createInteractiveMatch } = await import('/src/components/interactiveMatch.js');
      const node = createInteractiveMatch({
        option: { id: 'free-kick', mechanic: 'curve', name: '任意球弧线', stat: 'shooting' },
        player: { position: 'CAM', fitness: 82 },
        matchState: { matchMinute: 52, possession: 54, teamMomentum: 61, pressure: 44, player: { energy: 82, rating: 7.1 }, zone: 'attacking', miniGame: { id: 'curve', difficulty: 52 } },
        highlight: { id: 'free-kick', title: '任意球机会', minute: 54 }
      });
      document.body.append(node);
      await new Promise(resolve => setTimeout(resolve, 2200));
      const snapshot = () => ({ path: node.querySelector('[data-curve-preview] path[stroke="#f6bf3e"]').getAttribute('d'), target: node.querySelector('[data-curve-preview] circle[fill="#f6bf3e"]').getAttribute('cx') + ':' + node.querySelector('[data-curve-preview] circle[fill="#f6bf3e"]').getAttribute('cy') });
      const base = snapshot();
      for (const [selector, value] of [['[data-curve]', '88'], ['[data-angle]', '18'], ['[data-power]', '90']]) {
        const control = node.querySelector(selector);
        control.value = value;
        control.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const changed = snapshot();
      const status = node.dataset.miniGameState;
      node.destroy();
      node.remove();
      return { base, changed, status };
    });
    assert.equal(result.status, 'ACTIVE');
    assert.notEqual(result.changed.path, result.base.path);
    assert.notEqual(result.changed.target, result.base.target);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
