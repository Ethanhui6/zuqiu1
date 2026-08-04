import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (!dist.startsWith(`${root}${path.sep}`)) throw new Error('拒绝清理非项目目录');
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const file of ['index.html', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'sw.js', '_headers', '_redirects']) {
  await fs.copyFile(path.join(root, file), path.join(dist, file));
}
for (const directory of ['src', 'assets']) {
  await fs.cp(path.join(root, directory), path.join(dist, directory), { recursive: true });
}
await fs.writeFile(path.join(dist, 'build-meta.json'), JSON.stringify({ version: '20.0.0', builtAt: new Date().toISOString() }, null, 2));
console.log(JSON.stringify({ status: 'PASS', output: 'dist', entry: 'index.html', version: '20.0.0' }, null, 2));
