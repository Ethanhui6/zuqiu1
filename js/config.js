// Football Career Simulator V12.0 - Game Config, Seed RNG & Talent Perks

const GAME_CONFIG = {
  TITLE: "足球生涯模拟器 V12.0 Apple Music 拟态重构版",
  VERSION: "12.0.0",
  START_YEAR: 2026,
  START_MONTH: 9,
  RETIRE_AGE: 40,

  // Roguelike Starting Talent Perks (Gold / Purple / Blue)
  STARTING_TALENTS: [
    { id: "golden_leader", name: "🌟 天生领袖 (金色)", quality: "GOLD", desc: "更衣室威望+30，队长袖标首选，主帅信任度极易提升", effect: { coachTrust: 25, teammateRel: 25, fame: 20 } },
    { id: "golden_stamina", name: "⚡ 钢铁体能怪 (金色)", quality: "GOLD", desc: "体能消耗降低 50%，伤病概率极低，体能回复加快", effect: { PHY: 6, PAC: 4 } },
    { id: "golden_sniper", name: "🎯 禁区死角杀手 (金色)", quality: "GOLD", desc: "射门属性+8，关键绝杀概率翻倍，极易解锁金靴", effect: { SHO: 8 } },
    { id: "purple_social", name: "📱 社交牛逼症 (紫色)", quality: "PURPLE", desc: "初始粉丝+20000，商业代言提成+30%，声望获取快", effect: { fans: 20000, fame: 15, money: 50000 } },
    { id: "purple_dribbler", name: "🕺 桑巴桑巴盘带者 (紫色)", quality: "PURPLE", desc: "盘带属性+6，边路大趟过人成功率提升", effect: { DRI: 6, PAC: 2 } },
    { id: "blue_clean", name: "🛡️ 绝对清白正人君子 (蓝色)", quality: "BLUE", desc: "初始清白度 100%，免疫反腐阴阳合同舆论冲击", effect: { innocence: 20 } }
  ],

  // Birthplaces with explicit trait disclosures
  BIRTHPLACES: [
    { code: "GD", name: "广东", flag: "🏮", trait: "小灵快/家族商业基因", bonus: { DRI: 4, PAS: 2, money: 100000 }, desc: "初始盘带+4，资金+10万，受南派足球灵动影响" },
    { code: "SD", name: "山东", flag: "🏔️", trait: "高大体能/顽强作风", bonus: { PHY: 4, DEF: 2, coachTrust: 15 }, desc: "初始身体+4，信任度+15%，对抗与制空权强" },
    { code: "LN", name: "辽宁", flag: "⚽", trait: "爆发速度/大心脏", bonus: { PAC: 4, SHO: 2, fame: 10 }, desc: "初始速度+4，射门+2，声望+10，大赛爆发" },
    { code: "BJ", name: "北京", flag: "🏛️", trait: "首都曝光/社交焦点", bonus: { fame: 20, fans: 15000, money: 50000 }, desc: "初始声望+20，粉丝+15000，自带高社交热度" },
    { code: "SH", name: "上海", flag: "🏙️", trait: "国际化视野/高战术素养", bonus: { PAS: 3, DRI: 3, scoutInterest: 20 }, desc: "初始传球+3，豪门关注度+20%，战术智商高" }
  ],

  POSITIONS: [
    { code: "ST", name: "中锋 (ST)", category: "FW", impact: "高进球率与金靴奖，身价受进球直接驱动" },
    { code: "RW", name: "右边锋 (RW)", category: "FW", impact: "高突破率与助攻进球兼备，吸引豪门关注" },
    { code: "LW", name: "左边锋 (LW)", category: "FW", impact: "爆破内切得分能力，高商业代言价值" },
    { code: "CAM", name: "前腰 (CAM)", category: "MF", impact: "掌控进攻节拍与关键穿针引线助攻" },
    { code: "CM", name: "中场 (CM)", category: "MF", impact: "全场攻防枢纽，队长袖标首选位置" },
    { code: "CDM", name: "后腰 (CDM)", category: "MF", impact: "防线屏障与拦截抢断，教练信任度极高" },
    { code: "CB", name: "中卫 (CB)", category: "DF", impact: "防空卡位制空权，降低失球数，不易受伤" },
    { code: "RB", name: "右后卫 (RB)", category: "DF", impact: "边路攻防套边插上，体能消耗较大" },
    { code: "LB", name: "左后卫 (LB)", category: "DF", impact: "左路走廊助攻，战术稀缺位置" }
  ],

  PACING_MODES: {
    ANNUAL: { code: "ANNUAL", name: "逐年模式", desc: "仅在关键转会与大赛年决策，快速完结一生" },
    STANDARD: { code: "STANDARD", name: "标准模式", desc: "逐月推进，深度参与教练沟通、训练与离场生活" },
    CINEMA: { code: "CINEMA", name: "电影模式", desc: "全自动 AI 决策演播，如电影般观赏职业生涯" }
  },

  DIFFICULTY_MODES: {
    ROOKIE: { code: "ROOKIE", name: "新星模式 (简单)", desc: "伤病概率极低，顺风成长" },
    PRO: { code: "PRO", name: "职业模式 (标准)", desc: "逼真足球生态，平衡的成长与伤病挑战" },
    HARDCORE: { code: "HARDCORE", name: "残酷模式 (硬核)", desc: "严格反腐查税，高伤病与挑剔舆论" }
  },

  SECOND_LIFE_CAREERS: [
    { id: "manager", name: "👔 豪门主教练 / 国家队掌门人", desc: "开启教练生涯，带领国足或豪门征战世界杯与欧冠" },
    { id: "pundit", name: "🎙️ 顶级体育电视台签约解说员", desc: "创办个人足球自媒体与节目，点评足坛风云" },
    { id: "owner", name: "💼 足球俱乐部主席 / 体坛投资人", desc: "收购职业球队，作为老板打造全球豪门" },
    { id: "youth_director", name: "🌱 全国青训青训总监", desc: "深耕青训基地，培养下一代中国球星" }
  ]
};

// Seed PRNG Engine
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
