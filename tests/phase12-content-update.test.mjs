import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contentSnapshot, syncContentMetadata } from '../src/core/contentVersion.js';
import { completeOffSeason, resolveOffSeasonActivity, settleSeason } from '../src/systems/honors/honorsSystem.js';

const version = JSON.parse(fs.readFileSync(new URL('../data/version.json', import.meta.url), 'utf8'));

function state() {
  return {
    simulation: { date: '2027-06-30' },
    content: contentSnapshot({ contentVersion: '2026.08.08.4', version: '20.40.0', buildVersion: 'old', buildDate: '2026-08-01' }),
    player: { name: 'PH12 Player', nation: '中国', club: 'PH12 FC', clubId: 'ph12-fc', age: 20, position: 'CM', number: 10, ovr: 72, potential: 88, stats: { speed: 72, shooting: 64, passing: 76, dribbling: 73, defending: 62, physical: 68 }, fatigue: 82, fitness: 40, morale: 48 },
    injuries: [],
    season: { year: '2026/27', appearances: 24, starts: 18, minutes: 1500, goals: 8, assists: 9, rating: 7.4, startOvr: 70, startMarketValue: 800000, startStats: { speed: 70, shooting: 62, passing: 74, dribbling: 71, defending: 60, physical: 66 } },
    career: { marketValue: 1200000, weeklySalary: 1800, contractMonths: 0, history: [], honors: null },
    training: {},
    transfer: { inbox: [], offers: [] },
    news: { items: [], unread: 0 },
    ui: { todos: [] },
    schedule: []
  };
}

test('PH12 keeps program and content versions separate and queues newer content', () => {
  assert.match(version.version, /^\d+\.\d+\.\d+$/);
  assert.ok(version.contentVersion);
  assert.ok(version.contentUpdatedAt);
  assert.ok(Array.isArray(version.updateLog) && version.updateLog.length > 0);
  const save = state();
  syncContentMetadata(save, version);
  assert.equal(save.content.version, '2026.08.08.4');
  assert.equal(save.content.pending.version, version.contentVersion);
});

test('PH12 records content on the completed season and activates it after off-season', () => {
  const save = state();
  const settled = settleSeason(save);
  assert.equal(settled.record.contentVersion, '2026.08.08.4');
  assert.equal(save.season.contentVersion, '2026.08.08.4');
  const activity = { id: 'renewal', title: 'renewal', copy: 'renewal', fatigue: 0, fitness: 0, morale: 0, recoveryDays: 0 };
  save.career.offSeason.activities = [activity];
  assert.ok(resolveOffSeasonActivity(save, activity.id));
  assert.equal(save.career.contractMonths, 24);
  save.content.pending = contentSnapshot(version);
  assert.equal(completeOffSeason(save), true);
  assert.equal(save.content.version, version.contentVersion);
  assert.equal(save.content.pending, null);
  assert.equal(save.season.contentVersion, version.contentVersion);
  assert.equal(save.career.offSeason.status, 'complete');
  assert.equal(save.career.history[0].type, 'content-update');
});
