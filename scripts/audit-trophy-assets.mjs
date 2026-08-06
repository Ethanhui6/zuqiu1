import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trophies = JSON.parse(await fs.readFile(path.join(root, 'data', 'trophies.json'), 'utf8'));
const missing = (await Promise.all(trophies.map(async item => ({ item, ok: await fs.access(path.join(root, item.image.replace(/^\.\//, ''))).then(() => true).catch(() => false) })))).filter(item => !item.ok);
if (missing.length) throw new Error(`missing trophy assets: ${missing.map(item => item.item.id).join(',')}`);
console.log(JSON.stringify({ status: 'PASS', trophies: trophies.length, uniqueImages: new Set(trophies.map(item => item.image)).size }));
