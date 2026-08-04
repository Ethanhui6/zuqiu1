import {hashString} from '../../services/rng.js';

export const CONTINENTS={
  europe:{id:'europe',name:'欧洲',theme:'#5B7CFA',countries:['英格兰','苏格兰','西班牙','葡萄牙','法国','德国','意大利','荷兰','比利时','奥地利','瑞士','希腊','土耳其','丹麦','挪威','瑞典','波兰','捷克','克罗地亚','塞尔维亚','罗马尼亚','乌克兰']},
  asia:{id:'asia',name:'亚洲',theme:'#28A879',countries:['中国','日本','韩国','沙特阿拉伯','卡塔尔','阿联酋']},
  southAmerica:{id:'southAmerica',name:'南美洲',theme:'#E29A3B',countries:['巴西','阿根廷','乌拉圭','智利','哥伦比亚']},
  northAmerica:{id:'northAmerica',name:'北美洲',theme:'#8A68D7',countries:['美国','墨西哥']},
  africa:{id:'africa',name:'非洲',theme:'#CF6B72',countries:['南非']},
  oceania:{id:'oceania',name:'大洋洲',theme:'#3E9CB5',countries:['澳大利亚']}
};
const COUNTRY_COORDS={
  中国:[79,42],日本:[88,39],韩国:[84,38],沙特阿拉伯:[62,48],卡塔尔:[64,46],阿联酋:[66,47],
  英格兰:[46,29],苏格兰:[45,25],西班牙:[43,39],葡萄牙:[40,39],法国:[47,35],德国:[51,31],意大利:[52,39],荷兰:[49,29],比利时:[48,31],奥地利:[53,34],瑞士:[50,35],希腊:[57,41],土耳其:[61,39],丹麦:[51,25],挪威:[51,18],瑞典:[55,19],波兰:[56,30],捷克:[53,32],克罗地亚:[54,38],塞尔维亚:[56,38],罗马尼亚:[59,35],乌克兰:[63,31],
  巴西:[34,67],阿根廷:[31,81],乌拉圭:[35,78],智利:[27,78],哥伦比亚:[29,58],美国:[18,38],墨西哥:[16,51],南非:[58,80],澳大利亚:[86,78]
};

export function ensureWorldExplorerState(save){
  save.career.worldExplorer={level:'world',continent:null,country:null,leagueId:null,query:'',filters:{},scroll:{},favorites:[],compare:[],transferTargets:[],...(save.career.worldExplorer||{})};
  for(const key of ['favorites','compare','transferTargets'])save.career.worldExplorer[key]??=[];
  save.career.worldExplorer.filters??={};save.career.worldExplorer.scroll??={};return save.career.worldExplorer;
}
export function continentForCountry(country){return Object.values(CONTINENTS).find(item=>item.countries.includes(country))||CONTINENTS.europe}
export function continentStats(repo,save){
  const state=ensureWorldExplorerState(save);return Object.values(CONTINENTS).map(continent=>{
    const clubs=repo.clubs.filter(club=>continent.countries.includes(club.country)),leagues=new Set(clubs.map(club=>club.leagueId));
    const opportunity=clubs.filter(club=>(club.needs||[]).includes(save.player.position)||club.youthUsage>=70).length;
    return{...continent,clubs:clubs.length,leagues:leagues.size,average:clubs.length?Math.round(clubs.reduce((sum,club)=>sum+club.rep,0)/clubs.length):0,opportunity,favorites:clubs.filter(club=>state.favorites.includes(club.id)).length};
  })
}
export function countriesForContinent(repo,continentId,save){
  const continent=CONTINENTS[continentId]||CONTINENTS.europe,state=ensureWorldExplorerState(save);return continent.countries.map(country=>{
    const clubs=repo.clubs.filter(club=>club.country===country);if(!clubs.length)return null;const leagues=new Set(clubs.map(club=>club.leagueId));return{country,continentId,clubs:clubs.length,leagues:leagues.size,average:Math.round(clubs.reduce((sum,club)=>sum+club.rep,0)/clubs.length),youth:Math.round(clubs.reduce((sum,club)=>sum+club.youth,0)/clubs.length),fit:Math.round(clubs.reduce((sum,club)=>sum+clubFit(save,club),0)/clubs.length),favorite:clubs.some(club=>state.favorites.includes(club.id))};
  }).filter(Boolean).sort((a,b)=>b.fit-a.fit||b.average-a.average)
}
export function leaguesForCountry(repo,country,save){
  const groups=new Map();for(const club of repo.clubs.filter(item=>item.country===country)){if(!groups.has(club.leagueId))groups.set(club.leagueId,[]);groups.get(club.leagueId).push(club)}
  return [...groups].map(([leagueId,clubs])=>({leagueId,name:clubs[0].leagueCn,level:Math.min(...clubs.map(c=>Number(c.level||1))),clubs:clubs.length,average:Math.round(clubs.reduce((s,c)=>s+c.rep,0)/clubs.length),youth:Math.round(clubs.reduce((s,c)=>s+c.youthUsage,0)/clubs.length),fit:Math.round(clubs.reduce((s,c)=>s+clubFit(save,c),0)/clubs.length),style:mostCommon(clubs.map(c=>c.tactic))})).sort((a,b)=>a.level-b.level||b.average-a.average)
}
export function clubsForLeague(repo,leagueId,save,{query='',limit=24}={}){const q=query.toLocaleLowerCase('zh-CN');return repo.clubs.filter(c=>c.leagueId===leagueId&&(c.cn.includes(query)||c.country.includes(query)||c.leagueCn.includes(query)||String(c.native||'').toLocaleLowerCase('zh-CN').includes(q))).map(c=>({...c,playerFit:clubFit(save,c)})).sort((a,b)=>b.playerFit-a.playerFit||b.rep-a.rep).slice(0,limit)}
export function clubFit(save,club){let score=45;if((club.needs||[]).includes(save.player.position))score+=22;score+=(Number(club.youthUsage||50)-50)*.25;if(save.player.age<=21)score+=(Number(club.youth||50)-50)*.18;if(club.rep>save.player.ovr+20)score-=10;if(club.rep<save.player.ovr-10)score+=5;return Math.max(8,Math.min(98,Math.round(score)))}
export function clubCoordinates(club){const base=COUNTRY_COORDS[club.country]||[50,50],hash=hashString(club.id||club.cn);return{x:Math.max(5,Math.min(95,base[0]+((hash%11)-5)*.55)),y:Math.max(8,Math.min(92,base[1]+(((hash>>4)%9)-4)*.55))}}
export function toggleFavorite(save,clubId){const state=ensureWorldExplorerState(save),index=state.favorites.indexOf(clubId);if(index>=0)state.favorites.splice(index,1);else state.favorites.push(clubId);return state.favorites.includes(clubId)}
export function toggleCompare(save,clubId){const state=ensureWorldExplorerState(save),index=state.compare.indexOf(clubId);if(index>=0)state.compare.splice(index,1);else{if(state.compare.length>=3)state.compare.shift();state.compare.push(clubId)}return state.compare.includes(clubId)}
export function setTransferTarget(save,clubId){const state=ensureWorldExplorerState(save);state.transferTargets=[clubId,...state.transferTargets.filter(id=>id!==clubId)].slice(0,5);return clubId}
export function setExplorerLevel(save,level,payload={}){const state=ensureWorldExplorerState(save);state.level=level;Object.assign(state,payload);return state}
export function flagForCountry(country){const map={中国:'🇨🇳',日本:'🇯🇵',韩国:'🇰🇷',英格兰:'🏴',苏格兰:'🏴',西班牙:'🇪🇸',葡萄牙:'🇵🇹',法国:'🇫🇷',德国:'🇩🇪',意大利:'🇮🇹',荷兰:'🇳🇱',比利时:'🇧🇪',奥地利:'🇦🇹',瑞士:'🇨🇭',希腊:'🇬🇷',土耳其:'🇹🇷',丹麦:'🇩🇰',挪威:'🇳🇴',瑞典:'🇸🇪',波兰:'🇵🇱',捷克:'🇨🇿',克罗地亚:'🇭🇷',塞尔维亚:'🇷🇸',罗马尼亚:'🇷🇴',乌克兰:'🇺🇦',沙特阿拉伯:'🇸🇦',卡塔尔:'🇶🇦',阿联酋:'🇦🇪',巴西:'🇧🇷',阿根廷:'🇦🇷',乌拉圭:'🇺🇾',智利:'🇨🇱',哥伦比亚:'🇨🇴',美国:'🇺🇸',墨西哥:'🇲🇽',南非:'🇿🇦',澳大利亚:'🇦🇺'};return map[country]||'⚑'}
function mostCommon(values){const counts=new Map();for(const value of values)counts.set(value,(counts.get(value)||0)+1);return [...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||'多样战术'}
