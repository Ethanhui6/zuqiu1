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
  game('core-stability', '核心稳定', 'keep-zone', '身体', 'physical', '用方向键或拖动让平衡点留在安全区域内。', 6, 5),
  game('pressing-shadow', '压迫影子', 'pressing-shadow', '身体', 'physical', '连续点击对手的下一处持球点，完成三段压迫路线。', 12, 9),
  game('first-touch-gate', '第一脚闸门', 'first-touch-gate', '盘带', 'dribbling', '观察来球方向，在足球进入接球窗口时选择第一脚处理。', 8, 6),
  game('passing-angle', '传球角度', 'passing-angle', '传球', 'passing', '选择穿越防线的角度，再控制力度把球送到队友脚下。', 7, 6),
  game('crossing-zone', '传中落区', 'crossing-zone', '传球', 'passing', '拖动落点避开门将和后卫，把球送入目标区域。', 9, 7),
  game('finishing-combo', '终结组合', 'finishing-combo', '射门', 'shooting', '按顺序完成摆脱、调整和射门，最后点击球门目标。', 13, 9),
  game('weak-foot-volley', '逆足凌空', 'weak-foot-volley', '射门', 'shooting', '等待足球落入凌空窗口，用逆足完成一次触球。', 14, 9),
  game('rondo-scan', '抢圈扫描', 'rondo-scan', '传球', 'tactics', '记住队友亮起的顺序，在防守者合围前复现传球路线。', 5, 5),
  game('defensive-line', '防线协同', 'defensive-line', '防守', 'defending', '拖动防守核心，让整条防线与越位线保持一致。', 8, 7),
  game('interception-read', '拦截预判', 'interception-read', '防守', '读取持球队员身体朝向，预判下一条传球路线。', 7, 6),
  game('jockey-mirror', '侧身镜像', 'jockey-mirror', '防守', '镜像回应进攻者的连续变向，保持封堵距离。', 10, 7),
  game('clearance-height', '解围高度', 'clearance-height', '身体', 'physical', '选择解围方向并控制蓄力时间，把球送离危险区。', 11, 8),
  game('corner-run', '角球跑位', 'corner-run', '速度', 'speed', '在球场上画出绕开后卫的跑位路线并抵达目标点。', 10, 7),
  game('second-ball', '二点反应', 'second-ball', '射门', 'shooting', '观察足球反弹，连续命中三个变化中的二点落区。', 12, 8),
  game('counter-route', '反击路线', 'counter-route', '传球', 'tactics', '连续完成出球、推进和终结三阶段选择。', 8, 6),
  game('overlap-timing', '套边时机', 'overlap-timing', '速度', 'speed', '等待边后卫跑入空当，再点击送出套边信号。', 9, 7),
  game('keeper-double-save', '门将二连扑', 'keeper-double-save', '扑救', 'keeper', '根据两次射门提示连续选择扑救方向。', 13, 9),
  game('keeper-sweeper', '门将扫荡', 'keeper-sweeper', '出击', 'keeper', '判断直塞路线，并在足球进入出击窗口时拦截。', 12, 8),
  game('keeper-angle', '门将封角', 'keeper-angle', '站位', 'keeper', '拖动门将缩小射门角度，同时保持在球门与足球之间。', 8, 6),
  game('set-piece-routine', '定位球套路', 'set-piece-routine', '传球', 'setpiece', '记住三名队友的启动顺序，再完成整套定位球配合。', 7, 6)
]);

export const TRAINING_GAME_COUNT = TRAINING_GAMES.length;
export const trainingGameById = id => TRAINING_GAMES.find(item => item.id === id) || TRAINING_GAMES[0];
export const trainingGamesByPlan = plan => TRAINING_GAMES.filter(item => item.plan === plan);
