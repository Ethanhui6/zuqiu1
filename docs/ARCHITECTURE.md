# 项目架构

## 当前生产路径

- 浏览器入口：`index.html`
- 应用入口：`src/app.js`
- 全局样式：`styles.css`
- 构建脚本：`scripts/build.mjs`
- 唯一构建输出：`dist/`

构建只复制生产入口、`src/` 和 `assets/`。`client/`、`js/`、`legacy/`、旧的 `src/main.js` 模块树仍需逐项验证引用后才能删除，本阶段不将它们视为生产入口。

## 发布边界

`.github/workflows/ci.yml` 是合并门禁，只运行测试和构建。`.github/workflows/deploy.yml` 从同一提交生成并上传 `dist`，再通过 Wrangler 发布到已验证的 Cloudflare Pages 项目 `zuqiu`：PR 使用 `pr-<number>` 预览分支，`main` 使用生产分支。生产候选域名为 `zuqiu-4tt.pages.dev`。

Cloudflare 原生 Git 连接当前仍从仓库根目录自动构建，并与 Actions 部署重复；重复的“项目 1”和失败的 Worker `football` 也尚未冻结。这三项必须在 Cloudflare 控制台确认并禁用，当前未完成。
