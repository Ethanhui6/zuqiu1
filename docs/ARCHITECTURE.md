# 项目架构

## 当前生产路径

- 浏览器入口：`index.html`
- 应用入口：`src/app.js`
- 全局样式：`styles.css`
- 构建脚本：`scripts/build.mjs`
- 唯一构建输出：`dist/`

构建只复制生产入口、`src/` 和 `assets/`。`client/`、`js/`、`legacy/`、旧的 `src/main.js` 模块树仍需逐项验证引用后才能删除，本阶段不将它们视为生产入口。

## 发布边界

`.github/workflows/ci.yml` 只验证测试和构建。现有 `deploy.yml` 仍负责生产发布，在确认 Cloudflare 项目、分支保护和生产域名前不修改。
