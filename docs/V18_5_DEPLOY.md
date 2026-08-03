# V18.5 部署说明

## Cloudflare Pages / 静态主机

1. 解压部署包。
2. 将包内文件覆盖到原仓库根目录。
3. 保留原仓库隐藏的 `.git` 目录。
4. 提交并推送。
5. 等待 Cloudflare Pages 自动部署。
6. 首次打开旧安装版时，根据更新提示刷新；必要时在 Safari 网站数据中清理旧站点缓存。

无需执行构建命令，入口为 `index.html`。

## 本地检查

```bash
python -m http.server 8080
```

浏览器打开 `http://localhost:8080`。开发环境会注销旧 Service Worker，避免缓存干扰。

## 发布确认

页面与 `data/version.json` 应显示 `18.5.0`，Service Worker 缓存名应包含 `green-pitch-v18.5.0`。
