import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('career hero does not repeat the health status', () => {
  const source = fs.readFileSync(new URL('../src/pages/career.js', import.meta.url), 'utf8');
  assert.match(source, /const roleStatus = player\.status && player\.status !== healthLabel/);
  assert.match(source, /\$\{roleStatus \? `<span class="badge blue">\$\{roleStatus\}<\/span>` : ''\}/);
});
