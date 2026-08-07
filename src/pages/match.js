import { icon } from '../components/icons.js';
import { emptyState } from '../components/ui.js';
import { crestSvg, resolveClubAlias } from '../components/clubCrest.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';
import { matchAvailability } from '../core/disciplineEngine.js';

const FORMATION_LAYOUTS = {
  '4-3-3': [['GK',50,90],['LB',14,72],['CB',38,77],['CB',62,77],['RB',86,72],['CM',25,51],['CM',50,57],['CM',75,51],['LW',18,25],['ST',50,15],['RW',82,25]],
  '4-2-3-1': [['GK',50,90],['LB',14,72],['CB',38,77],['CB',62,77],['RB',86,72],['CDM',35,57],['CDM',65,57],['LW',18,34],['CAM',50,38],['RW',82,34],['ST',50,14]],
  '4-4-2': [['GK',50,90],['LB',14,72],['CB',38,77],['CB',62,77],['RB',86,72],['LW',15,46],['CM',38,53],['CM',62,53],['RW',85,46],['ST',36,18],['ST',64,18]],
  '3-5-2': [['GK',50,90],['CB',20,74],['CB',50,79],['CB',80,74],['LB',10,48],['CM',32,53],['CM',50,58],['CM',68,53],['RB',90,48],['ST',35,18],['ST',65,18]],
  '3-4-2-1': [['GK',50,90],['CB',20,74],['CB',50,79],['CB',80,74],['LB',13,50],['CM',39,55],['CM',61,55],['RB',87,50],['CAM',34,31],['CAM',66,31],['ST',50,13]],
  '4-3-1-2': [['GK',50,90],['LB',14,72],['CB',38,77],['CB',62,77],['RB',86,72],['CM',25,53],['CM',50,58],['CM',75,53],['CAM',50,37],['ST',35,17],['ST',65,17]]
};
const POSITION_FIT = {
  GK:['GK'], LB:['LB','RB'], RB:['RB','LB'], CB:['CB'], CDM:['CDM','CM'], CM:['CM','CDM','CAM'],
  CAM:['CAM','CM','LW','RW'], LW:['LW','RW','CAM'], RW:['RW','LW','CAM'], ST:['ST','LW','RW']
};

export function matchPage(app,state){
  const match=state.schedule.find(item=>item.status==='upcoming'&&item.date>=state.simulation.date);
  const clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS;
  const currentClub=resolveClub(state.player?.clubId||state.player?.club,clubs);
  const opponentClub=resolveClub(match?.opponentId||match?.opponent,clubs);
  const currentSnapshot=clubSnapshot(currentClub,state);
  const opponentSnapshot=clubSnapshot(opponentClub,state);
  const playerStatus=matchPlayerStatus(state.player,currentSnapshot,state);
  const root=document.createElement('section');root.className='page match-hub-page';

  if(!match){
    root.innerHTML=`<div class="page-head"><div><h1 class="page-title">比赛中心</h1><p class="page-subtitle">赛程、阵容与比赛状态</p></div></div>${emptyState('暂无即将进行的比赛','返回生涯首页查看下一关键节点。','calendar')}`;
    return root;
  }

  const currentIsHome=match.home??!/客场|away/i.test(match.venue||'');
  const home=currentIsHome?currentSnapshot:opponentSnapshot,away=currentIsHome?opponentSnapshot:currentSnapshot;
  const homeLineup=expectedLineup(home,state,{includePlayer:currentIsHome&&playerStatus.starts});
  const awayLineup=expectedLineup(away,state,{includePlayer:!currentIsHome&&playerStatus.starts});
  root.innerHTML=`<div class="page-head match-hub-head"><div><h1 class="page-title">比赛中心</h1><p class="page-subtitle">${escapeHtml(match.competition||'比赛')} · ${escapeHtml(match.date||'待定')}</p></div><span class="badge ${match.important?'orange':'blue'}">${match.important?'关键比赛':'赛前'}</span></div>
    ${matchPreview(match,home,away,state,playerStatus)}
    <div class="page-fixed-action match-fixed-action"><span><small>${playerStatus.available===false?'当前未入选':match.venue||'比赛场地'}</small><strong>${playerStatus.available===false?playerStatus.label:match.competition || '下一场比赛'}</strong></span><button class="app-button primary match-enter-button" data-play>${icon('play','sm')}进入比赛</button></div>`;
  root.querySelector('[data-lineups]')?.addEventListener('click',()=>openFormationSheet(app,{home,away,homeLineup,awayLineup,currentIsHome,playerStatus,state}));
  root.querySelector('[data-play]')?.addEventListener('click',()=>playerStatus.available===false?app.feedback.emit('failure',playerStatus.copy):app.openMatchStrategy(match));
  return root;
}

function matchPreview(match,home,away,state,playerStatus){
  return `<section class="surface-card match-preview">
    <div class="match-preview__meta"><span>${icon('match','sm')} ${escapeHtml(match.competition||'比赛')}</span><span>${escapeHtml(match.venue||'比赛场地')} · ${escapeHtml(match.date||'待定')}</span></div>
    <div class="match-preview__teams">
      ${teamHeader(home,'主场')}
      <div class="match-preview__versus"><strong>VS</strong><span>${escapeHtml(match.round||'赛前')}</span></div>
      ${teamHeader(away,'客场')}
    </div>
    <div class="match-preview__facts">${teamFacts(home)}${teamFacts(away)}</div>
    <div class="match-preview__player-status">
      <div><span>你的名单状态</span><strong>${escapeHtml(playerStatus.label)}</strong><small>${escapeHtml(playerStatus.copy)}</small></div>
      <div class="match-preview__player-facts"><span class="badge blue">${escapeHtml(state.player.position)}</span><span>体能 ${Math.round(state.player.fitness)}</span><span>士气 ${Math.round(state.player.morale)}</span></div>
    </div>
    <div class="match-preview__lineups"><button class="match-preview__lineup-trigger" data-lineups>${icon('formation','sm')}<span><strong>查看预计阵容</strong><small>${escapeHtml(home.formation)} · ${escapeHtml(away.formation)}</small></span>${icon('chevron','sm')}</button></div>
  </section>`;
}

function teamHeader(club,side){
  return `<div class="match-preview__team"><div class="match-preview__crest">${crestSvg(club,{size:72,decorative:true})}</div><span>${side}</span><strong>${escapeHtml(clubName(club))}</strong><small>${escapeHtml(club.leagueCn||club.league||'俱乐部赛事')}</small></div>`;
}

function teamFacts(snapshot){
  const rank=snapshot.rank==='—'?'待定':`第 ${snapshot.rank}`;
  return `<div class="match-preview__team-facts"><div><strong>${rank}</strong><span>排名</span></div><div><strong>${snapshot.strength}</strong><span>实力</span></div><div><strong>${escapeHtml(snapshot.formation)}</strong><span>阵型</span></div><div class="match-preview__form" aria-label="近五场 ${escapeHtml(snapshot.form.join(''))}">${formDots(snapshot.form)}</div></div>`;
}

function openFormationSheet(app,{home,away,homeLineup,awayLineup,currentIsHome,playerStatus,state}){
  const teams={home:{club:home,lineup:homeLineup,label:'主队'},away:{club:away,lineup:awayLineup,label:'客队'}};
  const initial=currentIsHome?'home':'away';
  app.overlay.sheet('预计阵容',`<div class="formation-sheet" data-formation-sheet><div class="formation-switch" role="tablist" aria-label="切换预计阵容"><button role="tab" data-lineup-side="home">主队</button><button role="tab" data-lineup-side="away">客队</button></div><div data-formation-view></div></div>`,{wide:true,onMount:overlay=>{
    const view=overlay.querySelector('[data-formation-view]');
    const render=side=>{
      overlay.querySelectorAll('[data-lineup-side]').forEach(button=>{const active=button.dataset.lineupSide===side;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});
      const selected=teams[side],isCurrent=side===(currentIsHome?'home':'away');
      view.innerHTML=formationView(selected.club,selected.lineup,selected.label,{isCurrent,playerStatus,state});
    };
    overlay.querySelectorAll('[data-lineup-side]').forEach(button=>button.addEventListener('click',()=>render(button.dataset.lineupSide)));
    render(initial);
  }});
}

function formationView(club,lineup,side,{isCurrent,playerStatus,state}){
  const playerNode=lineup.some(player=>player.isPlayer);
  const note=isCurrent?`<div class="formation-player-note is-player"><span class="formation-player-note__number">${escapeHtml(state.player.number)}</span><span><strong>${escapeHtml(state.player.name)}</strong><small>${escapeHtml(state.player.position)} · OVR ${Math.round(state.player.ovr)} · ${escapeHtml(playerStatus.label)}</small></span><b>${playerNode?'场上高亮':'替补席'}</b></div>`:'';
  return `<div class="formation-team-head"><div class="formation-team-crest">${crestSvg(club,{size:48,decorative:true})}</div><div><span>${side}预计阵容</span><strong>${escapeHtml(clubName(club))}</strong></div><b>${escapeHtml(club.formation)}</b></div>
    <div class="formation-pitch" aria-label="${escapeHtml(clubName(club))} ${escapeHtml(club.formation)} 预计阵容">${lineup.map((player,index)=>formationNode(player,index)).join('')}</div>${note}`;
}

function formationNode(player,index){
  return `<div class="formation-node ${player.isPlayer?'is-player':''}" style="--node-x:${player.x}%;--node-y:${player.y}%" title="${escapeHtml(player.name)} · ${escapeHtml(player.position)} · OVR ${player.ovr}"><span>${player.number||index+1}</span><strong>${escapeHtml(shortName(player.name))}</strong><small>${escapeHtml(player.position)} · ${player.ovr}</small></div>`;
}

function resolveClub(value,clubs){
  const club=clubs.find(item=>item.id===value)||resolveClubAlias(value,clubs);
  return club||{id:String(value||'opponent'),name:String(value||'对手'),cn:String(value||'对手'),formation:'4-3-3',isFallback:true};
}

function clubSnapshot(club,state){
  const leagueClubs=clubsForLeague(club);
  const rank=club.isFallback?'—':Math.max(1,leagueClubs.findIndex(item=>item.id===club.id)+1);
  const rating=value(club.attack??club.rep??club.reputation,58),defense=value(club.defense??club.rep??club.reputation,58);
  return {...club,rank,formation:FORMATION_LAYOUTS[club.formation]?club.formation:'4-3-3',strength:Math.round((rating+defense+value(club.rep??club.reputation,58))/3),form:formFromSeed(hash(`${club.id}|${state.season.year}|${state.season.week}`))};
}

function clubsForLeague(club){
  const clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS;
  const candidates=clubs.filter(item=>(item.leagueId&&item.leagueId===club.leagueId)||(!club.leagueId&&(item.leagueCn||item.league)===(club.leagueCn||club.league)));
  return (candidates.length?candidates:[club]).slice().sort((a,b)=>value(b.rep??b.reputation,58)-value(a.rep??a.reputation,58));
}

function expectedLineup(club,state,{includePlayer=false}={}){
  const layout=formationSlots(club.formation),seasonYear=Number(String(state.simulation?.date||'2026').slice(0,4));
  const repositoryRoster=dataRepository.rosterForClub?.(club.id,{limit:32,seed:state.player.name||'career',seasonYear})||[];
  const source=repositoryRoster.length?repositoryRoster:club.id===state.player.clubId&&Array.isArray(state.player.squad)?state.player.squad:[];
  const pool=source.map((player,index)=>({id:player.id||`${club.id}-${index}`,name:player.cn||player.name||`球员 ${index+1}`,position:player.position||layout[index%layout.length].position,ovr:Math.round(value(player.ovr,Math.max(50,value(club.rep??club.reputation,58)-8))),number:player.number}));
  const used=new Set();
  const lineup=layout.map((slot,index)=>{
    const picked=pool.find(player=>fitsSlot(player.position,slot.position)&&!used.has(player.id))||pool.find(player=>!used.has(player.id));
    if(picked){used.add(picked.id);return{...picked,...slot,position:picked.position||slot.position};}
    return{id:`${club.id}-${slot.position}-${index}`,name:`${slot.position} 球员`,position:slot.position,ovr:Math.max(50,value(club.rep??club.reputation,58)-8),number:index+1,...slot};
  });
  if(includePlayer){
    const target=Math.max(0,layout.findIndex(slot=>fitsSlot(state.player.position,slot.position)));
    lineup[target]={id:'player',name:state.player.name,position:state.player.position,ovr:Math.round(state.player.ovr),number:state.player.number,isPlayer:true,...layout[target]};
  }
  return lineup;
}

function matchPlayerStatus(player,current,state){
  const unavailable=matchAvailability(state);
  if(unavailable)return{label:'未入选',copy:`${unavailable.label}：${unavailable.copy}`,starts:false,available:false};
  if(player.fitness<55)return{label:'未入选',copy:'赛前体能未达到比赛名单要求，本场只能随队观察。',starts:false,available:false};
  if(player.ovr>=Math.max(62,current.strength-7))return{label:'预计首发',copy:'赛前状态符合首发要求，关键镜头将围绕你展开。',starts:true};
  if(player.ovr<Math.max(45,current.strength-25))return{label:'未入选',copy:'当前队内顺位未达到比赛名单要求，本场只能随队观察。',starts:false,available:false};
  return{label:'替补待命',copy:'先从替补席观察比赛，表现机会随时会出现。',starts:false};
}

function formationSlots(formation){return(FORMATION_LAYOUTS[formation]||FORMATION_LAYOUTS['4-3-3']).map(([position,x,y])=>({position,x,y}));}
function fitsSlot(position,slot){return position===slot||(POSITION_FIT[slot]||[slot]).includes(position);}
function formFromSeed(seed){const results=['胜','平','负'];return Array.from({length:5},(_,index)=>results[(seed>>>((index%4)*3)+index)%results.length]);}
function formDots(form){return form.map(item=>`<i class="is-${item}">${item}</i>`).join('');}
function shortName(name){const value=String(name||'球员');return value.length>8?`${value.slice(0,7)}…`:value;}
function clubName(club){return club?.cn||club?.name||club?.nameZh||'未知俱乐部';}
function value(input,fallback){const number=Number(input);return Number.isFinite(number)?number:fallback;}
function hash(input){let result=2166136261;for(const char of String(input))result=Math.imul(result^char.codePointAt(0),16777619);return result>>>0;}
function escapeHtml(input){return String(input??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
