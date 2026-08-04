# V20 UI Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mixed V18/V19/V20 presentation layer with one accessible, mobile-first V20 interface while preserving simulation behavior and save compatibility.

**Architecture:** Keep existing page render functions, business systems, routes, and save schema. Consolidate repeated visual structures into the existing `appShell.js`, `playerCard.js`, and `eventCard.js`, plus one small `developmentDelta.js`; pages consume these components and emit only `v20-*` classes. CSS remains plain CSS through the existing `styles.css` entry, with the obsolete V18/V19 layers deleted.

**Tech Stack:** Browser DOM APIs, ES modules, plain CSS, Node test runner, Playwright already present in the repository.

---

## File Boundaries

- `src/components/appShell.js`: the only header, viewport, bottom navigation, overlay, toast, safe-area shell DOM.
- `src/components/playerCard.js`: the only player identity/card implementation; `compact` and `detail` variants.
- `src/components/eventCard.js`: the only career event/choice card implementation.
- `src/components/developmentDelta.js`: minimal shared rendering for training, match, and career growth changes.
- `src/pages/careerPage.js`: four-section home composition only; no duplicate player/event card markup.
- `src/pages/{trainingPage,matchPage,profilePage,onboardingPage,rankingsPage}.js`: migrate active DOM to shared V20 components/classes without changing behavior.
- `src/pages/{transferPage,worldPage,morePage,saveSelectPage}.js`: remove remaining active legacy class names and keep existing workflows.
- `src/styles/{theme,base,components,pages,mobile-foundation,v20-product,animations}.css`: complete V20 ownership for material, layout, responsive behavior, sheets, overflow, touch targets, and safe areas.
- Delete `src/styles/{v19-guidance,mobile-v18.5,pace-v18.3,ux-v18.2}.css`, `src/components/guidanceBanner.js`, and `src/systems/guidance/guidanceSystem.js` after references are removed.
- `tests/v20-ui-architecture.test.mjs`: source and executable DOM contract for the new architecture.
- Update existing product/mobile contract tests only where they require deleted legacy layers or obsolete class names.

### Task 1: Architecture Contract

**Files:**
- Create: `tests/v20-ui-architecture.test.mjs`
- Modify: `tests/project-contract.test.mjs`

- [ ] Add a test that rejects `AppHeader`, `MainViewport`, `BottomNavigation`, `glass-card`, `career-overview`, and `v19-` in active source DOM.
- [ ] Assert `styles.css` does not reference `v19-guidance.css`, `mobile-v18.5.css`, `pace-v18.3.css`, or `ux-v18.2.css`.
- [ ] Assert the career source exposes `v20-career-identity`, `v20-career-console`, `v20-career-growth`, and `v20-career-actions` contracts.
- [ ] Render the shell and career page in the existing Playwright flow, assert the exact four career sections, visit all eight active V20 routes, and verify a scrollable Sheet can close cleanly.
- [ ] Run `node --test tests/v20-ui-architecture.test.mjs` and record the expected legacy-class/section failure.

### Task 2: Single V20 Shell and CSS Entry

**Files:**
- Modify: `src/components/appShell.js`
- Modify: `styles.css`
- Modify: `src/styles/theme.css`
- Modify: `src/styles/base.css`
- Modify: `src/styles/mobile-foundation.css`
- Modify: `src/styles/v20-product.css`

- [ ] Replace all shell class lists with only `v20-app-shell`, `v20-app-header`, `v20-main-viewport`, `v20-bottom-nav`, `v20-nav-button`, `v20-overlay-root`, and `v20-toast-root` families.
- [ ] Preserve route state, attention badges, save feedback, pace controls, keyboard behavior, and scroll hint behavior.
- [ ] Define the shell layout, 44px controls, bottom safe area, bounded desktop width, and mobile scrolling directly under V20 selectors.
- [ ] Remove obsolete stylesheet imports from `styles.css`.
- [ ] Run the architecture test and keep only career-section failures red.

### Task 3: Shared Player, Event, and Growth Components

**Files:**
- Modify: `src/components/playerCard.js`
- Modify: `src/components/eventCard.js`
- Create: `src/components/developmentDelta.js`
- Modify: `src/styles/components.css`

- [ ] Define `createPlayerCard(save,club,{variant:'compact'|'detail'})` with identity, nation, age, club, position, OVR, potential, value, career stage, and optional radar/detail facts.
- [ ] Keep `createEventCard(event,{onChoose})` as the only choice renderer and migrate its DOM to `v20-event-*` classes.
- [ ] Define `createDevelopmentDelta({title,items,emptyText})`, where items are `{label,value,tone}` and no business calculations live in the component.
- [ ] Add component source assertions and run the focused contract test red before page migration, then green after consumers use the shared functions.

### Task 4: Four-Part Career Home

**Files:**
- Modify: `src/pages/careerPage.js`
- Modify: `src/styles/pages.css`
- Modify: `src/styles/v20-product.css`

- [ ] Compose the home in this exact order: `v20-career-identity`, `v20-career-console`, `v20-career-growth`, `v20-career-actions`.
- [ ] Use compact `createPlayerCard` for avatar/name/nation/age/club/position/OVR/potential/value/stage.
- [ ] Render season/date/apps/goals/assists/rating/trust/fitness/morale in the console.
- [ ] Render radar, recent attribute gains, training result, match growth, and unlocked skills in growth using `createDevelopmentDelta`.
- [ ] Render current attention and pending event with `createEventCard`; urgent items stay discoverable and non-urgent items retain defer behavior.
- [ ] Run architecture, core, and growth tests green.

### Task 5: Page Migration

**Files:**
- Modify: `src/pages/trainingPage.js`
- Modify: `src/pages/matchPage.js`
- Modify: `src/pages/profilePage.js`
- Modify: `src/pages/onboardingPage.js`
- Modify: `src/pages/rankingsPage.js`
- Modify: `src/pages/transferPage.js`
- Modify: `src/pages/worldPage.js`
- Modify: `src/pages/morePage.js`
- Modify: `src/pages/saveSelectPage.js`

- [ ] Use `createDevelopmentDelta` for training results and match growth.
- [ ] Use detail `createPlayerCard` in Profile; remove its duplicate identity/radar DOM.
- [ ] Migrate onboarding, rankings, transfer, world, more, save selector, training, and match active DOM to V20 class families.
- [ ] Preserve every existing action callback, route, form label, button type, modal lifecycle, and persistence path.
- [ ] Run `node --test tests/v20-ui-architecture.test.mjs tests/core.test.mjs tests/growth-closure.test.mjs tests/overlay-lifecycle-audit.mjs`.

### Task 6: Delete Legacy Layers and Finish Visual System

**Files:**
- Delete: `src/styles/v19-guidance.css`
- Delete: `src/styles/mobile-v18.5.css`
- Delete: `src/styles/pace-v18.3.css`
- Delete: `src/styles/ux-v18.2.css`
- Delete: `src/components/guidanceBanner.js`
- Delete: `src/systems/guidance/guidanceSystem.js`
- Modify: `src/styles/components.css`
- Modify: `src/styles/pages.css`
- Modify: `src/styles/mobile-foundation.css`
- Modify: `src/styles/v20-product.css`

- [ ] Move only still-used radar, sheet, form, animation, pace, and responsive rules into the owned V20 stylesheets.
- [ ] Use soft gray background, translucent materials, restrained shadows, 8px maximum card radius, no gradients, and no `!important`.
- [ ] Ensure fixed-format controls have stable dimensions, all visible controls are at least 44px, sheets respect safe areas, and no page causes horizontal overflow.
- [ ] Run `rg` checks for deleted imports/files, forbidden classes, `!important`, and card radii above 8px.

### Task 7: Verification, Screenshots, Commit, and Push

**Files:**
- Modify only files required by verification findings.

- [ ] Run `node --test tests/v20-ui-architecture.test.mjs`.
- [ ] Run `npm run check`.
- [ ] Run `node tests/v20-product-audit.mjs`.
- [ ] Run `node tests/mobile-layout-audit.mjs`.
- [ ] Run `git diff --check` and a final forbidden-class/import scan.
- [ ] Capture `390x844` and `1440x900` screenshots under `test-results/v20-ui-architecture/` using the existing Playwright/server tooling.
- [ ] Review the full diff for dead compatibility code and remove it.
- [ ] Commit the complete coherent change with `refactor: unify V20 UI architecture`.
- [ ] Push `refactor/v20-ui-architecture`; do not create or merge a PR and do not deploy.
