# Phase 24 Injury, Card, and Suspension Audit

Date: 2026-08-08

## Scope

- Active injury and suspension state now share the existing match-availability path used by selection, manual matches, and automatic matches.
- Red cards and each fifth seasonal yellow card create a persisted one-match suspension.
- Injury creation writes once to the active state, season record, injury log, and career history.
- Injured players receive only the recovery training plan; the existing injury growth penalty remains active and a completed recovery session advances rehabilitation.
- Season Review retains injury, absence, card, and suspension totals.

## Local Evidence

- Core gate: injury selection, recovery-only training, injured growth penalty, red suspension, yellow accumulation, overlapping injury and suspension, and career records all PASS.
- Real Chromium at 390x844: injury status disables match entry, recovery training changes remaining days, and yellow accumulation removes the player from the next lineup.
- Browser artifact: `test-results/phase24-yellow-suspension-390.png`.
- Focused tests: `node --test tests/phase24-availability.test.mjs tests/phase13-discipline.test.mjs`.
- Browser gate: `node tests/phase24-availability-gate.mjs`.
- Full automated suite: 144/144 PASS; repository hygiene: 3/3 PASS.
- Phase 5 pacing, Phase 6 30-node lifecycle, and all 12 responsive viewports remain PASS.
- Production build: PASS with `dist/index.html` at version 20.25.0.
- Release version: 20.25.0, channel `strict-phase-24`, schema metadata 28.

## Remote Evidence

- Implementation commit: `94df4638669e91292b8e1db3d730ead80940cb04`.
- Pull Request: `https://github.com/Ethanhui6/zuqiu1/pull/57`.
- GitHub Actions `verify`: PASS for the implementation commit.
- Native Cloudflare Pages preview: `https://2d4c00dd.zuqiu-4tt.pages.dev` (PASS, commit `94df463`).
- Preview metadata: HTTP 200, version 20.25.0, channel `strict-phase-24`, schema metadata 28.
