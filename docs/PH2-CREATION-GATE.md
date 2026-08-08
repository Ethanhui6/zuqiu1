# PH2 创建球员门禁

日期：2026-08-08

## 实现

- 向导固定为五步：职业速度、身份、身体/位置/风格、球员数据、球队邀请。
- 首步提供沉浸、标准、极速三档节奏，并将所选模式写入创建草稿，签约时沿用现有存档节奏字段。
- 身份页保留国家、出生地、姓名、球衣名和号码；身体页提供160—205厘米数字输入与滑块、体重、体型、惯用脚。
- 位置和风格合并在同一页，实时显示位置适配度、推荐身高、推荐体型、核心属性和发展路线。
- 现有十次数据抽取、姓名/国籍锁定、真实球队邀请和存档迁移逻辑继续复用。
- 创建草稿保存 `wizardStep` 与 `wizardDraft`，刷新后恢复当前步骤和已填写内容；完成签约后清除草稿。

## 验收

| 检查 | 结果 |
| --- | --- |
| `node --test tests/phase2-player-creation.test.mjs tests/player-creation-flow.test.mjs` | PASS, 5/5 |
| `node tests/phase2-layout-gate.mjs` | PASS, 320/375/390/393/414/428/430 |
| `npm run build` | PASS, version 20.32.0 |
| `node --check src/pages/createPlayer.js` | PASS |
| `git diff --check` | PASS |

PH2 STATUS: PASS
