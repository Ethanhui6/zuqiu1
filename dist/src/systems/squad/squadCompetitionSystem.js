import {ensureRngState,keyedRandom} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {ensureGameClock} from '../career/gameClock.js';

function seedCompetitors(save,club,state,clock){
  const rngState=ensureRngState(save,{seed:`squad-${clock.seasonId}-${club.id}`});
  const rng=keyedRandom(rngState.seed,'squad-competition',clock.seasonId,club.id,save.player.position);
  const labels=['当前首发','第一替补','青年竞争者','潜在新援'],ranges=[[-1,5],[-4,2],[-8,0],[-4,6]],base=Math.max(club.rep-2,save.player.ovr-2);
  state.competitors=labels.map((role,index)=>({id:`rival-${index}`,name:index===0?'队内主力':index===1?'主要替补':index===2?'青年新星':'潜在新援',role,ovr:clamp(Math.round(base+rng.int(ranges[index][0],ranges[index][1])),45,92),form:rng.int(42,78),coachPreference:rng.int(40,82),tacticalFit:rng.int(45,84),unavailable:false,status:'正常'}));
  state.seasonId=clock.seasonId;state.lastDynamicsDate=null;state.history=[];
}
function updateRivalDynamics(save,state,clock){
  if(state.lastDynamicsDate===clock.currentDate)return;
  const rngState=ensureRngState(save,{seed:`squad-dynamics-${state.seasonId}`});
  const rng=keyedRandom(rngState.seed,'squad-dynamics',clock.currentDate,save.career.clubId,save.player.position);
  for(const item of state.competitors){
    item.form=clamp(item.form+rng.int(-5,5),25,92);item.coachPreference=clamp(item.coachPreference+rng.int(-2,2),25,92);item.tacticalFit=clamp(item.tacticalFit+rng.int(-2,2),30,94);
    item.unavailable=rng.bool(.018);item.status=item.unavailable?'短期缺阵':item.form>=78?'状态出色':item.form<=42?'状态低迷':'正常';
  }
  if(clock.currentDate.slice(8,10)==='01'&&rng.bool(.18)){
    const newcomer=state.competitors.find(item=>item.role==='潜在新援');if(newcomer){newcomer.ovr=clamp(newcomer.ovr+rng.int(0,3),45,94);newcomer.coachPreference=clamp(newcomer.coachPreference+rng.int(2,7),25,95);newcomer.status='新援进入考察'}
  }
  state.lastDynamicsDate=clock.currentDate;
}
export function ensureSquadCompetition(save,club){
  save.career.squadCompetition??={seasonId:null,competitors:[],rank:4,lastUpdatedDate:null,lastDynamicsDate:null,history:[]};
  const state=save.career.squadCompetition,clock=ensureGameClock(save);state.history??=[];
  if(state.seasonId!==clock.seasonId||state.competitors.length<3)seedCompetitors(save,club,state,clock);
  return updateSquadCompetition(save,club);
}
export function updateSquadCompetition(save,club){
  const state=save.career.squadCompetition||ensureSquadCompetition(save,club),clock=ensureGameClock(save);updateRivalDynamics(save,state,clock);
  const versatile=(save.career.traits?.unlocked||[]).includes('versatile')?4:0,formMomentum=Number(save.career.formMomentum?.value||0)*2;
  const ratingContribution=Math.max(0,Number(save.career.seasonStats.rating||6)-5.5)*4;
  const playerScore=save.player.ovr*.48+save.status.form*.18+save.status.fitness*.08+save.status.coachTrust*.18+ratingContribution+versatile+formMomentum;
  const ranked=[{id:'player',name:save.player.name,score:playerScore,isPlayer:true},...state.competitors.map(item=>({...item,score:item.ovr*.5+item.form*.2+item.coachPreference*.2+item.tacticalFit*.1-(item.unavailable?35:0)}))].sort((a,b)=>b.score-a.score);
  const previous=state.rank||4;state.rank=ranked.findIndex(item=>item.isPlayer)+1;state.lastUpdatedDate=clock.currentDate;state.estimatedChance=clamp(Math.round(92-(state.rank-1)*23+(save.status.coachTrust-50)*.25+formMomentum),8,94);
  if(previous!==state.rank){state.history.push({date:clock.currentDate,from:previous,to:state.rank,reason:state.rank<previous?'训练和状态推动顺位上升':'竞争者状态或自身表现导致顺位下降'});state.history=state.history.slice(-80)}
  state.ranked=ranked.map(item=>({id:item.id,name:item.name,score:Number(item.score.toFixed(1)),isPlayer:Boolean(item.isPlayer),status:item.status||'正常'}));return state;
}
