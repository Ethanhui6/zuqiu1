export const MATCH_INTERACTIONS = [
  {id:'shooting',name:'射门',icon:'shooting',stat:'shooting',copy:'抓住禁区前沿的终结时机'},
  {id:'penalty',name:'点球',icon:'target',stat:'shooting',copy:'控制节奏，选择射门方向'},
  {id:'freeKick',name:'任意球',icon:'tactics',stat:'shooting',copy:'用脚法越过人墙寻找角度'},
  {id:'dribbling',name:'盘带',icon:'dribbling',stat:'dribbling',copy:'一对一变向摆脱防守'},
  {id:'passing',name:'传球',icon:'passing',stat:'passing',copy:'阅读空当送出关键一传'},
  {id:'header',name:'头球',icon:'ball',stat:'physical',copy:'判断落点完成争顶'},
  {id:'tackling',name:'抢断',icon:'defending',stat:'defending',copy:'在不犯规的前提下夺回球权'},
  {id:'save',name:'门将扑救',icon:'goalkeeper',stat:'defending',copy:'判断射门线路完成扑救'}
];

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function resolveMatchInteraction({id='shooting',player,seed=0}){
  const option=MATCH_INTERACTIONS.find(item=>item.id===id)||MATCH_INTERACTIONS[0];
  const stat=Number(player?.stats?.[option.stat]||player?.ovr||50);
  const roll=(Math.abs(Number(seed))%100)/100;
  const threshold=clamp(.24+stat/125, .42, .94);
  const success=roll<threshold;
  const pressure=(option.id==='penalty'||option.id==='freeKick') ? 0.08 : 0;
  return {option,stat,success,score:Math.round(clamp(stat+(success?9:-10)+(roll-.5)*12,25,99)),ratingBonus:(success ? .24 : -.18)+pressure,goalChance:success&&['shooting','penalty','freeKick','header'].includes(option.id)?(option.id==='penalty' ? .72 : .28):0};
}
