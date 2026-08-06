import {el,button} from '../utils/dom.js';
import {openSheet,closeSheet} from './sheet.js';
import {showToast} from './toast.js';
import {formatMoney,formatNumber,safeText} from '../utils/format.js';
import {scheduleStats} from '../systems/schedule/scheduleSystem.js';
import {totalFans} from '../systems/fan/fanSystem.js';
import {
  buildAnalysisSeries,chooseMedicalPlan,facilitySummaries,lockerActions,
  markAnalysisViewed,markHonoursViewed,medicalPlans,resolveLockerAction
} from '../systems/facility/facilityExperienceSystem.js';
import {markSectionViewed} from '../systems/attention/attentionManager.js';
import {animationDirector} from '../animations/director/animationDirector.js';
import {createTrophyIcon} from './trophyIcon.js';

export function openFacilityCenter({store,repo,ctx}){
  const save=store.state,club=repo.getClub(save.career.clubId),summaries=facilitySummaries(save);
  const content=el('div',{className:'v20-facility-center'});
  const grid=el('div',{className:'v20-facility-grid'});
  const entries=[
    ['analysis','▥',openDataAnalysis],['medical','✚',openMedicalCenter],['locker','▦',openLockerRoom],['honours','◇',openHonoursRoom]
  ];
  for(const[id,icon,open] of entries){
    const item=summaries[id];
    grid.append(button('',{className:'v20-facility-tile',onClick:()=>{closeSheet();requestAnimationFrame(()=>open({store,repo,ctx}))}},[
      el('span',{className:'v20-facility-icon',text:icon}),
      el('strong',{text:item.title}),
      el('small',{text:item.status}),
      el('b',{text:item.value}),
      item.attention?el('span',{className:'v20-attention-dot',text:'!'}):null
    ]));
  }
  content.append(grid,el('section',{className:'v20-detail-section'},[
    el('h3',{text:'更多设施'}),
    el('div',{className:'v20-info-list'},[
      infoRow('训练中心','训练方案、教练建议与训练事件'),
      infoRow('战术室','比赛策略和位置适配分析'),
      infoRow('关系网络','教练、队友、队长与经纪人关系'),
      infoRow('生涯档案','职业历史、关键节点与存档信息')
    ])
  ]));
  return openSheet({title:'数据与设施中心',subtitle:`${club.cn} · 所有操作写入当前存档`,content,size:'large'});
}

export function openDataAnalysis({store,repo,ctx}){
  store.update(save=>{markAnalysisViewed(save);markSectionViewed(save,'analysis')},'analysis-viewed');
  const save=store.state,club=repo.getClub(save.career.clubId),series=buildAnalysisSeries(save),stats=scheduleStats(save);
  const content=el('div',{className:'v20-analysis-detail'},[
    el('div',{className:'v20-metric-grid'},[
      metric('综合能力',save.player.ovr),metric('赛季出场',save.career.seasonStats.apps),metric('赛程场数',stats.total),metric('不同对手',stats.differentOpponents)
    ]),
    chartCard('综合能力趋势',series.ovr,'能力'),
    chartCard('比赛评分趋势',series.rating,'评分'),
    chartCard('进球与助攻趋势',series.goals.map((value,index)=>value+(series.assists[index]||0)),'参与进球'),
    chartCard('体能趋势',series.fitness,'体能'),
    chartCard('教练信任趋势',series.trust,'信任'),
    chartCard('粉丝增长趋势',series.fans,'粉丝'),
    el('section',{className:'v20-detail-section'},[
      el('h3',{text:'当前策略'}),
      el('div',{className:'v20-info-list'},[
        infoRow('自动训练',strategyName(save.career.strategies?.training)),
        infoRow('比赛策略',strategyName(save.career.strategies?.match)),
        infoRow('职业策略',strategyName(save.career.strategies?.career)),
        infoRow('粉丝总量',formatNumber(totalFans(save)))
      ])
    ])
  ]);
  return openSheet({title:'数据分析室',subtitle:`${club.cn} · 当前职业数据`,content,size:'large'});
}

export function openMedicalCenter({store,repo,ctx}){
  const save=store.state,club=repo.getClub(save.career.clubId),plans=medicalPlans(save),injury=save.status.injury;
  const content=el('div',{className:'v20-medical-detail'},[
    el('section',{className:'v20-medical-status'},[
      el('div',{},[
        el('small',{text:'当前状态'}),
        el('strong',{text:injury?injury.name:'无明确伤病'}),
        el('p',{text:injury?`预计还需${injury.remainingMatches||1}场 · 复发风险${injury.recurrenceRisk||25}%`:'当前以预防、恢复和体能管理为主。'})
      ]),
      progressRing(injury?Math.max(10,100-(injury.remainingMatches||1)*22):Math.round(save.status.fitness),'恢复')
    ]),
    el('div',{className:'v20-metric-grid'},[
      metric('体能',Math.round(save.status.fitness)),metric('疲劳',Math.round(save.status.fatigue)),metric('伤病倾向',Math.round(save.player.hidden.injuryProne)),metric('当前方案',plans.find(plan=>plan.selected)?.name||'轻量恢复')
    ]),
    el('section',{className:'v20-detail-section'},[
      el('h3',{text:'恢复方案'}),
      el('div',{className:'v20-plan-list'},plans.map(plan=>button('',{
        className:`v20-plan-card ${plan.selected?'is-selected':''}`,
        disabled:!plan.available,
        onClick:()=>{
          try{
            let result;
            store.update(state=>{result=chooseMedicalPlan(state,club,plan.id)},'medical-plan');
            void animationDirector.play('training-progress',{
              id:result.id,label:plan.name,
              growth:Math.max(0,Math.round(result.after.fitness-result.before.fitness)),
              fatigue:Math.round(result.after.fatigue),risk:result.after.injury?.recurrenceRisk||5
            },{token:result.id});
            closeSheet();
            requestAnimationFrame(()=>openMedicalResult({result,store,repo,ctx}));
          }catch(error){showToast(error.message,{type:'error'})}
        }
      },[
        el('div',{},[el('strong',{text:plan.name}),el('small',{text:plan.summary})]),
        el('span',{text:plan.cost?formatMoney(plan.cost):`风险 ${plan.risk>0?'+':''}${plan.risk}`})
      ])))
    ])
  ]);
  return openSheet({title:'医疗中心',subtitle:`${club.cn} · 选择后立即保存`,content,size:'large'});
}

function openMedicalResult({result,store,repo,ctx}){
  return openSheet({
    title:'医疗方案已更新',subtitle:result.plan,
    content:el('div',{className:'v20-result-card'},[
      el('div',{className:'result-orb result-orb--good',text:'完成'}),
      el('h3',{text:result.summary}),
      el('div',{className:'v20-metric-grid'},[
        metric('体能',`${Math.round(result.before.fitness)} → ${Math.round(result.after.fitness)}`),
        metric('疲劳',`${Math.round(result.before.fatigue)} → ${Math.round(result.after.fatigue)}`),
        metric('伤病',result.after.injury?.name||'无')
      ])
    ]),
    actions:[{label:'继续查看医疗中心',className:'button button--primary',onClick:()=>openMedicalCenter({store,repo,ctx})}]
  });
}

export function openLockerRoom({store,repo,ctx}){
  const save=store.state,club=repo.getClub(save.career.clubId),actions=lockerActions(save);
  const content=el('div',{className:'v20-locker-detail'},[
    el('div',{className:'v20-metric-grid'},[
      metric('队友信任',Math.round(save.relations.teammates.trust)),metric('队长关系',Math.round(save.relations.captain.trust)),metric('教练关系',Math.round(save.relations.coach.trust)),metric('队内顺位',`第${save.career.squadCompetition?.rank||4}位`)
    ]),
    el('section',{className:'v20-detail-section'},[
      el('h3',{text:'本周更衣室行动'}),
      el('div',{className:'v20-plan-list'},actions.map(action=>button('',{
        className:'v20-plan-card',disabled:!action.available,
        onClick:()=>{
          try{
            let result;
            store.update(state=>{result=resolveLockerAction(state,action.id)},'locker-action');
            void animationDirector.play('status-pulse',{id:result.id,label:action.name,positive:result.success},{token:result.id});
            closeSheet();requestAnimationFrame(()=>openLockerResult({result,store,repo,ctx}));
          }catch(error){showToast(error.message,{type:'error'})}
        }
      },[
        el('div',{},[el('strong',{text:action.name}),el('small',{text:action.summary})]),
        el('span',{text:action.available?'选择':'本周已处理'})
      ])))
    ]),
    el('section',{className:'v20-detail-section'},[
      el('h3',{text:'最近动态'}),
      ...(save.career.facilityCenter?.lockerHistory||[]).slice(0,5).map(item=>infoRow(item.action,item.summary))
    ])
  ]);
  return openSheet({title:'更衣室',subtitle:`${club.cn} · 关系会影响首发与配合`,content,size:'large'});
}

function openLockerResult({result,store,repo,ctx}){
  return openSheet({
    title:'更衣室互动结果',subtitle:result.action,
    content:el('div',{className:'v20-result-card'},[
      el('div',{className:`result-orb result-orb--${result.success?'good':'bad'}`,text:result.success?'进展':'有限'}),
      el('h3',{text:result.summary}),
      el('p',{className:'muted',text:'关系和队内顺位影响已经写入存档。'})
    ]),
    actions:[{label:'返回更衣室',className:'button button--primary',onClick:()=>openLockerRoom({store,repo,ctx})}]
  });
}

export function openHonoursRoom({store,repo,ctx}){
  store.update(save=>{markHonoursViewed(save);markSectionViewed(save,'honours')},'honours-viewed');
  const save=store.state,club=repo.getClub(save.career.clubId),trophies=save.career.trophies||[],achievements=save.achievements.unlocked||[];
  const history=(save.career.history||[]).filter(item=>/award|trophy|achievement|冠军|奖/.test(`${item.type}${item.title}`)).slice(-12).reverse();
  const content=el('div',{className:'v20-honours-detail'},[
    el('div',{className:'v20-metric-grid'},[
      metric('团队奖杯',save.career.careerStats.titles),metric('个人成就',achievements.length),metric('生涯纪录',Object.keys(save.career.records||{}).length),metric('代表比赛',save.career.careerStats.bigGames||0)
    ]),
    el('section',{className:'v20-trophy-shelf'},[
      el('h3',{text:'奖杯陈列'}),
      ...trophies.slice(-8).reverse().map(trophy=>el('article',{className:'v20-trophy-card'},[
        createTrophyIcon(trophy,{size:'small'}),el('div',{},[el('strong',{text:safeText(trophy.name,'生涯荣誉')}),el('small',{text:`${trophy.year||save.career.year}年`})])
      ])),
      trophies.length?null:el('p',{className:'muted',text:'尚未获得正式团队奖杯，接近完成的成就会在这里显示。'})
    ]),
    el('section',{className:'v20-detail-section'},[
      el('h3',{text:'生涯时间线'}),
      ...(history.length?history.map(item=>infoRow(item.title||'生涯里程碑',item.text||`${item.year||''}年`)):[el('p',{className:'muted',text:'暂无新的荣誉记录。'})])
    ])
  ]);
  void animationDirector.play('trophy-reveal',{id:`honours:${save.career.season}`,label:trophies.at(-1)?.name||'荣誉室'},{token:`honours:${save.career.season}`});
  return openSheet({title:'荣誉室',subtitle:club.cn,content,size:'large',actions:[{label:'查看完整生涯档案',className:'button button--primary',onClick:()=>ctx.navigate('profile')}]});
}

function metric(label,value){return el('div',{className:'v20-metric'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function infoRow(label,value){return el('div',{className:'v20-info-row'},[el('span',{text:label}),el('strong',{text:String(value??'—')})])}
function strategyName(value){return{health:'保持健康',stable:'稳健比赛',stay:'留队竞争',balanced:'均衡成长',shooting:'重点射门',speed:'重点速度',passing:'重点传球',physical:'重点身体',team:'团队优先',aggressive:'积极表现',transfer:'寻求转会',loan:'接受租借',minutes:'优先出场时间'}[value]||'均衡策略'}
function progressRing(value,label){return el('div',{className:'v20-progress-ring',attrs:{style:`--progress:${Math.max(0,Math.min(100,Number(value)||0))}`}},[el('strong',{text:`${Math.round(Number(value)||0)}%`}),el('small',{text:label})])}
function chartCard(title,values,label){const safe=(values||[]).map(Number).filter(Number.isFinite),content=safe.length?createSparkline(safe):el('p',{className:'v20-chart-empty',text:'当前样本不足，完成更多比赛和训练后将显示趋势。'});return el('section',{className:'v20-chart-card'},[el('div',{className:'v20-section-heading'},[el('strong',{text:title}),el('small',{text:safe.length?`${label} ${safe.at(-1)}`:'暂无数据'})]),content])}
function createSparkline(values){const width=520,height=130,min=Math.min(...values),max=Math.max(...values),range=Math.max(1,max-min),points=values.map((value,index)=>`${20+(index/Math.max(1,values.length-1))*(width-40)},${height-18-((value-min)/range)*(height-38)}`).join(' ');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','v20-sparkline');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`趋势数据：${values.join('、')}`);const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',points);line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','6');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');svg.append(line);return svg}
