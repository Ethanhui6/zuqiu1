import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('phase 16 keeps the club roster responsive below 640px', () => {
  const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  const mobile = css.slice(css.indexOf('@media (max-width:640px)'), css.indexOf('@media', css.indexOf('@media (max-width:640px)') + 1));
  assert.match(mobile, /\.club-roster-row[^}]*min-width:0/);
  assert.match(mobile, /\.roster-name span \{ font-size:9px/);
  assert.match(mobile, /\.roster-form \{ display:none/);
});
