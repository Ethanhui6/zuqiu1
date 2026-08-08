# Strict Rebuild Phase 1 Legacy Site Audit

Date: 2026-08-08

## Public-site replay

`https://legendevo.com/` was replayed at 390 x 844 and 1440 x 900 through:

- landing and the immersive/standard/fast selector;
- the complete identity, body, nationality, position, and style screen;
- the player-status surface and three academy invitations;
- signing, standard two-season preparation, season simulation, a probabilistic
  career decision, the reveal delay, and the persisted result;
- the desktop player strip, main season panel, and expandable timeline rail.

`https://career-sim.pages.dev/` was replayed at 390 x 844 and 1440 x 900 through:

- retirement summary, trophy cabinet, and next-life actions;
- origin, position, identity, and first-club selection;
- the persistent player summary and first career decision.

The public pages were read and played only. No external site was modified.

## Current ten-route replay

The locally recovered `career-sim` public build was rerun in system Chromium at
390 x 844. Ten careers covered long, normal, and express modes plus ST, LW, RW,
CM, CDM, CB, and GK. The run completed 465 visible operations: 201 choices and
264 result acknowledgements.

- Total simulated seasons: 217.
- Career end ages: 31 to 41.
- Clubs per career: 1 to 12.
- Peak OVR range: 63 to 88.
- Median peak age: 30.
- Coverage: domestic and overseas careers, top-five leagues, low seasons,
  injuries, national-team selection, trophies, active retirement, and age
  retirement.

## Accepted migration decisions

- Adopt `legendevo` player information hierarchy, desktop two-column layout,
  three-mode batching, season records, probability explanation, reveal delay,
  and timeline detail.
- Adopt `career-sim` one-decision/one-result cadence, short copy, immediate next
  action, varied life routes, and measurable interaction budgets.
- Reject `career-sim` fictional-team data and narrow desktop column.
- Reject `legendevo` creation-page length and any layout that requires the main
  action to sit below all supporting detail.
- Keep the current local project as the only implementation source.

## Gate artifacts

- `docs/NEW_UI_ARCHITECTURE.md`
- `docs/NEW_CAREER_LOOP.md`
- `test-results/phase1-legacy-replay.json`
- `legacy-recovery/career-sim.pages.dev/`

`PHASE 1 STATUS: PASS`

The phase passes because both public versions were replayed, ten recovered-site
careers were rerun, and the required UI architecture and career loop are now
explicit implementation contracts.

---

# Historical Phase 1 Legacy Site Audit

Date: 2026-08-08

Reference: `https://career-sim.pages.dev/`

Development source remains the current local project. The old site is used only for behavior research and recovery of its own public artifacts.

## Resource recovery

The previously captured `data.js`, `events.js`, `sim.js`, and `game.js` contained mojibake while the public deployment rendered correct Chinese. These four files were recaptured byte-for-byte from the public deployment and validated in local system Chromium. The unchanged `index.html`, `style.css`, `crests.js`, and `qr.js` already matched the deployment.

| File | SHA-256 |
| --- | --- |
| `data.js` | `871B45D072010B4F4122DA3ABC1D34719D9634A8EA75CD5595F5F0F40403D00C` |
| `events.js` | `BCDFF82D8AAA10D48C3156FDCCF6976FD67D1F94FE9D2692EFBE567394C5E36F` |
| `sim.js` | `F74144F8806E63E9C71C9D57CDE880AFD1F23EFFF44658BCE73D15426664406E` |
| `game.js` | `47BF484B68E1961A039A74D4AE8C51A61F9574CB635529D7D8E78849FA6815C9` |

No valid public manifest, service worker, or source map was available. Those URLs returned the application HTML rather than the requested artifact.

## Ten-route replay

The recovered site ran locally at 390 x 844 in system Chromium. Its real rendered decision and confirmation buttons drove ten careers across all three pace modes and seven position types. The accepted run completed 452 UI operations: 196 choices and 256 result confirmations.

| Seed | Pos | Mode | End age | Seasons | Clubs | Apps | Peak OVR | Final OVR | Peak age |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| p1-st | ST | normal | 40 | 24 | 5 | 784 | 80 | 53 | 30 |
| p1-cb | CB | normal | 30 | 14 | 2 | 490 | 67 | 64 | 27 |
| p1-gk | GK | express | 41 | 25 | 4 | 1093 | 85 | 64 | 32 |
| p1-cm | CM | express | 40 | 24 | 4 | 715 | 73 | 38 | 30 |
| p1-lw | LW | express | 31 | 15 | 1 | 478 | 79 | 73 | 27 |
| p1-rw | RW | express | 40 | 24 | 3 | 748 | 85 | 67 | 31 |
| p1-cdm | CDM | long | 39 | 23 | 8 | 816 | 76 | 49 | 25 |
| p1-star | ST | express | 37 | 21 | 1 | 856 | 69 | 52 | 31 |
| p1-def | CB | long | 39 | 23 | 6 | 636 | 63 | 37 | 28 |
| p1-keeper | GK | normal | 36 | 20 | 2 | 571 | 65 | 54 | 27 |

Coverage includes high, ordinary, and low peak trajectories; regular and low-spell seasons; transfers; overseas and top-five-league seasons; injuries; national-team caps; trophies; early voluntary retirement; age retirement; and late-career decline.

## Recovered Career Loop

1. Start at age 16 and choose one of three academy offers.
2. Simulate a mode-sized period: long 1 season, normal 2 seasons, express 3 seasons.
3. Stop for a narrative decision, transfer decision, or period result.
4. Require a result confirmation before the next period.
5. Preserve complete season appearances, goals/assists or goalkeeper statistics, trophies, national-team runs, clubs, and earnings.
6. Repeat until voluntary retirement, no offers, or age 40/41.

The old loop's speed comes from batching seasons, not from omitting season statistics or automatically hiding important results.

## Growth findings

- The accepted routes peaked from OVR 63 to 85; low and high trajectories clearly diverged.
- Median peak age was 29, with observed peaks from 25 to 32.
- Long careers declined materially after the peak; several finished 20 to 40 OVR below their maximum.
- Playing time, league level, events, transfers, injuries, and role altered the path rather than applying one fixed annual gain.
- Goalkeeper output used appearances, clean sheets, and goals conceded rather than attacker statistics.

## Reference-site limitation

The same seed creates the same initial state, but rendering the old UI also consumes the simulator RNG. Replaying the same choices can therefore diverge after later renders. This coupling belongs to the recovered reference site and is not imported into the current project. Current-game deterministic tests remain the authority for the new engine.

## Gate result

Phase 1 PASS. The reproducible runner is `tests/phase1-legacy-replay.mjs`; its detailed ignored output is `test-results/phase1-legacy-replay.json`.
