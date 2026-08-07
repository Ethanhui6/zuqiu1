# Regression Checklist

Run this checklist at every phase gate. Add a dated evidence reference when a gate is evaluated.

## Repository And Build

- [x] Existing user files and unrelated worktree changes are preserved.
- [x] No secrets, tokens, local `.env` files, generated `dist/`, or temporary artifacts are tracked.
- [x] The full automated test suite passes.
- [x] The production build passes and reports the intended version.

## Career And Save

- [x] Player creation produces a valid identity, nationality, position, and starting-club choice.
- [x] Save creation, reload, migration, and season advancement preserve state.
- [x] A season settles exactly once and the next season restores a playable state.
- [x] Fast mode pauses for important results and never silently skips required decisions.

## Match And Development

- [x] Scheduled, automatic, and interactive matches update one coherent season record.
- [x] Match preview, interaction, result, and continuation are operable.
- [x] Training and match growth use position-appropriate attributes.
- [x] Development changes do not corrupt age, potential, OVR, or career history.

## Club, Transfer, And World

- [x] Current club identity remains consistent across career, match, transfer, and timeline views.
- [x] The current club cannot be offered as a transfer destination.
- [x] Transfer acceptance changes the club once and preserves career history.
- [x] World news, honors, injuries, cards, and suspensions persist without duplicate records.

## UI And Mobile

- [x] Primary controls are clickable and not duplicated.
- [x] Header, bottom navigation, sticky actions, sheets, modals, and toasts do not overlap.
- [x] No horizontal overflow occurs at 320, 375, 390, 393, 414, 428, or 430 px.
- [x] Keyboard, pointer, and touch-sized controls can complete the core flow.

Phase 0 evidence date: 2026-08-08. Re-evaluate every item before a later phase is marked PASS.
