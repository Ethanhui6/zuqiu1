# 发布说明

## 入口与构建

- 生产入口：`index.html -> src/app.js`
- 构建命令：`npm run build`
- 构建输出：`dist/`
- 本地完整检查：`npm run check`

`dist/` 是可重建产物，不应提交到 Git。发布前只提交源码、数据和必要的静态资源。

## Cloudflare Pages

项目 `zuqiu` 使用 Cloudflare Pages 的 GitHub 原生连接：

- GitHub Actions 只负责 `npm ci`、测试、构建和构建产物检查。
- Pages 原生连接负责 PR 预览和生产分支部署。
- Root directory 使用仓库根目录，构建命令为 `npm run build`，输出目录为 `dist`。
- 不使用 Wrangler 重复发布，不创建 Worker，不创建第二个 Pages 项目。

生产分支、预览分支开关和 Build watch paths 以 Cloudflare 控制台当前项目配置为准。合并前应确认 PR 检查通过并出现预览部署；合并到生产分支后，再核对 Pages 部署 commit SHA 与生产分支 SHA 一致。

## 发布顺序

```text
npm test
npm run build
git status
git push -u origin HEAD
gh pr create --fill
```

PR 合并后等待 `zuqiu` 的原生生产部署，不要手动上传 `dist/`。若需要回滚，使用 GitHub 上最后一个稳定提交或稳定标签创建回滚 PR，禁止强制推送生产分支。

本轮 vNext 当前仍在本地功能分支，尚未推送 GitHub、创建 PR 或部署 Cloudflare。
