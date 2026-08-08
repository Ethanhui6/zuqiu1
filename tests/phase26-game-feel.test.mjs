import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('phase 26 assigns distinct semantic accents to the six main pages', () => {
  for (const token of ['match', 'growth', 'honor', 'transfer', 'injury', 'media', 'fitness', 'pressure', 'national']) {
    assert.match(css, new RegExp(`--${token}:#[0-9a-f]{6}`, 'i'), `missing --${token}`);
    assert.match(css, new RegExp(`--${token}-soft:rgba\\(`), `missing --${token}-soft`);
  }
  const accents = {
    career: 'fitness',
    'match-hub': 'match',
    training: 'growth',
    transfer: 'transfer',
    clubs: 'national',
    more: 'media'
  };
  for (const [page, token] of Object.entries(accents)) {
    assert.match(css, new RegExp(`\\.${page}-page \\{ --page-accent:var\\(--${token}\\)`));
  }
  assert.equal(new Set(Object.values(accents)).size, 6);
});

test('phase 26 semantic feedback wins the legacy cascade and clubs retain their own theme', () => {
  const finalCascade = css.indexOf('Phase 26 final cascade');
  assert.ok(finalCascade > css.indexOf('.metric-fill.green{background:linear-gradient'));
  for (const selector of ['.match-hub-page .match-enter-button', '.growth-feedback {', '.transfer-page .transfer-inbox-tabs button.active', '.honor-card,', '.notice-card.critical {', '.news-broadcast {', '.metric-fill.green {', '.metric-fill.orange {']) {
    assert.ok(css.indexOf(selector, finalCascade) > finalCascade, `${selector} must be in the final cascade`);
  }
  const clubs = fs.readFileSync(new URL('../src/pages/clubs.js', import.meta.url), 'utf8');
  const more = fs.readFileSync(new URL('../src/pages/more.js', import.meta.url), 'utf8');
  assert.match(clubs, /function getClubTheme\(club\)/);
  assert.match(clubs, /--club-accent:\$\{theme\.accent\}/);
  assert.match(more, /page more-page/);
});
