# Remaining Issues

Only verified, unresolved issues belong here.

## Verified Structural Debt

- `client/` contains an inactive alternate application tree with byte-identical copies of production modules. It is not copied by `scripts/build.mjs`, but increases maintenance risk.
- Root preview files and legacy `js/` code are not referenced by the production `index.html`; retain them until final cleanup confirms no recovery dependency.
- `server/index.js` and `server/worker.js` are byte-identical, and the production stylesheet contains repeated theme/surface cascade blocks. These are complexity findings, not Phase 0 runtime failures.

## Current Runtime Defects

No unresolved P0 or P1 runtime defect was confirmed by the Phase 0 gate.

## Legacy Reference Findings

- The recovered old site's UI rendering consumes its seeded simulation RNG. Initial states match for the same seed, but later rendered replays can diverge. This is reference evidence only and must not be copied into the current engine.

## Resolved During Phase 0

- The Phase 0 browser gate initially assumed advancement remained on the Career route; it now follows the application's real automatic Training navigation.
- The gate no longer races the training result's existing automatic-close animation.
