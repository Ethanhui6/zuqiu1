# vNext 验收记录

日期：2026-08-06

## 自动化

- `npm test`：38/38 通过。
- `npm run build`：通过，输出 `dist/`，入口 `index.html`，版本 `20.0.0`。
- `node tests/static-check.mjs`：通过，987 个文件、271 个 JavaScript 文件，相对导入完整、无 `Math.random`、Service Worker 通过。
- `node tests/runtime-audit.mjs`：99 项通过。
- `node tests/overlay-lifecycle-audit.mjs`：通过，生产互动阻塞层为 0。
- `node tests/v20-product-audit.mjs`：18 项通过。
- `node tests/gameplay-depth-audit.mjs`：500 支球队、37 个国家、47 个联赛、1120 个事件模板、5600 个事件选项、12800 个有效组合，近期重复率 0%。
- `node tests/animation-system-audit.mjs`：通过，20 次交互压力测试通过。
- `node tests/mobile-layout-audit.mjs`：通过 320、360、375、390、393、428、430、768、1280、1440、1920 宽度视口。

## 本轮资源与功能清单

- 场景资源：`src/data/sceneRegistry.js` 登记 56 个唯一场景，文件位于 `assets/scenes/scene-*.svg`。全部为项目自制本地 SVG，无外部图片、远程 URL 或未授权素材；每个场景有分类、地点、比例和 MIT 来源字段。
- 训练小游戏：20 个唯一机制，覆盖反应、节奏、瞄准、三选一、弧线、闪避、移动靶、时机窗口、空中球、抢断窗口、平衡、反应灯、记忆、战术、滑动、蓄力、拖动、力度目标、安全节奏和区域保持。名称和入口登记在 `src/data/trainingGames.js`。
- 互动登记：`src/data/interactionRegistry.js` 登记 180 项，分布在全局、设置、生涯、成长、训练、比赛、事件与生涯页面；每项含触发条件、页面、玩家操作和效果描述。
- 音效：`AUDIO_CATALOG` 登记 20 项。使用浏览器原生 Web Audio API 实时合成，不提交音频文件、不加载外部素材。来源和许可见 `assets/audio/README.md`。

## 可见界面扫描

- 已修复两个内部 ID 直出：生涯推进模式由 `standard` 等 ID 映射为中文；训练策略由 `balanced` 等 ID 映射为中文。
- 已修复比赛互动弹层中的属性 ID，`passing` 等值现在显示为“传球”等中文标签。
- 当前浏览器验收页面未发现 `speed`、`physical`、`fatigue`、`risk`、`media`、`trust`、`morale`、`fast`、`standard`、`balanced`、`recovery` 等玩家可见英文残留；代码中的英文 ID 仅用于内部数据和 CSS class。
- 浅色主题检查：页面主体使用深蓝文字 `rgb(21,32,51)`、白色/浅蓝表面和有色状态标签，没有纯黑大面积背景或黑色遮挡层；浅色主题状态为 `light`。

## 重复与首页取舍

- 场景资源和事件场景按 `sceneRegistry` ID 去重；场景调度按最近历史和冷却过滤，事件测试近期重复率为 0%。
- 世界页保留地图、洲、国家、联赛、球队层级；转会页只处理目标球队、窗口、报价和谈判，避免世界探索与转会卡片重复。
- 首页保留当前待办、人物卡、职业控制台、赛季目标、设施、成长、训练和推进控制；训练小游戏集中到训练中心，事件场景和决策只在事件弹层出现。旧的平行源码树作为历史材料保留，生产入口仍只有 `index.html -> src/app.js`。

## 浏览器验收

- 本地生产构建通过 `http://127.0.0.1:4173/?no-sw=1` 打开；隔离存档通过 `http://127.0.0.1:4174/?no-sw=1` 验证。
- 六步创建球员流程可完成，年龄和生日由种子生成，未要求手动输入。
- 390×844：首页、训练中心、事件场景、世界地图和浅色主题均可渲染；页面 `scrollWidth` 未超过视口，浮层关闭后 `role=dialog` 为 0、`has-open-sheet` 已移除、文档可继续滚动。
- 训练小游戏：倒计时、超时结算、评分、疲劳、成长、训练历史和训练结算 Sheet 已实际走通；20 个机制由自动化测试覆盖登记完整性。
- 事件场景：事件图可加载 `./assets/scenes/scene-keeper-training.svg`，决策结果写入状态并刷新待办。
- 比赛中心：中场显示 5 个位置专属互动，互动倒计时后进入对应机制，比赛结果 Sheet 能生成评分、时间线、成长和下一步操作。
- 世界地图：390px 与 1280×800 桌面视口均无横向溢出；SVG 背景地图和洲级交互可见，地图包含 323 个路径节点，世界数据保留 500 支球队。
- 桌面视口：1280×800 截图通过；自动化移动审计覆盖 1280、1440、1920 宽度。
- 设备边界：本轮为本地 Chromium 浏览器验收，未宣称实体 iPhone Safari 或真实触控硬件验收。

## 构建、交付与已知问题

- 构建复制 `index.html`、`styles.css`、`src/`、`assets/`、`data/` 和必要部署元文件到 `dist/`；`dist/` 已在 `.gitignore` 中排除。
- GitHub Actions 保留测试和构建门禁；本轮没有上传 GitHub、创建 PR、操作 Cloudflare 或重复使用 Wrangler。Cloudflare Pages 原生连接仍由后续独立发布阶段处理。
- 本轮没有发现阻断性浏览器问题。已知边界是本地浏览器验收不等同于实体 iPhone Safari，且素材均为项目自制 SVG/合成音，未引入真实照片或音频库。

## 发布状态

当前分支：`feat/interaction-world-rebuild-vnext`

本记录生成时尚未推送 GitHub、创建 PR 或部署 Cloudflare Pages。本轮交付物只包含本地源码、构建产物和 ZIP；线上发布必须在后续独立提交和 PR 中完成。
