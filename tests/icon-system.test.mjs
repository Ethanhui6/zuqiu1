import test from 'node:test';
import assert from 'node:assert/strict';
import {hasIcon, icon, iconCount, iconNames} from '../src/components/icons.js';

test('canonical icon registry renders named and fallback SVGs', () => {
  assert.ok(iconCount >= 576);
  assert.equal(new Set(iconNames).size, iconCount);
  assert.equal(hasIcon('more'), true);
  assert.equal(hasIcon('missing-icon'), false);
  assert.match(icon('more', 'sm'), /class="icon ui-icon sm"/);
  assert.match(icon('missing-icon'), /<svg[\s\S]*<circle/);
});
