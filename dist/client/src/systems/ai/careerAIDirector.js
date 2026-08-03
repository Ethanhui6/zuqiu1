import {ensureRngState,keyedRandom} from '../../services/rng.js';
import {addGameDays,compareGameDates} from '../../utils/gameDate.js';
import {ensureGameClock} from '../career/gameClock.js';

function stage(save){if(save.status.injury)return'recovery';if(save.career.squadLevel!=='一线队')return'youth';if(save.career.teamRole==='未进入名单'||save.career.teamRole==='替补')return'fringe';return'core'}
function chooseFocus(save){
  const current=stage(save),rating=Number(save.career.seasonStats.rating||0),trust=Number(save.status.coachTrust||0),contract=Number(save.career.contract?.years||0);
  if(current==='recovery')return{key:'recover',title:'优先恢复比赛状态',training:'recovery',challenge:'将复发风险降至安全范围'};
  if(contract<=1)return{key:'contract',title:'处理合同与职业方向',training:'tactics',challenge:'在合同决定前维持稳定表现'};
  if(current==='youth'&&trust<60)return{key:'promotion',title:'争取一线队训练机会',training:'tactics',challenge:'提升教练信任并进入连续比赛名单'};
  if(current==='fringe')return{key:'minutes',title:'重新进入首发竞争',training:'physical',challenge:'未来5场贡献2次关键表现'};
  if(rating>=7.2)return{key:'peak',title:'把良好状态转化为荣誉',training:'personal',challenge:'保持评分并完成关键比赛目标'};
  return{key:'stability',title:'建立稳定比赛表现',training:'tactics',challenge:'连续4场避免低于6.5分'};
}
export function ensureCareerDirector(save){
  save.career.aiDirector??={lastReviewDate:null,nextReviewDate:null,focus:null,recommendations:[],eventBias:{},history:[]};
  return save.career.aiDirector;
}
export function updateCareerDirector(save,{force=false}={}){
  const director=ensureCareerDirector(save),clock=ensureGameClock(save);
  if(!force&&director.nextReviewDate&&compareGameDates(clock.currentDate,director.nextReviewDate)<0)return director;
  const rngState=ensureRngState(save,{seed:`career-director-${save.career.clubId||'unknown'}`});
  const focus=chooseFocus(save),rng=keyedRandom(rngState.seed,'career-director',clock.currentDate,focus.key,save.career.clubId);
  const recommendations=[
    `训练建议：${focus.training==='recovery'?'以恢复训练为主':focus.training==='personal'?'安排个人特训':'保持战术与位置训练'}`,
    `阶段挑战：${focus.challenge}`,
    save.career.contract.years<=1?'经纪人建议本月评估续约和转会选项。':rng.bool(.5)?'优先处理教练和队内竞争相关消息。':'下一场比赛应采用与阶段目标一致的比赛策略。'
  ];
  director.lastReviewDate=clock.currentDate;
  const interval=rng.int(28,49);
  director.nextReviewDate=addGameDays(clock.currentDate,interval);
  director.focus={...focus,createdDate:clock.currentDate,expiresAfterDays:interval};
  director.recommendations=recommendations;
  director.eventBias={coach:focus.key==='promotion'||focus.key==='minutes'?1.4:1,contract:focus.key==='contract'?1.6:1,recovery:focus.key==='recover'?1.7:1,match:focus.key==='peak'?1.35:1};
  director.history.push({date:clock.currentDate,focus:focus.key,title:focus.title});director.history=director.history.slice(-30);
  return director;
}
