const STAT_LABELS = { speed: '速度', shooting: '射门', passing: '传球', dribbling: '盘带', defending: '防守', physical: '身体' };
const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const OUTFIELD_POSITIONS = ALL_POSITIONS.filter(position => position !== 'GK');

const profile = (stats, positions, bonus, weakness, body, behavior) => Object.freeze({
  stats: Object.freeze(stats), positions: Object.freeze(positions), bonus, weakness, body, behavior,
  keys: Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key]) => STAT_LABELS[key]).join('、')
});

export const PLAYER_STYLES = Object.freeze({
  '禁区终结者': profile({ speed: 61, shooting: 71, passing: 45, dribbling: 58, defending: 31, physical: 59 }, ['ST'], '射门与跑位', '背身组织有限', '爆发、冷静', '攻击六码区与后点'),
  '支点中锋': profile({ speed: 52, shooting: 64, passing: 55, dribbling: 50, defending: 34, physical: 72 }, ['ST'], '对抗与做球', '转身速度偏慢', '身高、力量', '背身接应并为队友创造空间'),
  '速度型边锋': profile({ speed: 72, shooting: 56, passing: 53, dribbling: 67, defending: 34, physical: 48 }, ['LW', 'RW'], '冲刺与一对一', '身体对抗较弱', '爆发、灵活', '拉开宽度后纵向突破'),
  '内切攻击手': profile({ speed: 66, shooting: 65, passing: 54, dribbling: 69, defending: 33, physical: 49 }, ['LW', 'RW', 'CAM'], '盘带与远射', '回防投入有限', '协调、惯用脚', '从边路内切进入射门区'),
  '组织核心': profile({ speed: 51, shooting: 51, passing: 72, dribbling: 65, defending: 44, physical: 48 }, ['CAM', 'CM', 'LW', 'RW'], '视野与传球', '无球冲刺一般', '视野、技术', '回撤接球并控制进攻节奏'),
  '全能中场': profile({ speed: 58, shooting: 56, passing: 64, dribbling: 59, defending: 58, physical: 62 }, ['CM', 'CDM'], '覆盖与攻守转换', '单项上限不突出', '耐力、均衡', '往返两个禁区并参与反抢'),
  '防守屏障': profile({ speed: 52, shooting: 37, passing: 58, dribbling: 46, defending: 71, physical: 68 }, ['CDM', 'CM'], '拦截与站位', '终结能力有限', '力量、耐力', '保护中卫并切断传球线路'),
  '出球后卫': profile({ speed: 54, shooting: 35, passing: 63, dribbling: 48, defending: 68, physical: 66 }, ['CB'], '防守与后场传导', '冒险传球可能失误', '身高、镇定', '持球吸引压迫后向前输送'),
  '盯人中卫': profile({ speed: 51, shooting: 30, passing: 43, dribbling: 35, defending: 74, physical: 72 }, ['CB'], '贴身盯防与限制核心', '离开防区后容易被拉动', '力量、专注', '跟随前锋并优先切断接球线路'),
  '清球型中卫': profile({ speed: 48, shooting: 28, passing: 38, dribbling: 30, defending: 76, physical: 78 }, ['CB'], '禁区保护与第一落点', '出球质量有限', '身高、对抗', '先化解危险，再把球送出高压区域'),
  '边中卫': profile({ speed: 61, shooting: 31, passing: 51, dribbling: 42, defending: 67, physical: 63 }, ['CB'], '覆盖肋部与边路补位', '中路空中对抗不占优', '速度、预判', '三中卫体系中拉到边侧处理空间'),
  '全能中卫': profile({ speed: 56, shooting: 30, passing: 57, dribbling: 39, defending: 71, physical: 70 }, ['CB'], '盯防、补位和出球均衡', '没有单一极强能力', '全面、镇定', '根据队友站位在上抢和拖后之间切换'),
  '进攻型边后卫': profile({ speed: 67, shooting: 42, passing: 60, dribbling: 58, defending: 61, physical: 59 }, ['LB', 'RB'], '套边与传中', '身后空间风险', '速度、耐力', '沿边线前插并快速回防'),
  '防守型边后卫': profile({ speed: 61, shooting: 31, passing: 50, dribbling: 42, defending: 72, physical: 62 }, ['LB', 'RB'], '一对一防守与回收位置', '进攻贡献较少', '速度、灵活', '优先封锁边路并保持四后卫距离'),
  '内收边后卫': profile({ speed: 59, shooting: 37, passing: 66, dribbling: 45, defending: 68, physical: 58 }, ['LB', 'RB'], '内收中场与后场出球', '边线宽度需要队友补足', '协调、视野', '持球时进入中路帮助建立人数优势'),
  '翼卫发动机': profile({ speed: 75, shooting: 43, passing: 62, dribbling: 64, defending: 55, physical: 66 }, ['LB', 'RB'], '上下往返提供整条边路宽度', '赛程密集时疲劳明显', '速度、耐力', '在边翼卫体系中反复完成前插和回收'),
  '边路锁链': profile({ speed: 64, shooting: 34, passing: 54, dribbling: 43, defending: 76, physical: 67 }, ['LB', 'RB'], '压制对方边锋并保护肋部', '进攻推进较慢', '防守、纪律', '贴住边路威胁并把对手引向外线'),
  '清道夫门将': profile({ speed: 55, shooting: 30, passing: 60, dribbling: 42, defending: 72, physical: 65 }, ['GK'], '扑救、站位与出球', '禁区外决策风险', '反应、身高', '主动出击并参与后场组织'),
  '传统门将': profile({ speed: 39, shooting: 24, passing: 43, dribbling: 22, defending: 74, physical: 68 }, ['GK'], '门线站位与基本扑救', '高位防线覆盖有限', '反应、站位', '留在门线附近专注完成扑救'),
  '出球门将': profile({ speed: 52, shooting: 25, passing: 72, dribbling: 38, defending: 66, physical: 59 }, ['GK'], '短传组织与长传转换', '脚下失误会直接暴露球门', '脚下、视野', '主动参与第一脚出球并寻找中场'),
  '扑救专家': profile({ speed: 47, shooting: 26, passing: 40, dribbling: 20, defending: 82, physical: 66 }, ['GK'], '反射扑救与近距离封堵', '出球和高空控制一般', '反应、爆发', '在近距离射门中依靠反应化解机会'),
  '高空控制者': profile({ speed: 43, shooting: 23, passing: 39, dribbling: 19, defending: 78, physical: 79 }, ['GK'], '高空球与禁区控制', '地面启动速度较慢', '身高、弹跳', '主动摘取传中并稳定禁区秩序'),
  '偷猎者': profile({ speed: 65, shooting: 76, passing: 35, dribbling: 52, defending: 28, physical: 51 }, ['ST'], '寻找防线盲区完成一击', '参与组织和回防有限', '跑位、冷静', '贴近最后一名后卫等待致命空当'),
  '禁区之狐': profile({ speed: 56, shooting: 78, passing: 42, dribbling: 55, defending: 29, physical: 58 }, ['ST'], '小范围处理与二点抢射', '离开禁区后影响下降', '射门、镇定', '用第一脚触球快速完成终结'),
  '全能前锋': profile({ speed: 64, shooting: 68, passing: 54, dribbling: 61, defending: 35, physical: 64 }, ['ST'], '推进、做球与终结兼顾', '专项上限不如纯角色', '耐力、全面', '根据比赛需要在锋线不同区域换位'),
  '逼抢型前锋': profile({ speed: 68, shooting: 57, passing: 43, dribbling: 49, defending: 43, physical: 66 }, ['ST'], '压迫后卫并制造失误', '高强度消耗体能', '爆发、耐力', '从第一道防线开始追赶持球人'),
  '回撤策应者': profile({ speed: 52, shooting: 55, passing: 67, dribbling: 61, defending: 34, physical: 57 }, ['ST'], '回撤接球连接前场', '禁区存在感会减少', '视野、传球', '拉出中卫后为边锋和中场送出直塞'),
  '传统边锋': profile({ speed: 73, shooting: 51, passing: 59, dribbling: 70, defending: 32, physical: 46 }, ['LW', 'RW'], '保持宽度并完成一对一', '内切终结稳定性一般', '速度、盘带', '贴边接球后下底传中或倒三角回做'),
  '速度突破手': profile({ speed: 79, shooting: 48, passing: 47, dribbling: 73, defending: 29, physical: 44 }, ['LW', 'RW'], '纵向冲刺攻击身后', '面对低位防守选择较少', '爆发、敏捷', '用连续加速拉开防线距离'),
  '宽位射手': profile({ speed: 65, shooting: 67, passing: 49, dribbling: 59, defending: 30, physical: 50 }, ['LW', 'RW'], '从宽位寻找远射角度', '回防和传中投入较少', '射门、技术', '在边线和肋部之间寻找左脚或右脚射门空间'),
  '边路组织者': profile({ speed: 57, shooting: 45, passing: 71, dribbling: 62, defending: 41, physical: 52 }, ['LW', 'RW'], '边路传球和节奏组织', '个人突破爆点较少', '传球、视野', '回撤接球后转移弱侧或送出传中'),
  '高压前腰': profile({ speed: 63, shooting: 55, passing: 61, dribbling: 64, defending: 48, physical: 57 }, ['CAM'], '前场压迫与二次进攻', '高位逼抢失败后身后空间较大', '耐力、决断', '从前腰位置触发第一时间反抢'),
  '自由攻击手': profile({ speed: 67, shooting: 63, passing: 58, dribbling: 72, defending: 30, physical: 48 }, ['CAM'], '自由换位和局部创造', '位置纪律与防守贡献较低', '盘带、想象力', '在肋部和禁区前沿寻找不固定接球点'),
  '影子前腰': profile({ speed: 60, shooting: 68, passing: 54, dribbling: 57, defending: 34, physical: 55 }, ['CAM'], '后插上得分和禁区占位', '需要前锋牵制防线', '跑位、射门', '从第二线突然进入禁区完成终结'),
  '节拍器': profile({ speed: 45, shooting: 39, passing: 76, dribbling: 58, defending: 52, physical: 55 }, ['CM', 'CDM'], '控制比赛节奏和出球方向', '推进速度和禁区威胁较低', '传球、判断', '用一脚触球调节球队攻防速度'),
  '前插中场': profile({ speed: 65, shooting: 62, passing: 57, dribbling: 60, defending: 46, physical: 67 }, ['CM'], '后排插上与第二落点', '身后空间需要队友保护', '耐力、跑位', '在前锋吸引防守时晚一步进入禁区'),
  '抢球机器': profile({ speed: 54, shooting: 33, passing: 49, dribbling: 41, defending: 78, physical: 75 }, ['CM', 'CDM'], '反抢、拦截和二次压迫', '犯规和牌面风险较高', '防守、体能', '不断追踪第二点并迅速夺回球权'),
  '远射专家': profile({ speed: 49, shooting: 72, passing: 61, dribbling: 55, defending: 38, physical: 54 }, ['CM', 'CDM', 'CAM'], '禁区外射门和二点跟进', '过度射门会损失进攻节奏', '射门、镇定', '在对手收缩时从弧顶寻找落点'),
  '拖后组织者': profile({ speed: 43, shooting: 32, passing: 74, dribbling: 44, defending: 64, physical: 62 }, ['CDM'], '保护防线并从后场发起进攻', '前场创造力有限', '视野、站位', '站在中卫身前用长短传切换方向'),
  '抢球后腰': profile({ speed: 55, shooting: 31, passing: 48, dribbling: 38, defending: 81, physical: 77 }, ['CDM'], '专注断球和拦截线路', '持球推进能力有限', '对抗、预判', '封堵中路并把球交给更有创造力的队友'),
  '半后卫': profile({ speed: 50, shooting: 29, passing: 67, dribbling: 37, defending: 71, physical: 69 }, ['CDM'], '回撤成为第三中卫', '球队进攻人数会减少', '防守、纪律', '边后卫前压时留在防线保护身后'),
  '覆盖型后腰': profile({ speed: 62, shooting: 35, passing: 52, dribbling: 45, defending: 69, physical: 74 }, ['CDM'], '覆盖横向空间和反击通道', '需要持续体能支持', '耐力、速度', '在两个禁区之间补位并延缓反击')
});

export const PLAYER_STYLE_DEFINITIONS = Object.freeze(Object.entries(PLAYER_STYLES).map(([id, definition]) => Object.freeze({ id, ...definition })));
export const SECONDARY_TRAITS = Object.freeze([
  { id: '稳定发挥', name: '稳定发挥', positions: ALL_POSITIONS },
  { id: '大场面球员', name: '大场面球员', positions: ALL_POSITIONS },
  { id: '逆足熟练', name: '逆足熟练', positions: ALL_POSITIONS },
  { id: '高强度压迫', name: '高强度压迫', positions: OUTFIELD_POSITIONS },
  { id: '定位球专家', name: '定位球专家', positions: ['ST', 'LW', 'RW', 'CAM', 'CM'] },
  { id: '领袖气质', name: '领袖气质', positions: ALL_POSITIONS },
  { id: '门将指挥', name: '门将指挥', positions: ['GK'] }
].map(Object.freeze));
