import assert from 'node:assert/strict';
import {makeSave,repo} from './v19.1-test-fixture.mjs';
import {updateCareerDirector} from '../src/systems/ai/careerAIDirector.js';
import {selectWeeklyPlan,selectWeeklyAction,clearWeeklyActions,currentWeeklyPlan,applyWeeklyPlan} from '../src/systems/planning/weeklyPlanSystem.js';
import {ensureSquadCompetition,updateSquadCompetition} from '../src/systems/squad/squadCompetitionSystem.js';
import {ensureAgent,changeAgent,generateAgentAdvice} from '../src/systems/agent/agentSystem.js';
import {generateStateMessages,unreadMessages,markMessageRead} from '../src/systems/messages/messageCenterSystem.js';
import {generateObjectiveCandidates,selectObjective,objectiveProgress} from '../src/systems/career/objectiveSystem.js';
import {ensureFormMomentum,updateFormMomentum,regressFormMomentum} from '../src/systems/form/formMomentumSystem.js';
import {ensureTraits,evaluateTraits} from '../src/systems/trait/traitSystem.js';
import {simulateWorldMonth} from '../src/systems/world/worldDynamicsSystem.js';
import {shouldPauseForEvent,shouldPauseForMatch} from '../src/systems/pace/paceSystem.js';

const save=makeSave({seed:'ai-director',date:'2026-08-03',pace:'standard'}),club=repo.getClub(save.career.clubId);
const director=updateCareerDirector(save,{force:true});
assert.ok(director.focus?.title&&director.recommendations.length===3);
assert.ok(director.nextReviewDate>director.lastReviewDate);

const objectives=generateObjectiveCandidates(save,{force:true});
assert.equal(objectives.length,3);selectObjective(save,objectives[0].id);assert.equal(objectiveProgress(save).filter(x=>x.active).length,1);

const fitnessBefore=save.status.fitness,trustBefore=save.status.coachTrust;
selectWeeklyPlan(save,'compete');const plan=applyWeeklyPlan(save);assert.equal(plan.actions.length,3);assert.ok(save.status.coachTrust>trustBefore);assert.equal(applyWeeklyPlan(save),null,'同一周不能重复结算计划');
selectWeeklyPlan(save,'recovery');save.career.gameClock.competitionWeek++;save.career.calendar.week++;const recovery=applyWeeklyPlan(save);assert.equal(recovery.id,'recovery');assert.ok(save.status.fitness>=fitnessBefore);


clearWeeklyActions(save);selectWeeklyAction(save,'personalTraining');selectWeeklyAction(save,'recovery');selectWeeklyAction(save,'coach');
assert.equal(currentWeeklyPlan(save).id,'custom');assert.equal(currentWeeklyPlan(save).actions.length,3);
save.career.gameClock.competitionWeek++;save.career.calendar.week++;const custom=applyWeeklyPlan(save);assert.equal(custom.id,'custom');assert.equal(custom.actions.length,3);

const competition=ensureSquadCompetition(save,club);assert.ok(competition.rank>=1&&competition.rank<=5);const rankBefore=competition.rank;save.status.coachTrust=95;save.status.form=95;save.player.ovr=Math.max(save.player.ovr,85);updateSquadCompetition(save,club);assert.ok(save.career.squadCompetition.estimatedChance>=8);assert.ok(save.career.squadCompetition.rank<=rankBefore);

const agent=ensureAgent(save);assert.ok(agent.name);const clubBefore=save.career.clubId;changeAgent(save,'network');const advice=generateAgentAdvice(save);assert.ok(advice.title);assert.equal(save.career.clubId,clubBefore,'经纪人不得自动更换俱乐部');

generateStateMessages(save);const messages=unreadMessages(save);assert.ok(messages.length>=1);markMessageRead(save,messages[0].id);assert.equal(unreadMessages(save).length,messages.length-1);

const momentum=ensureFormMomentum(save);updateFormMomentum(save,{playerResult:{rating:8.2,goals:1,assists:0}});assert.ok(momentum.value>0);const peak=momentum.value;regressFormMomentum(save);assert.ok(Math.abs(momentum.value)<Math.abs(peak));

const traits=ensureTraits(save);save.career.careerStats.bigGames=9;const unlocked=evaluateTraits(save);assert.ok(unlocked.some(x=>x.id==='big-game'));assert.ok(traits.unlocked.includes('big-game'));

const world=simulateWorldMonth(save,repo);assert.ok(Array.isArray(world));assert.equal(simulateWorldMonth(save,repo).length,0,'同一月份世界动态不能重复结算');

const coachEvent={category:'coach',title:'教练沟通',tags:[],pressure:'普通',rarity:'common'};
const finalMatch={competition:'国内杯赛决赛',importance:'冠军争夺战',starts:true};
for(const key of Object.keys(save.settings.pace.autoPause))save.settings.pace.autoPause[key]=true;
save.settings.pace.mode='immersive';assert.equal(shouldPauseForEvent(save,coachEvent),true);
save.settings.pace.mode='fast';assert.equal(shouldPauseForEvent(save,coachEvent),false,'快速模式普通教练沟通不应中断');
save.settings.pace.mode='legend';assert.equal(shouldPauseForEvent(save,coachEvent),false,'传奇速通普通教练沟通不应中断');assert.equal(shouldPauseForMatch(save,finalMatch),true,'传奇速通仍需在决赛暂停');

console.log(JSON.stringify({status:'PASS',director:director.focus,objectives:objectives.map(x=>x.name),weeklyPlans:save.career.weeklyPlan.history.map(x=>x.plan),squadRank:save.career.squadCompetition.rank,agent:save.career.agent.name,messages:messages.length,traits:traits.unlocked,worldItems:world.length},null,2));
