import { icon } from '../components/icons.js';
import { metric, statGrid } from '../components/ui.js';

export function careerPage(app,state){
  const p=state.player, next=state.schedule.find(m=>m.status==='upcoming'&&m.date>=state.simulation.date);
  const injury=state.injuries.find(i=>!['recovered','archived'].includes(i.status));
  const pending=state.events.pending[0];
  const needsTraining=state.training.completedWeek!==state.season.week;
  const urgent = injury ? {icon:'medical',tone:'critical',title:'医疗路线待确认',copy:`${injury.type} · 预计剩余 ${Math.ceil(injury.remainingDays)} 天`,action:'medical',label:'立即处理'}
    : pending ? {icon:'message',tone:'',title:pending.title,copy:`${pending.location} · ${pending.participants.join('、')}`,action:'event',label:'处理事件'}
    : needsTraining ? {icon:'training',tone:'',title:'本周训练尚未安排',copy:trainingSuggestion(p,injury),action:'training',label:'安排训练'}
    : next ? {icon:'match',tone:'',title:'下一场比赛准备',copy:`${next.date} · ${next.venue} 对阵 ${next.opponent}`,action:'match',label:'查看准备'} : null;
  const root=document.createElement('section'); root.className='page';
  root.innerHTML=`
    <div class="page-head"><div><h1 class="page-title">生涯控制台</h1><p class="page-subtitle">${state.simulation.date} · ${state.season.year} 第${Math.max(1,state.season.week)}周</p></div><span class="badge ${state.simulation.paused?'orange':'green'}">${state.simulation.paused?'已暂停':'推进中'}</span></div>
    ${urgent?`<button class="surface-card notice-card ${urgent.tone}" data-action="${urgent.action}"><div class="card-row"><div class="card-row" style="justify-content:flex-start"><div class="notice-icon">${icon(urgent.icon)}</div><div><div class="card-kicker">现在需要处理</div><h2 class="card-title">${urgent.title}</h2><p class="card-copy">${urgent.copy}</p></div></div><span class="app-button secondary">${urgent.label}</span></div></button><div style="height:14px"></div>`:''}
    <div class="hero-grid">
      <button class="surface-card player-hero interactive" data-action="player-detail"><div class="card-row"><div><div class="ovr">${p.ovr}</div><div class="ovr-caption">OVR · 潜力 ${Math.round(p.potential)}</div></div><div class="avatar">${p.number}</div></div><div class="hero-name">${p.name}</div><p class="card-copy">${p.club} · ${p.team}<br>${p.position} · ${p.age}岁 · €${Math.round(state.career.marketValue/1000)}K</p><div class="tag-row"><span class="badge green">${injury?'恢复中':'健康'}</span><span class="badge blue">${p.status||'首发竞争'}</span></div></button>
      <button class="surface-card interactive" data-action="career-data"><div class="card-row"><div><div class="card-kicker">${icon('calendar','sm')} 职业控制台</div><h2 class="card-title">赛季进度 ${state.season.progress}%</h2></div><span class="badge blue">第${Math.max(1,state.season.week)}周</span></div>${statGrid([['出场',state.season.appearances],['进球',state.season.goals],['助攻',state.season.assists],['评分',state.season.rating||'—']])}${metric('体能',p.fitness,{tone:'green'})}${metric('士气',p.morale)}${metric('教练信任',p.coachTrust,{tone:'orange'})}<div class="card-footer"><span class="card-copy">${next?`${next.competition} · ${next.opponent}`:'暂无赛程'}</span>${icon('chevron','sm card-arrow')}</div></button>
    </div>
    <div style="height:14px"></div>
    <div class="grid-2">
      ${compactCard('todo','赛季目标',state.season.objectives.length?`${state.season.objectives.length}项进行中`:'尚未选择阶段重点','goals',state.season.objectives.length?'green':'orange')}
      ${compactCard('analytics','数据与设施','分析、医疗、更衣室、荣誉室','facilities','blue')}
      ${compactCard('growth','成长趋势',`${recentGrowth(state)} · OVR ${p.ovr}`,'growth','purple')}
      ${compactCard('training','本周训练',needsTraining?trainingSuggestion(p,injury):'本周方案已完成','training',needsTraining?'orange':'green')}
      ${compactCard('message','待处理事件',pending?pending.title:'当前没有未处理事件','events',pending?'red':'green')}
      ${compactCard('fast','推进控制',state.simulation.paused?'已暂停，可继续推进':`当前 ${state.settings.mode} 模式`,'simulation','blue')}
    </div>`;
  root.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;handle(el.dataset.action,app,state);});
  return root;
}

function compactCard(iconName,title,copy,action,tone){return `<button class="surface-card interactive" data-action="${action}"><div class="card-row"><div class="icon-tile">${icon(iconName)}</div><span class="badge ${tone}">${title==='待处理事件'?'待办':'详情'}</span></div><h3 class="card-title">${title}</h3><p class="card-copy">${copy}</p><div class="card-footer"><span class="card-copy">点击查看</span>${icon('chevron','sm card-arrow')}</div></button>`;}
function trainingSuggestion(p,injury){if(injury)return '伤病恢复中，建议康复训练';if(p.fitness<60)return '体能偏低，建议恢复与耐力';const entries=Object.entries(p.stats).sort((a,b)=>a[1]-b[1]);return `${cn(entries[0][0])}低于同位置平均，建议专项强化`;}
function recentGrowth(state){const last=state.career.growthLog.at(-1);if(!last)return '等待首次训练结算';const entries=Object.entries(last.changes||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);return entries.length?`${cn(entries[0][0])} +${entries[0][1].toFixed(2)}`:'近期保持稳定';}
function cn(k){return {speed:'速度',shooting:'射门',passing:'传球',dribbling:'盘带',defending:'防守',physical:'身体'}[k]||k;}
function handle(action,app,state){
  if(action==='player-detail')return app.openPlayerDetail();
  if(action==='career-data')return app.openCareerData();
  if(action==='medical')return app.openMedical();
  if(action==='event'){const evt=state.events.pending[0];return evt?app.openEvent(evt):app.feedback.emit('empty','当前没有待处理事件');}
  if(action==='training'||action==='match')return app.navigate(action);
  if(action==='events')return app.openEventCenter();
  if(action==='simulation')return app.openSimulation();
  if(action==='goals')return app.openGoals();
  if(action==='facilities')return app.openFacilities();
  if(action==='growth')return app.openGrowth();
}
