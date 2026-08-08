import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'src', 'app.js');
const importPatterns = [
  /(?:^|\n)\s*(?:import|export)\s+(?:[^'"\n;]*?\s+from\s*)?['"]([^'"]+)['"]/gu,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/gu
];

function resolveImport(file, specifier) {
  if (!specifier.startsWith('.')) return null;
  const target = path.resolve(path.dirname(file), specifier);
  const candidates = path.extname(target) ? [target] : [`${target}.js`, `${target}.mjs`, path.join(target, 'index.js')];
  return candidates.find(fs.existsSync) || null;
}

function productionGraph() {
  const pending = [entry], files = new Set();
  while (pending.length) {
    const file = pending.pop();
    if (files.has(file)) continue;
    files.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of importPatterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        const imported = resolveImport(file, match[1]);
        if (imported && /\.m?js$/u.test(imported)) pending.push(imported);
      }
    }
  }
  return [...files].sort();
}

const files = productionGraph();
assert.ok(files.length > 20, `production graph is unexpectedly small: ${files.length}`);
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });

const appSource = fs.readFileSync(entry, 'utf8');
const registrySource = fs.readFileSync(path.join(root, 'src', 'data', 'worldRegistry.js'), 'utf8');
assert.equal((appSource.match(/app\.openSimulation\s*=\s*function/gu) || []).length, 1, 'openSimulation must have one implementation');
assert.doesNotMatch(`${appSource}\n${registrySource}`, /simulation range|Academy Prospect/iu);
assert.match(registrySource, /salary:\s*club\.salary\s*\|\|\s*null/u);

const report = { status: 'PASS', mode: process.argv.includes('--static') ? 'static' : 'browser', productionFiles: files.length, surfaces: [] };

if (!process.argv.includes('--static')) {
  const executablePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(fs.existsSync);
  assert.ok(executablePath, 'Chrome or Edge is required for the Phase 29 browser gate');
  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const forbidden = /simulation range|Academy Prospect|\b(?:undefined|null|TODO|FIXME|mock|dummy|temporary)\b/iu;
  const audit = async label => {
    await page.waitForTimeout(80);
    const visibleText = await page.locator('body').innerText();
    const placeholders = await page.locator('input[placeholder], textarea[placeholder]').evaluateAll(nodes => nodes.map(node => node.getAttribute('placeholder')).join('\n'));
    assert.doesNotMatch(`${visibleText}\n${placeholders}`, forbidden, `${label} exposes development text`);
    report.surfaces.push(label);
  };
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
    await audit('creation');
    await page.locator('[data-next]').click();
    await page.locator('[data-position="CM"]').click();
    await page.locator('[data-next]').click();
    await page.locator('[data-style]').first().click();
    await page.locator('[data-next]').click();
    await page.locator('.scout-reveal').waitFor();
    await page.locator('[data-next]').click();
    await page.locator('[data-club]').first().click();
    await page.locator('.app-shell').waitFor();
    await audit('career');
    for (const route of ['match', 'training', 'transfer', 'clubs', 'more']) {
      await page.locator(`[data-route="${route}"]`).click();
      await audit(route);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

console.log(JSON.stringify(report, null, 2));
