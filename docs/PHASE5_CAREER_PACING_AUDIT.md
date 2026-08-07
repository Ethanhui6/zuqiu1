# Phase 5 Career Pacing Audit

Date: 2026-08-08

Version: 20.6.0

Branch: `codex/phase-5-career-pacing`

## Result

Phase 5 passes. Fast careers now batch blank calendar time and ordinary fixtures while retaining a small, predictable set of player decisions.

## Season Contract

| Node | Per fast season |
| --- | ---: |
| Advance actions | 5-7 |
| Interactive training | 2 |
| Career events | 2-4 |
| Forced interactive matches | 0 |
| Automatically settled fixtures | 34-40 |
| Estimated interaction time | 20-35 seconds |

Training occurs in season weeks 6 and 20. Career events occur in weeks 12 and 32. These are week windows rather than one exact weekday, so a fixture on the original trigger day cannot silently remove the node.

## Long-Career Gate

`node --test tests/phase5-career-pacing-gate.mjs`

- Five careers from age 16 to 30: PASS, 70 seasons total.
- One career from age 16 to retirement at 38: PASS, 22 seasons.
- Total deterministic seasons: 92.
- No test invokes weekly or monthly advancement; every time request targets the season end and stops only for a named decision node.
- Every season remained inside the 20-35 second interaction budget.

## Browser Evidence

The 390x844 browser replay completed three seasons from age 16 to 19. Each season stopped for training in weeks 6 and 20, career events in weeks 12 and 32, then the season review and off-season. No blank week required a player action, no pending event remained after a season, and all three reviews advanced age exactly once.

## Regression Evidence

- Full automated suite: 108/108 PASS.
- Repository hygiene: 3/3 PASS.
- Production build: PASS, version 20.6.0.
- Mobile layout audit: PASS at 12 viewports from 320x568 through 1920x1080.
- Browser runtime errors: none.

## Boundary

Phase 5 changes when career decisions appear. It does not change result acknowledgement behavior; fast-mode feedback ownership remains Phase 6.
