// Football Career Simulator V10.0 - Configuration & Constants

const GAME_CONFIG = {
  TITLE: "足球生涯模拟器 V10.0",
  VERSION: "10.0.0",
  START_YEAR: 2026,
  START_MONTH: 9,
  RETIRE_AGE: 38,
  
  POSITIONS: [
    { code: "ST", name: "中锋 (ST)", category: "FW", mainStats: ["PAC", "SHO", "PHY"] },
    { code: "RW", name: "右边锋 (RW)", category: "FW", mainStats: ["PAC", "DRI", "PAS"] },
    { code: "LW", name: "左边锋 (LW)", category: "FW", mainStats: ["PAC", "DRI", "SHO"] },
    { code: "CAM", name: "前腰 (CAM)", category: "MF", mainStats: ["PAS", "DRI", "SHO"] },
    { code: "CM", name: "中场 (CM)", category: "MF", mainStats: ["PAS", "DRI", "PHY"] },
    { code: "CDM", name: "后腰 (CDM)", category: "MF", mainStats: ["DEF", "PHY", "PAS"] },
    { code: "CB", name: "中卫 (CB)", category: "DF", mainStats: ["DEF", "PHY", "PAC"] },
    { code: "RB", name: "右后卫 (RB)", category: "DF", mainStats: ["PAC", "DEF", "PAS"] },
    { code: "LB", name: "左后卫 (LB)", category: "DF", mainStats: ["PAC", "DEF", "PAS"] }
  ],

  NATIONALITIES: [
    { code: "CN", name: "中国", flag: "🇨🇳", region: "ASIA" },
    { code: "ES", name: "西班牙", flag: "🇪🇸", region: "EURO" },
    { code: "ENG", name: "英格兰", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", region: "EURO" },
    { code: "BR", name: "巴西", flag: "🇧🇷", region: "SA" },
    { code: "AR", name: "阿根廷", flag: "🇦🇷", region: "SA" },
    { code: "FR", name: "法国", flag: "🇫🇷", region: "EURO" },
    { code: "DE", name: "德国", flag: "🇩🇪", region: "EURO" },
    { code: "JP", name: "日本", flag: "🇯🇵", region: "ASIA" },
    { code: "KR", name: "韩国", flag: "🇰🇷", region: "ASIA" },
    { code: "PT", name: "葡萄牙", flag: "🇵🇹", region: "EURO" }
  ],

  TEAM_TIERS: {
    S: { name: "S级 欧洲顶级豪门", minOvr: 85, baseWeeklyWage: 150000 },
    A: { name: "A级 欧洲强队 / 欧战常客", minOvr: 78, baseWeeklyWage: 80000 },
    B: { name: "B级 五大联赛中游 / 亚冠豪门", minOvr: 72, baseWeeklyWage: 35000 },
    C: { name: "C级 中超豪门 / 欧洲次级联赛", minOvr: 65, baseWeeklyWage: 12000 },
    D: { name: "D级 中超中下游 / 职业起步球队", minOvr: 55, baseWeeklyWage: 3000 }
  },

  SCOUT_TEMPLATES: [
    {
      name: "梅西型灵动边锋",
      condition: (p) => p.position.includes("W") && p.stats.DRI >= 75 && p.stats.PAS >= 70,
      traits: ["小范围超频盘带", "左脚精准内切射门", "手术刀式关键传球"],
      weakness: "高强度身体对抗不足，头球较弱"
    },
    {
      name: "哈兰德型冲击中锋",
      condition: (p) => p.position === "ST" && p.stats.PHY >= 75 && p.stats.SHO >= 75,
      traits: ["禁区绝对终结能力", "恐怖爆发力与跑位", "对抗中无解挂人推进"],
      weakness: "密集防守下阵地盘带一般"
    },
    {
      name: "德布劳内型全能中场",
      condition: (p) => p.category === "MF" && p.stats.PAS >= 78,
      traits: ["视野广阔贴地视线传球", "禁区外重炮远射", "掌控比赛进攻节奏"],
      weakness: "回追防守速度并非顶级"
    },
    {
      name: "范戴克型钢铁中卫",
      condition: (p) => p.category === "DF" && p.stats.DEF >= 75 && p.stats.PHY >= 75,
      traits: ["空中卡位绝对制空权", "一对一防守预判", "后场精准长传发起反击"],
      weakness: "面对超敏捷小个子突击手需提防"
    },
    {
      name: "姆巴佩型速度爆破手",
      condition: (p) => p.stats.PAC >= 82,
      traits: ["边路无解直线大趟爆破", "反击中超高成功率单刀", "吸引防守拉开空间"],
      weakness: "防守贡献较低，体力消耗较快"
    },
    {
      name: "新星基石型全能战士",
      condition: () => true,
      traits: ["基本功扎实均衡", "战术执行力高", "拥有极高成长上限"],
      weakness: "核心拿手绝技尚待进一步淬炼"
    }
  ]
};
