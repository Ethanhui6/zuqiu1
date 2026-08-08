import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clubs = JSON.parse(await fs.readFile(path.join(root, 'data', 'legendevo-clubs.json'), 'utf8'));
const trophies = JSON.parse(await fs.readFile(path.join(root, 'data', 'legendevo-trophies.json'), 'utf8'));
const files = [...clubs.clubs.map(item => item.crest), ...trophies.map(item => `./${item.image}`)].sort();
const hashes = {};
for (const file of files) hashes[file] = crypto.createHash('sha256').update(await fs.readFile(path.join(root, file.replace(/^\.\//, '')))).digest('hex');
await fs.writeFile(path.join(root, 'data', 'legendevo-import-manifest.json'), JSON.stringify({ algorithm: 'sha256', sourceClubs: clubs.sourceCount, matchedClubs: Object.keys(clubs.aliases).length, importedClubs: clubs.clubs.length, trophyAssets: trophies.length, files: hashes }, null, 2));
console.log(JSON.stringify({ status: 'PASS', algorithm: 'sha256', files: files.length }));
