import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../src/systems/career/careerSystem.js';
import {PACE_MODES,SPEED_LEVELS,AUTO_PAUSE_RULES} from '../src/app/config.js';
import {setPaceMode,setSpeed,setAutoPause,setStrategies,getPaceMode,getSpeed,shouldPauseForEvent} from '../src/systems/pace/paceSystem.js';
import {ensureTimeState,advanceCareer,acknowledgeEventDecision,acknowledgeMatchDecision} from '../src/systems/career/timeAdvanceSystem.js';
import {generateEvent,resolveEventChoice,consumeResolvedEvent,applyDelayedEffects,eventDiagnostics} from '../src/systems/event/eventEngine.js';
import {generateMatch,resolveMatch} from '../src/systems/match/matchSystem.js';
import {ensureSchedule,scheduleStats,syncScheduleAfterClubChange} from '../src/systems/schedule/scheduleSystem.js';
import {generateObjectiveCandidates,selectObjective,objectiveProgress} from '../src/systems/career/objectiveSystem.js';
import {resolveTraining} from '../src/systems/training/trainingSystem.js';

const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const clubs=(await read('../data/clubs.json')).clubs;
const templates=await read('../data/legend-templates.json');
const achievements=await read('../data/achievements.json');
const storyChains=await read('../data/events/story-chains.json');
const repo={clubs,templates,achievements,storyChains,getClub(id){return clubs.find(c=>c.id===id)||clubs[0]},async loadEventCategory(cat){return read(`../data/events/${cat}.json`)}};
function makeSave(seed='pace-test',position='ST',paceMode='standard'){
  const talents=createTalentCandidates({seed,position,style:'全能前锋',templates,count:3}),talent=talents[0];
  const academy=generateAcademyOffers({seed,nation:'中国',position,ovr:64,talent,clubs}),offer=academy[0],club=repo.getClub(offer.clubId);
  return createNewSave({seed,name:'节奏测试球员',displayName:'节奏测试',nation:'中国',age:17,birthDate:'2009-01-01',height:181,weight:74,foot:'右脚',number:9,position,style:'全能前锋',talent,academyOffer:offer,sourceTemplate:templates.find(t=>t.id===talent.sourceTemplateId),paceMode},club,'pace');
}
function disablePauses(save){for(const key of Object.keys(AUTO_PAUSE_RULES))setAutoPause(save,key,false)}
function resolvePending(save){
  if(save.career.pending.event&&!save.career.pending.event.resolved){const event=save.career.pending.event;resolveEventChoice(save,event.choices[0].id);acknowledgeEventDecision(save);return'event'}
  if(save.career.pending.match&&!save.career.pending.match.resolved){const match=save.career.pending.match;resolveMatch(save,repo,match.keyChoices[0]?.id,{presentation:'instant'});acknowledgeMatchDecision(save);return'match'}
  return null;
}
async function advanceThroughPauses(save,target,max=30){
  let result;
  for(let i=0;i<max;i++){
    result=await advanceCareer(save,repo,target);
    if(result.status!=='paused')return result;
    if(result.reason==='event'||result.reason==='match'){resolvePending(save);continue}
    if(result.reason==='transfer'){save.career.pending.offers=[];continue}
    return result;
  }
  throw new Error(`推进未在${max}轮内结束：${target}`);
}
const passed=[];const check=(name,fn)=>{fn();passed.push(name)};

// 四种职业节奏与五档速度均真实写入状态。
{
  const save=makeSave('modes');
  for(const mode of Object.keys(PACE_MODES)){setPaceMode(save,mode);assert.equal(getPaceMode(save).id,mode)}
  for(const speed of SPEED_LEVELS.map(x=>x.id)){setSpeed(save,speed);assert.equal(getSpeed(save).id,speed)}
  check('四种节奏模式可以切换',()=>assert.equal(Object.keys(PACE_MODES).length,4));
  check('游戏中途速度设置写入存档',()=>assert.equal(save.settings.pace.speed,'turbo'));
}

// 暂停速度不会偷偷推进。
{
  const save=makeSave('pause');ensureTimeState(save,repo);resolvePending(save);setSpeed(save,'paused');const before=structuredClone(save.career.calendar);const result=await advanceCareer(save,repo,'week');
  check('暂停速度阻止时间推进',()=>{assert.equal(result.reason,'paused');assert.deepEqual(save.career.calendar,before)});
}

// 周、月、赛季推进与自动模拟。
{
  const save=makeSave('advance');ensureTimeState(save,repo);resolvePending(save);setPaceMode(save,'legend');setSpeed(save,'turbo');disablePauses(save);
  const week=await advanceThroughPauses(save,'week');check('推进一周正常',()=>assert.equal(week.summary.weeksAdvanced,1));
  const monthStart=save.career.month,month=await advanceThroughPauses(save,'month');check('推进一个月正常',()=>assert.ok(save.career.month!==monthStart||save.career.season>1));
  const seasonStart=save.career.season,season=await advanceThroughPauses(save,'season');check('推进至赛季结束正常',()=>assert.ok(save.career.season>seasonStart));
  check('时间推进生成简洁摘要',()=>assert.ok(season.summary&&Number.isFinite(season.summary.matches)&&season.summary.headline));
  check('推进完成后状态自动记录',()=>assert.ok(save.career.advance.history.length>=3));
  const windowSave=makeSave('window-target');ensureTimeState(windowSave,repo);resolvePending(windowSave);setPaceMode(windowSave,'legend');setSpeed(windowSave,'turbo');disablePauses(windowSave);
  const windowResult=await advanceThroughPauses(windowSave,'window');check('推进至下一个转会窗口正常',()=>assert.ok([1,5].includes(windowSave.career.month)&&windowResult.summary.weeksAdvanced>0));
}

// 关键事件与下一事件、下一比赛主动目标会暂停。
{
  const save=makeSave('critical');ensureTimeState(save,repo);setSpeed(save,'turbo');
  const first=await advanceCareer(save,repo,'nextEvent');check('下一事件会暂停等待玩家决定',()=>assert.equal(first.reason,'event'));
  resolvePending(save);setAutoPause(save,'transferOffer',false);save.career.pending.offers=[];const match=await advanceCareer(save,repo,'nextMatch');check('下一场比赛会暂停等待呈现选择',()=>assert.equal(match.reason,'match'));
  resolvePending(save);
}

// 自动暂停规则必须严格遵守玩家开关，关键类别可以强制生成并保持语义。
{
  const save=makeSave('pause-rules');ensureTimeState(save,repo);resolvePending(save);setPaceMode(save,'standard');
  const coach=await generateEvent(save,repo,{category:'coach'});setAutoPause(save,'coachTalk',false);
  check('关闭教练谈话暂停后标准模式不会隐式暂停',()=>assert.equal(shouldPauseForEvent(save,coach),false));
  setAutoPause(save,'coachTalk',true);check('开启教练谈话暂停后立即生效',()=>assert.equal(shouldPauseForEvent(save,coach),true));
  resolveEventChoice(save,coach.choices[0].id);consumeResolvedEvent(save);
  const injury=await generateEvent(save,repo,{category:'injury'});check('关键伤病事件保持伤病类别而非随机替换',()=>assert.equal(injury.category,'injury'));
}

// 自动训练造成真实伤病时会立刻生成伤病决策并暂停。
{
  const save=makeSave('training-injury-pause');ensureTimeState(save,repo);resolvePending(save);setPaceMode(save,'fast');setSpeed(save,'turbo');disablePauses(save);setAutoPause(save,'injury',true);
  save.career.calendar.week=2;save.career.month=1;save.career.calendar.nextEventWeek=99;save.career.weekState={trainingDone:false,eventDone:false,matchDone:false,trainingResult:null};save.career.strategies.training='physical';save.career.trainingPlan='physical';
  const club=repo.getClub(save.career.clubId);let injuryState=null;
  for(let state=1;state<=500&&!injuryState;state++){const trial=structuredClone(save);trial.rng.state=state;trial.rng.counter=0;if(resolveTraining(trial,club,{scale:.25}).injury)injuryState=state}
  assert.ok(injuryState,'测试范围内应能找到确定性伤病状态');save.rng.state=injuryState;save.rng.counter=0;
  const result=await advanceCareer(save,repo,'week');check('自动训练伤病触发伤病事件并暂停',()=>{assert.equal(result.pauseRule,'injury');assert.equal(result.event.category,'injury');assert.ok(save.status.injury)});
}

// 合同与转会报价分别遵守独立自动暂停规则。
{
  const contractSave=makeSave('contract-pause');ensureTimeState(contractSave,repo);resolvePending(contractSave);setSpeed(contractSave,'turbo');disablePauses(contractSave);setAutoPause(contractSave,'contract',true);
  contractSave.career.pending.offers=[{id:'renew-test',type:'续约',status:'待决定',createdSeason:contractSave.career.season,createdMonth:contractSave.career.month}];
  const contractPause=await advanceCareer(contractSave,repo,'week');check('续约报价按合同规则暂停',()=>assert.equal(contractPause.pauseRule,'contract'));
  const transferSave=makeSave('transfer-pause');ensureTimeState(transferSave,repo);resolvePending(transferSave);setSpeed(transferSave,'turbo');disablePauses(transferSave);setAutoPause(transferSave,'transferOffer',true);
  transferSave.career.pending.offers=[{id:'transfer-test',type:'永久转会',status:'待决定',createdSeason:transferSave.career.season,createdMonth:transferSave.career.month}];
  const transferPause=await advanceCareer(transferSave,repo,'week');check('转会报价按转会规则暂停',()=>assert.equal(transferPause.pauseRule,'transferOffer'));
}

// 赛程确定性、对手生态和青年/一线赛事差异。
{
  const a=makeSave('schedule'),b=structuredClone(a);resolvePending(a);resolvePending(b);const sa=ensureSchedule(a,repo),sb=ensureSchedule(b,repo);
  const shape=s=>s.fixtures.map(f=>[f.week,f.opponentId,f.competitionType,f.home,f.importance]);
  check('同存档赛程刷新保持一致',()=>assert.deepEqual(shape(sa),shape(sb)));
  const stats=scheduleStats(a);check('单赛季拥有足够不同对手',()=>assert.ok(stats.differentOpponents>=10));
  check('青年队使用青年赛事',()=>assert.ok(sa.fixtures.some(f=>f.competitionType==='youth-league')));
  a.career.squadLevel='一线队';a.career.schedule=null;const first=ensureSchedule(a,repo);check('一线队使用国内联赛和杯赛',()=>assert.ok(first.fixtures.some(f=>f.competitionType==='league')&&first.fixtures.some(f=>f.competitionType==='cup')));
  const oldClub=a.career.clubId,newClub=clubs.find(c=>c.id!==oldClub&&c.leagueId!==repo.getClub(oldClub).leagueId)||clubs.find(c=>c.id!==oldClub);a.career.clubId=newClub.id;syncScheduleAfterClubChange(a,repo);check('转会后赛程同步新俱乐部',()=>assert.equal(a.career.schedule.clubId,newClub.id));
}

// 三种比赛呈现方式均由同一真实比赛状态结算。
{
  const base=makeSave('presentations');resolvePending(base);const schedule=ensureSchedule(base,repo),fixture=schedule.fixtures[0];
  for(const presentation of ['instant','timeline','interactive']){
    const save=structuredClone(base);save.career.calendar.week=fixture.week;const match=generateMatch(save,repo,{fixtureId:fixture.id});const result=resolveMatch(save,repo,match.keyChoices[0]?.id,{presentation});
    check(`比赛呈现-${presentation}正常结算`,()=>{assert.equal(result.presentation,presentation);assert.ok(Array.isArray(result.score)&&result.resolved);assert.ok(save.career.matchHistory.some(x=>x.id===result.id))});
  }
}

// 已生成内容写入存档状态后，重载同一状态不会重新抽取。
{
  const source=makeSave('reload-stability');ensureTimeState(source,repo);resolvePending(source);const a=structuredClone(source),b=structuredClone(source);
  const eventA=await generateEvent(a,repo),eventB=await generateEvent(b,repo);
  check('刷新等价重载后事件与选项保持一致',()=>assert.deepEqual({id:eventA.id,choices:eventA.choices.map(x=>x.id),rng:a.rng},{id:eventB.id,choices:eventB.choices.map(x=>x.id),rng:b.rng}));
}

// 事件不是固定五项，选择会造成真实不同状态，记忆和延迟后果持久化。
{
  const base=makeSave('event-diff','CAM');ensureTimeState(base,repo);const event=base.career.pending.event;
  check('事件选项数量为2至5且不是固定五项',()=>assert.ok(event.choices.length>=2&&event.choices.length<=5));
  if(event.choices.length>=2){const a=structuredClone(base),b=structuredClone(base);resolveEventChoice(a,a.career.pending.event.choices[0].id);resolveEventChoice(b,b.career.pending.event.choices[1].id);check('不同事件选项产生不同结果状态',()=>assert.notDeepEqual({status:a.status,relations:a.relations,finance:a.finance,choice:a.career.eventMemory.choices.at(-1)},{status:b.status,relations:b.relations,finance:b.finance,choice:b.career.eventMemory.choices.at(-1)}))}
  resolveEventChoice(base,event.choices[0].id);acknowledgeEventDecision(base);const diag=eventDiagnostics(base);check('事件记忆记录触发与选择结构',()=>assert.ok(diag.recentCount>=1&&base.career.eventMemory.triggered.length>=1&&base.career.eventMemory.recentChoiceSignatures.length>=1));
  base.career.pending.delayedEffects.push({id:'test-delay',dueSeason:base.career.season,type:'fans',amount:321,source:'测试'});const before=base.fans.social;applyDelayedEffects(base);check('延迟后果按到期时间触发',()=>assert.equal(base.fans.social,before+321));
}


// 连续剧情会真正继续并结束，而不是只保存一个无效标记。
{
  const save=makeSave('story-chain','ST');ensureTimeState(save,repo);const opening=save.career.pending.event;
  const firstChoice=opening.choices[0];resolveEventChoice(save,firstChoice.id);const root=firstChoice.unlockChain;acknowledgeEventDecision(save);
  const follow=await generateEvent(save,repo);check('开局选择会生成对应后续剧情',()=>assert.equal(follow.chainId,root));
  const branchChoice=follow.choices[0];resolveEventChoice(save,branchChoice.id);const branch=branchChoice.unlockChain;consumeResolvedEvent(save);
  let finale=await generateEvent(save,repo);if(!finale.endChain){resolveEventChoice(save,finale.choices[0].id);consumeResolvedEvent(save);finale=await generateEvent(save,repo)}check('剧情分支会继续到结局节点',()=>assert.ok(finale.endChain&&finale.prerequisite.includes(branch)));
  resolveEventChoice(save,finale.choices[0].id);consumeResolvedEvent(save);check('剧情链结束状态写入存档',()=>assert.ok(save.career.eventMemory.chainsClosed.includes(root)&&!save.career.eventMemory.chainsOpen.some(x=>x.startsWith(root))));
}

// 阶段目标与自动策略连接游戏状态。
{
  const save=makeSave('objectives','CM');const candidates=generateObjectiveCandidates(save);selectObjective(save,candidates[0].id);setStrategies(save,{training:'passing',match:'team',career:'starter'});
  check('阶段目标可选择并展示真实进度',()=>assert.ok(objectiveProgress(save).some(x=>x.active)));
  check('自动训练比赛职业策略写入存档',()=>assert.deepEqual(save.career.strategies,{training:'passing',match:'team',career:'starter'}));
}

// 关键源码无直接随机数。
{
  const sources=await Promise.all(['../src/systems/career/timeAdvanceSystem.js','../src/systems/event/eventEngine.js','../src/systems/match/matchSystem.js','../src/systems/schedule/scheduleSystem.js','../src/systems/transfer/transferSystem.js'].map(p=>fs.readFile(new URL(p,import.meta.url),'utf8')));
  check('重大结果没有直接使用Math.random',()=>assert.equal(sources.join('\n').includes('Math.random'),false));
}

console.log(JSON.stringify({status:'PASS',passed:passed.length,cases:passed},null,2));
