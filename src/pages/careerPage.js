import {el,button,clear} from '../utils/dom.js';
import {createPlayerCard} from '../components/playerCard.js';
import {openSheet,closeSheet} from '../components/sheet.js';
import {showToast} from '../components/toast.js';
import {formatMoney,formatNumber,percent} from '../utils/format.js';
import {beginPhase,markEventDone,prepareMatch,finishPhase} from '../systems/career/cycleSystem.js';
import {resolveEventChoice,eventChoiceMeta} from '../systems/event/eventEngine.js';
import {totalFans} from '../systems/fan/fanSystem.js';
import {performFacilityAction,facilityAvailable} from '../systems/facility/facilitySystem.js';
import {POSITION_CONFIG} from '../app/config.js';

export function renderCareerPage(container,ctx){
  const {store,repo,navigate}=ctx,save=store.state,club=repo.getClub(save.career.clubId);
  clear(container);
  const page=el('section',{className:'page career-page'});
  page.append(
    el('div',{className:'career-hero'},[createPlayerCard(save,club),overview(save,club,repo)]),
    quickCards(save,repo),
    fanTrend(save),
    facilities(save,club,ctx)
  );
  container.append(page);
  wireMainAction();

  function wireMainAction(){
    const b=page.querySelector('[data-career-action]');
    if(!b)return;
    b.addEventListener('click',async()=>{
      try{
        if(save.career.retirement){showRetirement(save.career.retirement);return}
        if(save.career.pending.match&&!save.career.pending.match.resolved){navigate('match');return}
        if(save.career.phase?.matchDone&&save.career.phase?.eventDone){
          const result=finishPhase(save,repo);
          store.update(()=>{},'phase-finished',result);
          if(result.achievements.length)showToast(`解锁 ${result.achievements.length} 项新成就`,{type:'success'});
          if(result.seasonAwards?.length)showToast(`赛季荣誉：${result.seasonAwards.map(x=>x.name).join('、')}`,{type:'success',duration:4200});
          if(result.offers.length)showToast(`收到 ${result.offers.length} 份转会报价`,{type:'success'});
          ctx.refresh();
          return;
        }
        const {event}=await beginPhase(save,repo);
        store.update(()=>{},'phase-started');
        showEvent(event);
      }catch(error){showToast(error.message||'无法推进生涯',{type:'error'})}
    });
  }

  function showEvent(event){
    if(!event){showToast('事件生成失败，请重新进入生涯页',{type:'error'});return}
    const content=el('div',{className:'event-sheet'});
    content.append(
      el('div',{className:'event-meta'},[
        el('span',{className:'tag tag--accent',text:event.categoryCn}),
        el('span',{className:'tag',text:event.pressure}),
        el('span',{className:'tag',text:`${event.choices.length}个方案`})
      ]),
      el('p',{className:'event-description',text:event.description})
    );
    const list=el('div',{className:'event-choices'});
    event.choices.forEach(choice=>{
      const card=button('',{className:'event-choice',onClick:()=>choose(choice)});
      card.append(el('div',{},[el('strong',{text:choice.text}),el('small',{text:choice.hint})]),el('span',{className:'choice-style',text:eventChoiceMeta(choice)}));
      list.append(card);
    });
    content.append(list);
    openSheet({title:event.title,subtitle:'选择会影响即时状态、关系和未来剧情',content,dismissible:false,size:'large'});
  }

  function choose(choice){
    try{
      const result=resolveEventChoice(save,choice.id);
      markEventDone(save);
      prepareMatch(save,repo);
      store.update(()=>{},'event-resolved',result);
      const content=el('div',{className:'outcome-card'},[
        el('div',{className:`result-orb result-orb--${result.outcome.label==='出现代价'?'bad':'good'}`,text:result.outcome.label}),
        el('h3',{text:result.choice.text}),
        el('p',{text:outcomeText(result.outcome)}),
        effects(result.outcome.effects)
      ]);
      openSheet({title:'事件结果',subtitle:'结果已经写入存档，刷新页面不会改变',content,dismissible:false,actions:[{label:'前往比赛',className:'button button--primary',onClick:()=>{closeSheet();navigate('match')}}]});
    }catch(error){showToast(error.message||'事件结算失败',{type:'error'})}
  }

  function showRetirement(ending){
    openSheet({title:'职业生涯已经结束',subtitle:ending.name,content:el('div',{className:'ending-card'},[el('div',{className:'ending-icon',text:'🏆'}),el('h2',{text:ending.name}),el('p',{text:ending.desc})]),actions:[{label:'查看我的档案',className:'button button--primary',onClick:()=>navigate('profile')}]});
  }
  return()=>{};
}

function overview(save,club,repo){
  const ss=save.career.seasonStats;
  const match=save.career.pending.match;
  const opponent=match?repo.getClub(match.opponentId):null;
  return el('section',{className:'glass-card career-overview'},[
    el('div',{className:'section-heading'},[
      el('div',{},[el('span',{className:'eyebrow',text:`第 ${save.career.season} 赛季`}),el('h1',{text:`${save.player.name}的职业生涯`})]),
      el('span',{className:'season-pill',text:`${save.career.seasonProgress}%`})
    ]),
    el('p',{className:'muted',text:`${club.cn} · ${save.career.squadLevel} · ${save.career.teamRole}`}),
    statsGrid([['出场',ss.apps],['进球',ss.goals],['助攻',ss.assists],['平均评分',ss.rating||'—']]),
    el('div',{className:'next-match-card'},[
      el('small',{text:'下一场比赛'}),
      el('strong',{text:opponent?`对阵 ${opponent.cn}`:'完成职业事件后生成赛程'}),
      el('span',{text:match?`${match.home?'主场':'客场'} · ${match.importance} · ${match.weather}`:`赛季第 ${save.career.month}/${10} 阶段`})
    ]),
    progress('体能',save.status.fitness),progress('士气',save.status.morale),progress('教练信任',save.status.coachTrust),
    el('button',{className:'button button--primary button--large',text:actionLabel(save),attrs:{type:'button'},dataset:{careerAction:'1'}})
  ]);
}
function actionLabel(save){if(save.career.retirement)return'查看职业生涯结局';if(save.career.pending.match&&!save.career.pending.match.resolved)return'前往下一场比赛';if(save.career.phase?.matchDone&&save.career.phase?.eventDone)return'完成本阶段并推进时间';return'开始本阶段'}
function quickCards(save,repo){
  const pending=(save.career.pending.event&&!save.career.pending.event.resolved?1:0)+(save.career.pending.match&&!save.career.pending.match.resolved?1:0);
  const position=POSITION_CONFIG[save.player.position]?.name||save.player.position;
  return el('div',{className:'summary-strip'},[
    metric('粉丝总数',formatNumber(totalFans(save)),'近期增长受比赛与媒体影响'),
    metric('社交关注',formatNumber(save.fans.social),`舆论倾向 ${save.fans.sentiment}`),
    metric('商业价值',`${save.fans.commercialValue}/100`,`媒体热度 ${save.fans.mediaHeat}`),
    metric('当前身价',formatMoney(save.finance.marketValue),`周薪 ${formatMoney(save.finance.weeklyWage)}`),
    metric('合同',`${save.career.contract.years}年`,save.career.contract.appearancePromise),
    metric('场上位置',position,`球衣 ${save.player.number} 号`),
    metric('待处理内容',String(pending),save.career.pending.offers.length?`${save.career.pending.offers.length}份转会报价`:'暂无转会报价')
  ]);
}

function fanTrend(save){
  const history=save.fans.history?.slice(-14)||[];
  const values=history.length?history.map(x=>Number(x.total||0)):[save.fans.local+save.fans.club+save.fans.global];
  const social=history.length?history.map(x=>Number(x.social||0)):[save.fans.social];
  const section=el('section',{className:'glass-card trend-card'});
  section.append(el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'粉丝趋势'}),el('h2',{text:'影响力成长曲线'})]),el('small',{className:'muted',text:history.at(-1)?.reason||'职业生涯起点'})]));
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 720 190');svg.setAttribute('class','trend-chart');svg.setAttribute('role','img');svg.setAttribute('aria-label',`粉丝总数 ${values.at(-1)}，社交关注 ${social.at(-1)}`);
  const all=[...values,...social],max=Math.max(1000,...all),min=Math.min(0,...all);
  const coords=arr=>arr.map((v,i)=>`${arr.length===1?360:24+i*(672/(arr.length-1))},${165-(v-min)/(max-min||1)*130}`).join(' ');
  for(let i=0;i<4;i++){const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1','24');line.setAttribute('x2','696');line.setAttribute('y1',String(35+i*43));line.setAttribute('y2',String(35+i*43));line.setAttribute('class','trend-grid');svg.append(line)}
  const totalLine=document.createElementNS(svg.namespaceURI,'polyline');totalLine.setAttribute('points',coords(values));totalLine.setAttribute('class','trend-line trend-line--fans');svg.append(totalLine);
  const socialLine=document.createElementNS(svg.namespaceURI,'polyline');socialLine.setAttribute('points',coords(social));socialLine.setAttribute('class','trend-line trend-line--social');svg.append(socialLine);
  section.append(svg,el('div',{className:'trend-legend'},[el('span',{text:'● 粉丝总数'}),el('span',{text:'● 社交关注'}),el('strong',{text:`最近变化 ${history.length>1?(values.at(-1)-values.at(-2)>=0?'+':'')+(values.at(-1)-values.at(-2)):0}`})]));
  return section;
}

function facilities(save,club,ctx){
  const items=[
    {id:'stadium',name:'主球场',icon:'🏟️',desc:`${formatNumber(club.stadiumCapacity)}个座位`},
    {id:'academy',name:'青训基地',icon:'🌱',desc:`青训等级 ${club.youth}`},
    {id:'training',name:'一线队训练场',icon:'⚽',desc:club.tactic},
    {id:'medical',name:'医疗与康复中心',icon:'✚',desc:save.status.injury?'正在康复':'身体状态正常'},
    {id:'analysis',name:'数据分析室',icon:'⌁',desc:'查看比赛与成长趋势'},
    {id:'shop',name:'球迷商店',icon:'🛍️',desc:`${formatNumber(save.fans.club)}名俱乐部粉丝`},
    {id:'press',name:'新闻发布厅',icon:'🎙️',desc:`媒体热度 ${save.fans.mediaHeat}`},
    {id:'locker',name:'更衣室',icon:'▦',desc:`队友信任 ${save.relations.teammates.trust}`},
    {id:'trophy',name:'荣誉室',icon:'🏆',desc:`${save.career.careerStats.titles}座奖杯`}
  ];
  const section=el('section',{className:'section-block'},[
    el('div',{className:'section-heading'},[
      el('div',{},[el('span',{className:'eyebrow',text:'俱乐部区域'}),el('h2',{text:'比赛日之外'})]),
      el('small',{className:'muted',text:'设施互动会写入存档，并受到阶段冷却限制'})
    ])
  ]);
  const grid=el('div',{className:'facility-grid'});
  items.forEach(item=>{
    const available=!['academy','medical','shop','press','locker'].includes(item.id)||facilityAvailable(save,item.id);
    const card=button('',{className:`facility-card ${available?'':'is-used'}`,onClick:()=>openFacility(item,save,club,ctx)});
    card.append(el('span',{className:'facility-icon',text:item.icon}),el('strong',{text:item.name}),el('small',{text:available?item.desc:'本阶段已互动'}));
    grid.append(card);
  });
  section.append(grid);return section;
}

function openFacility(item,save,club,ctx){
  if(item.id==='training'){ctx.navigate('training');return}
  if(item.id==='stadium'){
    const match=save.career.pending.match;const opponent=match?ctx.repo.getClub(match.opponentId):null;
    const content=el('div',{className:'facility-detail'},[
      el('div',{className:'facility-detail__icon',text:item.icon}),
      el('h3',{text:opponent?`下一场：对阵${opponent.cn}`:'当前没有已生成的比赛'}),
      el('p',{text:opponent?`${match.home?'主场':'客场'} · ${match.importance} · ${match.weather}`:`完成本阶段职业事件后，教练组会确认比赛名单。`}),
      el('div',{className:'detail-list'},[detail('球场容量',formatNumber(club.stadiumCapacity)),detail('球队战术',club.tactic),detail('当前身份',save.career.teamRole)])
    ]);
    openSheet({title:'主球场',subtitle:club.cn,content,actions:opponent?[{label:'进入比赛页',className:'button button--primary',onClick:()=>ctx.navigate('match')}]:[]});return;
  }
  if(item.id==='analysis'){
    const stats=save.career.seasonStats;
    const content=el('div',{className:'facility-detail'},[
      el('div',{className:'metric-grid'},[
        metricNode('综合能力',save.player.ovr),metricNode('潜力',save.player.potential),metricNode('平均评分',stats.rating||'—'),metricNode('赛季出场',stats.apps)
      ]),
      el('div',{className:'detail-list'},[
        detail('训练计划',save.career.trainingPlan),detail('体能 / 疲劳',`${Math.round(save.status.fitness)} / ${Math.round(save.status.fatigue)}`),detail('教练信任',Math.round(save.status.coachTrust)),detail('最近成长记录',save.career.history.filter(x=>x.type==='season').at(-1)?.text||'尚无完整赛季记录')
      ])
    ]);
    openSheet({title:'数据分析室',subtitle:'所有数据来自当前存档',content});return;
  }
  if(item.id==='trophy'){
    const trophies=save.career.trophies||[];
    const content=el('div',{className:'facility-detail'},[
      trophies.length?el('div',{className:'trophy-summary-list'},trophies.slice(-12).reverse().map(t=>el('article',{className:'trophy-summary-item'},[el('span',{text:'🏆'}),el('div',{},[el('strong',{text:t.name}),el('small',{text:`${t.year}年 · ${t.detail||t.type}`})])]))):el('p',{className:'muted',text:'尚未获得正式奖杯或个人荣誉。'}),
      el('p',{text:`已解锁成就 ${save.achievements.unlocked.length} 项，成就分 ${save.achievements.score}。`})
    ]);
    openSheet({title:'荣誉室',subtitle:`职业奖杯 ${save.career.careerStats.titles} 座`,content,actions:[{label:'查看全部成就',className:'button button--primary',onClick:()=>ctx.navigate('profile')} ]});return;
  }
  const result=performFacilityAction(save,club,item.id);
  ctx.store.update(()=>{},`facility-${item.id}`,result);
  const content=el('div',{className:'facility-result'},[
    el('div',{className:`result-orb result-orb--${result.ok?'good':'bad'}`,text:result.ok?'完成':'受限'}),
    el('h3',{text:result.title}),el('p',{text:result.summary})
  ]);
  openSheet({title:item.name,subtitle:`${club.cn} · 第${save.career.month}阶段`,content});
  ctx.refresh();
}

function statsGrid(items){const grid=el('div',{className:'metric-grid'});items.forEach(([l,v])=>grid.append(metricNode(l,v)));return grid}
function metricNode(label,value){return el('div',{className:'metric'},[el('small',{text:label}),el('strong',{text:String(value)})])}
function progress(label,value){return el('div',{className:'progress-row'},[el('span',{text:label}),el('div',{className:'progress-track'},[el('i',{attrs:{style:`width:${value}%`}})]),el('b',{text:percent(value)})])}
function metric(label,value,sub){return el('article',{className:'glass-card summary-card'},[el('small',{text:label}),el('strong',{text:value}),el('p',{text:sub})])}
function detail(label,value){return el('div',{className:'detail-row'},[el('span',{text:label}),el('strong',{text:String(value)})])}
function effects(e={}){const wrap=el('div',{className:'effect-list'});const labels={xp:'能力经验',coach:'教练信任',trust:'教练信任',morale:'士气',fans:'粉丝',fitness:'体能',money:'现金',fatigue:'疲劳'};for(const[k,v]of Object.entries(e)){if(!v)continue;wrap.append(el('span',{className:`effect-chip ${v<0?'is-negative':''}`,text:`${labels[k]||k} ${v>0?'+':''}${v}`}))}return wrap}
function outcomeText(outcome){return outcome.label==='大成功'?'你的选择产生了超出预期的积极连锁反应。':outcome.label==='取得进展'?'事情按计划推进，并留下了可持续的收益。':outcome.label==='影响有限'?'结果较为平稳，没有明显改变职业轨迹。':'这次选择付出了代价，后续需要通过训练和比赛修正。'}
