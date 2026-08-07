# Phase 9 Career Timeline Audit

Date: 2026-08-08

Version: 20.10.0

Branch: `codex/phase-9-career-timeline`

## Result

The repeated season-card list is replaced by one chronological career timeline. It projects from the existing season honors, career history, and retirement records, so no second timeline store or migration path was added.

Every season node includes the club crest, club, age, position, starting and ending OVR, appearances, goals, assists, rating, and honors. Stable milestone nodes cover debut, first goal, transfers, national-team appearances, injuries, comebacks, trophies, Golden Boy, Ballon d'Or, captaincy, retirement, and other recorded career highlights.

The same timeline renderer is used on the career home page and in the Honors Room. Season settlement now preserves the player's team role so captain milestones remain available after the season ends.

## Phase Gate

`node --test tests/phase9-career-timeline.test.mjs`

- Ten chronological season nodes: PASS.
- Complete season fields and ten loaded crests: PASS.
- Stable and duplicate-free timeline IDs: PASS.
- Required career milestone types: PASS.
- Shared rendered timeline: PASS.

`node tests/phase9-career-timeline-gate.mjs`

- Real Chromium at 320x844, 390x844, and 430x844: PASS.
- Ten seasons and 28 unique timeline nodes: PASS.
- Crests loaded: 10/10; broken: 0.
- Horizontal overflow: 0.
- Screenshot: `test-results/phase9-career-timeline-390.png`.

## Regression Evidence

- Full automated suite: 110/110 PASS.
- Production build: PASS, version 20.10.0.
- Phase 5 pacing and retirement gates: PASS.
- Phase 8 development feedback browser gate: PASS.
- Browser-driven three-season career replay: PASS.
- Browser-driven 30-result-node gate: PASS.
- Full mobile audit: PASS at 12 viewports from 320x568 to 1920x1080.
- Phase 2 layout audit: PASS at seven mobile widths from 320 to 430 px.

- Implementation commit: `9a9d324`.
- Pull Request: #42, stacked on `codex/phase-8-development-feedback`.
- GitHub Actions `verify`: PASS.
- Cloudflare Pages native preview for `9a9d324`: PASS.
- Preview: `https://bcdca620.zuqiu-4tt.pages.dev`.
