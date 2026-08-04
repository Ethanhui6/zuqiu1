# 重构进度

## 基线

- 正式仓库：`Ethanhui6/zuqiu1`
- 默认分支基线：`bbbb7c919f0623d330150d2013eeb0fd18c63549`
- 本地备份分支：`backup/pre-vnext-production-20260804-1537`
- 本地备份标签：`backup-pre-vnext-production-20260804-1537`
- 实施分支：`refactor/vnext-ui-growth-production`

远程备份首次推送遇到 GitHub HTTPS 连接重置，重试后已验证分支、标签和重构分支均可从 `origin` 读取。

## Phase 1

- [x] 锁定唯一正式工作副本和生产入口。
- [x] 建立本地备份与隔离 worktree。
- [x] 增加仓库卫生测试和独立 CI。
- [x] 将 `dist/` 定义为可重建产物。
- [x] 推送并验证远程备份、标签和重构分支。
- [ ] 确认 GitHub 分支保护与 Cloudflare 生产环境。
- [x] Actions 部署统一指向已验证的 Pages 项目 `zuqiu`，PR 先验证 `dist/build-meta.json` 与预览。
- [ ] 在 Cloudflare 控制台禁用原生 Git 自动构建，并冻结重复“项目 1”和失败 Worker `football`。
