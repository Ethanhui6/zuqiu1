import {el,button,clear} from '../utils/dom.js';
import {resolveMatch} from '../systems/match/matchSystem.js';
import {advanceCareer,acknowledgeMatchDecision,ensureTimeState} from '../systems/career/timeAdvanceSystem.js';
import {upcomingFixtures} from '../systems/schedule/scheduleSystem.js';
import {selectAutoMatchChoice,matchPresentationFor,getPaceMode,getSpeed} from '../systems/pace/paceSystem.js';
import {DeterministicRng} from '../services/rng.js';
import {showToast} from '../components/toast.js';

export function renderMatchPage(container,ctx){
  const {store,repo,navigate}=ctx,save=store.state;ensureTimeState(save,repo);clear(container);const page=el('section',{className:'page match-page'});container.append(page);
  const pending=save.career.pending.match&&!save.career.pending.match.resolved?save.career.pending.match:null;
  if(pending){renderPending(pending);return()=>{}}
  const last=save.career.lastMatchResult;
  if(last&&last.season===save.career.season&&last.week>=Math.max(1,(save.career.calendar.week||1)-1))page.append(resultView(last,repo.getClub(last.clubId),repo.getClub(last.opponentId),{onReturn:()=>navigate('career')}));
  page.append(upcomingView(save,repo,goNextMatch));
  return()=>{};

  function renderPending(match){
    page.replaceChildren();const current=repo.getClub(save.career.clubId),opponent=repo.getClub(match.opponentId),recommended=matchPresentationFor(save,match);
    page.append(headerCard(match,current,opponent),presentationPicker(match,recommended,mode=>{
      if(mode==='interactive'){page.querySelector('.match-presentation-panel')?.remove();page.append(choiceView(match,current,opponent,choice=>settle(match,choice.id,'interactive')));return}
      settleAuto(match,mode);
    }));
    if(recommended==='interactive')page.append(choiceView(match,current,opponent,choice=>settle(match,choice.id,'interactive')));
  }

  async function goNextMatch(){
    if(getSpeed(save).id==='paused'){showToast('当前处于暂停状态，请先切换推进速度',{type:'error'});return}
    const buttonNode=page.querySelector('[data-next-match]');if(buttonNode){buttonNode.disabled=true;buttonNode.textContent='正在推进至下一场…'}
    try{const result=await advanceCareer(save,repo,'nextMatch');store.update(()=>{},'advance-to-match',result);if(result.reason==='event'){showToast('推进途中出现关键事件，请先回生涯页处理');navigate('career');return}if(result.reason==='match'){ctx.refresh();return}if(result.reason==='transfer'){showToast('收到转会报价，推进已暂停');navigate('transfer');return}showToast('本赛季没有更多比赛');ctx.refresh()}catch(error){showToast(error.message||'无法推进到下一场比赛',{type:'error'});ctx.refresh()}
  }

  function settleAuto(match,presentation){
    const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const choice=selectAutoMatchChoice(save,match,rng);save.rng=rng.snapshot();settle(match,choice?.id,presentation);
  }

  function settle(match,choiceId,presentation){
    try{
      const current=repo.getClub(save.career.clubId),opponent=repo.getClub(match.opponentId),result=resolveMatch(save,repo,choiceId,{presentation});
      save.career.lastMatchResult={...structuredClone(result),clubId:current.id,opponentId:opponent.id,season:save.career.season,week:save.career.calendar.week};
      acknowledgeMatchDecision(save);store.update(()=>{},'match-resolved',result);
      page.replaceChildren(resultView(save.career.lastMatchResult,current,opponent,{onReturn:()=>navigate('career')}),upcomingView(save,repo,goNextMatch));
      showToast(`比赛结束：${current.cn} ${result.score[0]}-${result.score[1]} ${opponent.cn} · 评分 ${result.playerResult.rating}`,{type:'success'});
    }catch(error){showToast(error.message||'比赛结算失败',{type:'error'})}
  }
}

function presentationPicker(match,recommended,onSelect){
  const panel=el('section',{className:'glass-card match-presentation-panel'},[
    el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'比赛呈现方式'}),el('h2',{text:'决定这场比赛看多细'})]),el('small',{className:'muted',text:`当前推荐：${presentationName(recommended)}`})])
  ]),grid=el('div',{className:'presentation-grid'}),items=[
    {id:'instant',icon:'»',name:'一键结果',desc:'直接显示比分、评分和能力变化，适合快速推进。'},
    {id:'timeline',icon:'≡',name:'快速时间线',desc:'保留进球、助攻、扑救和关键节点。'},
    {id:'interactive',icon:'⚽',name:'互动比赛',desc:'在关键时刻亲自选择射门、传球、突破或防守。'}
  ];
  items.forEach(item=>grid.append(button('',{className:`presentation-card ${recommended===item.id?'is-recommended':''}`,onClick:()=>onSelect(item.id)},[
    el('span',{className:'presentation-card__icon',text:item.icon}),el('strong',{text:item.name}),el('p',{text:item.desc}),recommended===item.id?el('small',{text:'推荐'}):null
  ])));panel.append(grid);return panel;
}
function presentationName(id){return{id:'',instant:'一键结果',timeline:'快速时间线',interactive:'互动比赛'}[id]||'互动比赛'}
function headerCard(match,current,opponent){return el('section',{className:'glass-card match-hero'},[
  el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:`${match.competition} · 第${match.week}周`}),el('h1',{text:`${current.cn} 对阵 ${opponent.cn}`})]),el('span',{className:'tag tag--accent',text:match.home?'主场':'客场'})]),
  el('div',{className:'scoreboard'},[clubMark(current),el('div',{className:'score-center'},[el('strong',{text:'对'}),el('small',{text:`${match.weather} · ${match.importance}`})]),clubMark(opponent)]),
  el('div',{className:'match-context'},[el('span',{text:`你的身份：${match.starts?'首发':match.substitute?'替补待命':'未进入名单'}`}),el('span',{text:`对手战术：${opponent.tactic||'均衡战术'}`}),el('span',{text:`实力 ${opponent.rep} · 进攻 ${opponent.attack} · 防守 ${opponent.defense}`})])
])}
function clubMark(club){return el('div',{className:'score-club'},[el('span',{className:'club-mark',text:club.code||club.cn.slice(0,1)}),el('b',{text:club.cn})])}
function choiceView(match,current,opponent,onChoose){
  const wrap=el('section',{className:'glass-card match-brief'},[
    el('span',{className:'eyebrow',text:match.substitute?`第 ${match.minute} 分钟`:match.starts?'比赛关键阶段':'替补席观察'}),
    el('h2',{text:match.starts?'球权来到你的区域':match.substitute?'准备登场':'阅读比赛'}),el('p',{text:scenarioText(match)})
  ]),list=el('div',{className:'match-choices'});
  match.keyChoices.forEach((choice,index)=>{const meta=matchChoiceMeta(choice,index),card=button('',{className:'match-choice',onClick:()=>onChoose(choice)});card.style.setProperty('--choice-color',meta.color);card.append(el('span',{className:'choice-icon',text:meta.icon}),el('span',{className:'choice-copy'},[el('strong',{text:choice.text}),el('small',{text:choice.hint})]),el('span',{className:'choice-assessment'},[el('span',{text:meta.risk}),el('b',{text:meta.reward})]));list.append(card)});wrap.append(list);return wrap;
}
function upcomingView(save,repo,onNext){
  const fixtures=upcomingFixtures(save,repo,6),section=el('section',{className:'glass-card upcoming-card'},[
    el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'赛程'}),el('h2',{text:'接下来六场'})]),el('small',{className:'muted',text:`${getPaceMode(save).name}`})])
  ]),list=el('div',{className:'fixture-list'});
  fixtures.forEach(f=>{const opponent=repo.getClub(f.opponentId);list.append(el('article',{className:'fixture-row'},[el('span',{className:'fixture-week',text:`第${f.week}周`}),el('div',{},[el('strong',{text:opponent.cn}),el('small',{text:`${f.competition} · ${f.home?'主场':'客场'} · ${f.importance}`})]),el('span',{className:'club-mark club-mark--small',text:opponent.code||opponent.cn.slice(0,1)})]))});
  if(!fixtures.length)list.append(el('p',{className:'muted',text:'本赛季赛程已经结束。'}));
  section.append(list,button(fixtures.length?'推进至下一场比赛':'返回生涯',{className:'button button--primary button--large',dataset:{nextMatch:'1'},onClick:fixtures.length?onNext:()=>history.back()}));return section;
}
function resultView(match,current,opponent,{onReturn}){const r=match.playerResult,wrap=el('section',{className:'match-result-page'}),summary=el('section',{className:'glass-card match-summary'},[
  el('span',{className:'eyebrow',text:`${match.competition} · ${presentationName(match.presentation)}`}),el('div',{className:'final-score',text:`${match.score[0]} : ${match.score[1]}`}),el('p',{text:`${current.cn} 对阵 ${opponent.cn}`}),el('div',{className:'rating-orb',text:String(r.rating)}),el('h2',{text:r.played?'你的比赛表现':'本场未获得出场机会'}),
  el('div',{className:'metric-grid'},[metric('出场时间',`${r.minutes}分钟`),metric('进球',r.goals),metric('助攻',r.assists),metric('关键传球',r.keyPasses),metric('抢断',r.tackles),metric('扑救',r.saves)])
]);
  const timeline=el('section',{className:'glass-card timeline-card'},[el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'快速时间线'}),el('h2',{text:'比赛关键事件'})])])]),list=el('div',{className:'timeline-list'});(match.timeline||[]).forEach(t=>list.append(el('div',{className:'timeline-item'},[el('span',{className:'timeline-minute',text:`${t.minute}'`}),el('div',{},[el('strong',{text:t.type}),el('small',{text:t.text||t.team})])])));timeline.append(list);wrap.append(summary,timeline,button('返回生涯并继续规划',{className:'button button--primary button--large',onClick:onReturn}));return wrap}
function metric(label,value){return el('div',{className:'metric'},[el('small',{text:label}),el('strong',{text:String(value)})])}
function scenarioText(match){if(!match.starts&&!match.substitute)return'你没有进入本场名单。观察对手站位和球队战术，仍会影响教练评价与学习经验。';if(match.substitute)return`教练准备在第 ${match.minute} 分钟左右派你登场，第一项行动会影响比赛评分。`;return'比赛进入关键阶段。不同选择会改变个人数据、体能、教练信任和球队结果。'}
function matchChoiceMeta(choice,index){const map={dri:{icon:'⚡',color:'#1677ff',risk:'中风险',reward:'突破'},pas:{icon:'🎯',color:'#248a3d',risk:'低风险',reward:'团队'},sho:{icon:'◎',color:'#d85b1d',risk:'高风险',reward:'高回报'},phy:{icon:'◆',color:'#8b5cf6',risk:'中风险',reward:'对抗'},def:{icon:'🛡️',color:'#248a3d',risk:'中风险',reward:'防守'},pac:{icon:'✦',color:'#5b5bd6',risk:'中风险',reward:'反应'}};return map[choice.focus]||[{icon:'⚡',color:'#1677ff',risk:'中风险',reward:'机会'},{icon:'🧠',color:'#8b5cf6',risk:'低风险',reward:'判断'}][index%2]}
