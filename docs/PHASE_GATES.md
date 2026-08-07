# Phase Gates

Local repository state is the source of truth. A phase may move to `PASS` only after its implementation, automated tests, local runtime test, applicable mobile test, and acceptance evidence all pass.

| Phase | Scope | Status |
| ---: | --- | --- |
| 0 | Local project audit | PASS |
| 1 | Legacy site research and recovery | IN_PROGRESS |
| 2 | Global UI and layout | LOCKED |
| 3 | Match hub UI | LOCKED |
| 4 | Full-season match simulation | LOCKED |
| 5 | Career pacing | LOCKED |
| 6 | Fast-mode feedback | LOCKED |
| 7 | Development curve | LOCKED |
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
- [x] Required mobile viewport audit passes at 320, 360, 375, 390, 393, 428, 430, 768, 1280, 1440, and 1920 px.
- [x] Browser-driven flow covers player creation through signing.
- [x] Browser-driven flow covers training, club, match preview, mini-game, and match result.
- [x] Browser-driven flow covers three seasons, three season reviews, transfer, and the next season.
- [x] Operation counts, age/date nodes, pause reasons, resolved issues, and regressions are recorded in `docs/PHASE0_REPLAY_REPORT.md`.

Phase 0 gate result: `PASS` on 2026-08-08. Phase 1 is now the only unlocked phase.
