import {el,button,clear} from '../utils/dom.js';
import {createPlayerCard} from '../components/playerCard.js';
import {createEventCard} from '../components/eventCard.js';
import {openSheet,closeSheet} from '../components/sheet.js';
import {showToast} from '../components/toast.js';
import {formatMoney,formatNumber,percent} from '../utils/format.js';
import {resolveEventChoice} from '../systems/event/eventEngine.js';
import {advanceCareer,acknowledgeEventDecision,ensureTimeState} from '../systems/career/timeAdvanceSystem.js';
import {generateObjectiveCandidates,objectiveProgress,selectObjective} from '../systems/career/objectiveSystem.js';
import {upcomingFixtures,scheduleStats} from '../systems/schedule/scheduleSystem.js';
import {getPaceMode,getSpeed,paceSummary} from '../systems/pace/paceSystem.js';
import {totalFans} from '../systems/fan/fanSystem.js';
import {performFacilityAction,facilityAvailable} from '../systems/facility/facilitySystem.js';
import {ADVANCE_TARGETS,POSITION_CONFIG} from '../app/config.js';
import {animationDirector} from '../animations/director/animationDirector.js';

export function renderCareerPage(container,ctx){
  const {store,repo,navigate}=ctx,save=store.state,club=repo.getClub(save.career.clubId);
  ensureTimeState(save,repo);generateObjectiveCandidates(save);
  clear(container);
  const page=el('section',{className:'page career-page'});
  page.append(...[
    el('div',{className:'career-hero'},[createPlayerCard(save,club,{compact:true}),careerOverview(save,club,repo)]),
    advancePanel(save,repo,runAdvance),
    lastSummary(save),
    collapsible('赛季目标',objectivePanel(save,store,ctx)),
    collapsible('更多数据与设施',el('div',{className:'career-secondary-content'},[quickCards(save),compactFacilities(save,club,ctx)]))
  ].filter(Boolean));
  container.append(page);

  async function runAdvance(target){
    if(save.career.retirement){showRetirement(save.career.retirement);return}
    if(getSpeed(save).id==='paused'){showToast('当前处于暂停状态，请先选择1倍、2倍、4倍或快速',{type:'error'});return}
    const controller=new AbortController();
    const visual=progressView(save,target);let progressHandle;
    progressHandle=openSheet({title:'时间正在推进',subtitle:ADVANCE_TARGETS.find(x=>x.id===target)?.label||'职业生涯',content:visual.root,dismissible:false,actions:[{label:'停止推进',className:'button button--danger',close:false,onClick:()=>{controller.abort();visual.status.textContent='正在停止…';return false}}]});
    try{
      save.career.advance.resumeTarget=target;
      const result=await advanceCareer(save,repo,target,{signal:controller.signal,onProgress:info=>visual.update(info)});
      store.update(()=>{},'career-advanced',result);
      progressHandle.close();
      await animationDirector.play('calendar-flip',{id:`${save.career.calendar.absoluteWeek}:${target}`,from:`第${Math.max(1,save.career.calendar.week-(result.summary?.weeksAdvanced||1))}周`,to:`第${save.career.calendar.week}周`,label:result.summary?.headline||'时间推进完成'},{token:`career-calendar:${save.career.calendar.absoluteWeek}:${target}`});
      if(result.reason==='event'){showEvent(result.event,target);return}
      if(result.reason==='match'){navigate('match');return}
      if(result.reason==='transfer'){showToast('收到新的转会报价，时间已自动暂停',{type:'success'});navigate('transfer');return}
      if(result.reason==='retirement'){showRetirement(save.career.retirement);return}
      if(result.reason==='paused'){showToast('推进速度已暂停');ctx.refresh();return}
      showAdvanceSummary(result.summary);
    }catch(error){progressHandle?.close();save.career.advance.running=false;store.update(()=>{},'advance-error');showToast(error.message||'时间推进失败',{type:'error'})}
  }

  function showEvent(event,resumeTarget=null){
    if(!event){showToast('事件生成失败',{type:'error'});return}
    const content=createEventCard(event,{onChoose:choice=>chooseEvent(choice,resumeTarget)});
    openSheet({title:'关键职业事件',subtitle:`第${save.career.season}赛季 · 第${save.career.calendar.week}周`,content,dismissible:false,size:'large'});
  }

  async function chooseEvent(choice,resumeTarget){
    try{
      const result=resolveEventChoice(save,choice.id);acknowledgeEventDecision(save);
      store.update(()=>{},'event-resolved',result);
      const event=save.career.pending.event||{};
      const animationId=event.rarity==='传奇'?'six-slot-fate':event.importance==='重大'?'fate-wheel':'dice-roll';
      const animationResult=animationId==='six-slot-fate'?{id:result.eventId,values:Object.keys(result.outcome.effects||{}).slice(0,6),label:result.outcome.label}:animationId==='fate-wheel'?{id:result.eventId,index:Math.max(0,choice.index||0),label:result.outcome.label}:{id:result.eventId,value:Math.max(1,Math.min(6,Math.round((result.outcome.roll||50)/17))),label:result.outcome.label};
      await animationDirector.play(animationId,animationResult,{token:`event:${result.eventId}:${choice.id}`});
      if(result.outcome.effects?.fans)await animationDirector.play('fan-surge',{id:`${result.eventId}:fans`,delta:Math.abs(result.outcome.effects.fans)},{token:`fans:${result.eventId}:${choice.id}`});
      if(result.outcome.effects?.fitness<0||result.outcome.effects?.fatigue>0)await animationDirector.play('status-pulse',{id:`${result.eventId}:risk`,risk:Math.min(95,Math.abs(result.outcome.effects.fitness||0)*5+(result.outcome.effects.fatigue||0)*4),label:'状态风险已更新'},{token:`risk:${result.eventId}:${choice.id}`});
      const delayed=(choice.delayedEffects?.length||choice.unlockChain||choice.closeChain||choice.style==='longterm');
      const content=el('div',{className:'outcome-card'},[
        el('div',{className:`result-orb result-orb--${result.outcome.label==='出现代价'?'bad':'good'}`,text:result.outcome.label}),
        el('h3',{text:result.choice.text}),
        el('p',{text:outcomeText(result.outcome)}),effects(result.outcome.effects),
        el('div',{className:'outcome-state-grid'},[
          metricNode('教练信任',Math.round(save.status.coachTrust)),metricNode('士气',Math.round(save.status.morale)),metricNode('体能',Math.round(save.status.fitness)),metricNode('球队地位',save.career.teamRole)
        ]),
        delayed?el('p',{className:'delayed-hint',text:'这项决定已经留下长期影响，后续剧情可能在未来阶段出现。'}):null
      ]);
      const actions=[{label:resumeTarget?'继续推进':'返回生涯',className:'button button--primary',onClick:()=>{closeSheet();resumeTarget?runAdvance(resumeTarget):ctx.refresh()}}];
      openSheet({title:'选择结果',subtitle:'状态已写入存档，刷新不会改变结果',content,dismissible:false,actions});
    }catch(error){showToast(error.message||'事件结算失败',{type:'error'})}
  }

  function showAdvanceSummary(summary){
    const content=summaryCard(summary);
    openSheet({title:summaryTitle(summary),subtitle:`推进 ${summary.weeksAdvanced||0} 周 · 第${save.career.season}赛季`,content,actions:[{label:'继续规划',className:'button button--primary',onClick:()=>ctx.refresh()}]});
  }

  function showRetirement(ending){
    openSheet({title:'职业生涯已经结束',subtitle:ending.name,content:el('div',{className:'ending-card'},[el('div',{className:'ending-icon',text:'🏆'}),el('h2',{text:ending.name}),el('p',{text:ending.desc})]),actions:[{label:'查看我的档案',className:'button button--primary',onClick:()=>navigate('profile')}]});
  }

  if(save.career.pending.event&&!save.career.pending.event.resolved){
    requestAnimationFrame(()=>showEvent(save.career.pending.event,save.career.advance?.resumeTarget||null));
  }
  return()=>{};
}

function collapsible(label,content){
  const details=el('details',{className:'career-collapsible'});
  details.append(el('summary',{},[el('strong',{text:label}),el('span',{text:'展开'})]),content);
  details.addEventListener('toggle',()=>{details.querySelector('summary span').textContent=details.open?'收起':'展开'});
  return details;
}

function careerOverview(save,club,repo){
  const ss=save.career.seasonStats,next=upcomingFixtures(save,repo,1)[0],opponent=next?repo.getClub(next.opponentId):null,pace=getPaceMode(save);
  return el('section',{className:'glass-card career-overview'},[
    el('div',{className:'section-heading'},[
      el('div',{},[el('span',{className:'eyebrow',text:`第 ${save.career.season} 赛季 · 第 ${save.career.calendar.week} 周`}),el('h1',{text:'职业生涯控制台'})]),
      el('span',{className:'season-pill',text:`${save.career.seasonProgress}%`})
    ]),
    el('p',{className:'muted',text:`${club.cn} · ${save.career.squadLevel} · ${save.career.teamRole} · ${pace.name}`}),
    statsGrid([['出场',ss.apps],['进球',ss.goals],['助攻',ss.assists],['平均评分',ss.rating||'—']]),
    el('div',{className:'next-match-card'},[
      el('small',{text:'下一场比赛'}),
      el('strong',{text:opponent?`${next.competition} · 对阵${opponent.cn}`:'本赛季赛程已结束'}),
      el('span',{text:next?`第${next.week}周 · ${next.home?'主场':'客场'} · ${next.importance}`:'等待新赛季赛程'})
    ]),
    progress('体能',save.status.fitness),progress('士气',save.status.morale),progress('教练信任',save.status.coachTrust)
  ]);
}

function objectivePanel(save,store,ctx){
  const goals=objectiveProgress(save),active=save.career.objectives.active||[];
  const section=el('section',{className:'glass-card objective-panel'},[
    el('div',{className:'section-heading'},[
      el('div',{},[el('span',{className:'eyebrow',text:'阶段目标'}),el('h2',{text:'选择本赛季重点'})]),
      el('small',{className:'muted',text:`已选择 ${active.length}/2`})
    ])
  ]);
  const grid=el('div',{className:'objective-grid'});
  goals.forEach(goal=>{
    const card=button('',{className:`objective-card ${goal.active?'is-selected':''}`,pressed:goal.active,onClick:()=>{
      try{store.update(s=>selectObjective(s,goal.id),'objective-selected');ctx.refresh()}catch(error){showToast(error.message,{type:'error'})}
    }});
    card.append(
      el('div',{className:'objective-card__top'},[el('strong',{text:goal.name}),el('span',{text:goal.completed?'✓':`${Math.round(goal.ratio*100)}%`})]),
      el('p',{text:goal.desc}),
      el('div',{className:'mini-progress'},[el('i',{attrs:{style:`width:${goal.ratio*100}%`}})]),
      el('small',{text:`进度 ${formatObjective(goal.current)} / ${formatObjective(goal.target)}${goal.active?' · 正在影响自动策略':''}`})
    );
    grid.append(card);
  });
  section.append(grid);return section;
}

function advancePanel(save,repo,onAdvance){
  const summary=paceSummary(save),stats=scheduleStats(save),section=el('section',{className:'glass-card advance-panel'},[
    el('div',{className:'section-heading'},[
      el('div',{},[el('span',{className:'eyebrow',text:'时间推进'}),el('h2',{text:'你决定下一段职业节奏'})]),
      el('small',{className:'muted',text:`${summary.pace.name} · ${summary.speed.label}`})
    ]),
    el('p',{className:'advance-copy',text:'普通训练和比赛会按自动策略处理；转会、伤病、重要比赛和职业转折会按你的规则暂停。'}),
    el('div',{className:'advance-grid'},ADVANCE_TARGETS.map(target=>button('',{className:`advance-button advance-button--${target.id}`,onClick:()=>onAdvance(target.id)},[
      el('span',{className:'advance-button__icon',text:target.icon}),el('strong',{text:target.label}),el('small',{text:advanceHint(target.id,save)})
    ]))),
    el('div',{className:'schedule-mini'},[
      el('span',{text:`本赛季 ${stats.total} 场`}),el('span',{text:`已完成 ${stats.played}`}),el('span',{text:`不同对手 ${stats.differentOpponents}`})
    ])
  ]);
  return section;
}

function lastSummary(save){const summary=save.career.advance?.lastSummary;if(!summary||!summary.weeksAdvanced)return null;return el('section',{className:'glass-card last-summary'},[el('span',{className:'eyebrow',text:'最近推进'}),el('h2',{text:summary.headline}),el('div',{className:'summary-deltas'},summaryItems(summary).slice(0,5).map(([l,v])=>metricNode(l,v))),summary.nodes?.length?el('p',{className:'muted',text:summary.nodes.join(' · ')}):null])}

function quickCards(save){
  const pending=(save.career.pending.event&&!save.career.pending.event.resolved?1:0)+(save.career.pending.match&&!save.career.pending.match.resolved?1:0)+save.career.pending.offers.length;
  const position=POSITION_CONFIG[save.player.position]?.name||save.player.position;
  return el('section',{className:'section-block'},[
    el('div',{className:'summary-strip'},[
      metric('粉丝总数',formatNumber(totalFans(save)),'近期变化写入粉丝曲线'),
      metric('当前身价',formatMoney(save.finance.marketValue),`周薪 ${formatMoney(save.finance.weeklyWage)}`),
      metric('待处理',String(pending),pending?'关键内容会阻止自动推进':'当前可以安全推进'),
      metric('球员状态',save.status.injury?'受伤':save.status.fitness<55?'疲劳':'可出场',`${position} · ${save.career.teamRole}`)
    ])
  ]);
}

function compactFacilities(save,club,ctx){
  const items=[
    {id:'training',name:'训练中心',icon:'⌁',desc:'调整手动训练计划'},
    {id:'medical',name:'医疗中心',icon:'✚',desc:save.status.injury?'处理伤病':'恢复体能'},
    {id:'analysis',name:'数据分析',icon:'◫',desc:'查看赛程和成长'},
    {id:'locker',name:'更衣室',icon:'▦',desc:'影响队友关系'},
    {id:'trophy',name:'荣誉室',icon:'🏆',desc:`${save.career.careerStats.titles}座奖杯`}
  ];
  const section=el('section',{className:'section-block'},[el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'俱乐部区域'}),el('h2',{text:'快速访问'})])])]);
  const grid=el('div',{className:'facility-grid facility-grid--compact'});
  items.forEach(item=>{
    const available=!['medical','locker'].includes(item.id)||facilityAvailable(save,item.id);
    const card=button('',{className:`facility-card ${available?'':'is-used'}`,onClick:()=>openFacility(item,save,club,ctx)});
    card.append(el('span',{className:'facility-icon',text:item.icon}),el('strong',{text:item.name}),el('small',{text:available?item.desc:'本阶段已使用'}));grid.append(card);
  });section.append(grid);return section;
}

function openFacility(item,save,club,ctx){
  if(item.id==='training'){ctx.navigate('training');return}
  if(item.id==='analysis'){
    const stats=scheduleStats(save),content=el('div',{className:'facility-detail'},[
      el('div',{className:'metric-grid'},[metricNode('综合能力',save.player.ovr),metricNode('赛季出场',save.career.seasonStats.apps),metricNode('赛程场数',stats.total),metricNode('不同对手',stats.differentOpponents)]),
      el('div',{className:'detail-list'},[detail('当前自动训练',save.career.strategies.training),detail('比赛策略',save.career.strategies.match),detail('职业策略',save.career.strategies.career),detail('体能 / 疲劳',`${Math.round(save.status.fitness)} / ${Math.round(save.status.fatigue)}`)])
    ]);openSheet({title:'数据分析室',subtitle:'全部来自当前存档',content});return;
  }
  if(item.id==='trophy'){
    const trophies=save.career.trophies||[],content=el('div',{className:'facility-detail'},[trophies.length?el('div',{className:'trophy-summary-list'},trophies.slice(-10).reverse().map(t=>el('article',{className:'trophy-summary-item'},[el('span',{text:'🏆'}),el('div',{},[el('strong',{text:t.name}),el('small',{text:`${t.year}年`})])]))):el('p',{className:'muted',text:'尚未获得正式奖杯。'}),el('p',{text:`已解锁成就 ${save.achievements.unlocked.length} 项。`})]);void animationDirector.play('trophy-reveal',{id:`trophy-room:${save.career.season}`,label:trophies.at(-1)?.name||'荣誉室'},{token:`trophy-room:${save.career.season}`});openSheet({title:'荣誉室',subtitle:club.cn,content,actions:[{label:'查看全部成就',className:'button button--primary',onClick:()=>ctx.navigate('profile')} ]});return;
  }
  const result=performFacilityAction(save,club,item.id);ctx.store.update(()=>{},`facility-${item.id}`,result);
  openSheet({title:item.name,subtitle:`${club.cn} · 第${save.career.calendar.week}周`,content:el('div',{className:'facility-result'},[el('div',{className:`result-orb result-orb--${result.ok?'good':'bad'}`,text:result.ok?'完成':'受限'}),el('h3',{text:result.title}),el('p',{text:result.summary})])});ctx.refresh();
}

function progressView(save,target){
  const status=el('strong',{text:'正在处理本周训练'}),bar=el('i',{attrs:{style:`width:${save.career.seasonProgress}%`}}),week=el('span',{text:`第${save.career.calendar.week}周`}),root=el('div',{className:'advance-progress'},[
    el('div',{className:'calendar-flip',text:'◫'}),el('span',{className:'eyebrow',text:ADVANCE_TARGETS.find(x=>x.id===target)?.label||'时间推进'}),status,
    el('div',{className:'advance-progress__meta'},[week,el('span',{text:`第${save.career.season}赛季`})]),el('div',{className:'season-timeline'},[bar]),el('p',{className:'muted',text:'普通内容正在自动结算。出现关键节点时会立即暂停。'})
  ]);
  return{root,status,update(info){status.textContent=info.label||'正在推进';week.textContent=`第${info.week}周`;bar.style.width=`${info.progress||0}%`;root.classList.remove('is-ticking');void root.offsetWidth;root.classList.add('is-ticking')}};
}

function summaryCard(summary){
  return el('div',{className:'advance-summary-card'},[
    el('div',{className:'summary-hero'},[el('span',{text:'✓'}),el('div',{},[el('small',{text:'本次最大变化'}),el('h2',{text:summary.headline})])]),
    el('div',{className:'summary-deltas'},summaryItems(summary).map(([l,v])=>metricNode(l,v))),
    summary.nodes?.length?el('div',{className:'summary-nodes'},[el('strong',{text:'职业节点'}),...summary.nodes.map(text=>el('p',{text:`• ${text}`}))]):null,
    el('p',{className:'summary-advice',text:nextAdvice(summary)})
  ]);
}
function summaryItems(s){return[['推进周数',s.weeksAdvanced||0],['比赛',s.matches||0],['进球',signed(s.goals)],['助攻',signed(s.assists)],['能力',signed(s.ovrChange)],['教练信任',signed(s.coachTrustChange)],['粉丝',signed(s.fansChange)],['新报价',s.newOffers||0]]}
function summaryTitle(summary){if(summary.target==='month')return'本月总结';if(summary.target==='season')return'赛季推进总结';if(summary.target==='week')return'本周总结';return'职业阶段总结'}
function nextAdvice(s){if(s.newOffers)return'新机会：前往转会页比较报价，不会自动替你接受。';if(s.fitnessChange<-12)return'风险提示：体能明显下降，建议切换为保持健康或恢复训练。';if(s.coachTrustChange<0)return'下一步建议：选择稳定比赛策略，提高教练信任。';if(s.ovrChange>0)return'成长已经生效，可以继续当前训练方向或调整阶段目标。';return'下一步建议：检查短期目标和下一场对手，再决定推进跨度。'}
function advanceHint(id,save){if(id==='nextEvent')return save.career.pending.event?'处理待决事件':'停在下一次选择';if(id==='nextMatch')return'停在下一场赛前';if(id==='week')return'处理7天普通内容';if(id==='month')return'生成简洁月度总结';if(id==='window')return'自动前往夏窗或冬窗';return'普通内容自动结算'}
function signed(value=0){const n=Number(value||0);return`${n>0?'+':''}${formatNumber(n)}`}
function formatObjective(value){return Number.isInteger(value)?String(value):Number(value).toFixed(1)}
function statsGrid(items){const grid=el('div',{className:'metric-grid'});items.forEach(([l,v])=>grid.append(metricNode(l,v)));return grid}
function metricNode(label,value){return el('div',{className:'metric'},[el('small',{text:label}),el('strong',{text:String(value)})])}
function progress(label,value){return el('div',{className:'progress-row'},[el('span',{text:label}),el('div',{className:'progress-track'},[el('i',{attrs:{style:`width:${value}%`}})]),el('b',{text:percent(value)})])}
function metric(label,value,sub){return el('article',{className:'glass-card summary-card'},[el('small',{text:label}),el('strong',{text:value}),el('p',{text:sub})])}
function detail(label,value){return el('div',{className:'detail-row'},[el('span',{text:label}),el('strong',{text:String(value)})])}
function effects(e={}){const wrap=el('div',{className:'effect-list'}),labels={xp:'能力经验',coach:'教练信任',trust:'教练信任',morale:'士气',fans:'粉丝',fitness:'体能',money:'现金',fatigue:'疲劳'};for(const[k,v]of Object.entries(e)){if(!v)continue;wrap.append(el('span',{className:`effect-chip ${v<0?'is-negative':''}`,text:`${labels[k]||k} ${v>0?'+':''}${v}`}))}return wrap}
function outcomeText(outcome){return outcome.label==='大成功'?'决定产生了超出预期的正面连锁反应。':outcome.label==='取得进展'?'事情按计划推进，并留下持续收益。':outcome.label==='影响有限'?'短期变化不大，长期影响仍可能出现。':'这次决定付出了代价，需要通过后续训练和比赛修正。'}
