import { icon } from '../components/icons.js';
import { statGrid } from '../components/ui.js';
import { worldMapView } from '../components/worldMap.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';

export function transferPage(app,state){
  const clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS;
  const selected=clubs.find(c=>c.id===state.transfer.club);
  const root=document.createElement('section');root.className='page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">转会与球队世界</h1><p class="page-subtitle">探索联赛、比较机会并自主谈判</p></div><span class="badge ${state.transfer.offers.length?'orange':'blue'}">${state.transfer.offers.length}份报价</span></div>
  <section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('contract','sm')} 当前合同</div><h2 class="card-title">${state.player.club}</h2><p class="card-copy">剩余 ${state.career.contractMonths} 个月 · 周薪 €${state.career.weeklySalary}</p></div><span class="badge blue">身价 €${Math.round(state.career.marketValue/1000)}K</span></div>${statGrid([['经纪人建议','保持开放'],['首发顺位',state.player.ovr>66?'轮换':'青年梯队'],['关注球队',state.transfer.watchlist.length],['窗口状态','观察期']])}<div class="card-row" style="margin-top:14px"><button class="app-button ghost" data-transfer-action="stay">留队争取位置</button><button class="app-button secondary" data-transfer-action="agent">请求经纪人调查</button></div></section>
  <div style="height:14px"></div>${worldMapView(state,clubs)}
  ${selected?`<div style="height:14px"></div><section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('club','sm')} 球队详情</div><h2 class="card-title">${selected.name}</h2><p class="card-copy">${selected.city} · ${selected.league}<br>${selected.style} · ${selected.formation}</p></div><span class="badge green">适配 ${Math.round((selected.academy+selected.opportunity)/2)}%</span></div>${statGrid([['青训',selected.academy],['竞争',selected.competition],['机会',selected.opportunity],['薪资',selected.salary]])}<div class="card-row" style="margin-top:14px"><button class="app-button ghost" data-club-action="compare">加入比较</button><button class="app-button secondary" data-club-action="trial">申请试训</button><button class="app-button primary" data-club-action="contact">请求沟通</button></div></section>`:''}`;
  root.addEventListener('click',e=>{
    const continent=e.target.closest('[data-continent]')?.dataset.continent;if(continent){app.store.set(s=>{s.transfer.continent=continent;s.transfer.country=null;s.transfer.league=null;s.transfer.club=null;return s;});app.feedback.emit('continentSelect',continent);app.render();return;}
    const country=e.target.closest('[data-country]')?.dataset.country;if(country){app.store.set(s=>{s.transfer.country=country;s.transfer.league=null;s.transfer.club=null;return s;});app.feedback.emit('countrySelect',country);app.render();return;}
    const league=e.target.closest('[data-league]')?.dataset.league;if(league){app.store.set(s=>{s.transfer.league=league;s.transfer.club=null;return s;});app.feedback.emit('leagueSelect',league);app.render();return;}
    const club=e.target.closest('[data-club]')?.dataset.club;if(club){app.store.set(s=>{s.transfer.club=club;return s;});app.feedback.emit('clubSelect',clubs.find(c=>c.id===club)?.name);app.render();return;}
    if(e.target.closest('[data-map-reset]')){app.store.set(s=>{s.transfer={...s.transfer,continent:null,country:null,league:null,club:null};return s;});app.render();return;}
    if(e.target.closest('[data-map-back]')){app.store.set(s=>{if(s.transfer.club)s.transfer.club=null;else if(s.transfer.league)s.transfer.league=null;else if(s.transfer.country)s.transfer.country=null;else s.transfer.continent=null;return s;});app.render();return;}
    const transferAction=e.target.closest('[data-transfer-action]')?.dataset.transferAction;if(transferAction==='stay')app.feedback.emit('coachTrust','留队计划已加入待办');if(transferAction==='agent')app.requestAgentReport();
    const clubAction=e.target.closest('[data-club-action]')?.dataset.clubAction;if(clubAction)app.handleClubAction(clubAction,selected);
  });
  return root;
}
