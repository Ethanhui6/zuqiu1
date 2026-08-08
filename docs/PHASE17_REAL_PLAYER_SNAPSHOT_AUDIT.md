# Phase 17 Real Player Snapshot Audit

Date: 2026-08-08

## Snapshot

- `data/players.json` stores the roster snapshot locally; game startup performs no roster network request.
- 601 real-player identity rows are available across 73 high-reputation clubs.
- 519 rows were captured from Wikidata current-club statements using preferred-rank `P54` memberships without an end date.
- Existing curated star records remain first, including Kylian Mbappé and Cristiano Ronaldo.
- Public identity data is marked `verified-public`; project-created ability ratings remain explicitly `estimated`.
- Source URLs, club QIDs, capture date, query method, and CC0 license are recorded in `data/player-snapshot-sources.json`.
- Real snapshots lead 2026 rosters and retire deterministically in future seasons, when localized generated players take over.

## Evidence

- Static gate: `node --test tests/phase17-real-player-snapshot.test.mjs`.
- Sample: the 50 highest-reputation clubs with a public roster snapshot; zero all-NPC squads.
- Browser gate: `node tests/phase17-real-player-snapshot-gate.mjs`.
- Browser viewport: 390x844; Arsenal's production club page displays real strikers, with no runtime error, technical placeholder, or horizontal overflow.
- Screenshot: `test-results/phase17-real-roster-390.png`.
- Full automated suite: 127/127.
- Repository hygiene: 3/3.
- Production build: version 20.18.0.
- Phase 5 pacing, Phase 6 result lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass.
- Implementation commit: `a93c96e`.
- Pull Request: https://github.com/Ethanhui6/zuqiu1/pull/50.
- GitHub Actions `verify`: PASS for implementation commit `a93c96e`.
- Native Cloudflare Pages preview: `https://3bd163d1.zuqiu-4tt.pages.dev`, version 20.18.0, channel `strict-phase-17`, 601 downloaded players, source commit `a93c96e`.
