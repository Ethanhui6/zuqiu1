const cache=new Map();
async function json(path){if(cache.has(path))return cache.get(path);const p=fetch(path,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(`数据读取失败：${path}`);return r.json()});cache.set(path,p);return p}
export class DataRepository{
  async init(){
    const [clubs,templates,achievements,positions,eventIndex,storyChains,version]=await Promise.all([
      json('./data/clubs.json'),json('./data/legend-templates.json'),json('./data/achievements.json'),json('./data/positions.json'),json('./data/events/index.json'),json('./data/events/story-chains.json'),json('./data/version.json')
    ]);
    this.clubs=this.enrichClubs(clubs.clubs||clubs);this.leagues=clubs.leagues||[];this.templates=templates;this.achievements=achievements;this.positions=positions;this.eventIndex=eventIndex;this.storyChains=Array.isArray(storyChains)?storyChains:(storyChains.events||[]);this.version=version;return this;
  }
  enrichClubs(clubs){
    const tactics=['控球推进','高位压迫','快速反击','边路传中','中路渗透','稳守反击'];
    const recruitment=['本国青年','高潜新星','即战力球员','技术型球员','身体型球员','国际市场'];
    return clubs.map((c,i)=>({
      ...c,city:c.city||'未核实',reputation:c.rep,attack:c.attack??Math.max(45,c.rep+(i%5)-2),defense:c.defense??Math.max(45,c.rep+((i*3)%5)-2),
      youth:c.youth??Math.max(45,Math.min(95,c.rep-3+(i%11))),finance:c.finance??Math.max(35,Math.min(98,c.rep-8+(i%17))),fanBase:c.fanBase??Math.round(80000*Math.pow(Math.max(1,c.rep-49),2.05)),
      stadiumCapacity:c.stadiumCapacity??Math.round(8000+(c.rep-50)*1150+(i%9)*700),tactic:c.tactic||tactics[i%tactics.length],recruitment:c.recruitment||recruitment[i%recruitment.length],
      youthUsage:c.youthUsage??Math.max(25,Math.min(95,45+(i%46))),needs:c.needs||['ST','CM','CB','GK'].slice(i%3,(i%3)+2),honours:c.honours||'历史荣誉由俱乐部身份资料概括，具体数量未在本包核实。',
      dataSource:{identity:'项目内置真实俱乐部名称库',ratings:'独立模拟评级',unverifiedFields:['city','attack','defense','youth','finance','fanBase','stadiumCapacity','tactic','recruitment','youthUsage','needs']}
    }));
  }
  getClub(id){return this.clubs.find(x=>x.id===id)||this.clubs[0]}
  getTemplates(position){const target=position==='SS'?'CAM':position;return this.templates.filter(x=>x.position===target)}
  async loadEventCategory(category){const path=`./data/events/${category}.json`;const data=await json(path);return Array.isArray(data)?data:(data.events||[])}
}
export const dataRepository=new DataRepository();
