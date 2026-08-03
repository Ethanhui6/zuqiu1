export function calculateEnding(save,repo){const p=save.player,c=save.career.careerStats,transfers=save.career.transferHistory.length,clubs=new Set(save.career.clubHistory),injured=save.career.history.filter(x=>x.type==='injury').length;const current=repo.getClub(save.career.clubId);const scores=[
 {id:'world-legend',name:'世界传奇',score:p.ovr>=92&&c.titles>=8?100:0,desc:'在最高舞台留下跨时代纪录。'},
 {id:'one-club',name:'一人一城',score:clubs.size===1&&p.age>=34?92:0,desc:`把整个职业生涯献给了${current.cn}。`},
 {id:'national-hero',name:'国家英雄',score:c.nationalApps>=80&&c.nationalGoals>=20?90:0,desc:'国家队的重要时刻都留下了你的名字。'},
 {id:'late-bloom',name:'大器晚成',score:p.age>=29&&p.ovr>=88&&p.talent.rarity==='普通'?88:0,desc:'普通起点没有阻止你在生涯后半程登顶。'},
 {id:'injury-genius',name:'被伤病改变的天才',score:injured>=4&&p.potential>=90&&p.ovr<82?86:0,desc:'天赋曾照亮世界，伤病却改变了最终轨迹。'},
 {id:'journeyman',name:'转会流浪者',score:transfers>=9?84:0,desc:'多国、多联赛和不同战术共同组成了你的职业地图。'},
 {id:'super-sub',name:'超级替补',score:c.apps>=200&&save.career.history.filter(x=>x.stats?.starts<x.stats?.apps*.5).length>=6?82:0,desc:'你总能在有限时间内改变比赛。'},
 {id:'commercial',name:'商业巨星',score:save.fans.social>=10000000&&save.fans.commercialValue>=75?80:0,desc:'影响力从球场延伸到全球商业世界。'},
 {id:'league-legend',name:'联赛传奇',score:c.apps>=450&&c.titles>=4?78:0,desc:'多年稳定表现让你成为联赛历史的一部分。'},
 {id:'professional',name:'默默无闻的职业球员',score:60,desc:'没有神话般的终点，但完成了一段真实而完整的职业生涯。'}
 ];return scores.sort((a,b)=>b.score-a.score)[0]}
