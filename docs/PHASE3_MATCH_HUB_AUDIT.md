# Phase 3 Match Hub Audit

Date: 2026-08-08

Phase 3 replaces the long inline match preview with one compact Match Hub and a dedicated Formation Sheet. The production page keeps exactly one primary match command: `进入比赛`.

## Match Hub

The first surface now presents:

- competition, date, round, and home/away venue;
- both local club crests and club names;
- pre-match `VS` state;
- league rank, simulated strength, recent five-match form, and formation for both teams;
- the player's `预计首发`, `替补待命`, or `未入选` status;
- player position, fitness, and morale;
- one `查看预计阵容` tool action;
- one fixed `进入比赛` CTA.

The fixed action remains clickable when the player is not selected. In that state it explains the selection reason instead of presenting a disabled dead end.

## Formation Sheet

The old inline 22-row list has been removed from page flow. `查看预计阵容` opens one scrollable Sheet with:

- a two-segment home/away switch;
- the selected club crest, name, and formation;
- eleven named player nodes on a real pitch layout;
- six supported formations: `4-3-3`, `4-2-3-1`, `4-4-2`, `3-5-2`, `3-4-2-1`, and `4-3-1-2`;
- the career player highlighted on the pitch when starting;
- an explicit highlighted bench/status row when not starting.

World-roster data is used before old save-embedded squad data, so technical labels such as `Academy prospect` do not leak into the production formation UI. Clubs without supplied formation data receive a stable estimated formation and record that field as unverified simulation data.

## Ten-match browser gate

`tests/phase3-match-hub-gate.mjs` creates a real career and drives ten production Match Hubs in system Chromium.

| # | Viewport | Current club | Opponent | Venue | Status | Formations |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | 320 x 568 | 上海海港 | 长春亚泰 | Home | 预计首发 | 4-3-3 / 3-4-2-1 |
| 2 | 375 x 812 | 上海申花 | 大连英博 | Away | 替补待命 | 4-2-3-1 / 4-3-1-2 |
| 3 | 390 x 844 | 北京国安 | 辽宁铁人 | Home | 未入选 | 4-4-2 / 4-3-3 |
| 4 | 393 x 852 | 山东泰山 | 重庆铜梁龙 | Away | 预计首发 | 3-5-2 / 4-2-3-1 |
| 5 | 414 x 896 | 成都蓉城 | 广州豹 | Home | 替补待命 | 3-4-2-1 / 4-4-2 |
| 6 | 428 x 926 | 浙江职业 | 苏州东吴 | Away | 未入选 | 4-3-1-2 / 3-5-2 |
| 7 | 430 x 932 | 天津津门虎 | 南京城市 | Home | 预计首发 | 4-3-3 / 3-4-2-1 |
| 8 | 768 x 1024 | 武汉三镇 | 石家庄功夫 | Away | 替补待命 | 4-2-3-1 / 4-3-1-2 |
| 9 | 1280 x 720 | 河南 | 广西平果 | Home | 未入选 | 4-4-2 / 4-3-3 |
| 10 | 390 x 650 | 青岛海牛 | 延边龙鼎 | Away | 预计首发 | 3-5-2 / 4-2-3-1 |

Every match passed:

- no horizontal overflow;
- two local crest images;
- rank, strength, form, formation, position, fitness, and morale present;
- exactly one enabled, visible, uncovered `进入比赛` CTA;
- no inline formation nodes before opening the Sheet;
- two working formation tabs;
- eleven nodes on each side;
- career-player highlight on the current side;
- no technical placeholder names;
- Sheet close cleanup.

Screenshots were visually checked at 320 x 568 and 768 x 1024 for both Match Hub and Formation Sheet. Detailed ignored output is `test-results/phase3-match-hub-gate.json`.

## Regression results

| Check | Result |
| --- | --- |
| `npm test` | PASS, 108/108 |
| `npm run build` | PASS, version 20.4.0 |
| `npm run test:repo` | PASS, 3/3 |
| `node tests/mobile-layout-audit.mjs` | PASS, 12 viewports |
| `node tests/phase2-layout-gate.mjs` | PASS, 7 viewports |
| `node tests/phase3-match-hub-gate.mjs` | PASS, 10 matches |
| `git diff --check` | PASS |

## Gate result

Phase 3 PASS. Phase 4 is unlocked as the only active phase.
