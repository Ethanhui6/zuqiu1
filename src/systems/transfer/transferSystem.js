import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {applyRelation} from '../relationship/relationshipSystem.js';
import {CAREER_SETTINGS} from '../../app/config.js';

const TERMINAL=new Set(['已接受','已拒绝','谈判破裂','已过期','选择留队']);
const NEGOTIATIONS=new Set(['negotiateWage','negotiateRole','loan','clause']);
const ACTION_LABEL={accept:'接受',reject:'拒绝',defer:'暂缓',negotiateWage:'谈工资',negotiateRole:'谈定位',loan:'要求租借',clause:'谈解约金'};

function ensureState(save){
  save.career.pending.offers??=[];save.career.offerHistory??=[];save.career.actionLocks??={};save.career.transferWindows??={};save.career.rejectedClubs??=[];save.career.transferHistory??=[];
}
function windowId(save){return `${save.career.season}:${save.career.month}`}
function sameWindow(save,offer){return offer.createdSeason===save.career.season&&offer.createdMonth===save.career.month&&isTransferWindow(save)}
function archiveOffer(save,offer){if(!save.career.offerHistory.some(x=>x.id===offer.id))save.career.offerHistory.push(structuredClone(offer));if(save.career.offerHistory.length>120)save.career.offerHistory=save.career.offerHistory.slice(-120)}
function logDecision(offer,action,status){offer.decisionLog??=[];offer.decisionLog.push({action,label:ACTION_LABEL[action]||action,status,round:offer.negotiationRound||0});}

export function marketValue(save,club){const p=save.player;const age=p.age<=21?1.5:p.age<=26?1.25:p.age<=29?1:p.age<=32?.7:.36;const pot=1+Math.max(0,p.potential-p.ovr)*.045;const exposure=.75+club.rep/180;return Math.max(80000,Math.round(Math.exp((p.ovr-52)*.102)*90000*age*pot*exposure))}
function roleFor(player,club){const gap=player.ovr-club.rep;if(gap>=4)return'核心';if(gap>=0)return'主力';if(gap>=-5)return'轮换';return player.age<=21?'未来计划':'替补'}
function offerScore(save,club,current){const p=save.player,s=save.career.seasonStats;let score=p.ovr*.34+p.potential*.16+(s.rating||6)*5+(s.apps||0)*.18+save.fans.mediaHeat*.08+save.status.form*.08;score+=(club.needs.includes(p.position)?8:-3);score-=Math.max(0,club.rep-p.ovr-7)*2.2;score-=save.status.injury?.severity?12:0;score+=(club.youthUsage-50)*.05;score-=Math.abs(club.rep-current.rep)*.05;return score}
export function isTransferWindow(save){return save.career.month===CAREER_SETTINGS.summerWindowMonth||save.career.month===CAREER_SETTINGS.winterWindowMonth}
export function expireOffers(save){
  ensureState(save);if(!save.career.pending.offers.length)return[];
  const expired=[];const keep=[];
  for(const offer of save.career.pending.offers){
    if(sameWindow(save,offer)){keep.push(offer);continue}
    if(!TERMINAL.has(offer.status)){offer.status='已过期';offer.expiredReason='转会窗口或报价有效期已经结束';logDecision(offer,'expire',offer.status)}
    archiveOffer(save,offer);expired.push(offer);
  }
  save.career.pending.offers=keep;return expired;
}
export function availableOfferActions(save,offer){
  if(!offer||TERMINAL.has(offer.status)||!sameWindow(save,offer))return[];
  const actions=['accept','reject'];if(!offer.deferred)actions.push('defer');
  if((offer.negotiationRound||0)<2){actions.push('negotiateWage','negotiateRole','clause');if(offer.type!=='续约'&&offer.type!=='租借')actions.push('loan')}
  return actions;
}
function newOfferBase(save,club,rng){return{league:club.leagueCn,clubId:club.id,status:'待决定',negotiationRound:0,deferred:false,decisionLog:[],createdSeason:save.career.season,createdMonth:save.career.month,expiresAfter:{season:save.career.season,month:save.career.month}}}

export function generateOffers(save,repo){
  ensureState(save);expireOffers(save);if(!isTransferWindow(save))return[];
  const wid=windowId(save);if(save.career.pending.offers.length)return save.career.pending.offers;if(save.career.transferWindows[wid]?.generated)return[];
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const current=repo.getClub(save.career.clubId),p=save.player;
  const candidates=repo.clubs.filter(c=>c.id!==current.id&&c.finance>35&&c.rep<=p.ovr+12&&c.rep>=Math.max(48,p.ovr-11)).map(c=>({club:c,score:offerScore(save,c,current)+rng.next()*18})).filter(x=>x.score>58).sort((a,b)=>b.score-a.score).slice(0,20);
  const topScore=candidates[0]?.score||0,count=clamp(Math.floor((topScore-55)/12)+rng.int(0,2),0,4),offers=[];
  if(save.career.contract.years<=1&&save.career.month===CAREER_SETTINGS.summerWindowMonth){
    const renewalWage=Math.max(save.finance.weeklyWage,Math.round((900+(p.ovr-50)*680)*(current.finance/72)));
    offers.push({...newOfferBase(save,current,rng),id:`R-${wid}-${current.id}`,type:'续约',role:save.career.teamRole,weeklyWage:Math.round(renewalWage*(.94+rng.next()*.16)),years:rng.int(2,5),signingBonus:Math.round(renewalWage*rng.int(5,14)),releaseClause:current.tier==='S'?0:Math.round(marketValue(save,current)*rng.int(15,25)/10),appearancePromise:save.career.teamRole.includes('核心')?'核心首发':save.career.teamRole.includes('主力')?'稳定首发':'继续竞争一线队位置',developmentPlan:p.age<=21?'续约后继续重点培养':'稳定一线队发展计划',coachInterest:clamp(Math.round(55+save.status.coachTrust*.35),10,98),probability:clamp(Math.round(48+save.relations.management.trust*.35),20,96)});
  }
  for(const {club,score} of candidates.slice(0,count)){
    const role=roleFor(p,club),baseWage=Math.round((800+(p.ovr-50)*650)*(club.finance/70));
    offers.push({...newOfferBase(save,club,rng),id:`O-${wid}-${club.id}`,type:save.career.contract.years<=0?'自由转会':'永久转会',role,weeklyWage:Math.max(500,baseWage+rng.int(-1000,2500)),years:rng.int(3,5),signingBonus:Math.round(baseWage*rng.int(8,20)),releaseClause:club.tier==='S'?0:Math.round(marketValue(save,current)*rng.int(14,25)/10),appearancePromise:role==='核心'?'核心首发':role==='主力'?'稳定首发':role==='轮换'?'每赛季不少于20次出场':'先租借或杯赛培养',developmentPlan:p.age<=21?'重点青年发展计划':'一线队即战力计划',coachInterest:clamp(Math.round(score),0,100),probability:clamp(Math.round(40+(score-58)*2),10,95)});
  }
  save.career.pending.offers=offers;save.career.transferWindows[wid]={generated:true,count:offers.length,stayChosen:false};save.rng=rng.snapshot();return offers;
}
function acceptOffer(save,repo,offer){
  const target=repo.getClub(offer.clubId),oldClub=repo.getClub(save.career.clubId);
  offer.status='已接受';logDecision(offer,'accept',offer.status);
  if(offer.type==='续约'){
    save.career.contract={type:'职业合同',years:offer.years,weeklyWage:offer.weeklyWage,releaseClause:offer.releaseClause,appearancePromise:offer.appearancePromise};save.finance.weeklyWage=offer.weeklyWage;save.finance.cash+=offer.signingBonus;applyRelation(save,'management',{trust:6,respect:4});
  }else{
    const isLoan=offer.type==='租借';save.career.transferHistory.push({year:save.career.year,season:save.career.season,from:oldClub.id,to:target.id,type:offer.type,fee:isLoan?0:marketValue(save,oldClub),playerAccepted:true});
    save.career.clubId=target.id;if(!save.career.clubHistory.includes(target.id))save.career.clubHistory.push(target.id);save.career.squadLevel='一线队';save.career.teamRole=offer.role;save.status.coachTrust=50;save.career.schedule=null;save.career.pending.match=null;save.career.majorNodes??=[];save.career.majorNodes.push({type:'transfer',season:save.career.season,month:save.career.month,title:`转会至${target.cn}`});
    if(isLoan){save.career.loan={parentClubId:oldClub.id,loanClubId:target.id,returnSeason:save.career.season+1,role:offer.role};}
    else{save.career.loan=null;save.career.contract={type:'职业合同',years:offer.years,weeklyWage:offer.weeklyWage,releaseClause:offer.releaseClause,appearancePromise:offer.appearancePromise};save.finance.weeklyWage=offer.weeklyWage;save.finance.cash+=offer.signingBonus;}
    applyRelation(save,'management',{trust:8,respect:5});
  }
  for(const other of save.career.pending.offers){if(other.id!==offer.id&&!TERMINAL.has(other.status)){other.status='已拒绝';other.expiredReason='玩家接受了其他报价';logDecision(other,'auto-close',other.status)}archiveOffer(save,other)}
  save.career.pending.offers=[];
}
export function respondOffer(save,repo,offerId,action){
  ensureState(save);expireOffers(save);const offer=save.career.pending.offers.find(x=>x.id===offerId);if(!offer)throw new Error('报价不存在或已经过期');if(!availableOfferActions(save,offer).includes(action))throw new Error('当前报价不能执行该操作');
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const target=repo.getClub(offer.clubId);
  if(action==='reject'){offer.status='已拒绝';if(!save.career.rejectedClubs.includes(target.id))save.career.rejectedClubs.push(target.id);if(offer.type==='续约'&&save.career.contract.years<=0)save.career.contract.type='合同到期';applyRelation(save,'agent',{trust:-2});logDecision(offer,action,offer.status)}
  else if(action==='defer'){offer.status='暂缓';offer.deferred=true;offer.probability=clamp(offer.probability-8,5,95);logDecision(offer,action,offer.status)}
  else if(action==='accept'){acceptOffer(save,repo,offer)}
  else if(NEGOTIATIONS.has(action)){
    offer.negotiationRound=(offer.negotiationRound||0)+1;const difficulty=action==='negotiateRole'?65:action==='loan'?58:60,chance=clamp((offer.probability+save.relations.agent.trust*.25-difficulty)/100,.1,.82);
    if(rng.bool(chance)){
      if(action==='negotiateWage')offer.weeklyWage=Math.round(offer.weeklyWage*1.12);if(action==='negotiateRole')offer.role=offer.role==='未来计划'?'轮换':offer.role==='轮换'?'主力':offer.role==='主力'?'核心':'核心';if(action==='clause')offer.releaseClause=offer.releaseClause?Math.round(offer.releaseClause*.8):Math.round(marketValue(save,repo.getClub(save.career.clubId))*1.8);if(action==='loan'){offer.type='租借';offer.years=1;offer.signingBonus=0;offer.appearancePromise='优先保证出场时间'}offer.status='谈判成功';offer.probability=clamp(offer.probability-3,5,95);
    }else{offer.probability=clamp(offer.probability-15,0,95);offer.status=offer.negotiationRound>=2||rng.bool(.35)?'谈判破裂':'谈判未果'}
    logDecision(offer,action,offer.status);
  }
  save.rng=rng.snapshot();if(TERMINAL.has(offer.status)&&offer.status!=='已接受')archiveOffer(save,offer);return offer;
}
export function declareStay(save){
  ensureState(save);if(!isTransferWindow(save))throw new Error('只能在正式转会窗口表达留队决定');const wid=windowId(save),state=save.career.transferWindows[wid]??={generated:false,count:0,stayChosen:false};if(state.stayChosen)throw new Error('本窗口已经作出留队决定');
  state.stayChosen=true;save.career.transferWindows[wid]=state;save.status.coachTrust=clamp(save.status.coachTrust+3,0,100);applyRelation(save,'management',{trust:3,respect:2});
  for(const offer of save.career.pending.offers){if(!TERMINAL.has(offer.status)){offer.status='选择留队';offer.expiredReason='玩家明确选择留队竞争';logDecision(offer,'stay',offer.status)}archiveOffer(save,offer)}save.career.pending.offers=[];
  const record={type:'stay',year:save.career.year,season:save.career.season,month:save.career.month,title:'留队竞争',text:'明确表示愿意留队争取位置。'};save.career.history.push(record);return record;
}
export function submitInterest(save,repo,clubId){
  ensureState(save);const club=repo.getClub(clubId),current=repo.getClub(save.career.clubId);if(!club||club.id===current.id)throw new Error('不能向当前俱乐部提交转会意向');
  const existing=[...save.career.history].reverse().find(x=>x.type==='interest'&&x.clubId===clubId&&x.season===save.career.season&&x.month===save.career.month);if(existing)return{club,status:existing.status,score:existing.score,offer:save.career.pending.offers.find(x=>x.sourceInterest===existing.id)||null,repeated:true};
  const requests=save.career.history.filter(x=>x.type==='interest'&&x.season===save.career.season&&x.month===save.career.month);if(requests.length>=3)throw new Error('本阶段最多只能向3家俱乐部提交意向');
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const score=offerScore(save,club,current);let status;if(score>78&&rng.bool(.72))status='接受接触';else if(score>65&&rng.bool(.55))status=rng.pick(['要求试训','只提供租借','推迟决定']);else status=rng.pick(['位置不需要','预算不足','竞技水平暂未达到']);
  const record={id:`I-${windowId(save)}-${club.id}`,type:'interest',year:save.career.year,season:save.career.season,month:save.career.month,clubId,status,score:Math.round(score)};save.career.history.push(record);let offer=null;
  if(['接受接触','只提供租借'].includes(status)&&isTransferWindow(save)){
    const role=roleFor(save.player,club),baseWage=Math.round((800+(save.player.ovr-50)*620)*(club.finance/70));offer={...newOfferBase(save,club,rng),id:`IO-${windowId(save)}-${club.id}`,sourceInterest:record.id,type:status==='只提供租借'?'租借':'永久转会',role,weeklyWage:Math.max(500,baseWage),years:status==='只提供租借'?1:rng.int(3,5),signingBonus:status==='只提供租借'?0:Math.round(baseWage*rng.int(6,12)),releaseClause:club.tier==='S'?0:Math.round(marketValue(save,current)*1.8),appearancePromise:status==='只提供租借'?'优先保证轮换出场':role==='主力'?'稳定首发':'竞争一线队位置',developmentPlan:save.player.age<=21?'重点成长计划':'一线队适应计划',coachInterest:clamp(Math.round(score),0,100),probability:clamp(Math.round(45+(score-60)*1.8),10,95)};if(!save.career.pending.offers.some(x=>x.id===offer.id))save.career.pending.offers.push(offer)
  }
  save.rng=rng.snapshot();return{club,status,score:Math.round(score),offer,repeated:false};
}
