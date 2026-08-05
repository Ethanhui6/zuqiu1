import {ensureRngState,keyedRandom} from '../../services/rng.js';
import {POSITION_CONFIG} from '../../app/config.js';
import {applyDevelopment} from '../../core/playerDevelopmentEngine.js';

const POOLS={
  attack:[{id:'shot',name:'完成一次射正',check:r=>r.goals>0||r.rating>=7.2},{id:'contribute',name:'贡献进球或助攻',check:r=>r.goals+r.assists>0},{id:'rating',name:'比赛评分达到7.0',check:r=>r.rating>=7}],
  creative:[{id:'assist',name:'创造一次关键得分机会',check:r=>r.assists>0||r.keyPasses>=2},{id:'rating',name:'比赛评分达到7.0',check:r=>r.rating>=7},{id:'team',name:'保持稳定组织表现',check:r=>r.rating>=6.7}],
  midfield:[{id:'key-pass',name:'完成两次关键传球',check:r=>r.keyPasses>=2},{id:'rating',name:'比赛评分达到7.0',check:r=>r.rating>=7},{id:'stable',name:'避免低评分',check:r=>r.rating>=6.5}],
  defense:[{id:'tackle',name:'完成两次关键抢断',check:r=>r.tackles>=2},{id:'clean',name:'帮助球队保持零封',check:r=>r.cleanSheets>0},{id:'rating',name:'比赛评分达到7.0',check:r=>r.rating>=7}],
  keeper:[{id:'saves',name:'完成三次扑救',check:r=>r.saves>=3},{id:'clean',name:'保持零封',check:r=>r.cleanSheets>0},{id:'rating',name:'比赛评分达到7.0',check:r=>r.rating>=7}]
};
export function assignMiniChallenge(save,match){const rngState=ensureRngState(save,{seed:`challenge-${match.id}`}),group=POSITION_CONFIG[save.player.position]?.group||'attack',pool=POOLS[group]||POOLS.attack,rng=keyedRandom(rngState.seed,'mini-challenge',match.id,save.player.position),chosen=rng.pick(pool);match.miniChallenge={id:chosen.id,name:chosen.name,completed:false};return match.miniChallenge}
export function resolveMiniChallenge(save,match){if(!match?.miniChallenge||!match.playerResult)return null;const group=POSITION_CONFIG[save.player.position]?.group||'attack',definition=(POOLS[group]||POOLS.attack).find(x=>x.id===match.miniChallenge.id),completed=Boolean(definition?.check(match.playerResult));match.miniChallenge.completed=completed;if(completed){save.status.coachTrust=Math.min(100,save.status.coachTrust+2);const focus=save.player.position==='GK'?'pac':'pas';match.miniChallenge.growth=applyDevelopment(save,{[focus]:8},{source:'challenge',minutes:match.playerResult.minutes,reason:match.miniChallenge.name});}return match.miniChallenge}
