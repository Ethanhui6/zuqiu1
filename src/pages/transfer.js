import { icon } from '../components/icons.js';
import { statGrid } from '../components/ui.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';

const money = value => `€${Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US')}`;

export function availableTransferClubs(state, clubs) {
  return clubs.filter(club => club.id !== state.player?.clubId && club.name !== state.player?.club);
}

export function transferPage(app,state){
  const clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS;
  const current=clubs.find(c=>c.id===state.player?.clubId)||clubs.find(c=>(c.cn||c.name)===state.player?.club);
  const selected=availableTransferClubs(state,clubs).find(c=>c.id===state.transfer.club);
  const root=document.createElement('section');root.className='page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">转会中心</h1><p class="page-subtitle">合同、经纪人、报价与职业选择</p></div><span class="badge ${state.transfer.offers.length?'orange':'blue'}">${state.transfer.offers.length}份报价</span></div>
  <section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('contract','sm')} 当前合同</div><h2 class="card-title">${state.player.club}</h2><p class="card-copy">剩余 ${state.career.contractMonths} 个月 · 周薪 ${money(state.career.weeklySalary)} · 年薪 ${money(state.career.weeklySalary*52)}</p></div><span class="badge blue">身价 ${money(state.career.marketValue)}</span></div>${statGrid([['经纪人建议','保持开放'],['首发顺位',state.player.ovr>66?'轮换':'青年梯队'],['关注球队',state.transfer.watchlist.length],['窗口状态','观察期']])}<div class="transfer-contract-actions"><button class="app-button ghost" data-transfer-action="stay">留队争取位置</button><button class="app-button ghost" data-transfer-action="renew">请求续约</button><button class="app-button ghost" data-transfer-action="loan">请求外租</button><button class="app-button ghost" data-transfer-action="transfer-request">申请转会</button><button class="app-button secondary" data-transfer-action="agent-report">请求经纪人调查</button></div></section>
  <div style="height:14px"></div><section class="surface-card transfer-focus"><div class="card-row"><div><div class="card-kicker">${icon('club','sm')} 俱乐部探索入口</div><h2 class="card-title">按国家、赛事和位置寻找下一站</h2><p class="card-copy">资料按层级筛选，选择俱乐部后再进入报价与合同沟通。</p></div><button class="icon-button" data-open-clubs aria-label="打开俱乐部目录">${icon('chevron')}</button></div></section>
  <div style="height:14px"></div><div class="grid-2"><section class="surface-card"><div class="card-kicker">${icon('agent','sm')} 经纪人工作台</div><h3 class="card-title">报价调查与谈判</h3><p class="card-copy">比较薪资、出场承诺、租借路径和解约条款。</p><div class="tag-row"><span class="badge blue">薪资</span><span class="badge green">定位</span><span class="badge orange">租借</span><span class="badge purple">续约</span></div></section><section class="surface-card"><div class="card-kicker">${icon('club','sm')} 关注球队</div><h3 class="card-title">${state.transfer.watchlist.length?`${state.transfer.watchlist.length} 支球队待跟进`:'还没有关注球队'}</h3><p class="card-copy">在俱乐部目录收藏球队后，会在转会窗口集中比较。</p></section></div>
  ${selected?`<div style="height:14px"></div><section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('club','sm')} 球队详情</div><h2 class="card-title">${selected.name}</h2><p class="card-copy">${[selected.city,selected.leagueCn||selected.league].filter(Boolean).join(' · ')}<br>${[selected.style,selected.formation].filter(Boolean).join(' · ')}</p></div><span class="badge green">适配 ${Math.round((selected.academy+selected.opportunity)/2)}%</span></div>${statGrid([['青训',selected.academy],['竞争',selected.competition],['机会',selected.opportunity],['薪资',selected.salary]])}<div class="card-row" style="margin-top:14px"><button class="app-button ghost" data-club-action="compare">加入比较</button><button class="app-button secondary" data-club-action="trial">申请试训</button><button class="app-button primary" data-club-action="contact">请求沟通</button></div></section>`:''}`;
  root.addEventListener('click',e=>{
    if(e.target.closest('[data-open-clubs]'))return app.navigate('clubs');
    const transferAction=e.target.closest('[data-transfer-action]')?.dataset.transferAction;if(transferAction==='agent-report')app.requestAgentReport();else if(transferAction)app.handleClubAction(transferAction,current);
    const clubAction=e.target.closest('[data-club-action]')?.dataset.clubAction;if(clubAction)app.handleClubAction(clubAction,selected);
  });
  return root;
}
