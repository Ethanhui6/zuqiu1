import {addGameDays,compareGameDates,daysBetween,formatGameDateParts,getCalendarWeek,parseGameDate} from '../../utils/gameDate.js';

export const DEFAULT_SEASON_START={month:7,day:1};

export function ageOnDate(birthDate,currentDate){
  const birth=parseGameDate(birthDate),current=parseGameDate(currentDate);
  let age=current.year-birth.year;
  if(current.month<birth.month||(current.month===birth.month&&current.day<birth.day))age--;
  return Math.max(0,age);
}
export function syncPlayerAge(save){
  if(save.player?.birthDate&&save.career?.gameClock?.currentDate)save.player.age=ageOnDate(save.player.birthDate,save.career.gameClock.currentDate);
  return save.player?.age;
}

export function seasonBounds(startYear){
  return{
    seasonStartDate:formatGameDateParts({year:startYear,month:7,day:1}),
    seasonEndDate:formatGameDateParts({year:startYear+1,month:6,day:30}),
    seasonId:`${startYear}-${String(startYear+1).slice(-2)}`
  };
}
export function seasonYearForDate(date){const {year,month}=parseGameDate(date);return month>=7?year:year-1}
export function getSeasonWeek(date,seasonStartDate){return Math.max(1,Math.floor(daysBetween(seasonStartDate,date)/7)+1)}
export function getCompetitionRound(save){
  const date=save.career.gameClock.currentDate,fixtures=save.career.schedule?.fixtures||[];
  return fixtures.filter(item=>item.played&&compareGameDates(item.date||save.career.gameClock.seasonStartDate,date)<=0).length+1;
}
export function phaseForDate(date,bounds){
  const {month}=parseGameDate(date);
  if(compareGameDates(date,bounds.seasonEndDate)>=0)return'season-end';
  if(month===7)return'preseason';
  if(month===1)return'winter-window';
  return'regular-season';
}
export function ensureGameClock(save){
  save.career??={};
  const career=save.career;
  const fallbackStartYear=Number(career.year||2026);
  const legacyWeek=Math.max(1,Number(career.calendar?.week||1));
  const existing=career.gameClock||{};
  const inferredStartYear=existing.seasonStartDate?parseGameDate(existing.seasonStartDate).year:fallbackStartYear;
  const bounds=seasonBounds(inferredStartYear);
  const currentDate=existing.currentDate||addGameDays(bounds.seasonStartDate,(legacyWeek-1)*7);
  const effectiveBounds=compareGameDates(currentDate,bounds.seasonEndDate)>0?seasonBounds(seasonYearForDate(currentDate)):bounds;
  career.gameClock={
    currentDate,
    seasonId:existing.seasonId||effectiveBounds.seasonId,
    seasonStartDate:existing.seasonStartDate||effectiveBounds.seasonStartDate,
    seasonEndDate:existing.seasonEndDate||effectiveBounds.seasonEndDate,
    competitionWeek:Number(existing.competitionWeek||getSeasonWeek(currentDate,effectiveBounds.seasonStartDate)),
    calendarWeek:Number(existing.calendarWeek||getCalendarWeek(currentDate)),
    currentPhase:existing.currentPhase||phaseForDate(currentDate,effectiveBounds),
    currentTransferWindow:existing.currentTransferWindow??null,
    lastProcessedDate:existing.lastProcessedDate||currentDate
  };
  syncPlayerAge(save);
  syncLegacyCalendar(save);
  return career.gameClock;
}
export function setGameDate(save,date,{processed=true}={}){
  const clock=ensureGameClock(save),seasonYear=seasonYearForDate(date),bounds=seasonBounds(seasonYear);
  clock.currentDate=date;clock.seasonId=bounds.seasonId;clock.seasonStartDate=bounds.seasonStartDate;clock.seasonEndDate=bounds.seasonEndDate;
  clock.competitionWeek=getSeasonWeek(date,bounds.seasonStartDate);clock.calendarWeek=getCalendarWeek(date);clock.currentPhase=phaseForDate(date,bounds);
  clock.currentTransferWindow=clock.currentPhase==='preseason'?'summer':clock.currentPhase==='winter-window'?'winter':null;
  if(processed)clock.lastProcessedDate=date;
  syncPlayerAge(save);
  syncLegacyCalendar(save);return clock;
}
export function advanceGameDay(save){const clock=ensureGameClock(save);return setGameDate(save,addGameDays(clock.currentDate,1))}
export function syncLegacyCalendar(save){
  const clock=save.career.gameClock;if(!clock)return;
  const previous=save.career.calendar||{};
  const absoluteWeek=Math.max(1,Math.floor(daysBetween('2026-07-01',clock.currentDate)/7)+1);
  save.career.calendar={...previous,week:clock.competitionWeek,absoluteWeek,nextEventWeek:previous.nextEventWeek||clock.competitionWeek,nextEventDate:previous.nextEventDate||null};
  save.career.month=parseGameDate(clock.currentDate).month;
  save.career.seasonProgress=Math.max(0,Math.min(100,Math.round(daysBetween(clock.seasonStartDate,clock.currentDate)/Math.max(1,daysBetween(clock.seasonStartDate,clock.seasonEndDate))*100)));
}
export function rollClockToNextSeason(save){
  const clock=ensureGameClock(save),nextStart=addGameDays(clock.seasonEndDate,1),bounds=seasonBounds(parseGameDate(nextStart).year);
  save.career.gameClock={currentDate:bounds.seasonStartDate,seasonId:bounds.seasonId,seasonStartDate:bounds.seasonStartDate,seasonEndDate:bounds.seasonEndDate,competitionWeek:1,calendarWeek:getCalendarWeek(bounds.seasonStartDate),currentPhase:'preseason',currentTransferWindow:'summer',lastProcessedDate:bounds.seasonStartDate};
  syncPlayerAge(save);
  syncLegacyCalendar(save);return save.career.gameClock;
}
export function assertClockInvariants(save){
  const clock=ensureGameClock(save);
  if(compareGameDates(clock.currentDate,clock.lastProcessedDate)<0)throw new Error('游戏时间早于最后处理日期');
  const next=(save.career.schedule?.fixtures||[]).find(item=>!item.played);
  if(next?.date&&compareGameDates(next.date,clock.currentDate)<0)throw new Error('下一场比赛日期早于当前日期');
  return true;
}
