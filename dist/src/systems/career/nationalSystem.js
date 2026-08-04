import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {applyFanChange} from '../fan/fanSystem.js';
import {applyRelation} from '../relationship/relationshipSystem.js';

export function evaluateNationalTeam(save){
  if(save.career.squadLevel!=='一线队'||save.player.age<17||![4,8].includes(save.career.month))return null;
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const ss=save.career.seasonStats;const threshold=save.player.age<=21?72:76;
  const score=save.player.ovr+(ss.rating-6.5)*5+Math.min(6,ss.goals*.25+ss.assists*.18)+save.fans.mediaHeat*.04;
  if(score<threshold||!rng.bool(clamp((score-threshold+8)/45,.04,.58))){save.rng=rng.snapshot();return null}
  const apps=rng.int(1,3),goals=['ST','LW','RW','SS','CAM'].includes(save.player.position)&&rng.bool(.32)?rng.int(1,2):0;
  save.career.careerStats.nationalApps+=apps;save.career.careerStats.nationalGoals+=goals;applyFanChange(save,{global:1200*apps+goals*4500,social:900*apps+goals*3200,heat:3,commercial:1,sentiment:2,reason:'国家队征召'});applyRelation(save,'nationalCoach',{trust:3,respect:2,familiarity:4});save.career.history.push({type:'national',year:save.career.year,title:'国家队征召',text:`代表${save.player.nation}出场 ${apps} 次${goals?`，打入 ${goals} 球`:''}。`});save.rng=rng.snapshot();return{apps,goals}
}
