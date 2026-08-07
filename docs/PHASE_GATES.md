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
| 7 | Development curve | PASS |
| 8 | Development feedback animation | PASS |
| 9 | Career timeline | PASS |
| 10 | Club interactions | PASS |
| 11 | Toast system | PASS |
| 12 | Career events | PASS |
| 13 | Mini-games | PASS |
| 14 | Position, play style, and trait isolation | PASS |
| 15 | Elite-club entry | IN_PROGRESS |
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

## Phase 7 Gate

- [x] Annual development no longer uses a fixed `+1` or `+5` settlement rule.
- [x] Growth considers age, base and dynamic potential, minutes, rating, training, league level, facilities, coach trust, morale, injuries, position, and PlayStyle.
- [x] Outfield players move through fast growth, clear growth, maturity, peak, stability, and two decline stages.
- [x] Goalkeepers mature, peak, and decline later than equivalent outfield players.
- [x] Wonderkid, Late Bloomer, Early Peak, Plateau, Injury Setback, and Career Revival trajectories are implemented and tested.
- [x] Five cohorts of 100 players each complete deterministic simulations from age 16 to 36.
- [x] Every cohort grows, reaches a measurable peak, and declines before age 36 without invalid OVR values.
- [x] Phase 5 pacing, season review, five-season differentiation, and full retirement regressions pass.
- [x] Full automated suite (108/108), repository hygiene (3/3), production build, three-season browser replay, and 12-viewport mobile regressions pass for version 20.8.0.
- [x] GitHub Actions `verify` passes for Pull Request #40.
- [x] Cloudflare Pages creates a successful preview for commit `90a746b`.

Phase 7 gate result: `PASS` on 2026-08-08. Phase 8 is now the only unlocked phase.

## Phase 8 Gate

- [x] Training, interactive-match, and season-review results use one shared growth-feedback component.
- [x] Every result displays previous OVR, current OVR, signed OVR change, and all six previous/current attribute values.
- [x] Changed axes are highlighted and the SVG radar morphs from the exact stored before snapshot to the exact after snapshot.
- [x] Reduced-motion users receive the complete final state without the radar animation.
- [x] Season settlement records annual development before freezing `endOvr` and `endStats`, keeping the review, player save, and next-season start snapshot consistent.
- [x] The deterministic gate validates animated, internally consistent feedback for 20 trainings, 20 matches, and 5 season reviews.
- [x] Chromium verifies live radar movement and no horizontal overflow at 390x844; the full 12-viewport and seven-phone-width layout gates pass.
- [x] Full automated suite passes: 109/109; Phase 5 pacing, Phase 7 curves, three-season browser replay, 30-node feedback, and full-career regressions pass.
- [x] Production build passes as version 20.9.0.
- [x] GitHub Actions `verify` passes for Pull Request #41.
- [x] Cloudflare Pages creates a successful preview for commit `1e72ce9`.

Phase 8 gate result: `PASS` on 2026-08-08. Phase 9 is now the only unlocked phase.

## Phase 9 Gate

- [x] The repeated season-card list is replaced by one chronological career timeline.
- [x] Timeline data is projected from existing season honors, career history, and retirement records without a duplicate store.
- [x] Every season shows its crest, club, age, position, starting and ending OVR, appearances, goals, assists, rating, and honors.
- [x] Debut, first goal, transfer, national team, injury, comeback, trophy, Golden Boy, Ballon d'Or, captain, retirement, and other major milestones are represented.
- [x] Timeline IDs remain stable and duplicate-free across a deterministic ten-season career.
- [x] The career home page and Honors Room use the same timeline renderer.
- [x] Real Chromium passes at 320x844, 390x844, and 430x844 with ten loaded crests, 28 unique nodes, no broken images, and no horizontal overflow.
- [x] Full automated suite passes: 110/110; production build passes as version 20.10.0.
- [x] Phase 5 pacing and retirement, Phase 8 feedback, three-season replay, 30-result-node, full 12-viewport, and seven-phone-width regressions pass.
- [x] GitHub Actions `verify` passes for Pull Request #42.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `9a9d324`.

Phase 9 gate result: `PASS` on 2026-08-08. Phase 10 is now the only unlocked phase.

## Phase 10 Gate

- [x] All ten current-club buttons open a concrete secondary interaction instead of resolving through a toast alone.
- [x] Every interaction presents a specific situation and three decisions, within the required two-to-four choice range.
- [x] Every choice opens a persistent result surface with visible changes and animation feedback.
- [x] One resolver records cooldowns and history while updating career data, relationships, training strategy, career intent, or transfer requests.
- [x] All 30 choices produce a result and persisted gameplay changes in the deterministic unit gate.
- [x] Real Chromium completes all ten actions at 320x844, 390x844, and 430x844, covering every choice across 30 browser interactions.
- [x] Browser results remain visible until acknowledgement; runtime errors and horizontal overflow remain zero.
- [x] Full automated suite passes: 111/111; repository hygiene passes: 3/3; production build passes as version 20.11.0.
- [x] Phase 6 feedback, external transfer, full 12-viewport, and seven-phone-width regressions pass.
- [x] GitHub Actions `verify` passes for Pull Request #43.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `321b1c6`.

Phase 10 gate result: `PASS` on 2026-08-08. Phase 11 is now the only unlocked phase.

## Phase 11 Gate

- [x] Toast feedback is serialized through one queue with only one visible toast at a time.
- [x] Repeated feedback of the same type is deduplicated for 2,000 milliseconds even when detail text changes.
- [x] The pending queue is capped at three messages without changing existing feedback call sites.
- [x] Twenty rapid failure emissions produce one visible toast in the deterministic gate.
- [x] Twenty real rapid save-button clicks produce one visible toast at 320x844, 390x844, and 430x844.
- [x] Toasts do not intercept pointer input, overflow horizontally, or produce browser errors.
- [x] Full automated suite passes: 112/112; production build passes as version 20.12.0.
- [x] Full 12-viewport and seven-phone-width layout regressions pass.
- [x] GitHub Actions `verify` passes for Pull Request #44.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `df0ae7a`.

Phase 11 gate result: `PASS` on 2026-08-08. Phase 12 is now the only unlocked phase.

## Phase 12 Gate

- [x] The production runtime loads at least 500 career events rather than relying on release metadata.
- [x] All 21 required career domains contain at least 20 distinct incidents.
- [x] Event IDs, titles, choice text, and success/failure result text pass duplicate and similarity checks.
- [x] Every event has structured trigger conditions, context, three decisions, outcomes, and state effects.
- [x] GK, CB, LB/RB, CDM, CM, CAM, LW/RW, and ST each have eight dedicated events and reject incompatible positions.
- [x] Real Chromium resolves and persists one event for every required position group with no duplicate resolution, browser error, or horizontal overflow.
- [x] Full automated tests (115/115), production build, career pacing, 30-node result lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass for version 20.13.0.
- [x] GitHub Actions `verify` passes for Pull Request #45 and implementation commit `29d17d1`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `29d17d1`: `https://0ecbe1f8.zuqiu-4tt.pages.dev`.

Phase 12 gate result: `PASS` on 2026-08-08. Phase 13 is now the only unlocked phase.

## Phase 13 Gate

- [x] The shared mini-game registry contains 50 renderer-backed mechanisms.
- [x] Production exposes 55 playable training and match games rather than names-only registry rows.
- [x] Tap, hold, swipe, drag, draw path, aim, curve, power, reaction, sequence, memory, prediction, target, and multi-stage inputs are represented.
- [x] New challenges visibly include the pitch, football, goal, player, goalkeeper, defender, route, and target.
- [x] Normal training opportunities deterministically rotate the expanded game variants.
- [x] Real Chromium renders and operates 100 random rounds across 36 games with 100 results, no lifecycle error, browser error, or horizontal overflow.
- [x] Full automated tests (117/117), production build, Phase 5 pacing, Phase 6 lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass for version 20.14.0.
- [x] GitHub Actions `verify` passes for Pull Request #46 and implementation commit `bf72bf2`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `bf72bf2`: `https://19f735ec.zuqiu-4tt.pages.dev`.

Phase 13 gate result: `PASS` on 2026-08-08. Phase 14 is now the only unlocked phase.

## Phase 14 Gate

- [x] Position aliases and allowed-position entries are normalized through one `PositionResolver`.
- [x] `PlayStyleEligibility` controls creation UI, rerolls, draft validation, and save migration at the data layer.
- [x] `TraitEligibility` controls creation traits and runtime career-trait unlocks at the data layer.
- [x] GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, LM, and RM each expose at least one legal play style and trait.
- [x] ST never receives the sweeper-keeper style or goalkeeper-only command trait; GK never receives outfield pressing or set-piece traits.
- [x] Illegal draft and saved selections are normalized before they reach gameplay.
- [x] Goalkeeper radar axes are 扑救、手控、开球、反应、站位、指挥; outfield positions retain 速度、射门、传球、盘带、防守、身体.
- [x] Real Chromium validates all 12 selectable positions at 390x844 with no illegal option, runtime error, or horizontal overflow.
- [x] Full automated tests (120/120), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass for version 20.15.0.
- [x] GitHub Actions `verify` passes for Pull Request #47 and implementation commit `e7149dc`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `e7149dc`: `https://9929bf06.zuqiu-4tt.pages.dev`.

Phase 14 gate result: `PASS` on 2026-08-08. Phase 15 is now the only unlocked phase.

## Phase 15 Gate

- [x] Elite-club evaluation returns `DIRECT_CONTRACT`, `ACADEMY`, `TRIAL`, `SCOUT_WATCH`, `RESERVE_TEAM`, `LOAN_DEVELOPMENT`, or `REJECTED`.
- [x] Entry resolution uses age, OVR, potential, club reputation, position need, nationality fit, and recent rating.
- [x] Low-OVR high-potential teenagers retain academy, trial, scout-watch, or loan-development routes.
- [x] A deterministic 4 x 4 x 4 age/OVR/potential matrix reaches all seven entry routes rather than collapsing to rejection.
- [x] Creation cards, club contact checks, squad paths, contract copy, and career history share the same entry result.
- [x] Only `REJECTED` is disabled, and production UI no longer reduces insufficient ability to “未达门槛”.
- [x] Real Chromium validates a 90+ potential low-OVR creation path at 390x844 with five actionable academy offers, no runtime error, and no horizontal overflow.
- [x] Full automated tests (122/122), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass for version 20.16.0.
- [x] GitHub Actions `verify` passes for Pull Request #48 and implementation commit `e825197`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `e825197`: `https://ca81f191.zuqiu-4tt.pages.dev`.

Phase 15 gate result: `PASS` on 2026-08-08. Phase 16 is now the only unlocked phase.

## Phase 16 Gate

- [x] `PlayerOriginProfile` keeps nationality, name locale, starting country, starting league pool, starting club pool, region, and language atomic.
- [x] Every selectable nationality resolves at least three valid starting clubs and one valid league.
- [x] Countries without a local league snapshot use an explicit regional youth pathway rather than an unrelated silent fallback.
- [x] Changing nationality refreshes generated identity and starting pools together.
- [x] Locking nationality preserves its origin while names, attributes, potential, and position can reroll.
- [x] One hundred consecutive unlocked rerolls produce zero origin or starting-pool mismatches.
- [x] One hundred nationality-locked rerolls produce zero nationality or pool changes.
- [x] Real Chromium validates Japan-to-England identity and offer synchronization at 390x844 with no runtime error or horizontal overflow.
- [x] Full automated tests (125/125), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass for version 20.17.0.
- [ ] GitHub Actions `verify` passes for the Phase 16 Pull Request.
- [ ] Cloudflare Pages creates a successful native preview for the Phase 16 commit.

Phase 16 gate result: `IN_PROGRESS`. Phase 17 remains locked.
