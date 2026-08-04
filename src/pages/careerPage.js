import {el,button,clear} from '../utils/dom.js';
import {openSheet,closeSheet} from '../components/sheet.js';
import {showToast} from '../components/toast.js';
import {createRadarChart} from '../components/radarChart.js';
import {createClubCrest} from '../components/clubCrest.js';
import {createPlayerCard} from '../components/playerCard.js';
import {createEventCard} from '../components/eventCard.js';
import {createDevelopmentDelta} from '../components/developmentDelta.js';
import {formatMoney,formatNumber,percent,safeText} from '../utils/format.js';
import {formatGameDate,daysBetween} from '../utils/gameDate.js';
import {resolveEventChoice} from '../systems/event/eventEngine.js';
import {advanceCareer,acknowledgeEventDecision,ensureTimeState} from '../systems/career/timeAdvanceSystem.js';
import {generateObjectiveCandidates,objectiveProgress,selectObjective} from '../systems/career/objectiveSystem.js';
import {upcomingFixtures,scheduleStats} from '../systems/schedule/scheduleSystem.js';
import {getSpeed} from '../systems/pace/paceSystem.js';
import {totalFans} from '../systems/fan/fanSystem.js';
import {ADVANCE_TARGETS,POSITION_CONFIG} from '../app/config.js';
import {animationDirector} from '../animations/director/animationDirector.js';
import {ensureSquadCompetition} from '../systems/squad/squadCompetitionSystem.js';
import {generateStateMessages,markMessageRead,unreadMessages} from '../systems/messages/messageCenterSystem.js';
import {updateCareerDirector} from '../systems/ai/careerAIDirector.js';
import {deferAttention,primaryAttention,markAttentionRead,markSectionViewed} from '../systems/attention/attentionManager.js';
import {buildAnalysisSeries,chooseMedicalPlan,facilitySummaries,lockerActions,markAnalysisViewed,markHonoursViewed,medicalPlans,resolveLockerAction} from '../systems/facility/facilityExperienceSystem.js';
import {traitDefinitions} from '../systems/trait/traitSystem.js';

export function renderCareerPage(container,ctx){
  const {store,repo,navigate}=ctx,save=store.state,club=repo.getClub(save.career.clubId);
  ensureTimeState(save,repo);generateObjectiveCandidates(save);generateStateMessages(save);ensureSquadCompetition(save,club);updateCareerDirector(save);
  clear(container);
  const page=el('section',{className:'page career-page v20-career-page'});
  const attention=primaryAttention(save,repo);
  const identity=el('section',{className:'v20-career-identity',attrs:{'data-section':'identity'}},[createPlayerCard(save,club,{variant:'compact'})]);
  identity.addEventListener('click',()=>openPlayerDetail(save,club));
  const actions=el('section',{className:'v20-career-actions',attrs:{'data-section':'actions'}},[
    focusCard(attention,()=>handleAttention(attention),()=>{
      store.update(state=>deferAttention(state,attention),'attention-deferred');
      ctx.refresh();
    })
  ]);
  if(save.career.pending?.event&&!save.career.pending.event.resolved)actions.append(createEventCard(save.career.pending.event,{onChoose:choice=>chooseEvent(choice,save.career.advance?.resumeTarget||null)}));
  page.append(identity,careerConsole(save,club,repo,()=>openCareerData(save,club,repo)),careerGrowth(save),actions);
  container.append(page);

  function handleAttention(item){
    store.update(state=>markAttentionRead(state,item.id),'attention-read');
    if(item.action==='event'&&save.career.pending?.event){showEvent(save.career.pending.event,save.career.advance?.resumeTarget||null);return}
    if(item.action==='objective'){openObjectiveSheet(save,store,ctx);return}
    if(item.action==='medical'){openMedicalCenter(save,club,ctx);return}
    if(item.action==='honours'){openHonoursRoom(save,club,ctx);return}
    if(item.action==='messages'){openMessages(save,ctx);return}
    navigate(item.route||'career');
  }

  async function runAdvance(target){
    if(getSpeed(save).id==='paused'){showToast('当前处于暂停状态，请先调整职业节奏',{type:'error'});ctx.openPaceSettings?.();return}
    const controller=new AbortController(),visual=progressView(save,target);let progressHandle;
    progressHandle=openSheet({title:'时间正在推进',subtitle:ADVANCE_TARGETS.find(x=>x.id===target)?.label||'职业生涯',content:visual.root,dismissible:false,actions:[{label:'停止推进',className:'button button--danger',close:false,onClick:()=>{controller.abort();visual.status.textContent='正在停止…';return false}}]});
    try{
      save.career.advance.resumeTarget=target;
      const result=await advanceCareer(save,repo,target,{signal:controller.signal,onProgress:visual.update});
      store.update(()=>{},'career-advanced',result);progressHandle.close();
      await animationDirector.play('calendar-flip',{id:`${result.summary?.requestId||save.career.calendar.absoluteWeek}:${target}`,from:result.summary?.startDate||'当前',to:result.summary?.actualEndDate||save.career.gameClock.currentDate,label:result.summary?.headline||'时间推进完成'},{token:`career-calendar:${result.summary?.requestId||save.career.calendar.absoluteWeek}:${target}`});
      if(result.reason==='event'){showEvent(result.event,target,result.summary);return}
      if(result.reason==='training'){showToast('自动训练已关闭，请先完成本周训练');navigate('training');return}
      if(result.reason==='match'){showToast('已在重要比赛前暂停');navigate('match');return}
      if(result.reason==='transfer'){showToast('收到新的转会报价，时间已自动暂停',{type:'success'});navigate('transfer');return}
      if(result.reason==='retirement'){showRetirement(save.career.retirement);return}
      showAdvanceSummary(result.summary);
    }catch(error){progressHandle?.close();save.career.advance.running=false;store.update(()=>{},'advance-error');showToast(error.message||'时间推进失败',{type:'error'})}
  }

  function showEvent(event,resumeTarget=null,advanceSummary=null){
    if(!event){showToast('事件生成失败',{type:'error'});return}
    const content=createEventCard(event,{onChoose:choice=>chooseEvent(choice,resumeTarget)});
    openSheet({title:'关键职业事件',subtitle:advanceSummary?.viewModel?.interruptionLabel||formatGameDate(save.career.gameClock.currentDate),content,dismissible:false,size:'large'});
  }

  async function chooseEvent(choice,resumeTarget){
    try{
      const result=resolveEventChoice(save,choice.id);acknowledgeEventDecision(save);store.update(()=>{},'event-resolved',result);
      await animationDirector.play('dice-roll',{id:result.eventId,value:Math.max(1,Math.min(6,Math.round((result.outcome.roll||50)/17))),label:result.outcome.label},{token:`event:${result.eventId}:${choice.id}`});
      const content=el('div',{className:'v20-result-card'},[el('div',{className:`result-orb result-orb--${result.outcome.label==='出现代价'?'bad':'good'}`,text:result.outcome.label}),el('h3',{text:result.choice.text}),el('p',{text:outcomeText(result.outcome)}),effectGrid(result.outcome.effects),el('p',{className:'muted',text:'结果已经写入存档；隐藏影响会在后续职业节点中继续生效。'})]);
      openSheet({title:'选择结果',subtitle:'状态已保存',content,dismissible:false,actions:[{label:resumeTarget?'继续推进':'留在生涯首页',className:'button button--primary',onClick:()=>resumeTarget?runAdvance(resumeTarget):ctx.refresh()}]});
    }catch(error){showToast(error.message||'事件结算失败',{type:'error'})}
  }

  function showAdvanceSummary(summary){
    const vm=summary.viewModel||{};
    openSheet({title:vm.title||summary.title||'阶段推进总结',subtitle:vm.subtitle||summary.subtitle||'',content:summaryCard(summary),actions:[{label:'留在当前页面',className:'button button--secondary',onClick:()=>ctx.refresh()},{label:'继续规划',className:'button button--primary',onClick:()=>ctx.refresh()}]});
  }

  if(save.career.pending.event&&!save.career.pending.event.resolved)requestAnimationFrame(()=>showEvent(save.career.pending.event,save.career.advance?.resumeTarget||null));
  return()=>{};
}

function focusCard(attention,onActivate,onDefer){
  const deferButton=attention.level==='urgent'?null:button('稍后处理',{className:'button button--secondary',onClick:event=>{event.stopPropagation();onDefer?.()}});
  const card=el('div',{className:`v20-focus-card v20-focus-card--${attention.level}`,attrs:{role:'button',tabindex:'0','aria-label':attention.title}},[
    el('span',{className:'v20-focus-icon',text:attention.icon,attrs:{'aria-hidden':'true'}}),
    el('span',{className:'v20-focus-copy'},[el('small',{text:attention.level==='urgent'?'现在需要处理':attention.level==='important'?'重要提醒':'当前重点'}),el('strong',{text:attention.title}),el('p',{text:attention.detail}),...(deferButton?[deferButton]:[])]),
    el('span',{className:'v20-focus-arrow',text:'›',attrs:{'aria-hidden':'true'}})
  ]);
  card.addEventListener('click',onActivate);
  card.addEventListener('keydown',event=>{if(event.target===card&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onActivate?.()}});
  return card;
}

function careerConsole(save,club,repo,onOpen){
  const stats=save.career.seasonStats,next=upcomingFixtures(save,repo,1)[0],opponent=next?repo.getClub(next.opponentId):null,countdown=nextMatchCountdown(save,repo);
  return button('',{className:'v20-career-console',dataset:{section:'console'},onClick:onOpen},[
    el('small',{className:'v20-console-date',text:`${formatGameDate(save.career.gameClock.currentDate)} · ${save.career.gameClock.seasonId}赛季 · 第${save.career.gameClock.competitionWeek}周`}),
    el('div',{className:'v20-console-player'},[el('strong',{text:`${save.player.displayName||save.player.name} · ${save.player.age}岁`}),el('span',{text:`赛季 ${save.career.seasonProgress}%`})]),
    el('div',{className:'v20-stat-grid'},[stat('出场',stats.apps),stat('进球',stats.goals),stat('助攻',stats.assists),stat('评分',stats.rating||'—')]),
    el('div',{className:'v20-next-match'},[el('small',{text:'下一场'}),el('strong',{text:opponent?opponent.cn:'等待新赛季'}),el('span',{text:next?`${countdown}天后 · ${next.competition} · ${next.home?'主场':'客场'}`:'赛程已结束'})]),
    compactProgress('体能',save.status.fitness),compactProgress('士气',save.status.morale),compactProgress('信任',save.status.coachTrust)
  ])
}

function careerGrowth(save){
  const training=save.career.weekState?.trainingResult,match=save.career.lastMatchResult;
  const gains=(training?.gains||[]).map(item=>({label:attrLabel(item.key),value:`+${item.levels}`,tone:'positive'}));
  const trainingItems=training?[{label:'训练计划',value:training.plan?.name||save.career.trainingPlan},{label:'成长倍率',value:`${training.multiplier}x`},...(training.injury?[{label:'训练伤病',value:training.injury.name,tone:'negative'}]:[])]:[];
  const matchItems=(match?.statusChanges||[]).filter(item=>item.delta!==null&&item.delta!==0).map(item=>({label:item.label,value:`${item.delta>0?'+':''}${item.delta}`,tone:item.delta>0?'positive':'negative'}));
  const traits=new Map(traitDefinitions().map(item=>[item.id,item])),skillItems=(save.career.traits?.unlocked||[]).map(skill=>{const trait=traits.get(skill.id||skill);return{label:trait?.name||skill.name||skill,value:'已解锁',tone:'positive'}});
  return el('section',{className:'v20-career-growth',attrs:{'data-section':'growth'}},[
    el('div',{className:'v20-section-heading'},[el('div',{},[el('small',{text:'成长反馈'}),el('h2',{text:'本周发展'})]),el('span',{text:`OVR ${save.player.ovr}`})]),
    createRadarChart(save.player.attrs,save.player.position,{size:220}),
    el('div',{className:'v20-career-growth__deltas'},[
      createDevelopmentDelta({title:'最近属性提升',items:gains,emptyText:'本周尚无属性提升'}),
      createDevelopmentDelta({title:'训练效果',items:trainingItems,emptyText:'本周尚无训练结果'}),
      createDevelopmentDelta({title:'比赛成长',items:matchItems,emptyText:'最近比赛没有状态变化'}),
      createDevelopmentDelta({title:'技能解锁',items:skillItems,emptyText:'尚未解锁职业技能'})
    ])
  ]);
}

export function nextMatchCountdown(save,repo){
  const next=upcomingFixtures(save,repo,1)[0];
  return next?Math.max(0,daysBetween(save.career.gameClock.currentDate,next.date)):0;
}

function openPlayerDetail(save,club){
  const p=save.player,content=el('div',{className:'v20-player-detail'},[
    createPlayerCard(save,club,{variant:'detail'}),
    el('div',{className:'v20-metric-grid'},[stat('身价',formatMoney(save.finance.marketValue)),stat('周薪',formatMoney(save.finance.weeklyWage)),stat('合同',`${save.career.contract.years}年`),stat('粉丝',formatNumber(totalFans(save)))]),
    el('div',{className:'v20-info-list'},[infoRow('队内角色',save.career.teamRole),infoRow('当前状态',save.status.injury?save.status.injury.name:'健康可用'),infoRow('第二位置',(p.secondaryPositions||[]).join('、')||'尚未开发'),infoRow('成长模板',p.talent?.name||'均衡成长')])
  ]);openSheet({title:'球员详情',subtitle:`${POSITION_CONFIG[p.position]?.name||p.position} · ${p.number}号`,content,size:'large'})
}

function openCareerData(save,club,repo){
  const next=upcomingFixtures(save,repo,4),content=el('div',{className:'v20-career-data-detail'},[
    el('div',{className:'v20-metric-grid'},[stat('赛季出场',save.career.seasonStats.apps),stat('赛季进球',save.career.seasonStats.goals),stat('赛季助攻',save.career.seasonStats.assists),stat('平均评分',save.career.seasonStats.rating||'—'),stat('生涯出场',save.career.careerStats.apps),stat('生涯奖杯',save.career.careerStats.titles)]),
    el('section',{className:'v20-detail-section'},[el('h3',{text:'状态'}),compactProgress('体能',save.status.fitness),compactProgress('士气',save.status.morale),compactProgress('教练信任',save.status.coachTrust)]),
    el('section',{className:'v20-detail-section'},[el('h3',{text:'接下来'}),...next.map(f=>{const opponent=repo.getClub(f.opponentId);return el('div',{className:'v20-fixture-row'},[createClubCrest(opponent,{size:'small'}),el('div',{},[el('strong',{text:opponent.cn}),el('small',{text:`${formatGameDate(f.date)} · ${f.competition} · ${f.home?'主场':'客场'}`})])])})])
  ]);openSheet({title:'职业数据详情',subtitle:`${club.cn} · ${save.career.gameClock.seasonId}赛季`,content,size:'large'})
}

function openObjectiveSheet(save,store,ctx){
  const render=()=>{
    const goals=objectiveProgress(save),active=save.career.objectives.active||[],content=el('div',{className:'v20-objective-detail'});
    content.append(el('p',{className:'muted',text:'最多选择2项阶段重点。选择后会改变训练建议、事件权重和教练评价。'}));
    const grid=el('div',{className:'v20-objective-grid'});for(const goal of goals){grid.append(button('',{className:`v20-objective-card ${goal.active?'is-selected':''}`,pressed:goal.active,onClick:()=>{try{store.update(state=>selectObjective(state,goal.id),'objective-selected');closeSheet();requestAnimationFrame(()=>openObjectiveSheet(store.state,store,ctx))}catch(error){showToast(error.message,{type:'error'})}}},[el('div',{className:'v20-section-heading'},[el('strong',{text:goal.name}),el('span',{text:goal.completed?'完成':`${Math.round(goal.ratio*100)}%`})]),el('p',{text:goal.desc}),el('div',{className:'v20-mini-progress'},[el('i',{attrs:{style:`width:${goal.ratio*100}%`}})]),el('small',{text:`进度 ${formatObjective(goal.current)} / ${formatObjective(goal.target)}`})]))}content.append(grid);return content
  };
  openSheet({title:'赛季目标',subtitle:'选择阶段重点后留在本页查看结果',content:render(),size:'large'})
}

function openFacilitiesCenter(save,club,ctx){
  const summaries=facilitySummaries(save),content=el('div',{className:'v20-facility-center'}),grid=el('div',{className:'v20-facility-grid'});
  const items=[['analysis','▥'],['medical','✚'],['locker','▦'],['honours','🏆']];for(const[id,icon]of items){const item=summaries[id];grid.append(button('',{className:'v20-facility-tile',onClick:()=>{closeSheet();requestAnimationFrame(()=>id==='analysis'?openDataAnalysis(save,club,ctx):id==='medical'?openMedicalCenter(save,club,ctx):id==='locker'?openLockerRoom(save,club,ctx):openHonoursRoom(save,club,ctx))}},[el('span',{className:'v20-facility-icon',text:icon}),el('strong',{text:item.title}),el('small',{text:item.status}),el('b',{text:item.value}),item.attention?el('span',{className:'v20-attention-dot',text:'!'}):null]))}
  content.append(grid,el('details',{className:'v20-secondary-facilities'},[el('summary',{text:'查看更多设施'}),el('div',{className:'v20-info-list'},[infoRow('训练中心','训练计划、训练事件和智能建议'),infoRow('战术室','比赛策略与位置适配'),infoRow('关系网络','教练、队友、队长与经纪人关系'),infoRow('生涯档案','完整职业历史和关键节点')]) ]));
  openSheet({title:'数据与设施中心',subtitle:club.cn,content,size:'large'})
}

function openDataAnalysis(save,club,ctx){
  ctx.store.update(state=>{markAnalysisViewed(state);markSectionViewed(state,'analysis')},'analysis-viewed');
  const series=buildAnalysisSeries(save),stats=scheduleStats(save),content=el('div',{className:'v20-analysis-detail'},[
    el('div',{className:'v20-metric-grid'},[stat('综合能力',save.player.ovr),stat('赛季出场',save.career.seasonStats.apps),stat('赛程场数',stats.total),stat('不同对手',stats.differentOpponents)]),
    chartCard('综合能力趋势',series.ovr,'能力'),chartCard('比赛评分趋势',series.rating,'评分'),chartCard('进球与助攻趋势',series.goals.map((v,i)=>v+(series.assists[i]||0)),'参与进球'),chartCard('教练信任趋势',series.trust,'信任'),
    el('section',{className:'v20-detail-section'},[el('h3',{text:'当前策略'}),el('div',{className:'v20-info-list'},[infoRow('自动训练',strategyName(save.career.strategies.training)),infoRow('比赛策略',strategyName(save.career.strategies.match)),infoRow('职业策略',strategyName(save.career.strategies.career)),infoRow('体能 / 疲劳',`${Math.round(save.status.fitness)} / ${Math.round(save.status.fatigue)}`)])])
  ]);openSheet({title:'数据分析室',subtitle:`${club.cn} · 当前存档`,content,size:'large'})
}

function openMedicalCenter(save,club,ctx){
  const plans=medicalPlans(save),injury=save.status.injury,content=el('div',{className:'v20-medical-detail'},[
    el('section',{className:'v20-medical-status'},[el('div',{},[el('small',{text:'当前状态'}),el('strong',{text:injury?injury.name:'无明确伤病'}),el('p',{text:injury?`预计还需${injury.remainingMatches||1}场 · 复发风险${injury.recurrenceRisk||25}%`:'当前以预防、恢复和体能管理为主。'})]),progressRing(injury?Math.max(10,100-(injury.remainingMatches||1)*22):Math.round(save.status.fitness),'恢复')]),
    el('div',{className:'v20-metric-grid'},[stat('体能',Math.round(save.status.fitness)),stat('疲劳',Math.round(save.status.fatigue)),stat('伤病倾向',Math.round(save.player.hidden.injuryProne)),stat('当前方案',plans.find(p=>p.selected)?.name||'轻量恢复')]),
    el('section',{className:'v20-detail-section'},[
      el('h3',{text:'恢复方案'}),
      el('div',{className:'v20-plan-list'},plans.map(plan=>button('',{
        className:`v20-plan-card ${plan.selected?'is-selected':''}`,
        disabled:!plan.available,
        onClick:()=>{
          try{
            let result;
            ctx.store.update(state=>{result=chooseMedicalPlan(state,club,plan.id)},'medical-plan');
            void animationDirector.play('training-progress',{
              id:result.id,
              label:plan.name,
              growth:Math.max(0,Math.round(result.after.fitness-result.before.fitness)),
              fatigue:Math.round(result.after.fatigue),
              risk:result.after.injury?.recurrenceRisk||5
            },{token:result.id});
            closeSheet();
            requestAnimationFrame(()=>openMedicalResult(result,ctx.store.state,club,ctx));
          }catch(error){showToast(error.message,{type:'error'})}
        }
      },[
        el('div',{},[el('strong',{text:plan.name}),el('small',{text:plan.summary})]),
        el('span',{text:plan.cost?formatMoney(plan.cost):`风险 ${plan.risk>0?'+':''}${plan.risk}`})
      ])))
    ])
  ]);openSheet({title:'医疗中心',subtitle:`${club.cn} · 方案会立即写入存档`,content,size:'large'})
}
function openMedicalResult(result,save,club,ctx){openSheet({title:'医疗方案已更新',subtitle:result.plan,content:el('div',{className:'v20-result-card'},[el('div',{className:'result-orb result-orb--good',text:'完成'}),el('h3',{text:result.summary}),el('div',{className:'v20-metric-grid'},[stat('体能',`${Math.round(result.before.fitness)} → ${Math.round(result.after.fitness)}`),stat('疲劳',`${Math.round(result.before.fatigue)} → ${Math.round(result.after.fatigue)}`),stat('伤病',result.after.injury?.name||'无')])]),actions:[{label:'继续查看医疗中心',className:'button button--primary',onClick:()=>openMedicalCenter(save,club,ctx)}]})}

function openLockerRoom(save,club,ctx){
  const actions=lockerActions(save),content=el('div',{className:'v20-locker-detail'},[
    el('div',{className:'v20-metric-grid'},[stat('队友信任',Math.round(save.relations.teammates.trust)),stat('队长关系',Math.round(save.relations.captain.trust)),stat('教练关系',Math.round(save.relations.coach.trust)),stat('队内顺位',`第${save.career.squadCompetition?.rank||4}位`)]),
    el('section',{className:'v20-detail-section'},[
      el('h3',{text:'本周更衣室行动'}),
      el('div',{className:'v20-plan-list'},actions.map(action=>button('',{
        className:'v20-plan-card',
        disabled:!action.available,
        onClick:()=>{
          try{
            let result;
            ctx.store.update(state=>{result=resolveLockerAction(state,action.id)},'locker-action');
            void animationDirector.play('status-pulse',{id:result.id,label:action.name,positive:result.success},{token:result.id});
            closeSheet();
            requestAnimationFrame(()=>openLockerResult(result,ctx.store.state,club,ctx));
          }catch(error){showToast(error.message,{type:'error'})}
        }
      },[
        el('div',{},[el('strong',{text:action.name}),el('small',{text:action.summary})]),
        el('span',{text:action.available?'选择':'本周已处理'})
      ])))
    ]),
    el('section',{className:'v20-detail-section'},[el('h3',{text:'最近动态'}),...(save.career.facilityCenter?.lockerHistory||[]).slice(0,4).map(item=>infoRow(item.action,item.summary))])
  ]);openSheet({title:'更衣室',subtitle:`${club.cn} · 关系会影响首发与配合`,content,size:'large'})
}
function openLockerResult(result,save,club,ctx){openSheet({title:'更衣室互动结果',subtitle:result.action,content:el('div',{className:'v20-result-card'},[el('div',{className:`result-orb result-orb--${result.success?'good':'bad'}`,text:result.success?'进展':'有限'}),el('h3',{text:result.summary}),el('p',{className:'muted',text:'关系和队内顺位影响已经写入存档。'})]),actions:[{label:'返回更衣室',className:'button button--primary',onClick:()=>openLockerRoom(save,club,ctx)}]})}

function openHonoursRoom(save,club,ctx){
  ctx.store.update(state=>{markHonoursViewed(state);markSectionViewed(state,'honours')},'honours-viewed');
  const trophies=(save.career.trophies||[]),achievements=(save.achievements.unlocked||[]),history=(save.career.history||[]).filter(item=>/award|trophy|achievement|冠军|奖/.test(`${item.type}${item.title}`)).slice(-12).reverse();
  const content=el('div',{className:'v20-honours-detail'},[
    el('div',{className:'v20-metric-grid'},[stat('团队奖杯',save.career.careerStats.titles),stat('个人成就',achievements.length),stat('生涯纪录',Object.keys(save.career.records||{}).length),stat('代表比赛',save.career.careerStats.bigGames||0)]),
    el('section',{className:'v20-trophy-shelf'},[el('h3',{text:'奖杯陈列'}),...(trophies.slice(-8).reverse().map(t=>el('article',{className:'v20-trophy-card'},[el('span',{text:'🏆'}),el('div',{},[el('strong',{text:safeText(t.name,'生涯荣誉')}),el('small',{text:`${t.year||save.career.year}年`})])]))),trophies.length?null:el('p',{className:'muted',text:'尚未获得正式团队奖杯，接近完成的成就会在这里显示。'})]),
    el('section',{className:'v20-detail-section'},[el('h3',{text:'生涯时间线'}),...(history.length?history.map(item=>infoRow(item.title||'生涯里程碑',item.text||`${item.year||''}年`)):[el('p',{className:'muted',text:'暂无新的荣誉记录。'})])])
  ]);void animationDirector.play('trophy-reveal',{id:`honours:${save.career.season}`,label:trophies.at(-1)?.name||'荣誉室'},{token:`honours:${save.career.season}`});openSheet({title:'荣誉室',subtitle:club.cn,content,size:'large',actions:[{label:'查看全部生涯档案',className:'button button--primary',onClick:()=>ctx.navigate('profile')}]})
}

function openMessages(save,ctx){
  const messages=unreadMessages(save),content=el('div',{className:'v20-message-center'});
  if(!messages.length)content.append(el('p',{className:'muted',text:'当前没有需要处理的新消息。'}));
  for(const message of messages)content.append(button('',{className:'v20-message-card',onClick:()=>{ctx.store.update(state=>markMessageRead(state,message.id),'message-read');closeSheet();message.action?ctx.navigate(message.action):ctx.refresh()}},[el('div',{},[el('small',{text:`${message.source} · ${message.type}`}),el('strong',{text:message.title}),el('p',{text:message.text})]),el('span',{text:'›'})]));
  openSheet({title:'消息中心',subtitle:`${messages.length}条未读`,content,size:'large'})
}

function showRetirement(ending){openSheet({title:'职业生涯已经结束',subtitle:ending.name,content:el('div',{className:'v20-result-card'},[el('div',{className:'result-orb result-orb--good',text:'🏆'}),el('h2',{text:ending.name}),el('p',{text:ending.desc})])})}
function progressView(save,target){
  const status=el('strong',{text:'正在处理职业日程'}),bar=el('i',{attrs:{style:`width:${save.career.seasonProgress}%`}}),date=el('span',{text:formatGameDate(save.career.gameClock.currentDate)}),root=el('div',{className:'advance-progress'},[el('div',{className:'calendar-flip',text:'◫'}),el('span',{className:'eyebrow',text:ADVANCE_TARGETS.find(x=>x.id===target)?.label||'时间推进'}),status,el('div',{className:'advance-progress__meta'},[date,el('span',{text:`第${save.career.season}赛季`})]),el('div',{className:'season-timeline'},[bar]),el('p',{className:'muted',text:'普通训练和比赛正在自动结算，出现重大节点会立即暂停。'})]);
  return{root,status,update(info){status.textContent=info.label||'正在推进';date.textContent=info.date?formatGameDate(info.date):`第${info.week}周`;bar.style.width=`${info.progress||0}%`;root.classList.remove('is-ticking');void root.offsetWidth;root.classList.add('is-ticking')}}
}
function summaryCard(summary){const vm=summary.viewModel||{};return el('div',{className:'v20-advance-summary'},[el('div',{className:'v20-summary-hero'},[el('span',{text:summary.interrupted?'!':'✓'}),el('div',{},[el('small',{text:vm.completionLabel||'推进结果'}),el('h2',{text:summary.headline})])]),vm.interruptionLabel?el('div',{className:'summary-interruption'},[el('strong',{text:vm.plannedLabel||'原计划推进'}),el('span',{text:`提前暂停：${vm.interruptionLabel}`})]):null,el('div',{className:'v20-metric-grid'},(vm.metrics||[]).map(item=>stat(item.label,item.value))),vm.highlights?.length?el('section',{className:'v20-detail-section'},[el('h3',{text:'本阶段最大变化'}),...vm.highlights.slice(0,5).map(text=>el('p',{text:`• ${text}`}))]):el('p',{className:'muted',text:'本阶段没有需要单独强调的重大变化。'})])}
function chartCard(title,values,label){
  const safe=values.length?values:[0,0,0,0],max=Math.max(...safe,1),min=Math.min(...safe,0),range=Math.max(1,max-min);
  const points=safe.map((value,index)=>`${8+index*(84/Math.max(1,safe.length-1))},${46-(value-min)/range*34}`).join(' ');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','v20-sparkline');svg.setAttribute('viewBox','0 0 100 54');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${title}：${safe.join('、')}`);
  const baseline=document.createElementNS('http://www.w3.org/2000/svg','path');baseline.setAttribute('d','M8 46 H92');baseline.setAttribute('stroke','rgba(60,60,67,.12)');baseline.setAttribute('fill','none');
  const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',points);line.setAttribute('fill','none');line.setAttribute('stroke','#0A84FF');line.setAttribute('stroke-width','3');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');
  svg.append(baseline,line);
  return el('section',{className:'v20-chart-card'},[el('div',{className:'v20-section-heading'},[el('div',{},[el('small',{text:label}),el('strong',{text:title})]),el('span',{text:safe.length?String(safe.at(-1)):'暂无'})]),svg])
}
function progressRing(value,label){return el('div',{className:'v20-progress-ring',attrs:{style:`--progress:${Math.max(0,Math.min(100,value))}`}},[el('strong',{text:`${Math.round(value)}%`}),el('small',{text:label})])}
function stat(label,value){return el('div',{className:'v20-metric'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function infoRow(label,value){return el('div',{className:'v20-info-row'},[el('span',{text:label}),el('strong',{text:String(value??'—')})])}
function compactProgress(label,value){return el('div',{className:'v20-compact-progress'},[el('span',{text:label}),el('div',{},[el('i',{attrs:{style:`width:${Math.max(0,Math.min(100,value))}%`}})]),el('b',{text:percent(value)})])}
function effectGrid(effects={}){const labels={xp:'能力经验',coach:'教练信任',trust:'教练信任',morale:'士气',fans:'粉丝',fitness:'体能',money:'现金',fatigue:'疲劳'};return el('div',{className:'v20-metric-grid'},Object.entries(effects).filter(([,value])=>value).map(([key,value])=>stat(labels[key]||'状态变化',`${value>0?'+':''}${value}`)))}
function formatObjective(value){return Number.isInteger(value)?String(value):Number(value).toFixed(1)}
function attrLabel(key){return{pac:'速度',sho:'射门',pas:'传球',dri:'盘带',def:'防守',phy:'身体'}[key]||key}
function strategyName(value){return{health:'保持健康',balanced:'均衡成长',shooting:'重点射门',speed:'重点速度',passing:'重点传球',physical:'重点身体',newPosition:'适应新位置',stable:'稳健比赛',aggressive:'积极表现',team:'团队优先',energy:'保存体能',stats:'争取数据',stay:'留队竞争',loan:'接受租借',transfer:'寻求转会',league:'优先高水平联赛',wage:'优先高工资',minutes:'优先出场时间'}[value]||safeText(value,'未设置')}
function outcomeText(outcome){return outcome.label==='大成功'?'决定产生了超出预期的正面连锁反应。':outcome.label==='取得进展'?'事情按计划推进，并留下持续收益。':outcome.label==='影响有限'?'短期变化不大，长期影响仍可能出现。':'这次决定付出了代价，需要通过后续训练和比赛修正。'}
