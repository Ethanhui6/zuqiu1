import {el,button,clear} from '../utils/dom.js';
import {resolveMatch} from '../systems/match/matchSystem.js';
import {advanceCareer,acknowledgeMatchDecision,ensureTimeState} from '../systems/career/timeAdvanceSystem.js';
import {upcomingFixtures} from '../systems/schedule/scheduleSystem.js';
import {selectAutoMatchChoice,matchPresentationFor,getPaceMode,getSpeed} from '../systems/pace/paceSystem.js';
import {DeterministicRng} from '../services/rng.js';
import {createClubCrest} from '../components/clubCrest.js';
import {showToast} from '../components/toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';

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
    if(getSpeed(save).id==='paused'){showToast('当前处于暂停状态，请先切换推进速度',{type:'error'});return}
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
  const panel=el('section',{className:'match-presentation-panel glass-card'},[
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
  return el('section',{className:'match-header-card glass-card'},[
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
  const wrap=el('section',{className:'glass-card match-brief'},[
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
  const fixtures=upcomingFixtures(save,repo,6),section=el('section',{className:'glass-card upcoming-card'},[
    el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'赛程'}),el('h2',{text:'接下来六场'})]),el('small',{className:'muted',text:getPaceMode(save).name})])
  ]),list=el('div',{className:'fixture-list'});
  fixtures.forEach(f=>{const opponent=repo.getClub(f.opponentId);list.append(el('article',{className:'fixture-row'},[
    el('span',{className:'fixture-week',text:`第${f.week}周`}),createClubCrest(opponent,{size:'small'}),el('div',{className:'fixture-copy'},[el('strong',{text:opponent.cn}),el('small',{text:`${f.competition} · ${f.home?'主场':'客场'} · ${f.importance}`})])
  ]))});
  if(!fixtures.length)list.append(el('p',{className:'muted',text:'本赛季赛程已经结束。'}));
  section.append(list,button(fixtures.length?'推进至下一场比赛':'返回生涯',{className:'button button--primary button--large',dataset:{nextMatch:'1'},onClick:fixtures.length?onNext:()=>history.back()}));return section;
}
function resultView(match,current,opponent,{onReturn,onNext}){
  const r=match.playerResult,wrap=el('section',{className:'match-result-page'});
  const summary=el('section',{className:'glass-card match-summary'},[
    el('span',{className:'eyebrow',text:`${match.competition} · ${presentationName(match.presentation)}`}),
    el('div',{className:'result-scoreboard'},[
      teamBlock(current,'本队'),el('div',{className:'final-score',text:`${match.score[0]} : ${match.score[1]}`}),teamBlock(opponent,'对手')
    ]),
    el('div',{className:'result-rating'},[el('div',{className:'rating-orb',text:String(r.rating)}),el('div',{},[el('h2',{text:r.played?'你的比赛表现':'本场未获得出场机会'}),el('p',{text:r.played?'比赛数据已经写入生涯存档。':'观察比赛仍会获得少量战术经验。'})])]),
    el('div',{className:'metric-grid'},[metric('出场时间',`${r.minutes}分钟`),metric('进球',r.goals),metric('助攻',r.assists),metric('关键传球',r.keyPasses),metric('抢断',r.tackles),metric('扑救',r.saves)])
  ]);
  const timeline=el('section',{className:'glass-card timeline-card'},[el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'快速时间线'}),el('h2',{text:'比赛关键事件'})])])]);
  const list=el('div',{className:'timeline-list'});(match.timeline||[]).forEach(t=>list.append(el('div',{className:'timeline-item'},[el('span',{className:'timeline-minute',text:`${t.minute}'`}),el('div',{},[el('strong',{text:t.type}),el('small',{text:t.text||t.team})])])));timeline.append(list);
  const review=el('section',{className:'glass-card match-review'},[
    el('div',{},[el('span',{className:'eyebrow',text:'教练评价'}),el('h2',{text:match.coachEvaluation||'比赛报告已归档'}),el('p',{text:match.coachEvaluation||'本场表现已经计入球队顺位和生涯数据。'})]),
    el('div',{className:'status-change-grid'},(match.statusChanges||[]).map(change=>el('div',{className:'status-change'},[
      el('small',{text:change.label}),el('strong',{text:change.delta===null?String(change.after):`${change.delta>=0?'+':''}${change.delta}`}),el('span',{text:change.delta===null?'已记录':`${change.before} → ${change.after}`})
    ])))
  ]);
  const actions=el('footer',{className:'page-action-bar'},[
    button('返回生涯首页',{className:'button button--secondary',onClick:onReturn}),
    button('模拟下一场',{className:'button button--primary',dataset:{nextMatch:'1'},onClick:onNext})
  ]);
  wrap.append(summary,timeline,review,actions);return wrap;
}
function metric(label,value){return el('div',{className:'metric'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function scenarioText(match){if(!match.starts&&!match.substitute)return'你没有进入本场名单。观察对手站位和球队战术，仍会影响教练评价与学习经验。';if(match.substitute)return`教练准备在第 ${match.minute} 分钟左右派你登场，第一项行动会影响比赛评分。`;return'比赛进入关键阶段。不同选择会改变个人数据、体能、教练信任和球队结果。'}
function matchChoiceMeta(choice,index){const map={dri:{icon:'⚡',color:'#0A84FF',risk:'中风险',reward:'突破'},pas:{icon:'🎯',color:'#248A3D',risk:'低风险',reward:'团队'},sho:{icon:'◎',color:'#D85B1D',risk:'高风险',reward:'高回报'},phy:{icon:'◆',color:'#8B5CF6',risk:'中风险',reward:'对抗'},def:{icon:'🛡️',color:'#248A3D',risk:'中风险',reward:'防守'},pac:{icon:'✦',color:'#5B5BD6',risk:'中风险',reward:'反应'}};return map[choice.focus]||[{icon:'⚡',color:'#0A84FF',risk:'中风险',reward:'机会'},{icon:'🧠',color:'#8B5CF6',risk:'低风险',reward:'判断'}][index%2]}
