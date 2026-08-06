# vNext 验收记录

日期：2026-08-07
分支：`feat/interaction-world-rebuild-vnext`

## 自动化

- `npm test`：42/42 通过。
- `npm run test:repo`：3/3 通过。
- `node tests/v20-product-audit.mjs`：通过，当前俱乐部目录与关键训练流程审计通过。
- `npm run build`：通过，输出 `dist/`，入口 `index.html`，版本 `20.0.0`。
- `git diff --check`：通过。
- 构建后 `dist/data/maps`：不存在。

## 本轮修复与功能

- 训练机会按位置生成 2 至 4 个方案；普通周自动推进，训练只在关键节点暂停。
- 门将训练池与六维门将雷达独立；场上球员不会看到门将专项训练。
- 训练小游戏结算后返回生涯首页，并写入成长、疲劳、训练历史和新闻。
- “世界”入口改为“俱乐部”，支持区域、国家、联赛、位置和搜索筛选；旧世界地图不再进入生产路由。
- 俱乐部详情保留模拟参数与来源数据，但城市缺失值不再显示“未核实”；创建球员的青年队选择流程使用相同规则。
- 修复快速模式自动结算比赛更新旧状态引用的问题；比赛按 ID 更新当前存档副本，赛程不再重复停在同一场。
- 保留 GitHub Actions 测试与构建门禁；当前阶段没有新增发布动作。

## 资源

- `src/data/sceneRegistry.js` 登记 56 个本地场景资源，文件位于 `assets/scenes/`。
- `src/data/trainingGames.js` 登记 20 个训练小游戏机制。
- `src/data/interactionRegistry.js` 登记 180 项可操作互动。
- 音效使用浏览器原生 Web Audio API 实时合成，不加载外部音频。

## 浏览器验收

- 生产构建通过 `http://127.0.0.1:4173/?no-sw=1` 打开；隔离存档使用 `http://localhost:4174/?no-sw=1`。
- 六步创建球员流程实际完成，签约后进入“生涯控制台”；年龄与生日由种子生成，无需手动输入。
- 俱乐部目录实际验证：500 支球队；亚洲筛选显示 36 支；叠加 `GK` 位置需求显示 11 支；详情可打开且页面不再显示“未核实”。
- 自动推进实际验证：快速模式下赛程从 2026-07-06 推进到 2026-07-13、2026-07-20，随后在 2026-08-10 第 6 周生成 3 个训练方案。
- 训练实际验证：选择“压迫与回收”进入小游戏，倒计时结束自动结算为 D 级，成长与新闻写入存档并返回生涯首页；小游戏弹层中可见“跳过本次训练”入口。
- 390×844：`innerWidth=390`、`scrollWidth=375`，底部导航位于视口内，控制台无错误或警告。
- 1280×800：`innerWidth=1280`、`scrollWidth=1265`，底部导航位于视口内，控制台无错误或警告。
- 截图：`docs/vnext-mobile-390.png`、`docs/vnext-desktop-1280.png`。
- 本轮为本地 Chromium 浏览器验收，不宣称实体 iPhone Safari 或真实触控硬件验收。

## 构建与交付

- 构建复制 `index.html`、`styles.css`、`src/`、`assets/`、`data/` 和部署元文件到 `dist/`；`dist/` 已在 `.gitignore` 中排除。
- 本轮交付源码、`dist/`、验收报告和 `football-career-world-training-media-audio-rebuild-vNext.zip`。
- 本轮没有推送 GitHub、创建 PR、操作 Cloudflare 或重复使用 Wrangler；线上发布仍须在后续独立提交和 PR 中处理。
