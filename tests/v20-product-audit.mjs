import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultState, migrateState } from '../src/core/store.js';
import { createTrainingOpportunity, trainingPool } from '../src/core/trainingOpportunities.js';
import { radarChart } from '../src/components/radar.js';

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const app = read('src/app.js');
const career = read('src/pages/career.js');
const training = read('src/pages/training.js');
const transfer = read('src/pages/transfer.js');
const clubs = read('src/pages/clubs.js');
const createPlayer = read('src/pages/createPlayer.js');
const more = read('src/pages/more.js');

const player = { name: '审计球员', position: 'ST', age: 16, ovr: 60, potential: 88, stats: { speed: 60, shooting: 56, passing: 64, dribbling: 63, defending: 48, physical: 55 } };
const state = createDefaultState();
state.player = structuredClone(player);

assert.ok(app.includes("clubsPage"));
assert.doesNotMatch(app, /worldPage|world:\['map'/);
assert.doesNotMatch(app, /成功概率|实际判定/);
assert.match(career, /currentOpportunity/);
assert.match(training, /data-training-plan/);
assert.match(training, /choices\.length/);
assert.match(transfer, /data-open-clubs/);
assert.doesNotMatch(transfer, /worldMapView/);
assert.match(clubs, /club-filter-panel/);
assert.match(clubs, /data-club-filter/);
assert.match(clubs, /club\.city && club\.city !== '未核实'/);
assert.doesNotMatch(clubs, /value\(club, 'city'/);
assert.match(createPlayer, /c\.city&&c\.city!=='未核实'/);
assert.doesNotMatch(createPlayer, /城市资料未核实/);
assert.match(more, /clubs/);
assert.doesNotMatch(more, /navigate\('world'\)/);

const attackIds = trainingPool('ST', state).map(item => item.gameId);
const keeperIds = trainingPool('GK', { ...state, player: { ...player, position: 'GK' } }).map(item => item.gameId);
assert.ok(attackIds.includes('shooting-target'));
assert.ok(!attackIds.some(id => id.startsWith('keeper-')));
assert.equal(keeperIds.length, 4);
const opportunity = createTrainingOpportunity(state, { seed: 'v20-product-audit' });
assert.ok(opportunity.choices.length >= 2 && opportunity.choices.length <= 4);
assert.equal(new Set(opportunity.choices.map(item => item.gameId)).size, opportunity.choices.length);

const keeperRadar = radarChart({ goalkeeping: { saves: 76, reaction: 81, positioning: 73, handling: 69, aerial: 65, distribution: 72 } }, {}, 90, 'GK');
for (const label of ['扑救', '反应', '站位', '手控球', '出击', '开球']) assert.match(keeperRadar, new RegExp(label));
const migrated = migrateState({ player: { ...player, position: 'GK' } });
assert.deepEqual(Object.keys(migrated.player.goalkeeping), ['saves', 'reaction', 'positioning', 'handling', 'aerial', 'distribution']);

console.log(JSON.stringify({ status: 'PASS', scope: 'current clubs and key-node training flow' }, null, 2));
