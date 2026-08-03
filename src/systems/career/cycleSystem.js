import {CAREER_SETTINGS} from '../../app/config.js';
import {resolveTraining} from '../training/trainingSystem.js';
import {generateEvent,consumeResolvedEvent,applyDelayedEffects} from '../event/eventEngine.js';
import {generateMatch,consumeMatch} from '../match/matchSystem.js';
import {generateOffers,marketValue,expireOffers} from '../transfer/transferSystem.js';
import {updateCareerStage,advanceSeason,shouldRetire} from './careerSystem.js';
import {evaluateAchievements} from '../achievement/achievementSystem.js';
import {calculateEnding} from '../ending/endingSystem.js';
import {evaluateNationalTeam} from './nationalSystem.js';
import {settleSeasonAwards} from './seasonAwardSystem.js';
import {progressRecovery} from '../training/trainingSystem.js';

export async function beginPhase(save,repo){
  save.career.phase??={trainingDone:false,eventDone:false,matchDone:false};const phase=save.career.phase;const club=repo.getClub(save.career.clubId);const messages=[];
  if(!phase.trainingDone){phase.trainingResult=resolveTraining(save,club);phase.trainingDone=true;messages.push(`已完成${phase.trainingResult.plan.name}`)}
  if(!save.career.pending.event&&!phase.eventDone){await generateEvent(save,repo)}
  return{messages,event:save.career.pending.event};
}
export function markEventDone(save){save.career.phase??={};save.career.phase.eventDone=true}
export function prepareMatch(save,repo){save.career.phase??={};if(!save.career.pending.match)generateMatch(save,repo);return save.career.pending.match}
export function markMatchDone(save){save.career.phase??={};save.career.phase.matchDone=true}
export function finishPhase(save,repo){
  const phase=save.career.phase;if(!phase?.eventDone||!phase?.matchDone)throw new Error('本阶段还有未完成内容');consumeResolvedEvent(save);consumeMatch(save);const delayed=applyDelayedEffects(save);const club=repo.getClub(save.career.clubId);const recovery=progressRecovery(save,club);updateCareerStage(save,club);save.finance.marketValue=marketValue(save,club);save.career.month++;expireOffers(save);save.career.seasonProgress=Math.min(100,Math.round((save.career.month-1)/CAREER_SETTINGS.monthsPerSeason*100));save.career.phase={trainingDone:false,eventDone:false,matchDone:false};
  let seasonEnded=false,retired=false,seasonAwards=[];if(save.career.month>CAREER_SETTINGS.monthsPerSeason){seasonEnded=true;seasonAwards=settleSeasonAwards(save,club);advanceSeason(save);if(shouldRetire(save)){save.career.retirement=calculateEnding(save,repo);retired=true}}
  const national=evaluateNationalTeam(save);const offers=generateOffers(save,repo);const achievements=evaluateAchievements(save,repo.achievements);return{delayed,recovery,national,offers,achievements,seasonAwards,seasonEnded,retired};
}
