import { icon } from '../components/icons.js';
import { radarChart } from '../components/radar.js';
import { dataRepository } from '../services/dataRepository.js';
import { computeOverall } from '../core/playerDevelopmentEngine.js';
import { generatePlayerName, generateStartingClubOffers, validatePlayerName } from '../services/playerIdentity.js';

const positions = [
  { id: 'ST', name: '中锋', group: '前锋', x: 50, y: 12, desc: '终结、跑位、争顶', focus: '射门 · 速度 · 身体' },
  { id: 'LW', name: '左边锋', group: '边锋', x: 20, y: 24, desc: '突破、内切、创造宽度', focus: '速度 · 盘带 · 射门' },
  { id: 'RW', name: '右边锋', group: '边锋', x: 80, y: 24, desc: '一对一、传中、内切', focus: '速度 · 盘带 · 传球' },
  { id: 'CAM', name: '前腰', group: '前场', x: 50, y: 31, desc: '最后一传、创造机会', focus: '传球 · 盘带 · 射门' },
  { id: 'LM', name: '左前卫', group: '中场', x: 20, y: 45, desc: '边路组织、回防、传中', focus: '传球 · 速度 · 防守' },
  { id: 'RM', name: '右前卫', group: '中场', x: 80, y: 45, desc: '边路组织、回防、协作', focus: '传球 · 速度 · 盘带' },
  { id: 'CM', name: '中前卫', group: '中场', x: 50, y: 46, desc: '控制节奏、覆盖、反抢', focus: '传球 · 盘带 · 身体' },
  { id: 'CDM', name: '后腰', group: '中场', x: 50, y: 59, desc: '拦截、卡位、防守转换', focus: '防守 · 传球 · 身体' },
  { id: 'LB', name: '左后卫', group: '后卫', x: 18, y: 72, desc: '回防、套边、对位边锋', focus: '防守 · 速度 · 传球' },
  { id: 'RB', name: '右后卫', group: '后卫', x: 82, y: 72, desc: '回防、内收、传中', focus: '防守 · 速度 · 传球' },
  { id: 'CB', name: '中后卫', group: '后卫', x: 50, y: 76, desc: '盯人、补位、后场组织', focus: '防守 · 身体 · 传球' },
  { id: 'GK', name: '门将', group: '门将', x: 50, y: 91, desc: '扑救、出击、指挥防线', focus: '扑救 · 反应 · 站位' }
];
const styles = {
  '爆发型': { speed: 68, shooting: 55, passing: 48, dribbling: 62, defending: 38, physical: 56 },
  '技术型': { speed: 58, shooting: 55, passing: 61, dribbling: 69, defending: 39, physical: 45 },
  '组织型': { speed: 50, shooting: 48, passing: 70, dribbling: 61, defending: 46, physical: 48 },
  '终结型': { speed: 61, shooting: 70, passing: 45, dribbling: 57, defending: 31, physical: 58 },
  '防守型': { speed: 53, shooting: 35, passing: 54, dribbling: 44, defending: 70, physical: 67 },
  '全能型': { speed: 57, shooting: 56, passing: 58, dribbling: 57, defending: 55, physical: 58 }
};
const countries = ['中国', '日本', '韩国', '英格兰', '西班牙', '葡萄牙', '法国', '德国', '意大利', '荷兰', '比利时', '巴西', '阿根廷', '美国', '墨西哥', '沙特阿拉伯', '土耳其', '尼日利亚', '加纳', '塞内加尔', '摩洛哥', '埃及'];
const birthplaceMap = { 中国: ['辽宁', '山东', '上海', '北京', '广东', '河南河北', '新疆', '江浙', '巴蜀'] };

export function createPlayerWizard(app) {
  let step = 0;
  let locked = false;
  const state = app.store.get();
  const draft = { name: '', shirtName: '', country: '中国', birthplace: '上海', height: 178, weight: 70, foot: '右脚', number: 18, position: 'CM', style: '技术型', previewSeed: `${state.createdAt}:identity` };
  const root = document.createElement('div');
  root.className = 'wizard-shell';
  const labels = ['身份', '位置', '风格', '球探报告', '青年队'];
  const render = () => {
    const report = scoutDraft(draft);
    const identity = generatedIdentity(draft);
    root.innerHTML = `<div class="wizard"><div class="wizard-top"><div><div class="card-kicker">绿茵浮沉 · 创建球员</div><h1 class="page-title">${labels[step]}</h1></div><span class="badge blue">${step + 1}/${labels.length}</span></div><div class="stepper">${labels.map((_, index) => `<span class="step-dot ${index <= step ? 'active' : ''}"></span>`).join('')}</div><div class="wizard-body">${body(report, identity)}</div>${step === 4 ? '<div class="card-copy wizard-hint">点击球队卡片即可签约并进入生涯</div>' : `<div class="card-row wizard-actions"><button class="app-button ghost" data-prev ${step === 0 ? 'disabled' : ''}>${icon('back', 'sm')}上一步</button><button class="app-button primary" data-next>${step === 3 ? '查看球队机会' : '继续'}${icon('chevron', 'sm')}</button></div>`}</div>`;
    bind();
  };
  const body = (report, identity) => {
    if (step === 0) return `<section class="surface-card identity-step"><div class="form-grid">${field('姓名（可留空）', 'name', draft.name, 'text', identity.displayName)}${field('球衣名（可留空）', 'shirtName', draft.shirtName, 'text', identity.displayName.slice(-8))}${selectField('国家或地区', 'country', countries, draft.country)}${selectField('出生地 / 地区', 'birthplace', birthplaces(draft.country), draft.birthplace)}${field('身高（cm）', 'height', draft.height, 'number')}${field('体重（kg）', 'weight', draft.weight, 'number')}${selectField('惯用脚', 'foot', ['右脚', '左脚', '双足'], draft.foot)}${field('球衣号码', 'number', draft.number, 'number')}</div><div class="identity-preview"><div><div class="card-kicker">${draft.name.trim() ? '手动姓名' : '国家姓名预览'}</div><strong>${escapeHtml(identity.displayName)}</strong><p class="card-copy">${draft.name.trim() ? '将使用你输入的姓名' : '按所选国家的姓名顺序与文字规则生成，进入生涯后固定保存'}</p></div>${draft.name.trim() ? '' : '<button class="app-button ghost" data-reroll>换一个名字</button>'}</div></section>`;
    if (step === 1) { const selected = positionInfo(draft.position); return `<section class="surface-card position-step position-step--wide"><div class="position-head"><div><div class="card-kicker">选择位置 · ${selected.group}</div><h2 class="card-title">${selected.name}（${selected.id}）</h2><p class="card-copy">${selected.desc} · 典型属性：${selected.focus}</p></div><span class="badge ${selected.id === 'GK' ? 'blue' : 'green'}">${selected.id === 'GK' ? '独立门将事件库' : '位置事件联动'}</span></div><div class="pitch pitch--wide ${selected.id === 'GK' ? 'pitch--keeper' : ''}">${positions.map(position => `<button class="position-node position-node--wide ${draft.position === position.id ? 'active' : ''} position-${position.group}" style="left:${position.x}%;top:${position.y}%" data-position="${position.id}" aria-label="${position.name} ${position.id}"><strong>${position.id}</strong><small>${position.name}</small></button>`).join('')}</div><div class="position-detail"><strong>${selected.name}</strong><span>${selected.desc}</span><small>${selected.id === 'GK' ? '门线、禁区和出球训练将使用门将专属内容。' : `比赛职责和事件会按${selected.name}位置筛选。`}</small></div></section>`; }
    if (step === 2) return `<section class="surface-card"><div class="choice-grid">${Object.keys(styles).map(name => `<button class="choice-card ${draft.style === name ? 'active' : ''}" data-style="${name}">${icon(name === '防守型' ? 'defending' : name === '组织型' ? 'passing' : name === '终结型' ? 'shooting' : 'growth')}<h3>${name}</h3><p>${styleCopy(name)}</p></button>`).join('')}</div></section>`;
    if (step === 3) return `<section class="surface-card"><div class="grid-2"><div class="scout-reveal"><div class="card-kicker">${icon('analytics', 'sm')} 球探可信度 ${report.confidence}%</div><div class="rarity">${report.tier}</div><p class="card-copy">${identity.displayName} · ${draft.country} · ${positionInfo(draft.position).name}</p><div class="tag-row"><span class="badge green">优势 ${cn(report.strengths[0])}</span><span class="badge green">优势 ${cn(report.strengths[1])}</span><span class="badge orange">短板 ${cn(report.weaknesses[0])}</span></div></div>${radarChart(report.stats, report.stats, report.potential, draft.position)}</div></section>`;
    const offers = academyClubs(draft, report);
    return `<section class="surface-card club-selection-step"><div class="card-row"><div><div class="card-kicker">真实球队机会 · ${draft.country}</div><h2 class="card-title">选择你的起点</h2><p class="card-copy">每张卡的青训水平、出场机会、合同和位置需求不同。</p></div><span class="badge blue">${offers.length} 个选项</span></div><div class="club-offer-grid">${offers.map(item => clubOfferCard(item)).join('')}</div></section>`;
  };
  const bind = () => {
    root.querySelectorAll('input, select').forEach(element => element.addEventListener('input', () => { draft[element.name] = element.type === 'number' ? Number(element.value) : element.value; if (element.name === 'country') { draft.birthplace = birthplaces(draft.country)[0]; render(); } }));
    root.querySelectorAll('[data-position]').forEach(element => { element.onclick = () => { draft.position = element.dataset.position; navigator.vibrate?.(16); render(); }; });
    root.querySelectorAll('[data-style]').forEach(element => { element.onclick = () => { draft.style = element.dataset.style; app.feedback.emit('select', draft.style); render(); }; });
    root.querySelector('[data-reroll]')?.addEventListener('click', () => { draft.previewSeed = `${draft.previewSeed}:reroll`; render(); });
    root.querySelectorAll('[data-club]').forEach(element => { element.onclick = () => { if (locked) return; locked = true; root.classList.add('is-signing'); root.querySelectorAll('[data-club]').forEach(card => { card.disabled = true; }); app.feedback.emit('clubSelect', element.dataset.clubName); window.setTimeout(() => startCareer(element.dataset.club), 440); }; });
    root.querySelector('[data-prev]')?.addEventListener('click', () => { if (step > 0) { step -= 1; render(); } });
    root.querySelector('[data-next]')?.addEventListener('click', () => {
      if (step === 0) { const check = validatePlayerName(draft.name); if (!check.valid) return app.feedback.emit('failure', check.error); }
      if (step < 4) { step += 1; app.feedback.emit(step === 3 ? 'scoutReport' : 'select', labels[step]); render(); }
    });
  };
  const startCareer = clubId => {
    const report = scoutDraft(draft); const identity = generatedIdentity(draft); const item = academyClubs(draft, report).find(offer => offer.clubId === clubId) || academyClubs(draft, report)[0]; const club = item.club;
    const player = { ...draft, name: identity.displayName, displayName: identity.displayName, nameParts: identity, nameSource: draft.name.trim() ? 'manual' : 'generated', shirtName: draft.shirtName.trim() || identity.familyName || identity.givenName, nation: draft.country, country: draft.country, birthplace: draft.birthplace, positionName: positionInfo(draft.position).name, birthDate: generatedBirth(`${state.createdAt}:${identity.displayName}:${draft.country}`), club: club.cn || club.name, clubId: club.id, crestPath: club.crest || null, league: club.leagueCn || club.league, team: item.squad, age: 16, stats: report.stats, potential: report.potential, ovr: computeOverall(report.stats, draft.position), fatigue: 18, morale: 72, fitness: 84, coachTrust: 52, status: '健康', previousStats: { ...report.stats }, squad: dataRepository.registry?.rosterForClub(club.id, { seed: identity.displayName }) || [] };
    app.store.set(current => { current.player = player; current.season.startOvr = player.ovr; current.season.startMarketValue = current.career.marketValue; current.transfer.club = club.id; current.transfer.country = club.country; current.transfer.league = club.leagueCn || club.league; current.career.history.push({ date: current.simulation.date, type: '签约', text: `加入${player.club}${item.reason ? `：${item.reason}` : ''}`, clubId: club.id, crestPath: player.crestPath }); current.news.items.unshift({ id: `welcome-${current.createdAt}`, date: current.simulation.date, type: '生涯', title: '青训生涯正式开始', copy: `${player.name} 以 16 岁身份加入${player.club}。`, read: false }); return current; });
    app.feedback.emit('promoted', `正式加入${player.club}`); app.mount();
  };
  render();
  return root;
}

function scoutDraft(draft) { const random = seeded(`${draft.name}-${draft.country}-${draft.position}-${draft.style}`); const base = styles[draft.style] || styles['全能型']; const stats = Object.fromEntries(Object.entries(base).map(([key, value]) => [key, Math.max(35, Math.min(78, Number((value + (random() - .5) * 8).toFixed(2))))])); const potential = Math.round(70 + random() * 24); return { stats, potential, tier: potential >= 93 ? '传奇迹象' : potential >= 89 ? '世代' : potential >= 86 ? '顶级' : potential >= 82 ? '精英' : potential >= 78 ? '优秀' : '普通', confidence: Math.round(72 + random() * 23), strengths: Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key]) => key), weaknesses: Object.entries(stats).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([key]) => key) }; }
function academyClubs(draft, report) { return generateStartingClubOffers({ ...draft, nation: draft.country, ovr: computeOverall(report.stats, draft.position), potential: report.potential }, { clubs: dataRepository.clubs || [] }, `${draft.previewSeed}:${draft.country}:${draft.position}`); }
function generatedIdentity(draft) { if (draft.name.trim()) return { displayName: draft.name.trim(), givenName: '', familyName: '' }; return generatePlayerName(draft.country, draft.previewSeed, dataRepository.nameProfiles || {}); }
function clubOfferCard(item) { const club = item.club; const crest = club.crest ? `<img class="club-offer-crest" src="${escapeHtml(club.crest)}" alt="${escapeHtml(club.cn || club.name)}队徽" loading="lazy" decoding="async">` : '<span class="club-offer-crest club-offer-crest--missing" aria-label="队徽暂未匹配">—</span>'; return `<button class="club-offer-card ${item.type === '家乡球队' ? 'club-offer-card--home' : ''}" data-club="${escapeHtml(item.clubId)}" data-club-name="${escapeHtml(club.cn || club.name)}"><span class="club-offer-top">${crest}<span class="badge ${item.type === '强队青训' ? 'purple' : 'blue'}">${escapeHtml(item.type)}</span></span><strong>${escapeHtml(club.cn || club.name)}</strong><small>${escapeHtml(club.country)} · ${escapeHtml(club.leagueCn || club.league || '本国联赛')}</small><span class="club-offer-copy">${escapeHtml(item.reason)}</span><span class="club-offer-metrics">青训 ${club.youth || club.youthUsage || '—'} · 机会 ${club.opportunity || club.youthUsage || '—'} · ${escapeHtml(item.positionFit)}</span><span class="club-offer-contract">${escapeHtml(item.squad)} · ${escapeHtml(item.contract)} · 周薪 ${item.weeklyWage}</span></button>`; }
function positionInfo(id) { return positions.find(item => item.id === id) || positions[6]; }
function birthplaces(country) { return birthplaceMap[country] || [...new Set((dataRepository.clubs || []).filter(club => club.country === country && club.city).map(club => club.city))].slice(0, 8).concat(country).slice(0, 8); }
function seeded(seed) { let value = 0; for (const char of String(seed)) value = (value * 31 + char.codePointAt(0)) >>> 0; return () => ((value = Math.imul(1664525, value) + 1013904223 >>> 0) / 4294967296); }
function generatedBirth(seed) { const random = seeded(seed); return `2009-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}`; }
function field(label, name, value, type = 'text', placeholder = '') { const id = `player-${name}`; return `<div class="field field--${type}"><label for="${id}">${label}</label><input id="${id}" class="input" name="${name}" type="${type}" value="${escapeHtml(value ?? '')}" placeholder="${escapeHtml(placeholder)}" /></div>`; }
function selectField(label, name, options, value) { return `<div class="field"><label for="player-${name}">${label}</label><select id="player-${name}" class="input" name="${name}">${options.map(option => `<option ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></div>`; }
function styleCopy(name) { return { 爆发型: '速度和纵向冲击优先', 技术型: '控球、变向和小空间处理', 组织型: '视野、传球与节奏控制', 终结型: '跑位、射门和禁区效率', 防守型: '站位、拦截与身体对抗', 全能型: '各项均衡，适应多位置' }[name]; }
function cn(key) { return { speed: '速度', shooting: '射门', passing: '传球', dribbling: '盘带', defending: '防守', physical: '身体' }[key] || key; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
