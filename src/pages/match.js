import { icon } from '../components/icons.js';
import { metric, statGrid, emptyState } from '../components/ui.js';
import { MATCH_INTERACTIONS } from '../core/matchInteractions.js';

const TACTICS=[
  {id:'balanced',name:'平衡执行',icon:'formation',copy:'保持位置纪律，在安全区域寻找向前机会。',mods:{rating:.2,assist:.06,goal:.04,fatigue:5}},
  {id:'aggressive',name:'主动压迫',icon:'tactics',copy:'提高前场夺回球权概率，但体能消耗更高。',mods:{rating:.35,assist:.08,goal:.08,fatigue:10}},
  {id:'creative',name:'自由组织',icon:'passing',copy:'承担更多传球风险，争取创造关键机会。',mods:{rating:.28,assist:.14,goal:.03,fatigue:7}}
];

export function matchPage(app,state){
  const match=state.schedule.find(m=>m.status==='upcoming'&&m.date>=state.simulation.date);
  const last=state.career.history.filter(x=>x.type==='比赛').at(-1);
  const root=document.createElement('section');root.className='page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">比赛中心</h1><p class="page-subtitle">战术与关键镜头由你的操作决定</p></div>${match?`<span class="badge blue">${match.date}</span>`:''}</div>
  ${match?`<section class="surface-card"><div class="card-row"><div><div class="card-kicker">${icon('match','sm')} ${match.competition}</div><h2 class="card-title">${state.player.club} vs ${match.opponent}</h2><p class="card-copy">${match.venue} · ${match.date}<br>选择一个关键镜头，属性与操作共同决定结果。</p></div><div class="avatar">VS</div></div>${metric('赛前体能',state.player.fitness,{tone:'green'})}${metric('士气',state.player.morale)}<div class="tag-row"><span class="badge green">比赛角色：${state.player.ovr>64?'首发竞争':'替补待命'}</span><span class="badge orange">压力 ${Math.max(20,70-state.player.morale)}%</span></div></section><div style="height:14px"></div><div class="grid-3">${TACTICS.map(t=>`<button class="surface-card interactive" data-tactic="${t.id}"><div class="icon-tile">${icon(t.icon)}</div><h3 class="card-title">${t.name}</h3><p class="card-copy">${t.copy}</p></button>`).join('')}</div><div style="height:14px"></div><section class="surface-card"><div class="card-kicker">${icon('ball','sm')} 关键镜头</div><div class="match-interactions">${MATCH_INTERACTIONS.map((item,index)=>`<button class="choice-card match-interaction ${index===0?'active':''}" data-match-interaction="${item.id}">${icon(item.icon)}<strong>${item.name}</strong><small>${item.copy}</small></button>`).join('')}</div></section><div style="height:14px"></div><button class="app-button primary" style="width:100%" data-play>${icon('play','sm')}进入比赛并处理关键镜头</button>`:emptyState('暂无即将进行的比赛','推进日期或查看完整赛程。','calendar')}
  ${last?`<div style="height:18px"></div><section class="surface-card"><div class="card-kicker">最近一场</div><h2 class="card-title">${last.summary}</h2>${statGrid([['评分',last.rating],['进球',last.goals],['助攻',last.assists],['出场',`${last.minutes}′`]])}<button class="app-button ghost" style="margin-top:14px" data-last>查看比赛时间线</button></section>`:''}`;
  let tactic='balanced';
  let interaction='shooting';
  root.querySelectorAll('[data-tactic]').forEach(el=>el.onclick=()=>{tactic=el.dataset.tactic;root.querySelectorAll('[data-tactic]').forEach(x=>x.classList.toggle('glow',x===el));app.feedback.emit('tacticalRoute',TACTICS.find(t=>t.id===tactic).name);});
  root.querySelectorAll('[data-match-interaction]').forEach(el=>el.onclick=()=>{interaction=el.dataset.matchInteraction;root.querySelectorAll('[data-match-interaction]').forEach(x=>x.classList.toggle('active',x===el));app.feedback.emit('matchInteraction',MATCH_INTERACTIONS.find(item=>item.id===interaction).name);});
  root.querySelector('[data-play]')?.addEventListener('click',()=>app.playMatch(match,TACTICS.find(t=>t.id===tactic),interaction));
  root.querySelector('[data-last]')?.addEventListener('click',()=>app.openLastMatch());
  return root;
}
