import { icon } from '../components/icons.js';
import { radarChart } from '../components/radar.js';
import { crestSvg } from '../components/clubCrest.js';
import { dataRepository } from '../services/dataRepository.js';
import { computeOverall } from '../core/playerDevelopmentEngine.js';
import { createRealFixtures } from '../core/simulationController.js';
import { createPlayerOriginProfile, generatePlayerName, generateStartingClubOffers, validatePlayerName } from '../services/playerIdentity.js';
import { playStyleEligibility, traitEligibility } from '../core/positionResolver.js';
import { PLAYER_STYLES, PLAYER_STYLE_DEFINITIONS, SECONDARY_TRAITS } from '../data/playerProfiles.js';
import { addNews } from '../core/newsEngine.js';
import { ensureSeasonObjectives } from '../systems/honors/honorsSystem.js';
import { PACE_MODES } from '../app/config.js';

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
const styles = PLAYER_STYLES;
const countries = ['中国', '日本', '韩国', '英格兰', '西班牙', '葡萄牙', '法国', '德国', '意大利', '荷兰', '比利时', '巴西', '阿根廷', '美国', '墨西哥', '沙特阿拉伯', '土耳其', '尼日利亚', '加纳', '塞内加尔', '摩洛哥', '埃及'];
const birthplaceMap = { 中国: ['辽宁', '山东', '上海', '北京', '广东', '河南河北', '新疆', '江浙', '巴蜀'] };
const personalities = ['沉着自律', '外向自信', '低调务实', '好胜果断', '团队优先', '创造力强'];
const families = ['普通工薪家庭', '体育家庭', '单亲家庭', '小城商户家庭', '足球教练家庭', '跨国家庭'];
const academies = ['校园足球起步', '地方青训中心', '职业俱乐部梯队', '街头足球出身', '海外足球学校', '地区选拔队'];
export const CREATION_STEPS = Object.freeze(['职业速度', '身份', '身体 / 位置 / 风格', '球员数据', '球队邀请']);
export const CREATION_PACE_OPTIONS = Object.freeze(['immersive', 'standard', 'fast']);

export const playerStylesForPosition = position => playStyleEligibility.filter(position, PLAYER_STYLE_DEFINITIONS);
export const secondaryTraitsForPosition = position => traitEligibility.filter(position, SECONDARY_TRAITS);
function normalizeSelections(draft) {
  draft.style = playStyleEligibility.resolve(draft.position, draft.style, PLAYER_STYLE_DEFINITIONS);
  draft.secondaryTrait = traitEligibility.resolve(draft.position, draft.secondaryTrait, SECONDARY_TRAITS);
  return draft;
}

export function createPlayerWizard(app) {
  const savedCreation = app.store.get().creation || {};
  let step = Math.max(0, Math.min(4, Number(savedCreation.wizardStep || 0)));
  let locked = false;
  const state = app.store.get();
  const defaults = { paceMode: state.settings?.pace?.mode || 'standard', name: '', shirtName: '', country: '中国', birthplace: '上海', height: 178, weight: 70, bodyType: '普通', foot: '右脚', number: 18, position: 'CM', style: '全能中场', secondaryTrait: '稳定发挥', lockName: false, lockCountry: false, previewSeed: state.creation?.seed || `${state.createdAt}:identity` };
  const draft = { ...defaults, ...(savedCreation.wizardDraft || {}) };
  if (!PACE_MODES[draft.paceMode]) draft.paceMode = 'standard';
  syncOriginProfile(draft);
  const root = document.createElement('div');
  root.className = 'wizard-shell';
  const labels = CREATION_STEPS;
  const persistWizard = () => app.store.set(current => {
    current.creation.wizardStep = step;
    current.creation.wizardDraft = Object.fromEntries(Object.entries(draft).filter(([key]) => key !== 'originProfile'));
    current.creation.seed = draft.previewSeed;
    return current;
  }, { persist: true });
  const render = () => {
    const report = scoutDraft(draft);
    const identity = generatedIdentity(draft);
    root.innerHTML = `<div class="wizard"><div class="wizard-top"><div><div class="card-kicker">绿茵浮沉 · 创建球员</div><h1 class="page-title">${labels[step]}</h1></div><span class="badge blue">${step + 1}/${labels.length}</span></div><div class="stepper">${labels.map((_, index) => `<span class="step-dot ${index <= step ? 'active' : ''}"></span>`).join('')}</div><div class="wizard-body">${body(report, identity)}</div>${step === 4 ? '<div class="card-copy wizard-hint">点击球队卡片确认入口并进入生涯</div>' : `<div class="card-row wizard-actions"><button class="app-button ghost" data-prev ${step === 0 ? 'disabled' : ''}>${icon('back', 'sm')}上一步</button><button class="app-button primary" data-next>${step === 3 ? '查看球队机会' : '继续'}${icon('chevron', 'sm')}</button></div>`}</div>`;
    bind();
  };
  const body = (report, identity) => {
    if (step === 0) return paceStep(draft);
    if (step === 1) return `<section class="surface-card identity-step"><div class="form-grid">${field('姓名（可留空）', 'name', draft.name, 'text', identity.displayName)}${field('球衣名（可留空）', 'shirtName', draft.shirtName, 'text', identity.displayName.slice(-8))}${selectField('国家或地区', 'country', countries, draft.country)}${selectField('出生地 / 地区', 'birthplace', birthplaces(draft.country), draft.birthplace)}${field('球衣号码', 'number', draft.number, 'number')}</div><div class="identity-preview"><div><div class="card-kicker">${draft.name.trim() ? '手动姓名' : '国家姓名预览'}</div><strong>${escapeHtml(identity.displayName)}</strong><p class="card-copy">${draft.name.trim() ? '将使用你输入的姓名' : '按所选国家的姓名顺序与文字规则生成，进入生涯后固定保存'}</p></div></div></section>`;
    if (step === 2) { const selected = positionInfo(draft.position), options = playerStylesForPosition(draft.position), selectedStyle = styles[draft.style]; return `<section class="surface-card position-style-step"><div class="form-grid body-fields">${field('身高（cm）', 'height', draft.height, 'number')}<input class="body-slider" data-height-range type="range" min="160" max="205" value="${draft.height}" aria-label="身高滑块">${field('体重（kg）', 'weight', draft.weight, 'number')}${selectField('体型', 'bodyType', bodyTypes(), draft.bodyType || bodyTypeFor(draft))}${selectField('惯用脚', 'foot', ['右脚', '左脚', '双足'], draft.foot)}</div><div class="position-head"><div><div class="card-kicker">选择位置 · ${selected.group}</div><h2 class="card-title">${selected.name}（${selected.id}）</h2><p class="card-copy">${selected.desc} · 典型属性：${selected.focus}</p></div><span class="badge ${selected.id === 'GK' ? 'blue' : 'green'}">${selected.id === 'GK' ? '独立门将事件库' : '位置事件联动'}</span></div><div class="pitch pitch--wide ${selected.id === 'GK' ? 'pitch--keeper' : ''}">${positions.map(position => `<button class="position-node position-node--wide ${draft.position === position.id ? 'active' : ''} position-${position.group}" style="left:${position.x}%;top:${position.y}%" data-position="${position.id}" aria-label="${position.name} ${position.id}"><strong>${position.id}</strong><small>${position.name}</small></button>`).join('')}</div><div class="position-detail"><strong>${selected.name} · 适配度 ${positionFit(draft)}%</strong><span>${selected.desc}</span><small>推荐身高 ${heightRange(draft.position).join('—')}cm · 推荐体型 ${selectedStyle.body} · 发展路线：${developmentRoute(draft.position)}</small></div><div class="choice-grid style-profile-grid">${options.map(item => `<button class="choice-card style-profile-card ${draft.style === item.id ? 'active' : ''}" data-style="${item.id}">${icon(item.positions.includes('GK') ? 'goalkeeper' : item.positions.some(pos => ['CB','CDM'].includes(pos)) ? 'defending' : item.positions.some(pos => ['CAM','CM'].includes(pos)) ? 'passing' : 'shooting')}<h3>${item.id}</h3><p>${item.positions.join(' / ')} · ${item.bonus}</p><small>弱点：${item.weakness}</small><span>适配 ${styleFit(item.id, draft)}%</span></button>`).join('')}</div><div class="style-profile-detail"><div><span>核心说明</span><strong>${selectedStyle.bonus}</strong></div><div><span>推荐身体</span><strong>${selectedStyle.body}</strong></div><div><span>关键属性</span><strong>${selectedStyle.keys}</strong></div><div><span>场上行为</span><strong>${selectedStyle.behavior}</strong></div></div>${selectField('次要特质', 'secondaryTrait', secondaryTraitsForPosition(draft.position).map(item => item.name), draft.secondaryTrait)}</section>`; }
    if (step === 3) { const remaining = Math.max(0, 10 - Number(app.store.get().creation?.rerollsUsed || 0)); return `<section class="surface-card player-data-card ${report.potential >= 89 ? 'is-rare-result' : ''}"><div class="player-data-toolbar"><div><div class="card-kicker">完整随机档案</div><h2 class="card-title">球员数据</h2><p class="card-copy">剩余次数：${remaining}</p></div><button class="app-button secondary" data-reroll ${remaining ? '' : 'disabled'}>${icon('refresh','sm')}${remaining ? '重新生成' : '次数已用完'}</button></div><div class="reroll-locks"><label><input type="checkbox" data-lock="name" ${draft.lockName ? 'checked' : ''}>锁定姓名</label><label><input type="checkbox" data-lock="country" ${draft.lockCountry ? 'checked' : ''}>锁定国籍</label></div><div class="grid-2"><div class="scout-reveal"><div class="card-kicker">${icon('analytics', 'sm')} 球员数据可信度 ${report.confidence}%</div><div class="rarity">${report.tier}</div><p class="card-copy">${identity.displayName} · ${draft.country} · ${positionInfo(draft.position).name}</p><div class="tag-row"><span class="badge green">优势 ${cn(report.strengths[0])}</span><span class="badge green">优势 ${cn(report.strengths[1])}</span><span class="badge orange">短板 ${cn(report.weaknesses[0])}</span></div></div>${radarChart(report.stats, report.stats, report.potential, draft.position)}</div><div class="player-data-facts">${[['号码',draft.number],['身体',`${draft.height}cm · ${draft.weight}kg`],['惯用脚',draft.foot],['比赛风格',draft.style],['次要特质',draft.secondaryTrait],['性格',report.personality],['家庭背景',report.family],['青训经历',report.academy]].map(([label,value])=>`<div><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div></section>`; }
    const offers = academyClubs(draft, report);
    return `<section class="surface-card club-selection-step"><div class="card-row"><div><div class="card-kicker">真实球队机会 · ${draft.country}</div><h2 class="card-title">选择你的起点</h2><p class="card-copy">每张卡的青训水平、出场机会、合同和位置需求不同。</p></div><span class="badge blue">${offers.length} 个选项</span></div><div class="club-offer-grid">${offers.map(item => clubOfferCard(item)).join('')}</div></section>`;
  };
  const bind = () => {
    root.querySelectorAll('input[name], select[name]').forEach(element => element.addEventListener('input', () => {
      const previousCountry = draft.country;
      draft[element.name] = element.type === 'number' ? Number(element.value) : element.value;
      if (element.name === 'country') {
        syncOriginProfile(draft);
        draft.birthplace = birthplaces(draft.country)[0];
        if (previousCountry !== draft.country) draft.lockedIdentity = null;
        persistWizard();
        render();
        return;
      }
      if (element.name === 'height' || element.name === 'bodyType') {
        draft.weight = recommendedWeight(draft.height, draft.bodyType, draft.position);
        persistWizard();
        render();
        return;
      }
      persistWizard();
    }));
    root.querySelectorAll('[data-height-range]').forEach(element => element.addEventListener('input', () => { draft.height = Number(element.value); draft.weight = recommendedWeight(draft.height, draft.bodyType, draft.position); persistWizard(); render(); }));
    root.querySelectorAll('[data-pace]').forEach(element => { element.onclick = () => { draft.paceMode = element.dataset.pace; persistWizard(); app.feedback.emit('select', PACE_MODES[draft.paceMode]?.name || draft.paceMode); render(); }; });
    root.querySelectorAll('[data-lock]').forEach(element => element.addEventListener('change', () => { const key = element.dataset.lock; draft[`lock${key[0].toUpperCase()}${key.slice(1)}`] = element.checked; if (key === 'name') draft.lockedIdentity = element.checked && !draft.name.trim() ? generatedIdentity(draft) : null; persistWizard(); render(); }));
    root.querySelectorAll('[data-position]').forEach(element => { element.onclick = () => { draft.position = element.dataset.position; normalizeSelections(draft); draft.weight = recommendedWeight(draft.height, draft.bodyType, draft.position); persistWizard(); navigator.vibrate?.(16); render(); }; });
    root.querySelectorAll('[data-style]').forEach(element => { element.onclick = () => { draft.style = element.dataset.style; persistWizard(); app.feedback.emit('select', draft.style); render(); }; });
    root.querySelector('[data-reroll]')?.addEventListener('click', () => { const used = Number(app.store.get().creation?.rerollsUsed || 0); if (used >= 10) return app.feedback.emit('failure', '重新生成次数已用完'); Object.assign(draft, rerollPlayerDraft(draft, used + 1, originWorld())); persistWizard(); app.store.set(current => { current.creation.rerollsUsed = used + 1; current.creation.seed = draft.previewSeed; return current; }); const report = scoutDraft(draft); app.feedback.emit(report.potential >= 89 ? 'newTrait' : 'select', report.potential >= 89 ? `${report.tier}潜力` : `已重新生成，剩余 ${9 - used} 次`); render(); });
    root.querySelectorAll('[data-club]').forEach(element => { element.onclick = () => { if (locked || element.disabled) return; locked = true; root.classList.add('is-signing'); root.querySelectorAll('[data-club]').forEach(card => { card.disabled = true; }); app.feedback.emit('clubSelect', element.dataset.clubName); window.setTimeout(() => startCareer(element.dataset.club), 440); }; });
    root.querySelector('[data-prev]')?.addEventListener('click', () => { if (step > 0) { step -= 1; persistWizard(); render(); } });
    root.querySelector('[data-next]')?.addEventListener('click', () => {
      if (step === 1) { const check = validatePlayerName(draft.name); if (!check.valid) return app.feedback.emit('failure', check.error); }
      if (step === 2 && (!Number.isFinite(Number(draft.height)) || draft.height < 160 || draft.height > 205)) return app.feedback.emit('failure', '身高需在160至205厘米之间');
      if (step < 4) { step += 1; persistWizard(); app.feedback.emit(step === 3 ? 'scoutReport' : 'select', labels[step]); render(); }
    });
  };
  const startCareer = clubId => {
    const report = scoutDraft(draft); const identity = generatedIdentity(draft); const item = academyClubs(draft, report).find(offer => offer.clubId === clubId); if (!item?.eligible) { locked = false; app.feedback.emit('failure', item ? `${item.entryLabel}：${item.requirements.at(-1)}` : '该球队机会已失效'); return render(); } const club = item.club;
    const seasonYear = Number(String(state.simulation?.date || '2026').slice(0, 4));
    const player = { ...draft, name: identity.displayName, displayName: identity.displayName, nameParts: identity, nameSource: draft.name.trim() ? 'manual' : 'generated', shirtName: draft.shirtName.trim() || identity.familyName || identity.givenName, nation: draft.country, country: draft.country, birthplace: draft.birthplace, positionName: positionInfo(draft.position).name, birthDate: generatedBirth(`${state.createdAt}:${identity.displayName}:${draft.country}`), club: club.cn || club.name, clubId: club.id, crestPath: club.crest || null, league: club.leagueCn || club.league, leagueLevel: Math.max(1, Math.min(5, Math.ceil(Number(club.rep || club.reputation || 60) / 20))), team: item.squad, entryRoute:item.entryRoute, entryLabel:item.entryLabel, age: 16, stats: report.stats, potential: report.potential, ovr: computeOverall(report.stats, draft.position), fatigue: 18, morale: 72, fitness: 84, coachTrust: 52, status: '健康', previousStats: { ...report.stats }, squad: dataRepository.registry?.rosterForClub(club.id, { seed: identity.displayName, seasonYear }) || [] };
    app.store.set(current => { current.player = player; current.settings.mode = draft.paceMode; current.simulation.speed = draft.paceMode === 'immersive' ? 1 : draft.paceMode === 'standard' ? 2 : 4; current.creation.wizardStep = 0; current.creation.wizardDraft = null; current.training.facilityLevel = Math.max(1, Math.min(5, Math.ceil(Number(club.youth || club.academy || 60) / 20))); current.season.startOvr = player.ovr; current.season.startMarketValue = current.career.marketValue; current.transfer.club = club.id; current.transfer.country = club.country; current.transfer.league = club.leagueCn || club.league; current.schedule = createRealFixtures(current, dataRepository.clubs || []); ensureSeasonObjectives(current); current.career.history.push({ date: current.simulation.date, type: '签约', text: `${item.entryLabel}进入${player.club}${item.reason ? `：${item.reason}` : ''}`, clubId: club.id, crestPath: player.crestPath, entryRoute:item.entryRoute }); addNews(current, { id: `welcome-${current.createdAt}`, date: current.simulation.date, type: '生涯', title: `${item.entryLabel}正式确认`, copy: `${player.name} 以 16 岁身份通过${item.entryLabel}进入${player.club}。`, read: false }); return current; });
    app.feedback.emit('promoted', `已确认${item.entryLabel}：${player.club}`); app.mount();
  };
  render();
  return root;
}

function paceStep(draft) {
  const modes = [
    { id: 'immersive', label: '沉浸模式', duration: '约15—25分钟', copy: '每回合推进1个赛季，保留比赛、事件、关系和颁奖节点。', pause: '重要节点逐一确认' },
    { id: 'standard', label: '标准模式', duration: '约8—12分钟', copy: '每回合推进2个赛季，普通比赛自动模拟，关键节点暂停。', pause: '重大事件与决赛暂停' },
    { id: 'fast', label: '极速模式', duration: '约4—6分钟', copy: '每回合推进3个赛季，每季独立结算并保留完整历史。', pause: '只暂停职业转折节点' }
  ].filter(mode => CREATION_PACE_OPTIONS.includes(mode.id));
  return `<section class="surface-card pace-selection-step"><div class="card-kicker">选择你的旧站生涯节奏</div><h2 class="card-title">决定每次推进多少内容</h2><p class="card-copy">三种模式只改变操作次数，不会删减比赛、奖杯、荣誉或历史数据。</p><div class="pace-mode-grid">${modes.map(mode => `<button class="pace-mode-card ${draft.paceMode === mode.id ? 'is-selected' : ''}" data-pace="${mode.id}" aria-pressed="${draft.paceMode === mode.id}"><div class="pace-mode-card__top"><span class="pace-mode-card__icon">${mode.id === 'immersive' ? '◌' : mode.id === 'standard' ? '▶' : '»'}</span><div><h3>${mode.label}</h3><small>${mode.duration}</small></div><span class="selection-check">${draft.paceMode === mode.id ? '✓' : ''}</span></div><p class="card-copy">${mode.copy}</p><span class="badge blue">${mode.pause}</span></button>`).join('')}</div></section>`;
}

function bodyTypes() { return ['瘦弱', '苗条', '普通', '健硕', '强壮']; }
function bodyTypeFor(draft) {
  const expected = Number(draft.height || 178) - 108;
  const delta = Number(draft.weight || expected) - expected;
  return delta <= -7 ? '瘦弱' : delta <= -3 ? '苗条' : delta <= 3 ? '普通' : delta <= 8 ? '健硕' : '强壮';
}
function recommendedWeight(height, bodyType = '普通', position = 'CM') {
  const offsets = { 瘦弱: -8, 苗条: -4, 普通: 0, 健硕: 5, 强壮: 9 };
  const positionOffset = ['GK', 'CB'].includes(position) ? 4 : ['LW', 'RW'].includes(position) ? -2 : 0;
  return Math.max(48, Math.min(110, Math.round(Number(height || 178) - 108 + (offsets[bodyType] || 0) + positionOffset)));
}
function positionFit(draft) {
  const [min, max] = heightRange(draft.position), height = Number(draft.height || 178);
  const heightFit = height >= min && height <= max ? 18 : Math.max(0, 18 - Math.min(Math.abs(height - min), Math.abs(height - max)) * 2);
  const body = bodyTypeFor(draft);
  const bodyFit = ['GK', 'CB'].includes(draft.position) && ['健硕', '强壮'].includes(body) ? 8 : ['LW', 'RW'].includes(draft.position) && ['瘦弱', '苗条'].includes(body) ? 8 : 4;
  return Math.max(40, Math.min(98, 68 + heightFit + bodyFit));
}
function developmentRoute(position) {
  if (position === 'GK') return '门将反应 → 出球与制空';
  if (['CB', 'LB', 'RB'].includes(position)) return '防守站位 → 对抗与出球';
  if (['CDM', 'CM', 'LM', 'RM'].includes(position)) return '传控覆盖 → 节奏与决断';
  return '技术推进 → 终结与创造';
}

export function scoutDraft(draft) { normalizeSelections(draft); const random = seeded(`${draft.previewSeed}-${draft.name}-${draft.country}-${draft.position}-${draft.style}`); const selected = styles[draft.style]; const mods = bodyAdjustments(draft); const stats = Object.fromEntries(Object.entries(selected.stats).map(([key, value]) => [key, Math.max(35, Math.min(78, Math.round(value + Number(mods[key] || 0) + (random() - .5) * 8)))])); const potential = Math.round(70 + random() * 24); return { stats, potential, tier: potential >= 93 ? '传奇迹象' : potential >= 89 ? '世代' : potential >= 86 ? '顶级' : potential >= 82 ? '精英' : potential >= 78 ? '优秀' : '普通', confidence: Math.round(72 + random() * 23), personality: pick(personalities, random), family: pick(families, random), academy: pick(academies, random), strengths: Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key]) => key), weaknesses: Object.entries(stats).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([key]) => key) }; }
export function rerollPlayerDraft(draft, index, worldState = {}) { const next = { ...draft, previewSeed: `${draft.previewSeed}:reroll:${index}` }, previousCountry = next.country; const random = seeded(next.previewSeed); if (!next.lockCountry) next.country = pick(countries, random); if (!next.lockName) { next.name = ''; next.shirtName = ''; next.lockedIdentity = null; } if (previousCountry !== next.country) next.lockedIdentity = null; next.originProfile = createPlayerOriginProfile(next.country, worldState); next.position = pick(positions, random).id; next.style = pick(playerStylesForPosition(next.position), random).id; next.secondaryTrait = pick(secondaryTraitsForPosition(next.position), random).id; next.birthplace = pick(birthplaces(next.country), random); const [minHeight, maxHeight] = heightRange(next.position); next.height = minHeight + Math.floor(random() * (maxHeight - minHeight + 1)); next.weight = Math.max(55, Math.min(98, Math.round(next.height - 105 + positionWeight(next.position) + (random() - .5) * 8))); next.foot = random() < .68 ? '右脚' : random() < .88 ? '左脚' : '双足'; next.number = pick(numberPool(next.position), random); return next; }
function originWorld() { return { clubs: dataRepository.clubs || [], nameProfiles: dataRepository.nameProfiles || {} }; }
function syncOriginProfile(draft) { draft.originProfile = createPlayerOriginProfile(draft.country, originWorld()); return draft.originProfile; }
function academyClubs(draft, report) { return generateStartingClubOffers({ ...draft, nation: draft.country, ovr: computeOverall(report.stats, draft.position), potential: report.potential }, originWorld(), `${draft.previewSeed}:${draft.country}:${draft.position}`); }
function generatedIdentity(draft) { if (draft.name.trim()) return { displayName: draft.name.trim(), givenName: '', familyName: '' }; return draft.lockedIdentity || generatePlayerName(draft.originProfile?.nationality || draft.country, draft.previewSeed, dataRepository.nameProfiles || {}); }
function clubOfferCard(item) { const club = item.club,tone=item.entryRoute==='REJECTED'?'red':item.entryRoute==='DIRECT_CONTRACT'?'green':item.entryRoute==='ACADEMY'?'purple':'blue'; const crest = `<span class="club-offer-crest">${crestSvg(club,{size:54,decorative:true})}</span>`; return `<button class="club-offer-card ${item.type === '家乡球队' ? 'club-offer-card--home' : ''} ${item.eligible ? '' : 'is-ineligible'}" data-club="${escapeHtml(item.clubId)}" data-club-name="${escapeHtml(club.cn || club.name)}" data-entry-route="${item.entryRoute}" ${item.eligible ? '' : 'disabled'}><span class="club-offer-top">${crest}<span class="badge ${tone}">${escapeHtml(item.entryLabel)}</span></span><strong>${escapeHtml(club.cn || club.name)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(club.country)} · ${escapeHtml(club.leagueCn || club.league || '本国联赛')}</small><span class="club-offer-copy">${escapeHtml(item.reason)}</span><span class="club-offer-metrics">综合 ${item.score} / 门槛 ${item.required} · ${escapeHtml(item.positionFit)}</span><span class="club-offer-contract">${escapeHtml(item.squad)} · ${escapeHtml(item.contract)}${item.weeklyWage?` · 周薪 €${Number(item.weeklyWage).toLocaleString('en-US')}`:''}</span></button>`; }
function styleFit(name, draft) { const style = styles[name]; let score = playStyleEligibility.eligible(draft.position, style) ? 76 : style.positions.some(position => positionInfo(position).group === positionInfo(draft.position).group) ? 58 : 38; if (name === '支点中锋' || name === '出球后卫' || name === '清道夫门将') score += Math.round((Number(draft.height) - 178) / 2); if (name === '速度型边锋' || name === '内切攻击手') score += Math.round((178 - Number(draft.height)) / 3); return Math.max(25, Math.min(98, score)); }
function bodyAdjustments(draft) { const height = Number(draft.height || 178), weight = Number(draft.weight || 70), tall = (height - 178) / 5, strong = (weight - (height - 108)) / 4; if (draft.position === 'GK') return { speed: -Math.max(0, tall), passing: 1, defending: 4 + tall, physical: 3 + tall + strong }; if (draft.position === 'CB') return { speed: -Math.max(0, tall), passing: 1, defending: 4 + tall, physical: 4 + tall + strong }; if (draft.position === 'ST') return { speed: -Math.max(0, tall - 1), shooting: 3, dribbling: -Math.max(0, tall / 2), physical: 2 + tall + strong }; if (['LW','RW'].includes(draft.position)) return { speed: 4 - tall, shooting: 1, dribbling: 3 - Math.max(0, tall / 2), physical: strong - 2 }; if (['LB','RB'].includes(draft.position)) return { speed: 3 - tall / 2, passing: 1, defending: 2, physical: strong }; if (draft.position === 'CDM') return { passing: 2, defending: 3, physical: 3 + strong }; return { passing: 2, dribbling: 1, physical: strong }; }
function heightRange(position) { if (position === 'GK') return [184, 199]; if (position === 'CB') return [181, 197]; if (position === 'ST') return [174, 194]; if (['LW','RW'].includes(position)) return [165, 184]; if (['LB','RB'].includes(position)) return [168, 188]; return [168, 190]; }
function positionWeight(position) { return position === 'GK' || position === 'CB' ? 7 : position === 'ST' ? 4 : ['LW','RW'].includes(position) ? -3 : 0; }
function numberPool(position) { return position === 'GK' ? [1,12,13,22,25] : position === 'ST' ? [9,10,18,19,21] : ['LW','RW'].includes(position) ? [7,11,17,20,23] : ['CB','LB','RB'].includes(position) ? [2,3,4,5,15] : [6,8,10,14,16,18]; }
function pick(items, random) { return items[Math.floor(random() * items.length)] || items[0]; }
function positionInfo(id) { return positions.find(item => item.id === id) || positions[6]; }
function birthplaces(country) { return birthplaceMap[country] || [...new Set((dataRepository.clubs || []).filter(club => club.country === country && club.city).map(club => club.city))].slice(0, 8).concat(country).slice(0, 8); }
function seeded(seed) { let value = 0; for (const char of String(seed)) value = (value * 31 + char.codePointAt(0)) >>> 0; return () => ((value = Math.imul(1664525, value) + 1013904223 >>> 0) / 4294967296); }
function generatedBirth(seed) { const random = seeded(seed); return `2009-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}`; }
function field(label, name, value, type = 'text', placeholder = '') { const id = `player-${name}`; return `<div class="field field--${type}"><label for="${id}">${label}</label><input id="${id}" class="input" name="${name}" type="${type}" value="${escapeHtml(value ?? '')}" placeholder="${escapeHtml(placeholder)}" /></div>`; }
function selectField(label, name, options, value) { return `<div class="field"><label for="player-${name}">${label}</label><select id="player-${name}" class="input" name="${name}">${options.map(option => `<option ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></div>`; }
function styleCopy(name) { return { 爆发型: '速度和纵向冲击优先', 技术型: '控球、变向和小空间处理', 组织型: '视野、传球与节奏控制', 终结型: '跑位、射门和禁区效率', 防守型: '站位、拦截与身体对抗', 全能型: '各项均衡，适应多位置' }[name]; }
function cn(key) { return { speed: '速度', shooting: '射门', passing: '传球', dribbling: '盘带', defending: '防守', physical: '身体' }[key] || key; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
