const TRAITS=[
  {id:'big-game',name:'大场面球员',metric:'bigGames',target:8,effect:'重要比赛评分波动降低'},
  {id:'super-sub',name:'超级替补',metric:'subContributions',target:6,effect:'替补登场时更容易获得关键机会'},
  {id:'professional',name:'职业楷模',metric:'professionalWeeks',target:36,effect:'高疲劳时训练风险略微降低'},
  {id:'versatile',name:'战术多面手',metric:'secondaryPositions',target:2,effect:'不同战术中的出场机会提高'},
  {id:'resilient',name:'逆境斗士',metric:'recoveries',target:3,effect:'伤愈后的状态恢复更快'},
  {id:'loyal',name:'一人一城',metric:'loyalSeasons',target:8,effect:'俱乐部球迷增长加快'}
];
export function ensureTraits(save){save.career.traits??={progress:{},unlocked:[]};save.career.traits.progress??={};save.career.traits.unlocked??=[];return save.career.traits}
function metric(save,id){
  if(id==='bigGames')return save.career.careerStats.bigGames||0;
  if(id==='subContributions')return(save.career.matchHistory||[]).filter(m=>m.played&&!m.starts&&(m.goals||m.assists)).length;
  if(id==='professionalWeeks')return save.career.weeklyPlan?.history?.length||0;
  if(id==='secondaryPositions')return save.player.secondaryPositions?.length||0;
  if(id==='recoveries')return(save.career.history||[]).filter(x=>x.type==='recovery').length;
  if(id==='loyalSeasons')return(save.career.history||[]).filter(x=>x.type==='season'&&x.clubId===save.career.clubId).length;
  return 0;
}
export function evaluateTraits(save){const state=ensureTraits(save),newly=[];for(const trait of TRAITS){const current=metric(save,trait.metric);state.progress[trait.id]={current,target:trait.target};if(current>=trait.target&&!state.unlocked.includes(trait.id)){state.unlocked.push(trait.id);newly.push(trait)}}return newly}
export function traitDefinitions(){return TRAITS.map(item=>({...item}))}
