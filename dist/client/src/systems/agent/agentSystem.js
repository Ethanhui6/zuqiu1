import {ensureRngState,keyedRandom} from '../../services/rng.js';
import {ensureGameClock} from '../career/gameClock.js';

const AGENTS=[
  {id:'steady',name:'林策',negotiation:68,network:60,media:55,loyalty:82,commission:5,risk:'稳健'},
  {id:'network',name:'周远',negotiation:74,network:86,media:68,loyalty:58,commission:8,risk:'积极'},
  {id:'media',name:'沈澜',negotiation:66,network:69,media:90,loyalty:64,commission:7,risk:'曝光优先'}
];
export function ensureAgent(save){save.career.agent??={...AGENTS[0],advice:null,history:[]};save.career.agent.history??=[];return save.career.agent}
export function changeAgent(save,id){const next=AGENTS.find(item=>item.id===id);if(!next)throw new Error('经纪人不存在');save.career.agent={...next,advice:null,history:[...(save.career.agent?.history||[]),{date:ensureGameClock(save).currentDate,type:'change',name:next.name}]};return save.career.agent}
export function generateAgentAdvice(save){
  const rngState=ensureRngState(save,{seed:`agent-${save.career?.clubId||'unknown'}`});
  const agent=ensureAgent(save),clock=ensureGameClock(save),rng=keyedRandom(rngState.seed,'agent-advice',clock.currentDate,agent.id,save.career.clubId);
  let advice;
  if(save.career.contract.years<=1)advice={type:'必须处理',title:'合同进入关键阶段',text:'建议在未来四周内决定续约、等待报价或提交转会意向。',action:'contract'};
  else if(save.career.squadCompetition?.rank>=3)advice={type:'建议处理',title:'出场顺位正在下降',text:agent.risk==='积极'?'建议主动寻找租借或转会接触。':'建议先与教练沟通并争取连续比赛名单。',action:'minutes'};
  else if(rng.bool(.45))advice={type:'信息通知',title:'市场关注正在上升',text:'近期表现已引起其他俱乐部球探关注，继续保持稳定有利于谈判。',action:'market'};
  else advice={type:'建议处理',title:'保持当前发展路线',text:'当前合同、上场时间和成长环境相对平衡，暂不建议仓促转会。',action:'stay'};
  agent.advice={...advice,date:clock.currentDate};agent.history.push(agent.advice);agent.history=agent.history.slice(-40);return agent.advice;
}
export function agentOptions(){return AGENTS.map(item=>({...item}))}
