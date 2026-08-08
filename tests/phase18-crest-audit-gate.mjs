import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const base = read('data/clubs.json');
const expansion = read('data/world-expansion.json');
const legacy = read('data/legendevo-clubs.json');
const clubs = [...base.clubs, ...expansion.clubs, ...legacy.clubs];
const assetPath = crest => path.join(root, String(crest).replace(/^\.\//, ''));
const sourcePage = club => club.crestSource?.sourcePage || club.dataSource?.sourceReference || club.legacy?.logoUrl;
const assetKey = club => club.legacy?.id || club.id;
const basename = club => path.basename(club.crest, path.extname(club.crest)).toLowerCase();
const errors = [];
const seenAssets = new Map();
const checked = clubs.map(club => {
  if (!club.crest) errors.push(`${club.id}: missing crest`);
  const file = club.crest && assetPath(club.crest);
  if (club.crest && !fs.existsSync(file)) errors.push(`${club.id}: broken crest`);
  if (club.crest && basename(club) !== String(assetKey(club)).toLowerCase()) errors.push(`${club.id}: crest filename mismatch`);
  if (!sourcePage(club)) errors.push(`${club.id}: missing source page`);
  if (club.crest && seenAssets.has(club.crest)) errors.push(`${club.id}: duplicate crest path with ${seenAssets.get(club.crest)}`);
  if (club.crest) seenAssets.set(club.crest, club.id);
  const source = club.crest && path.extname(file).toLowerCase() === '.svg' && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (/(?:href|src)\s*=\s*["']https?:|watermark|googleusercontent|gstatic/i.test(source)) errors.push(`${club.id}: unsafe SVG`);
  return { id: club.id, crest: club.crest };
});
assert.equal(errors.length, 0, errors.join('; '));
assert.equal(clubs.length, 742);
assert.equal(new Set(clubs.map(club => club.countryCode)).has('VNM'), true);

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the PH18 browser gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    const [base, expansion, legacy] = await Promise.all([
      fetch('./data/clubs.json').then(response => response.json()),
      fetch('./data/world-expansion.json').then(response => response.json()),
      fetch('./data/legendevo-clubs.json').then(response => response.json())
    ]);
    const clubs = [...base.clubs, ...expansion.clubs, ...legacy.clubs];
    document.body.innerHTML = clubs.map(club => `<img src="${club.crest}" alt="${club.id}">`).join('');
    const images = [...document.images];
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    return { total: clubs.length, loaded: images.filter(image => image.complete && image.naturalWidth > 0).length, broken: images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.alt) };
  });
  assert.deepEqual(result, { total: 742, loaded: 742, broken: [] });
  assert.deepEqual(browserErrors, []);
  console.log(JSON.stringify({ status: 'PASS', total: clubs.length, uniqueAssets: seenAssets.size, missing: 0, broken: 0, browser: result, browserErrors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
