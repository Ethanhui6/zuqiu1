# 绿茵浮沉 V18.1 审计修复交付报告

## 版本

- 游戏版本：18.1.0
- 存档Schema：18
- 数据构建：2026-08-03.4
- Service Worker缓存：`green-pitch-v18.1.0-20260803-4`

## 本轮实际修复重点

- 把设施展示卡接入真实状态系统，并补充成功、失败、费用和阶段冷却。
- 将Store更新改为同步保存，消除点击后立刻刷新导致结果丢失的窗口。
- 重写转会报价状态机，加入过期、暂缓上限、谈判轮次、留队锁定和报价历史。
- 修复比赛零封分支未声明变量，并改进比分对应时间线。
- 扩大事件记忆，记录标题和选择结构，避免近期重复。
- 修复33岁以后“生涯末期”事件池耗尽，兼容旧事件阶段标签并允许合理的巅峰期老将剧情。
- 重写存档校验、损坏恢复、无签名旧档迁移和导入边界。
- 修复同页面刷新滚动位置重置；训练选择改为局部更新。
- 清理主要界面的未翻译英文和旧标签。
- 版本统一升级到18.1.0并刷新Service Worker缓存。

## 主要修改文件

- `src/app/store.js`
- `src/app/router.js`
- `src/services/storage/migrations.js`
- `src/services/storage/saveManager.js`
- `src/systems/facility/facilitySystem.js`
- `src/systems/event/eventEngine.js`
- `src/systems/match/matchSystem.js`
- `src/systems/transfer/transferSystem.js`
- `src/systems/career/careerSystem.js`
- `src/systems/career/cycleSystem.js`
- `src/pages/careerPage.js`
- `src/pages/transferPage.js`
- `src/pages/trainingPage.js`
- `src/pages/profilePage.js`
- `src/pages/worldPage.js`
- `src/main.js`
- `src/styles/pages.css`
- `sw.js`
- `tests/runtime-audit.mjs`
- `docs/V18_RUNTIME_AUDIT.md`

## 实际测试

- 基础系统测试：通过
- 24阶段连续生涯：通过
- 180阶段完整职业生涯：通过，覆盖生涯末期事件与退休结局
- 32项验收测试：通过
- 99项运行审计：通过
- 320个文件静态检查：通过
- 46个JavaScript文件导入与语法检查：通过
- 关键源码未发现 `Math.random()`

详细结果见 `docs/V18_TEST_REPORT.md`。

## 数据说明

- 500家俱乐部名称记录：500个唯一ID与中文名称。
- 500条模板记录：500个唯一ID、100个不同模板名称、每个主要位置50条变体。
- 330项成就：50项隐藏成就。
- 1,200条事件记录：719个不同标题，6,000个候选方案，3,215条不同选择文字。
- 评级和现实无法确认字段均明确标注为模拟值。

## 未完成及限制

没有声称已完成官方实时数据库、完整11对11引擎或真实设备浏览器回归。详见 `docs/V18_KNOWN_LIMITATIONS.md`。

## 部署

解压部署包并覆盖原GitHub仓库根目录，保留隐藏的 `.git` 文件夹；提交并推送到原分支，由原Cloudflare Pages项目自动部署。不要新建Pages项目。
