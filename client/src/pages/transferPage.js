import {el,button,clear} from '../utils/dom.js';
import {generateOffers,isTransferWindow,respondOffer,submitInterest,marketValue,availableOfferActions,declareStay,expireOffers} from '../systems/transfer/transferSystem.js';
import {formatCurrency,formatPercentage,formatTransferStatus} from '../utils/format.js';
import {openSheet,closeSheet} from '../components/sheet.js';
import {createClubCrest} from '../components/clubCrest.js';
import {showToast} from '../components/toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';

const NEGOTIATION_ACTIONS=[
  ['提高工资','negotiateWage','争取更高周薪，会降低成交稳定性。'],
  ['调整角色','negotiateRole','争取更重要的队内定位和出场承诺。'],
  ['改为租借','loan','以一年租借换取更明确的比赛时间。'],
  ['调整解约金','clause','降低未来离队门槛。']
];

export function renderTransferPage(container,ctx){
  const {store,repo}=ctx,save=store.state;let generated=false;
  store.update(s=>{expireOffers(s);const before=s.career.pending.offers.length;generateOffers(s,repo);generated=s.career.pending.offers.length!==before},'transfer-state-checked');
  const current=repo.getClub(save.career.clubId),windowOpen=isTransferWindow(save),offers=save.career.pending.offers;
  clear(container);
  const page=el('section',{className:'page transfer-page'});
  page.append(
    el('header',{className:'page-title'},[
      el('div',{},[
        el('span',{className:'eyebrow',text:'转会与合同'}),
        el('h1',{text:windowOpen?'转会窗口开放':'转会窗口关闭'}),
        el('p',{text:windowOpen?'比较报价、谈判条款或选择留队。每次决定都会立即保存。':'可以提交转会意向，正式报价只会在夏季或冬季窗口出现。'})
      ]),
      el('section',{className:'compact-status'},[
        createClubCrest(current,{size:'small'}),
        el('div',{},[el('small',{text:'当前合同'}),el('strong',{text:`${current.cn} · 剩余${save.career.contract.years}年`}),el('p',{text:`周薪 ${formatCurrency(save.finance.weeklyWage)} · 身价 ${formatCurrency(marketValue(save,current))}`})])
      ])
    ])
  );
  const stayLocked=Boolean(save.career.transferWindows?.[`${save.career.season}:${save.career.month}`]?.stayChosen);
  page.append(el('div',{className:'transfer-toolbar'},[
    button('主动申请转会',{className:'button button--secondary',onClick:()=>openInterestSearch(save,repo,store,ctx)}),
    button(stayLocked?'本窗口已选择留队':'留队争取位置',{className:'button',disabled:stayLocked||!windowOpen,onClick:()=>{
      try{let result;store.update(s=>{result=declareStay(s)},'stay-chosen',result);showToast('已选择留队，本窗口其他报价已经关闭',{type:'success'});ctx.refresh()}catch(error){showToast(error.message,{type:'error'})}
    }})
  ]));
  const list=el('div',{className:'offer-list'});
  if(!offers.length)list.append(el('section',{className:'empty-state glass-card'},[
    el('div',{className:'empty-icon',text:'↗'}),
    el('h2',{text:windowOpen?'暂时没有正式报价':'等待转会窗口'}),
    el('p',{text:windowOpen?(generated?'市场评估已经完成，继续提升能力、出场数据和声望。':'当前没有球队愿意提交正式报价。'):'夏季窗口在第1阶段，冬季窗口在第5阶段。'})
  ]));
  offers.forEach(offer=>list.append(offerCard(offer,repo.getClub(offer.clubId),save,store,repo,ctx)));
  page.append(list);container.append(page);
  const reveal=offers.find(offer=>availableOfferActions(save,offer).length);
  if(reveal)void animationDirector.play('offer-envelope',{id:reveal.id,club:repo.getClub(reveal.clubId)?.cn,value:formatCurrency(reveal.transferFee||0)},{token:`offer-envelope:${reveal.id}`});
  return()=>{};
}

function offerCard(offer,club,save,store,repo,ctx){
  const allowed=new Set(availableOfferActions(save,offer));
  const fit=offerFit(save,club,offer),fee=offer.type==='续约'?'不适用':offer.type==='租借'?'租借免转会费':formatCurrency(offer.transferFee||0);
  const card=el('article',{className:`transfer-offer-card ${allowed.size?'':'is-closed'}`});
  card.append(
    el('header',{className:'offer-header'},[
      createClubCrest(club,{size:'normal'}),
      el('div',{className:'offer-identity'},[
        el('h2',{text:club.cn}),
        el('p',{text:`${club.country} · ${club.leagueCn}`}),
        el('span',{className:'eyebrow',text:offer.type||'正式转会'})
      ]),
      el('span',{className:`offer-status status-${String(offer.status).replace(/\s/g,'')}`,text:formatTransferStatus(offer.status)})
    ]),
    el('div',{className:'offer-metrics'},[
      metric('转会费',fee),metric('合同年限',`${offer.years}年`),metric('队内角色',offer.role),metric('周薪',formatCurrency(offer.weeklyWage))
    ]),
    el('div',{className:'offer-context'},[
      contextItem('教练兴趣',formatPercentage(offer.coachInterest)),
      contextItem('位置需求',(club.needs||[]).join('、')||'暂无'),
      contextItem('战术适配度',formatPercentage(fit)),
      contextItem('成交概率',formatPercentage(offer.probability))
    ])
  );
  const details=el('details',{className:'offer-more'},[
    el('summary',{text:'查看完整合同条款'}),
    el('div',{className:'contract-grid'},[
      ['签字费',formatCurrency(offer.signingBonus)],['解约金',offer.releaseClause?formatCurrency(offer.releaseClause):'无'],['出场承诺',offer.appearancePromise],['发展计划',offer.developmentPlan||'逐步融入一线队'],['谈判轮次',`${offer.negotiationRound||0}/2`],['有效期',`第${offer.createdMonth}阶段结束前`]
    ].map(([label,value])=>metric(label,value)))
  ]);
  const controls=el('footer',{className:'offer-actions'});
  if(!allowed.size)controls.append(el('p',{className:'muted',text:offer.expiredReason||'该报价已经结束，不能继续操作。'}));
  else{
    const runAction=async action=>{
      if(!allowed.has(action))return;
      try{
        controls.querySelectorAll('button').forEach(node=>node.disabled=true);
        const fromClub=repo.getClub(save.career.clubId)?.cn||'原俱乐部';
        let result;store.update(s=>{result=respondOffer(s,repo,offer.id,action)},'offer-response',result);
        if(action==='accept')await animationDirector.playSequence([
          {id:'contract-sign',result:{id:offer.id,club:club.cn,clauses:[`${offer.years}年合同`,`${offer.role}`,`周薪 ${formatCurrency(offer.weeklyWage)}`]},options:{token:`contract:${offer.id}`}},
          {id:'transfer-route',result:{id:offer.id,stops:[fromClub,'合同确认',club.cn],label:`加盟 ${club.cn}`},options:{token:`route:${offer.id}`}}
        ]);
        else if(action.startsWith('negotiate')||action==='loan'||action==='clause')await animationDirector.play('fate-wheel',{id:`${offer.id}:${offer.negotiationRound}`,index:Math.max(0,Math.round((result.probability||50)/20)),label:result.status},{token:`negotiation:${offer.id}:${offer.negotiationRound}`});
        const text=`${club.cn}：${result.status}`;
        showToast(text,{type:result.status.includes('成功')||result.status==='已接受'?'success':result.status.includes('破裂')?'error':'info'});ctx.refresh();
      }catch(error){showToast(error.message,{type:'error'})}
    };
    if(allowed.has('accept'))controls.append(button('接受',{className:'button button--primary',onClick:()=>void runAction('accept')}));
    if([...allowed].some(action=>action.startsWith('negotiate')||['loan','clause'].includes(action)))controls.append(button('谈判',{className:'button',onClick:()=>openNegotiation(offer,club,allowed,runAction)}));
    if(allowed.has('defer'))controls.append(button('暂缓',{className:'button button--secondary',onClick:()=>void runAction('defer')}));
    if(allowed.has('reject'))controls.append(button('拒绝',{className:'button button--danger',onClick:()=>void runAction('reject')}));
  }
  card.append(details,controls);return card;
}
function metric(label,value){return el('div',{className:'contract-item'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function contextItem(label,value){return el('div',{className:'offer-context-item'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function offerFit(save,club,offer){
  let value=52;
  if((club.needs||[]).includes(save.player.position))value+=20;
  if(save.player.age<=21)value+=(Number(club.youthUsage||50)-50)*.3;
  if(['核心','主力'].includes(offer.role))value+=10;
  if(/控球|传递/.test(club.tactic||'')&&['CM','CAM','CDM'].includes(save.player.position))value+=8;
  if(/反击|速度/.test(club.tactic||'')&&['ST','LW','RW'].includes(save.player.position))value+=8;
  return Math.max(15,Math.min(98,Math.round(value)));
}
function openNegotiation(offer,club,allowed,runAction){
  const content=el('div',{className:'negotiation-list'});
  const actions=NEGOTIATION_ACTIONS.filter(([,action])=>allowed.has(action));
  actions.forEach(([label,action,copy])=>content.append(button('',{className:'negotiation-option',onClick:()=>{closeSheet();runAction(action)}},[
    el('span',{},[el('strong',{text:label}),el('small',{text:copy})]),el('span',{text:'›',attrs:{'aria-hidden':'true'}})
  ])));
  openSheet({title:`与${club.cn}谈判`,subtitle:`第 ${(offer.negotiationRound||0)+1} 轮，最多两轮。`,content});
}

function openInterestSearch(save,repo,store,ctx){
  let query='';
  const content=el('div',{className:'interest-search'}),input=el('input',{className:'search-input',attrs:{type:'search',placeholder:'搜索俱乐部、联赛或国家','aria-label':'搜索目标俱乐部',enterkeyhint:'search'}}),results=el('div',{className:'interest-results'});
  function render(){
    results.replaceChildren();const current=repo.getClub(save.career.clubId),q=query.toLocaleLowerCase('zh-CN');
    const matches=repo.clubs.filter(c=>c.id!==current.id&&(c.cn.includes(query)||String(c.native||'').toLocaleLowerCase('zh-CN').includes(q)||c.leagueCn.includes(query)||c.country.includes(query))).slice(0,20);
    matches.forEach(club=>{
      const prior=[...save.career.history].reverse().find(x=>x.type==='interest'&&x.clubId===club.id&&x.season===save.career.season&&x.month===save.career.month);
      const action=button(prior?prior.status:'提交意向',{className:'button button--small',disabled:Boolean(prior),onClick:()=>{
        try{let result;store.update(s=>{result=submitInterest(s,repo,club.id)},'interest-submitted',result);action.textContent=result.status;action.disabled=true;showToast(`${club.cn}：${result.status}`,{type:result.offer?'success':'info'});if(result.offer){closeSheet();ctx.refresh()}}catch(error){showToast(error.message,{type:'error'})}
      }});
      results.append(el('article',{className:'interest-row'},[
        createClubCrest(club,{size:'small'}),
        el('div',{className:'interest-copy'},[el('strong',{text:club.cn}),el('small',{text:`${club.leagueCn} · 实力 ${club.rep}`})]),
        action
      ]));
    });
    if(!matches.length)results.append(el('p',{className:'muted',text:'没有找到匹配的俱乐部。'}));
  }
  input.addEventListener('input',()=>{query=input.value.trim();render()});content.append(input,results);render();
  openSheet({title:'主动寻找下家',subtitle:'每个阶段最多向3家俱乐部提交意向。俱乐部可以接受、拒绝、要求试训或只提供租借。',content,size:'large'});
}
