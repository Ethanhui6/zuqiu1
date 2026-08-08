import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);
const world = JSON.parse(fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8'));
const clubs = world.clubs || world;
const formationFallback = ['4-3-3','4-2-3-1','4-4-2','3-5-2','3-4-2-1','4-3-1-2'];
const viewports = [[320,568],[375,812],[390,844],[393,852],[414,896],[428,926],[430,932],[768,1024],[1280,720],[390,650]];
const statuses = [
  { label: '预计首发', ovr: 92 }, { label: '替补待命', ovr: 60 }, { label: '未入选', ovr: 42 },
  { label: '预计首发', ovr: 90 }, { label: '替补待命', ovr: 61 }, { label: '未入选', ovr: 43 },
  { label: '预计首发', ovr: 94 }, { label: '替补待命', ovr: 62 }, { label: '未入选', ovr: 44 },
  { label: '预计首发', ovr: 91 }
];

assert.ok(executablePath, 'Chrome or Edge is required for the Phase 3 gate');
assert.ok(clubs.length >= 20, 'Phase 3 requires at least twenty clubs');

async function createCareer(page) {
  await page.locator('[data-next]').click();
  await page.locator('[data-next]').click();
  await page.locator('[data-position="CM"]').click();
  await page.locator('[data-style]').first().click();
  await page.locator('[data-next]').click();
  await page.locator('[data-next]').click();
  await page.locator('[data-club]').first().click();
  await page.locator('.app-shell').waitFor();
}

function clubName(club) { return club.cn || club.name || club.nameZh || club.id; }
function formationFor(club, index) { return club.formation || formationFallback[index % formationFallback.length]; }

const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await context.newPage();
const base = `http://127.0.0.1:${server.address().port}/?no-sw=1`;
const errors = [];
const report = { status: 'IN_PROGRESS', engine: 'current local app in system Chromium', matches: [] };
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await createCareer(page);
  const baseState = await page.evaluate(() => JSON.parse(localStorage.getItem('football-career-v20')));
  const screenshots = path.resolve('test-results/phase3');
  fs.mkdirSync(screenshots, { recursive: true });
  const seenFormations = new Set();
  const seenStatuses = new Set();

  for (let index = 0; index < 10; index++) {
    const current = clubs[index];
    const opponent = clubs[index + 10];
    const status = statuses[index];
    const home = index % 2 === 0;
    const [width, height] = viewports[index];
    await page.setViewportSize({ width, height });
    await page.evaluate(({ baseState, current, opponent, status, home, index }) => {
      const save = structuredClone(baseState);
      save.route = 'match';
      save.player.clubId = current.id;
      save.player.club = current.cn || current.name || current.id;
      save.player.squad = [];
      save.player.ovr = status.ovr;
      save.player.stats = Object.fromEntries(Object.keys(save.player.stats).map(key => [key, status.ovr]));
      save.player.potential = Math.max(status.ovr, 95);
      save.player.fitness = 90;
      save.player.morale = 68 + index;
      save.injuries = [];
      save.discipline = { yellowCards: 0, redCards: 0, suspensions: [], history: [] };
      save.schedule = [{
        id: `phase3-${index}`,
        date: save.simulation.date,
        competition: index % 3 === 0 ? '杯赛淘汰赛' : '联赛',
        opponent: opponent.cn || opponent.name || opponent.id,
        opponentId: opponent.id,
        venue: home ? '主场' : '客场',
        home,
        status: 'upcoming',
        important: index % 3 === 0,
        round: `第 ${index + 1} 轮`
      }];
      localStorage.setItem('football-career-v20', JSON.stringify(save));
    }, { baseState, current, opponent, status, home, index });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.match-preview').waitFor();
    await page.waitForTimeout(260);

    const geometry = await page.evaluate(() => {
      const button = document.querySelector('[data-play]');
      const buttonBox = button?.getBoundingClientRect();
      const bar = button?.closest('.match-fixed-action')?.getBoundingClientRect();
      const nav = document.querySelector('.glass-tabbar')?.getBoundingClientRect();
      const hit = buttonBox ? document.elementFromPoint(buttonBox.left + buttonBox.width / 2, buttonBox.top + buttonBox.height / 2) : null;
      return {
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        ctaCount: document.querySelectorAll('[data-play]').length,
        lineupTriggerCount: document.querySelectorAll('[data-lineups]').length,
        ctaEnabled: button ? !button.disabled : false,
        ctaHit: Boolean(button && (hit === button || hit?.closest('[data-play]') === button)),
        ctaVisible: Boolean(buttonBox && buttonBox.left >= 0 && buttonBox.right <= innerWidth && buttonBox.top >= 0 && buttonBox.bottom <= innerHeight),
        barClearOfNav: Boolean(bar && nav && bar.bottom <= nav.top + 1)
      };
    });
    assert.ok(geometry.scrollWidth <= width + 1, `match ${index + 1} overflows at ${width}px`);
    assert.deepEqual({ cta: geometry.ctaCount, lineup: geometry.lineupTriggerCount }, { cta: 1, lineup: 1 });
    assert.equal(geometry.ctaEnabled, status.label !== '未入选', `match ${index + 1} CTA availability is incorrect`);
    assert.equal(geometry.ctaHit && geometry.ctaVisible && geometry.barClearOfNav, true, `match ${index + 1} CTA is covered`);
    assert.equal(await page.locator('.match-preview__team').count(), 2);
    assert.equal(await page.locator('.match-preview__crest img').count(), 2);
    assert.equal(await page.locator('.match-preview__team-facts').count(), 2);
    assert.equal((await page.locator('.match-preview__player-status strong').textContent()).trim(), status.label);
    seenStatuses.add(status.label);

    const pageText = await page.locator('.match-preview').innerText();
    assert.match(pageText, new RegExp(clubName(current)));
    assert.match(pageText, new RegExp(clubName(opponent)));
    assert.match(pageText, /排名/);
    assert.match(pageText, /实力/);
    assert.match(pageText, /阵型/);
    assert.match(pageText, /体能/);
    assert.match(pageText, /士气/);
    assert.equal(await page.locator('.formation-node').count(), 0, 'lineups must not render in the page flow');

    await page.locator('[data-lineups]').click();
    const sheet = page.locator('[data-formation-sheet]');
    await sheet.waitFor();
    await page.locator('.sheet').evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
    assert.equal(await sheet.locator('[data-lineup-side]').count(), 2);
    assert.equal(await sheet.locator('.formation-node').count(), 11);
    assert.ok(await sheet.locator('.is-player').count() >= 1, `match ${index + 1} does not highlight the player`);
    const currentHeader = await sheet.locator('.formation-team-head').innerText();
    assert.match(currentHeader, new RegExp(clubName(current)));
    const currentFormation = (await sheet.locator('.formation-team-head > b').textContent()).trim();
    seenFormations.add(currentFormation);
    const currentNames = await sheet.locator('.formation-node strong').allTextContents();
    assert.equal(currentNames.some(name => /academy|prospect|player\s*\d|球员\s*\d/i.test(name)), false, `match ${index + 1} exposes a technical placeholder`);

    const otherSide = home ? 'away' : 'home';
    await sheet.locator(`[data-lineup-side="${otherSide}"]`).click();
    assert.equal(await sheet.locator('.formation-node').count(), 11);
    const opponentHeader = await sheet.locator('.formation-team-head').innerText();
    assert.match(opponentHeader, new RegExp(clubName(opponent)));
    const opponentFormation = (await sheet.locator('.formation-team-head > b').textContent()).trim();
    seenFormations.add(opponentFormation);
    const opponentNames = await sheet.locator('.formation-node strong').allTextContents();
    assert.equal(opponentNames.some(name => /academy|prospect|player\s*\d|球员\s*\d/i.test(name)), false, `match ${index + 1} opponent exposes a technical placeholder`);

    if (index === 0 || index === 7) await page.screenshot({ path: path.join(screenshots, `formation-${index + 1}-${width}x${height}.png`) });
    await page.locator('.sheet [data-close-sheet]').click();
    assert.equal(await page.locator('#overlay-root .overlay').count(), 0);

    if (status.label === '未入选') {
      assert.equal(await page.locator('[data-play]').getAttribute('aria-disabled'), 'true');
    } else {
      await page.locator('[data-play]').click();
      await page.locator('.sheet [data-match-strategy]').first().waitFor();
      assert.equal(await page.locator('.sheet [data-match-strategy]').count(), 3);
      await page.locator('.sheet [data-close-sheet]').click();
    }
    if (index === 0 || index === 7) await page.screenshot({ path: path.join(screenshots, `match-hub-${index + 1}-${width}x${height}.png`) });
    report.matches.push({ index: index + 1, viewport: `${width}x${height}`, current: clubName(current), opponent: clubName(opponent), home, status: status.label, formations: [currentFormation, opponentFormation], geometry });
  }

  assert.deepEqual([...seenStatuses].sort(), ['替补待命','未入选','预计首发'].sort());
  assert.ok(seenFormations.size >= 6, `only ${seenFormations.size} formations were exercised`);
  assert.deepEqual(errors, []);
  report.status = 'PASS';
  report.formations = [...seenFormations].sort();
  report.statuses = [...seenStatuses].sort();
  const output = path.resolve('test-results/phase3-match-hub-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, matches: report.matches.length, formations: report.formations, statuses: report.statuses }, null, 2));
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
