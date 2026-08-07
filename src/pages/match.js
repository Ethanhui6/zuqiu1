import { icon } from '../components/icons.js';
import { metric, statGrid, emptyState } from '../components/ui.js';

export function matchPage(app,state){
  const match=state.schedule.find(m=>m.status==='upcoming'&&m.date>=state.simulation.date);
  const last=state.career.history.filter(x=>x.type==='比赛').at(-1);
  const root=document.createElement('section');root.className='page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">比赛中心</h1><p class="page-subtitle">战术与关键镜头由你的操作决定</p></div>${match?`<span class="badge blue">${match.date}</span>`:''}</div>
  ${match?`<section class="surface-card match-brief"><div class="card-row"><div><div class="card-kicker">${icon('match','sm')} ${match.competition}</div><h2 class="card-title">${state.player.club} vs ${match.opponent}</h2><p class="card-copy">${match.venue} · ${match.date}<br>进入比赛模式，实时处理本场出现的关键镜头。</p></div><div class="avatar">VS</div></div><div class="match-brief-stats">${metric('赛前体能',state.player.fitness,{tone:'green'})}${metric('士气',state.player.morale)}${metric('比赛压力',Math.max(20,70-state.player.morale),{tone:'orange'})}</div><div class="tag-row"><span class="badge green">比赛角色：${state.player.ovr>64?'首发竞争':'替补待命'}</span><span class="badge blue">${state.player.position}</span></div></section><div style="height:14px"></div><button class="app-button primary match-enter-button" style="width:100%" data-play>${icon('play','sm')}进入比赛</button>`:emptyState('暂无即将进行的比赛','推进日期或查看完整赛程。','calendar')}
  ${last?`<div style="height:18px"></div><section class="surface-card"><div class="card-kicker">最近一场</div><h2 class="card-title">${last.summary}</h2>${statGrid([['评分',last.rating],['进球',last.goals],['助攻',last.assists],['出场',`${last.minutes}′`]])}<button class="app-button ghost" style="margin-top:14px" data-last>查看比赛时间线</button></section>`:''}`;
  root.querySelector('[data-play]')?.addEventListener('click',()=>app.openMatchStrategy(match));
  root.querySelector('[data-last]')?.addEventListener('click',()=>app.openLastMatch());
  return root;
}
