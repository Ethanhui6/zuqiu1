import { icon } from '../components/icons.js';
import { metric, statGrid } from '../components/ui.js';
import { crestSvg } from '../components/clubCrest.js';
import { ensureHonors } from '../systems/honors/honorsSystem.js';
import { homeNews } from '../core/newsEngine.js';
import { buildSeasonTrack } from '../core/seasonTrack.js';

export function careerPage(app, state) {
  const player = state.player;
  const retirement = state.career?.honors?.retirement;
  const next = state.schedule.find(match => match.status === 'upcoming' && match.date >= state.simulation.date);
  const injury = state.injuries.find(item => !['recovered', 'archived'].includes(item.status));
  const pending = state.events.pending[0];
  const opportunity = state.training.currentOpportunity;
  const nextNode = app.simulation.nextNode(state);
  const healthLabel = injury ? '恢复中' : '健康';
  const roleStatus = player.status && player.status !== healthLabel ? player.status : '';
  const urgent = injury ? { icon: 'medical', tone: 'critical', title: '医疗路线待确认', copy: `${injury.type} · 预计剩余 ${Math.ceil(injury.remainingDays)} 天`, action: 'medical', label: '立即处理' }
    : pending ? { icon: 'message', title: pending.title, copy: `${pending.location || '职业现场'} · ${eventRarityLabel(pending.rarity)} · ${(pending.choices || []).length} 个选项`, action: 'event', label: '处理事件' }
    : opportunity ? { icon: 'training', title: '关键训练机会已到达', copy: `${opportunity.position} · ${opportunity.choices.length} 个方案可选`, action: 'training', label: '选择方案' }
    : next ? { icon: 'match', title: '下一场比赛准备', copy: `${next.date} · ${next.venue} 对阵 ${next.opponent}`, action: 'match', label: '查看准备' } : null;
  const lastGrowth = state.training.lastResult?.changes || state.career.growthLog.at(-1)?.changes || {};
  const news = homeNews(state);
  const root = document.createElement('section');
  root.className = 'page career-page';
  root.innerHTML = `<div class="page-head"><div><h1 class="page-title">生涯</h1><p class="page-subtitle">${state.simulation.date} · ${state.season.year} 第${Math.max(1, state.season.week)}周</p></div><span class="badge ${state.simulation.paused ? 'orange' : 'green'}">${state.simulation.paused ? '已暂停' : '推进中'}</span></div>
    ${urgent ? `<button class="surface-card notice-card ${urgent.tone || ''}" data-action="${urgent.action}"><div class="card-row"><div class="card-row" style="justify-content:flex-start"><div class="notice-icon">${icon(urgent.icon)}</div><div><div class="card-kicker">现在需要处理</div><h2 class="card-title">${urgent.title}</h2><p class="card-copy">${urgent.copy}</p></div></div><span class="app-button secondary">${urgent.label}</span></div></button><div style="height:14px"></div>` : ''}
    <div class="hero-grid"><button class="surface-card player-hero interactive" data-action="player-detail"><div class="card-row"><div><div class="ovr">${player.ovr}</div><div class="ovr-caption">OVR · 潜力 ${Math.round(player.potential)}</div></div><div class="avatar">${player.number}</div></div><div class="hero-name">${player.name}</div><p class="card-copy">${player.club} · ${player.team}<br>${player.position} · ${player.age}岁 · €${Math.round(state.career.marketValue / 1000)}K</p><div class="tag-row"><span class="badge ${injury ? 'orange' : 'green'}">${healthLabel}</span>${roleStatus ? `<span class="badge blue">${roleStatus}</span>` : ''}</div></button>
      <section class="surface-card career-season-card"><button class="career-season-card__summary" data-action="career-data"><span><span class="card-kicker">${icon('calendar', 'sm')} 赛季轨道</span><strong>赛季数据与轨道</strong></span><span class="badge blue">${state.season.progress}%</span></button>${seasonTrackMarkup(state)}${statGrid([['出场', state.season.appearances], ['进球', state.season.goals], ['助攻', state.season.assists], ['评分', state.season.rating || '—']])}${metric('体能', player.fitness, { tone: 'green' })}${metric('士气', player.morale)}${metric('教练信任', player.coachTrust, { tone: 'orange' })}${seasonTargetsMarkup(state)}<div class="card-footer"><span class="card-copy">${next ? `${next.competition} · ${next.opponent}` : '暂无近期比赛'}</span>${icon('chevron', 'sm card-arrow')}</div></section></div>
    ${newsBroadcast(news)}${growthHighlight(lastGrowth, state)}${seasonHistory(state)}
    <section class="career-next-node"><div><span>下一关键节点</span><strong>${nextNode.label}</strong><small>${nextNode.target ? `${nextNode.target} · ` : ''}${nextNode.blocked ? '需要先完成当前待办' : '空白日期会自动结算'}</small></div><span class="badge ${nextNode.blocked ? 'orange' : 'blue'}">${nextNode.blocked ? '待处理' : modeLabel(state.settings.mode)}</span></section>
    <div style="height:14px"></div><div class="grid-2">${compactCard('todo', '赛季目标', state.season.objectives.length ? `${state.season.objectives.length}项进行中` : '尚未选择阶段重点', 'goals', state.season.objectives.length ? 'green' : 'orange')}${compactCard('analytics', '数据与设施', '分析、医疗、更衣室、荣誉室', 'facilities', 'blue')}${compactCard('growth', '成长趋势', `${recentGrowth(state)} · OVR ${player.ovr}`, 'growth', 'purple')}${compactCard('training', '训练机会', opportunity ? `${opportunity.choices.length} 个方案待选择` : '普通周自动模拟', 'training', opportunity ? 'orange' : 'green')}${compactCard('message', '待处理事件', pending ? pending.title : '当前没有未处理事件', 'events', pending ? 'red' : 'green')}</div>
    ${primaryAction(nextNode, state)}`;
  if (retirement) {
    const status = root.querySelector('.page-head > .badge');
    status.className = 'badge gold';
    status.textContent = '已退役';
    const nodeStatus = root.querySelector('.career-next-node > .badge');
    if (nodeStatus) { nodeStatus.className = 'badge gold'; nodeStatus.textContent = '已完成'; }
    const nodeCopy = root.querySelector('.career-next-node small');
    if (nodeCopy) nodeCopy.textContent = '完整履历已归档，可随时查看';
  }
  root.querySelectorAll('[data-action]').forEach(control => control.addEventListener('click', () => handle(control.dataset.action, app, state)));
  root.addEventListener('click', event => { const trackNode = event.target.closest('[data-season-node]'); if (trackNode && trackNode.dataset.status !== 'upcoming') app.openCareerData(); });
  if (state.career?.offSeason?.status === 'active') {
    const button = document.createElement('button');
    button.className = 'app-button primary';
    button.textContent = '安排休赛期';
    button.onclick = () => app.openOffSeason();
    root.prepend(button);
  }
  return root;
}

function seasonTrackMarkup(state) {
  const track=buildSeasonTrack(state),current=track.currentNode,next=track.nextNode;
  return `<section class="season-track" data-season-track data-progress="${track.progress}" aria-label="${safe(track.season)}赛季进度"><div class="season-track__meta"><span><b>${safe(current?.label||'赛季总结')}</b><small>${safe(track.currentDate)} · ${track.progress}%</small></span><span><small>下一节点</small><strong>${safe(next?.label||'休赛期')}</strong></span></div><div class="season-track__rail" role="list">${track.nodes.map(node=>`<button type="button" class="season-track__node is-${node.id} is-${node.status||'upcoming'}" data-season-node="${node.id}" data-status="${node.status||'upcoming'}" ${node.status==='upcoming'?'disabled':''} aria-label="${safe(node.label)} · ${node.status==='complete'?'已完成':node.status==='current'?'当前节点':'未解锁'}"><i></i><span>${safe(node.label)}</span></button>`).join('')}</div><div class="season-track__footer"><span>${track.nextFixture?`当前赛事：${safe(track.nextFixture.competition)} · ${safe(track.nextFixture.opponent)}`:'当前没有待排比赛'}</span><span>${track.reminders.transferWindow?'转会窗提醒':track.reminders.contractMonths<=6?'合同剩余提醒':'日期与赛程同步'}</span></div></section>`;
}

function seasonTargetsMarkup(state) {
  const objectives = Array.isArray(state.season.objectives) ? state.season.objectives : [];
  const earned = [...(state.season.trophies || []), ...(state.season.personalAwards || [])];
  const rows = objectives.slice(0, 4).map(item => `<div class="career-season-target"><span><b>${safe(item.name)}</b><small>${item.group === 'team' ? '球队奖杯' : item.group === 'personal' ? '个人荣誉' : '成就目标'}</small></span><strong>${Number(item.current || 0)}/${Number(item.target || 1)} · ${Number(item.progress || 0)}%</strong></div>`).join('');
  return `<div class="career-season-targets" data-season-targets><div class="career-season-targets__head"><span class="card-kicker">${icon('trophy', 'sm')} 本赛季荣誉与目标</span><span class="badge ${earned.length ? 'gold' : 'blue'}">${earned.length ? `已获得 ${earned.length} 项` : '待赛季结算'}</span></div>${earned.length ? `<div class="tag-row">${earned.slice(0, 3).map(item => `<span class="badge gold">${safe(item.name || item)}</span>`).join('')}</div>` : ''}${rows || '<p class="card-copy">推进赛季后会生成球队奖杯、个人荣誉和成就目标。</p>'}</div>`;
}

function newsBroadcast(items) {
  return `<section class="news-broadcast"><div class="section-heading"><div><div class="card-kicker">${icon('message', 'sm')} 今日动态</div><h2 class="card-title">生涯新闻播报</h2></div><button class="icon-button" data-action="news" aria-label="打开新闻中心">${icon('chevron')}</button></div>${items.length ? `<div class="news-broadcast-list">${items.map(item => `<article class="news-broadcast-item"><span class="badge ${item.type === '比赛' ? 'blue' : item.type === '训练' ? 'green' : 'purple'}">${item.type}</span><div><strong>${item.title}</strong><p>${item.copy}</p><time>${item.date}</time></div></article>`).join('')}</div>` : '<p class="card-copy">推进后，球队、比赛和市场动态会出现在这里。</p>'}</section>`;
}

function growthHighlight(changes, state) {
  const entries = Object.entries(changes).filter(([, value]) => Number(value) > 0).slice(0, 3);
  return `<section class="surface-card growth-highlight"><div class="card-row"><div><div class="card-kicker">${icon('growth', 'sm')} 最近一次成长</div><h2 class="card-title">${entries.length ? entries.map(([key, value]) => `${cn(key)} +${Number(value).toFixed(2)}`).join(' · ') : '等待下一次关键反馈'}</h2></div><span class="badge purple">OVR ${state.player.ovr}</span></div><p class="card-copy">${state.training.lastResult?.detail || '完成关键训练或比赛后，成长与教练评价会在这里高亮。'}</p></section>`;
}

export function seasonHistory(state) {
  const nodes=buildCareerTimeline(state),seasonCount=nodes.filter(node=>node.type==='season').length;
  if(!seasonCount)return'';
  return `<section class="career-timeline"><div class="section-heading"><div><div class="card-kicker">${icon('calendar','sm')} 永久职业履历</div><h2 class="card-title">职业生涯时间轴</h2></div><span class="badge gold">${seasonCount} 个赛季</span></div><div class="career-timeline__rail">${nodes.map(timelineNode).join('')}</div></section>`;
}

export function buildCareerTimeline(state){
  const honors=ensureHonors(state),rows=[...(honors.seasons||[])].sort((a,b)=>seasonStart(a.year)-seasonStart(b.year)||String(a.id).localeCompare(String(b.id))),nodes=[],seen=new Set(),history=state.career?.history||[];
  let debuted=false,scored=false;
  const add=node=>{if(!node?.id||seen.has(node.id))return;seen.add(node.id);nodes.push(node)};
  for(const row of rows){
    const seasonKey=row.id||`${row.year}:${row.clubId||row.club}`,seasonHistory=history.filter(item=>historySeason(item)===seasonStart(row.year));
    add({id:`season:${seasonKey}`,type:'season',season:row.year,row});
    if(!debuted&&Number(row.appearances)>0){add(milestone(seasonKey,row,'debut','职业首秀',`在${row.club}完成职业比赛首次出场。`));debuted=true}
    if(!scored&&Number(row.goals)>0){add(milestone(seasonKey,row,'first-goal','职业生涯首球',`在${row.year}赛季攻入职业生涯首球。`));scored=true}
    const transferClub=row.transfer?.club||row.transfer?.clubName||row.transfer?.name;if(transferClub)add(milestone(seasonKey,row,'transfer',`转会至 ${transferClub}`,'职业道路进入新的俱乐部阶段。'));
    for(const injury of row.injuries||[]){const title=typeof injury==='string'?injury:injury.name||injury.type||'赛季伤病';add(milestone(seasonKey,row,'injury',title,'伤病影响了本赛季的出场与成长。'))}
    for(const name of row.trophies||[])add(milestone(seasonKey,row,'trophy',name,'随队获得团队荣誉。'));
    for(const name of row.personalAwards||[])add(milestone(seasonKey,row,milestoneType(name)||'trophy',name,'个人表现获得正式认可。'));
    if(/队长/.test(String(row.teamRole||'')))add(milestone(seasonKey,row,'captain','成为球队队长','承担更高的场上责任与更衣室责任。'));
    for(const text of row.highlights||[]){const type=milestoneType(text)||'highlight';add(milestone(seasonKey,row,type,text,'赛季重大节点。'))}
    for(const item of seasonHistory){if(item.type==='awards')continue;const type=milestoneType(`${item.type||''} ${item.title||''} ${item.text||item.summary||''}`);if(type)add(milestone(seasonKey,row,type,item.title||item.text||item.summary||'职业节点',item.text||item.summary||'职业生涯记录。'))}
  }
  if(honors.retirement){const last=rows.at(-1),key=last?.id||'career';add({id:`retirement:${honors.retirement.date||honors.retirement.age||key}`,type:'retirement',season:last?.year||null,title:'正式退役',copy:honors.retirement.summary||'职业生涯正式结束。',date:honors.retirement.date||null})}
  return nodes;
}

function seasonStart(value){return Number(String(value||'').slice(0,4))||0}
function historySeason(item){if(item?.date){const date=new Date(`${item.date}T00:00:00Z`);return date.getUTCFullYear()-(date.getUTCMonth()<6?1:0)}const year=Number(item?.year);return year>=1900?year:seasonStart(item?.season)}
function milestoneType(value){const text=String(value||'');if(/退役/.test(text))return'retirement';if(/金球|Ballon|世界年度最佳/.test(text))return'ballon-dor';if(/金童|Young Player|年轻球员/.test(text))return'golden-boy';if(/国家队|national/i.test(text))return'national';if(/伤愈|复出|recovery/i.test(text))return'comeback';if(/伤病|受伤|拉伤|扭伤|injury/i.test(text))return'injury';if(/转会|租借|transfer|loan/i.test(text))return'transfer';if(/队长|captain/i.test(text))return'captain';if(/首球|首次进球/.test(text))return'first-goal';if(/首秀|首次出场/.test(text))return'debut';if(/冠军|奖杯|Cup|Champion|Golden Boot|Player of the Year/i.test(text))return'trophy';return null}
function milestone(seasonKey,row,type,title,copy){const normalized=String(title).replace(/^(赢得|获得)\s*/,'').toLocaleLowerCase().replace(/\s+/g,'-');return{id:`milestone:${seasonKey}:${type}:${normalized}`,type,season:row.year,title,copy,row}}
function timelineNode(node){
  if(node.type==='season'){
    const row=node.row,honors=[...(row.trophies||[]),...(row.personalAwards||[])];
    return `<article class="career-timeline-node career-timeline-node--season" data-timeline-id="${safe(node.id)}" data-timeline-type="season" data-season="${safe(row.year)}"><span class="career-timeline-marker season-crest">${crestSvg({id:row.clubId||row.club,name:row.club,crestPath:row.crestPath},{size:44})}</span><div class="career-timeline-content"><div class="career-timeline-title"><div><small>${safe(row.year)} · ${Number(row.age)||'—'}岁 · ${safe(row.position||'未知位置')}</small><strong>${safe(row.club)}</strong></div><span class="badge blue">OVR ${row.startOvr??'—'} → ${row.endOvr??'—'}</span></div><div class="career-timeline-stats">${[['出场',row.appearances],['进球',row.goals],['助攻',row.assists],['评分',formatRating(row.rating)],['荣誉',honors.length]].map(([label,value])=>`<span><b>${safe(value??0)}</b><small>${label}</small></span>`).join('')}</div>${honors.length?`<div class="tag-row">${honors.map(name=>`<span class="badge gold">${safe(name)}</span>`).join('')}</div>`:''}</div></article>`;
  }
  const labels={debut:'首秀','first-goal':'首球',transfer:'转会',national:'国家队',injury:'伤病',comeback:'复出',trophy:'冠军与荣誉','golden-boy':'金童','ballon-dor':'金球',captain:'队长',retirement:'退役',highlight:'重大节点'};
  const icons={debut:'play','first-goal':'match',transfer:'transfer',national:'club',injury:'medical',comeback:'recovery',trophy:'trophy','golden-boy':'trophy','ballon-dor':'trophy',captain:'teammate',retirement:'trophy',highlight:'record'};
  return `<article class="career-timeline-node career-timeline-node--milestone is-${node.type}" data-timeline-id="${safe(node.id)}" data-timeline-type="${node.type}" data-season="${safe(node.season||'')}"><span class="career-timeline-marker">${icon(icons[node.type]||'calendar','sm')}</span><div class="career-timeline-content"><small>${safe(node.season||node.date||'职业节点')} · ${labels[node.type]||'重大节点'}</small><strong>${safe(node.title)}</strong><p>${safe(node.copy)}</p></div></article>`;
}
function safe(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function formatRating(value){const number=Number(value);return Number.isFinite(number)&&number>0?number.toFixed(2):'—'}

function compactCard(iconName, title, copy, action, tone) { return `<button class="surface-card interactive" data-action="${action}"><div class="card-row"><div class="icon-tile">${icon(iconName)}</div><span class="badge ${tone}">${title === '待处理事件' ? '待办' : '详情'}</span></div><h3 class="card-title">${title}</h3><p class="card-copy">${copy}</p><div class="card-footer"><span class="card-copy">点击查看</span>${icon('chevron', 'sm card-arrow')}</div></button>`; }
function primaryAction(node, state) { const action = node.type === 'retirement' ? 'career-hub' : node.type === 'event' ? 'event' : node.type === 'training' ? 'training' : node.type === 'off-season' ? 'off-season' : node.type === 'match' && node.target <= state.simulation.date ? 'match' : 'simulation'; const label = action === 'career-hub' ? '查看生涯档案' : action === 'event' ? '处理事件' : action === 'training' ? '参加训练' : action === 'off-season' ? '规划下一赛季' : action === 'match' ? '进入比赛' : node.type === 'season' ? '进入赛季总结' : '推进到下一关键节点'; const context = node.label || '下一关键节点'; return `<div class="page-fixed-action career-fixed-action"><span><small>当前节点</small><strong>${context}</strong></span><button class="app-button primary" data-action="${action}">${icon(action === 'simulation' ? 'fast' : action === 'event' ? 'message' : action === 'training' ? 'training' : action === 'career-hub' ? 'record' : 'play', 'sm')}${label}</button></div>`; }
function recentGrowth(state) { const last = state.career.growthLog.at(-1); if (!last) return '等待首次关键反馈'; const entries = Object.entries(last.changes || {}).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]); return entries.length ? `${cn(entries[0][0])} +${entries[0][1].toFixed(2)}` : '近期保持稳定'; }
function cn(key) { return { speed: '速度', shooting: '射门', passing: '传球', dribbling: '盘带', defending: '防守', physical: '身体' }[key] || key; }
function modeLabel(value) { return { immersive: '沉浸', standard: '标准', fast: '极速', legend: '极速' }[value] || '标准'; }
function eventRarityLabel(value) { return { common: '普通', rare: '稀有', hidden: '隐藏', crisis: '危机', opportunity: '机会', legendary: '传奇' }[value] || '普通'; }
function trainingSuggestion(player, injury) { if (injury) return '伤病恢复中，等待下一次康复安排'; if (player.fitness < 60) return '体能偏低，后台自动降低负荷'; const entries = Object.entries(player.stats).sort((a, b) => a[1] - b[1]); return `${cn(entries[0][0])}短板会影响下一次训练机会`; }
function handle(action, app, state) { if (action === 'player-detail') return app.openPlayerDetail(); if (action === 'career-data') return app.openCareerData(); if (action === 'career-hub') return app.openCareerHub(); if (action === 'medical') return app.openMedical(); if (action === 'event') { const event = state.events.pending[0]; return event ? app.openEvent(event) : app.feedback.emit('empty', '当前没有待处理事件'); } if (action === 'training') return app.navigate('training'); if (action === 'off-season') return app.openOffSeason(); if (action === 'events') return app.openEventCenter(); if (action === 'news') return app.openNewsCenter(); if (action === 'simulation') return app.openSimulation(); if (action === 'goals') return app.openGoals(); if (action === 'facilities') return app.openFacilities(); if (action === 'growth') return app.openGrowth(); if (action === 'match') return app.navigate('match'); }
