import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../src/systems/career/careerSystem.js';
import {APP_VERSION,AUTO_PAUSE_RULES} from '../src/app/config.js';
import {setPaceMode,setSpeed,setAutoPause,setStrategies} from '../src/systems/pace/paceSystem.js';
import {ensureTimeState,advanceCareer,acknowledgeEventDecision,acknowledgeMatchDecision} from '../src/systems/career/timeAdvanceSystem.js';
import {resolveEventChoice} from '../src/systems/event/eventEngine.js';
import {resolveMatch} from '../src/systems/match/matchSystem.js';
import {respondOffer} from '../src/systems/transfer/transferSystem.js';
import {calculateEnding} from '../src/systems/ending/endingSystem.js';

const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const clubs=(await read('../data/clubs.json')).clubs;
const templates=await read('../data/legend-templates.json');
const achievements=await read('../data/achievements.json');
const storyChains=await read('../data/events/story-chains.json');
const repo={clubs,templates,achievements,storyChains,getClub(id){return clubs.find(c=>c.id===id)||clubs[0]},async loadEventCategory(cat){return read(`../data/events/${cat}.json`)}};
function createSimulationSave(){
  const seed='v19-twenty-season-deterministic';
  const talents=createTalentCandidates({seed,position:'CM',style:'????',templates,count:3}),talent=talents.find(x=>x.rarityKey==='legend')||talents[0];
  const offers=generateAcademyOffers({seed,nation:'??',position:'CM',ovr:72,talent,clubs}),academyOffer=offers[0],club=repo.getClub(academyOffer.clubId);
  const save=createNewSave({seed,name:'????????',displayName:'????',nation:'??',age:16,birthDate:'2010-01-01',height:181,weight:73,foot:'??',number:8,position:'CM',style:'????',talent,academyOffer,sourceTemplate:templates.find(x=>x.id===talent.sourceTemplateId),paceMode:'legend'},club,'twenty');
  save.player.attrs={pac:78,sho:74,pas:84,dri:81,def:72,phy:79};save.player.ovr=80;save.player.potential=95;save.player.hidden={...save.player.hidden,professionalism:84,discipline:82,learning:88,consistency:82,bigMatch:78,injuryProne:18};
  save.career.squadLevel='???';save.career.teamRole='??';save.career.contract={...save.career.contract,type:'????',years:4,weeklyWage:16000};save.finance.weeklyWage=16000;save.status.coachTrust=78;save.status.form=72;save.status.fitness=92;save.status.morale=78;
  setPaceMode(save,'legend');setSpeed(save,'turbo');for(const key of Object.keys(AUTO_PAUSE_RULES))setAutoPause(save,key,false);setStrategies(save,{training:'balanced',match:'team',career:'starter'});
  return save;
}
function resolvePending(save){
  if(save.career.pending.event&&!save.career.pending.event.resolved){const event=save.career.pending.event;const choice=event.choices.find(x=>['professional','team','longterm'].includes(x.style))||event.choices[0];resolveEventChoice(save,choice.id);acknowledgeEventDecision(save);return true}
  if(save.career.pending.match&&!save.career.pending.match.resolved){const match=save.career.pending.match;const choice=match.keyChoices.find(x=>['pas','def','phy'].includes(x.focus))||match.keyChoices[0];resolveMatch(save,repo,choice?.id,{presentation:match.importance==='????'?'instant':'timeline'});acknowledgeMatchDecision(save);return true}
  return false;
}
function processOffers(save){
  const active=[...(save.career.pending.offers||[])];if(!active.length)return;
  const transferSeason=[3,7,11,15,19].includes(save.career.season),target=active.find(x=>x.type!=='??');
  if(transferSeason&&target){respondOffer(save,repo,target.id,'accept');return}
  for(const offer of [...(save.career.pending.offers||[])]){try{respondOffer(save,repo,offer.id,offer.type==='??'&&save.career.contract.years<=1?'accept':'reject')}catch{}}
}

const save=createSimulationSave(),errors=[],started=performance.now(),targetSeason=21;
ensureTimeState(save,repo);resolvePending(save);
let safety=0;
while(save.career.season<targetSeason&&!save.career.retirement&&safety<1200){
  safety++;
  try{
    const result=await advanceCareer(save,repo,'week');
    if(result.status==='paused'){
      if(result.reason==='event'||result.reason==='match'){resolvePending(save);continue}
      if(result.reason==='transfer'){processOffers(save);continue}
    }
    processOffers(save);
  }catch(error){errors.push({season:save.career.season,week:save.career.calendar?.week,message:error?.stack||String(error)});break}
}
const elapsedMs=Number((performance.now()-started).toFixed(2));
const matchHistory=save.career.matchHistory||[],eventChoices=save.career.eventMemory?.choices||[],eventIds=eventChoices.map(x=>x.eventId),uniqueEventIds=new Set(eventIds),eventFrequency=Object.fromEntries([...new Set(eventIds)].map(id=>[id,eventIds.filter(x=>x===id).length])),repeatedEventIds=Object.fromEntries(Object.entries(eventFrequency).filter(([,count])=>count>1)),opponents=new Set(matchHistory.map(x=>x.opponentId)),competitionCounts={};
for(const match of matchHistory)competitionCounts[match.competition]=(competitionCounts[match.competition]||0)+1;
const typeCounts={...(save.career.eventMemory?.typeCounts||{})},totalTypeCount=Object.values(typeCounts).reduce((a,b)=>a+b,0)||1,eventTypeShare=Object.fromEntries(Object.entries(typeCounts).map(([k,v])=>[k,Number((v/totalTypeCount*100).toFixed(1))]));
const ending=save.career.retirement||calculateEnding(save,repo),memory=save.career.eventMemory||{},chainsStarted=new Set(memory.chainsStarted||[]),chainsClosed=new Set(memory.chainsClosed||[]),storyChainCompletionRate=chainsStarted.size?Number((chainsClosed.size/chainsStarted.size*100).toFixed(1)):0;
const report={
  status:errors.length?'FAIL':'PASS',version:APP_VERSION,targetSeasons:20,completedSeasons:save.career.season-1,finalAge:save.player.age,finalOvr:save.player.ovr,
  totalMatches:matchHistory.length,differentOpponents:opponents.size,competitionCounts,totalEvents:eventIds.length,uniqueEvents:uniqueEventIds.size,repeatedEvents:eventIds.length-uniqueEventIds.size,repeatRate:eventIds.length?Number(((eventIds.length-uniqueEventIds.size)/eventIds.length*100).toFixed(1)):0,repeatedEventIds,eventTypeShare,
  transfers:save.career.transferHistory.length,clubsRepresented:new Set(save.career.clubHistory).size,storyChainsStarted:chainsStarted.size,storyChainsCompleted:chainsClosed.size,storyChainCompletionRate,majorCareerNodes:(save.career.majorNodes||[]).length,achievements:save.achievements.unlocked.length,finalEnding:ending.name,
  simulationMs:elapsedMs,iterations:safety,consoleErrors:errors.length,errors
};
assert.equal(errors.length,0,JSON.stringify(errors,null,2));
assert.equal(report.completedSeasons,20,'???20???');
assert.ok(report.totalMatches>=400,`??????${report.totalMatches}`);
assert.ok(report.differentOpponents>=25,`???????${report.differentOpponents}`);
assert.ok(report.totalEvents>=70,`???????${report.totalEvents}`);
assert.ok(report.uniqueEvents/report.totalEvents>=.82,`????????${report.uniqueEvents}/${report.totalEvents}`);
assert.ok(Object.keys(report.eventTypeShare).length>=8,'????????');
assert.ok(report.majorCareerNodes>=2,'????????');

const reportDir=new URL('../test-results/',import.meta.url);await fs.mkdir(reportDir,{recursive:true});
const reportJson=new URL('V19_20_SEASON_REPORT.json',reportDir),reportMd=new URL('V19_20_SEASON_REPORT.md',reportDir);
await fs.writeFile(reportJson,JSON.stringify(report,null,2)+'\n');
const typeLines=Object.entries(report.eventTypeShare).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}%`).join('\n');
await fs.writeFile(reportMd,`# V19 ??????????\n\n- ???${report.status}\n- ?????${report.completedSeasons}\n- ?????${report.finalAge}\n- ???????${report.finalOvr}\n- ?????${report.totalMatches}\n- ???????${report.differentOpponents}\n- ?????${report.totalEvents}\n- ??????${report.uniqueEvents}\n- ??????${report.repeatedEvents}\n- ????${report.repeatRate}%\n- ?????${report.transfers}\n- ????????${report.clubsRepresented}\n- ???????${report.storyChainCompletionRate}%?${report.storyChainsCompleted}/${report.storyChainsStarted}?\n- ???????${report.majorCareerNodes}\n- ?????${report.achievements}\n- ?????${report.finalEnding}\n- ?????${report.simulationMs} ms\n- ???/?????${report.consoleErrors}\n\n## ??????\n\n${typeLines}\n\n> ???? Node.js ?????????????????????????????????????????????????????\n`);
console.log(JSON.stringify(report,null,2));
