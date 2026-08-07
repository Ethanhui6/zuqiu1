# Phase 12 Career Events Audit

Date: 2026-08-08

## Baseline

- Runtime event engine loaded 18 events from `src/data/events.js`.
- Release metadata claimed 1,120 active events and did not describe the runtime corpus.
- The old 640-row indexed corpus had only 160 unique titles, 8 titles per category, 12 normalized hints, and no position conditions.
- The generated 6,000-row match-position file is reserved for match events and does not count toward Career Events.

## Phase 12 Corpus

- Runtime career events: 568.
- Unique titles: 568.
- Choices: 1,704, all exact choice strings unique.
- Success/failure outcomes: 3,408, all exact outcome strings unique.
- Career domains: 21 required domains with 24 distinct incidents each.
- Position events: 64 total, 8 each for GK, CB, LB/RB, CDM, CM, CAM, LW/RW, and ST.
- Every event has a location, participants, conflict, observations, three decisions, state effects, and structured age/OVR conditions.

## Runtime

`dataRepository.careerEvents` is installed on the existing `EventEngine` instance after repository initialization. This keeps `CareerDirector` and the event UI on the same 568-event runtime corpus. Resolution persists the selected choice, unique result text, outcome, and state effects.

## Evidence

- Static quality gate: `node --test tests/phase12-career-events.test.mjs`.
- Chromium gate: `node tests/phase12-career-events-gate.mjs`.
- Full regression, pacing, result lifecycle, layout, and mobile audits are recorded in `docs/PHASE_GATES.md`.
