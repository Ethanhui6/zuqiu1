# Phase 16 Player Origin Sync Audit

Date: 2026-08-08

## Origin Contract

- `createPlayerOriginProfile` resolves nationality, name locale, starting country, league pool, club pool, region, and language together.
- Name generation and starting offers consume the same nationality profile.
- Countries represented in the 500-club database use their own domestic pools.
- Selectable countries without a local league snapshot use a documented regional youth pathway instead of silently falling back to the first clubs in the database.
- Locking nationality preserves the full origin profile while generated names, attributes, potential, and position can still reroll.

## Evidence

- Static gate: `node --test tests/phase16-origin-sync.test.mjs`.
- Coverage: all 22 selectable nationalities plus 100 unlocked and 100 nationality-locked rerolls.
- Required result: zero name-locale, nationality, starting-country, league-pool, or club-pool mismatches.
- Browser gate: `node tests/phase16-origin-sync-gate.mjs`.
- Browser viewport: 390x844; switching Japan to England changes the generated name and yields only English starting offers, with no runtime error or horizontal overflow.
- Screenshot: `test-results/phase16-origin-sync-390.png`.
- Full automated suite: 125/125.
- Repository hygiene: 3/3.
- Production build: version 20.17.0.
- Phase 5 pacing, Phase 6 result lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass.
- Implementation commit: `3d8ddcc`.
- Pull Request: https://github.com/Ethanhui6/zuqiu1/pull/49.
- GitHub Actions `verify`: PASS for implementation commit `3d8ddcc`.
- Native Cloudflare Pages preview: `https://2127f03d.zuqiu-4tt.pages.dev`, version 20.17.0, channel `strict-phase-16`, source commit `3d8ddcc`.
