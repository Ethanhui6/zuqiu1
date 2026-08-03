# V18 部署说明

## Cloudflare Pages

1. 将部署包解压到原 GitHub 仓库根目录。
2. 保留隐藏的 `.git` 文件夹，不要创建新仓库或新 Pages 项目。
3. GitHub Desktop 提交并推送到原生产分支。
4. Cloudflare Pages 设置：
   - Framework preset：None
   - Build command：留空
   - Build output directory：`.`
   - Production branch：`main`
5. 等待原项目部署成功，访问不带随机哈希前缀的固定域名。

## 更新缓存

V18 使用新缓存名，并在激活时删除旧缓存。检测到新 Service Worker 后，页面会提示“立即更新”。HTML 使用网络优先，避免旧首页长期控制网站。

## 本地运行

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。不要直接双击 HTML。
