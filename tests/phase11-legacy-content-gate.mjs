import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync);
assert.ok(executablePath, 'Chrome or Edge is required for the PH11 browser gate');
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto(`http://127.0.0.1:${server.address().port}/?no-sw=1`, { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    const [{ dataRepository }, { TROPHY_LIST }] = await Promise.all([import('./src/services/dataRepository.js'), import('./src/data/trophyRegistry.js')]);
    await dataRepository.init();
    const importedClubs = dataRepository.clubs.filter(club => club.id.startsWith('legacy-'));
    const sources = [...importedClubs.map(club => club.crest), ...TROPHY_LIST.map(trophy => trophy.asset)];
    document.body.innerHTML = sources.map(src => `<img src="${src}" alt="${src}">`).join('');
    const images = [...document.images];
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    return {
      clubs: dataRepository.clubs.length,
      leagues: dataRepository.leagues.length,
      trophies: dataRepository.trophies.length,
      importedClubs: importedClubs.length,
      checkedAssets: images.length,
      broken: images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.alt)
    };
  });
  assert.deepEqual(result, { clubs: 742, leagues: 74, trophies: 107, importedClubs: 195, checkedAssets: 239, broken: [] });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', viewport: '390x844', ...result, errors }));
} finally {
  await page.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
