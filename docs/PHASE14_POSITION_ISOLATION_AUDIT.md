# Phase 14 Position Isolation Audit

Date: 2026-08-08

## Data Rules

- `PositionResolver` canonicalizes aliases and compares both the player position and each allowed position through the same resolver.
- `PlayStyleEligibility` is the only source used by player creation, rerolls, draft validation, and save migration.
- `TraitEligibility` filters player-creation traits and runtime career-trait unlocks before they reach the interface or save state.
- Invalid saved selections fall back to the first legal option for the player's position.

## Position Coverage

- Browser coverage: GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, LM, and RM.
- GK receives only the goalkeeper play style and can receive the goalkeeper-only command trait.
- ST cannot receive or display the sweeper-keeper style or goalkeeper command trait.
- Every selectable position has at least one legal play style and one legal secondary trait.

## Radar Contract

- Goalkeeper axes: 扑救、手控、开球、反应、站位、指挥.
- Outfield axes: 速度、射门、传球、盘带、防守、身体.
- Goalkeeper and outfield labels are selected from the resolved position, not hidden after rendering.

## Evidence

- Static gate: `node --test tests/phase14-position-isolation.test.mjs`.
- Browser gate: `node tests/phase14-position-isolation-gate.mjs`.
- Browser viewport: 390x844 with all 12 selectable positions, zero runtime errors, and zero horizontal overflow.
- Screenshot: `test-results/phase14-gk-isolation-390.png`.
- Full automated suite: 120/120.
- Repository hygiene: 3/3.
- Production build: version 20.15.0.
- Phase 5 pacing, Phase 6 result lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass.
