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
| 15 | Elite-club entry | PASS |
| 16 | Nationality, name, and starting-club synchronization | PASS |
| 17 | Real-player database | PASS |
| 18 | Random-name system | PASS |
| 19 | Transfer invitations | PASS |
| 20 | Clubs and competitions | PASS |
| 21 | Club crests | PASS |
| 22 | Trophies and awards | PASS |
| 23 | Season review | PASS |
| 24 | Injuries, cards, and suspensions | PASS |
| 25 | World news | PASS |
| 26 | Color and game feel | PASS |
| 27 | Full career from age 16 to retirement | IN_PROGRESS |
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
- [x] GitHub Actions `verify` passes for Pull Request #49 and implementation commit `3d8ddcc`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `3d8ddcc`: `https://2127f03d.zuqiu-4tt.pages.dev`.

Phase 16 gate result: `PASS` on 2026-08-08. Phase 17 is now the only unlocked phase.

## Phase 17 Gate

- [x] Real-player identity rows are stored in a local 2026 snapshot and require no runtime network request.
- [x] Public identity provenance and project-estimated ratings remain explicitly separate.
- [x] Wikidata entity URLs, club QIDs, capture date, method, and CC0 license are recorded locally.
- [x] At least 50 important clubs expose one or more real players before generated squad fillers.
- [x] The 50-club audit contains zero all-NPC squads in the snapshot season.
- [x] Kylian Mbappé and Cristiano Ronaldo retain their full display names.
- [x] Real players retire deterministically and do not remain active indefinitely in future seasons.
- [x] Real Chromium validates a production club roster at 390x844 with no runtime error, technical placeholder, or horizontal overflow.
- [x] Full automated tests (127/127), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass for version 20.18.0.
- [x] GitHub Actions `verify` passes for Pull Request #50 and implementation commit `a93c96e`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `a93c96e`: `https://3bd163d1.zuqiu-4tt.pages.dev`.

Phase 17 gate result: `PASS` on 2026-08-08. Phase 18 is now the only unlocked phase.

## Phase 18 Gate

- [x] Player creation, youth players, obscure clubs, and future squads use one deterministic `LocalizedNameGenerator`.
- [x] Every major nationality produces 1,000 unique names with the correct locale and writing system.
- [x] Japanese and Korean names use atomic local names rather than concatenated full given names.
- [x] All 500 future club rosters contain zero same-team duplicate names.
- [x] Missing profile data still produces normal names without numeric technical placeholders.
- [x] Generated identities never expose `Academy Prospect`, `Player 24`, `Youth 31`, or numbered youth-name fallbacks.
- [x] Real Chromium validates a Japanese 2045 roster at 390x844 with no duplicate, placeholder, runtime error, or horizontal overflow.
- [x] Full automated tests (129/129), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass for version 20.19.0.
- [x] GitHub Actions `verify` passes for Phase 18 Pull Request #51.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `3d9c7fe`: `https://dd568567.zuqiu-4tt.pages.dev`.

Phase 18 gate result: `PASS` on 2026-08-08. Phase 19 is now the only unlocked phase.

## Phase 19 Gate

- [x] System-initiated market activity progresses through scout attention, rumor, agent contact, club interest, and formal offer stages.
- [x] Market evaluation uses OVR, potential, age, season performance, contract, position need, club reputation, nationality fit, and current-club level.
- [x] Transfer Inbox exposes received activity, agent recommendations, active exploration, watchlist entries, and negotiation history.
- [x] Formal offers appear only in January and July windows and can be answered through the existing negotiation flow.
- [x] A 100-window simulation produces all five stages plus domestic, overseas, higher-level, and lower-level opportunities without offering the current club.
- [x] Real Chromium validates all five inbox views and a persisted formal-offer negotiation at 390x844 without runtime errors or horizontal overflow.
- [x] Full automated tests (131/131), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, seven-phone-width layout, and 12-viewport responsive regressions pass for version 20.20.0.
- [x] GitHub Actions `verify` passes for Phase 19 Pull Request #52.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `1576aec`: `https://a5c74320.zuqiu-4tt.pages.dev`.

Phase 19 gate result: `PASS` on 2026-08-08. Phase 20 is now the only unlocked phase.

## Phase 20 Gate

- [x] Three complete top-flight snapshots add 44 clubs across Asia, Europe, and South America: Thailand 16, Hungary 12, and Ecuador 16.
- [x] Every added club has an ID, Chinese and English names, country, league, level, local crest, strength, academy, and reputation at runtime.
- [x] Every added competition defines rules, exact participant IDs, an honor, and an independent local trophy asset.
- [x] World registry validation resolves all added club, league, competition, participant, and trophy references with zero errors.
- [x] Runtime scale reaches 544 clubs, 50 leagues, 40 countries, and 3 registered expansion competitions without altering the original 500-club snapshot.
- [x] Real Chromium searches and renders one club from each new league at 390x844 with no runtime error or horizontal overflow.
- [x] Full automated tests (134/134), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, and 12-viewport responsive regressions pass for version 20.21.0.
- [x] GitHub Actions `verify` passes for Phase 20 Pull Request #53 and implementation commit `3b1081b`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `3b1081b`: `https://00cd84b9.zuqiu-4tt.pages.dev`.

Phase 20 gate result: `PASS` on 2026-08-08. Phase 21 is now the only unlocked phase.

## Phase 21 Gate

- [x] Full 544-club audit reports `REAL 174`, `FALLBACK 370`, `MISSING 0`, and `BROKEN 0`.
- [x] Every crest is a unique local asset whose filename maps exactly to its club ID and whose source record is present.
- [x] All 370 project fallback crests use unique geometric marks with no letter placeholder.
- [x] All 544 assets contain zero remote image references, Google thumbnails, or watermark markers.
- [x] A deterministic random sample of 100 clubs reports zero incorrect mappings and loads 100/100 images in real Chromium.
- [x] Full automated tests (136/136), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, and 12-viewport responsive regressions pass for version 20.22.0.
- [x] GitHub Actions `verify` passes for Phase 21 Pull Request #54 and implementation commit `4e08ed9`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `4e08ed9`: `https://87c42090.zuqiu-4tt.pages.dev`.

Phase 21 gate result: `PASS` on 2026-08-08. Phase 22 is now the only unlocked phase.

## Phase 22 Gate

- [x] The unified registry contains 25 competition trophies and 19 personal awards with 44 unique local assets.
- [x] Every registry ID resolves to exactly one existing asset; broken, duplicate, unmapped, unregistered, and missing award counts are all zero.
- [x] Best goalkeeper, defender, midfielder, forward, best XI, Golden Boy, Ballon d’Or, and world-player awards are obtainable through real season settlement states.
- [x] World Cup Golden Ball, Golden Boot, and Best Young Player awards are obtainable through a World Cup season state.
- [x] The legacy `assist-king` producer mismatch is corrected to the canonical `assists-king` asset ID.
- [x] Real Chromium loads and renders all 44 trophy and award assets without runtime errors.
- [x] Full automated tests (139/139), production build, repository hygiene, Phase 5 pacing, Phase 6 lifecycle, and 12-viewport responsive regressions pass for version 20.23.0.
- [x] GitHub Actions `verify` passes for Phase 22 Pull Request #55 and implementation commit `d15916e`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `d15916e`: `https://2df9b027.zuqiu-4tt.pages.dev`.

Phase 22 gate result: `PASS` on 2026-08-08. Phase 23 is now the only unlocked phase.

## Phase 23 Gate

- [x] Each completed season creates exactly one review keyed by season and club.
- [x] Ten consecutive seasons create 10 unique reviews with no missing, duplicate, or mismatched statistics.
- [x] The review includes club crest and rank, competitions, appearances, starts, minutes, goals, assists, rating, and position statistics.
- [x] OVR and six-axis radar changes, market value, weekly salary, team role, and coach trust are frozen into the review record.
- [x] Injuries, injury absences, cards, suspensions, national-team activity, team trophies, personal awards, and major events remain separate visible sections.
- [x] Fast Mode cannot skip the review; it is non-dismissible, survives reload, and is cleared only by the explicit Continue command.
- [x] Real Chromium validates the complete review at 390x844 with a loaded crest, top-first opening position, no runtime errors, and no horizontal overflow.
- [x] Full automated tests (141/141), production build, repository hygiene (3/3), Phase 5 pacing, Phase 6 lifecycle, and 12-viewport responsive audits pass for version 20.24.0.
- [x] GitHub Actions `verify` passes for Phase 23 Pull Request #56 and implementation commit `33c24e2`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `33c24e2`: `https://9072b27e.zuqiu-4tt.pages.dev`.

Phase 23 gate result: `PASS` on 2026-08-08. Phase 24 is now the only unlocked phase.

## Phase 24 Gate

- [x] Active injuries remove the player from match selection and disable the match entry command.
- [x] Injured players receive only the recovery training path, and completing it reduces remaining recovery time.
- [x] Injury state reduces training growth and season injury absences reduce annual development.
- [x] Every injury is recorded once in active injuries, season history, injury log, and career history.
- [x] A red card creates a one-match suspension that blocks and is consumed by the next fixture.
- [x] The fifth accumulated yellow card creates a one-match suspension that blocks and is consumed by the next fixture.
- [x] Overlapping suspension and injury states consume the suspension first, then preserve the injury absence for the following match.
- [x] Season Review retains injury, absence, yellow-card, red-card, and suspension totals.
- [x] Real Chromium validates injury selection, recovery-only training with state change, and yellow-card suspension at 390x844 without runtime errors or horizontal overflow.
- [x] Full automated tests (144/144), production build, repository hygiene (3/3), Phase 5 pacing, Phase 6 lifecycle, and 12-viewport responsive audits pass for version 20.25.0.
- [x] GitHub Actions `verify` passes for Phase 24 Pull Request #57 and implementation commit `94df463`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `94df463`: `https://2d4c00dd.zuqiu-4tt.pages.dev`.

Phase 24 gate result: `PASS` on 2026-08-08. Phase 25 is now the only unlocked phase.

## Phase 25 Gate

- [x] Monthly world news covers leagues, transfers, champions, relegation, awards, national teams, coaches, injuries, rising stars, retirements, and records.
- [x] Three consecutive seasons produce 72 world stories across all 11 required topics.
- [x] News IDs, titles, and copy remain duplicate-free across the three-season gate.
- [x] World stories outnumber player stories and never use the career player or current club as their subject.
- [x] Ordinary auto-match news is limited to notable performances instead of flooding the news center.
- [x] World news never creates an interaction pause; the home page retains only three to five important headlines.
- [x] Real Chromium validates the home broadcast and complete news center at 390x844 without runtime errors or horizontal overflow.
- [x] Full automated tests (146/146), production build, repository hygiene (3/3), Phase 5 pacing, Phase 6 lifecycle, and 12-viewport responsive audits pass for version 20.26.0.
- [x] GitHub Actions `verify` passes for Phase 25 Pull Request #58 and implementation commit `db85311`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `db85311`: `https://3bae563e.zuqiu-4tt.pages.dev`.

Phase 25 gate result: `PASS` on 2026-08-08. Phase 26 is now the only unlocked phase.

## Phase 26 Gate

- [x] Nine shared semantic color pairs cover matches, growth, honors, transfers, injuries, media, fitness, pressure, and national-team context.
- [x] Career, match, training, transfer, clubs, and more use six distinct restrained page accents while preserving the light-first visual baseline.
- [x] Match, growth, transfer, honor, injury, news, fitness, pressure, and timeline components expose their intended semantic feedback.
- [x] Club profiles retain a deterministic team-specific accent independent of the clubs-page accent.
- [x] Real Chromium validates all six tabs at 390x844 and 1440x900 with distinct computed colors, zero runtime errors, and zero horizontal overflow.
- [x] Full automated tests (148/148), production build, repository hygiene (3/3), Phase 5 pacing, Phase 6 lifecycle, and 12-viewport responsive audits pass for version 20.27.0.
- [x] GitHub Actions `verify` passes for Phase 26 Pull Request #59 and implementation commit `cc7232a`.
- [x] Cloudflare Pages creates a successful native preview for implementation commit `cc7232a`: `https://5590821c.zuqiu-4tt.pages.dev`.

Phase 26 gate result: `PASS` on 2026-08-08. Phase 27 is now the only unlocked phase.
