const game = (id, name, mechanic, target, plan, instruction, risk, fatigue) => Object.freeze({ id, name, mechanic, target, plan, instruction, risk, fatigue });

export const TRAINING_GAMES = Object.freeze([
  game('sprint-start', '冲刺起跑', 'reaction', '速度', 'speed', '等候发令灯亮起，第一时间点击起跑。', 12, 7),
  game('shuttle-run', '折返跑', 'rhythm', '身体', 'physical', '按左右节奏完成四次折返，错拍会损失成绩。', 16, 10),
  game('shooting-target', '射门靶区', 'aim', '射门', 'shooting', '移动准星锁定目标区域，再点击射门。', 10, 8),
  game('penalty-kick', '点球训练', 'three-choice', '射门', 'shooting', '分别选择方向、力度和时机，完成一次点球。', 14, 8),
  game('free-kick', '任意球训练', 'curve', '射门', 'setpiece', '拖动弧线、角度和力度，绕过人墙命中目标。', 9, 7),
  game('slalom-dribble', '盘带绕桩', 'dodge', '盘带', 'dribbling', '用左右操作避开移动障碍，保持球在脚下。', 13, 9),
  game('passing-target', '传球靶点', 'moving-target', '传球', 'passing', '依次点击三个移动靶点，传球线路越准越高分。', 6, 6),
  game('through-ball', '直塞训练', 'timing-window', '传球', 'passing', '在越位线与跑位重合时点击直塞。', 8, 6),
  game('header', '头球训练', 'aerial', '身体', 'aerial', '判断落点并在合适高度点击起跳。', 12, 8),
  game('tackle-window', '抢断训练', 'contact-window', '防守', 'defending', '只在触球窗口出现时出脚，过早会犯规。', 8, 6),
  game('body-duel', '身体对抗', 'balance', '身体', 'physical', '拖动指针保持在稳定区域，撑过一次对抗。', 15, 10),
  game('reaction-lights', '反应灯训练', 'lights', '速度', 'speed', '快速点击随机亮起的灯，连续命中会形成连击。', 7, 5),
  game('visual-scan', '视觉扫描', 'memory', '传球', 'passing', '记住队友亮起的位置，再按顺序完成传球。', 5, 5),
  game('tactical-choice', '战术判断', 'tactical', '战术理解', 'tactics', '阅读比分、时间和空当，选择最合理的跑位。', 4, 4),
  game('keeper-save', '门将扑救', 'swipe', '扑救', 'keeper', '根据来球方向滑动手套，完成侧扑。', 11, 8),
  game('keeper-charge', '门将出击', 'hold-release', '出击', 'keeper', '按住出击并在合适距离松开，避免冲过落点。', 13, 8),
  game('keeper-high-ball', '门将高空球', 'drag-target', '制空', 'keeper', '把门将拖到落点，再点击起跳摘球。', 10, 7),
  game('keeper-distribution', '门将开球', 'power-target', '开球', 'keeper', '选择传球目标并控制力度，把球送到队友脚下。', 5, 5),
  game('rehab-rhythm', '康复训练', 'safe-rhythm', '恢复', 'recovery', '保持舒缓节奏，过量操作会增加复发风险。', 2, -9),
  game('core-stability', '核心稳定', 'keep-zone', '身体', 'physical', '用方向键或拖动让平衡点留在安全区域内。', 6, 5)
]);

export const TRAINING_GAME_COUNT = TRAINING_GAMES.length;
export const trainingGameById = id => TRAINING_GAMES.find(item => item.id === id) || TRAINING_GAMES[0];
export const trainingGamesByPlan = plan => TRAINING_GAMES.filter(item => item.plan === plan);

