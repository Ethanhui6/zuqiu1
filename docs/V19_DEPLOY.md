# V19 部署说明

## 覆盖现有 GitHub 仓库

1. 备份当前线上版本与存档导出文件。
2. 解压 V19 源码包或部署包。
3. 覆盖原仓库对应文件，但不要删除隐藏的 `.git` 目录。
4. 提交并推送到原来的部署分支。
5. 等待 Cloudflare Pages/Workers 完成构建和部署。
6. 首次打开后确认页面版本为 V19.0.0。
7. 旧 Service Worker 会在 V19 激活后被清理；若浏览器仍显示旧界面，关闭旧标签页后重新打开一次。

## 构建

```bash
npm install
npm run build
```

构建结果位于 `dist/`：

- `dist/client/`：静态前端
- `dist/server/index.js`：Workers 入口
- `dist/drizzle/` 或根目录迁移文件：数据库迁移

## 验证建议

部署后在实体 iPhone Safari 上重点验证：

- 引导条点击跳转
- 320至430像素宽度底栏
- 滚动提示出现与消失
- 节奏 Sheet 开关和滚动
- 返回页面后没有透明遮罩
- 刷新后速度设置保持
