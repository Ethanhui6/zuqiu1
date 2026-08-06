import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const app=read('src/app.js'),css=read('styles.css'),world=read('src/components/worldMap.js');

test('mobile theme and world route guards stay connected to production entry',()=>{
  assert.match(app,/worldPage/);
  assert.match(app,/world:\['map'/);
  assert.match(css,/data-theme="light"/);
  assert.match(css,/field--date/);
  assert.match(css,/has-open-sheet/);
  assert.match(css,/repeat\(6/);
  assert.match(world,/mapClubs=selectedLeague\?visibleClubs:\[\]/);
  assert.match(world,/new Map\(\)/);
});
