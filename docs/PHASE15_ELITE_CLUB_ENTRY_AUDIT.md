# Phase 15 Elite Club Entry Audit

Date: 2026-08-08

## Entry Routes

- `DIRECT_CONTRACT`: direct first-team professional contract.
- `ACADEMY`: academy admission and U18 development.
- `TRIAL`: preseason trial invitation.
- `SCOUT_WATCH`: four-week scouting watch.
- `RESERVE_TEAM`: reserve-team contract and development.
- `LOAN_DEVELOPMENT`: contract followed by a development loan.
- `REJECTED`: no viable route at the current age, ability, and potential combination.

## Resolution Rules

- One data-layer resolver uses age, OVR, potential, club reputation, position need, nationality fit, and recent rating.
- A low OVR does not erase a high-potential teenager's academy, trial, scouting, or loan-development path.
- Creation offers, club contact checks, card labels, contracts, squad paths, and career history consume the same entry route.
- Only `REJECTED` cards are disabled; rejected cards explain the route outcome instead of displaying only “未达门槛”.

## Evidence

- Static gate: `node --test tests/phase15-elite-club-entry.test.mjs`.
- Matrix: 4 ages x 4 OVR values x 4 potential values, covering all seven entry routes.
- Browser gate: `node tests/phase15-elite-club-entry-gate.mjs`.
- Browser viewport: 390x844; a low-OVR, 90+ potential player receives five academy routes, with no runtime error or horizontal overflow.
- Screenshot: `test-results/phase15-elite-entry-390.png`.
- Full automated suite: 122/122.
- Repository hygiene: 3/3.
- Production build: version 20.16.0.
- Phase 5 pacing, Phase 6 result lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass.
- Implementation commit: `e825197`.
- Pull Request: https://github.com/Ethanhui6/zuqiu1/pull/48.
- GitHub Actions `verify`: PASS for implementation commit `e825197`.
- Native Cloudflare Pages preview: `https://ca81f191.zuqiu-4tt.pages.dev`, version 20.16.0, channel `strict-phase-15`, source commit `e825197`.
