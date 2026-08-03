# 实施进度

最后更新：2026-08-03  
当前交付版本：`v18.9.0-mobile-overlay-hotfix`

## V18.9 移动端遮挡根治与训练控制中心

- 已定位黑色/绿色巨大竖向圆角层根因：旧 `.toast` 在组件样式中设置 `bottom`，移动样式又设置 `top`，固定定位盒同时拥有上下边距且没有明确高度，被浏览器拉伸为整屏圆角柱；黑色对应普通提示，绿色对应成功提示。
- Toast 现在显式使用紧凑高度，并在退出后真实移除；默认 `pointer-events:none`，不再只靠 `opacity:0` 隐藏。
- 新增 `OverlayManager`，统一登记浮层、timer、RAF 和清理回调；路由切换会取消动画队列、卸载页面浮层并强制释放 Sheet。
- 全屏动画背景已移除，动画层改为无交互的紧凑反馈卡；训练选择改为卡片内微反馈。
- 训练页改为控制中心：首屏显示当前方向、教练建议、体能、疲劳、收益、风险、适配度、自动策略和优先训练计划；其余计划在同页折叠区内。
- 生涯页将推进操作前置，球员卡和数据卡紧凑化，赛季目标及次要设施默认折叠。
- 7 档手机宽度 Toast/Overlay 生命周期回归、11 档视口完整流程、50 次连续动画释放均已通过。

## 阶段状态

| 阶段 | 状态 | 可核验结果 |
| --- | --- | --- |
| 项目审计 | 已完成 | 入口、样式、路由、状态、数据、存档、PWA、Cloudflare、后端、资源和测试均已扫描 |
| 移动端可用性根治 | 已完成 | 六档视口无横向溢出、竖排、透明点击层、小触控目标或重大控制台错误 |
| AppShell 与浅色 UI | 已完成 | 显式 AppHeader / MainViewport / BottomNavigation / OverlayRoot / ToastRoot，单一正文滚动容器 |
| 六步建档与日期 | 已完成 | 原生日期、纯日期字符串、即时草稿、前后步骤保留和 Safari 安全底部操作区 |
| 球队 / 转会 / 比赛页面 | 已完成 | 手机单列、自适应卡片、完整比赛头部、报价信息分层和谈判 Bottom Sheet |
| 游戏性与节奏 | 已完成 | 四种职业节奏、五档推进速度、六种推进目标、重要节点自动暂停和阶段摘要 |
| 事件与防重复 | 已完成 | 1120 个活动模板、5600 个选择、12800 种有效结果组合、剧情链、冷却和延迟/隐藏后果 |
| 赛程与球队生态 | 已完成 | 500 家球队、37 个国家、47 个联赛、8 类赛事和独立升降级/洲际资格状态 |
| 本地与世界排行榜 | 已完成 | 本地存档榜、D1 API、运行会话、检查点、服务器重算和基础反作弊 |
| 完整确定性服务端重放 | 未完成 | 当前不宣称达到逐步重放整局，计划在 `v18.9.0` 实现 |
| 实体 iPhone / Android 验证 | 未完成 | 当前验证为真实 Chromium 移动视口，不冒充实体机 |
| 逐队授权队徽 | 未完成 | 压缩包没有授权队徽包，生产界面使用统一原创盾牌占位，不擅自抓取商业徽标 |

## 本阶段实际实现

- 将桌面优先样式备份到 `legacy/styles/pages.desktop-v18.6.css`，生产样式改为 320 至 430 像素默认单列；仅使用 `min-width: 480/768/1024/1440` 增强。
- 移除 `body min-width` 和以隐藏溢出掩盖布局的做法；正文容器允许诊断真实溢出。
- AppShell 统一管理动态视口、安全区、顶部栏、速度栏、五入口底部导航、弹层和 Toast。页面不再创建各自的 fixed 头尾栏。
- Sheet 统一挂载到 OverlayRoot；关闭立即取消命中、卸载遮罩、恢复滚动和焦点。Toast 移到顶部，避免遮挡底部主操作。
- 创建球员保持六步单任务：基础身份、身体/国籍/惯用脚、位置、风格、天赋、青年队/节奏。草稿写入会话存储，返回步骤不丢值。
- 生日使用原生 `input[type=date]`，字号不低于 16 像素，存储 `YYYY-MM-DD`，中文显示单独格式化，不使用 UTC/`toISOString()`。
- 球队世界卡片只保留移动端关键字段；队徽保持比例并提供错误回退。球队数据明确标注为公开身份信息加独立模拟评分。
- 转会报价卡拆为球队身份、核心合同、适配信息和操作；谈判工资、角色、租借、条款进入统一 Bottom Sheet；只有玩家显式接受才改变 `clubId`。
- 比赛页完整显示双方队徽和名称、比分/VS、赛事、轮次、天气、首发状态；提供直接结果、快速时间线、互动比赛及完整赛后评价和状态变化。
- 增加 `formatEffectList()`、`formatStatLabel()`、`formatStatValue()`、`formatDate()`、`formatCurrency()`、`formatPercentage()`，未知生产字段不直出英文 key。
- 四种节奏模式和暂停/1 倍/2 倍/4 倍/快速均写入存档；支持下一事件、下一场、周、月、转会窗和赛季末推进。
- 事件筛选增加年龄、位置、能力、潜力、球队/联赛、赛季阶段、表现、体能、士气、信任、关系、合同、意愿、目标和历史选择条件；每项选择至少影响两个系统。
- 存档记录事件 ID、最近 20 个标签、选择结构、冷却、唯一事件、剧情链、人物和对手；硬性阻止连续三次同类事件，并优先延续剧情链。
- 赛程覆盖青年、预备队、国内联赛、国内杯赛、洲际、季前、友谊和国家队赛事；赛季结算独立记录模拟升降级和洲际资格。
- Service Worker 缓存升级至 `green-pitch-v18.7.0-20260803-1`，激活清理旧缓存，HTML 使用网络优先。

## 主要修改文件

- 应用壳体与入口：`src/components/appShell.js`、`src/main.js`、`src/components/sheet.js`、`src/components/toast.js`
- 移动样式：`src/styles/base.css`、`src/styles/components.css`、`src/styles/mobile-foundation.css`、`src/styles/pages.css`
- 页面：`src/components/clubCard.js`、`src/pages/matchPage.js`、`src/pages/transferPage.js`
- 游戏系统：`src/systems/career/`、`src/systems/event/eventEngine.js`、`src/systems/schedule/scheduleSystem.js`、`src/systems/match/matchSystem.js`、`src/systems/transfer/transferSystem.js`
- 服务与存档：`src/utils/dom.js`、`src/utils/format.js`、`src/services/storage/migrations.js`
- 版本与 PWA：`package.json`、`package-lock.json`、`data/version.json`、`src/app/config.js`、`sw.js`
- 测试：`tests/mobile-layout-audit.mjs`、`tests/gameplay-depth-audit.mjs`、`tests/twenty-season-sim.mjs` 及现有验收/后端测试
- 迁移参考：`legacy/styles/pages.desktop-v18.6.css`

## 测试结果

### `npm test`：通过

- 32 项验收、99 项运行时、36 项节奏、19 项 UI/UX 审计全部通过。
- 游戏深度审计：500 家球队、37 个国家、47 个联赛、1120 个活动事件模板、5600 个选择、12800 种有效结果组合。
- 固定样本赛季生成 36 场比赛、29 个不同对手；8 类赛事定义齐全。
- 214 个文件静态扫描通过，相对导入有效，关键源码未发现 `Math.random()`。
- 排行榜后端拒绝伪造统计；Worker 的 SPA 回退、API 路由和缺数据库保护通过。

### `npm run test:20`：通过

- 20 个赛季、709 场比赛、273 个不同对手。
- 124 次事件、124 个唯一事件、事件 ID 重复率 `0%`。
- 10 次转会、11 家效力俱乐部；剧情链启动 1 条、完成 1 条，完成率 `100%`。
- 95 项成就，最终结局“转会流浪者”，最近一次模拟耗时低于 1 秒，控制台错误 `0`。
- 报告：`docs/V18_7_20_SEASON_REPORT.md` 与 `docs/V18_7_20_SEASON_REPORT.json`。

### `npm run test:mobile`：通过

- 320×568、375×667、390×844、430×932、768×1024、1440×900 全部通过。
- 六档视口的根节点和正文横向溢出均为 0；全部可见按钮至少约 44×44 像素；无竖排、透明遮罩和控制台错误。
- 390×844 走通建档、日期打开/选择/关闭/下一步、位置、天赋、青年队、生涯、比赛选择与结算、球队世界、转会报价和谈判关闭。
- 截图保存在 `docs/screenshots-v18.7/`。

## 未完成事项

- 尚未完成实体 iOS Safari、Android Chrome、软键盘、横竖屏切换和低端机性能测试。
- 尚未获得 500 家球队的可分发授权队徽资源；当前占位实现是明确的降级方案，不宣称“真实队徽已完成”。
- 世界榜已有服务器权威计分和检查点验证，但完整规则版本锁定及服务器确定性重放仍未完成。
- 事件系统的组合量已超过 3000，但 1120 个活动模板共享 640 个基础标题；后续仍应继续扩写高价值剧情链，而不是机械增加文本。
