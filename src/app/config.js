export const APP_VERSION = '20.42.0';
export const SAVE_SCHEMA = 23;
export const SAVE_SLOTS = 3;

export const ATTR_KEYS = ['pac','sho','pas','dri','def','phy'];
export const ATTR_LABELS = {
  outfield:{pac:'速度',sho:'射门',pas:'传球',dri:'盘带',def:'防守',phy:'身体'},
  keeper:{pac:'扑救',sho:'手控',pas:'开球',dri:'反应',def:'站位',phy:'指挥'}
};

export const POSITION_CONFIG = {
  GK:{name:'门将',group:'keeper',x:50,y:91,roles:['门线反应型','现代清道夫门将','制空型门将','出球型门将','一对一专家','扫荡覆盖型门将'],focus:['pac','sho','pas','dri','phy'],weights:{pac:.25,sho:.25,pas:.18,dri:.14,def:.08,phy:.10}},
  LB:{name:'左后卫',group:'defense',x:18,y:73,roles:['防守型边后卫','进攻型边后卫','内收型边后卫','翼卫发动机','边路锁链'],focus:['pac','def','phy','pas'],weights:{pac:.21,sho:.03,pas:.16,dri:.12,def:.30,phy:.18}},
  CB:{name:'中后卫',group:'defense',x:42,y:76,roles:['出球中卫','制空中卫','上抢中卫','拖后中卫','全能防线核心'],focus:['def','phy','pas','pac'],weights:{pac:.08,sho:.02,pas:.13,dri:.06,def:.41,phy:.30}},
  RB:{name:'右后卫',group:'defense',x:82,y:73,roles:['防守型边后卫','进攻型边后卫','内收型边后卫','翼卫发动机','边路锁链'],focus:['pac','def','phy','pas'],weights:{pac:.21,sho:.03,pas:.16,dri:.12,def:.30,phy:.18}},
  CDM:{name:'后腰',group:'midfield',x:50,y:60,roles:['防守屏障','拖后组织者','抢球机器','节拍型后腰','全能六号位'],focus:['def','pas','phy','dri'],weights:{pac:.08,sho:.05,pas:.24,dri:.13,def:.29,phy:.21}},
  CM:{name:'中前卫',group:'midfield',x:35,y:47,roles:['全能往返中场','节拍器','推进型中场','全能中场','后插上得分手'],focus:['pas','dri','phy','def'],weights:{pac:.10,sho:.11,pas:.30,dri:.23,def:.11,phy:.15}},
  CAM:{name:'前腰',group:'creative',x:50,y:33,roles:['古典组织核心','前场创造者','影子核心','自由攻击手','高压前腰'],focus:['pas','dri','sho','pac'],weights:{pac:.11,sho:.16,pas:.29,dri:.30,def:.03,phy:.11}},
  LM:{name:'左前卫',group:'wide-midfield',x:20,y:47,roles:['边路组织者','回防型前卫','传中发动机','内收连接者'],focus:['pac','pas','dri','def'],weights:{pac:.20,sho:.08,pas:.25,dri:.22,def:.12,phy:.13}},
  RM:{name:'右前卫',group:'wide-midfield',x:80,y:47,roles:['边路组织者','回防型前卫','传中发动机','内收连接者'],focus:['pac','pas','dri','def'],weights:{pac:.20,sho:.08,pas:.25,dri:.22,def:.12,phy:.13}},
  LW:{name:'左边锋',group:'attack',x:20,y:28,roles:['内切边锋','爆发型边锋','边路组织者','宽度型边锋','自由前场攻击手'],focus:['pac','dri','sho','pas'],weights:{pac:.27,sho:.20,pas:.13,dri:.28,def:.02,phy:.10}},
  RW:{name:'右边锋',group:'attack',x:80,y:28,roles:['内切边锋','爆发型边锋','边路组织者','宽度型边锋','自由前场攻击手'],focus:['pac','dri','sho','pas'],weights:{pac:.27,sho:.20,pas:.13,dri:.28,def:.02,phy:.10}},
  SS:{name:'影锋',group:'attack',x:50,y:22,roles:['第二前锋','游弋型影锋','反击尖刀','连接型前锋','禁区幽灵'],focus:['sho','dri','pas','pac'],weights:{pac:.18,sho:.25,pas:.18,dri:.25,def:.02,phy:.12}},
  ST:{name:'中锋',group:'attack',x:50,y:11,roles:['禁区终结者','支点中锋','全能前锋','速度型前锋','伪九号','反越位终结者'],focus:['sho','pac','phy','dri'],weights:{pac:.19,sho:.31,pas:.08,dri:.18,def:.03,phy:.21}}
};

export const STYLE_BONUSES = Object.freeze({
  '扫荡覆盖型门将':{pac:3,pas:2,phy:1},
  '反越位终结者':{pac:2,sho:3,dri:1}
});

export const TALENT_RARITY = {
  common:{name:'普通',weight:70,color:'#8E8E93',potential:[72,82],growth:1},
  good:{name:'优秀',weight:22,color:'#34C759',potential:[80,88],growth:1.08},
  elite:{name:'精英',weight:7,color:'#8B5CF6',potential:[86,93],growth:1.16},
  legend:{name:'传奇',weight:1,color:'#C58A00',potential:[91,97],growth:1.24}
};

export const TRAINING_PLANS = [
  {id:'speed',name:'速度与爆发',icon:'⚡',focus:['pac'],intensity:3,fatigue:16,risk:11,desc:'提升启动和冲刺，适合边路与反击体系。'},
  {id:'shooting',name:'射门终结',icon:'◎',focus:['sho'],intensity:3,fatigue:14,risk:9,desc:'改善终结、远射和禁区内处理。'},
  {id:'passing',name:'传球组织',icon:'↗',focus:['pas'],intensity:2,fatigue:10,risk:4,desc:'提升传球选择、视野和节奏控制。'},
  {id:'dribbling',name:'盘带控球',icon:'◇',focus:['dri'],intensity:3,fatigue:14,risk:8,desc:'强化小空间处理与持球推进。'},
  {id:'defending',name:'防守意识',icon:'⬡',focus:['def'],intensity:2,fatigue:12,risk:6,desc:'提升站位、预判、抢断与压迫。'},
  {id:'physical',name:'身体对抗',icon:'✦',focus:['phy'],intensity:3,fatigue:18,risk:14,desc:'增强力量、耐力和比赛负荷承受能力。'},
  {id:'tactics',name:'战术课堂',icon:'▦',focus:['pas','def'],intensity:2,fatigue:6,risk:1,desc:'提高战术理解、位置适应和教练信任。'},
  {id:'weakFoot',name:'弱势脚专项',icon:'◐',focus:['sho','pas'],intensity:2,fatigue:9,risk:3,desc:'长期改善双脚处理，短期成长较慢。'},
  {id:'setPieces',name:'定位球训练',icon:'◉',focus:['sho','pas'],intensity:2,fatigue:8,risk:2,desc:'提升任意球、角球和点球处理。'},
  {id:'newPosition',name:'新位置开发',icon:'⌘',focus:['pas','def','dri'],intensity:2,fatigue:12,risk:5,desc:'拓展第二位置，增加球队战术需求。'},
  {id:'recovery',name:'恢复训练',icon:'♡',focus:['phy'],intensity:1,fatigue:-20,risk:0,desc:'恢复体能并降低伤病风险，属性收益有限。'},
  {id:'personal',name:'个人特训',icon:'♛',focus:['pac','sho','pas','dri','def','phy'],intensity:4,fatigue:22,risk:18,desc:'高投入高回报，需要优秀自律和医疗支持。'}
];



export const PACE_MODES = {
  immersive:{id:'immersive',name:'沉浸模式',seasonMinutes:'15—25分钟',seasonsPerRound:1,matchDetail:'完整比赛、事件和关系反馈',eventFrequency:'每1—2周',autoSimulation:'较少',pausePolicy:'重要节点逐一暂停',eventInterval:[1,2],ordinaryMatchMode:'timeline',visible:true},
  standard:{id:'standard',name:'标准模式',seasonMinutes:'8—12分钟',seasonsPerRound:2,matchDetail:'普通比赛快速结算，关键比赛保留',eventFrequency:'每2—3周',autoSimulation:'中等',pausePolicy:'重大事件、决赛和转会暂停',eventInterval:[2,3],ordinaryMatchMode:'timeline',visible:true},
  fast:{id:'fast',name:'极速模式',seasonMinutes:'4—6分钟',seasonsPerRound:3,matchDetail:'普通比赛和普通事件快速模拟',eventFrequency:'每4—5周',autoSimulation:'较高',pausePolicy:'只在职业转折节点暂停',eventInterval:[4,5],ordinaryMatchMode:'instant',visible:true},
  // Legacy saves and tests used this id. Keep it loadable, but never show it as a fourth choice.
  legend:{id:'legend',name:'极速模式',seasonMinutes:'4—6分钟',seasonsPerRound:3,matchDetail:'普通比赛和普通事件快速模拟',eventFrequency:'每6—8周',autoSimulation:'最高',pausePolicy:'只在职业转折节点暂停',eventInterval:[6,8],ordinaryMatchMode:'instant',visible:false,legacyAlias:'fast'}
};
export const CAREER_PACE_MODES = Object.freeze(Object.values(PACE_MODES).filter(mode=>mode.visible));

export const SPEED_LEVELS = [
  {id:'paused',label:'暂停',multiplier:0,delay:0},
  {id:'normal',label:'1倍',multiplier:1,delay:120},
  {id:'fast',label:'2倍',multiplier:2,delay:55},
  {id:'faster',label:'4倍',multiplier:4,delay:20},
  {id:'turbo',label:'极速推进',multiplier:8,delay:0}
];


export const EVENT_ANIMATION_SPEEDS = {
  standard:{id:'standard',label:'标准',factor:1},
  fast:{id:'fast',label:'快速',factor:.72},
  instant:{id:'instant',label:'简短',factor:.42}
};

export const AUTO_PAUSE_RULES = {
  transferOffer:'转会报价',contract:'合同谈判',firstStart:'首次首发',importantMatch:'重要比赛',final:'决赛',injury:'伤病',nationalCall:'国家队征召',coachTalk:'教练谈话',legendEvent:'传奇事件',careerTurn:'生涯重大转折'
};

export const ADVANCE_TARGETS = [
  {id:'nextEvent',label:'下一事件',icon:'✦'},
  {id:'nextMatch',label:'下一场比赛',icon:'⚽'},
  {id:'week',label:'推进一周',icon:'7'},
  {id:'month',label:'推进一个月',icon:'月'},
  {id:'halfSeason',label:'推进半赛季',icon:'½'},
  {id:'window',label:'推进至转会窗',icon:'↗'},
  {id:'season',label:'推进至赛季结束',icon:'◎'},
  {id:'milestone',label:'下一重大节点',icon:'◆'}
];

export const DEFAULT_AUTO_PAUSE = Object.fromEntries(Object.keys(AUTO_PAUSE_RULES).map(key=>[key,true]));
export const DEFAULT_STRATEGIES = {training:'balanced',match:'stable',career:'stay'};

export const NAV_ITEMS = [
  {id:'career',label:'生涯',icon:'◉'},
  {id:'match',label:'比赛',icon:'⚽'},
  {id:'training',label:'训练',icon:'⌁'},
  {id:'transfer',label:'转会',icon:'↗'},
  {id:'more',label:'更多',icon:'•••'}
];

export const THEME_MODES = ['system','dark','light'];

export const CAREER_SETTINGS = {
  startAge:[16,18],
  retirementAge:[34,40],
  monthsPerSeason:10,
  winterWindowMonth:5,
  summerWindowMonth:1,
  maxRerolls:3,
  achievementPageSize:36
};
