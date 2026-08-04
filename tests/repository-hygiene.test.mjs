import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/u)
  .filter(Boolean);

test('GitHub Actions verifies once and deploys the downloaded artifact',()=>{
  const workflows=fs.readdirSync(path.resolve('.github/workflows')).sort();
  assert.deepEqual(workflows,['deploy.yml']);
  const deploy=fs.readFileSync(path.resolve('.github/workflows/deploy.yml'),'utf8');
  for(const token of [
    'verify:',
    'npm ci',
    'npm run check',
    'GITHUB_SHA: ${{ github.sha }}',
    'GITHUB_REF_NAME: ${{ github.event.pull_request.head.ref || github.ref_name }}',
    'DEPLOYMENT_TARGET:',
    'actions/upload-artifact@v4',
    'deploy:',
    'needs: verify',
    'actions/download-artifact@v4',
    'path: release-dist',
    'wrangler-action@v3',
    'pages deploy release-dist',
    '--project-name=zuqiu',
    '--branch=main',
    'pr-${{ github.event.number }}',
    'concurrency:',
    "github.event.pull_request.head.repo.full_name == github.repository",
    'node scripts/validate-build.mjs dist',
    'node scripts/validate-build.mjs release-dist',
  ])assert.ok(deploy.includes(token),token);
  assert.ok(deploy.indexOf('actions/upload-artifact@v4')<deploy.indexOf('actions/download-artifact@v4'));
  assert.ok(deploy.indexOf('actions/download-artifact@v4')<deploy.indexOf('pages deploy release-dist'));
  assert.equal((deploy.match(/npm run check/g)||[]).length,1);
  assert.doesNotMatch(deploy,/--project-name=zuqiu1/);
  assert.ok(fs.existsSync(path.resolve('scripts/validate-build.mjs')));
});

test('artifact validator parses metadata and rejects identity mismatches',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'career-build-'));
  const buildTime='2026-08-04T12:00:00.000Z',commitSha='abcdef1234567890',shortCommitSha='abcdef1';
  fs.writeFileSync(path.join(directory,'build-meta.json'),JSON.stringify({version:'20.1.3',commitSha,shortCommitSha,branch:'test',buildTime,deploymentTarget:'contract'}));
  fs.writeFileSync(path.join(directory,'sw.js'),`const CACHE='career-${shortCommitSha}-${buildTime.replace(/\D/g,'')}';`);
  fs.writeFileSync(path.join(directory,'index.html'),'<script type="module" src="./src/main.js"></script>');
  const env={...process.env,GITHUB_SHA:commitSha,GITHUB_REF_NAME:'test',DEPLOYMENT_TARGET:'contract'};
  try{
    execFileSync(process.execPath,['scripts/validate-build.mjs',directory],{env,stdio:'pipe'});
    assert.throws(()=>execFileSync(process.execPath,['scripts/validate-build.mjs',directory],{env:{...env,GITHUB_SHA:'wrong'},stdio:'pipe'}));
  }finally{fs.rmSync(directory,{recursive:true,force:true})}
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
