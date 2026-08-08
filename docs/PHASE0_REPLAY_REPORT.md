# Strict Rebuild Phase 0 Acceptance

Date: 2026-08-08

Repository: `C:\Users\Administrator\Documents\GitHub\-1`

Branch: `codex/legendevo-ph0-audit`

Baseline HEAD: `1053aa3925181e450252ea7b2f48c4c24d1f2c51`

This report audits the current local worktree. It does not treat the deployed
site, remote `main`, or the historical phase labels below as the source of truth.
No product code was changed during this audit.

## Current build evidence

- `npm run check`: PASS.
- Static cleanup gate: PASS, 57 production files, no flagged surface.
- Type and project contracts: PASS, 9/9.
- Automated suite: PASS, 170/170.
- Production build: PASS, `dist/index.html`, version 20.42.0.
- Current visible browser replay: PASS at 390 x 844 with no page error.
- Current full-career browser gate: PASS at 390 x 844 with no page error or
  horizontal overflow.

## Visible three-season route

The visible-control replay covered creation, first-club signing, the club
directory, a transfer request, events, season advancement, training, season
reviews, off-season, and the next season. It ended at 2029-07-01 with age 19,
three stored reviews, completed off-season state, no pending event, and no
training lock.

| Action | Count |
| --- | ---: |
| Create and sign | 1 |
| Open club directory | 1 |
| Submit transfer request | 1 |
| Resolve event | 7 |
| Advance simulation | 10 |
| Return to career | 3 |
| Complete training | 3 |
| Complete review and off-season batch | 1 |
| Total recorded UI operations | 27 |

| Completed season | Age after review | Next date | Review count | Off-season |
| --- | ---: | --- | ---: | --- |
| 2026/27 | 17 | 2027-07-01 checkpoint | 1 | complete |
| 2027/28 | 18 | 2028-07-01 checkpoint | 2 | complete |
| 2028/29 | 19 | 2029-07-01 | 3 | complete |

The observed pause reasons were the initial career event, two scheduled event
windows per season, the training window, the season target/review, and
off-season confirmation. No stale overlay, duplicate review, expired-contract
lock, or missing-next-action state remained.

## Five-season and retirement coverage

The current local build exceeds the five-season PH0 requirement through three
independent runs:

- Browser-driven production career: 22 seasons, age 16 to 38, 597 appearances,
  196 national-team appearances, one transfer, one recorded injury, 55 honors,
  and one retirement node.
- Engine-level full-career audit: 216 phase transitions, 19 seasons, age 17 to
  35, 73 appearances, 28 goals, and 26 achievements.
- Twenty-season stress run: 20 seasons, 800 matches, 304 opponents, and 139/139
  unique events.

## Confirmed P0/P1 issues and root causes

| Priority | Reproduction | Root cause | Owning phase |
| --- | --- | --- | ---: |
| P0 | At 390 px the third career-speed option drops to a separate row and leaves a large empty grey region. | `createPlayer.js` emits `pace-mode-grid` and `pace-mode-card`, but `styles.css` defines neither class; the controls inherit unrelated generic button layout. | 3 |
| P0 | Creation step 3 needs excessive vertical scrolling before the player can inspect all style choices and continue. | The creation route combines a minimum 365-520 px pitch, seven or more generic choice cards, a style detail block, and body controls in one scroll flow. Generic `.choice-grid` and `.pitch--wide` breakpoints are not creation-specific. | 3 |
| P0 | Career content and the primary command compete with two fixed bottom surfaces. | `career.js` creates `.page-fixed-action`; `appShell.js` independently creates BottomNavigation; `styles.css` positions both through several duplicated rules at lines around 196, 201, 420, 473, 515, and 583. | 2 |
| P0 | The first generated career event can read like an internal validation message, for example `续约报价没有写明球队角色`. | The event runtime accepts data/template titles directly as player-facing conflict copy; there is no presentation-copy gate between event selection and the event surface. | 8 |
| P1 | The career home reads as a long stack of similarly weighted cards rather than a game dashboard with one clear next action. | `career.js` renders the hero, progress, objectives, insight, five compact cards, news, growth, timeline, and a separate fixed CTA as peer sections. | 2 |
| P1 | Starting-club invitations are numerous but weakly differentiated; a China creation can receive five mostly domestic cards with the same `青训录取` route. | `generateStartingClubOffers` varies club scores but the creation card projects several entry outcomes into the same route label and uses the selected-country pool too heavily. | 3/4 |
| P1 | Transfer has two overlapping tab systems and retains `Transfer Inbox` English in the primary UI. | `transfer.js` renders the seven-tab club/transfer hub and a second five-tab inbox in the same page, then stacks contract, inbox, exploration, and detail cards. | 6/7 |
| P1 | Club pages are very long and repeat status, season, squad, tactics, coach, facilities, contract, and honors information already exposed elsewhere. | `clubs.js` renders every secondary domain expanded in one route; the facility accordion defaults open and there is no compact summary/detail split. | 16 |
| P1 | Real-squad coverage is incomplete outside the sourced snapshot. | The runtime supports 500 clubs, but the offline real-player snapshot covers fifty priority clubs and fills remaining roster slots with explicitly marked deterministic generated players. | 4/17 |
| P1 | Event outcomes are dynamic in the engine but the visible event surface is text-heavy and the roll is not staged as game feedback. | `eventEngine.js` computes a real bounded chance and roll, while the current renderer resolves directly into the result surface without a dedicated roll/reveal lifecycle. | 8/9 |
| P1 | Event imagery is internally consistent but visually generic for several football situations. | Events select from a shared 56-scene local registry by tags and cooldown, so unrelated narrative templates can still share broad training, contract, or injury compositions. | 10 |
| P1 | Mini-games have broad registry counts but inconsistent perceived depth and repeated interaction grammar. | Fifty-five production games are assembled from shared renderer mechanisms; registry diversity does not guarantee distinct scenario pacing or football decisions. | 12 |
| P1 | Trophy assets are present and uniquely mapped, but visual realism and competition-specific silhouette quality are not proven by asset-existence tests. | Current tests validate registry ownership and file uniqueness, not visual similarity to each real competition trophy. | 11 |
| P1 | The color system is technically tokenized but major pages still feel visually similar. | Most surfaces share the same dark background, border, and card material; semantic accents are badges and small details rather than page hierarchy. | 2/21 |

Items explicitly checked but not reproduced as current blockers: generated-name
uniqueness, nationality/name alignment, duplicate player IDs, missing club crests,
fixed 50% event probability, missing trophy files, contract expiry deadlock, and
retirement deadlock. They remain later phase acceptance targets because the new
brief requires stronger realism and presentation than the existing automated
contracts prove.

## Result

`PHASE 0 STATUS: PASS`

The gate passes because the current local build was run, the required long
career coverage was reproduced, all confirmed P0/P1 issues were recorded, and
each issue has a source-level root cause and owning future phase. The product
issues are intentionally not fixed inside PH0.

---

# Historical Phase 0 Acceptance

Date: 2026-08-08

Branch: `codex/v20-4-timeline-visual`

Commit baseline: `bf7412b`

Scope: current local runtime `index.html -> src/app.js`.

## Repository and system audit

- Remote: `https://github.com/Ethanhui6/zuqiu1.git`.
- Build: `npm run build` PASS, output `dist`, version `20.4.0`.
- Automated suite: 108/108 PASS.
- Repository hygiene: 3/3 PASS; no tracked local environment, build, dependency, or test-result artifacts.
- Secret scan: no high-confidence token or private-key patterns.
- Career data: 500 valid records for every supported position.
- Club assets: 500 local assets, Missing 0, Broken 0.
- Trophy assets: 27 registered trophies, 27 unique images.
- Runtime systems inventoried: Career Director, event, match, transfer, development, mini-game, news, honors, injury/discipline, and save/migration systems.
- The inactive `client/`, root preview files, and duplicate server/style trees remain recovery evidence and are not production build inputs.

## Deterministic engine replay

The deterministic fast-mode replay completed three seasons from age 16 to 19.

| Season | Age | Blocking reasons | Advance actions | Training choices | Off-season actions |
| --- | --- | --- | ---: | ---: | ---: |
| 2026/27 | 16 -> 17 | training, training, target | 3 | 2 | 2 |
| 2027/28 | 17 -> 18 | training, training, target | 3 | 2 | 2 |
| 2028/29 | 18 -> 19 | training, training, target | 3 | 2 | 2 |

Totals: 9 advance actions, 6 training choices, 3 off-season activities, and 3 off-season completions.

## Browser-driven three-season replay

The current local application was opened in system Chromium at 390 x 844 with touch enabled. The test used only visible application controls for creation, signing, navigation, transfer request, career advancement, training choices, season review confirmation, and off-season completion.

| Completed season | Age after review | Next season | Next date | Review count | Off-season |
| --- | ---: | --- | --- | ---: | --- |
| 2026/27 | 17 | 2027/28 | 2027-07-01 | 1 | complete |
| 2027/28 | 18 | 2028/29 | 2028-07-01 | 2 | complete |
| 2028/29 | 19 | 2029/30 | 2029-07-01 | 3 | complete |

Operation totals: 27 recorded UI operations: 1 creation/signing, 1 club-directory visit, 1 transfer request, 9 advancement actions, 6 training completions, 6 navigation returns, and 3 season-review/off-season completions.

Observed blockers per season: training, training, season target. No pending event, stale overlay, duplicate season review, or dead-end state remained at the final 2029-07-01 checkpoint.

## Runtime and mobile playback

The six persistent routes rendered without runtime errors. Separate browser acceptance covered player creation, direct signing, training mini-game settlement, match preview, strategy, interactive mini-game, match result, overlay cleanup, save reload, and 30 event resolutions.

The layout audit passed at 320, 360, 375, 390, 393, 428, 430, 768, 1280, 1440, and 1920 px with no horizontal overflow, undersized visible buttons, or page errors. This is system Chromium touch emulation, not a claim of physical iPhone Safari hardware coverage.

## Result

Phase 0 PASS. No gameplay tuning was added. Reproducible browser evidence is written to ignored `test-results/phase0-browser-gate.json`; the reusable runner is `tests/phase0-browser-gate.mjs`.
