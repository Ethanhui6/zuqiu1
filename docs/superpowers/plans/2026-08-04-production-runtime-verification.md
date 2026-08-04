# Production Runtime Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every production deployment self-identifying, cache-safe, and demonstrably connected to the current career, growth, world, and event systems.

**Architecture:** Keep the current modular `src/main.js` runtime and `dist` build. Generate deployment metadata at build time, expose it through the existing More/About UI, deploy the exact verified artifact, make the Service Worker cache build-specific, and close only the gameplay gaps proven by the audit.

**Tech Stack:** Browser-native ES modules and Service Worker APIs, Node.js build/test scripts, GitHub Actions, Cloudflare Pages.

---

### Task 1: Verifiable Build Metadata

**Files:**
- Modify: `scripts/build.mjs`
- Modify: `src/pages/morePage.js`
- Modify: `tests/project-contract.test.mjs`

- [ ] Add a failing contract test requiring `build-meta.json` fields `version`, `commitSha`, `shortCommitSha`, `branch`, `buildTime`, and `deploymentTarget`, plus an About view that fetches and displays them.
- [ ] Run `node --test tests/project-contract.test.mjs` and confirm the metadata assertion fails.
- [ ] Read `GITHUB_SHA`, `GITHUB_REF_NAME`, and `DEPLOYMENT_TARGET` in `scripts/build.mjs`, using explicit local fallbacks, and write all required fields.
- [ ] Add a small `loadBuildInfo()` helper in `morePage.js`; its About action must render version, short SHA, build time, and environment, with an unavailable fallback for local development.
- [ ] Run the contract test and `npm run build`; inspect `dist/build-meta.json` for all fields.

### Task 2: One Verified Deployment Artifact

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Delete: `.github/workflows/ci.yml`
- Modify: `tests/repository-hygiene.test.mjs`

- [ ] Add a failing repository test requiring one workflow with `verify`, artifact upload, artifact download, metadata validation, and deploy-from-download ordering.
- [ ] Run `node --test tests/repository-hygiene.test.mjs` and confirm it fails against the two independent builds.
- [ ] Make `deploy.yml` build once with deployment metadata, validate `dist/build-meta.json`, upload `dist`, download it into `release-dist`, and deploy only `release-dist` after verification.
- [ ] Remove the duplicate CI workflow so a green build and deployed bytes cannot diverge.
- [ ] Run the repository test and validate the YAML references Pages project `zuqiu`, production branch `main`, and output `release-dist`.

### Task 3: Build-Specific Service Worker and HTTP Policy

**Files:**
- Modify: `sw.js`
- Modify: `scripts/build.mjs`
- Modify: `_headers`
- Modify: `tests/runtime-activation.test.mjs`

- [ ] Add failing tests requiring the build to replace a `__BUILD_ID__` token, explicit no-cache policies for HTML, worker, and metadata, network-first navigation/modules, cache-first only for hashed assets, no caching of failed responses, and no HTML fallback for arbitrary asset/API requests.
- [ ] Run `node --test tests/runtime-activation.test.mjs` and confirm the cache identity/typed fallback assertions fail.
- [ ] Replace the static cache name with a build token substituted into `dist/sw.js` by the build script.
- [ ] Route navigation requests to network-first with cached `index.html` fallback, same-origin unhashed modules/styles to network-first, hashed assets to cache-first, and API requests to the network without HTML fallback.
- [ ] Keep `skipWaiting`, `clients.claim`, old-cache deletion, and per-client navigation rejection isolation; prevent refresh loops by navigating only clients not already controlled by the current worker.
- [ ] Add explicit `_headers` blocks for `/index.html`, `/sw.js`, and `/build-meta.json` using `no-cache, no-store, must-revalidate`.
- [ ] Run the runtime test and inspect the built worker cache name.

### Task 4: Action and Calendar Closure

**Files:**
- Modify: `src/systems/attention/attentionManager.js`
- Modify: `src/components/guidanceBanner.js`
- Modify: `src/pages/careerPage.js`
- Modify: `tests/core.test.mjs`

- [ ] Add failing tests proving deferring the current action selects the next actionable item until relevant state changes, and the career header exposes a non-negative next-match day countdown.
- [ ] Run `node --test tests/core.test.mjs` and confirm both assertions fail.
- [ ] Reuse the existing attention state to store a deferred fingerprint derived from action id and relevant state; filter only matching deferred fingerprints.
- [ ] Add a secondary `稍后处理` command to the existing guidance banner and wire it to update state and refresh.
- [ ] Derive the next-match countdown from `gameClock.currentDate` and the first upcoming fixture and display it in the existing console summary.
- [ ] Run the core test.

### Task 5: Shared Growth Settlement

**Files:**
- Modify: `src/systems/career/developmentSystem.js`
- Modify: `src/systems/training/trainingSystem.js`
- Modify: `src/systems/match/matchSystem.js`
- Modify: `tests/growth-closure.test.mjs`

- [ ] Add a failing test that starts one attribute just below a level threshold, settles match XP, and proves XP carry, integer attribute increase, OVR recalculation, and radar input equality after save/reload.
- [ ] Run `node --test tests/growth-closure.test.mjs` and confirm match growth fails.
- [ ] Move the existing threshold/carry/OVR logic into one exported settlement function in `developmentSystem.js` and call it from both training and match settlement.
- [ ] Keep current XP scales and deterministic RNG; do not introduce a second progression model.
- [ ] Run growth and core tests.

### Task 6: Event Fallback De-duplication

**Files:**
- Modify: `src/systems/event/eventEngine.js`
- Modify: `tests/core.test.mjs`

- [ ] Add a failing deterministic test exhausting the normal pool and asserting fallback fingerprints do not repeat inside the recent-memory window.
- [ ] Run the targeted test and confirm the repeated fallback fails it.
- [ ] Generate the minimum fallback variation from existing category, week, club, and person state and record its fingerprint through the normal memory path.
- [ ] Run core tests.

### Task 7: Verification, Review, and Release

**Files:**
- Modify only files required by review findings.

- [ ] Run `ponytail-review` on the full diff and remove duplicate abstractions or unused compatibility code.
- [ ] Run `npm run check`, `node tests/v20-product-audit.mjs`, `node tests/mobile-layout-audit.mjs`, and `git diff --check`.
- [ ] Build with explicit production environment values and verify metadata, worker cache id, entry, and required feature markers inside `dist`.
- [ ] Push the repair branch, create a PR, wait for the verified artifact deployment, and merge only after required checks pass.
- [ ] Verify `zuqiu-4tt.pages.dev` reports the merged `main` SHA/build time and exercise action deferral, date/countdown, training/match growth, radar, world hierarchy, and event progression in production.
- [ ] Publish a release only after the production checks prove the deployed commit.

