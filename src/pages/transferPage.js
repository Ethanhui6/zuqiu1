import {el,button,clear} from '../utils/dom.js';
import {generateOffers,isTransferWindow,respondOffer,submitInterest,marketValue} from '../systems/transfer/transferSystem.js';
import {formatMoney} from '../utils/format.js';
import {openSheet} from '../components/sheet.js';
import {showToast} from '../components/toast.js';

export function renderTransferPage(container,ctx){
  const {store,repo}=ctx;
  const save=store.state;
  const current=repo.getClub(save.career.clubId);
  clear(container);
  const page=el('section',{className:'page'});
  const windowOpen=isTransferWindow(save);
  const offers=generateOffers(save,repo);
  store.update(()=>{},'transfer-page-open');

  const titleBlock=el('div',{className:'page-title'},[
    el('div',{},[
      el('span',{className:'eyebrow',text:'转会与合同'}),
      el('h1',{text:windowOpen?'转会窗口开放':'转会窗口关闭'}),
      el('p',{text:windowOpen?'报价已根据年龄、能力、潜力、位置需求、预算、合同和赛季表现生成。':'你可以浏览世界并提交转会意向，但正式报价只会在夏季或冬季窗口出现。'})
    ]),
    el('section',{className:'glass-card compact-status'},[
      el('small',{text:'当前合同'}),
      el('strong',{text:`${current.cn} · ${save.career.contract.years}年`}),
      el('p',{text:`周薪 ${formatMoney(save.finance.weeklyWage)} · 身价 ${formatMoney(marketValue(save,current))}`})
    ])
  ]);
  page.append(titleBlock);

  const actions=el('div',{className:'transfer-actions'},[
    button('主动申请转会',{className:'button button--secondary',onClick:()=>openInterestSearch(save,repo,store,ctx)}),
    button('留队争取位置',{className:'button',onClick:()=>{
      store.update(s=>{
        s.status.coachTrust=Math.min(100,s.status.coachTrust+3);
        s.career.history.push({type:'stay',year:s.career.year,title:'留队竞争',text:'明确表示愿意留队争取位置。'});
      },'stay');
      showToast('已向俱乐部表达留队意愿',{type:'success'});
    }})
  ]);
  page.append(actions);

  const list=el('div',{className:'offer-list'});
  if(!offers.length){
    list.append(el('section',{className:'empty-state glass-card'},[
      el('div',{className:'empty-icon',text:'↗'}),
      el('h2',{text:windowOpen?'暂时没有符合条件的正式报价':'等待转会窗口'}),
      el('p',{text:windowOpen?'继续提升能力、出场数据和声望，球队需求也会随赛季变化。':'夏季窗口在第1阶段，冬季窗口在第5阶段。'})
    ]));
  }
  offers.forEach(offer=>list.append(offerCard(offer,repo.getClub(offer.clubId),save,store,repo,ctx)));
  page.append(list);
  container.append(page);
  return()=>{};
}

function offerCard(offer,club,save,store,repo,ctx){
  const card=el('article',{className:'glass-card offer-card'});
  card.append(el('div',{className:'offer-card__head'},[
    el('div',{className:'club-mark',text:club.code||club.cn.slice(0,1)}),
    el('div',{className:'offer-main'},[
      el('span',{className:'eyebrow',text:club.leagueCn}),
      el('h2',{text:club.cn}),
      el('p',{text:`${offer.type||'转会'} · ${offer.role} · 主教练兴趣 ${offer.coachInterest}% · 成交概率 ${offer.probability}%`})
    ]),
    el('span',{className:`offer-status status-${offer.status}`,text:offer.status})
  ]));
  const contractItems=[
    ['周薪',formatMoney(offer.weeklyWage)],['合同',`${offer.years}年`],['签字费',formatMoney(offer.signingBonus)],['解约金',offer.releaseClause?formatMoney(offer.releaseClause):'无'],['出场承诺',offer.appearancePromise],['发展计划',offer.developmentPlan]
  ];
  card.append(el('div',{className:'contract-grid'},contractItems.map(([l,v])=>el('div',{className:'contract-item'},[el('small',{text:l}),el('strong',{text:v})]))));
  const controls=el('div',{className:'offer-controls'});
  const disabled=['已接受','已拒绝','谈判破裂'].includes(offer.status);
  const actions=[['接受','accept','button button--primary'],['拒绝','reject','button button--danger'],['暂缓','defer','button button--secondary'],['谈工资','negotiateWage','button'],['谈定位','negotiateRole','button'],['要求租借','loan','button'],['谈解约金','clause','button']];
  actions.forEach(([label,action,className])=>{
    controls.append(button(label,{className,disabled,onClick:()=>{
      const result=respondOffer(save,repo,offer.id,action);
      store.update(()=>{},'offer-response',result);
      showToast(`${club.cn}：${result.status}`,{type:result.status.includes('成功')||result.status==='已接受'?'success':'info'});
      ctx.refresh();
    }}));
  });
  card.append(controls);
  return card;
}

function openInterestSearch(save,repo,store,ctx){
  let query='';
  const content=el('div',{className:'interest-search'});
  const input=el('input',{className:'search-input',attrs:{type:'search',placeholder:'搜索真实俱乐部或联赛'}});
  const results=el('div',{className:'interest-results'});
  function render(){
    results.replaceChildren();
    const current=repo.getClub(save.career.clubId);
    repo.clubs
      .filter(c=>c.id!==current.id&&(c.cn.includes(query)||c.native.toLowerCase().includes(query.toLowerCase())||c.leagueCn.includes(query)))
      .slice(0,20)
      .forEach(club=>{
        const row=el('div',{className:'interest-row'},[
          el('span',{className:'club-mark club-mark--small',text:club.code}),
          el('div',{},[el('strong',{text:club.cn}),el('small',{text:`${club.leagueCn} · 实力 ${club.rep}`})]),
          button('提交意向',{className:'button button--small',onClick:()=>{
            const result=submitInterest(save,repo,club.id);
            store.update(()=>{},'interest-submitted',result);
            showToast(`${club.cn}：${result.status}`);if(result.offer)ctx.refresh();
          }})
        ]);
        results.append(row);
      });
  }
  input.addEventListener('input',()=>{query=input.value.trim();render();});
  content.append(input,results);
  render();
  openSheet({title:'主动寻找下家',subtitle:'你只能提交意向，俱乐部会根据需求、预算和竞技水平作出决定。',content,size:'large'});
}
