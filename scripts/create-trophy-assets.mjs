import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TROPHY_LIST } from '../src/data/trophyRegistry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const missing = [];
for (const trophy of TROPHY_LIST) {
  try { await fs.access(path.join(root, trophy.asset.replace(/^\.\//, ''))); }
  catch { missing.push(trophy.id); }
}
if (missing.length) throw new Error(`Missing imported legacy trophy assets: ${missing.join(', ')}`);
console.log(JSON.stringify({ status: 'PASS', importedAssets: TROPHY_LIST.length, generatedAssets: 0 }));
