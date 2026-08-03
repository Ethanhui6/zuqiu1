import assert from 'node:assert/strict';
import {addGameMonths,daysBetween} from '../src/utils/gameDate.js';
import {advanceOneWeek,advanceOneMonth,advanceToSeasonEnd} from '../src/systems/career/timeAdvanceSystem.js';
import {ensureGameClock,setGameDate} from '../src/systems/career/gameClock.js';
import {ensureSchedule} from '../src/systems/schedule/scheduleSystem.js';
import {makeSave,repo} from './v19.1-test-fixture.mjs';

assert.equal(addGameMonths('2026-08-03',1),'2026-09-03');
assert.equal(addGameMonths('2027-01-31',1),'2027-02-28');
assert.equal(addGameMonths('2028-01-31',1),'2028-02-29');
assert.equal(addGameMonths('2026-12-31',1),'2027-01-31');

const week=makeSave({seed:'week',date:'2026-08-03'});
const weekResult=await advanceOneWeek(week,repo);
assert.equal(ensureGameClock(week).currentDate,'2026-08-10');
assert.equal(weekResult.summary.elapsedDays,7);
assert.equal(weekResult.summary.viewModel.title,'本周总结');
assert.equal(weekResult.summary.completedFullTarget,true);

const month=makeSave({seed:'month',date:'2026-08-03'});
const monthResult=await advanceOneMonth(month,repo);
assert.equal(ensureGameClock(month).currentDate,'2026-09-03');
assert.equal(monthResult.summary.elapsedDays,31);
assert.equal(monthResult.summary.viewModel.title,'阶段月报');
assert.equal(monthResult.summary.completedFullTarget,true);
assert.notEqual(monthResult.summary.viewModel.durationLabel,'1周');
assert.equal(monthResult.summary.processedMatches.length,monthResult.summary.statDelta.processedMatchCount);
assert.ok(monthResult.summary.processedMatches.every(m=>daysBetween('2026-08-03',m.date)>=0&&daysBetween(m.date,'2026-09-03')>=0));

const jan=makeSave({seed:'jan',date:'2027-01-31'});
const janResult=await advanceOneMonth(jan,repo);
assert.equal(janResult.summary.plannedEndDate,'2027-02-28');
assert.equal(janResult.summary.actualEndDate,'2027-02-28');
assert.equal(janResult.summary.elapsedDays,28);

const crossYear=makeSave({seed:'year',date:'2026-12-31'});
const crossResult=await advanceOneMonth(crossYear,repo);
assert.equal(crossResult.summary.actualEndDate,'2027-01-31');
assert.equal(crossResult.summary.elapsedDays,31);

const interrupted=makeSave({seed:'interrupt',date:'2026-08-03'});
interrupted.settings.pace.autoPause.transferOffer=true;
let injected=false;
const interruptedResult=await advanceOneMonth(interrupted,repo,{onProgress:({date})=>{
  if(date==='2026-08-11'&&!injected){injected=true;interrupted.career.pending.offers.push({id:'forced-offer',type:'正式转会',status:'待决定',clubId:repo.clubs[1].id,createdDate:date});}
}});
assert.equal(interruptedResult.summary.actualEndDate,'2026-08-11');
assert.equal(interruptedResult.summary.elapsedDays,8);
assert.equal(interruptedResult.summary.interrupted,true);
assert.equal(interruptedResult.summary.viewModel.title,'推进提前暂停');
assert.match(interruptedResult.summary.interruptionReason,/转会|合同/);


const preexisting=makeSave({seed:'preexisting-offer',date:'2026-08-03'});
preexisting.settings.pace.autoPause.transferOffer=true;
preexisting.career.pending.offers.push({id:'offer-before-advance',type:'正式转会',status:'待决定',clubId:repo.clubs[2].id,createdSeason:preexisting.career.season,createdMonth:preexisting.career.month});
const preexistingResult=await advanceOneMonth(preexisting,repo);
assert.equal(preexistingResult.summary.elapsedDays,0);
assert.equal(preexistingResult.summary.actualEndDate,'2026-08-03');
assert.equal(preexistingResult.reason,'transfer');

const season=makeSave({seed:'season',date:'2027-06-20',pace:'legend'});
setGameDate(season,'2027-06-20');season.career.calendar.nextEventDate='2099-12-31';season.career.schedule=null;ensureSchedule(season,repo);
const seasonResult=await advanceToSeasonEnd(season,repo);
assert.equal(seasonResult.summary.plannedEndDate,'2027-06-30');
assert.equal(seasonResult.summary.actualEndDate,'2027-06-30');
assert.equal(seasonResult.summary.elapsedDays,10);
assert.equal(seasonResult.summary.completedFullTarget,true);
assert.equal(ensureGameClock(season).currentDate,'2027-07-01');

for(const result of [weekResult.summary,monthResult.summary,janResult.summary,crossResult.summary,interruptedResult.summary,preexistingResult.summary,seasonResult.summary]){
  assert.equal(result.elapsedDays,daysBetween(result.startDate,result.actualEndDate));
  assert.ok(result.viewModel?.title&&result.viewModel?.subtitle);
}

console.log(JSON.stringify({status:'PASS',week:weekResult.summary,month:{start:monthResult.summary.startDate,end:monthResult.summary.actualEndDate,days:monthResult.summary.elapsedDays,matches:monthResult.summary.processedMatches.length,apps:monthResult.summary.statDelta.matchesPlayed,title:monthResult.summary.viewModel.title},interrupted:{end:interruptedResult.summary.actualEndDate,days:interruptedResult.summary.elapsedDays,reason:interruptedResult.summary.interruptionReason},season:{end:seasonResult.summary.actualEndDate,nextDate:ensureGameClock(season).currentDate}},null,2));
