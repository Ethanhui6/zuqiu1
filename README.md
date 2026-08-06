# 绿茵浮沉 · 足球生涯模拟器 V20

移动端优先、无框架依赖的静态网页游戏。

## 本地检查

```bash
npm test
npm run build
```

## 部署

上传全部文件到 GitHub 仓库根目录并提交到 `main`。仓库需配置：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

GitHub Actions 会构建 `dist` 并部署到 Cloudflare Pages 项目 `zuqiu1`。

Pages 原生 Git 部署配置：构建命令为 `npm run build`，构建输出目录为 `dist`；GitHub Actions 负责测试和构建校验，不重复发布 Pages。
