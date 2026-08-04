import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const active=[
  '../src/components/appShell.js',
  '../src/components/playerCard.js',
  '../src/components/eventCard.js',
  '../src/pages/careerPage.js',
  '../src/pages/trainingPage.js',
  '../src/pages/matchPage.js',
  '../src/pages/profilePage.js',
  '../src/pages/onboardingPage.js',
  '../src/pages/rankingsPage.js',
  '../src/pages/transferPage.js',
  '../src/pages/worldPage.js',
  '../src/pages/morePage.js',
  '../src/pages/saveSelectPage.js'
];

test('active UI emits only the V20 architecture class family',()=>{
  const source=active.map(path=>read(path)).join('\n');
  for(const legacy of ['AppHeader','MainViewport','BottomNavigation','glass-card','career-overview','v19-'])assert.doesNotMatch(source,new RegExp(legacy),legacy);
  const shell=read('../src/components/appShell.js');
  for(const token of ['v20-app-shell','v20-app-header','v20-main-viewport','v20-bottom-nav','v20-nav-button','v20-overlay-root','v20-toast-root'])assert.match(shell,new RegExp(token),token);
});

test('stylesheet entry has no V18 or V19 compatibility layers',()=>{
  const entry=read('../styles.css');
  for(const file of ['v19-guidance.css','mobile-v18.5.css','pace-v18.3.css','ux-v18.2.css'])assert.doesNotMatch(entry,new RegExp(file.replace('.','\\.')),file);
});

test('career home exposes identity console growth and action sections',()=>{
  const career=read('../src/pages/careerPage.js');
  for(const token of ['v20-career-identity','v20-career-console','v20-career-growth','v20-career-actions'])assert.match(career,new RegExp(token),token);
  for(const label of ['最近属性提升','训练效果','比赛成长','技能解锁'])assert.match(career,new RegExp(label),label);
  assert.match(career,/createPlayerCard/);assert.match(career,/createEventCard/);assert.match(career,/createDevelopmentDelta/);
});

test('player event and development views have one shared implementation',()=>{
  const profile=read('../src/pages/profilePage.js'),training=read('../src/pages/trainingPage.js'),match=read('../src/pages/matchPage.js');
  assert.match(profile,/createPlayerCard/);
  assert.match(training,/createDevelopmentDelta/);
  assert.match(match,/createDevelopmentDelta/);
  assert.equal(fs.existsSync(new URL('../src/components/developmentDelta.js',import.meta.url)),true);
});

test('V20 CSS keeps cards compact and avoids override patches',()=>{
  const css=['base.css','components.css','pages.css','mobile-foundation.css','v20-product.css'].map(file=>read(`../src/styles/${file}`)).join('\n');
  assert.doesNotMatch(css,/!important/);
  for(const rule of css.matchAll(/([^{}]*\.v20-[\w-]*(?:-card|-surface)(?=[\s,.#:{>+~]|$)[^{}]*)\{([^{}]+)\}/gi))assert.doesNotMatch(rule[2],/border-radius:\s*(?:[9]|[1-9]\d+)px/,rule[1].trim());
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/min-height:\s*44px/);
});
