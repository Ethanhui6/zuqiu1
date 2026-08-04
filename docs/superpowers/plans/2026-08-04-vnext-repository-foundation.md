# vNext Repository Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the production repository reproducible, reviewable, and safe to refactor.

**Architecture:** Keep `index.html -> src/app.js` as the active runtime and `dist/` as the single generated output. Add a standard-library repository test and a non-deploying CI gate before changing product behavior.

**Tech Stack:** Node.js 20, Node test runner, GitHub Actions.

---

### Task 1: Protect the baseline

- [x] Record `main` SHA and create a timestamped backup branch and annotated tag.
- [x] Create an isolated worktree on `refactor/vnext-ui-growth-production`.
- [ ] Verify the backup branch and tag on GitHub after connectivity recovers.

### Task 2: Make generated output reproducible

- [x] Add a failing Node test that rejects tracked build output and local secrets.
- [x] Ignore generated output and remove `dist/` from the Git index.
- [x] Read the build version from `package.json`.
- [x] Run `npm run test:repo`, `npm test`, and `npm run build`.

### Task 3: Add the CI gate and evidence

- [x] Add a Node 20 workflow that runs `npm ci` and `npm run check` and uploads `dist/`.
- [x] Document the active runtime, UI risks, baseline, and deployment blocker.
- [x] Run `npm run check` and `git diff --check`.
- [ ] Commit and push the refactor branch.
