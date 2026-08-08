import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorldRegistry } from '../src/data/worldRegistry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const { version } = packageJson;
const baseWorld = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs.json'), 'utf8'));
const expansion = JSON.parse(await fs.readFile(path.join(root, 'data', 'world-expansion.json'), 'utf8'));
const trophies = JSON.parse(await fs.readFile(path.join(root, 'data', 'trophies.json'), 'utf8'));
const players = JSON.parse(await fs.readFile(path.join(root, 'data', 'players.json'), 'utf8'));
const world = createWorldRegistry({
  clubs: [...baseWorld.clubs, ...expansion.clubs],
  leagues: [...baseWorld.leagues, ...expansion.leagues],
  players,
  trophies: [...trophies, ...(expansion.trophies || [])],
  competitions: expansion.competitions || []
});
if (!world.audit.valid) throw new Error(`世界数据审计失败：${world.audit.errors.join('; ')}`);
if (!dist.startsWith(`${root}${path.sep}`)) throw new Error('拒绝清理非项目目录');
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const file of ['index.html', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'sw.js', '_headers', '_redirects']) {
  await fs.copyFile(path.join(root, file), path.join(dist, file));
}
for (const directory of ['src', 'assets', 'data']) {
  await fs.cp(path.join(root, directory), path.join(dist, directory), { recursive: true });
}
await fs.rm(path.join(dist, 'data', 'maps'), { recursive: true, force: true });
await fs.writeFile(path.join(dist, 'build-meta.json'), JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2));
console.log(JSON.stringify({ status: 'PASS', output: 'dist', entry: 'index.html', version }, null, 2));
