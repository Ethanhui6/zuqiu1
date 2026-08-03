import {resolveTraining,progressRecovery} from '../training/trainingSystem.js';
import {generateEvent,consumeResolvedEvent,applyDelayedEffects} from '../event/eventEngine.js';
import {generateMatch,consumeMatch} from '../match/matchSystem.js';
import {generateOffers,marketValue,expireOffers} from '../transfer/transferSystem.js';
import {updateCareerStage,advanceSeason,shouldRetire} from './careerSystem.js';
import {evaluateAchievements} from '../achievement/achievementSystem.js';
import {calculateEnding} from '../ending/endingSystem.js';
import {evaluateNationalTeam} from './nationalSystem.js';
import {settleSeasonAwards} from './seasonAwardSystem.js';
import {addGameMonths,compareGameDates} from '../../utils/gameDate.js';
import {ensureGameClock,rollClockToNextSeason,setGameDate} from './gameClock.js';
import {ensureSchedule} from '../schedule/scheduleSystem.js';

// 兼容旧的“阶段制”调用，但日期仍由 GameClock 唯一管理。
export async function beginPhase(save,repo){
  ensureGameClock(save);save.career.phase??={trainingDone:false,eventDone:false,matchDone:false};
  const phase=save.career.phase,club=repo.getClub(save.career.clubId),messages=[];
  if(!phase.trainingDone){phase.trainingResult=resolveTraining(save,club);phase.trainingDone=true;messages.push(`已完成${phase.trainingResult.plan.name}`)}
  if(!save.career.pending.event&&!phase.eventDone)await generateEvent(save,repo);
  return{messages,event:save.career.pending.event};
}
export function markEventDone(save){save.career.phase??={};save.career.phase.eventDone=true}
export function prepareMatch(save,repo){
  save.career.phase??={};if(!save.career.pending.match)generateMatch(save,repo);
  if(!save.career.pending.match){
    const clock=ensureGameClock(save),schedule=ensureSchedule(save,repo),current=repo.getClub(save.career.clubId),opponent=repo.clubs.find(club=>club.id!==current.id&&club.country===current.country)||repo.clubs.find(club=>club.id!==current.id);
    if(!opponent)throw new Error('没有可用的比赛对手');
    const fixture={id:`F-legacy-${clock.currentDate}-${opponent.id}`,season:save.career.season,date:clock.currentDate,week:clock.competitionWeek,round:schedule.fixtures.length+1,roundLabel:'阶段友谊赛',competition:'友谊赛',competitionType:'friendly',opponentId:opponent.id,home:true,importance:'普通比赛',played:false,result:null,opponentSnapshot:{rep:opponent.rep,attack:opponent.attack,defense:opponent.defense,tactic:opponent.tactic||'均衡战术'}};
    schedule.fixtures.push(fixture);generateMatch(save,repo,{fixtureId:fixture.id});
  }
  return save.career.pending.match;
}
export function markMatchDone(save){save.career.phase??={};save.career.phase.matchDone=true}
export function finishPhase(save,repo){
  const phase=save.career.phase;if(!phase?.eventDone||!phase?.matchDone)throw new Error('本阶段还有未完成内容');
  consumeResolvedEvent(save);consumeMatch(save);const delayed=applyDelayedEffects(save),club=repo.getClub(save.career.clubId),recovery=progressRecovery(save,club);
  updateCareerStage(save,club);save.finance.marketValue=marketValue(save,club);expireOffers(save);save.career.phase={trainingDone:false,eventDone:false,matchDone:false};
  const clock=ensureGameClock(save),target=addGameMonths(clock.currentDate,1);let seasonEnded=false,retired=false,seasonAwards=[];
  if(compareGameDates(target,clock.seasonEndDate)>0){
    seasonEnded=true;seasonAwards=settleSeasonAwards(save,club);advanceSeason(save);rollClockToNextSeason(save);save.career.schedule=null;ensureSchedule(save,repo);
    if(shouldRetire(save)){save.career.retirement=calculateEnding(save,repo);retired=true}
  }else setGameDate(save,target);
  const national=evaluateNationalTeam(save),offers=generateOffers(save,repo),achievements=evaluateAchievements(save,repo.achievements);
  return{delayed,recovery,national,offers,achievements,seasonAwards,seasonEnded,retired};
}
