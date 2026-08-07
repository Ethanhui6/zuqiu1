import { icon } from '../components/icons.js';
import { metric, statGrid, emptyState } from '../components/ui.js';
import { crestSvg, resolveClubAlias } from '../components/clubCrest.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';

export function matchPage(app,state){
  const match=state.schedule.find(m=>m.status==='upcoming'&&m.date>=state.simulation.date);
  const last=state.career.history.filter(x=>x.type==='比赛').at(-1);
  const clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS;
  const currentClub=resolveClub(state.player?.clubId||state.player?.club,clubs);
  const opponentClub=resolveClub(match?.opponentId||match?.opponent,clubs);
  const currentSnapshot=clubSnapshot(currentClub,state,'current');
  const opponentSnapshot=clubSnapshot(opponentClub,state,'opponent');
  const playerStatus=matchPlayerStatus(state.player,currentSnapshot);
  const root=document.createElement('section');root.className='page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">比赛中心</h1><p class="page-subtitle">战术与关键镜头由你的操作决定</p></div>${match?`<span class="badge blue">${match.date}</span>`:''}</div>
  ${match?`${matchPreview(match,currentSnapshot,opponentSnapshot,state,playerStatus)}<div style="height:14px"></div><button class="app-button primary match-enter-button" style="width:100%" data-play>${icon('play','sm')}进入比赛</button>`:emptyState('暂无即将进行的比赛','推进日期或查看完整赛程。','calendar')}
  ${last?`<div style="height:18px"></div><section class="surface-card"><div class="card-kicker">最近一场</div><h2 class="card-title">${last.summary}</h2>${statGrid([['评分',last.rating],['进球',last.goals],['助攻',last.assists],['出场',`${last.minutes}′`]])}<button class="app-button ghost" style="margin-top:14px" data-last>查看比赛时间线</button></section>`:''}`;
  root.querySelector('[data-play]')?.addEventListener('click',()=>app.openMatchStrategy(match));
  root.querySelector('[data-last]')?.addEventListener('click',()=>app.openLastMatch());
  return root;
}

function matchPreview(match,current,opponent,state,playerStatus){
  const currentIsHome=match.home??!/客场|away/i.test(match.venue||'');
  const home=currentIsHome?current:opponent,away=currentIsHome?opponent:current;
  const homeLineup=expectedLineup(home,state,{includePlayer:currentIsHome&&playerStatus.starts});
  const awayLineup=expectedLineup(away,state,{includePlayer:!currentIsHome&&playerStatus.starts});
  return `<section class="surface-card match-preview">
    <div class="match-preview__meta"><span>${icon('match','sm')} ${escapeHtml(match.competition||'比赛')}</span><span>${escapeHtml(match.venue||'比赛场地')} · ${escapeHtml(match.date||'待定')}</span></div>
    <div class="match-preview__teams">
      ${teamHeader(home,'主场')}
      <div class="match-preview__versus"><strong>VS</strong><span>${escapeHtml(match.round||'赛前')}</span></div>
      ${teamHeader(away,'客场')}
    </div>
    <div class="match-preview__facts">
      ${teamFacts(home)}
      <div class="match-preview__player-status"><span>你的比赛状态</span><strong>${playerStatus.label}</strong><small>${escapeHtml(playerStatus.copy)}</small></div>
      ${teamFacts(away)}
    </div>
    <div class="match-preview__condition">
      <div class="match-brief-stats">${metric('赛前体能',state.player.fitness,{tone:'green'})}${metric('士气',state.player.morale)}${metric('比赛压力',Math.max(20,70-state.player.morale),{tone:'orange'})}</div>
      <div class="tag-row"><span class="badge green">${playerStatus.label}</span><span class="badge blue">${escapeHtml(state.player.position)}</span><span class="badge purple">${escapeHtml(current.formation)}</span></div>
    </div>
    <div class="match-preview__lineups">
      ${lineupColumn(home,homeLineup,'主队预计首发')}
      ${lineupColumn(away,awayLineup,'客队预计首发')}
    </div>
  </section>`;
}

function teamHeader(club,side){
  return `<div class="match-preview__team"><div class="match-preview__crest">${crestSvg(club,{size:72,decorative:true})}</div><span>${side}</span><strong>${escapeHtml(clubName(club))}</strong><small>${escapeHtml(club.leagueCn||club.league||'俱乐部赛事')}</small></div>`;
}

function teamFacts(snapshot){
  const rank=snapshot.rank==='—'?'联赛排名待定':`联赛第 ${snapshot.rank}`;
  return `<div class="match-preview__team-facts"><span>${escapeHtml(clubName(snapshot))}</span><strong>${rank} · 强度 ${snapshot.strength}</strong><small>近况 ${formDots(snapshot.form)} · ${escapeHtml(snapshot.formation)}</small></div>`;
}

function lineupColumn(club,lineup,label){
  return `<div class="match-preview__lineup"><div class="match-preview__lineup-title"><span>${escapeHtml(label)}</span><strong>${escapeHtml(club.formation)}</strong></div><ol>${lineup.map(player=>`<li class="${player.isPlayer?'is-player':''}"><span>${escapeHtml(player.position)}</span><strong>${escapeHtml(player.name)}</strong><b>${player.ovr}</b></li>`).join('')}</ol></div>`;
}

function resolveClub(value,clubs){
  const club=clubs.find(item=>item.id===value)||resolveClubAlias(value,clubs);
  return club||{id:String(value||'opponent'),name:String(value||'对手'),cn:String(value||'对手'),formation:'4-3-3',isFallback:true};
}

function clubSnapshot(club,state,key){
  const leagueClubs=clubsForLeague(club,state);
  const rank=club.isFallback?'—':Math.max(1,leagueClubs.findIndex(item=>item.id===club.id)+1);
  const seed=hash(`${club.id}|${state.season.year}|${state.season.week}|${key}`);
  const rating=value(club.attack??club.rep??club.reputation,58);
  const defense=value(club.defense??club.rep??club.reputation,58);
  return {...club,rank,formation:club.formation||'4-3-3',strength:Math.round((rating+defense+value(club.rep??club.reputation,58))/3),form:formFromSeed(seed)};
}

function clubsForLeague(club,state){
  const clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS;
  const candidates=clubs.filter(item=>(item.leagueId&&item.leagueId===club.leagueId)||(!club.leagueId&&(item.leagueCn||item.league)===(club.leagueCn||club.league)));
  return (candidates.length?candidates:[club]).slice().sort((a,b)=>value(b.rep??b.reputation,58)-value(a.rep??a.reputation,58));
}

function expectedLineup(club,state,{includePlayer=false}={}){
  const slots=['GK','LB','CB','CB','RB','CM','CM','LW','CAM','RW','ST'];
  const source=club.id===state.player.clubId&&Array.isArray(state.player.squad)?state.player.squad:dataRepository.rosterForClub?.(club.id,{limit:32,seed:state.player.name||'career'})||[];
  const pool=source.map((player,index)=>({id:player.id||`${club.id}-${index}`,name:player.cn||player.name||`球员 ${index+1}`,position:player.position||slots[index%slots.length],ovr:Math.round(value(player.ovr,Math.max(50,value(club.rep??club.reputation,58)-8)))}));
  if(includePlayer)pool.unshift({id:'player',name:state.player.name,position:state.player.position,ovr:Math.round(state.player.ovr),isPlayer:true});
  return slots.map((position,index)=>{
    const picked=pool.find(player=>player.position===position&&!player.used)||pool.find(player=>!player.used);
    if(picked){picked.used=true;return {...picked,position};}
    return {id:`${club.id}-${position}-${index}`,name:`${position} 球员`,position,ovr:Math.max(50,value(club.rep??club.reputation,58)-8)};
  });
}

function matchPlayerStatus(player,current){
  if(player.fitness<55)return{label:'体能受限',copy:'教练会根据你的恢复情况决定出场时间。',starts:false};
  if(player.ovr>=Math.max(62,current.strength-7))return{label:'预计首发',copy:'赛前状态符合首发要求，关键镜头将围绕你展开。',starts:true};
  return{label:'替补待命',copy:'先从替补席观察比赛，表现机会随时会出现。',starts:false};
}

function formFromSeed(seed){
  const results=['胜','平','负'];
  return Array.from({length:5},(_,index)=>results[(seed>>>((index%4)*3)+index)%results.length]);
}

function formDots(form){return form.map(item=>`<i class="is-${item}">${item}</i>`).join('');}
function clubName(club){return club?.cn||club?.name||club?.nameZh||'未知俱乐部';}
function value(input,fallback){const number=Number(input);return Number.isFinite(number)?number:fallback;}
function hash(input){let result=2166136261;for(const char of String(input))result=Math.imul(result^char.codePointAt(0),16777619);return result>>>0;}
function escapeHtml(input){return String(input??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
