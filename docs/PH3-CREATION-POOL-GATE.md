# PH3 比赛风格、数据抽取与球队邀请门禁

日期：2026-08-08

## 实现

- 创建页的风格数据源扩展为位置化真实足球角色，沿用现有 `profile` 结构记录核心属性、身体建议、场上行为、优势和风险。
- ST、边路、CAM、中场、后腰、后卫和 GK 均有至少五个可筛选风格；位置切换会立即重置为合法风格并更新适配度。
- 球员数据继续由确定性种子抽取，属性和潜力均为整数；原有 10 次上限、姓名/国籍锁定和刷新持久化继续有效。
- 首支球队继续使用真实俱乐部和队徽，并按位置需求、潜力、能力和联赛来源生成至少三张差异化邀请。

## 验收

| 检查 | 结果 |
| --- | --- |
| `node --test tests/phase3-creation-pool.test.mjs tests/play-style-pool.test.mjs tests/position-resolver.test.mjs tests/player-creation-flow.test.mjs` | PASS, 8/8 |
| 位置化风格数量 | ST 7, LW 7, RW 7, CAM 6, CM 7, CDM 9, CB 5, LB 5, RB 5, GK 5 |
| `node --check src/data/playerProfiles.js` | PASS |
| `git diff --check` | PASS |

PH3 STATUS: PASS
