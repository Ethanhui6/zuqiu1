import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('phase 9: match preview keeps both squads, ranks, forms and player status', () => {
  const source = fs.readFileSync(new URL('../src/pages/match.js', import.meta.url), 'utf8');
  for (const field of ['match-preview__teams', 'crestSvg', 'formation', 'rank', 'formDots', 'match-preview__lineups', 'expectedLineup', 'isPlayer', 'match-preview__player-status']) assert.match(source, new RegExp(field));
});
