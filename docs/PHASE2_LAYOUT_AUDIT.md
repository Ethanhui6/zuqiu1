# Strict Rebuild Phase 2 UI Shell Audit

Date: 2026-08-08
Version: 20.43.0

Phase 2 replaced the duplicated application-shell wiring with one production shell component. Domain pages and creation behavior were intentionally left for later phases.

## Implemented contract

- `src/components/appShell.js` owns the Header host, MainViewport, ActionDock, and BottomNavigation host.
- `src/app.js` mounts and renders that component instead of constructing another shell string.
- The page MainViewport is the only vertical scroll owner while the application shell is active.
- A page may render one `.page-fixed-action`; the shell moves it into the shared ActionDock.
- ActionDock and BottomNavigation are separate grid rows and cannot cover one another or the page body.
- Route navigation resets MainViewport scroll rather than scrolling the document.
- The default presentation is premium light; explicit dark and system preferences remain supported.
- Shared safe-area, spacing, height, and stacking tokens remain the geometry source of truth.

## Browser gate

`node tests/phase2-layout-gate.mjs` passed in system Chromium at:

| Viewport | Result |
| --- | --- |
| 320 x 568 | PASS |
| 375 x 812 | PASS |
| 390 x 844 | PASS |
| 393 x 852 | PASS |
| 414 x 896 | PASS |
| 428 x 926 | PASS |
| 430 x 932 | PASS |
| 1440 x 900 | PASS |

The gate verifies one Header, one visible primary action, one ActionDock, one BottomNavigation, light-first startup, one page scroll owner, no horizontal overflow, no action/navigation overlap, action hit testing, real Career primary-command dispatch, Toast bounds, Sheet lifecycle, dialog bounds, and compact dynamic viewport behavior.

## Visual inspection

Current production modules were exercised through player creation into the Career page and captured at 390 x 844 and 1440 x 900. Header, content, ActionDock, and BottomNavigation remained ordered and visible. Mobile exposed the current node and its primary command without overlap. Desktop preserved the existing two-column Career content pending its later page-specific rebuild.

Generated screenshots:

- `test-results/phase2-shell-mobile.png`
- `test-results/phase2-shell-desktop.png`

## Verification

| Check | Result |
| --- | --- |
| `node --test tests/version-contract.test.mjs` | PASS, 1/1 |
| `node tests/phase2-layout-gate.mjs` | PASS, 8 viewports |
| `node --test tests/football-update.test.mjs` | PASS, 3/3 after replacing the obsolete dark-default assertion |
| `npm test` | PASS, 170/170 |
| `npm run build` | PASS, version 20.43.0 |

One combined independent review was used because the shared shell is a high-risk foundation. It found that moving the Career primary action outside the page event-delegation root disconnected its command. Career actions now use direct handlers that survive ActionDock relocation, and the browser gate clicks the relocated command and verifies its business Sheet opens. Focused and final full verification passed after the fix.

## Gate result

Strict rebuild Phase 2: `PASS`. Phase 3 is the only active phase.
