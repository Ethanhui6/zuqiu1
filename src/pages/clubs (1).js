import { icon } from '../components/icons.js';
import { statGrid } from '../components/ui.js';
import { crestSvg } from '../components/clubCrest.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';

const list = () => dataRepository.clubs?.length ? dataRepository.clubs : CLUBS;
const value = (club, key, fallback = '—') => club?.[key] ?? fallback;
const unique = items => [...new Set(items.filter(Boolean))];

export function clubsPage(app, state) {
  const clubs = list();
  const filters = state.transfer.clubDirectory || {};
  const continents = unique(clubs.map(club => club.continent));
  const countries = unique(clubs.filter(club => !filters.continent || club.continent === filters.continent).map(club => club.country));
  const leagues = unique(clubs.filter(club => (!filters.continent || club.continent === filters.continent) && (!filters.country || club.country === filters.country)).map(club => club.league || club.leagueCn));
  const query = String(filters.query || '').trim().toLowerCase();
  const position = filters.position || '';
  const visible = clubs.filter(club => (!filters.continent || club.continent === filters.continent) && (!filters.country || club.country === filters.country) && (!filters.league || (club.league || club.leagueCn) === filters.league) && (!position || (club.needs || club.need || []).includes(position)) && (!query || [club.name, club.cn, club.country, club.league, club.leagueCn, club.city].filter(Boolean).join(' ').toLowerCase().includes(query))).slice(0, 36);
  const selected = clubs.find(club => club.id === state.transfer.club);
  const root = document.createElement('section');
  root.className = 'page clubs-page';
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title">俱乐部</h1><p class="page-subtitle">国家、赛事、联赛和俱乐部，按职业机会逐级浏览</p></div><span class="badge blue">${clubs.length} 支球队</span></div>
    <section class="surface-card club-filter-panel"><div class="card-row"><div><div class="card-kicker">${icon('filter', 'sm')} 分级筛选</div><h2 class="card-title">从联赛进入俱乐部</h2></div><button class="icon-button" data-reset-club-filters aria-label="重置筛选">${icon('recovery')}</button></div><div class="club-filter-grid"><label>国家区域<select data-club-filter="continent"><option value="">全部区域</option>${continents.map(item => `<option value="${item}" ${item === filters.continent ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label>国家<select data-club-filter="country"><option value="">全部国家</option>${countries.map(item => `<option value="${item}" ${item === filters.country ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label>联赛<select data-club-filter="league"><option value="">全部联赛</option>${leagues.map(item => `<option value="${item}" ${item === filters.league ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label>位置需求<select data-club-filter="position"><option value="">全部位置</option>${['ST', 'CM', 'CB', 'GK'].map(item => `<option value="${item}" ${item === position ? 'selected' : ''}>${item}</option>`).join('')}</select></label></div><label class="club-search"><span>${icon('search', 'sm')}</span><input value="${filters.query || ''}" data-club-query placeholder="搜索俱乐部、国家或联赛" /></label></section>
    ${selected ? selectedDetail(selected, state) : ''}
    <section class="club-results"><div class="section-heading"><div><div class="card-kicker">${filters.league || filters.country || filters.continent || '全部俱乐部'}</div><h2 class="card-title">可用俱乐部</h2></div><span class="badge green">显示 ${visible.length} 支</span></div><div class="grid-2">${visible.map(club => clubCard(club, club.id === selected?.id, position)).join('')}</div></section>`;
  root.addEventListener('change', event => {
    const key = event.target.closest('[data-club-filter]')?.dataset.clubFilter;
    if (!key) return;
    app.store.set(current => { current.transfer.clubDirectory = { ...(current.transfer.clubDirectory || {}), [key]: event.target.value, ...(key === 'continent' ? { country: '', league: '' } : {}), ...(key === 'country' ? { league: '' } : {}) }; return current; });
  });
  root.querySelector('[data-club-query]')?.addEventListener('input', event => app.store.set(current => { current.transfer.clubDirectory = { ...(current.transfer.clubDirectory || {}), query: event.target.value }; return current; }, { persist: false }));
  root.querySelector('[data-reset-club-filters]')?.addEventListener('click', () => app.store.set(current => { current.transfer.clubDirectory = {}; current.transfer.club = null; return current; }));
  root.addEventListener('click', event => {
    const action = event.target.closest('[data-club-action]')?.dataset.clubAction;
    if (action) return app.handleClubAction(action, selected);
    const clubId = event.target.closest('[data-club]')?.dataset.club;
    if (!clubId) return;
    app.store.set(current => { current.transfer.club = clubId; return current; });
  });
  return root;
}

function clubCard(club, active, position) {
  const needs = club.needs || club.need || [];
  const fit = needs.includes(position) ? '位置正缺人' : Number(club.youthUsage || club.youth || 0) >= 70 ? '青年机会较多' : '体系稳定';
  const city = club.city && club.city !== '未核实' ? club.city : '';
  const location = [value(club, 'country'), value(club, 'league', club.leagueCn)].filter(Boolean).join(' · ');
  const style = [city, value(club, 'tactic', club.style)].filter(Boolean).join(' · ');
  return `<button class="surface-card interactive club-directory-card ${active ? 'glow' : ''}" data-club="${club.id}"><div class="card-row"><div class="club-card-crest">${crestSvg(club, { size: 46 })}</div><span class="badge ${active ? 'green' : 'blue'}">${fit}</span></div><h3 class="card-title">${value(club, 'name', club.cn)}</h3><p class="card-copy">${location}<br>${style}</p><div class="plan-meta"><span>实力 ${value(club, 'rep', club.reputation)}</span><span>青训 ${value(club, 'youth', club.academy)}</span><span>机会 ${value(club, 'youthUsage', club.opportunity)}</span></div></button>`;
}

function selectedDetail(club, state) {
  const position = state.player?.position || '';
  const needs = club.needs || club.need || [];
  const fit = needs.includes(position) ? 82 : Math.round(Number(club.youthUsage || club.opportunity || 50) * .72);
  const city = club.city && club.city !== '未核实' ? club.city : '';
  const location = [value(club, 'country'), value(club, 'league', club.leagueCn), city].filter(Boolean).join(' · ');
  return `<section class="surface-card club-detail-panel"><div class="card-row"><div class="card-row" style="justify-content:flex-start"><div class="club-card-crest">${crestSvg(club, { size: 58 })}</div><div><div class="card-kicker">俱乐部详情</div><h2 class="card-title">${value(club, 'name', club.cn)}</h2><p class="card-copy">${location}</p></div></div><span class="badge green">适配 ${fit}%</span></div>${statGrid([['综合实力', value(club, 'rep', club.reputation)], ['进攻', value(club, 'attack')], ['防守', value(club, 'defense')], ['青训', value(club, 'youth', club.academy)], ['青年机会', value(club, 'youthUsage', club.opportunity)], ['位置需求', needs.slice(0, 3).join('、') || '均衡']])}<p class="card-copy">${value(club, 'tactic', club.style)}。详情中的能力、财政和机会为本地生涯模拟参数。</p><div class="card-row"><button class="app-button ghost" data-club-action="watch">加入关注</button><button class="app-button primary" data-club-action="contact">请求接触</button></div></section>`;
}
