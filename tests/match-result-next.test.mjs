import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('match result delegates its primary next action to the existing career director', () => {
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const resultFlow = app.slice(app.indexOf('resolveMatchAfterInteraction(match'), app.indexOf('openMatchStrategy(match'));
  assert.match(resultFlow, /this\.simulation\.nextNode\(this\.store\.get\(\)\)/);
  assert.match(resultFlow, /data-next-step/);
  assert.match(resultFlow, /continueAfterMatch\(next\)/);
  assert.doesNotMatch(resultFlow, /data-next-match/);
});

test('result copy covers event, training, match, season and automatic continuation', () => {
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const view = app.slice(app.indexOf('function matchNextStep'), app.indexOf('function matchResultHtml'));
  for (const copy of ['处理职业事件', '完成关键训练', '下一场关键比赛', '进入赛季总结', '继续模拟赛季']) assert.match(view, new RegExp(copy));
});
