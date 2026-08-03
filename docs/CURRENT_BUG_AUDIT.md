# 当前缺陷审计

审计日期：2026-08-03  
审计基线：压缩包内 `v18.5.x` 及接手时的 `v18.6.0` 代码
当前修复版本：`v18.9.0-mobile-overlay-hotfix`

## 2026-08-03 巨型黑色/绿色遮挡层根因复盘

- 已通过真实 DOM 与计算样式复现。`src/styles/components.css` 的旧 `.toast` 声明保留 `bottom`，随后 `src/styles/mobile-foundation.css` 又声明 `top`，但未重置 `bottom`。固定定位 Toast 因此从顶部一直拉伸到底部，`border-radius:999px` 使其成为中央巨型竖向圆角柱。
- 普通 Toast 背景为黑色，所以生涯页显示黑色柱；训练保存/选择使用 `type=success`，背景为绿色，所以训练页显示绿色柱。这不是训练环本身，也不是随机视觉问题。
- 原实现超时后仅移除 `is-visible`，节点仍留在 ToastRoot；页面切换也不会统一取消动画队列，造成同类问题反复出现。
- 修复后 Toast 明确使用 `bottom:auto`、紧凑内容高度和无交互命中，退场 190ms 后由 `OverlayManager.release()` 真正删除。
- `OverlayManager` 统一管理 Animation、Toast 和页面级 Overlay 资源；路由离开调用 `animationDirector.cancelAll()` 与 `destroySheet()`，清理 timer、RAF、监听器、滚动锁和 DOM。
- 自动化在 320、360、375、390、393、414、430px 验证黑/绿 Toast 高度小于 80px、`pointer-events:none`、切页后托管节点为 0、动画资源计数为 0。

## 扫描范围

已扫描 `package.json`、HTML、全部 CSS/JavaScript、原生 ES Modules 构建方式、Hash 路由、状态容器、游戏数据、存档与迁移、PWA、Service Worker、Cloudflare Pages/Worker/D1 配置、后端、图片/队徽资源和全部测试。旧桌面样式已备份到 `legacy/`，没有删除既有职业规则后重做静态 Demo。

## 1. 手机端点击失效原因

- 已复现的主因是 Bottom Sheet 关闭动画期间仍存在覆盖全屏的透明背景层，且 `pointer-events:auto`，视觉上已关闭但底层按钮仍不可点击。
- 次要风险包括页面各自管理 fixed 层、滚动锁未幂等恢复、按钮异步期间没有可靠的单次触发保护，以及旧式根节点重建可能丢失监听器。
- 修复：Sheet 统一挂载 OverlayRoot，关闭开始立即取消 pointer 命中，动画后卸载；滚动锁引用统一清理并恢复焦点。DOM 按钮工具对 Promise 操作启用 single-flight，完成后恢复状态。
- 开发诊断已提供 `document.elementFromPoint()` 和 `event.composedPath()` 输出，可用查询参数开启。

## 2. 日期控件问题

- 原实现虽为 `input[type=date]`，但旧聚焦/滚动逻辑会在 iOS 原生选择器和视觉视口变化时重复滚动；样式还强制覆盖 WebKit 外观，增加不可操作风险。
- 修复：保留原生外观、16px 字号、`touch-action: manipulation` 和浅色系统主题；input 上没有透明覆盖层。
- 存档只保存 `YYYY-MM-DD`，中文另行显示为“2009年6月15日”，不调用 `new Date(value).toISOString()`，因此没有 UTC 偏移一天。
- 自动化已验证打开、输入日期、关闭、点击下一步、返回后仍保留、再次进入下一步，并检查没有残留 backdrop。

## 3. 横向溢出来源

- 来源：`body min-width:320px`、桌面多列作为默认布局、固定宽度工具栏、卡片子项缺少 `min-width:0`，以及用 `overflow:hidden/clip` 掩盖真实问题。
- 修复：默认 CSS 面向 320–430px 单列；仅使用 `min-width:480/768/1024/1440` 增强；正文允许检测真实溢出，不用缩放桌面布局。
- 六档视口根节点和正文的横向溢出实测均为 0。

## 4. 文字重叠与竖排来源

- 来源：窄列强塞双列指标、固定高度卡片、球队名/联赛名缺少自然换行、桌面结构在手机继续多列。
- 修复：手机默认全宽自适应卡片；关键网格使用 `minmax(0,1fr)`；正文自然换行，不用 `writing-mode` 或核心内容绝对定位。
- 自动化同时检查关键兄弟节点相交、极窄文本盒和非横向 writing mode，六档视口均通过。

## 5. fixed、absolute、z-index、overflow 问题

- `absolute` 只保留在球场位置点和装饰性元素，不负责正文布局。
- AppShell 统一为 Header / 单一 MainViewport / SpeedDock / BottomNavigation / OverlayRoot / ToastRoot；页面自身不创建 fixed 顶栏和底栏。
- Sheet、Toast、导航和更新提示具有明确层级；Toast 已移到顶部，避免覆盖底部主要操作。
- 游戏内正文只滚动 MainViewport；建档只滚动 setup-main；Sheet 只滚动 sheet-body。

## 6. 透明遮罩残留问题

- 这是实际复现缺陷，不是推测。旧遮罩关闭约 280ms 内仍能命中。
- 现在 `.is-closing` 立即禁用命中，关闭后节点卸载、body 解锁、焦点恢复。
- 球队详情和转会谈判弹层关闭后均使用 `elementFromPoint()` 验证底层可点击。

## 7. 深浅主题混用问题

- 旧页面存在深色背景、厚重阴影和局部变量，创建页与主应用视觉不一致。
- 生产入口统一为 iOS 浅色令牌：接近 `#F5F5F7` 的背景、白色卡片、接近 `#1D1D1F` 的主文字、轻阴影和统一圆角。
- 排行榜深色渐变卡已改为浅色表面；`color-scheme: light` 与 PWA 主题一致。

## 8. 页面滚动容器问题

- 旧结构中 body、页面、弹层和建档内容可能同时滚动，Safari 工具栏/键盘出现时产生滚动链。
- 当前 AppShell 采用 `100dvh` 和可视视口变量，MainViewport 为唯一正文滚动容器；安全区通过 `env(safe-area-inset-top/bottom)` 处理。
- 底部速度栏和五入口导航占据壳体网格行，不覆盖正文；建档操作栏同样位于壳体底部行。

## 9. Service Worker 旧缓存问题

- 旧缓存可能持续提供旧入口、旧 CSS 和旧模块，导致“源码已修但手机仍是旧版”。
- 当前缓存为 `green-pitch-v18.7.0-20260803-1`；激活时删除其他版本，导航采用网络优先并保留离线回退，预缓存清单包含新系统模块。
- 开发和端到端测试使用 `?no-sw=1` 排除缓存干扰，生产仍测试 Service Worker 版本和清单。

## 10. innerHTML 或整页重建问题

- 生产源码没有 `innerHTML` 写入路径；使用节点、DocumentFragment 和 `textContent`。
- 路由只替换 MainViewport 当前页，不重建 AppShell、OverlayRoot、ToastRoot 或全局存档状态。
- 已修复原生 `append(null)` 显示字面量 `null` 的历史问题。

## 11. 英文和内部变量泄漏

- 已扫描 `injuryRisk`、`coachTrust`、`relationship`、`matchRating`、`Season`、`Career`、`Settings`、`Continue`、`Back`、`Next` 等内部标记。
- 位置、状态、属性、计分、日期、金额、百分比和效果列表均通过中文格式化层；未知字段生产环境显示“其他数据”而不是英文 key。

## 12. `[object Object]`、`undefined`、`null`、`NaN`

- 统一格式化函数只输出有限数值和中文回退；对象通过专用 effect/stat formatter 展开，不直接字符串化。
- 六档真实浏览器流程未捕获四类异常文本或重大控制台错误。

## 13. 球队、赛程和事件重复问题

- 球队库为 500 家、ID 唯一，覆盖 37 国和 47 个联赛；真实身份字段与独立模拟评分通过 `dataSource` 区分。
- 赛程包含 8 类赛事，并根据梯队、国家、层级和资格生成；独立记录模拟升降级及洲际资格。
- 事件引擎有 1120 个活动模板、5600 个选择和 12800 种有效结果组合；记录最近 20 个标签、选择结构、冷却、唯一事件、剧情链、人物和对手。
- 防重复硬规则：连续三次不能同类；最近事件和相同选项结构降权；未完成剧情链优先；比赛行动组不在同场重复。
- 20 赛季实测 709 场、273 个不同对手、124 次事件、124 个唯一事件，事件 ID 重复率 0%。

## 14. 转会功能不完整问题

- 旧状态机已有部分接受/拒绝/谈判逻辑，但报价卡字段失控，谈判入口和窗口状态不清晰。
- 当前支持接受、拒绝、暂缓、工资谈判、角色谈判、要求租借、等待其他报价、主动转会意向和留队竞争。
- 报价按年龄、能力、潜力、表现、位置需求、预算、战术、合同、伤病和声望生成。
- 赛季结束不会自动修改 `clubId`；只在玩家显式接受报价或已存在的租借回归规则中改变俱乐部。

## 15. 世界排行榜和后端当前状态

- 审计基线没有可用世界榜后端。
- 当前已有本地存档榜、世界榜 API、D1 仓库、数据库迁移、运行会话、有序检查点、证据摘要、异常增量校验、服务器统一重算和只读已验证记录。
- Worker 路由 `/api/leaderboard*` 并通过 ASSETS 提供 SPA；缺少 D1 时明确返回 503，不伪造榜单。
- 安全边界：已实现服务器权威计分和基础反作弊；尚未实现服务器逐步确定性重放整局，不能虚报为完整反作弊。

## 其他仍未关闭的风险

- 压缩包没有 500 家球队的可分发授权队徽；当前统一盾牌占位是有意降级，不能宣称真实队徽完成。
- 桌面 Chromium 移动视口不能替代实体 iPhone/Android 的原生日期面板、软键盘和低端机性能验证。
- 1120 个活动事件仍共享 640 个基础标题，组合量和长期去重已达标，但优质剧情链仍需继续编辑扩充。
