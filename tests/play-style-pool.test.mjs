import test from 'node:test';
import assert from 'node:assert/strict';
import {POSITION_CONFIG,STYLE_BONUSES} from '../src/app/config.js';

test('play style pools are position-scoped and ship at least fifty distinct styles', () => {
  const styles = Object.values(POSITION_CONFIG).flatMap(config => config.roles);
  assert.ok(new Set(styles).size >= 50);
  assert.ok(POSITION_CONFIG.ST.roles.includes('反越位终结者'));
  assert.ok(!POSITION_CONFIG.ST.roles.includes('扫荡覆盖型门将'));
  assert.ok(POSITION_CONFIG.GK.roles.includes('扫荡覆盖型门将'));
  assert.ok(!POSITION_CONFIG.GK.roles.includes('反越位终结者'));
  assert.deepEqual(STYLE_BONUSES['反越位终结者'], {pac:2,sho:3,dri:1});
});
