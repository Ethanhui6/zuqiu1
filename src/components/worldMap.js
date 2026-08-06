import { CLUBS, continents, countriesFor, leaguesFor, clubsForLeague } from '../data/clubs.js';
import { icon } from './icons.js';
import { crestSvg } from './clubCrest.js';

const CONTINENTS = {
  '北美洲':'M5 23 17 12 29 16 34 27 26 35 19 34 13 44 8 39Z',
  '南美洲':'M27 50 39 54 42 68 35 87 29 80 31 66 24 58Z',
  '欧洲':'M43 20 55 18 62 25 57 34 45 35 40 29Z',
  '非洲':'M45 39 61 39 67 52 58 73 47 63 42 49Z',
  '亚洲':'M58 18 82 17 96 30 89 51 74 53 64 39 55 31Z',
  '大洋洲':'M82 68 96 72 94 86 83 84 77 76Z'
};

export function worldMapView(state, sourceClubs = CLUBS){
  const clubs = sourceClubs;
  const availableContinents = Object.keys(CONTINENTS).filter(name=>clubs.some(club=>club.continent===name));
  const countries = continent => [...new Set(clubs.filter(club=>club.continent===continent).map(club=>club.country))];
  const leagues = country => [...new Set(clubs.filter(club=>club.country===country).map(club=>club.league))];
  const leagueClubs = league => clubs.filter(club=>club.league===league);
  const selectedContinent=state.transfer.continent;
  const selectedCountry=state.transfer.country;
  const selectedLeague=state.transfer.league;
  const selectedClub=state.transfer.club;
  const visibleClubs=selectedLeague?leagueClubs(selectedLeague):selectedCountry?clubs.filter(c=>c.country===selectedCountry):selectedContinent?clubs.filter(c=>c.continent===selectedContinent):clubs;
  const regions=Object.entries(CONTINENTS).map(([name,path])=>`<path class="continent ${selectedContinent===name?'active':''}" data-continent="${name}" d="${path}"/>`).join('');
  const nodes=visibleClubs.map(c=>`<g class="club-node ${selectedClub===c.id?'active':''}" data-club="${c.id}" transform="translate(${c.x},${c.y})"><circle r="1.8"/><text x="3" y="1">${c.name}</text></g>`).join('');
  const selector = !selectedContinent
    ? `<div class="action-grid">${availableContinents.map(c=>`<button class="action-tile" data-continent="${c}">${icon('map')}<h3>${c}</h3><p>${clubs.filter(x=>x.continent===c).length} 家球队节点</p></button>`).join('')}</div>`
    : !selectedCountry
      ? `<div class="choice-grid">${countries(selectedContinent).map(c=>`<button class="choice-card" data-country="${c}">${icon('country')}<h3>${c}</h3><p>${clubs.filter(x=>x.country===c).length} 家球队</p></button>`).join('')}</div>`
      : !selectedLeague
        ? `<div class="choice-grid">${leagues(selectedCountry).map(l=>`<button class="choice-card" data-league="${l}">${icon('league')}<h3>${l}</h3><p>进入联赛球队层</p></button>`).join('')}</div>`
        : `<div class="grid-2">${leagueClubs(selectedLeague).map(c=>clubCard(c,selectedClub===c.id)).join('')}</div>`;
  return `<section class="surface-card world-map-shell"><div class="map-toolbar"><button class="icon-button" data-map-back aria-label="返回上一级">${icon('back')}</button><div style="flex:1"><div class="card-kicker">${icon('map','sm')} 球队世界</div><strong>${selectedLeague||selectedCountry||selectedContinent||'世界地图'}</strong></div><button class="icon-button" data-map-reset aria-label="重置地图">${icon('recovery')}</button></div><div class="map-stage"><svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${regions}${nodes}</svg></div><div class="map-breadcrumb"><span class="map-crumb">世界</span>${selectedContinent?`<span class="map-crumb">${selectedContinent}</span>`:''}${selectedCountry?`<span class="map-crumb">${selectedCountry}</span>`:''}${selectedLeague?`<span class="map-crumb">${selectedLeague}</span>`:''}</div></section><div style="height:12px"></div>${selector}`;
}

export function clubCard(c,active=false){
  return `<button class="surface-card interactive ${active?'glow':''}" data-club="${c.id}"><div class="card-row"><div class="club-card-crest">${crestSvg(c,{size:48})}</div><span class="badge blue">适配 ${Math.round((c.academy+c.opportunity)/2)}%</span></div><h3 class="card-title">${c.name}</h3><p class="card-copy">${c.city||'城市资料未核实'} · ${c.league||c.leagueCn}<br>${c.style||c.tactic}</p><div class="plan-meta"><span>青训 ${c.academy}</span><span>竞争 ${c.competition}</span><span>机会 ${c.opportunity}</span></div></button>`;
}
