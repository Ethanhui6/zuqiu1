import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=['theme.css','base.css','components.css','pages.css','mobile-foundation.css','animations.css','v20-product.css'].map(file=>fs.readFileSync(new URL(`../src/styles/${file}`,import.meta.url),'utf8')).join('\n');
const app=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const animations=fs.readFileSync(new URL('../src/animations/definitions/coreAnimations.js',import.meta.url),'utf8');
const eventIndex=JSON.parse(fs.readFileSync(new URL('../data/events/index.json',import.meta.url),'utf8'));
const build=fs.readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const more=fs.readFileSync(new URL('../src/pages/morePage.js',import.meta.url),'utf8');

test('移动端安全区与最小点击区域已定义',()=>{
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/@media\(max-width:3(?:50|59)px\)/);
});

test('核心路由与控制器均已接入',()=>{
  for(const token of ['renderCareerPage','renderMatchPage','renderTrainingPage','renderTransferPage','renderMorePage','renderWorldPage']) assert.ok(app.includes(token));
});

test('核心动画定义保持独立用途',()=>{
  const count=(animations.match(/^  \['[^']+'/gm)||[]).length;
  assert.ok(count>=22,`animation count ${count}`);
});

test('事件索引覆盖一千个以上节点',()=>{
  assert.ok(eventIndex.reduce((sum,item)=>sum+item.count,0)>=1000);
});

test('构建元数据可标识版本、提交、分支、时间和部署目标',()=>{
  for(const token of ['version','commitSha','shortCommitSha','branch','buildTime','deploymentTarget','GITHUB_SHA','GITHUB_REF_NAME','DEPLOYMENT_TARGET'])assert.ok(build.includes(token),token);
  assert.match(more,/async function loadBuildInfo/);
  assert.match(more,/build-meta\.json/);
  for(const token of ['shortCommitSha','buildTime','deploymentTarget'])assert.ok(more.includes(token),token);
});
