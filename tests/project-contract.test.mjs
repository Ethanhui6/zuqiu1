import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=[
  'styles.css',
  'src/styles/base.css',
  'src/styles/pages.css',
  'src/styles/mobile-foundation.css',
].map(file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8')).join('\n');
const app=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const icons=fs.readFileSync(new URL('../src/components/icons.js',import.meta.url),'utf8');
const events=fs.readFileSync(new URL('../src/data/events.js',import.meta.url),'utf8');

test('移动端安全区与最小点击区域已定义',()=>{
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/@media \(max-width: 350px\)/);
  assert.doesNotMatch(fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8'),/!important/);
});

test('生产入口接入 V20 路由与数据层',()=>{
  for(const token of ['dataRepository','renderCareerPage','renderMatchPage','renderTrainingPage','renderTransferPage','renderMorePage','renderWorldPage','renderRankingsPage']) assert.ok(app.includes(token));
});

test('图标系统超过50个独立入口',()=>{
  const count=(icons.match(/^  [a-zA-Z][a-zA-Z0-9]*:/gm)||[]).length;
  assert.ok(count>=50,`icon count ${count}`);
});

test('事件系统包含至少16种交互形式',()=>{
  const types=new Set([...events.matchAll(/interaction:'([^']+)'/g)].map(m=>m[1]));
  assert.ok(types.size>=16,`interaction types ${types.size}`);
});
