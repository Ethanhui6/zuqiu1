// Football Career Simulator V12.0 - 100+ World Teams DB

const REAL_TEAMS = [
  { id: "real_madrid", name: "皇家马德里", country: "🇪🇸 西班牙", tier: "S", rating: 89, league: "西甲", color: "#FFFFFF", accent: "#001489" },
  { id: "man_city", name: "曼彻斯特城", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "S", rating: 89, league: "英超", color: "#6CABDD", accent: "#1C2C5B" },
  { id: "barcelona", name: "巴塞罗那", country: "🇪🇸 西班牙", tier: "S", rating: 88, league: "西甲", color: "#004D98", accent: "#A50044" },
  { id: "bayern", name: "拜仁慕尼黑", country: "🇩🇪 德国", tier: "S", rating: 88, league: "德甲", color: "#DC052D", accent: "#0066B2" },
  { id: "psg", name: "巴黎圣日耳曼", country: "🇫🇷 法国", tier: "S", rating: 87, league: "法甲", color: "#002B5C", accent: "#DA291C" },
  { id: "inter_milan", name: "国际米兰", country: "🇮🇹 意大利", tier: "S", rating: 86, league: "意甲", color: "#00539F", accent: "#000000" },

  { id: "arsenal", name: "阿森纳", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 85, league: "英超", color: "#EF0107", accent: "#063672" },
  { id: "liverpool", name: "利物浦", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 86, league: "英超", color: "#C8102E", accent: "#00B2A9" },
  { id: "chelsea", name: "切尔西", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 83, league: "英超", color: "#034694", accent: "#EE242C" },
  { id: "man_utd", name: "曼彻斯特联", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 82, league: "英超", color: "#DA020E", accent: "#FFE500" },
  { id: "tottenham", name: "热刺", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 82, league: "英超", color: "#131921", accent: "#001C58" },
  { id: "ac_milan", name: "AC米兰", country: "🇮🇹 意大利", tier: "A", rating: 82, league: "意甲", color: "#FB090B", accent: "#000000" },
  { id: "juventus", name: "尤文图斯", country: "🇮🇹 意大利", tier: "A", rating: 83, league: "意甲", color: "#000000", accent: "#FFFFFF" },
  { id: "dortmund", name: "多特蒙德", country: "🇩🇪 德国", tier: "A", rating: 82, league: "德甲", color: "#FDE100", accent: "#000000" },

  { id: "al_hilal", name: "利雅得新月", country: "🇸🇦 沙特", tier: "B", rating: 78, league: "沙特联", color: "#0054A6", accent: "#FFFFFF" },
  { id: "inter_miami", name: "迈阿密国际", country: "🇺🇸 美国", tier: "B", rating: 76, league: "MLS", color: "#F7B5CD", accent: "#231F20" },
  { id: "vissel_kobe", name: "神户胜利船", country: "🇯🇵 日本", tier: "B", rating: 73, league: "J联赛", color: "#9E002D", accent: "#000000" },
  { id: "ulsan_hd", name: "蔚山HD", country: "🇰🇷 韩国", tier: "B", rating: 74, league: "K联赛", color: "#003B7a", accent: "#E51937" },

  { id: "shanghai_port", name: "上海海港", country: "🇨🇳 中国", tier: "C", rating: 72, league: "中超", color: "#D22630", accent: "#000000" },
  { id: "shanghai_shenhua", name: "上海申花", country: "🇨🇳 中国", tier: "C", rating: 71, league: "中超", color: "#00479D", accent: "#E2001A" },
  { id: "beijing_guoan", name: "北京国安", country: "🇨🇳 中国", tier: "C", rating: 70, league: "中超", color: "#007A3D", accent: "#FFE600" },
  { id: "shandong_taishan", name: "山东泰山", country: "🇨🇳 中国", tier: "C", rating: 70, league: "中超", color: "#F36F21", accent: "#003A70" },

  { id: "zhejiang_fc", name: "浙江队", country: "🇨🇳 中国", tier: "D", rating: 66, league: "中超", color: "#00A859", accent: "#003366" },
  { id: "tianjin_jinmen", name: "天津津门虎", country: "🇨🇳 中国", tier: "D", rating: 63, league: "中超", color: "#003399", accent: "#CC0000" },
  { id: "csl_youth", name: "中国青训全国基地", country: "🇨🇳 中国", tier: "D", rating: 55, league: "青训", color: "#DE2910", accent: "#FFDE00" }
];
