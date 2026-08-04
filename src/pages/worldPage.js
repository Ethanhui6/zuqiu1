import {el,button,clear} from '../utils/dom.js';
import {createWorldClubCard} from '../components/clubCard.js';
import {openClubDetail} from '../components/clubDetailSheet.js';
import {CONTINENTS,continentStats,countriesForContinent,ensureWorldExplorerState,flagForCountry,leaguesForCountry,clubsForLeague,setExplorerLevel} from '../systems/world/worldExplorerSystem.js';

export function renderWorldPage(container,ctx){
  const {repo,store}=ctx,save=store.state;let state=ensureWorldExplorerState(save);clear(container);
  const page=el('section',{className:'page v20-world-page'});
  page.append(worldHeader(state,goBack));
  const viewport=el('div',{className:'v20-world-viewport'});page.append(viewport);container.append(page);renderLevel();

  function setLevel(level,payload={}){store.update(s=>setExplorerLevel(s,level,payload),'world-explorer');state=ensureWorldExplorerState(store.state);renderLevel();container.scrollTop=0}
  function goBack(){if(state.level==='club'||state.level==='league')setLevel(state.level==='club'?'league':'country');else if(state.level==='country')setLevel('continent');else if(state.level==='continent')setLevel('world');else ctx.navigate('more')}
  function renderLevel(){viewport.replaceChildren();page.querySelector('.v20-world-header')?.replaceWith(worldHeader(state,goBack));if(state.level==='world')renderWorld();else if(state.level==='continent')renderContinent();else if(state.level==='country')renderCountry();else renderLeague()}
  function renderWorld(){
    const stats=continentStats(repo,save);viewport.append(
      el('section',{className:'v20-world-intro'},[el('span',{className:'eyebrow',text:'足球世界'}),el('h1',{text:'从世界地图探索足球环境'}),el('p',{text:'逐级进入大洲、国家、联赛和球队，转会页面与这里共用同一球队详情和收藏状态。'})]),
      createWorldMap(stats,id=>setLevel('continent',{continent:id,country:null,leagueId:null})),
      el('div',{className:'v20-continent-grid'},stats.map(item=>button('',{className:'v20-continent-card',onClick:()=>setLevel('continent',{continent:item.id,country:null,leagueId:null})},[el('span',{className:'v20-continent-color',attrs:{style:`--continent:${item.theme}`}}),el('div',{},[el('strong',{text:item.name}),el('small',{text:`${item.clubs}家球队 · ${item.leagues}个联赛`}),el('p',{text:`平均实力 ${item.average} · 可加入机会 ${item.opportunity}`})]),item.favorites?el('span',{className:'tag',text:`收藏 ${item.favorites}`}):null])))
    )
  }
  function renderContinent(){
    const continent=CONTINENTS[state.continent]||CONTINENTS.europe,countries=countriesForContinent(repo,continent.id,save);
    viewport.append(el('section',{className:'v20-layer-intro'},[el('span',{className:'eyebrow',text:continent.name}),el('h1',{text:'选择国家或地区'}),el('p',{text:'国家卡片按玩家位置适配度、青训环境和联赛强度排序。'})]));
    const grid=el('div',{className:'v20-country-grid'});for(const country of countries)grid.append(button('',{className:'v20-country-card',onClick:()=>setLevel('country',{country:country.country,leagueId:null})},[el('span',{className:'v20-country-flag',text:flagForCountry(country.country)}),el('div',{},[el('strong',{text:country.country}),el('small',{text:`${country.leagues}个联赛 · ${country.clubs}家球队`}),el('p',{text:`平均实力 ${country.average} · 青训 ${country.youth}`})]),el('span',{className:'v20-country-fit',text:`适配 ${country.fit}`})]));viewport.append(grid)
  }
  function renderCountry(){
    const leagues=leaguesForCountry(repo,state.country,save);viewport.append(el('section',{className:'v20-layer-intro'},[el('span',{className:'eyebrow',text:`${flagForCountry(state.country)} ${state.country}`}),el('h1',{text:'选择联赛'}),el('p',{text:'不同联赛拥有不同强度、风格和年轻球员机会。'})]));
    const grid=el('div',{className:'v20-league-grid'});for(const league of leagues)grid.append(button('',{className:'v20-league-card',onClick:()=>setLevel('league',{leagueId:league.leagueId})},[el('div',{className:'v20-section-heading'},[el('div',{},[el('small',{text:`第${league.level}级别`}),el('strong',{text:league.name})]),el('span',{text:`${league.clubs}队`})]),el('div',{className:'v20-metric-grid'},[metric('平均实力',league.average),metric('年轻机会',league.youth),metric('玩家适配',league.fit)]),el('p',{text:`主要风格：${league.style}`})]));viewport.append(grid)
  }
  function renderLeague(){
    let query=state.query||'';
    const leagueName=repo.clubs.find(club=>club.leagueId===state.leagueId)?.leagueCn||'联赛';
    const search=el('input',{className:'search-input',attrs:{type:'search',placeholder:'搜索当前联赛球队','aria-label':'搜索当前联赛球队'}});
    search.value=query;
    const grid=el('div',{className:'club-grid v20-world-club-grid'});

    function renderGrid(){
      const clubs=clubsForLeague(repo,state.leagueId,save,{query,limit:32});
      grid.replaceChildren();
      for(const club of clubs){
        grid.append(createWorldClubCard(club,{playerPosition:save.player.position,onOpen:()=>openClubDetail({club,save,repo,store,ctx,source:'world'})}));
      }
      if(!clubs.length)grid.append(el('section',{className:'empty-state v20-surface'},[el('h2',{text:'没有匹配的球队'}),el('p',{text:'尝试缩短搜索词。'})]));
    }

    viewport.append(
      el('section',{className:'v20-layer-intro'},[
        el('span',{className:'eyebrow',text:state.country||'球队'}),
        el('h1',{text:leagueName}),
        el('p',{text:'球队按位置需求、年轻球员机会和实力环境综合排序。'})
      ]),
      search,
      grid
    );
    renderGrid();
    let persistTimer=0;
    search.addEventListener('input',()=>{
      query=search.value.trim();
      state.query=query;
      renderGrid();
      clearTimeout(persistTimer);
      persistTimer=setTimeout(()=>store.update(current=>{ensureWorldExplorerState(current).query=query},'world-search'),240);
    });
  }
  return()=>{};
}

function worldHeader(state,onBack){const labels=['世界',state.continent?CONTINENTS[state.continent]?.name:null,state.country,state.leagueId?'联赛':null].filter(Boolean);return el('header',{className:'v20-world-header'},[button('',{className:'v20-world-back',ariaLabel:'返回上一级',onClick:onBack},[el('span',{text:'‹'}),el('span',{text:state.level==='world'?'更多':'返回'})]),el('nav',{className:'v20-breadcrumb',attrs:{'aria-label':'当前位置'}},labels.map((label,index)=>el('span',{text:index?`› ${label}`:label})))])}
function createWorldMap(stats,onSelect){
  const wrap=el('section',{className:'v20-world-map-card'}),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','v20-world-map-svg');svg.setAttribute('viewBox','0 0 1000 520');svg.setAttribute('role','img');svg.setAttribute('aria-label','可点击的世界足球区域地图');
  const paths={northAmerica:'M70 95 L190 55 L300 105 L275 210 L210 235 L160 190 L95 180 Z',southAmerica:'M260 245 L340 260 L365 340 L325 455 L275 400 L245 315 Z',europe:'M440 90 L540 80 L570 145 L520 185 L450 155 Z',africa:'M450 185 L570 180 L610 300 L550 420 L470 350 L430 250 Z',asia:'M560 80 L870 70 L930 170 L850 270 L700 245 L610 175 Z',oceania:'M775 330 L930 320 L960 410 L845 455 L770 400 Z'};
  const statMap=Object.fromEntries(stats.map(item=>[item.id,item]));for(const[id,path]of Object.entries(paths)){const item=statMap[id];const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','v20-map-region');group.dataset.continent=id;group.setAttribute('tabindex','0');group.setAttribute('role','button');group.setAttribute('aria-label',`${item.name}，${item.clubs}家球队`);const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d',path);shape.setAttribute('fill',item.theme);shape.setAttribute('opacity','.78');const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=item.name;const text=document.createElementNS('http://www.w3.org/2000/svg','text');const point=centroidFor(id);text.setAttribute('x',point[0]);text.setAttribute('y',point[1]);text.setAttribute('text-anchor','middle');text.textContent=item.name;group.append(title,shape,text);group.addEventListener('click',()=>onSelect(id));group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(id)}});svg.append(group)}wrap.append(svg,el('p',{text:'点按大洲进入国家与联赛。地图只展示足球区域层级，不读取用户位置。'}));return wrap
}
function centroidFor(id){return{northAmerica:[180,145],southAmerica:[305,335],europe:[505,130],africa:[520,285],asia:[735,155],oceania:[860,390]}[id]}
function metric(label,value){return el('div',{className:'v20-metric'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
