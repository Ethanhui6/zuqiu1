# Phase 19 Transfer Inbox Audit

Date: 2026-08-08

## System

- `CareerDirector` evaluates the market once per game month and writes activity into the existing transfer state.
- Interest scoring uses OVR, potential, age, season rating and output, contract length, position need, club reputation, nationality fit, and the current-club level.
- Club activity progresses through scout attention, rumor, agent contact, club interest, and formal offer stages.
- Formal offers are limited to January and July windows.
- Candidate selection covers domestic, overseas, higher-level, peer, and lower-level routes while capping a month at three inbox items.
- The Transfer Inbox exposes received activity, agent recommendations, active exploration, watchlist entries, and negotiation history.

## Evidence

- Static gate: `node --test tests/phase19-transfer-inbox.test.mjs`.
- Simulation: 100 transfer windows with all five stages, domestic and overseas activity, higher and lower levels, formal offers, and no current-club offer.
- Browser gate: `node tests/phase19-transfer-inbox-gate.mjs`.
- Browser viewport: 390x844; all five views open, formal offer negotiation persists, runtime errors are zero, and horizontal overflow is absent.
- Screenshot: `test-results/phase19-transfer-inbox-390.png`.
- Full automated suite: 131/131.
- Repository hygiene: 3/3.
- Production build: version 20.20.0.
- Phase 5 pacing, Phase 6 30-node lifecycle, seven-phone-width layout, and 12-viewport responsive regressions pass.
