import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/u)
  .filter(Boolean);

test('GitHub Actions keeps one CI gate for native Cloudflare Pages deployment',()=>{
  const workflows=tracked.filter(file=>file.startsWith('.github/workflows/'));
  assert.deepEqual(workflows,['.github/workflows/ci.yml']);
  const ci=fs.readFileSync(path.resolve('.github/workflows/ci.yml'),'utf8');
  assert.doesNotMatch(ci,/wrangler|pages deploy|refactor\/vnext-ui-growth-production/i);
  for(const token of ['npm ci','npm run check','upload-artifact@v4'])assert.ok(ci.includes(token),token);
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
  for (const file of ['index.html', 'styles.css', 'src/app.js', 'scripts/build.mjs']) {
    assert.ok(tracked.includes(file), `${file} 必须纳入版本控制`);
  }
});
