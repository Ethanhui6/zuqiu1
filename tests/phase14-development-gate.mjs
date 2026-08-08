import assert from 'node:assert/strict';
import { createDefaultState } from '../src/core/store.js';
import { applySeasonDevelopment } from '../src/core/playerDevelopmentEngine.js';

const profiles = ['wonderkid', 'balanced', 'late-bloomer', 'injury-setback', 'early-peak'];
const runs = [];
for (const profile of profiles) for (let index = 0; index < 20; index += 1) {
  const state = createDefaultState();
  state.player = { ...state.player, name: `PH14 ${profile} ${index}`, age: 16, position: 'CM', ovr: 62, potential: profile === 'wonderkid' ? 96 : 86, dynamicPotential: profile === 'wonderkid' ? 96 : 86, developmentProfile: profile, stats: { speed: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 }, goalkeeping: {} };
  const curve = [];
  for (let age = 16; age <= 36; age += 1) {
    state.player.age = age;
    const injured = profile === 'injury-setback' && age >= 20 && age <= 23;
    state.season.minutes = injured ? 300 : 2400;
    state.season.rating = injured ? 6.2 : 7.2;
    state.season.injuryAbsences = injured ? 25 : 0;
    applySeasonDevelopment(state, { minutes: state.season.minutes, rating: state.season.rating, injuryAbsences: state.season.injuryAbsences });
    curve.push({ age, ovr: state.player.ovr });
  }
  const peak = curve.reduce((best, row) => row.ovr > best.ovr ? row : best, curve[0]);
  runs.push({ profile, curve, peakAge: peak.age, peakOvr: peak.ovr, endOvr: curve.at(-1).ovr });
}

const average = (items, from, to) => items.reduce((sum, row) => sum + row.curve.filter(point => point.age >= from && point.age <= to).at(-1).ovr - row.curve.find(point => point.age === from).ovr, 0) / items.length;
const group = profile => runs.filter(row => row.profile === profile);
const wonderkids = group('wonderkid'), balanced = group('balanced'), lateBloomers = group('late-bloomer'), injured = group('injury-setback'), earlyPeaks = group('early-peak');
assert.ok(average(wonderkids, 16, 18) > average(balanced, 16, 18), 'wonderkids need faster youth growth');
assert.ok(average(lateBloomers, 16, 18) < average(balanced, 16, 18), 'late bloomers need slower youth growth');
assert.ok(average(lateBloomers, 22, 28) > average(balanced, 22, 28), 'late bloomers need a later growth window');
assert.ok(injured.every(row => row.curve.find(point => point.age === 24).ovr <= row.curve.find(point => point.age === 20).ovr + 1), 'injury setbacks need a visible injury-window cost');
assert.ok(earlyPeaks.every(row => row.peakAge <= 27), 'early peaks must peak earlier');
assert.ok(wonderkids.some(row => row.peakOvr - row.curve[0].ovr > 1) && wonderkids.some(row => row.peakOvr - row.curve[0].ovr > 4), 'high potential growth cannot be fixed to one or five points');

const goalkeeper = createDefaultState();
goalkeeper.player = { ...goalkeeper.player, name: 'PH14 GK', age: 16, position: 'GK', ovr: 62, potential: 90, dynamicPotential: 90, developmentProfile: 'balanced', stats: { speed: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 }, goalkeeping: { saves: 60, reaction: 60, positioning: 60, handling: 60, aerial: 60, distribution: 60 } };
let gkPeak = 16, gkMax = 62;
for (let age = 16; age <= 36; age += 1) { goalkeeper.player.age = age; applySeasonDevelopment(goalkeeper, { minutes: 2400, rating: 7.2 }); if (goalkeeper.player.ovr > gkMax) { gkMax = goalkeeper.player.ovr; gkPeak = age; } }
const outfieldPeak = Math.round(average(balanced, 16, 28) + 16);
assert.ok(gkPeak > Math.min(...balanced.map(row => row.peakAge)), 'goalkeepers need a later peak window');
console.log(JSON.stringify({ status: 'PASS', players: runs.length + 1, ages: '16-36', profiles, wonderkidYouthGrowth: Number(average(wonderkids, 16, 18).toFixed(2)), balancedYouthGrowth: Number(average(balanced, 16, 18).toFixed(2)), lateBloomWindow: Number(average(lateBloomers, 22, 28).toFixed(2)), earlyPeakAge: Math.max(...earlyPeaks.map(row => row.peakAge)), gkPeakAge: gkPeak, outfieldPeakReference: outfieldPeak }, null, 2));
