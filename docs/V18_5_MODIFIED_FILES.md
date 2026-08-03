# V18.5 实际修改文件

## 新增

- `assets/crests/placeholder.svg`
- `src/components/clubCrest.js`
- `src/components/formControls.js`
- `src/pages/morePage.js`
- `src/styles/mobile-v18.5.css`
- `src/utils/scrollLock.js`
- `src/utils/uiDiagnostics.js`
- `src/utils/viewport.js`
- `docs/V18_5_MOBILE_REFACTOR.md`
- `docs/V18_5_TEST_REPORT.md`
- `docs/V18_5_MODIFIED_FILES.md`
- `docs/V18_5_KNOWN_ISSUES.md`
- `docs/V18_5_DEPLOY.md`
- `docs/V18_5_MOBILE_TEST.json`
- `docs/V18_5_20_SEASON_REPORT.md`
- `docs/V18_5_20_SEASON_REPORT.json`
- `docs/screenshots-v18.5/*`

## 重写或修改

- `index.html`
- `styles.css`
- `sw.js`
- `package.json`
- `manifest.webmanifest`
- `CHANGELOG.md`
- `README_CN.md`
- `data/clubs.json`
- `data/data-sources.json`
- `data/version.json`
- `src/main.js`
- `src/app/config.js`
- `src/app/theme.js`
- `src/components/appShell.js`
- `src/components/clubCard.js`
- `src/components/sheet.js`
- `src/pages/onboardingPage.js`
- `src/pages/saveSelectPage.js`
- `src/pages/matchPage.js`
- `src/pages/transferPage.js`
- `src/pages/worldPage.js`
- `src/pages/profilePage.js`
- `src/services/storage/migrations.js`
- `src/styles/theme.css`
- `src/styles/base.css`
- `src/styles/components.css`
- `src/systems/career/careerSystem.js`
- `src/utils/format.js`
- `tests/ui-ux-audit.mjs`
- `tests/mobile-layout-audit.py`
- `tests/twenty-season-sim.mjs`

## 不再由生产入口加载

- `src/styles/ux-v18.2.css`
- `src/styles/pace-v18.3.css`

历史文件仍保留在源码包中用于比较，但 `styles.css` 不再导入它们。
