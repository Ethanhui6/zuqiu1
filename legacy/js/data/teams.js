// Football Career Simulator - Teams Database with Native Subtitles & Crests

const REAL_TEAMS = [
  { id: "real_madrid", name: "皇家马德里", nativeName: "Real Madrid C.F.", country: "🇪🇸 西班牙", tier: "S", rating: 89, league: "西甲", color: "#FFFFFF", accent: "#001489" },
  { id: "man_city", name: "曼彻斯特城", nativeName: "Manchester City F.C.", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "S", rating: 89, league: "英超", color: "#6CABDD", accent: "#1C2C5B" },
  { id: "barcelona", name: "巴塞罗那", nativeName: "F.C. Barcelona", country: "🇪🇸 西班牙", tier: "S", rating: 88, league: "西甲", color: "#004D98", accent: "#A50044" },
  { id: "bayern", name: "拜仁慕尼黑", nativeName: "FC Bayern München", country: "🇩🇪 德国", tier: "S", rating: 88, league: "德甲", color: "#DC052D", accent: "#0066B2" },
  { id: "psg", name: "巴黎圣日耳曼", nativeName: "Paris Saint-Germain F.C.", country: "🇫🇷 法国", tier: "S", rating: 87, league: "法甲", color: "#002B5C", accent: "#DA291C" },

  { id: "arsenal", name: "阿森纳", nativeName: "Arsenal F.C.", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 85, league: "英超", color: "#EF0107", accent: "#063672" },
  { id: "liverpool", name: "利物浦", nativeName: "Liverpool F.C.", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", tier: "A", rating: 86, league: "英超", color: "#C8102E", accent: "#00B2A9" },
  { id: "inter_milan", name: "国际米兰", nativeName: "FC Internazionale Milano", country: "🇮🇹 意大利", tier: "A", rating: 86, league: "意甲", color: "#00539F", accent: "#000000" },
  { id: "ac_milan", name: "AC米兰", nativeName: "A.C. Milan", country: "🇮🇹 意大利", tier: "A", rating: 82, league: "意甲", color: "#FB090B", accent: "#000000" },

  { id: "vissel_kobe", name: "神户胜利船", nativeName: "ヴィッセル神戸 (Vissel Kobe)", country: "🇯🇵 日本", tier: "B", rating: 73, league: "J联赛", color: "#9E002D", accent: "#000000" },
  { id: "jeonbuk", name: "全北现代", nativeName: "全北 現代 モ图 (Jeonbuk Hyundai)", country: "🇰🇷 韩国", tier: "B", rating: 73, league: "K联赛", color: "#00512C", accent: "#FDE100" },
  { id: "inter_miami", name: "迈阿密国际", nativeName: "Inter Miami CF", country: "🇺🇸 美国", tier: "B", rating: 76, league: "MLS", color: "#F7B5CD", accent: "#231F20" },

  { id: "shanghai_port", name: "上海海港", nativeName: "Shanghai Port F.C.", country: "🇨🇳 中国", tier: "C", rating: 72, league: "中超", color: "#D22630", accent: "#000000" },
  { id: "shanghai_shenhua", name: "上海申花", nativeName: "Shanghai Shenhua F.C.", country: "🇨🇳 中国", tier: "C", rating: 71, league: "中超", color: "#00479D", accent: "#E2001A" },
  { id: "beijing_guoan", name: "北京国安", nativeName: "Beijing Guoan F.C.", country: "🇨🇳 中国", tier: "C", rating: 70, league: "中超", color: "#007A3D", accent: "#FFE600" },

  { id: "zhejiang_fc", name: "浙江队", nativeName: "Zhejiang Professional F.C.", country: "🇨🇳 中国", tier: "D", rating: 66, league: "中超", color: "#00A859", accent: "#003366" },
  { id: "csl_youth", name: "中国青训全国基地", nativeName: "China National Youth Academy", country: "🇨🇳 中国", tier: "D", rating: 55, league: "青训", color: "#DE2910", accent: "#FFDE00" }
];
