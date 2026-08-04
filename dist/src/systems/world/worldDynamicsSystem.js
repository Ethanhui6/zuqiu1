import {ensureRngState,keyedRandom} from '../../services/rng.js';
import {ensureGameClock} from '../career/gameClock.js';

export function ensureWorldDynamics(save){save.career.worldDynamics??={lastMonth:null,items:[],clubStates:{}};save.career.worldDynamics.items??=[];save.career.worldDynamics.clubStates??={};return save.career.worldDynamics}
export function simulateWorldMonth(save,repo){
  const state=ensureWorldDynamics(save),clock=ensureGameClock(save),monthKey=clock.currentDate.slice(0,7);if(state.lastMonth===monthKey)return[];
  const rngState=ensureRngState(save,{seed:`world-${save.career?.clubId||'unknown'}`});
  const rng=keyedRandom(rngState.seed,'world-month',monthKey,save.career.clubId),current=repo.getClub(save.career.clubId),items=[];
  const candidates=rng.shuffle(repo.clubs.filter(c=>c.country===current.country&&c.id!==current.id)).slice(0,3);
  for(const club of candidates){const form=rng.int(-3,3),change=rng.pick(['阵型调整','青训新星进入一线队','同位置新援加盟','教练组调整','财政预算变化']);state.clubStates[club.id]={form,lastChange:change,month:monthKey};items.push({date:clock.currentDate,clubId:club.id,title:`${club.cn}：${change}`,impact:form})}
  if(rng.bool(.35))items.push({date:clock.currentDate,clubId:current.id,title:rng.pick(['主教练调整常用阵型','队内核心进入续约谈判','青年队新星获得提拔','同位置引援进入考察阶段']),impact:rng.int(-2,2)});
  state.items.unshift(...items);state.items=state.items.slice(0,80);state.lastMonth=monthKey;return items;
}
