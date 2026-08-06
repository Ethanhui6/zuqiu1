import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const app=read('src/app.js'),css=read('styles.css'),clubs=read('src/pages/clubs.js');

test('mobile theme and club directory stay connected to production entry',()=>{
  assert.match(app,/clubsPage/);
  assert.match(app,/clubs:\['club'/);
  assert.doesNotMatch(app,/worldPage/);
  assert.match(css,/data-theme="light"/);
  assert.match(css,/field--date/);
  assert.match(css,/has-open-sheet/);
  assert.match(css,/repeat\(6/);
  assert.match(clubs,/data-club-filter/);
  assert.match(clubs,/selectedDetail/);
});
