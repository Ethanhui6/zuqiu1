# 绿茵浮沉 · 足球生涯模拟器 V20

移动端优先、无框架依赖的静态网页游戏。

## 本地检查

```bash
npm test
npm run build
```

## 部署

项目 `zuqiu` 使用 Cloudflare Pages 的 GitHub 原生连接：GitHub Actions 只负责测试和构建，Pages 负责 PR 预览与生产分支部署。不要提交 `dist/`，也不要使用 Wrangler 重复发布。

完整流程见 [README_DEPLOY.md](README_DEPLOY.md)。
