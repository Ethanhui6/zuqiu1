import {clamp} from '../../utils/format.js';

export function ensureFormMomentum(save){save.career.formMomentum??={value:0,history:[]};save.career.formMomentum.history??=[];return save.career.formMomentum}
export function updateFormMomentum(save,matchResult){
  const state=ensureFormMomentum(save),rating=Number(matchResult?.playerResult?.rating||matchResult?.rating||6),goals=Number(matchResult?.playerResult?.goals||matchResult?.goals||0),assists=Number(matchResult?.playerResult?.assists||matchResult?.assists||0);
  let delta=(rating-6.5)*.65+Math.min(1.5,goals*.55+assists*.35);if(save.status.injury)delta-=.8;
  state.value=clamp(Number((state.value*.78+delta).toFixed(2)),-5,5);state.history.push({season:save.career.season,week:save.career.gameClock?.competitionWeek||1,value:state.value,rating});state.history=state.history.slice(-40);return state.value;
}
export function regressFormMomentum(save){const state=ensureFormMomentum(save);state.value=Number((state.value*.96).toFixed(2));return state.value}
