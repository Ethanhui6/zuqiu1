import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { availableTransferClubs } from '../src/pages/transfer.js';
import { clubInteractionActions } from '../src/pages/clubs.js';

test('phase 15 excludes the current club and keeps technical fields out of transfer display', () => {
  const state = { player: { clubId: 'current', club: 'Current FC' } };
  const clubs = [{ id: 'current', name: 'Current FC' }, { id: 'target', name: 'Target FC' }, { id: 'alias-current', name: 'Current FC' }];
  assert.deepEqual(availableTransferClubs(state, clubs).map(club => club.id), ['target']);
  const transfer = fs.readFileSync(new URL('../src/pages/transfer.js', import.meta.url), 'utf8');
  assert.doesNotMatch(transfer, /dataSource|crestPath|unverifiedFields|JSON\.stringify/);
  assert.ok(clubInteractionActions(true).includes('coach'));
  assert.ok(clubInteractionActions(true).includes('transfer-request'));
  assert.ok(!clubInteractionActions(true).includes('contact'));
  assert.ok(clubInteractionActions(false).includes('contact'));
  assert.ok(!clubInteractionActions(false).includes('coach'));
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /clubInteractions\.cooldowns/);
});
