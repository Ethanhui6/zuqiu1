import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/u)
  .filter(Boolean);

test('GitHub Actions has one CI gate and one dist-only Cloudflare deployment',()=>{
  const workflows=tracked.filter(file=>file.startsWith('.github/workflows/'));
  assert.deepEqual(workflows,['.github/workflows/ci.yml','.github/workflows/deploy.yml']);
  const ci=fs.readFileSync(path.resolve('.github/workflows/ci.yml'),'utf8');
  assert.doesNotMatch(ci,/wrangler|pages deploy|refactor\/vnext-ui-growth-production/i);
  const deploy=fs.readFileSync(path.resolve('.github/workflows/deploy.yml'),'utf8');
  for(const token of ['npm ci','npm run check','upload-artifact@v4','wrangler-action@v3','pages deploy dist','--project-name=zuqiu','pr-${{ github.event.number }}','concurrency:'])assert.ok(deploy.includes(token),token);
  assert.doesNotMatch(deploy,/--project-name=zuqiu1/);
});

test('仓库不跟踪构建产物和本地敏感文件', () => {
  const forbidden = tracked.filter((file) =>
    file.startsWith('dist/')
    || file.endsWith('.zip')
    || file.endsWith('.log')
    || (file.startsWith('.env') && file !== '.env.example'),
  );

  assert.deepEqual(forbidden, []);
});

test('生产构建输入完整', () => {
  for (const file of ['index.html', 'styles.css', 'src/main.js', 'scripts/build.mjs']) {
    assert.ok(tracked.includes(file), `${file} 必须纳入版本控制`);
  }
});
