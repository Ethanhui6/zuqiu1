import { createWorldRegistry } from '../data/worldRegistry.js';
import { CLUB_CRESTS } from '../data/clubCrests.js';

const cache=new Map();
async function json(path){if(cache.has(path))return cache.get(path);const p=fetch(path,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(`数据读取失败：${path}`);return r.json()});cache.set(path,p);return p}
export class DataRepository{
  async init(){
    const nameFiles=['china','japan','south-korea','england','scotland','wales','ireland','france','germany','spain','portugal','italy','netherlands','belgium','brazil','argentina','usa','mexico','saudi-arabia','turkey','nigeria','ghana','senegal','morocco','egypt','other'];
    const [clubs,templates,achievements,positions,eventIndex,storyChains,version,players,trophies,sources,positionEvents,...names]=await Promise.all([
      json('./data/clubs.json'),json('./data/legend-templates.json'),json('./data/achievements.json'),json('./data/positions.json'),json('./data/events/index.json'),json('./data/events/story-chains.json'),json('./data/version.json'),json('./data/players.json'),json('./data/trophies.json'),json('./data/data-sources.json'),json('./data/events/position-events.json')
      ,...nameFiles.map(file=>json(`./data/names/${file}.json`))
    ]);
    this.clubs=this.enrichClubs(clubs.clubs||clubs);this.leagues=clubs.leagues||[];this.templates=templates;this.achievements=achievements;this.positions=positions;this.eventIndex=eventIndex;this.storyChains=Array.isArray(storyChains)?storyChains:(storyChains.events||[]);this.version=version;this.sources=sources;
    this.nameProfiles=Object.fromEntries(nameFiles.map((file,index)=>[file,names[index]]));this.positionEvents=Array.isArray(positionEvents)?positionEvents:(positionEvents.events||[]);
    this.registry=createWorldRegistry({clubs:this.clubs,leagues:this.leagues,players,trophies});
    this.clubs=this.registry.clubs;this.leagues=this.registry.leagues;this.countries=this.registry.countries;this.players=this.registry.players;this.trophies=this.registry.trophies;return this;
  }
  enrichClubs(clubs){
    const tactics=['控球推进','高位压迫','快速反击','边路传中','中路渗透','稳守反击'];
    const recruitment=['本国青年','高潜新星','即战力球员','技术型球员','身体型球员','国际市场'];
    return clubs.map((c,i)=>{
      const crest = c.crest || c.crestPath || CLUB_CRESTS[c.id]?.path || null;
      return {
      ...c,city:c.city||null,reputation:c.rep,attack:c.attack??Math.max(45,c.rep+(i%5)-2),defense:c.defense??Math.max(45,c.rep+((i*3)%5)-2),
      youth:c.youth??Math.max(45,Math.min(95,c.rep-3+(i%11))),finance:c.finance??Math.max(35,Math.min(98,c.rep-8+(i%17))),fanBase:c.fanBase??Math.round(80000*Math.pow(Math.max(1,c.rep-49),2.05)),
      stadiumCapacity:c.stadiumCapacity??Math.round(8000+(c.rep-50)*1150+(i%9)*700),tactic:c.tactic||tactics[i%tactics.length],recruitment:c.recruitment||recruitment[i%recruitment.length],
      youthUsage:c.youthUsage??Math.max(25,Math.min(95,45+(i%46))),needs:c.needs||['ST','CM','CB','GK'].slice(i%3,(i%3)+2),honours:c.honours||'历史荣誉资料待核对。',
      crest,crestPath:crest,crestStatus:crest?'exact':'unmatched',crestSource:c.crestSource||CLUB_CRESTS[c.id]?.source||null,
      dataSource:{identity:'项目内置真实俱乐部名称库',ratings:'独立模拟评级',unverifiedFields:['city','attack','defense','youth','finance','fanBase','stadiumCapacity','tactic','recruitment','youthUsage','needs']}
    };});
  }
  getClub(id){return this.clubs.find(x=>x.id===id)||this.clubs[0]}
  searchClubs(query,limit=20){return this.registry?.search(query,limit)||[]}
  getTemplates(position){const target=position==='SS'?'CAM':position;return this.templates.filter(x=>x.position===target)}
  async loadEventCategory(category){const path=`./data/events/${category}.json`;const data=await json(path);return Array.isArray(data)?data:(data.events||[])}
  rosterForClub(clubId,options){return this.registry?.rosterForClub(clubId,options)||[]}
}
export const dataRepository=new DataRepository();
