import {el,button} from '../utils/dom.js';
import {formatCurrency,formatNumber,formatPercentage} from '../utils/format.js';
import {openSheet,closeSheet} from './sheet.js';
import {createClubCrest} from './clubCrest.js';
import {clubCoordinates,clubFit,ensureWorldExplorerState,setTransferTarget,toggleCompare,toggleFavorite} from '../systems/world/worldExplorerSystem.js';
import {isTransferWindow,submitInterest} from '../systems/transfer/transferSystem.js';
import {showToast} from './toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';

export function openClubDetail({club,save,repo,store,ctx,source='world',offer=null}){
  const state=ensureWorldExplorerState(save),fit=clubFit(save,club),coords=clubCoordinates(club),favorite=state.favorites.includes(club.id),compared=state.compare.includes(club.id),target=state.transferTargets.includes(club.id);
  const content=el('div',{className:'v20-club-detail'},[
    hero(club,fit),
    miniMap(club,coords),
    metricSection(club),
    opportunitySection(save,club,fit),
    contractSection(save,club,fit,offer),
    el('p',{className:'v20-data-note',text:'球队名称来自项目内置俱乐部资料；能力、财政、青训和机会为独立游戏模拟评级，不代表官方数据。'})
  ]);
  const actions=[];
  actions.push({label:favorite?'取消收藏':'收藏球队',className:'button button--secondary',close:false,onClick:()=>{let value;store.update(s=>{value=toggleFavorite(s,club.id)},'club-favorite');showToast(value?'已收藏球队':'已取消收藏',{type:'success'});closeSheet();requestAnimationFrame(()=>openClubDetail({club,save:store.state,repo,store,ctx,source,offer}));return false}});
  actions.push({label:target?'当前目标':'设为目标',className:'button button--secondary',close:false,onClick:()=>{store.update(s=>setTransferTarget(s,club.id),'transfer-target');showToast(`${club.cn}已设为转会目标`,{type:'success'});closeSheet();ctx.refresh();return false}});
  const current=repo.getClub(save.career.clubId);
  if(club.id!==current.id){
    const prior=[...save.career.history].reverse().find(x=>x.type==='interest'&&x.clubId===club.id&&x.season===save.career.season&&x.month===save.career.month);
    actions.push({label:prior?prior.status:(isTransferWindow(save)?'提交接触意向':'让经纪人关注'),className:'button button--primary',disabled:Boolean(prior),onClick:()=>{
      try{let result;store.update(s=>{result=submitInterest(s,repo,club.id)},'club-interest');showToast(`${club.cn}：${result.status}`,{type:result.offer?'success':'info'});ctx.refresh()}catch(error){showToast(error.message||'无法提交意向',{type:'error'})}
    }});
  }
  void animationDirector.play('crest-assemble',{id:club.id,monogram:club.cn.slice(0,2),club:club.cn},{token:`club-detail:${club.id}`});
  return openSheet({title:club.cn,subtitle:`${club.country} · ${club.city||'城市资料未核实'} · ${club.leagueCn}`,content,actions,size:'large'});
}

function hero(club,fit){return el('section',{className:'v20-club-hero'},[
  createClubCrest(club,{size:'large'}),
  el('div',{className:'v20-club-hero__copy'},[el('span',{className:'eyebrow',text:`${club.country} · ${club.leagueCn}`}),el('h2',{text:club.cn}),el('p',{text:`${club.tactic||'均衡战术'} · 常用${club.formation||'动态阵型'}`})]),
  el('div',{className:'v20-fit-orb'},[el('strong',{text:String(fit)}),el('small',{text:'适配'})])
])}
function miniMap(club,coords){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('class','v20-club-map');svg.setAttribute('viewBox','0 0 100 60');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${club.cn}所在地区示意图`);
  const defs=document.createElementNS(ns,'defs'),gradient=document.createElementNS(ns,'linearGradient');gradient.id='mapSoft';gradient.setAttribute('x1','0');gradient.setAttribute('x2','1');
  for(const[offset,color]of [['0','#dbe8ff'],['1','#ecf3ff']]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);gradient.append(stop)}defs.append(gradient);
  const rect=document.createElementNS(ns,'rect');for(const[key,value]of Object.entries({x:'1',y:'1',width:'98',height:'58',rx:'12',fill:'url(#mapSoft)'}))rect.setAttribute(key,value);
  const path=document.createElementNS(ns,'path');path.setAttribute('d','M7 38 C18 19 27 18 36 29 S57 46 68 30 S85 18 94 31');path.setAttribute('fill','none');path.setAttribute('stroke','rgba(10,132,255,.25)');path.setAttribute('stroke-width','2');
  const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',String(coords.x));dot.setAttribute('cy',String(coords.y*.58));dot.setAttribute('r','4');dot.setAttribute('fill','#0A84FF');
  const pulse=document.createElementNS(ns,'circle');pulse.setAttribute('cx',String(coords.x));pulse.setAttribute('cy',String(coords.y*.58));pulse.setAttribute('r','8');pulse.setAttribute('fill','none');pulse.setAttribute('stroke','rgba(10,132,255,.25)');pulse.setAttribute('stroke-width','2');
  svg.append(defs,rect,path,pulse,dot);
  return el('section',{className:'v20-map-card'},[el('div',{className:'v20-section-heading'},[el('div',{},[el('small',{text:'位置'}),el('strong',{text:`${club.country} · ${club.city||'城市资料未核实'}`})]),el('span',{className:'v20-tag',text:'本地示意地图'})]),svg])
}
function metricSection(club){return el('section',{className:'v20-detail-section'},[el('h3',{text:'俱乐部环境'}),el('div',{className:'v20-metric-grid'},[
  metric('综合实力',club.rep),metric('进攻',club.attack),metric('防守',club.defense),metric('青训',club.youth),metric('财政',club.finance),metric('声望',club.reputation||club.rep),metric('球迷规模',formatNumber(club.fanBase)),metric('球场容量',formatNumber(club.stadiumCapacity))
])])}
function opportunitySection(save,club,fit){
  const needs=(club.needs||[]),samePosition=needs.includes(save.player.position),role=fit>=78?'有望进入主要轮换':fit>=58?'需要竞争轮换位置':'更适合长期培养';
  return el('section',{className:'v20-detail-section'},[el('h3',{text:'机会分析'}),el('div',{className:'v20-info-list'},[
    row('位置需求',samePosition?'当前位置正缺人':needs.join('、')||'阵容较均衡'),row('预计角色',role),row('年轻球员机会',formatPercentage(club.youthUsage)),row('成长环境',club.youth>=75?'优秀青训与训练条件':club.youth>=60?'稳定培养环境':'需要依靠比赛时间成长'),row('战术适配',`${club.tactic||'均衡战术'} · ${fit}%`),row('注册限制','根据联赛与国籍规则动态评估')
  ])])
}
function contractSection(save,club,fit,offer){
  const wage=offer?.weeklyWage||Math.round((save.finance.weeklyWage||300)*(0.8+club.rep/100)*(0.85+fit/200));
  const role=offer?.role||(fit>=80?'主力竞争者':fit>=62?'轮换球员':'发展球员');
  return el('section',{className:'v20-detail-section'},[el('h3',{text:'合同预估'}),el('div',{className:'v20-metric-grid v20-metric-grid--contract'},[
    metric('周薪范围',`${formatCurrency(wage*.85)}—${formatCurrency(wage*1.15)}`),metric('合同年限',offer?`${offer.years}年`:'2—4年'),metric('队内角色',role),metric('发展计划',offer?.developmentPlan||'根据表现逐步增加出场')
  ])])
}
function metric(label,value){return el('div',{className:'v20-metric'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function row(label,value){return el('div',{className:'v20-info-row'},[el('span',{text:label}),el('strong',{text:String(value??'—')})])}
