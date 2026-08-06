import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { clubs } = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs.json'), 'utf8'));
const checked = await Promise.all(clubs.map(async club => ({ club, exists: !club.crest || await fs.access(path.join(root, club.crest.replace(/^\.\//, ''))).then(() => true).catch(() => false) })));
const invalid = checked.filter(item => !item.exists);
if (invalid.length) throw new Error(`${invalid.length} club crest paths are broken`);
console.log(JSON.stringify({ status: 'PASS', clubs: clubs.length, matched: clubs.filter(club => club.crest).length, unmatched: clubs.filter(club => !club.crest).length }));
