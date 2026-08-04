import {el,button,clear} from '../utils/dom.js';
import {resolveMatch} from '../systems/match/matchSystem.js';
import {advanceCareer,acknowledgeMatchDecision,ensureTimeState} from '../systems/career/timeAdvanceSystem.js';
import {upcomingFixtures} from '../systems/schedule/scheduleSystem.js';
import {selectAutoMatchChoice,matchPresentationFor,getPaceMode,getSpeed} from '../systems/pace/paceSystem.js';
import {DeterministicRng} from '../services/rng.js';
import {createClubCrest} from '../components/clubCrest.js';
import {showToast} from '../components/toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';
import {openSheet} from '../components/sheet.js';
import {POSITION_CONFIG} from '../app/config.js';
import {createDevelopmentDelta} from '../components/developmentDelta.js';

export function renderMatchPage(container,ctx){
  const {store,repo,navigate}=ctx,save=store.state;
  ensureTimeState(save,repo);clear(container);
  const page=el('section',{className:'page match-page'});container.append(page);
  const pending=save.career.pending.match&&!save.career.pending.match.resolved?save.career.pending.match:null;
  if(pending){renderPending(pending);return()=>{}}
  const last=save.career.lastMatchResult;
  if(last&&last.season===save.career.season&&last.week>=Math.max(1,(save.career.calendar.week||1)-1)){
    page.append(resultView(last,repo.getClub(last.clubId),repo.getClub(last.opponentId),{onReturn:()=>navigate('career'),onNext:goNextMatch}));
  }
  page.append(upcomingView(save,repo,goNextMatch));return()=>{};

  function renderPending(match){
    page.replaceChildren();const current=repo.getClub(save.career.clubId),opponent=repo.getClub(match.opponentId),recommended=matchPresentationFor(save,match);
    page.append(matchHeader(match,current,opponent),presentationPicker(recommended,mode=>{
      if(mode==='interactive'){
        page.querySelector('.match-presentation-panel')?.remove();
        if(!page.querySelector('.match-brief'))page.append(choiceView(match,choice=>settle(match,choice.id,'interactive')));
        return;
      }
      settleAuto(match,mode);
    }));
    if(recommended==='interactive')page.append(choiceView(match,choice=>settle(match,choice.id,'interactive')));
  }
  async function goNextMatch(){
    if(getSpeed(save).id==='paused'){showToast('当前处于暂停状态，请在游戏节奏中选择推进速度',{type:'error'});ctx.openPaceSettings?.();return}
    const nodes=page.querySelectorAll('[data-next-match]');nodes.forEach(node=>{node.disabled=true;node.textContent='正在推进至下一场…'});
    try{
      const result=await advanceCareer(save,repo,'nextMatch');store.update(()=>{},'advance-to-match',result);
      await animationDirector.play('calendar-flip',{id:`match-advance-${save.career.calendar.absoluteWeek}`,from:'当前',to:`第${save.career.calendar.week}周`,label:'已推进至关键节点'},{token:`match-calendar:${save.career.calendar.absoluteWeek}`});
      if(result.reason==='event'){showToast('推进途中出现关键事件，请先回生涯页处理');navigate('career');return}
      if(result.reason==='match'){ctx.refresh();requestAnimationFrame(()=>{container.scrollTop=0});return}
      if(result.reason==='transfer'){showToast('收到转会报价，推进已暂停');navigate('transfer');return}
      showToast('本赛季没有更多比赛');ctx.refresh();
    }catch(error){showToast(error.message||'无法推进到下一场比赛',{type:'error'});ctx.refresh()}
  }
  function settleAuto(match,presentation){
    const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
    const choice=selectAutoMatchChoice(save,match,rng);save.rng=rng.snapshot();settle(match,choice?.id,presentation);
  }
  async function settle(match,choiceId,presentation){
    try{
      const current=repo.getClub(save.career.clubId),opponent=repo.getClub(match.opponentId),result=resolveMatch(save,repo,choiceId,{presentation});
      save.career.lastMatchResult={...structuredClone(result),clubId:current.id,opponentId:opponent.id,season:save.career.season,week:save.career.calendar.week};
      acknowledgeMatchDecision(save);store.update(()=>{},'match-resolved',result);
      const events=(result.timeline||[]).map(item=>item.type).slice(0,5);
      if(presentation==='timeline')await animationDirector.play('match-timeline',{id:match.id,events,minutes:(result.timeline||[]).map(item=>item.minute),label:`${result.score[0]} 比 ${result.score[1]}`},{token:`match-timeline:${match.id}`});
      else if(presentation==='interactive')await animationDirector.play('football-trajectory',{id:match.id,outcome:result.playerResult.goals?'goal':result.playerResult.saves?'save':result.playerResult.rating>=7?'post':'wide'},{token:`match-shot:${match.id}`});
      else await animationDirector.play('coin-toss',{id:match.id,side:result.score[0]>=result.score[1]?'front':'back'},{token:`match-coin:${match.id}`});
      page.replaceChildren(resultView(save.career.lastMatchResult,current,opponent,{onReturn:()=>navigate('career'),onNext:goNextMatch}),upcomingView(save,repo,goNextMatch));
      container.scrollTop=0;
      showToast(`比赛结束：${current.cn} ${result.score[0]}-${result.score[1]} ${opponent.cn} · 评分 ${result.playerResult.rating}`,{type:'success'});
    }catch(error){showToast(error.message||'比赛结算失败',{type:'error'})}
  }
}

function presentationPicker(recommended,onSelect){
  const panel=el('section',{className:'match-presentation-panel v20-surface'},[
    el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'比赛呈现方式'}),el('h2',{text:'选择本场体验'})]),el('small',{className:'muted',text:`推荐：${presentationName(recommended)}`})])
  ]),list=el('div',{className:'mode-list'}),items=[
    {id:'instant',icon:'»',name:'直接结果',desc:'直接显示比分、评分和状态变化。'},
    {id:'timeline',icon:'≡',name:'快速时间线',desc:'保留进球、扑救和关键节点。'},
    {id:'interactive',icon:'⚽',name:'互动比赛',desc:'在关键时刻亲自作出决定。'}
  ];
  items.forEach(item=>list.append(button('',{className:`presentation-card ${recommended===item.id?'is-recommended':''}`,onClick:()=>onSelect(item.id)},[
    el('span',{className:'presentation-card__icon',text:item.icon}),el('span',{className:'presentation-card__copy'},[el('strong',{text:item.name}),el('small',{text:item.desc})]),recommended===item.id?el('span',{className:'tag tag--accent',text:'推荐'}):null
  ])));
  panel.append(list);return panel;
}
function presentationName(id){return{instant:'直接结果',timeline:'快速时间线',interactive:'互动比赛'}[id]||'互动比赛'}
function matchHeader(match,current,opponent){
  return el('section',{className:'match-header-card v20-surface'},[
    el('div',{className:'match-header-top'},[
      el('span',{className:'eyebrow',text:`${match.competition} · ${match.roundLabel||`第${match.round||1}轮`}`}),
      el('span',{className:'tag tag--accent',text:match.home?'主场':'客场'})
    ]),
    el('div',{className:'match-header'},[
      teamBlock(current,match.home?'主队':'客队'),
      el('div',{className:'match-center'},[el('strong',{text:'VS'}),el('small',{text:match.importance})]),
      teamBlock(opponent,match.home?'客队':'主队')
    ]),
    el('div',{className:'match-facts'},[
      matchFact('赛事',match.competition),matchFact('轮次',match.roundLabel||`第${match.round||1}轮`),matchFact('天气',match.weather),matchFact('出场状态',match.starts?'首发':match.substitute?'替补待命':'未进入名单')
    ]),
    el('div',{className:'match-context'},[
      el('span',{text:`对手风格：${opponent.tactic||'均衡战术'}`}),
      el('span',{text:`对手实力 ${opponent.rep} · 进攻 ${opponent.attack} · 防守 ${opponent.defense}`})
    ])
  ]);
}
function teamBlock(club,role){return el('div',{className:'match-team'},[createClubCrest(club,{size:'normal'}),el('strong',{text:club.cn}),el('small',{text:role})])}
function matchFact(label,value){return el('div',{className:'match-fact'},[el('small',{text:label}),el('strong',{text:value})])}
function choiceView(match,onChoose){
  const wrap=el('section',{className:'v20-surface match-brief'},[
    el('span',{className:'eyebrow',text:match.substitute?`第 ${match.minute} 分钟`:match.starts?'比赛关键阶段':'替补席观察'}),
    el('h2',{text:match.starts?'球权来到你的区域':match.substitute?'准备登场':'阅读比赛'}),el('p',{text:scenarioText(match)})
  ]),list=el('div',{className:'match-choices'});
  match.keyChoices.forEach((choice,index)=>{
    const meta=matchChoiceMeta(choice,index),card=button('',{className:'match-choice',onClick:()=>{list.querySelectorAll('button').forEach(node=>node.disabled=true);onChoose(choice)}});
    card.style.setProperty('--choice-color',meta.color);
    card.append(el('span',{className:'choice-icon',text:meta.icon}),el('span',{className:'choice-copy'},[el('strong',{text:choice.text}),el('small',{text:choice.hint})]),el('span',{className:'choice-assessment'},[el('span',{text:meta.risk}),el('b',{text:meta.reward})]));list.append(card);
  });wrap.append(list);return wrap;
}
function upcomingView(save,repo,onNext){
  const fixtures=upcomingFixtures(save,repo,6),section=el('section',{className:'v20-surface upcoming-card'},[
    el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'赛程'}),el('h2',{text:'接下来六场'})]),el('small',{className:'muted',text:getPaceMode(save).name})])
  ]),list=el('div',{className:'fixture-list'});
  fixtures.forEach(f=>{const opponent=repo.getClub(f.opponentId);list.append(el('article',{className:'fixture-row'},[
    el('span',{className:'fixture-week',text:`第${f.week}周`}),createClubCrest(opponent,{size:'small'}),el('div',{className:'fixture-copy'},[el('strong',{text:opponent.cn}),el('small',{text:`${f.competition} · ${f.home?'主场':'客场'} · ${f.importance}`})])
  ]))});
  if(!fixtures.length)list.append(el('p',{className:'muted',text:'本赛季赛程已经结束。'}));
  section.append(list,button(fixtures.length?'推进至下一场比赛':'返回生涯',{className:'button button--primary button--large',dataset:{nextMatch:'1'},onClick:fixtures.length?onNext:()=>history.back()}));return section;
}
function resultView(match,current,opponent,{onReturn,onNext}){
  const r=match.playerResult||{},wrap=el('section',{className:'match-result-page v20-match-result-page'});
  const hero=el('section',{className:'v20-match-result-hero'},[
    el('span',{className:'eyebrow',text:`${match.competition} · ${presentationName(match.presentation)}`}),
    el('div',{className:'result-scoreboard'},[
      teamBlock(current,'本队'),
      el('div',{className:'final-score',text:`${match.score[0]} : ${match.score[1]}`}),
      teamBlock(opponent,'对手')
    ]),
    el('p',{text:`${match.date||'比赛日'} · ${match.home?'主场':'客场'} · ${match.weather||'天气正常'}`})
  ]);
  const cards=el('section',{className:'v20-match-summary-grid'});
  const position=match.playerPosition||match.position||r.position||'ST';
  const cardItems=[
    {id:'result',icon:'◎',title:'比赛结果',value:`${match.score[0]}-${match.score[1]}`,copy:`${match.competition} · ${match.home?'主场':'客场'}`,open:()=>openMatchResultDetail(match,current,opponent)},
    {id:'performance',icon:'●',title:'个人表现',value:r.played?`评分 ${r.rating}`:'未出场',copy:performanceSummary(r,position),open:()=>openPerformanceDetail(r,position)},
    {id:'timeline',icon:'≡',title:'关键事件',value:`${(match.timeline||[]).length}项`,copy:(match.timeline||[]).at(-1)?.text||'本场没有重大事件',open:()=>openTimelineDetail(match)},
    {id:'review',icon:'◇',title:'教练评价',value:trustDelta(match),copy:match.coachEvaluation||'比赛报告已归档',open:()=>openReviewDetail(match)}
  ];
  for(const item of cardItems){
    cards.append(button('',{className:`v20-match-summary-card v20-match-summary-card--${item.id}`,onClick:item.open},[
      el('span',{className:'v20-match-summary-icon',text:item.icon}),
      el('div',{},[el('small',{text:item.title}),el('strong',{text:item.value}),el('p',{text:item.copy})]),
      el('span',{className:'v20-match-summary-arrow',text:'›'})
    ]));
  }
  const highlight=el('section',{className:'v20-post-match-highlight'},[
    el('div',{},[
      el('small',{text:'赛后重点'}),
      el('strong',{text:postMatchHeadline(match,r)}),
      el('p',{text:postMatchAdvice(match,r,position)})
    ]),
    el('span',{className:`v20-rating-badge ${Number(r.rating||0)>=7?'is-good':''}`,text:r.played?String(r.rating||'—'):'未出场'})
  ]);
  const actions=el('footer',{className:'page-action-bar v20-page-action-bar'},[
    button('返回生涯首页',{className:'button button--secondary',onClick:onReturn}),
    button('模拟下一场',{className:'button button--primary',dataset:{nextMatch:'1'},onClick:onNext}),
    button('查看完整比赛报告',{className:'button button--ghost',onClick:()=>openFullMatchReport(match,current,opponent,position)})
  ]);
  const growth=createDevelopmentDelta({title:'本场成长',items:(match.statusChanges||[]).filter(item=>item.delta!==null&&item.delta!==0).map(item=>({label:item.label,value:`${item.delta>0?'+':''}${item.delta}`,tone:item.delta>0?'positive':'negative'})),emptyText:'本场没有明显状态变化'});
  wrap.append(hero,cards,growth,highlight,actions);return wrap;
}

function openMatchResultDetail(match,current,opponent){
  const content=el('div',{className:'v20-match-detail'},[
    el('div',{className:'result-scoreboard'},[teamBlock(current,'本队'),el('div',{className:'final-score',text:`${match.score[0]} : ${match.score[1]}`}),teamBlock(opponent,'对手')]),
    el('div',{className:'v20-metric-grid'},[
      metric('赛事',match.competition),metric('主客场',match.home?'主场':'客场'),metric('天气',match.weather||'正常'),metric('日期',match.date||'比赛日')
    ])
  ]);
  openSheet({title:'比赛结果',subtitle:`${current.cn} 对 ${opponent.cn}`,content});
}

function openPerformanceDetail(result,position){
  const metrics=positionMetrics(result,position);
  const content=el('div',{className:'v20-performance-detail'},[
    el('div',{className:'v20-rating-panel'},[
      el('span',{className:`v20-rating-badge ${Number(result.rating||0)>=7?'is-good':''}`,text:result.played?String(result.rating||'—'):'未出场'}),
      el('div',{},[el('strong',{text:result.played?'本场个人表现':'本场未获得出场机会'}),el('p',{text:result.played?`${POSITION_CONFIG[position]?.name||position}的评价使用位置专属指标。`:'观察比赛获得少量战术经验。'})])
    ]),
    el('div',{className:'v20-metric-grid'},metrics.map(item=>metric(item.label,item.value)))
  ]);
  openSheet({title:'个人表现',subtitle:POSITION_CONFIG[position]?.name||position,content});
}

function openTimelineDetail(match){
  const timeline=el('div',{className:'timeline-list v20-compact-timeline'});
  const items=match.timeline||[];
  for(const event of items){
    timeline.append(el('article',{className:'timeline-item'},[
      el('span',{className:'timeline-minute',text:`${event.minute}'`}),
      el('div',{},[el('strong',{text:event.type}),el('small',{text:event.text||event.team||'比赛事件'})])
    ]));
  }
  if(!items.length)timeline.append(el('p',{className:'muted',text:'本场没有需要单独记录的关键事件。'}));
  openSheet({title:'关键事件',subtitle:`共${items.length}项`,content:timeline,size:'large'});
}

function openReviewDetail(match){
  const changes=match.statusChanges||[];
  const content=el('div',{className:'v20-review-detail'},[
    el('section',{className:'v20-review-quote'},[el('small',{text:'教练总结'}),el('strong',{text:match.coachEvaluation||'比赛报告已归档'}),el('p',{text:reviewAdvice(match)})]),
    el('div',{className:'v20-metric-grid'},changes.length?changes.map(change=>metric(change.label,change.delta===null?String(change.after):`${change.delta>=0?'+':''}${change.delta}`)):[metric('状态变化','暂无明显变化')])
  ]);
  openSheet({title:'教练评价',subtitle:'评价已经影响教练信任和队内顺位',content});
}

function openFullMatchReport(match,current,opponent,position){
  const result=match.playerResult||{},content=el('div',{className:'v20-full-report'},[
    el('section',{className:'v20-detail-section'},[el('h3',{text:'比赛结果'}),el('div',{className:'result-scoreboard'},[teamBlock(current,'本队'),el('div',{className:'final-score',text:`${match.score[0]} : ${match.score[1]}`}),teamBlock(opponent,'对手')])]),
    el('section',{className:'v20-detail-section'},[el('h3',{text:'个人表现'}),el('div',{className:'v20-metric-grid'},positionMetrics(result,position).map(item=>metric(item.label,item.value)))]),
    el('section',{className:'v20-detail-section'},[el('h3',{text:'教练评价'}),el('p',{text:match.coachEvaluation||'本场表现已经计入职业数据。'}),el('p',{className:'muted',text:reviewAdvice(match)})]),
    el('section',{className:'v20-detail-section'},[el('h3',{text:'关键事件'}),...(match.timeline||[]).slice(0,12).map(event=>el('div',{className:'v20-info-row'},[el('span',{text:`${event.minute}' · ${event.type}`}),el('strong',{text:event.text||event.team||'比赛事件'})]))])
  ]);
  openSheet({title:'完整比赛报告',subtitle:`${current.cn} ${match.score[0]}-${match.score[1]} ${opponent.cn}`,content,size:'large'});
}

function positionMetrics(result,position){
  const base=[{label:'出场时间',value:`${result.minutes||0}分钟`}];
  if(position==='GK')return base.concat([{label:'扑救',value:result.saves||0},{label:'扑救率',value:result.shotsFaced?`${Math.round((result.saves||0)/result.shotsFaced*100)}%`:'—'},{label:'出击',value:result.claims||result.keyPasses||0},{label:'零封',value:result.cleanSheet?'是':'否'}]);
  if(['CB','LB','RB','DM'].includes(position))return base.concat([{label:'抢断',value:result.tackles||0},{label:'拦截',value:result.interceptions||0},{label:'解围',value:result.clearances||0},{label:'零封',value:result.cleanSheet?'是':'否'}]);
  if(['CM','AM'].includes(position))return base.concat([{label:'助攻',value:result.assists||0},{label:'关键传球',value:result.keyPasses||0},{label:'传球',value:result.passes||result.passSuccess||'—'},{label:'抢断',value:result.tackles||0}]);
  return base.concat([{label:'进球',value:result.goals||0},{label:'助攻',value:result.assists||0},{label:'射门',value:result.shots||0},{label:'关键传球',value:result.keyPasses||0}]);
}
function performanceSummary(result,position){const items=positionMetrics(result,position).slice(1,3);return items.map(item=>`${item.label}${item.value}`).join(' · ')||'比赛数据已归档'}
function trustDelta(match){const change=(match.statusChanges||[]).find(item=>/信任|教练/.test(item.label));return change?`${change.delta>=0?'+':''}${change.delta}`:'已归档'}
function postMatchHeadline(match,result){if(!result.played)return'等待下一次上场机会';if(Number(result.rating||0)>=8)return'你是本场最有影响力的球员之一';if((result.goals||0)+(result.assists||0)>0)return'直接参与进球提升了队内评价';if(Number(result.rating||0)>=7)return'稳定发挥巩固了队内位置';return'本场表现需要在下周训练中调整'}
function postMatchAdvice(match,result,position){if(match.statusChanges?.some(item=>item.label==='受伤'))return'优先进入医疗中心评估伤病和复发风险。';if(!result.played)return'保持训练表现并关注教练信任，争取下一场进入轮换。';if(Number(result.rating||0)<6.5)return `建议针对${POSITION_CONFIG[position]?.name||position}核心能力安排专项训练。`;return'查看教练评价和状态变化，再决定下一周训练方案。'}
function reviewAdvice(match){const changes=match.statusChanges||[];const positive=changes.filter(item=>Number(item.delta)>0).map(item=>item.label);const negative=changes.filter(item=>Number(item.delta)<0).map(item=>item.label);if(negative.length)return `${negative.slice(0,2).join('、')}有所下降，下周建议控制疲劳并针对性训练。`;if(positive.length)return `${positive.slice(0,2).join('、')}得到提升，保持当前比赛与训练策略。`;return'本场没有造成明显状态变化，可按阶段目标安排下一周。'}
function metric(label,value){return el('div',{className:'metric'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function scenarioText(match){if(!match.starts&&!match.substitute)return'你没有进入本场名单。观察对手站位和球队战术，仍会影响教练评价与学习经验。';if(match.substitute)return`教练准备在第 ${match.minute} 分钟左右派你登场，第一项行动会影响比赛评分。`;return'比赛进入关键阶段。不同选择会改变个人数据、体能、教练信任和球队结果。'}
function matchChoiceMeta(choice,index){const map={dri:{icon:'⚡',color:'#0A84FF',risk:'中风险',reward:'突破'},pas:{icon:'🎯',color:'#248A3D',risk:'低风险',reward:'团队'},sho:{icon:'◎',color:'#D85B1D',risk:'高风险',reward:'高回报'},phy:{icon:'◆',color:'#8B5CF6',risk:'中风险',reward:'对抗'},def:{icon:'🛡️',color:'#248A3D',risk:'中风险',reward:'防守'},pac:{icon:'✦',color:'#5B5BD6',risk:'中风险',reward:'反应'}};return map[choice.focus]||[{icon:'⚡',color:'#0A84FF',risk:'中风险',reward:'机会'},{icon:'🧠',color:'#8B5CF6',risk:'低风险',reward:'判断'}][index%2]}
