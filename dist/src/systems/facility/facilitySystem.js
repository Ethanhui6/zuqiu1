import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {applyFanChange} from '../fan/fanSystem.js';
import {applyRelation} from '../relationship/relationshipSystem.js';

const PHASE_LOCKED=new Set(['academy','medical','shop','press','locker']);

function phaseKey(save,id){return `${id}:${save.career.season}:${save.career.month}`}
function ensureState(save){
  save.career.facilities??={visits:[],locks:{}};
  save.career.facilities.visits??=[];
  save.career.facilities.locks??={};
  return save.career.facilities;
}
function record(save,id,title,summary){
  const state=ensureState(save);
  state.visits.push({id,title,summary,year:save.career.year,season:save.career.season,month:save.career.month});
  if(state.visits.length>120)state.visits.shift();
  save.career.history.push({type:'facility',year:save.career.year,season:save.career.season,month:save.career.month,title,text:summary});
}
function lock(save,id){if(PHASE_LOCKED.has(id))ensureState(save).locks[phaseKey(save,id)]=true}
export function facilityAvailable(save,id){return !ensureState(save).locks[phaseKey(save,id)]}

export function performFacilityAction(save,club,id){
  if(!facilityAvailable(save,id))return{ok:false,title:'本阶段已经使用',summary:'该设施的本阶段互动已经完成，请推进时间后再来。'};
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  let result;
  if(id==='academy'){
    const focus=save.player.position==='GK'?'pas':save.player.position==='CB'?'def':save.player.position==='ST'?'sho':'pas';
    const gain=Math.round(8+(club.youth-50)*.22+rng.int(0,8));
    save.player.xp[focus]=(save.player.xp[focus]||0)+gain;
    save.status.coachTrust=clamp(save.status.coachTrust+(save.career.squadLevel==='一线队'?1:3),0,100);
    result={ok:true,title:'青训复盘完成',summary:`教练组围绕你的${focus==='sho'?'终结':focus==='def'?'防守':'战术理解'}进行了复盘，获得 ${gain} 点专项经验。`};
  }else if(id==='medical'){
    if(save.status.injury){
      if(save.finance.cash<300)return{ok:false,title:'康复预算不足',summary:'专项康复需要 €300，目前现金不足。可以先完成比赛、商业活动或选择普通恢复训练。'};
      const before=Number(save.status.injury.remainingMatches||1);const reduction=club.youth>=75?2:1;
      save.status.injury.remainingMatches=Math.max(0,before-reduction);save.status.fitness=clamp(save.status.fitness+8,0,100);save.finance.cash=Math.max(0,save.finance.cash-300);
      if(save.status.injury.remainingMatches<=0){save.status.injury=null;result={ok:true,title:'提前通过复出评估',summary:'医疗中心确认你可以恢复完整训练，支付了 €300 康复费用。'}}
      else result={ok:true,title:'康复进度改善',summary:`预计缺阵场次由 ${before} 场降至 ${save.status.injury.remainingMatches} 场，支付了 €300 康复费用。`};
    }else{
      const drop=rng.int(1,3);save.player.hidden.injuryProne=clamp(save.player.hidden.injuryProne-drop,5,95);save.status.fitness=clamp(save.status.fitness+5,0,100);
      result={ok:true,title:'预防性体检完成',summary:`身体状态得到恢复，隐藏伤病倾向下降 ${drop} 点。`};
    }
  }else if(id==='shop'){
    const success=.52+save.fans.sentiment/250+save.fans.commercialValue/500;const good=rng.bool(clamp(success,.35,.88));
    if(good){const social=rng.int(600,2600);const cash=rng.int(500,2600);applyFanChange(save,{club:Math.round(social*.4),social,heat:2,commercial:1,sentiment:2,reason:'球迷商店活动'});save.finance.cash+=cash;result={ok:true,title:'球迷活动反响热烈',summary:`签名活动新增 ${social} 名社交关注，并带来 €${cash} 商业收入。`}}
    else{applyFanChange(save,{club:-120,social:-260,heat:3,sentiment:-3,reason:'球迷商店活动失误'});save.status.morale=clamp(save.status.morale-2,0,100);result={ok:false,title:'活动组织出现混乱',summary:'等待时间过长引发抱怨，球迷情绪和士气受到轻微影响。'}}
  }else if(id==='press'){
    const skill=(save.player.hidden.consistency+save.relations.media.trust+save.status.morale)/300;const good=rng.bool(clamp(.38+skill*.45,.28,.84));
    if(good){const gain=rng.int(900,4200);applyFanChange(save,{social:gain,global:Math.round(gain*.18),heat:4,commercial:1,sentiment:3,reason:'新闻发布厅采访'});applyRelation(save,'media',{trust:4,respect:3,familiarity:2});result={ok:true,title:'采访表达得体',summary:`媒体评价上升，社交关注增加 ${gain}。`}}
    else{applyFanChange(save,{social:-rng.int(120,700),heat:5,sentiment:-5,reason:'采访争议'});applyRelation(save,'media',{trust:-4,conflict:5});save.status.coachTrust=clamp(save.status.coachTrust-2,0,100);result={ok:false,title:'发言引发争议',summary:'一句未经准备的回应被放大，媒体关系和教练信任下降。'}}
  }else if(id==='locker'){
    const good=rng.bool(clamp(.48+save.relations.teammates.familiarity/180-save.relations.teammates.conflict/260,.25,.9));
    if(good){applyRelation(save,'teammates',{trust:4,respect:3,familiarity:5,conflict:-2});save.status.morale=clamp(save.status.morale+4,0,100);result={ok:true,title:'更衣室关系升温',summary:'你主动参与队内沟通，队友信任与士气得到提升。'}}
    else{applyRelation(save,'teammates',{trust:-2,rivalry:4,conflict:4});save.status.morale=clamp(save.status.morale-3,0,100);result={ok:false,title:'沟通没有取得共识',summary:'竞争关系暂时加剧，后续比赛中的队友配合会受到影响。'}}
  }else throw new Error('未知设施互动');
  lock(save,id);record(save,id,result.title,result.summary);save.rng=rng.snapshot();return result;
}
