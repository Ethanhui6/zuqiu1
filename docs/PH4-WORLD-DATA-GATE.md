# PH4 真实球队、球员与赛事数据门禁

日期：2026-08-08

## 实现

- `worldRegistry` 在创建运行时注册表时为无显式 ID 的真实快照补稳定 `real-...` ID，生成球员继续使用独立的 `generated-...` ID。
- 同一姓名的无来源旧评级记录在存在 Wikidata 快照时被去重，优先保留有稳定来源 ID 的公开快照；原始 `data/players.json` 不被删除，仍保留 601 条输入记录。
- 新增 `auditWorldRegistry`，在注册表和生产构建中校验球队/联赛/球员/赛事引用、空身份、队徽、真实球员归属、运行阵容规模和关键位置。
- 每支运行球队生成 23—30 人一线队阵容；当前发布审计使用 30 人，544 支球队均覆盖 GK、CB、CM、ST。
- 构建在世界数据审计失败时直接终止，避免数量下降、重复归属或缺失关键字段进入发布包。

## 当前数据

- 真实俱乐部：544
- 联赛：50
- 原始球员记录：601
- 运行时唯一真实球员：598
- 真实快照覆盖球队：73
- 注册赛事：3 个扩展赛事，赛程系统同时提供国内联赛、国内杯赛、洲际比赛、国家队比赛、友谊赛和季前赛类型
- 奖杯资源：44

## 验收

| 检查 | 结果 |
| --- | --- |
| `node --test tests/phase4-data-integrity.test.mjs tests/world-registry.test.mjs tests/real-player-snapshot.test.mjs tests/phase17-real-player-snapshot.test.mjs tests/phase20-world-expansion.test.mjs tests/football-update.test.mjs` | PASS, 13/13 |
| `npm run typecheck` | PASS, 9/9 |
| `npm run build` | PASS, version 20.34.0 |
| `git diff --check` | PASS |

PH4 STATUS: PASS
