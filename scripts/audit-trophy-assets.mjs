import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TROPHY_LIST, TROPHY_REGISTRY } from '../src/data/trophyRegistry.js';
import { OBTAINABLE_AWARD_IDS } from '../src/components/trophyIcon.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacy = JSON.parse(await fs.readFile(path.join(root, 'data', 'legendevo-trophies.json'), 'utf8'));
const expansion = JSON.parse(await fs.readFile(path.join(root, 'data', 'world-expansion.json'), 'utf8'));
const missing = [];
for (const item of [...TROPHY_LIST, ...legacy]) {
  const asset = item.asset || `./${item.image}`;
  try { await fs.access(path.join(root, asset.replace(/^\.\//, ''))); }
  catch { missing.push(item.id); }
}
const awards = TROPHY_LIST.filter(item => item.kind === 'award');
const badCompetitionRefs = (expansion.competitions || []).filter(item => TROPHY_REGISTRY[item.trophyId]?.kind !== 'competition');
const result = {
  status: 'PASS', currentMappings: TROPHY_LIST.length, legacyCatalog: legacy.length,
  competitions: TROPHY_LIST.length - awards.length, awards: awards.length,
  missing: missing.length, nonLegacySvgMappings: TROPHY_LIST.filter(item => item.asset.endsWith('.svg')).length,
  duplicateAwardAssets: awards.length - new Set(awards.map(item => item.asset)).size,
  badCompetitionRefs: badCompetitionRefs.length,
  missingAwards: OBTAINABLE_AWARD_IDS.filter(id => TROPHY_REGISTRY[id]?.kind !== 'award').length
};
if (Object.entries(result).some(([key, value]) => !['currentMappings','legacyCatalog','competitions','awards'].includes(key) && key !== 'status' && value)) throw new Error(JSON.stringify({ ...result, status: 'FAIL' }));
console.log(JSON.stringify(result));
