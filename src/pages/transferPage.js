import {el,button,clear} from '../utils/dom.js';
import {generateOffers,isTransferWindow,respondOffer,submitInterest,marketValue,availableOfferActions,declareStay,expireOffers} from '../systems/transfer/transferSystem.js';
import {formatCurrency,formatPercentage,formatTransferStatus} from '../utils/format.js';
import {openSheet,closeSheet} from '../components/sheet.js';
import {createClubCrest} from '../components/clubCrest.js';
import {showToast} from '../components/toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';
import {openClubDetail} from '../components/clubDetailSheet.js';
import {clubFit,ensureWorldExplorerState} from '../systems/world/worldExplorerSystem.js';
import {ensureAgent,generateAgentAdvice} from '../systems/agent/agentSystem.js';

const NEGOTIATION_ACTIONS=[
  ['提高工资','negotiateWage','争取更高周薪，会降低成交稳定性。'],
  ['调整角色','negotiateRole','争取更重要的队内定位和出场承诺。'],
  ['改为租借','loan','以一年租借换取更明确的比赛时间。'],
  ['调整解约金','clause','降低未来离队门槛。']
];

export function renderTransferPage(container,ctx){
  const {store,repo}=ctx,save=store.state;let generated=false;
  store.update(s=>{expireOffers(s);const before=s.career.pending.offers.length;generateOffers(s,repo);generated=s.career.pending.offers.length!==before},'transfer-state-checked');
  const current=repo.getClub(save.career.clubId),windowOpen=isTransferWindow(save),offers=save.career.pending.offers,agent=ensureAgent(save);if(!agent.advice)generateAgentAdvice(save);ensureWorldExplorerState(save);
  clear(container);
  const page=el('section',{className:'page v20-transfer-page'});
  page.append(transferHeader(save,current,windowOpen));
  page.append(strategyCards(save,current,windowOpen,agent,ctx,repo));

  if(offers.length){
    const offerSection=el('section',{className:'v20-transfer-section'},[sectionTitle('正式报价',`${offers.length}份待处理或已归档报价`)]),list=el('div',{className:'v20-offer-list v20-offer-list'});
    offers.forEach(offer=>list.append(offerCard(offer,repo.getClub(offer.clubId),save,store,repo,ctx)));offerSection.append(list);page.append(offerSection);
  }else{
    page.append(el('section',{className:'v20-transfer-empty'},[el('div',{className:'v20-transfer-empty__icon',text:windowOpen?'↗':'◷'}),el('div',{},[el('strong',{text:windowOpen?'市场正在评估你的状态':'转会窗口尚未开放'}),el('p',{text:windowOpen?(generated?'本阶段已经完成一次市场评估，继续提升表现会带来新的关注。':'当前没有球队提交正式报价，但仍可主动接触目标球队。'):'窗口关闭期间可以收藏球队、设置目标、让经纪人观察市场和提前提交转会意向。'})]) ]));
  }

  const recommended=recommendedClubs(save,repo,current.id,8),recommendSection=el('section',{className:'v20-transfer-section'},[sectionTitle(windowOpen?'潜在球队':'市场观察',windowOpen?'根据位置需求、出场机会和球队兴趣排序':'提前规划下一次转会窗口')]),grid=el('div',{className:'v20-club-mini-grid'});
  for(const club of recommended)grid.append(transferClubCard(club,save,()=>openClubDetail({club,save,repo,store,ctx,source:'transfer'})));recommendSection.append(grid,button('搜索更多球队',{className:'button button--secondary',onClick:()=>openInterestSearch(save,repo,store,ctx)}));page.append(recommendSection);
  container.append(page);
  const reveal=offers.find(offer=>availableOfferActions(save,offer).length);if(reveal)void animationDirector.play('offer-envelope',{id:reveal.id,club:repo.getClub(reveal.clubId)?.cn,value:formatCurrency(reveal.transferFee||0)},{token:`offer-envelope:${reveal.id}`});
  return()=>{};
}

function transferHeader(save,current,windowOpen){
  const phase=save.career.gameClock?.currentTransferWindow||null,windowCopy=windowOpen?(phase==='winter'?'冬季转会窗口开放':'夏季转会窗口开放'):'距离下一窗口约'+nextWindowDistance(save);
  return el('header',{className:'v20-transfer-header'},[
    el('div',{className:'v20-section-heading'},[el('div',{},[el('small',{text:'转会与合同'}),el('h1',{text:windowOpen?'规划下一步职业选择':'窗口关闭也可以提前布局'})]),el('span',{className:`v20-window-pill ${windowOpen?'is-open':''}`,text:windowOpen?'开放':'关闭'})]),
    el('div',{className:'v20-contract-strip'},[createClubCrest(current,{size:'normal'}),el('div',{},[el('strong',{text:current.cn}),el('small',{text:`${save.career.contract.type} · 剩余${save.career.contract.years}年`}),el('p',{text:`周薪 ${formatCurrency(save.finance.weeklyWage)} · 身价 ${formatCurrency(marketValue(save,current))}`})]),el('span',{text:windowCopy})])
  ])
}

function strategyCards(save,current,windowOpen,agent,ctx,repo){
  const offers=save.career.pending.offers.filter(offer=>availableOfferActions(save,offer).length),targets=save.career.worldExplorer?.transferTargets||[],interest=(save.career.history||[]).filter(item=>item.type==='interest').slice(-5),stayLocked=Boolean(save.career.transferWindows?.[`${save.career.season}:${save.career.month}`]?.stayChosen);
  const grid=el('section',{className:'v20-transfer-strategy-grid'});
  grid.append(
    miniStrategy('当前合同',`${save.career.contract.years}年 · ${save.career.teamRole}`,`解约金 ${save.career.contract.releaseClause?formatCurrency(save.career.contract.releaseClause):'未设置'}`,'▤',()=>showContract(save,current)),
    miniStrategy('市场关注',`${offers.length}份正式报价`,`${interest.length}次主动接触记录`,'◎',()=>ctx.navigate('transfer')),
    miniStrategy('经纪人建议',agent.advice?.title||'保持市场观察',agent.advice?.text||'经纪人正在评估出场机会和合同风险。','●',()=>showAgentAdvice(agent)),
    miniStrategy('职业策略',targets.length?`${targets.length}家目标球队`:(save.career.strategies?.career==='transfer'?'正在寻求转会':'留队竞争'),windowOpen?'窗口内可以正式谈判':'窗口外可以收藏和提交意向','↗',()=>openCareerStrategy(save,ctx,repo))
  );
  const toolbar=el('div',{className:'v20-transfer-toolbar'},[
    button('主动申请转会',{className:'button button--secondary',onClick:()=>openInterestSearch(save,repo,ctx.store,ctx)}),
    button(stayLocked?'本窗口已选择留队':'留队争取位置',{className:'button',disabled:stayLocked||!windowOpen,onClick:()=>{try{ctx.store.update(s=>declareStay(s),'stay-chosen');showToast('已选择留队，本窗口其他报价已关闭',{type:'success'});ctx.refresh()}catch(error){showToast(error.message,{type:'error'})}}})
  ]);
  return el('div',{className:'v20-transfer-strategy-wrap'},[grid,toolbar])
}

function offerCard(offer,club,save,store,repo,ctx){
  const allowed=new Set(availableOfferActions(save,offer)),fit=offerFit(save,club,offer),fee=offer.type==='续约'?'不适用':offer.type==='租借'?'租借免转会费':formatCurrency(offer.transferFee||0),card=el('article',{className:`transfer-offer-card v20-transfer-offer-card ${allowed.size?'':'is-closed'}`});
  card.append(
    button('',{className:'v20-offer-club',onClick:()=>openClubDetail({club,save,repo,store,ctx,source:'offer',offer})},[createClubCrest(club,{size:'normal'}),el('span',{},[el('small',{text:offer.type||'正式转会'}),el('strong',{text:club.cn}),el('span',{text:`${club.country} · ${club.leagueCn}`})]),el('span',{className:`offer-status status-${String(offer.status).replace(/\s/g,'')}`,text:formatTransferStatus(offer.status)})]),
    el('div',{className:'v20-offer-metrics'},[metric('转会费',fee),metric('合同年限',`${offer.years}年`),metric('队内角色',offer.role),metric('周薪',formatCurrency(offer.weeklyWage))]),
    el('div',{className:'v20-offer-context'},[contextItem('教练兴趣',formatPercentage(offer.coachInterest)),contextItem('位置需求',(club.needs||[]).join('、')||'暂无'),contextItem('战术适配',formatPercentage(fit)),contextItem('成交概率',formatPercentage(offer.probability))])
  );
  const controls=el('footer',{className:'v20-offer-actions'});
  if(!allowed.size)controls.append(el('p',{className:'muted',text:offer.expiredReason||'该报价已经结束，不能继续操作。'}));else{
    const runAction=async action=>{if(!allowed.has(action))return;try{controls.querySelectorAll('button').forEach(node=>node.disabled=true);const fromClub=repo.getClub(save.career.clubId)?.cn||'原俱乐部';let result;store.update(s=>{result=respondOffer(s,repo,offer.id,action)},'offer-response',result);if(action==='accept')await animationDirector.playSequence([{id:'contract-sign',result:{id:offer.id,club:club.cn,clauses:[`${offer.years}年合同`,offer.role,`周薪 ${formatCurrency(offer.weeklyWage)}`]},options:{token:`contract:${offer.id}`}},{id:'transfer-route',result:{id:offer.id,stops:[fromClub,'合同确认',club.cn],label:`加盟 ${club.cn}`},options:{token:`route:${offer.id}`}}]);else if(action.startsWith('negotiate')||action==='loan'||action==='clause')await animationDirector.play('fate-wheel',{id:`${offer.id}:${offer.negotiationRound}`,index:Math.max(0,Math.round((result.probability||50)/20)),label:result.status},{token:`negotiation:${offer.id}:${offer.negotiationRound}`});showToast(`${club.cn}：${result.status}`,{type:result.status.includes('成功')||result.status==='已接受'?'success':result.status.includes('破裂')?'error':'info'});ctx.refresh()}catch(error){showToast(error.message,{type:'error'})}};
    if(allowed.has('accept'))controls.append(button('接受',{className:'button button--primary',onClick:()=>void runAction('accept')}));
    if([...allowed].some(action=>action.startsWith('negotiate')||['loan','clause'].includes(action)))controls.append(button('谈判',{className:'button',onClick:()=>openNegotiation(offer,club,allowed,runAction)}));
    if(allowed.has('defer'))controls.append(button('暂缓',{className:'button button--secondary',onClick:()=>void runAction('defer')}));
    if(allowed.has('reject'))controls.append(button('拒绝',{className:'button button--danger',onClick:()=>void runAction('reject')}));
  }
  card.append(button('查看球队与完整条款',{className:'v20-offer-detail-link',onClick:()=>openClubDetail({club,save,repo,store,ctx,source:'offer',offer})}),controls);return card
}

function transferClubCard(club,save,onOpen){const fit=clubFit(save,club),need=(club.needs||[]).includes(save.player.position);return button('',{className:'v20-club-mini-card',onClick:onOpen},[createClubCrest(club,{size:'normal'}),el('div',{},[el('strong',{text:club.cn}),el('small',{text:`${club.country} · ${club.leagueCn}`}),el('span',{text:`${club.tactic} · ${need?'当前位置正缺人':'阵容竞争'}`})]),el('div',{className:'v20-club-fit'},[el('strong',{text:String(fit)}),el('small',{text:'适配'})])])}
function recommendedClubs(save,repo,currentId,limit){return repo.clubs.filter(club=>club.id!==currentId).map(club=>({...club,fit:clubFit(save,club)})).sort((a,b)=>b.fit-a.fit||b.rep-a.rep).slice(0,limit)}
function miniStrategy(title,value,copy,icon,onClick){return button('',{className:'v20-transfer-strategy-card',onClick},[el('span',{className:'v20-transfer-strategy-icon',text:icon}),el('div',{},[el('small',{text:title}),el('strong',{text:value}),el('p',{text:copy})]),el('span',{text:'›'})])}
function sectionTitle(title,copy){return el('div',{className:'v20-section-heading'},[el('div',{},[el('small',{text:copy}),el('h2',{text:title})])])}
function metric(label,value){return el('div',{className:'v20-contract-item'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function contextItem(label,value){return el('div',{className:'v20-offer-context-item'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function offerFit(save,club,offer){let value=clubFit(save,club);if(['核心','主力'].includes(offer.role))value+=8;return Math.max(15,Math.min(98,Math.round(value)))}
function nextWindowDistance(save){const month=Number(save.career.month||1);if(month<5)return`${Math.max(1,5-month)}个阶段`;if(month<11)return`${Math.max(1,11-month)}个阶段`;return'1个阶段'}

function openNegotiation(offer,club,allowed,runAction){const content=el('div',{className:'v20-negotiation-list'});NEGOTIATION_ACTIONS.filter(([,action])=>allowed.has(action)).forEach(([label,action,copy])=>content.append(button('',{className:'v20-negotiation-option',onClick:()=>{closeSheet();runAction(action)}},[el('span',{},[el('strong',{text:label}),el('small',{text:copy})]),el('span',{text:'›'})])));openSheet({title:`与${club.cn}谈判`,subtitle:`第 ${(offer.negotiationRound||0)+1} 轮，最多两轮。`,content})}
function showContract(save,current){openSheet({title:'当前合同',subtitle:current.cn,content:el('div',{className:'v20-info-list'},[info('合同类型',save.career.contract.type),info('剩余年限',`${save.career.contract.years}年`),info('周薪',formatCurrency(save.finance.weeklyWage)),info('解约金',save.career.contract.releaseClause?formatCurrency(save.career.contract.releaseClause):'未设置'),info('出场承诺',save.career.contract.appearancePromise)])})}
function showAgentAdvice(agent){openSheet({title:'经纪人建议',subtitle:`${agent.name} · ${agent.risk}`,content:el('div',{className:'v20-result-card'},[el('div',{className:'result-orb result-orb--good',text:'建议'}),el('h3',{text:agent.advice?.title||'保持市场观察'}),el('p',{text:agent.advice?.text||'当前没有必须立即处理的合同风险。'}),el('p',{className:'muted',text:'经纪人只提供建议，不会替玩家接受转会或合同。'})])})}
function openCareerStrategy(save,ctx,repo){const items=[['stay','留队竞争','优先提升队内顺位和教练信任'],['loan','接受租借','优先寻找稳定出场时间'],['transfer','寻求转会','主动接触适配球队'],['minutes','优先出场时间','降低豪门偏好，提高实际比赛机会']];const content=el('div',{className:'v20-plan-list'},items.map(([id,title,copy])=>button('',{className:`v20-plan-card ${save.career.strategies.career===id?'is-selected':''}`,onClick:()=>{ctx.store.update(state=>{state.career.strategies.career=id},'career-strategy');closeSheet();ctx.refresh()}},[el('div',{},[el('strong',{text:title}),el('small',{text:copy})]),el('span',{text:save.career.strategies.career===id?'✓':'›'})])));openSheet({title:'职业策略',subtitle:'策略会影响自动模拟和经纪人推荐',content})}
function info(label,value){return el('div',{className:'v20-info-row'},[el('span',{text:label}),el('strong',{text:value})])}

function openInterestSearch(save,repo,store,ctx){
  let query='';
  const content=el('div',{className:'v20-interest-search'});
  const input=el('input',{className:'search-input',attrs:{type:'search',placeholder:'搜索俱乐部、联赛或国家','aria-label':'搜索目标俱乐部',enterkeyhint:'search'}});
  const results=el('div',{className:'v20-interest-results'});

  function render(){
    results.replaceChildren();
    const current=repo.getClub(save.career.clubId);
    const q=query.toLocaleLowerCase('zh-CN');
    const matches=repo.clubs
      .filter(club=>{
        if(club.id===current.id)return false;
        const haystack=[club.cn,club.native,club.leagueCn,club.country].map(value=>String(value||'').toLocaleLowerCase('zh-CN')).join(' ');
        return !q||haystack.includes(q);
      })
      .map(club=>({...club,fit:clubFit(save,club)}))
      .sort((a,b)=>b.fit-a.fit)
      .slice(0,20);

    for(const club of matches){
      const prior=[...save.career.history].reverse().find(item=>item.type==='interest'&&item.clubId===club.id&&item.season===save.career.season&&item.month===save.career.month);
      const action=button(prior?prior.status:'提交意向',{
        className:'button button--small',
        disabled:Boolean(prior),
        onClick:()=>{
          try{
            let result;
            store.update(state=>{result=submitInterest(state,repo,club.id)},'interest-submitted');
            action.textContent=result.status;
            action.disabled=true;
            showToast(`${club.cn}：${result.status}`,{type:result.offer?'success':'info'});
            if(result.offer){closeSheet();ctx.refresh()}
          }catch(error){showToast(error.message,{type:'error'})}
        }
      });
      results.append(el('article',{className:'v20-interest-row'},[
        createClubCrest(club,{size:'small'}),
        el('div',{className:'v20-interest-copy'},[
          el('strong',{text:club.cn}),
          el('small',{text:`${club.leagueCn} · 适配 ${club.fit}`})
        ]),
        action
      ]));
    }
    if(!matches.length)results.append(el('p',{className:'muted',text:'没有找到匹配的俱乐部。'}));
  }

  input.addEventListener('input',()=>{query=input.value.trim();render()});
  content.append(input,results);
  render();
  openSheet({title:'主动寻找下家',subtitle:'每个阶段最多向3家俱乐部提交意向，窗口关闭时会转为经纪人观察。',content,size:'large'});
}
