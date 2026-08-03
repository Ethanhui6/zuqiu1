# V20 部署说明

## 静态/PWA部署

使用部署包根目录内容覆盖现有Cloudflare Pages项目并提交。入口为`index.html`，Service Worker会升级至V20缓存并清理旧缓存。

## 带排行榜后端部署

构建产物同时包含：

- `client/`：静态前端
- `server/index.js`：Cloudflare Worker入口
- `.openai/drizzle/`：D1迁移
- `functions/`：Pages Functions兼容入口

部署前按现有项目绑定D1数据库和环境变量。没有数据库绑定时，世界排行榜API返回安全的中文不可用状态，本地游戏仍可运行。

## 本地验证

```bash
npm test
npm run test:20
npm run test:modes
npm run test:browser
npm run build
```
