import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { clubs } = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs.json'), 'utf8'));
const { CLUB_CRESTS } = await import(pathToFileURL(path.join(root, 'src', 'data', 'clubCrests.js')).href);
const checked = await Promise.all(clubs.map(async club => {
  const crest = club.crest || club.crestPath || CLUB_CRESTS[club.id]?.path || null;
  return { club, crest, exists: Boolean(crest) && await fs.access(path.join(root, crest.replace(/^\.\//, ''))).then(() => true).catch(() => false) };
}));
const missing = checked.filter(item => !item.crest);
const broken = checked.filter(item => item.crest && !item.exists);
if (missing.length || broken.length) throw new Error(`missing: ${missing.length}, broken: ${broken.length}`);
const generated = checked.filter(item => item.club.crestSource?.generated).length;
console.log(JSON.stringify({ status: 'PASS', clubs: clubs.length, local: checked.length, official: checked.length - generated, generated, fallback: 0, missing: 0, broken: 0 }));
