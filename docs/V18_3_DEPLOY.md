# V18.3 部署说明

## 覆盖现有GitHub仓库

1. 解压 `football-career-v18.3-pace-deploy.zip`。
2. 将解压后的根目录文件复制到现有仓库根目录。
3. 保留原仓库隐藏的 `.git` 文件夹。
4. 提交并推送全部变更。
5. 等待原Cloudflare Pages或GitHub Pages项目自动部署。

## 本地验证

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。

完整自动测试：

```bash
npm run test:all
```

## 缓存

Service Worker缓存名已更新到V18.3构建。部署后首次打开若检测到新Worker，页面会显示更新提示；确认后接管并刷新。HTML使用网络优先策略，旧缓存会在激活阶段清理。
