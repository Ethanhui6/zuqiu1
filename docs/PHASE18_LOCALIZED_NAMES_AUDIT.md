# Phase 18 Localized Name Generator Audit

Date: 2026-08-08

## Generator

- `LocalizedNameGenerator` is the single deterministic path for player creation, youth players, obscure clubs, and future-season squad fillers.
- Western profiles use existing given-name and hyphenated-family combinations to provide at least 1,000 unique outputs without numeric suffixes.
- Chinese generation keeps the existing expanded character pool and family-first order.
- Japanese and Korean resources now contain more than 1,000 valid atomic family/given combinations and no longer concatenate two complete given names.
- The generator has a built-in localized fallback pool when a caller does not load data files.
- `Academy Prospect`, `Player 24`, `Youth 31`, and numbered youth-name fallbacks are absent from generated identities.

## Evidence

- Static gate: `node --test tests/phase18-localized-names.test.mjs`.
- Coverage: 22 major nationalities x 1,000 unique names, plus all 500 clubs at season year 2045.
- Required result: zero same-club duplicates, invalid names, locale mismatches, script mismatches, or technical placeholders.
- Browser gate: `node tests/phase18-localized-names-gate.mjs`.
- Browser viewport: 390x844; a Japanese club's 2045 roster contains 18 unique localized names, no surviving real snapshot player, no placeholder, runtime error, or horizontal overflow.
- Screenshot: `test-results/phase18-localized-names-390.png`.
- Full automated suite: 129/129.
- Repository hygiene: 3/3.
- Production build: version 20.19.0.
- Phase 5 pacing, Phase 6 result lifecycle, seven-phone-width layout, and 12-viewport mobile regressions pass.
