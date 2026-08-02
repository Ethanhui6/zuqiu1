// Football Career Simulator V10.0 - Real Teams Database

const REAL_TEAMS = [
  // S Tier - Top European Giants
  { id: "real_madrid", name: "皇家马德里", country: "🇪🇸 西班牙", tier: "S", rating: 89, league: "西甲", color: "#FFFFFF", accent: "#111827" },
  { id: "man_city", name: "曼彻斯特城", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "S", rating: 89, league: "英超", color: "#6CABDD", accent: "#1C2C5B" },
  { id: "barcelona", name: "巴塞罗那", country: "🇪🇸 西班牙", tier: "S", rating: 87, league: "西甲", color: "#004D98", accent: "#A50044" },
  { id: "bayern", name: "拜仁慕尼黑", country: "🇩🇪 德国", tier: "S", rating: 88, league: "德甲", color: "#DC052D", accent: "#0066B2" },
  { id: "psg", name: "巴黎圣日耳曼", country: "🇫🇷 法国", tier: "S", rating: 86, league: "法甲", color: "#002B5C", accent: "#DA291C" },

  // A Tier - Major European Contenders
  { id: "arsenal", name: "阿森纳", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 84, league: "英超", color: "#EF0107", accent: "#063672" },
  { id: "liverpool", name: "利物浦", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 85, league: "英超", color: "#C8102E", accent: "#00B2A9" },
  { id: "inter_milan", name: "国际米兰", country: "🇮🇹 意大利", tier: "A", rating: 84, league: "意甲", color: "#00539F", accent: "#000000" },
  { id: "ac_milan", name: "AC米兰", country: "🇮🇹 意大利", tier: "A", rating: 81, league: "意甲", color: "#FB090B", accent: "#000000" },
  { id: "dortmund", name: "多特蒙德", country: "🇩🇪 德国", tier: "A", rating: 81, league: "德甲", color: "#FDE100", accent: "#000000" },

  // B Tier - Mid-table Big League / Top Asian Clubs
  { id: "villa", name: "阿斯顿维拉", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "B", rating: 78, league: "英超", color: "#95BFE5", accent: "#670E36" },
  { id: "real_sociedad", name: "皇家社会", country: "🇪🇸 西班牙", tier: "B", rating: 77, league: "西甲", color: "#00539F", accent: "#FFFFFF" },
  { id: "sporting_cp", name: "葡萄牙体育", country: "🇵🇹 葡萄牙", tier: "B", rating: 78, league: "葡超", color: "#008053", accent: "#FFFFFF" },
  { id: "al_hilal", name: "利雅得新月", country: "🇸🇦 沙特", tier: "B", rating: 76, league: "沙特联", color: "#0054A6", accent: "#FFFFFF" },

  // C Tier - CSL Powerhouses / Secondary Euro
  { id: "shanghai_port", name: "上海海港", country: "🇨🇳 中国", tier: "C", rating: 71, league: "中超", color: "#D22630", accent: "#000000" },
  { id: "shanghai_shenhua", name: "上海申花", country: "🇨🇳 中国", tier: "C", rating: 70, league: "中超", color: "#00479D", accent: "#E2001A" },
  { id: "beijing_guoan", name: "北京国安", country: "🇨🇳 中国", tier: "C", rating: 69, league: "中超", color: "#007A3D", accent: "#FFE600" },
  { id: "shandong_taishan", name: "山东泰山", country: "🇨🇳 中国", tier: "C", rating: 69, league: "中超", color: "#F36F21", accent: "#003A70" },

  // D Tier - CSL Mid-lower / Starting Clubs
  { id: "zhejiang_fc", name: "浙江队", country: "🇨🇳 中国", tier: "D", rating: 65, league: "中超", color: "#00A859", accent: "#003366" },
  { id: "chengdu_rongcheng", name: "成都蓉城", country: "🇨🇳 中国", tier: "D", rating: 66, league: "中超", color: "#E31D1A", accent: "#000000" },
  { id: "tianjin_jinmen_tiger", name: "天津津门虎", country: "🇨🇳 中国", tier: "D", rating: 62, league: "中超", color: "#003399", accent: "#CC0000" },
  { id: "qingdao_hainiu", name: "青岛海牛", country: "🇨🇳 中国", tier: "D", rating: 58, league: "中超", color: "#FF6600", accent: "#003399" }
];
