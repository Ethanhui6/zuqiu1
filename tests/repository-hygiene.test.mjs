import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/u)
  .filter(Boolean);

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
