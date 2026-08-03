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
  const seed='v18.7-twenty-season-deterministic';
  const talents=createTalentCandidates({seed,position:'CM',style:'全能中场',templates,count:3}),talent=talents.find(x=>x.rarityKey==='legend')||talents[0];
  const offers=generateAcademyOffers({seed,nation:'中国',position:'CM',ovr:72,talent,clubs}),academyOffer=offers[0],club=repo.getClub(academyOffer.clubId);
  const save=createNewSave({seed,name:'二十赛季测试球员',displayName:'测试球员',nation:'中国',age:16,birthDate:'2010-01-01',height:181,weight:73,foot:'双足',number:8,position:'CM',style:'全能中场',talent,academyOffer,sourceTemplate:templates.find(x=>x.id===talent.sourceTemplateId),paceMode:'legend'},club,'twenty');
  save.player.attrs={pac:78,sho:74,pas:84,dri:81,def:72,phy:79};save.player.ovr=80;save.player.potential=95;save.player.hidden={...save.player.hidden,professionalism:84,discipline:82,learning:88,consistency:82,bigMatch:78,injuryProne:18};
  save.career.squadLevel='一线队';save.career.teamRole='主力';save.career.contract={...save.career.contract,type:'职业合同',years:4,weeklyWage:16000};save.finance.weeklyWage=16000;save.status.coachTrust=78;save.status.form=72;save.status.fitness=92;save.status.morale=78;
  setPaceMode(save,'legend');setSpeed(save,'turbo');for(const key of Object.keys(AUTO_PAUSE_RULES))setAutoPause(save,key,false);setStrategies(save,{training:'balanced',match:'team',career:'starter'});
  return save;
}
function resolvePending(save){
  if(save.career.pending.event&&!save.career.pending.event.resolved){const event=save.career.pending.event;const choice=event.choices.find(x=>['professional','team','longterm'].includes(x.style))||event.choices[0];resolveEventChoice(save,choice.id);acknowledgeEventDecision(save);return true}
  if(save.career.pending.match&&!save.career.pending.match.resolved){const match=save.career.pending.match;const choice=match.keyChoices.find(x=>['pas','def','phy'].includes(x.focus))||match.keyChoices[0];resolveMatch(save,repo,choice?.id,{presentation:match.importance==='普通联赛'?'instant':'timeline'});acknowledgeMatchDecision(save);return true}
  return false;
}
function processOffers(save){
  const active=[...(save.career.pending.offers||[])];if(!active.length)return;
  const transferSeason=[3,7,11,15,19].includes(save.career.season),target=active.find(x=>x.type!=='续约');
  if(transferSeason&&target){respondOffer(save,repo,target.id,'accept');return}
  for(const offer of [...(save.career.pending.offers||[])]){try{respondOffer(save,repo,offer.id,offer.type==='续约'&&save.career.contract.years<=1?'accept':'reject')}catch{}}
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
assert.equal(report.completedSeasons,20,'未完成20个赛季');
assert.ok(report.totalMatches>=400,`比赛数不足：${report.totalMatches}`);
assert.ok(report.differentOpponents>=25,`不同对手不足：${report.differentOpponents}`);
assert.ok(report.totalEvents>=70,`事件数量不足：${report.totalEvents}`);
assert.ok(report.uniqueEvents/report.totalEvents>=.82,`事件唯一率过低：${report.uniqueEvents}/${report.totalEvents}`);
assert.ok(Object.keys(report.eventTypeShare).length>=8,'事件类型分布不足');
assert.ok(report.majorCareerNodes>=2,'重大职业节点不足');

const reportJson=new URL('../docs/V18_7_20_SEASON_REPORT.json',import.meta.url),reportMd=new URL('../docs/V18_7_20_SEASON_REPORT.md',import.meta.url);
await fs.writeFile(reportJson,JSON.stringify(report,null,2)+'\n');
const typeLines=Object.entries(report.eventTypeShare).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}%`).join('\n');
await fs.writeFile(reportMd,`# V18.7 二十赛季自动模拟报告\n\n- 状态：${report.status}\n- 完成赛季：${report.completedSeasons}\n- 最终年龄：${report.finalAge}\n- 最终综合能力：${report.finalOvr}\n- 总比赛数：${report.totalMatches}\n- 不同对手数量：${report.differentOpponents}\n- 总事件数：${report.totalEvents}\n- 唯一事件数：${report.uniqueEvents}\n- 重复事件数：${report.repeatedEvents}\n- 重复率：${report.repeatRate}%\n- 转会次数：${report.transfers}\n- 效力俱乐部数量：${report.clubsRepresented}\n- 剧情链完成率：${report.storyChainCompletionRate}%（${report.storyChainsCompleted}/${report.storyChainsStarted}）\n- 重大职业节点：${report.majorCareerNodes}\n- 成就数量：${report.achievements}\n- 最终结局：${report.finalEnding}\n- 模拟耗时：${report.simulationMs} ms\n- 控制台/模拟错误：${report.consoleErrors}\n\n## 事件类型占比\n\n${typeLines}\n\n> 本报告由 Node.js 确定性自动模拟生成，用于验证长期状态、赛程、事件、存档随机序列和职业节点；不等同于实体手机浏览器性能测试。\n`);
console.log(JSON.stringify(report,null,2));
