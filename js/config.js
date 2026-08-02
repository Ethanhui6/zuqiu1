// Football Career Simulator V11.0 - Game Config & Constants

const GAME_CONFIG = {
  TITLE: "足球生涯模拟器 V11.0 终极进化版",
  VERSION: "11.0.0",
  START_YEAR: 2026,
  START_MONTH: 9,
  RETIRE_AGE: 40,

  // Mode Selection: Pacing vs Difficulty (Decoupled)
  PACING_MODES: {
    ANNUAL: { code: "ANNUAL", name: "逐年模式 (年进度)", desc: "仅在关键转会与大赛年决策，快速看完完整一生", stepMonths: 12 },
    STANDARD: { code: "STANDARD", name: "标准模式 (月进度)", desc: "逐月推进，深度参与教练沟通、训练与离场生活", stepMonths: 1 },
    CINEMA: { code: "CINEMA", name: "电影模式 (全自动)", desc: " AI 智能决策，如电影般顺畅观赏传奇生涯", stepMonths: 1, auto: true }
  },

  DIFFICULTY_MODES: {
    ROOKIE: { code: "ROOKIE", name: "新星模式 (简单)", desc: "伤病概率极低，社交好感度加成，顺风成长", injuryRate: 0.05, luckBonus: 1.2 },
    PRO: { code: "PRO", name: "职业模式 (标准)", desc: "逼真足球生态，平衡的成长、伤病与转会挑战", injuryRate: 0.12, luckBonus: 1.0 },
    HARDCORE: { code: "HARDCORE", name: "残酷模式 (硬核)", desc: "严格的反腐查税、高伤病风险与挑剔的媒体舆论", injuryRate: 0.22, luckBonus: 0.85 }
  },

  // Birthplaces with Explicit Traits & Backgrounds
  BIRTHPLACES: [
    { code: "GD", name: "广东", flag: "🏮", trait: "脚下小灵快/家庭经商背景", bonus: { DRI: 4, PAS: 2, money: 100000 }, desc: "初始技术盘带+4，资金+10万，受南派足球灵动风格熏陶" },
    { code: "SD", name: "山东", flag: "🏔️", trait: "身材高大/体能强悍/青训底蕴", bonus: { PHY: 4, DEF: 2, coachTrust: 15 }, desc: "初始身体对抗+4，主帅信任+15%，作风顽强敢打敢拼" },
    { code: "LN", name: "辽宁", flag: "⚽", trait: "辽足老工业基底/爆发力出众", bonus: { PAC: 4, SHO: 2, fame: 10 }, desc: "初始速度+4，射门+2，声望+10，天生大场面大心脏" },
    { code: "BJ", name: "北京", flag: "🏛️", trait: "首都圈资源/社交与舆论名气", bonus: { fame: 20, fans: 15000, money: 50000 }, desc: "初始声望+20，粉丝+15000，天然自带极高社交关注度" },
    { code: "SH", name: "上海", flag: "🏙️", trait: "国际化视野/高起点战术素养", bonus: { PAS: 3, DRI: 3, scoutInterest: 20 }, desc: "初始传球+3，豪门球探关注度+20%，战术意识出众" }
  ],

  POSITIONS: [
    { code: "ST", name: "中锋 (ST)", category: "FW", mainStats: ["PAC", "SHO", "PHY"], impact: "极高进球率与金靴奖提成，身价受进球数直接驱动" },
    { code: "RW", name: "右边锋 (RW)", category: "FW", mainStats: ["PAC", "DRI", "PAS"], impact: "高突破率与助攻进球兼备，极易吸引豪门球探大合同" },
    { code: "LW", name: "左边锋 (LW)", category: "FW", mainStats: ["PAC", "DRI", "SHO"], impact: "爆破内切得分能力，高赞助商商业价值" },
    { code: "CAM", name: "前腰 (CAM)", category: "MF", mainStats: ["PAS", "DRI", "SHO"], impact: "掌控球队进攻节拍与手术刀助攻，核心战术地位" },
    { code: "CM", name: "中场 (CM)", category: "MF", mainStats: ["PAS", "DRI", "PHY"], impact: "全场攻防转换枢纽，球队队长袖标首选位置" },
    { code: "CDM", name: "后腰 (CDM)", category: "MF", mainStats: ["DEF", "PHY", "PAS"], impact: "拦截抢断防线屏障，教练信任度提升更快" },
    { code: "CB", name: "中卫 (CB)", category: "DF", mainStats: ["DEF", "PHY", "PAC"], impact: "防空卡位制空权，降低失球数，不易受伤" },
    { code: "RB", name: "右后卫 (RB)", category: "DF", mainStats: ["PAC", "DEF", "PAS"], impact: "边路攻防套边插上，体能消耗较大" },
    { code: "LB", name: "左后卫 (LB)", category: "DF", mainStats: ["PAC", "DEF", "PAS"], impact: "左路走廊助攻，战术稀缺位置" }
  ],

  // Properties & Lifestyle Upgrade Tiers
  PROPERTIES: [
    { id: "flat", name: "市区青年公寓", cost: 0, icon: "🏢", bonus: "基本住所，生活成本较低", prestige: 5 },
    { id: "condo", name: "江景高档大平层", cost: 500000, icon: "🏙️", bonus: "恢复体能更快，粉丝 +10000", prestige: 25 },
    { id: "villa", name: "郊区独栋别墅 (含私人球场)", cost: 2500000, icon: "🏡", bonus: "训练效率 +15%，社交名气 +50", prestige: 60 },
    { id: "manor", name: "顶奢海景庄园 (含停机坪/私人健身房)", cost: 10000000, icon: "🏰", bonus: "豪门关注度 +30%，生活极奢", prestige: 100 }
  ],

  VEHICLES: [
    { id: "sedan", name: "家用实用轿车", cost: 30000, icon: "🚗" },
    { id: "sports", name: "保时捷 911 跑车", cost: 200000, icon: "🏎️" },
    { id: "supercar", name: "兰博基尼 / 法拉利旗舰超跑", cost: 800000, icon: "🏎️💨" }
  ]
};
