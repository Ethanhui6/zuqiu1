# Phase 25 World News Audit

Date: 2026-08-08

## Scope

- The existing news engine now produces two deterministic world stories per month without pausing career advancement.
- World stories cover leagues, transfers, champions, relegation, awards, national teams, coaches, injuries, rising stars, retirements, and records.
- Stories use non-player clubs and local player identities when available, while player-match news is limited to notable performances.
- Every producer uses the shared title and copy deduplication path; the news center retains up to 120 items and the home page still shows only three to five important items.

## Local Evidence

- Three-season gate: 72/72 world stories, 11/11 topics, unique IDs, titles, and copy, with world stories outnumbering player stories.
- CareerDirector integration: three real seasons retain all 11 topics and a world-news majority without a new interaction stop.
- Real Chromium at 390x844: five home headlines, complete news center, zero runtime errors, and zero horizontal overflow.
- Browser artifact: `test-results/phase25-world-news-390.png`.
- Focused tests: `node --test tests/phase25-world-news.test.mjs tests/phase14-world-news.test.mjs`.
- Browser gate: `node tests/phase25-world-news-gate.mjs`.
- Full automated suite: 146/146 PASS; repository hygiene: 3/3 PASS.
- Phase 5 pacing, Phase 6 30-node lifecycle, and all 12 responsive viewports remain PASS.
- Production build: PASS with `dist/index.html` at version 20.26.0.
- Release version: 20.26.0, channel `strict-phase-25`, schema metadata 29.

## Remote Evidence

- Implementation commit: pending.
- Pull Request: pending.
- GitHub Actions `verify`: pending.
- Native Cloudflare Pages preview: pending.
