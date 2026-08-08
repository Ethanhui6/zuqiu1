# PH0 · legendevo.com Migration Inventory

Date: 2026-08-08 (Asia/Hong_Kong)
Branch: `codex/legendevo-ph0-audit`
Scope: one-time audit only. No gameplay code was changed in PH0.

## Evidence

- Old site: https://legendevo.com/
- Current local site: http://127.0.0.1:4174/?no-sw=1
- Local server: `node scripts/serve.mjs --port 4174`
- Desktop pass: nominal `1440x900`.
- Mobile pass: nominal `390x844`.
- The old site was inspected at the landing page, creation page, academy-offer page, season-preparation page, and one key decision result.
- The current site was inspected at the More page and Career page with an existing local save. The existing save was preserved; no reset or local-storage inspection was used in the in-app browser.
- The existing local `tests/phase0-browser-gate.mjs` covers creation, club directory, transfer request, training, event resolution, three season reviews, off-season, and next-season recovery.

## Old Site Baseline

The public old site advertises `399` real clubs and a `15–42` career. Its public bundle (`index-6QWSUVVi.js`) contains the following explicit pace configuration:

| Mode | Duration | Seasons per advance | Behavior observed |
| --- | --- | ---: | --- |
| 沉浸 | 约 15–25 分钟 | 1 | Full yearly causality, relationships, injuries and legend chase |
| 标准 | 约 8–12 分钟 | 2 | Balanced growth, transfers, national team and event chains |
| 极速 | 约 4–6 分钟 | 3 | Keeps the full career and pauses only at major turns/contracts |

Observed old-site flow:

1. Landing page selects pace and exposes `创建新生涯` or `继续上次生涯`.
2. Creation is a single dense page titled `身份、位置与比赛风格`, starting at age 15. It includes name, shirt number, foot, height, body type, nationality search, twelve positions, and a position-linked style/fit panel.
3. Confirming identity opens a player status panel with OVR, peak OVR, nationality, number, position, body profile, pace mode, fitness, trust, age, value, assets, salary, and save status.
4. The next screen presents exactly three academy invitations. Each card includes a real crest, league, promised role, expected appearances, development, league strength, tactical fit, position competition, failure risk, and salary. The observed run offered Deportivo Garcilaso, AC Milan, and Racing Club de Montevideo.
5. Signing Garcilaso opened a season-preparation state. Standard mode showed `2026` and age `15`, a two-season advance button, contract, role, trust, fitness, morale, development and absence values.
6. One standard advance moved the player to age 17 and opened a key style-load decision. The decision displayed ideal/unfavorable probabilities and concrete gains/losses, then returned to the season-preparation state with the result applied.
7. The old timeline retained independent season rows with age, club, league, OVR, appearances, goals, assists, role, starts, minutes, national-team stats, salary, assets and explanatory causes. The trophy cabinet is empty until earned.

Old-site gaps to validate during later phases: the observed creation page is not a five-step wizard, no ten-reroll control was visible in the inspected run, the visible ST style set contained two styles, and the old public UI did not expose a machine-readable roster/competition count beyond the advertised 399 clubs.

## Current Project Inventory

Counts are read from the tracked local data snapshot and the active `src/` runtime registry:

| Dataset | Count | Evidence |
| --- | ---: | --- |
| Base clubs | 500 | `data/clubs.json` |
| Expansion clubs | 44 | `data/world-expansion.json` |
| Runtime clubs | 544 | base + expansion registry |
| Runtime leagues | 50 | base + expansion registry |
| Registered expansion competitions | 3 | `data/world-expansion.json` |
| Player snapshot rows | 601 | `data/players.json` |
| Clubs with snapshot roster rows | 73 | unique `clubId` values |
| Achievements | 330 | `data/achievements.json` |
| Trophy/award assets | 44 | 41 base + 3 expansion trophies |
| Career events | 568 | `data/events/career-events.json` |
| Position events | 6,000 | `data/events/position-events.json` |
| Story chains | 20 | `data/events/story-chains.json` |
| Event index categories | 20 | `data/events/index.json` |

The current `data/version.json` reports version `20.31.0`, schema `34`, 544 clubs, 601 real players, 73 real-roster clubs, 330 achievements, and 568 active events.

Creation/runtime findings:

- Active `src/pages/createPlayer.js` has five creation labels: identity, position, style, player data, and academy team. Pace is selected inside the final setup rather than as the first step.
- The active position set is LW, ST, RW, CAM, LM, CM, RM, CDM, LB, CB, RB, GK.
- Current style coverage is uneven: ST 2, LW/RW 3 each, CAM/CDM 2 each, LM/CM/RM 3 each, LB/CB/RB/GK 1 each. The style registry contains 10 definitions.
- Current source/test coverage includes deterministic rerolling and a normalized ten-use ceiling, position/body integer stats, nationality-origin synchronization, and at least three eligible starting offers.
- The current running career starts at age 16 and shows a weekly `2026/27` career track with date, week, appearances, goals, assists, rating, fitness, morale, coach trust, next key node, training, events and next-match preparation.
- Current pace settings expose four internal modes (`immersive`, `standard`, `fast`, `legend`) plus independent speed multipliers. This differs from the old public three-mode contract and is a later-phase migration item.
- Current local browser evidence from the existing save reached the career home and the More/settings, clubs, transfer, training, event and archive entry points without a runtime error. Full three-season creation/review/off-season evidence remains covered by the existing local browser gate and is not treated as an old-site migration result.

## Local Legacy Recovery

The repository contains a tracked `legacy/` tree with old UI, engines, components, screenshots and data. It is useful for migration comparison, but it is not a direct copy of the currently published `legendevo.com` bundle:

- `legacy/js/data/teams.js`: 17 object records in the checked-in early dataset.
- `legacy/js/data/players.js`: 3 object records.
- `legacy/js/data/events.js`: 2 top-level event records.
- `legacy/js/data/achievements.js`: 5 records.
- The local legacy tree also contains older 500-club/world, season-log, transfer-window, trophy-room and mobile UI implementations.

Decision: treat the live old-site public bundle as the behavioral reference for pace, landing and opening-career structure; treat the local `legacy/` tree as a secondary source for reusable interaction patterns, copy and assets. Migrate only through normalized current data/contracts so old saves remain loadable.

## Phase Map

| Later phase | PH0 evidence/migration target |
| --- | --- |
| PH1 | Reconcile mobile interaction and scroll behavior against both observed surfaces. |
| PH2 | Rebuild creation into the requested five-step flow while retaining old identity/position/style information architecture. |
| PH3 | Expand style coverage, bounded rerolls, player-data feedback and three differentiated offers. |
| PH4 | Preserve the 544-club/601-player snapshot and extend competitions/rosters without runtime network dependence. |
| PH5 | Map current four internal pace modes to the old three-mode player contract and verify season cadence. |
| PH6–PH12 | Carry old timeline, event consequences, training, transfer, trophy, review and off-season evidence into current systems. |
| PH13 | Full cross-position, three-mode, five-season and retirement/build validation. |

## PH0 PASS Criteria

- Both old and current sites ran locally/online and were inspected at desktop and mobile sizes.
- Old pace, creation, invitation, season, decision, timeline and trophy surfaces were located.
- Current club, player, league, competition, event, trophy and achievement counts were recorded from local data.
- Recoverable local legacy content and the canonical source for later migration were identified.
- No user save was reset, no external site was modified, and no gameplay implementation was changed in PH0.
