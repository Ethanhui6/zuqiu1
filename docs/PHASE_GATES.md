# Phase Gates

Local repository state is the source of truth. A phase may move to `PASS` only after its implementation, automated tests, local runtime test, applicable mobile test, and acceptance evidence all pass.

| Phase | Scope | Status |
| ---: | --- | --- |
| 0 | Local project audit | PASS |
| 1 | Legacy site research and recovery | PASS |
| 2 | Global UI and layout | PASS |
| 3 | Match hub UI | PASS |
| 4 | Full-season match simulation | PASS |
| 5 | Career pacing | PASS |
| 6 | Fast-mode feedback | PASS |
| 7 | Development curve | IN_PROGRESS |
| 8 | Development feedback animation | LOCKED |
| 9 | Career timeline | LOCKED |
| 10 | Club interactions | LOCKED |
| 11 | Toast system | LOCKED |
| 12 | Career events | LOCKED |
| 13 | Mini-games | LOCKED |
| 14 | Position, play style, and trait isolation | LOCKED |
| 15 | Elite-club entry | LOCKED |
| 16 | Nationality, name, and starting-club synchronization | LOCKED |
| 17 | Real-player database | LOCKED |
| 18 | Random-name system | LOCKED |
| 19 | Transfer invitations | LOCKED |
| 20 | Clubs and competitions | LOCKED |
| 21 | Club crests | LOCKED |
| 22 | Trophies and awards | LOCKED |
| 23 | Season review | LOCKED |
| 24 | Injuries, cards, and suspensions | LOCKED |
| 25 | World news | LOCKED |
| 26 | Color and game feel | LOCKED |
| 27 | Full career from age 16 to retirement | LOCKED |
| 28 | Final mobile regression | LOCKED |
| 29 | Final code cleanup | LOCKED |
| 30 | Release | LOCKED |

## Phase 0 Gate

- [x] Repository, branch, HEAD, remote, and uncommitted files recorded.
- [x] Runtime entry, build scripts, data directories, and system modules inventoried.
- [x] Full automated test suite passes on the current local worktree: 108/108.
- [x] Production build passes on the current local worktree: version 20.4.0.
- [x] Repository hygiene and secret scans pass.
- [x] Required mobile viewport audit passes at 320, 360, 375, 390, 393, 414, 428, 430, 768, 1280, 1440, and 1920 px.
- [x] Browser-driven flow covers player creation through signing.
- [x] Browser-driven flow covers training, club, match preview, mini-game, and match result.
- [x] Browser-driven flow covers three seasons, three season reviews, transfer, and the next season.
- [x] Operation counts, age/date nodes, pause reasons, resolved issues, and regressions are recorded in `docs/PHASE0_REPLAY_REPORT.md`.

Phase 0 gate result: `PASS` on 2026-08-08. It unlocked Phase 1.

## Phase 1 Gate

- [x] Public legacy artifacts were inventoried and locally preserved.
- [x] Four encoding-damaged public scripts were recaptured and validated in a local browser.
- [x] Ten distinct browser-driven careers reached retirement without a dead end.
- [x] Long, normal, and express pacing modes were exercised.
- [x] High, ordinary, and low trajectories; bench/regular roles; transfers; overseas and elite leagues; injuries; national team; trophies; slumps; and retirement were covered.
- [x] Player operation counts and result-confirmation counts were recorded.
- [x] The legacy Career Loop, growth trend, peak ages, decline, and transfer cadence were extracted.
- [x] Recovery artifacts remain isolated from the current production build.

Phase 1 gate result: `PASS` on 2026-08-08. Phase 2 is now the only unlocked phase.

## Phase 2 Gate

- [x] Header, BottomNav, fixed action, Toast, Sheet, and Modal share named layout and stacking variables.
- [x] Safe-area and page spacing values are centralized without changing established geometry.
- [x] The visible toast queue is capped at three and cannot intercept pointer input.
- [x] The fixed action remains the actual hit target while toasts are visible.
- [x] The Phase 2 browser gate passes at 320, 375, 390, 393, 414, 428, and 430 px.
- [x] Sheet, dialog, close cleanup, and dynamic viewport behavior pass in system Chromium.
- [x] Full automated tests pass: 108/108.
- [x] Production build passes: version 20.4.0.
- [x] Repository hygiene passes: 3/3.
- [x] The full mobile layout audit passes at all 12 required viewports.
- [x] Generated 320 x 568 and 1280 x 720 screenshots were visually checked.

Phase 2 gate result: `PASS` on 2026-08-08. Phase 3 is now the only unlocked phase.

## Phase 3 Gate

- [x] Match Hub first surface shows competition, both crests, home/away state, rank, strength, form, formation, and player status.
- [x] Player status covers starting, substitute, and not-selected states with position, fitness, and morale.
- [x] The page contains exactly one enabled and uncovered `进入比赛` CTA.
- [x] The inline 22-row lineup was replaced with a dedicated Formation Sheet.
- [x] Formation Sheet switches between home and away teams and renders eleven named pitch nodes per side.
- [x] The career player is highlighted on the pitch or in an explicit bench/status row.
- [x] Six formations are supported and exercised in the browser gate.
- [x] Ten different matches pass across home/away states and 320 to 1280 px viewports.
- [x] Formal lineup UI contains no technical placeholder names.
- [x] Full automated tests pass: 108/108.
- [x] Production build passes: version 20.4.0.
- [x] Repository hygiene passes: 3/3.
- [x] Phase 2 layout regression and the 12-viewport mobile audit remain green.

Phase 3 gate result: `PASS` on 2026-08-08. Phase 4 is now the only unlocked phase.

## Phase 4 Gate

- [x] Every generated season contains 34 to 40 dated fixtures using clubs from the 500-club registry.
- [x] Standard mode marks at most two key matches; ordinary matches remain automatic.
- [x] Automatic and interactive matches write through one idempotent result recorder.
- [x] Season and fixture records include starts, minutes, shots, key passes, tackles, interceptions, saves, clean sheets, cards, player-of-match awards, and injury absences.
- [x] A deterministic 100-season Gate produces 20 to 40 appearances per season and distinct attacker, midfielder, defender, and goalkeeper records.
- [x] Existing suspension behavior remains green: a red card prevents the next appearance and is served once.
- [x] Browser validation confirms ordinary fixtures settle before the first training pause and are visible in club and career records.
- [x] Phase 2 layout, Phase 3 Match Hub, and all 12 mobile/desktop viewport regressions pass.
- [x] Full automated tests pass: 108/108; repository hygiene passes: 3/3.
- [x] Production build passes as version 20.5.0.

Phase 4 gate result: `PASS` on 2026-08-08. Phase 5 is now the only unlocked phase.

## Phase 5 Gate

- [x] Fast seasons expose two fixed career-event windows without weekly player input.
- [x] Training and event windows survive same-day fixture collisions by triggering on the next free day in their week.
- [x] Every tested fast season contains two interactive training nodes, two to four career events, zero forced interactive matches, and at least 34 automatic fixture settlements.
- [x] Fast-season pacing remains within the 20-35 second interaction budget.
- [x] Five independent careers complete age 16 to 30 without weekly advancement actions.
- [x] One independent career completes age 16 to retirement at age 38.
- [x] A browser-driven 390x844 replay completes three seasons with two training and two career-event stops per season.
- [x] Full automated tests pass: 108/108; repository hygiene passes: 3/3.
- [x] The full 12-viewport mobile audit remains green.
- [x] Production build passes as version 20.6.0.

Phase 5 gate result: `PASS` on 2026-08-08. Phase 6 is now the only unlocked phase.

## Phase 6 Gate

- [x] Match, event, training/growth, season/trophy, transfer, injury, national-team event, and retirement outcomes route through persistent result surfaces.
- [x] Persistent results cannot be dismissed by a close button, backdrop click, downward swipe, or Escape.
- [x] Six browser-driven fast seasons produce 30 consecutive acknowledged result nodes: 12 training, 12 event, and 6 season-review results.
- [x] The first training result remains visible for more than 2.2 seconds without player input.
- [x] Browser runtime separately covers match, injury, transfer, and retirement acknowledgements.
- [x] Full automated tests pass: 108/108; repository hygiene passes: 3/3.
- [x] Phase 2 layout, Phase 3 Match Hub, and all 12 mobile/desktop viewport regressions pass.
- [x] Production build passes as version 20.7.0.
- [x] GitHub Actions `verify` passes for Pull Request #39.
- [x] Cloudflare Pages creates a successful preview for commit `13a8dfd`.

Phase 6 gate result: `PASS` on 2026-08-08. Phase 7 is now the only unlocked phase.
