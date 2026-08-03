import {saveManager} from './saveManager.js';
import {buildScoreEvidence,calculateCareerScore} from '../../systems/scoring/scoringSystem.js';

export function getLocalLeaderboard(repo,{position='all',retired='all',certified='all',sort='score'}={}){
  const entries=saveManager.list().map(meta=>{
    const save=saveManager.peek(meta.id);if(!save)return null;
    const club=repo.getClub(save.career.clubId),evidence=buildScoreEvidence(save,club.cn),score=calculateCareerScore(evidence);
    return{id:meta.id,name:evidence.player.name,avatar:evidence.player.avatar,nation:evidence.player.nation,club:evidence.career.clubName,clubId:evidence.career.clubId,position:evidence.player.position,age:evidence.player.age,seasons:evidence.career.season,apps:evidence.career.stats.apps,goals:evidence.career.stats.goals,assists:evidence.career.stats.assists,honours:evidence.career.stats.titles,peakOvr:evidence.player.peakOvr,ending:evidence.career.ending,retired:Boolean(evidence.career.ending),score:score.total,grade:score.grade,certified:save.meta?.ranking?.status==='verified',createdAt:save.createdAt,updatedAt:save.updatedAt,current:meta.id===saveManager.currentSlot()};
  }).filter(Boolean).filter(entry=>(position==='all'||entry.position===position)&&(retired==='all'||entry.retired===(retired==='yes'))&&(certified==='all'||entry.certified===(certified==='yes')));
  const comparators={score:(a,b)=>b.score-a.score||b.updatedAt-a.updatedAt,updated:(a,b)=>b.updatedAt-a.updatedAt,apps:(a,b)=>b.apps-a.apps||b.score-a.score,ovr:(a,b)=>b.peakOvr-a.peakOvr||b.score-a.score};
  return entries.sort(comparators[sort]||comparators.score).map((entry,index)=>({...entry,localRank:index+1}));
}
