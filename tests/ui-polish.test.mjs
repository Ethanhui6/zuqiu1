import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('phase 10 keeps semantic colors and stable typography', () => {
  const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  for (const token of ['--blue:', '--green:', '--purple:', '--gold:', '--orange:', '--red:']) assert.match(css, new RegExp(token));
  assert.doesNotMatch(css, /font-size:\s*clamp\(/);
  assert.doesNotMatch(css, /letter-spacing:\s*-/);
  assert.match(css, /\.page-title \{ font-size:34px;/);
  assert.match(css, /\.surface-card\s*\{/);
});
