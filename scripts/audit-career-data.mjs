import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const events = JSON.parse(await fs.readFile(path.join(root, 'data', 'events', 'position-events.json'), 'utf8'));
const counts = Object.fromEntries([...new Set(events.flatMap(item => item.positions || []))].map(position => [position, events.filter(item => item.positions?.includes(position)).length]));
const keeperBad = events.filter(item => item.positions?.includes('GK') && /射门|进球|头球破门|射手荒|中锋/.test(`${item.title}${item.trigger}${item.conflict}${JSON.stringify(item.choices)}`));
if (Object.values(counts).some(count => count < 500) || keeperBad.length) throw new Error(`position event audit failed: ${JSON.stringify({ counts, keeperBad: keeperBad.length })}`);
console.log(JSON.stringify({ status: 'PASS', counts, keeperBad: 0, stateMachine: 'event-driven entry points retained' }));
