import { worldMapView } from '../components/worldMap.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';

export function worldPage(app,state){
  const clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS;
  const root=document.createElement('section');
  root.className='page world-page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">Football World</h1><p class="page-subtitle">Explore continents, countries, leagues, and clubs.</p></div><span class="badge blue">${clubs.length} clubs</span></div>${worldMapView(state,clubs,{immersive:true})}`;
  root.addEventListener('click',event=>{
    const transfer=state.transfer;
    const continent=event.target.closest('[data-continent]')?.dataset.continent;
    const country=event.target.closest('[data-country]')?.dataset.country;
    const league=event.target.closest('[data-league]')?.dataset.league;
    const club=event.target.closest('[data-club]')?.dataset.club;
    if(event.target.closest('[data-map-reset]')){app.store.set(s=>{s.transfer={...s.transfer,continent:null,country:null,league:null,club:null};return s;});return app.render();}
    if(event.target.closest('[data-map-back]')){app.store.set(s=>{if(s.transfer.club)s.transfer.club=null;else if(s.transfer.league)s.transfer.league=null;else if(s.transfer.country)s.transfer.country=null;else s.transfer.continent=null;return s;});return app.render();}
    if(continent){app.store.set(s=>{s.transfer={...s.transfer,continent,country:null,league:null,club:null};return s;});return app.render();}
    if(country&&transfer.continent){app.store.set(s=>{s.transfer={...s.transfer,country,league:null,club:null};return s;});return app.render();}
    if(league&&transfer.country){app.store.set(s=>{s.transfer={...s.transfer,league,club:null};return s;});return app.render();}
    if(club){app.store.set(s=>{s.transfer={...s.transfer,club};return s;});return app.render();}
  });
  return root;
}
