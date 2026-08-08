import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => JSON.parse(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const list = value => Array.isArray(value) ? value : value?.events || value?.players || value?.achievements || value?.trophies || [];

const clubs = read('data/clubs.json');
const expansion = read('data/world-expansion.json');
const players = list(read('data/players.json'));
const achievements = list(read('data/achievements.json'));
const trophies = list(read('data/trophies.json'));
const careerEvents = list(read('data/events/career-events.json'));
const positionEvents = list(read('data/events/position-events.json'));
const storyChains = list(read('data/events/story-chains.json'));
const version = read('data/version.json');

test('PH0 inventory retains the current world baseline and recoverable legacy tree', () => {
  assert.ok((clubs.clubs || clubs).length >= 399);
  assert.equal((clubs.clubs || clubs).length + (expansion.clubs || []).length, 544);
  assert.equal(players.length, 601);
  assert.equal(new Set(players.map(player => player.clubId)).size, 73);
  assert.equal(achievements.length, 330);
  assert.equal(trophies.length + (expansion.trophies || []).length, 44);
  assert.equal(careerEvents.length, 568);
  assert.equal(positionEvents.length, 6000);
  assert.equal(storyChains.length, 20);
  assert.equal(version.version, '20.34.0');
  assert.ok(fs.existsSync(new URL('../legacy/', import.meta.url)));
});
