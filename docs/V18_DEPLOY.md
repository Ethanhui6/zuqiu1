# V18.1 部署说明

## Cloudflare Pages

1. 解压部署包，将包内文件复制到原GitHub仓库根目录。
2. 保留隐藏的 `.git` 文件夹，不要创建新仓库或新Pages项目。
3. 在GitHub Desktop提交并推送到原生产分支。
4. Cloudflare Pages设置：
   - Framework preset：None
   - Build command：留空
   - Build output directory：`.`
   - Production branch：`main`
5. 等待原项目部署成功，访问不带随机哈希前缀的固定域名。

## 更新缓存

V18.1使用缓存名：

```text
green-pitch-v18.1.0-20260803-4
```

Service Worker激活后会清理旧缓存并接管页面。HTML采用网络优先策略；检测到新版本时由页面提示用户确认更新，避免旧首页长期控制网站。

## 本地运行

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。不要直接双击 `index.html`，因为浏览器通常会阻止本地ES模块和JSON请求。

## 部署后检查

- 首页显示V18.1.0。
- 新建测试存档并完成一次事件与比赛。
- 刷新后核对比分、事件结果和报价没有变化。
- 在手机端检查底部安全区域、键盘弹起和横向溢出。
- 如仍显示旧版，在Cloudflare确认生产分支部署成功，不要新建项目绕过缓存。
