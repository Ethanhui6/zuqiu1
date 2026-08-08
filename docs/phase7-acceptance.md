# PH7 验收记录

日期：2026-08-08

## 交付

- 联赛赛程改为当前联赛球队的主客场双循环；无完整联赛样本时使用真实球队兜底。
- 赛季最多生成 55 场，包含国内杯赛和洲际赛事扩展，赛事日期、轮次、主客场和关键节点同步。
- 未进比赛名单的球员自动结算球队赛果，不进入互动比赛；替补登场记录 `starts: false`，替补未登场只记录简洁赛果。
- 比赛中心首屏保留双方真实队徽、排名/实力、阵型和玩家名单状态，完整阵容放入二级抽屉。
- 版本更新为 `20.37.0`。

## 验收

- `tests/phase7-match-flow.test.mjs`：5/5 PASS（含 PH2、PH4 回归）。
- `tests/phase3-match-hub-gate.mjs`：PASS，10 个场景、390/320/375/393/414/428/430/768/1280 宽度覆盖，3 种名单状态、6 种阵型。
- `npm run typecheck`：9/9 PASS。
- 语法检查：`src/app.js`、`src/core/simulationController.js` PASS。
- PH7 STATUS: PASS
