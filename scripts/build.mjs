import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const { version } = packageJson;
const commitSha = process.env.GITHUB_SHA?.trim() || 'local';
const buildTime = new Date().toISOString();
const buildInfo = {
  version,
  commitSha,
  shortCommitSha: commitSha === 'local' ? 'local' : commitSha.slice(0, 7),
  branch: process.env.GITHUB_REF_NAME?.trim() || 'local',
  buildTime,
  deploymentTarget: process.env.DEPLOYMENT_TARGET?.trim() || 'local',
};
if (!dist.startsWith(`${root}${path.sep}`)) throw new Error('拒绝清理非项目目录');
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const file of ['index.html', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'sw.js', '_headers', '_redirects']) {
  await fs.copyFile(path.join(root, file), path.join(dist, file));
}
for (const directory of ['src', 'assets', 'data', 'functions', 'server']) {
  await fs.cp(path.join(root, directory), path.join(dist, directory), { recursive: true });
}
const buildId = `${buildInfo.shortCommitSha}-${buildTime.replace(/\D/g, '')}`;
const workerPath = path.join(dist, 'sw.js');
const worker = await fs.readFile(workerPath, 'utf8');
await fs.writeFile(workerPath, worker.replace('__BUILD_ID__', buildId));
await fs.writeFile(path.join(dist, 'build-meta.json'), JSON.stringify(buildInfo, null, 2));
console.log(JSON.stringify({ status: 'PASS', output: 'dist', entry: 'index.html', version }, null, 2));
