import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the Phase 21 gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    const [base, expansion] = await Promise.all([fetch('./data/clubs.json').then(response => response.json()), fetch('./data/world-expansion.json').then(response => response.json())]);
    const hash = value => [...value].reduce((total, char) => Math.imul(total ^ char.codePointAt(0), 16777619) >>> 0, 2166136261);
    const sample = [...base.clubs, ...expansion.clubs].sort((a, b) => hash(`${a.id}|phase21`) - hash(`${b.id}|phase21`)).slice(0, 100);
    document.body.innerHTML = `<main class="crest-audit"><h1>Phase 21 · 100 Club Crest Audit</h1><div>${sample.map(club => `<article><img src="${club.crest}" alt="${club.cn}"><strong>${club.cn}</strong><span>${club.id}</span></article>`).join('')}</div></main>`;
    const style = document.createElement('style');
    style.textContent = 'body{margin:0;background:#eef2f5;color:#17202a;font:14px Arial,sans-serif}.crest-audit{padding:24px}.crest-audit h1{font-size:24px}.crest-audit>div{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:8px}.crest-audit article{min-width:0;padding:10px 6px;background:#fff;border:1px solid #dbe2e8;border-radius:6px;text-align:center}.crest-audit img{display:block;width:52px;height:52px;object-fit:contain;margin:0 auto 6px}.crest-audit strong,.crest-audit span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.crest-audit span{font-size:11px;color:#66717d;margin-top:3px}';
    document.head.append(style);
    const images = [...document.images];
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    return { sampled: sample.length, loaded: images.filter(image => image.complete && image.naturalWidth > 0).length, broken: images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.alt) };
  });
  assert.deepEqual(result, { sampled: 100, loaded: 100, broken: [] });
  assert.deepEqual(errors, []);
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  await page.screenshot({ path: path.resolve('test-results/phase21-club-crests-100.png'), fullPage: true });
  console.log(JSON.stringify({ status: 'PASS', viewport: '1280x900', ...result, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
