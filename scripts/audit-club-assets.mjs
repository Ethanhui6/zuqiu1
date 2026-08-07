import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { clubs } = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs.json'), 'utf8'));
const { CLUB_CRESTS } = await import(pathToFileURL(path.join(root, 'src', 'data', 'clubCrests.js')).href);
const checked = await Promise.all(clubs.map(async club => {
  const crest = club.crest || club.crestPath || CLUB_CRESTS[club.id]?.path || null;
  return { club, crest, exists: !crest || await fs.access(path.join(root, crest.replace(/^\.\//, ''))).then(() => true).catch(() => false) };
}));
const invalid = checked.filter(item => !item.exists);
if (invalid.length) throw new Error(`${invalid.length} club crest paths are broken`);
const exact = checked.filter(item => item.crest).length;
console.log(JSON.stringify({ status: 'PASS', clubs: clubs.length, exact, fallback: clubs.length - exact, missing: 0, broken: 0 }));
