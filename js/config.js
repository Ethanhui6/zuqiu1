// Football Career Simulator - Config & Scout Templates

const GAME_CONFIG = {
  TITLE: "足球生涯模拟器 重构版",
  VERSION: "14.2.0",
  START_YEAR: 2026,
  START_MONTH: 9,
  RETIRE_AGE: 40,

  EXP_PER_STAT_LEVEL: 100,

  SCOUT_TEMPLATES: [
    {
      name: "梅西型灵动边锋",
      condition: (p) => p.position.includes("W") && p.stats.DRI >= 70 && p.stats.PAS >= 65,
      traits: ["小范围超频盘带", "左脚精准内切弧线球", "手术刀式关键传球"],
      weakness: "高强度对抗能力稍逊，头球争顶偏弱"
    },
    {
      name: "哈兰德型冲击中锋",
      condition: (p) => p.position === "ST" && p.stats.PHY >= 72 && p.stats.SHO >= 72,
      traits: ["禁区绝对终结能力", "恐怖爆发力与跑位", "对抗中挂人推进破门"],
      weakness: "密集防守下阵地盘带较一般"
    },
    {
      name: "德布劳内型全能中场",
      condition: (p) => p.category === "MF" && p.stats.PAS >= 75,
      traits: ["视野广阔贴地视线传球", "禁区外重炮远射", "掌控比赛进攻节奏"],
      weakness: "回追防守速度并非顶级"
    },
    {
      name: "范戴克型钢铁中卫",
      condition: (p) => p.category === "DF" && p.stats.DEF >= 72 && p.stats.PHY >= 72,
      traits: ["空中卡位绝对制空权", "一对一防守预判", "后场精准长传发起反击"],
      weakness: "面对超敏捷小个子突击手需提防"
    },
    {
      name: "姆巴佩型速度爆破手",
      condition: (p) => p.stats.PAC >= 80,
      traits: ["边路无解直线大趟爆破", "反击中超高成功率单刀", "吸引防守拉开空间"],
      weakness: "防守贡献较低，体能消耗较快"
    },
    {
      name: "新星基石型全能战士",
      condition: () => true,
      traits: ["基本功扎实均衡", "战术执行力高", "拥有极高成长上限"],
      weakness: "核心拿手绝技尚待进一步淬炼"
    }
  ],

  BIRTHPLACES: [
    { code: "GD", name: "广东", flag: "🏮", trait: "小灵快/家族商业基因", bonus: { DRI: 4, PAS: 2, money: 100000 }, desc: "盘带+4，资金+10万" },
    { code: "SD", name: "山东", flag: "🏔️", trait: "高大体能/顽强作风", bonus: { PHY: 4, DEF: 2, coachTrust: 15 }, desc: "身体+4，主帅信任+15%" },
    { code: "LN", name: "辽宁", flag: "⚽", trait: "爆发速度/大心脏", bonus: { PAC: 4, SHO: 2, fame: 10 }, desc: "速度+4，射门+2，声望+10" },
    { code: "BJ", name: "北京", flag: "🏛️", trait: "首都曝光/社交焦点", bonus: { fame: 20, fans: 15000, money: 50000 }, desc: "声望+20，粉丝+15000" },
    { code: "SH", name: "上海", flag: "🏙️", trait: "国际视野/高战术素养", bonus: { PAS: 3, DRI: 3, scoutInterest: 20 }, desc: "传球+3，豪门关注+20%" }
  ],

  POSITIONS: [
    { code: "ST", name: "中锋 (ST)", category: "FW", desc: "高进球率与金靴奖，身价受进球驱动" },
    { code: "RW", name: "右边锋 (RW)", category: "FW", desc: "高突破率与助攻，易吸引豪门球探" },
    { code: "LW", name: "左边锋 (LW)", category: "FW", desc: "爆破内切得分，高商业价值" },
    { code: "CAM", name: "前腰 (CAM)", category: "MF", desc: "掌控进攻节拍与关键穿针引线助攻" },
    { code: "CM", name: "中场 (CM)", category: "MF", desc: "攻防转换枢纽，队长首选位置" },
    { code: "CDM", name: "后腰 (CDM)", category: "MF", desc: "防线屏障与拦截抢断" },
    { code: "CB", name: "中卫 (CB)", category: "DF", desc: "防空卡位制空权，降低失球数" },
    { code: "RB", name: "右后卫 (RB)", category: "DF", desc: "边路攻防套边插上" },
    { code: "LB", name: "左后卫 (LB)", category: "DF", desc: "左路走廊助攻" }
  ],

  PROPERTIES: [
    { id: "flat", name: "市区青年公寓", cost: 0, icon: "🏢", bonus: "基本住所", prestige: 5 },
    { id: "condo", name: "江景高档大平层", cost: 500000, icon: "🏙️", bonus: "体能恢复更快，粉丝+10000", prestige: 25 },
    { id: "villa", name: "郊区独栋别墅", cost: 2500000, icon: "🏡", bonus: "训练效率+15%，声望+50", prestige: 60 },
    { id: "manor", name: "顶奢海景庄园", cost: 10000000, icon: "🏰", bonus: "豪门关注+30%，极奢生活", prestige: 100 }
  ],

  VEHICLES: [
    { id: "sedan", name: "家用实用轿车", cost: 30000, icon: "🚗" },
    { id: "sports", name: "保时捷 911 跑车", cost: 200000, icon: "🏎️" },
    { id: "supercar", name: "法拉利旗舰超跑", cost: 800000, icon: "🏎️💨" }
  ],

  SECOND_LIFE_CAREERS: [
    { id: "manager", name: "👔 豪门主教练 / 国家队掌门人", desc: "执教球队征战世界杯与欧冠" },
    { id: "pundit", name: "🎙️ 顶级电视台签约解说员", desc: "自媒体节目，点评足坛风云" },
    { id: "owner", name: "💼 俱乐部主席 / 体坛投资人", desc: "收购球队，打造全球豪门" },
    { id: "youth_director", name: "🌱 全国青训总监", desc: "深耕基地，培养下一代球星" }
  ]
};

class SeedRNG {
  constructor(seed = "20260801") {
    this.seed = this.hashSeed(seed);
  }
  hashSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 123456789;
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}
