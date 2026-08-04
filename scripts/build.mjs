import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const commitSha = process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'local';
const branch = process.env.GITHUB_REF_NAME || process.env.BRANCH_NAME || 'local';
const deploymentTarget = branch === 'main' ? 'production' : 'preview';
if (!dist.startsWith(`${root}${path.sep}`)) throw new Error('拒绝清理非项目目录');
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const file of ['index.html', 'styles.css', 'icon.svg', 'manifest.webmanifest', '_headers', '_redirects']) {
  await fs.copyFile(path.join(root, file), path.join(dist, file));
}
for (const directory of ['src', 'assets']) {
  await fs.cp(path.join(root, directory), path.join(dist, directory), { recursive: true });
}
const buildMeta = { version: `${manifest.version}-restored-baseline`, commitSha, branch, buildTime: new Date().toISOString(), deploymentTarget };
await fs.writeFile(path.join(dist, 'build-meta.json'), JSON.stringify(buildMeta, null, 2));
const worker = await fs.readFile(path.join(root, 'sw.js'), 'utf8');
await fs.writeFile(path.join(dist, 'sw.js'), worker.replaceAll('__BUILD_ID__', commitSha));
console.log(JSON.stringify({ status: 'PASS', output: 'dist', entry: 'index.html', ...buildMeta }, null, 2));
