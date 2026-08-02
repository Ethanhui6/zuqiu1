// Football Career Simulator V10.0 - FC26 Style Real Players & Youth DB

const FC26_STAR_PLAYERS = [
  { name: "姆巴佩", team: "real_madrid", pos: "ST", ovr: 91, pac: 97, sho: 90, pas: 80, dri: 92, def: 36, phy: 78, nat: "🇫🇷" },
  { name: "哈兰德", team: "man_city", pos: "ST", ovr: 91, pac: 89, sho: 93, pas: 66, dri: 80, def: 45, phy: 88, nat: "🇳🇴" },
  { name: "贝林厄姆", team: "real_madrid", pos: "CAM", ovr: 90, pac: 80, sho: 87, pas: 83, dri: 88, def: 78, phy: 83, nat: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "维尼修斯", team: "real_madrid", pos: "LW", ovr: 90, pac: 95, sho: 84, pas: 81, dri: 91, def: 29, phy: 69, nat: "🇧🇷" },
  { name: "罗德里", team: "man_city", pos: "CDM", ovr: 91, pac: 58, sho: 73, pas: 86, dri: 81, def: 87, phy: 85, nat: "🇪🇸" },
  { name: "萨拉赫", team: "liverpool", pos: "RW", ovr: 89, pac: 89, sho: 87, pas: 81, dri: 88, def: 45, phy: 76, nat: "🇪🇬" },
  { name: "武磊", team: "shanghai_port", pos: "RW", ovr: 72, pac: 79, sho: 73, pas: 65, dri: 71, def: 38, phy: 64, nat: "🇨🇳" },
  { name: "韦世豪", team: "chengdu_rongcheng", pos: "LW", ovr: 69, pac: 76, sho: 70, pas: 66, dri: 72, def: 35, phy: 60, nat: "🇨🇳" },
  { name: "蒋光太", team: "shanghai_port", pos: "CB", ovr: 70, pac: 66, sho: 32, pas: 52, dri: 55, def: 72, phy: 78, nat: "🇨🇳" },
  { name: "朱辰杰", team: "shanghai_shenhua", pos: "CB", ovr: 68, pac: 63, sho: 30, pas: 50, dri: 52, def: 70, phy: 72, nat: "🇨🇳" }
];

// Generator for Youth & Teammates when needed
function generateRandomYouthPlayer(teamObj, minOvr = 58, maxOvr = 68) {
  const familyNames = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "吴", "周", "徐", "孙", "马", "朱", "胡", "郭"];
  const givenNames = ["伟", "强", "磊", "洋", "勇", "军", "平", "保", "东", "文", "辉", "力", "明", "永", "健", "世"];
  
  const isChinese = teamObj.country.includes("中国");
  let name = "";
  let nat = isChinese ? "🇨🇳" : "🇪🇸";
  
  if (isChinese) {
    name = familyNames[Math.floor(Math.random() * familyNames.length)] + givenNames[Math.floor(Math.random() * givenNames.length)];
  } else {
    const euroNames = ["Carlos", "Diego", "Lucas", "Mateo", "Leo", "Hugo", "Gavi", "Pedri", "Nico", "Marco"];
    name = euroNames[Math.floor(Math.random() * euroNames.length)];
  }

  const positions = ["ST", "RW", "LW", "CAM", "CM", "CDM", "CB", "RB", "LB"];
  const pos = positions[Math.floor(Math.random() * positions.length)];
  const ovr = Math.floor(Math.random() * (maxOvr - minOvr + 1)) + minOvr;

  return {
    name: name,
    team: teamObj.id,
    pos: pos,
    ovr: ovr,
    pac: Math.min(99, ovr + Math.floor(Math.random() * 10 - 5)),
    sho: Math.min(99, ovr + Math.floor(Math.random() * 10 - 5)),
    pas: Math.min(99, ovr + Math.floor(Math.random() * 10 - 5)),
    dri: Math.min(99, ovr + Math.floor(Math.random() * 10 - 5)),
    def: Math.min(99, ovr + Math.floor(Math.random() * 10 - 5)),
    phy: Math.min(99, ovr + Math.floor(Math.random() * 10 - 5)),
    nat: nat
  };
}
