# Phase 2 Global Layout Audit

Date: 2026-08-08

Phase 2 unified the global layout contract without changing the established geometry. Header, page content, fixed action, bottom navigation, sheets, dialogs, and toasts now share named spacing and stacking variables.

## Layout contract

The production stylesheet now exposes and uses these variables:

- `--header-height`
- `--bottom-nav-height`
- `--action-bar-height`
- `--safe-top`
- `--safe-bottom`
- `--page-padding`
- `--page-bottom-space`
- `--z-content`
- `--z-header`
- `--z-action`
- `--z-nav`
- `--z-sheet`
- `--z-modal`
- `--z-toast`

The existing viewport spacing and component dimensions remain unchanged. The variables replace duplicated layout arithmetic and provide one contract for later phases.

## Blocking defect fixed

Player creation could leave seven simultaneous feedback toasts at 320 px. The toast stack covered the fixed career action and each toast accepted pointer input, so the visible CTA was not the actual hit target.

The feedback director now keeps only the three latest visible toasts. Toasts remain visible feedback but do not intercept pointer input. The browser gate verifies both the queue limit and the CTA hit target while a toast is present.

## Browser gate

`tests/phase2-layout-gate.mjs` drives a real player creation flow in system Chromium and checks the production application at:

| Width | Height | Result |
| ---: | ---: | --- |
| 320 | 568 | PASS |
| 375 | 812 | PASS |
| 390 | 844 | PASS |
| 393 | 852 | PASS |
| 414 | 896 | PASS |
| 428 | 926 | PASS |
| 430 | 932 | PASS |

Each viewport passed these checks:

- every required layout variable resolves to a value;
- no document-level horizontal overflow;
- Header, content, fixed action, and BottomNav are present and in bounds;
- the fixed action does not overlap BottomNav and remains the pointer hit target;
- no more than three toasts are visible and they do not intercept input;
- Toast remains inside the viewport and clear of Header;
- Sheet is in bounds after its entry animation, its close button is clickable, and scroll lock is cleaned up;
- the retirement dialog is in bounds and closes cleanly;
- the 390 x 650 dynamic viewport keeps fixed controls separated.

Detailed ignored output: `test-results/phase2-layout-gate.json`.

## Regression results

| Check | Result |
| --- | --- |
| `npm test` | PASS, 108/108 |
| `npm run build` | PASS, version 20.4.0 |
| `npm run test:repo` | PASS, 3/3 |
| `node tests/mobile-layout-audit.mjs` | PASS, 12 viewports |
| `node tests/phase2-layout-gate.mjs` | PASS, 7 viewports |
| `git diff --check` | PASS |

Generated screenshots were visually checked at 320 x 568 and 1280 x 720. No clipping, overlap, horizontal overflow, or inaccessible action was observed. Physical Safari remains outside the local Windows test environment; safe-area behavior is covered by the production CSS contract and Chromium viewport checks.

## Gate result

Phase 2 PASS. Phase 3 is unlocked as the only active phase.
