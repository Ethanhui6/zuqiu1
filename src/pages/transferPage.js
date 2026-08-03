import {el,button,clear} from '../utils/dom.js';
import {generateOffers,isTransferWindow,respondOffer,submitInterest,marketValue,availableOfferActions,declareStay,expireOffers} from '../systems/transfer/transferSystem.js';
import {formatMoney} from '../utils/format.js';
import {openSheet,closeSheet} from '../components/sheet.js';
import {showToast} from '../components/toast.js';

const ACTIONS=[['接受','accept','button button--primary'],['拒绝','reject','button button--danger'],['暂缓等待','defer','button button--secondary'],['谈判工资','negotiateWage','button'],['谈判定位','negotiateRole','button'],['要求租借','loan','button'],['谈判解约金','clause','button']];

export function renderTransferPage(container,ctx){
  const {store,repo}=ctx,save=store.state;let generated=false;
  store.update(s=>{expireOffers(s);const before=s.career.pending.offers.length;generateOffers(s,repo);generated=s.career.pending.offers.length!==before},'transfer-state-checked');
  const current=repo.getClub(save.career.clubId),windowOpen=isTransferWindow(save),offers=save.career.pending.offers;
  clear(container);const page=el('section',{className:'page'});
  page.append(el('div',{className:'page-title'},[
    el('div',{},[el('span',{className:'eyebrow',text:'转会与合同'}),el('h1',{text:windowOpen?'转会窗口开放':'转会窗口关闭'}),el('p',{text:windowOpen?'报价由年龄、能力、潜力、位置需求、预算、合同和赛季表现共同生成。所有决定都会立即保存。':'可以向俱乐部提交意向，但正式报价只会在夏季或冬季窗口出现。'})]),
    el('section',{className:'glass-card compact-status'},[el('small',{text:'当前合同'}),el('strong',{text:`${current.cn} · ${save.career.contract.years}年`}),el('p',{text:`周薪 ${formatMoney(save.finance.weeklyWage)} · 身价 ${formatMoney(marketValue(save,current))}`})])
  ]));
  const stayLocked=Boolean(save.career.transferWindows?.[`${save.career.season}:${save.career.month}`]?.stayChosen);
  page.append(el('div',{className:'transfer-actions'},[
    button('主动申请转会',{className:'button button--secondary',onClick:()=>openInterestSearch(save,repo,store,ctx)}),
    button(stayLocked?'本窗口已选择留队':'留队争取位置',{className:'button',disabled:stayLocked||!windowOpen,onClick:()=>{
      try{let result;store.update(s=>{result=declareStay(s)},'stay-chosen',result);showToast('已明确选择留队，本窗口其他报价已经关闭',{type:'success'});ctx.refresh()}catch(error){showToast(error.message,{type:'error'})}
    }})
  ]));
  const list=el('div',{className:'offer-list'});
  if(!offers.length)list.append(el('section',{className:'empty-state glass-card'},[el('div',{className:'empty-icon',text:'↗'}),el('h2',{text:windowOpen?'暂时没有符合条件的正式报价':'等待转会窗口'}),el('p',{text:windowOpen?(generated?'本窗口已经完成市场评估。继续提升能力、出场数据和声望。':'本窗口没有球队愿意提交正式报价。'):'夏季窗口在第1阶段，冬季窗口在第5阶段。'})]));
  offers.forEach(offer=>list.append(offerCard(offer,repo.getClub(offer.clubId),save,store,repo,ctx)));page.append(list);container.append(page);return()=>{};
}

function offerCard(offer,club,save,store,repo,ctx){
  const card=el('article',{className:`glass-card offer-card ${availableOfferActions(save,offer).length?'':'is-closed'}`});
  card.append(el('div',{className:'offer-card__head'},[
    el('div',{className:'club-mark',text:club.code||club.cn.slice(0,1)}),
    el('div',{className:'offer-main'},[el('span',{className:'eyebrow',text:club.leagueCn}),el('h2',{text:club.cn}),el('p',{text:`${offer.type||'转会'} · ${offer.role} · 主教练兴趣 ${offer.coachInterest}% · 成交概率 ${offer.probability}%`})]),
    el('span',{className:`offer-status status-${offer.status}`,text:offer.status})
  ]));
  card.append(el('div',{className:'contract-grid contract-grid--core'},[
    ['周薪',formatMoney(offer.weeklyWage)],['合同',`${offer.years}年`],['球队定位',offer.role],['成交概率',`${offer.probability}%`]
  ].map(([label,value])=>el('div',{className:'contract-item'},[el('small',{text:label}),el('strong',{text:value})]))));
  card.append(el('details',{className:'offer-more'},[
    el('summary',{text:'查看完整合同条款'}),
    el('div',{className:'contract-grid'},[
      ['签字费',formatMoney(offer.signingBonus)],['解约金',offer.releaseClause?formatMoney(offer.releaseClause):'无'],['出场承诺',offer.appearancePromise],['发展计划',offer.developmentPlan],['谈判轮次',`${offer.negotiationRound||0}/2`],['有效期',`第${offer.createdMonth}阶段结束前`]
    ].map(([label,value])=>el('div',{className:'contract-item'},[el('small',{text:label}),el('strong',{text:value})])))
  ]));
  const allowed=new Set(availableOfferActions(save,offer)),controls=el('div',{className:'offer-controls'});
  if(!allowed.size){controls.append(el('p',{className:'muted',text:offer.expiredReason||'该报价已经结束，不能继续操作。'}));}
  else ACTIONS.filter(([,action])=>allowed.has(action)).forEach(([label,action,className])=>controls.append(button(label,{className,onClick:()=>{
    try{let result;store.update(s=>{result=respondOffer(s,repo,offer.id,action)},'offer-response',result);showToast(`${club.cn}：${result.status}`,{type:result.status.includes('成功')||result.status==='已接受'?'success':result.status.includes('破裂')?'error':'info'});ctx.refresh()}catch(error){showToast(error.message,{type:'error'})}
  }})));
  card.append(controls);return card;
}

function openInterestSearch(save,repo,store,ctx){
  let query='';const content=el('div',{className:'interest-search'}),input=el('input',{className:'search-input',attrs:{type:'search',placeholder:'搜索俱乐部、联赛或国家'}}),results=el('div',{className:'interest-results'});
  function render(){
    results.replaceChildren();const current=repo.getClub(save.career.clubId),q=query.toLowerCase();
    repo.clubs.filter(c=>c.id!==current.id&&(c.cn.includes(query)||c.native.toLowerCase().includes(q)||c.leagueCn.includes(query)||c.country.includes(query))).slice(0,20).forEach(club=>{
      const prior=[...save.career.history].reverse().find(x=>x.type==='interest'&&x.clubId===club.id&&x.season===save.career.season&&x.month===save.career.month);
      const action=button(prior?prior.status:'提交意向',{className:'button button--small',disabled:Boolean(prior),onClick:()=>{
        try{let result;store.update(s=>{result=submitInterest(s,repo,club.id)},'interest-submitted',result);action.textContent=result.status;action.disabled=true;showToast(`${club.cn}：${result.status}`,{type:result.offer?'success':'info'});if(result.offer){closeSheet();ctx.refresh()}}catch(error){showToast(error.message,{type:'error'})}
      }});
      results.append(el('div',{className:'interest-row'},[el('span',{className:'club-mark club-mark--small',text:club.code}),el('div',{},[el('strong',{text:club.cn}),el('small',{text:`${club.leagueCn} · 实力 ${club.rep}`})]),action]));
    });
  }
  input.addEventListener('input',()=>{query=input.value.trim();render()});content.append(input,results);render();openSheet({title:'主动寻找下家',subtitle:'每个阶段最多向3家俱乐部提交意向。俱乐部可以接受、拒绝、要求试训、只提供租借或推迟决定。',content,size:'large'});
}
