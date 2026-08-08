# Phase 28 Final Mobile Audit

Date: 2026-08-08

## Scope

- The final mobile gate runs at 320, 375, 390, 393, 414, 428, and 430 px without substituting desktop layouts.
- Every width covers creation, career, match, lineups, match mini-games, training, training mini-games, transfer, clubs, medical, news, honors, season review, and retirement.
- Shared checks cover horizontal overflow, fixed action and BottomNav geometry, pointer hit targets, toast overlap, Sheet/Dialog bounds, body scroll locking, runtime errors, and overlay cleanup.
- The 320 px match mini-pitch now derives its height from the available Sheet width instead of forcing a 286 px minimum width.
- Dialogs now use the same `has-open-sheet` lifecycle as Sheets, keeping scroll locking and cleanup state consistent.
- The historical Phase 3 gate now treats the unavailable match command as intentionally disabled when the player is not selected.

## Local Evidence

- Phase 28 browser gate: `node tests/phase28-final-mobile-gate.mjs`.
- Result: PASS across all seven phone widths, 14 required surfaces, and 154 geometry/lifecycle snapshots.
- Existing 12-viewport audit: PASS from 320x568 through 1920x1080.
- Existing seven-width global layout gate: PASS.
- Existing ten-match Phase 3 match hub gate: PASS with selected, substitute, and unavailable states.
- Browser artifact: `test-results/phase28-final-mobile.json`.
- Screenshot: `test-results/phase28/retirement-390x844.png`.
- Full automated suite: 150/150 PASS; repository hygiene: 3/3 PASS.
- Production build, Phase 5 pacing, Phase 6 30-node lifecycle, and ten-match Phase 3 gate: PASS.
- Production build: PASS with `dist/index.html` at version 20.29.0.
- Release version: 20.29.0, channel `strict-phase-28`, schema metadata 32.

## Remote Evidence

- Implementation commit: pending.
- Pull Request: pending.
- GitHub Actions `verify`: pending.
- Native Cloudflare Pages preview: pending.
