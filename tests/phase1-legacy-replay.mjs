import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createAppServer } from '../scripts/serve.mjs';

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);

assert.ok(executablePath, 'Chrome or Edge is required for the Phase 1 legacy replay');

const routes = [
  { position: 'ST', mode: 'normal', origin: 0, policy: 'first', seed: 'p1-st' },
  { position: 'CB', mode: 'normal', origin: 1, policy: 'last', seed: 'p1-cb' },
  { position: 'GK', mode: 'express', origin: 6, policy: 'middle', seed: 'p1-gk' },
  { position: 'CM', mode: 'express', origin: 2, policy: 'first', seed: 'p1-cm' },
  { position: 'LW', mode: 'express', origin: 4, policy: 'last', seed: 'p1-lw' },
  { position: 'RW', mode: 'express', origin: 7, policy: 'middle', seed: 'p1-rw' },
  { position: 'CDM', mode: 'long', origin: 5, policy: 'first', seed: 'p1-cdm' },
  { position: 'ST', mode: 'express', origin: 3, policy: 'last', seed: 'p1-star' },
  { position: 'CB', mode: 'long', origin: 8, policy: 'middle', seed: 'p1-def' },
  { position: 'GK', mode: 'normal', origin: 0, policy: 'last', seed: 'p1-keeper' }
];

const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  const base = `http://127.0.0.1:${server.address().port}/legacy-recovery/career-sim.pages.dev/index.html?no-sw=1`;
  await page.goto(base, { waitUntil: 'networkidle' });
  const report = await page.evaluate(routeSpecs => {
    window.requestAnimationFrame = undefined;
    const test = window.__SIMTEST;
    if (!test || !window.SIM) throw new Error('legacy simulation test interface is unavailable');
    const originNames = test.origins.map(item => item.name);
    const expectedOrigins = ['辽宁', '山东', '上海', '北京', '广东', '河南河北', '新疆', '江浙', '巴蜀'];
    if (JSON.stringify(originNames) !== JSON.stringify(expectedOrigins)) throw new Error(`damaged legacy text: ${originNames.join(', ')}`);

    const careers = routeSpecs.map(spec => {
      const state = test.start(spec.mode, {
        name: `旧站审计-${spec.position}`,
        number: 10,
        foot: '右脚',
        pos: spec.position,
        origin: test.origins[spec.origin]
      }, spec.seed);
      const actions = { choices: 0, confirms: 0, total: 0 };

      for (let guard = 0; guard < 240 && state.phase !== 'summary'; guard += 1) {
        const buttons = [...document.querySelectorAll('#career-root button')].filter(button =>
          button.dataset.opt !== undefined || (button.dataset.act && button.dataset.act !== 'restart')
        );
        if (!buttons.length) throw new Error(`${spec.seed} stopped without an actionable control`);
        const choices = buttons.filter(button => button.dataset.opt !== undefined);
        let button;
        if (choices.length) {
          if (choices.some(item => item.dataset.opt === 'retire') && state.age >= 39) {
            button = choices.find(item => item.dataset.opt === 'retire');
          } else if (spec.policy === 'last') {
            button = choices.at(-1);
          } else if (spec.policy === 'middle') {
            button = choices[Math.floor((choices.length - 1) / 2)];
          } else {
            button = choices[0];
          }
          actions.choices += 1;
        } else {
          button = buttons[0];
          actions.confirms += 1;
        }
        button.click();
        actions.total += 1;
      }

      if (state.phase !== 'summary') throw new Error(`${spec.seed} did not reach retirement`);
      const profile = window.SIM.buildProfile();
      const peak = state.seasons.reduce((best, season) => season.ovr > best.ovr ? season : best, state.seasons[0]);
      return {
        seed: spec.seed,
        position: spec.position,
        mode: spec.mode,
        origin: test.origins[spec.origin].name,
        policy: spec.policy,
        actions,
        age: profile.age,
        seasons: profile.seasons,
        clubs: profile.clubs,
        appearances: profile.apps,
        appearancesPerSeason: Number(profile.appsPerSeason.toFixed(2)),
        maxOvr: profile.maxOvr,
        finalOvr: profile.ovr,
        peakAge: peak.age,
        abroadSeasons: profile.abroad,
        topFiveSeasons: profile.top5Seasons,
        lowSeasons: profile.lowSeasons,
        caps: profile.caps,
        trophies: profile.trophies,
        injuries: state.seasons.filter(season => season.injury || /伤|手术|拉伤|骨折/.test(season.note || '')).length,
        retirement: profile.reason
      };
    });

    return {
      runtime: 'local recovered legacy site in system Chromium',
      viewport: `${innerWidth}x${innerHeight}`,
      originNames,
      careers
    };
  }, routes);

  assert.equal(report.careers.length, 10);
  assert.deepEqual(new Set(report.careers.map(item => item.mode)), new Set(['long', 'normal', 'express']));
  assert.ok(report.careers.every(item => item.seasons > 0 && item.retirement));
  const peakOvrs = report.careers.map(item => item.maxOvr).sort((a, b) => a - b);
  assert.ok(peakOvrs.at(-1) - peakOvrs[0] >= 10, 'career trajectories do not meaningfully diverge');
  assert.ok(new Set(peakOvrs).size >= 3, 'low, ordinary, and high trajectory groups are missing');
  assert.ok(report.careers.some(item => item.appearancesPerSeason >= 30), 'regular starter route missing');
  assert.ok(report.careers.some(item => item.lowSeasons > 0), 'bench or slump route missing');
  assert.ok(report.careers.some(item => item.clubs >= 2), 'transfer route missing');
  assert.ok(report.careers.some(item => item.abroadSeasons > 0), 'overseas route missing');
  assert.ok(report.careers.some(item => item.topFiveSeasons > 0), 'elite-league route missing');
  assert.ok(report.careers.some(item => item.injuries > 0), 'injury route missing');
  assert.ok(report.careers.some(item => item.caps > 0), 'national-team route missing');
  assert.ok(report.careers.some(item => item.trophies > 0), 'champion route missing');
  assert.ok(report.careers.some(item => item.finalOvr <= item.maxOvr - 15), 'late-career decline missing');
  assert.deepEqual(errors, []);

  const peakAges = report.careers.map(item => item.peakAge).sort((a, b) => a - b);
  report.summary = {
    status: 'PASS',
    totalActions: report.careers.reduce((sum, item) => sum + item.actions.total, 0),
    choices: report.careers.reduce((sum, item) => sum + item.actions.choices, 0),
    resultConfirms: report.careers.reduce((sum, item) => sum + item.actions.confirms, 0),
    peakAgeMedian: (peakAges[4] + peakAges[5]) / 2,
    minimumPeakOvr: Math.min(...report.careers.map(item => item.maxOvr)),
    maximumPeakOvr: Math.max(...report.careers.map(item => item.maxOvr))
  };
  const output = path.resolve('test-results/phase1-legacy-replay.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await page.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
