import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { SCENE_REGISTRY } from '../src/data/sceneRegistry.js';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 10 gate');
assert.equal(SCENE_REGISTRY.length, 56);
assert.equal(new Set(SCENE_REGISTRY.map(scene => scene.art)).size, 19);
assert.equal(fs.readdirSync('assets/scenes').filter(file => file.endsWith('.svg')).length, 0, 'legacy event SVGs remain');
for (const file of ['src/app.js', 'src/data/sceneRegistry.js']) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /assets\/scenes|scene-[a-z-]+\.svg/);

const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
  const result = await page.evaluate(async scenes => {
    document.body.innerHTML = `<main style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:16px">${scenes.map(scene => `<figure style="margin:0"><img src="${scene.art}" alt="${scene.name}" style="width:100%;aspect-ratio:16/9;object-fit:cover"><figcaption>${scene.name}</figcaption></figure>`).join('')}</main>`;
    const images = [...document.images];
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    return {
      total: images.length,
      broken: images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.alt),
      wrongSize: images.filter(image => image.naturalWidth !== 960 || image.naturalHeight !== 540).map(image => image.alt)
    };
  }, SCENE_REGISTRY);
  assert.deepEqual(result, { total: 56, broken: [], wrongSize: [] });
  assert.deepEqual(errors, []);
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  await page.screenshot({ path: path.resolve('test-results/phase10-event-scenes.png'), fullPage: true });
  console.log(JSON.stringify({ status: 'PASS', uniquePhotos: 19, ...result, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
