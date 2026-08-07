import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { AUTO_PAUSE_RULES } from '../src/app/config.js';
import { createNewSave, createTalentCandidates, generateAcademyOffers } from '../src/systems/career/careerSystem.js';
import { acknowledgeEventDecision, advanceCareer, ensureTimeState } from '../src/systems/career/timeAdvanceSystem.js';
import { resolveEventChoice } from '../src/systems/event/eventEngine.js';
import { setAutoPause, setPaceMode, setSpeed, setStrategies } from '../src/systems/pace/paceSystem.js';

const read = path => fs.readFile(new URL(path, import.meta.url), 'utf8').then(JSON.parse);

async function createRepository() {
  const [{ clubs }, templates, achievements] = await Promise.all([
    read('../data/clubs.json'),
    read('../data/legend-templates.json'),
    read('../data/achievements.json')
  ]);
  return {
    clubs,
    templates,
    achievements,
    getClub: id => clubs.find(club => club.id === id) || clubs[0],
    loadEventCategory: category => read(`../data/events/${category}.json`)
  };
}

async function createCareer() {
  const repo = await createRepository();
  const seed = 'phase17-full-career';
  const [talent] = createTalentCandidates({ seed, position: 'ST', style: 'Complete striker', templates: repo.templates, count: 1 });
  const [academyOffer] = generateAcademyOffers({ seed, nation: 'China', position: 'ST', ovr: 66, talent, clubs: repo.clubs });
  const save = createNewSave({
    seed,
    name: 'Career Regression',
    nation: 'China',
    age: 16,
    birthDate: '2010-06-15',
    height: 180,
    weight: 74,
    foot: 'Right',
    number: 9,
    position: 'ST',
    style: 'Complete striker',
    talent,
    academyOffer,
    sourceTemplate: repo.templates.find(template => template.id === talent.sourceTemplateId),
    paceMode: 'legend'
  }, repo.getClub(academyOffer.clubId), 'phase17');

  save.player.hidden = { ...save.player.hidden, discipline: 85, professionalism: 90, learning: 90, injuryProne: 0 };
  setPaceMode(save, 'legend');
  setSpeed(save, 'turbo');
  setStrategies(save, { training: 'balanced', match: 'team', career: 'starter' });
  for (const key of Object.keys(AUTO_PAUSE_RULES)) setAutoPause(save, key, false);
  ensureTimeState(save, repo);

  const opening = save.career.pending.event;
  resolveEventChoice(save, opening.choices[0].id);
  acknowledgeEventDecision(save);
  return { repo, save };
}

test('phase 17 advances a sixteen-year-old through one complete retirement', async () => {
  const { repo, save } = await createCareer();
  const startAge = save.player.age;
  const results = [];

  while (!save.career.retirement && results.length < 24) {
    const ageBefore = save.player.age;
    const result = await advanceCareer(save, repo, 'season');
    results.push(result);
    assert.ok(['season-end', 'retirement'].includes(result.reason));
    assert.equal(save.player.age, ageBefore + 1);
  }

  const seasonRecords = save.career.history.filter(item => item.type === 'season');
  assert.ok(save.career.retirement, 'career must produce a retirement snapshot');
  assert.equal(save.player.age, 38);
  assert.equal(seasonRecords.length, save.player.age - startAge);
  assert.equal(new Set(seasonRecords.map(record => record.season)).size, seasonRecords.length);
  assert.ok(save.career.careerStats.apps > 0, 'career must retain match history data');
  assert.ok(save.career.trophies.every(trophy => trophy.name && trophy.assetId && trophy.season));
  assert.ok(save.career.retirement.name && save.career.retirement.desc);
  assert.equal(results.filter(result => result.reason === 'retirement').length, 1);
  assert.doesNotThrow(() => structuredClone(save));
});
