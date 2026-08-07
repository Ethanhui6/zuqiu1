# Phase 7 Development Curve Audit

Date: 2026-08-08

Version: 20.8.0

Branch: `codex/phase-7-development-curve`

## Result

The fixed annual settlement gain has been replaced by one deterministic development model in the existing production engine. It produces growth, a position-appropriate peak, and decline while preserving repeatable saves and simulations.

## Inputs

Annual development uses age, base potential, dynamic potential, minutes, rating, training count, league level, facilities, coach trust, morale, injury absences, position, and PlayStyle. Strong sustained performance can raise dynamic potential; poor availability or performance can lower it within a bounded range.

## Trajectories

The engine supports Balanced, Wonderkid, Late Bloomer, Early Peak, Plateau, Injury Setback, and Career Revival. New and migrated players receive a deterministic trajectory when one is not already stored.

## Five-Hundred-Player Gate

`node tests/phase7-development-curve-gate.mjs`

| Cohort | Players | Median start | Median peak | Median peak age | Median age-36 OVR |
| --- | ---: | ---: | ---: | ---: | ---: |
| High potential | 100 | 58 | 88 | 28 | 82 |
| Medium potential | 100 | 58 | 77 | 27 | 71 |
| Low potential | 100 | 58 | 66 | 22 | 60 |
| Late Bloomer | 100 | 58 | 80 | 29 | 76 |
| Goalkeeper | 100 | 58 | 80 | 29 | 77 |

All 500 careers grew above their starting OVR, reached a finite peak, and declined before age 36. Each cohort produced at least 60 distinct full-career paths. Goalkeepers and Late Bloomers peaked later than medium-potential outfield players.

## Integration Evidence

- Five-season prospect differentiation: PASS.
- Three-season replay and season-review flow: PASS.
- Phase 5 fast-career pacing through retirement: PASS.
- Full age-16-to-retirement regression: PASS.
- Full automated suite: 108/108 PASS.
- Repository hygiene: 3/3 PASS.
- Production build: PASS, version 20.8.0.
- Browser-driven three-season career replay: PASS at 390x844.
- Full mobile audit: PASS at 12 viewports from 320x568 to 1920x1080.
- GitHub and Cloudflare evidence are recorded when the phase closes.
