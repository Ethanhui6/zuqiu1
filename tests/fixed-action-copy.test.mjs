import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('fixed action context is not a duplicate command label', () => {
  const match = fs.readFileSync(new URL('../src/pages/match.js', import.meta.url), 'utf8');
  const career = fs.readFileSync(new URL('../src/pages/career.js', import.meta.url), 'utf8');
  assert.match(match, /match\.competition \|\| '下一场比赛'/);
  assert.match(career, /const context = node\.label \|\| '下一关键节点'/);
});
