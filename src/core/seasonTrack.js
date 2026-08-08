const DAY=86400000;

export const SEASON_TRACK_NODES=Object.freeze([
  {id:'preseason',label:'季前准备',fallback:0},
  {id:'league-opening',label:'联赛开幕',fallback:14},
  {id:'early-season',label:'赛季前段',fallback:56},
  {id:'domestic-cup',label:'国内杯赛',fallback:91,match:/杯|足协|国王|足总/},
  {id:'national-window',label:'国家队比赛日',fallback:133,match:/国家队|友谊|预选|世界杯/},
  {id:'transfer-window',label:'转会窗口',fallback:184},
  {id:'mid-season',label:'赛季中段',fallback:198},
  {id:'continental',label:'洲际赛事',fallback:238,match:/欧冠|欧联|亚冠|欧洲冠军|欧洲联赛|洲际|世俱杯|continental/i},
  {id:'run-in',label:'冲刺阶段',fallback:273},
  {id:'final-awards',label:'决赛和颁奖',fallback:343},
  {id:'season-review',label:'赛季总结',fallback:364},
  {id:'off-season',label:'休赛期',fallback:365}
]);

function dateValue(value){return Date.parse(`${value}T00:00:00Z`)}
function dateText(value){return new Date(dateValue(value)).toISOString().slice(0,10)}
function addDays(value,days){return new Date(dateValue(value)+days*DAY).toISOString().slice(0,10)}
function compare(a,b){return dateValue(a)-dateValue(b)}
function seasonStart(state){
  const year=Number(String(state.season?.year||'').slice(0,4))||Number(String(state.simulation?.date||'2026').slice(0,4));
  return `${year}-07-01`;
}
function fixtureDate(state,pattern,after){
  if(!pattern)return null;
  return (state.schedule||[]).filter(item=>item?.date&&(!after||compare(item.date,after)>=0)&&pattern.test(String(item.competition||item.competitionType||''))).sort((a,b)=>compare(a.date,b.date))[0]?.date||null;
}
function firstLeagueDate(state,start){
  return (state.schedule||[]).filter(item=>item?.date&&compare(item.date,start)>=0&&!/杯|友谊|欧冠|欧联|亚冠|洲际|世界杯|预选|国家队/i.test(String(item.competition||item.competitionType||''))).sort((a,b)=>compare(a.date,b.date))[0]?.date||null;
}
function nextAvailable(candidate,previous){return compare(candidate,previous)>0?candidate:addDays(previous,1)}

export function buildSeasonTrack(state){
  const start=seasonStart(state),end=addDays(start,364),currentDate=String(state.simulation?.date||start);
  const league=firstLeagueDate(state,start)||addDays(start,14);
  const candidates={
    preseason:start,
    'league-opening':league,
    'early-season':addDays(league,42),
    'domestic-cup':fixtureDate(state,/杯|足协|国王|足总/i,league)||addDays(start,91),
    'national-window':fixtureDate(state,/国家队|友谊|预选|世界杯/i)||addDays(start,133),
    'transfer-window':`${Number(start.slice(0,4))+1}-01-01`,
    'mid-season':`${Number(start.slice(0,4))+1}-01-15`,
    continental:fixtureDate(state,/欧冠|欧联|亚冠|欧洲冠军|欧洲联赛|洲际|世俱杯|continental/i)||addDays(start,238),
    'run-in':addDays(start,273),
    'final-awards':(state.schedule||[]).filter(item=>item?.date&&item.important&&compare(item.date,start)>=0&&compare(item.date,end)<=0).sort((a,b)=>compare(b.date,a.date))[0]?.date||addDays(start,343),
    'season-review':end,
    'off-season':addDays(end,1)
  };
  let previous=start;
  const nodes=SEASON_TRACK_NODES.map(def=>{
    const date=def.id==='preseason'?start:nextAvailable(candidates[def.id]||addDays(start,def.fallback),previous);
    previous=date;
    return{id:def.id,label:def.label,date,source:candidates[def.id]===date?'schedule-or-calendar':'calendar'};
  });
  const currentIndex=Math.max(0,nodes.findIndex(node=>compare(currentDate,node.date)<=0));
  const clampedDate=compare(currentDate,start)<0?start:compare(currentDate,end)>0?end:currentDate;
  const progress=Math.max(0,Math.min(100,Math.round((dateValue(clampedDate)-dateValue(start))/(dateValue(end)-dateValue(start))*100)));
  const nextFixture=(state.schedule||[]).filter(item=>item?.status==='upcoming'&&item.date&&compare(item.date,currentDate)>=0).sort((a,b)=>compare(a.date,b.date))[0]||null;
  const current=nodes[currentIndex]||nodes.at(-1),next=nodes[currentIndex+1]||null;
  const statusNodes=nodes.map((node,index)=>({...node,status:index<currentIndex?'complete':index===currentIndex?'current':'upcoming'}));
  return{season:state.season?.year||`${start.slice(0,4)}/${String(Number(start.slice(0,4))+1).slice(-2)}`,startDate:start,endDate:end,currentDate,progress,currentNode:{...current,status:'current'},nextNode:next?{...next,status:'upcoming'}:null,completedNodes:statusNodes.filter(node=>node.status==='complete'),nodes:statusNodes,nextFixture,reminders:{transferWindow:compare(currentDate,`${Number(start.slice(0,4))+1}-01-01`)>=0&&compare(currentDate,`${Number(start.slice(0,4))+1}-02-01`)<0,contractMonths:Number(state.career?.contractMonths||0)}};
}
