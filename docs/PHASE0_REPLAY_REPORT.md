# Phase 0 Acceptance

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
