# V18.5 移动端优先架构重构报告

版本：`18.5.0`  
存档结构：`18`  
目标：先修复移动端架构、日期控件、点击、布局、主题和缓存，不在本版本增加排行榜、联网后端或新玩法。

## 1. 诊断结论

旧版主要问题来自三层叠加：桌面优先栅格被压缩到手机、多个固定层分别管理头部/速度/导航/弹窗、旧 CSS 对新组件保留网格列定义。实际审计中发现球队卡虽然视觉样式已经重写，但旧 `.club-card` 三列定义仍生效，导致内容宽度接近零并形成竖排。V18.5 已显式重置为移动端单列，并在 768px、1024px 后才扩展。

代码扫描没有发现核心业务依赖 `mouseenter`、`mouseleave`、`mousemove`、`wheel`、`touchend + click` 或拖拽。生产入口不导入旧 `ux-v18.2.css` 与 `pace-v18.3.css`，旧文件仅作为历史源码保留。

## 2. 全局 AppShell

统一结构：

```text
AppShell
├── AppHeader
├── PageContainer（唯一主要纵向滚动容器）
├── SpeedDock
└── MobileBottomNav
```

关键实现：

- `src/components/appShell.js`
- `src/styles/mobile-v18.5.css`
- `src/utils/viewport.js`

应用壳使用 `100vh` 回退和 `100dvh`，正文使用 `minmax(0, 1fr)`，`body.in-game` 禁止形成第二个滚动容器。导航只保留“生涯、比赛、训练、转会、更多”五项。

## 3. 移动端断点

默认样式面向 320–479px：单列、完整宽度卡片、44px 触控区。

- `min-width: 480px`：大屏手机，表单可在不拥挤时使用两列。
- `min-width: 768px`：平板，球队两列、比赛模式三列、完整创建步骤提示。
- `min-width: 1024px`：桌面，部分数据网格扩展。
- `min-width: 1440px`：限制最大内容宽度，避免过度拉伸。

没有使用整页 `transform: scale()`、`zoom`、1024px body 最小宽度或横向滚动保留桌面布局。

## 4. 日期控件与时区

生日字段改为原生 `input[type=date]`：

- `src/components/formControls.js`
- `src/pages/onboardingPage.js`

日期始终以 `YYYY-MM-DD` 纯字符串保存。年龄计算使用 `parsePureDate()` 分割年月日，不调用 `toISOString()`，避免 UTC 转换使生日偏移一天。中文显示单独格式化为“2008年12月31日”。

自动化验证完成：填写日期、触发 change、关闭原生控件后的下一步仍可点击，页面不存在残留 `.sheet-backdrop`。

## 5. 六步创建流程

创建球员改为六个单任务步骤：

1. 姓名、球衣显示名、出生日期
2. 国籍、身高、体重、惯用脚、号码
3. 球场位置
4. 球员风格
5. 天赋报告
6. 青年队与职业节奏

页面外层为三行网格：步骤头、可滚动内容、固定操作区。草稿写入 `sessionStorage`，返回上一步不丢失输入。输入字号不低于 16px，数值字段同时执行 HTML 约束和 JavaScript 范围校验。

## 6. 点击与遮挡修复

新增：

- `src/utils/scrollLock.js`
- `src/components/sheet.js`
- `src/utils/uiDiagnostics.js`

所有主要按钮最小 44×44px，使用 `touch-action: manipulation`。Bottom Sheet 关闭时会：

- 移除遮罩 DOM
- 恢复 body position 和 scrollY
- 恢复焦点
- 移除键盘与 VisualViewport 监听器
- 恢复背景点击

开发诊断支持输出点击目标、`composedPath()`、`elementFromPoint()` 和横向越界元素父级链。

## 7. z-index 层级

| 层级 | 数值 | 用途 |
|---|---:|---|
| 页面内容 | 0 | 普通内容 |
| 顶部栏 | 100 | AppHeader |
| 速度控制 | 180 | SpeedDock |
| 底部导航 | 200 | MobileBottomNav |
| 更新提示 | 700 | 版本更新横幅 |
| 遮罩 | 900 | Sheet backdrop |
| 弹窗 | 1000 | Sheet |
| Toast | 1100 | 中文提示 |
| 开发诊断 | 1200 | 仅 `?uiDebug=1` |

生产样式没有使用 `z-index: 999999`。

## 8. 安全区域与键盘

全局定义 `--safe-top/right/bottom/left`，顶部栏、正文、速度栏和底部导航均使用安全区域。`src/utils/viewport.js` 监听 VisualViewport，在键盘打开时添加 `is-keyboard-open`，隐藏游戏底部导航并更新动态视口变量，避免输入框与操作区被键盘压住。

## 9. 球队世界

- 手机单列，768px 两列，1024px 三列。
- 队徽使用独立 `ClubCrest` 组件，明确宽高、懒加载、异步解码。
- 加载失败只切换一次到本地统一盾牌，不会无限触发 `onerror`。
- 卡片只展示实力、青训、年轻机会、适配提示和位置需求，详细字段放入 Sheet。
- 搜索、联赛筛选和分页不会一次渲染 500 支球队。

本版本没有虚构“所有真实队徽均已下载”。现有数据中有本地资源路径的球队会显示对应资源，其余使用统一本地盾牌占位。

## 10. 转会页面

旧报价卡替换为：队徽/身份、2×2 指标、上下文、可折叠条款、操作区。接受、拒绝、暂缓、工资谈判、定位谈判、租借和解约金继续调用真实报价状态机。手机端按钮使用 2+1/自适应网格，不再把合同字段压进一行。

## 11. 比赛页面

双方球队使用 `minmax(0,1fr) auto minmax(0,1fr)`，队名最多两行。比赛呈现模式在手机端单列，互动选项整卡可点，提交后禁用列表防止重复结算。比赛结算按比分、评分、数据、时间线和下一步操作自然流动。

## 12. 数据渲染与中文化

`src/utils/format.js` 提供统一标签、数值、效果、球队、货币、日期和百分比格式化。对象不会直接进入 `textContent` 或模板字符串；非有限数字显示“—”。静态检查未发现指定的 `[object Object]`、`Loading`、`Continue`、`Settings` 等危险可见文字。

## 13. Service Worker

缓存名升级为 `green-pitch-v18.5.0-20260803-10`：

- 页面导航 network-first 且使用 `cache: no-store`
- 静态资源合理缓存
- 激活时删除旧版本缓存
- 使用 `skipWaiting()` 和 `clients.claim()`
- 开发环境主动注销 Service Worker，避免调试旧 CSS

## 14. 本轮明确未实施

由于当前阶段明确要求暂停新增排行榜、联网后端、动画和大型内容，本版本没有声称完成世界排行榜、Cloudflare D1/Workers 权威验证、22 种新动画或全量真实队徽资源。这些不是 V18.5 移动端修复包的验收范围。
