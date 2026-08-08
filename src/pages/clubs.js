import { icon } from '../components/icons.js';
import { metric, statGrid } from '../components/ui.js';
import { crestSvg } from '../components/clubCrest.js';
import { trophyMarkup } from '../components/trophyIcon.js';
import { CLUBS } from '../data/clubs.js';
import { dataRepository } from '../services/dataRepository.js';

const POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LB', 'RB', 'CB', 'GK'];
const POSITION_NAMES = { ST: '中锋', CF: '中锋', SS: '影锋', LW: '左边锋', LM: '左边前卫', RW: '右边锋', RM: '右边前卫', CAM: '前腰', CM: '中场', CDM: '后腰', LB: '左后卫', LWB: '左翼卫', RB: '右后卫', RWB: '右翼卫', CB: '中后卫', GK: '门将' };
const POSITION_ALIASES = { CF: 'ST', SS: 'CAM', LM: 'LW', RM: 'RW', LWB: 'LB', RWB: 'RB' };
const COACH_NAMES = ['安德烈·科斯塔', '马丁·费舍尔', '卢卡·贝尔蒂', '大卫·莫雷诺', '陈启明', '阿莱西奥·罗西'];
const PALETTES = [
  ['#3974e8', '#eaf2ff'], ['#d6545b', '#fff0f1'], ['#258b70', '#e7f7f1'],
  ['#8c63cf', '#f3efff'], ['#c48a27', '#fff8e6'], ['#2b8298', '#e9f7fa']
];

const list = () => dataRepository.clubs?.length ? dataRepository.clubs : CLUBS;
const text = (value, fallback = '—') => value == null || value === '' ? fallback : String(value);
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(number(value))));
const unique = items => [...new Set(items.filter(Boolean))];
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clubName = club => club?.cn || club?.name || club?.nameZh || club?.native || '未知俱乐部';
const englishName = club => club?.nameEn || club?.en || club?.english || club?.native || clubName(club);
const location = club => [club?.country, club?.leagueCn || club?.league, cityName(club)].filter(value => value && value !== '未核实').join(' · ');
const ACTIONS = {
  current: [['coach','coach','与主教练沟通'],['minutes','starter','询问出场机会'],['position','formation','讨论场上位置'],['training','training','调整训练'],['loan','transfer','请求外租'],['stay','club','表达留队意愿'],['transfer-request','transfer','提交转会申请'],['teammate','teammate','与队友互动'],['captain','trust','与队长交流'],['management','business','与管理层沟通']],
  external: [['compare','club','比较球队定位'],['interest','growth','表达兴趣'],['agent','agent','让经纪人接触'],['contact','message','请求沟通'],['expected-contract','contract','查看预期合同']]
};

export const clubInteractionActions = current => ACTIONS[current ? 'current' : 'external'].map(([id]) => id);
ACTIONS.external.push(['transfer-request', 'transfer', '\u7533\u8bf7\u8f6c\u4f1a']);

export function clubsPage(app, state) {
  const clubs = list();
  const filters = state.transfer.clubDirectory || {};
  const currentId = state.player?.clubId || state.career?.clubId || state.transfer.club;
  const selectedId = state.transfer.club || currentId || clubs[0]?.id;
  const selected = clubs.find(club => club.id === selectedId) || clubs[0] || null;
  const continents = unique(clubs.map(club => club.continent));
  const countries = unique(clubs.filter(club => !filters.continent || club.continent === filters.continent).map(club => club.country));
  const leagues = unique(clubs.filter(club => (!filters.continent || club.continent === filters.continent) && (!filters.country || club.country === filters.country)).map(club => club.league || club.leagueCn));
  const query = String(filters.query || '').trim().toLocaleLowerCase();
  const position = filters.position || '';
  const matches = clubs.filter(club => {
    const haystack = [clubName(club), englishName(club), club.country, club.league, club.leagueCn, club.city].filter(Boolean).join(' ').toLocaleLowerCase();
    return (!filters.continent || club.continent === filters.continent)
      && (!filters.country || club.country === filters.country)
      && (!filters.league || (club.league || club.leagueCn) === filters.league)
      && (!position || (club.needs || club.need || []).includes(position))
      && (!query || haystack.includes(query));
  });
  const visible = matches.slice(0, 12);
  const theme = getClubTheme(selected);
  const root = document.createElement('section');
  root.className = 'page clubs-page';
  root.innerHTML = `<div class="page-head"><div><div class="card-kicker">球员职业关系中心</div><h1 class="page-title">俱乐部</h1><p class="page-subtitle">先看清你在队内的位置，再决定下一步去哪里。</p></div><span class="badge blue">${clubs.length} 支球队</span></div>
    ${selected ? clubProfile(selected, state, clubs, currentId, theme) : '<div class="empty">暂无俱乐部资料</div>'}
    <details class="club-filter-panel" ${filters.continent || filters.country || filters.league || filters.position || filters.query ? 'open' : ''}><summary><span><span class="card-kicker">${icon('filter', 'sm')} 世界俱乐部目录</span><strong>按区域、联赛和位置筛选</strong></span><span class="badge blue">${matches.length} 个结果</span></summary><div class="club-filter-body"><div class="club-filter-grid"><label>国家区域<select data-club-filter="continent"><option value="">全部区域</option>${continents.map(item => `<option value="${escapeHtml(item)}" ${item === filters.continent ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}</select></label><label>国家<select data-club-filter="country"><option value="">全部国家</option>${countries.map(item => `<option value="${escapeHtml(item)}" ${item === filters.country ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}</select></label><label>联赛<select data-club-filter="league"><option value="">全部联赛</option>${leagues.map(item => `<option value="${escapeHtml(item)}" ${item === filters.league ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}</select></label><label>位置需求<select data-club-filter="position"><option value="">全部位置</option>${POSITIONS.map(item => `<option value="${item}" ${item === position ? 'selected' : ''}>${item} · ${POSITION_NAMES[item]}</option>`).join('')}</select></label></div><label class="club-search"><span>${icon('search', 'sm')}</span><input value="${escapeHtml(filters.query || '')}" data-club-query placeholder="搜索俱乐部、国家或联赛" /></label></div></details>
    <section class="club-results"><div class="section-heading"><div><div class="card-kicker">${escapeHtml(filters.league || filters.country || filters.continent || '全部俱乐部')}</div><h2 class="card-title">下一站候选</h2></div><span class="badge green">显示 ${visible.length} / ${matches.length}</span></div><div class="club-directory-grid">${visible.map(club => clubCard(club, club.id === selected?.id, position)).join('') || '<div class="empty-event-state">没有符合条件的球队。</div>'}</div></section>`;

  root.addEventListener('change', event => {
    const key = event.target.closest('[data-club-filter]')?.dataset.clubFilter;
    if (!key) return;
    app.store.set(current => { current.transfer.clubDirectory = { ...(current.transfer.clubDirectory || {}), [key]: event.target.value, ...(key === 'continent' ? { country: '', league: '' } : {}), ...(key === 'country' ? { league: '' } : {}) }; return current; });
  });
  root.querySelector('[data-club-query]')?.addEventListener('input', event => app.store.set(current => { current.transfer.clubDirectory = { ...(current.transfer.clubDirectory || {}), query: event.target.value }; return current; }, { persist: false }));
  root.addEventListener('click', event => {
    const competitor = event.target.closest('[data-competition-player]');
    if (competitor) return app.overlay.sheet('球员竞争详情', competitionPlayerSheet(competitor.dataset));
    const action = event.target.closest('[data-club-action]')?.dataset.clubAction;
    if (action) return app.handleClubAction(action, selected);
    const clubId = event.target.closest('[data-club]')?.dataset.club;
    if (!clubId) return;
    app.store.set(current => { current.transfer.club = clubId; return current; });
  });
  return root;
}

function clubProfile(club, state, clubs, currentId, theme) {
  const current = club.id === currentId || clubName(club) === state.player?.club;
  const player = state.player || {};
  const clubRank = rankFor(club, clubs);
  const goal = seasonGoal(club, clubRank);
  const themeStyle = `--club-accent:${theme.accent};--club-accent-soft:${theme.soft};`;
  return `<div class="club-profile" style="${themeStyle}">
    <section class="club-hero"><div class="club-hero-line"></div><div class="club-hero-main"><div class="club-hero-crest">${crestSvg(club, { size: 96 })}</div><div class="club-hero-copy"><div class="card-kicker">${current ? '当前效力 · 球队档案' : '候选球队 · 球队档案'}</div><h2>${escapeHtml(clubName(club))}</h2><p class="club-hero-english">${escapeHtml(englishName(club))}</p><p class="card-copy">${escapeHtml(location(club) || '联赛资料待补充')}</p><div class="tag-row"><span class="badge club-accent-badge">联赛第 ${clubRank} 名</span><span class="badge blue">声望 ${clamp(club.rep || club.reputation)}</span><span class="badge gold">目标：${goal}</span></div></div></div><div class="club-hero-facts"><div><span>城市</span><strong>${escapeHtml(cityName(club))}</strong></div><div><span>主教练</span><strong>${escapeHtml(coachName(club))}</strong></div><div><span>主场</span><strong>${escapeHtml(stadiumName(club))}</strong></div></div>${clubActionButtons(current,state,club)}</section>
    ${myStatus(club, state, clubs, current)}
    ${seasonSection(club, state, clubRank, goal)}
    ${squadSection(club, state, current)}
    <div class="club-secondary-grid">${tacticsSection(club, state)}${coachSection(club, state)}</div>
    ${facilitiesSection(club, state)}
    ${contractSection(club, state, current)}
    ${honorsSection(club, state)}
  </div>`;
}

function clubActionButtons(current,state,club) {
  const actions=ACTIONS[current?'current':'external'];
  return `<div class="club-hero-actions club-action-grid">${actions.map(([id,iconName,label])=>{const until=state.clubInteractions?.cooldowns?.[`${club.id}:${id}`],cooling=until&&until>state.simulation.date;return `<button class="app-button ${id==='contact'||id==='coach'?'primary':'ghost'}" data-club-action="${id}" ${cooling?'disabled':''}>${icon(iconName,'sm')}<span>${cooling?`冷却至 ${until}`:label}</span></button>`;}).join('')}</div>`;
}

function myStatus(club, state, clubs, current) {
  const player = state.player || {};
  const position = rosterPosition(player.position || 'CM');
  const rep = number(club.rep || club.reputation, 60);
  const ovr = number(player.ovr, 60);
  const trust = clamp(player.coachTrust ?? state.relationships?.coach ?? 50);
  const form = clamp(player.form ?? state.status?.form ?? 55);
  const fit = clamp(50 + (ovr - rep) * 1.8 + trust * .28 + (club.needs || []).includes(position) * 8);
  const start = clamp(22 + (ovr - rep) * 2.4 + trust * .38 + form * .16 + ((club.needs || []).includes(position) ? 10 : 0), 8, 96);
  const fanSupport = clamp(35 + Math.log10(Math.max(10, number(state.relationships?.fans ?? state.fans?.social, 1200))) * 12);
  const stability = clamp(number(state.career?.contractMonths, 24) / 36 * 100, 25, 96);
  const role = roleLabel(state, ovr, rep, trust);
  const rows = [
    ['首发概率', start, 'green'], ['教练信任', trust, 'blue'], ['球迷支持', fanSupport, 'purple'],
    ['战术适配', fit, 'orange'], ['合同稳定度', stability, 'gold']
  ];
  const rank = competitionRank(club, player, state);
  const gap = rank > 1 ? `距离首发还需：教练信任 +${Math.max(0, 7 - Math.floor(trust / 15))} · OVR +${Math.max(0, Math.ceil(rep - ovr))}` : role === '核心' ? '球队战术核心，需要保持状态与训练强度。' : '首发位置稳定，继续保持近期表现。';
  return `<section class="club-status-section"><div class="section-heading"><div><div class="card-kicker">${icon('player','sm')} 我的地位</div><h2 class="card-title">${current ? '我在这支球队的答案' : '加入后的竞争预览'}</h2></div><span class="badge ${role === '核心' || role === '主力' ? 'green' : 'blue'}">${role}</span></div><div class="club-status-grid"><div class="club-role-card"><div class="club-role-number">${rank === 1 ? '01' : `0${rank}`}</div><div><strong>${role}</strong><span>${POSITION_NAMES[player.position] || player.position || '中场'} · OVR ${Math.round(ovr)}</span><p>${escapeHtml(gap)}</p></div></div><div class="club-status-metrics">${rows.map(([label, value, tone]) => metric(label, value, { tone })).join('')}</div></div></section>`;
}

function seasonSection(club, state, rank, goal) {
  const stats = state.career?.seasonStats || {};
  const apps = number(stats.apps, number(state.season?.appearances));
  const starts = number(stats.starts, Math.min(apps, Math.round(apps * .65)));
  const goals = number(stats.goals, number(state.season?.goals));
  const assists = number(stats.assists, number(state.season?.assists));
  const played = recentMatches(state);
  const wins = played.filter(item => item.result === 'W').length;
  const draws = played.filter(item => item.result === 'D').length;
  const losses = played.filter(item => item.result === 'L').length;
  const form = played.length ? played.map(item => `<span class="form-dot form-dot--${item.result.toLowerCase()}">${item.result}</span>`).join('') : '<span class="card-copy">赛季刚开始</span>';
  return `<section class="club-season-section"><div class="section-heading"><div><div class="card-kicker">${icon('calendar','sm')} 当前赛季 · ${escapeHtml(String(state.season?.year || '2026/27'))}</div><h2 class="card-title">${escapeHtml(club.leagueCn || club.league || '当前联赛')} · 第 ${rank} 名</h2></div><span class="badge gold">${escapeHtml(goal)}</span></div>${statGrid([['球队场次', played.length || apps], ['胜', wins], ['平', draws], ['负', losses], ['进球', goals], ['失球', Math.max(0, losses + draws - wins + goals)]])}<div class="club-form-row"><span>最近 5 场</span><div class="club-form">${form}</div><span class="card-copy">个人 ${starts} 次首发</span></div></section>`;
}

function squadSection(club, state, current) {
  const player = state.player || {};
  const rawPosition = player.position || 'CM';
  const position = rosterPosition(rawPosition);
  const seasonYear = Number(String(state.simulation?.date || '2026').slice(0, 4));
  const roster = (dataRepository.rosterForClub(club.id, { limit: 50, seed: player.name || 'career', seasonYear }) || []).filter(item => item.position === position).slice(0, 5);
  const rows = [...roster, { id: 'player', cn: player.name || '你的球员', name: player.name || '你的球员', position, ovr: number(player.ovr, 60), age: number(player.age, 16), isPlayer: true }].sort((a, b) => number(b.ovr) - number(a.ovr));
  return `<section class="club-roster-section"><div class="section-heading"><div><div class="card-kicker">${icon('users','sm')} 阵容竞争 · ${POSITION_NAMES[rawPosition] || POSITION_NAMES[position] || rawPosition}</div><h2 class="card-title">同位置出场顺位</h2><p class="card-copy">只比较${POSITION_NAMES[rawPosition] || POSITION_NAMES[position] || position}，点击球员可查看竞争详情。</p></div><span class="badge blue">${rows.length} 人</span></div><div class="club-roster-table">${rows.map((item, index) => rosterRow(item, index, club, seasonYear)).join('')}</div></section>`;
}

function rosterRow(item, index, club, seasonYear) {
  const name = item.isPlayer ? item.name : item.cn || item.name || '青年球员';
  const hideLatinName = ['中国', '中國', '日本', '韩国', '韓國', '南韓'].includes(item.nationality || item.nation);
  const status = item.isPlayer ? '你' : index === 0 ? '核心' : index === 1 ? '主力' : index < 3 ? '轮换' : '替补';
  const trend = item.isPlayer ? '近期可提升' : (number(item.ovr) + number(club.rep)) % 3 === 0 ? '状态上升' : '稳定';
  const birthYear = Number(item.birthYear);
  const age = item.isPlayer ? number(item.age, 16) : Number.isInteger(birthYear) && birthYear > 1900 ? Math.max(16, number(seasonYear) - birthYear) : 20;
  const source = item.isPlayer ? '当前存档' : item.isReal ? '真实阵容' : '青训补位';
  const subtitle = item.name && item.cn && !hideLatinName ? item.name : item.nationality || item.nation || source;
  return `<button type="button" class="club-roster-row ${item.isPlayer ? 'is-player' : ''}" data-competition-player="${escapeHtml(item.id || name)}" data-player-name="${escapeHtml(name)}" data-player-age="${age}" data-player-position="${escapeHtml(item.position)}" data-player-ovr="${Math.round(number(item.ovr, 60))}" data-player-role="${status}" data-player-rank="${index + 1}" data-player-form="${trend}" data-player-source="${source}"><span class="roster-rank">#${index + 1}</span><div class="roster-avatar">${escapeHtml(name.slice(0, 1))}</div><div class="roster-name"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(subtitle)} · ${trend}</span></div><span class="roster-position">${escapeHtml(item.position)} · ${age}岁</span><strong class="roster-ovr">${Math.round(number(item.ovr, 60))}</strong><span class="badge ${item.isPlayer ? 'green' : index < 2 ? 'orange' : 'blue'}">${status}</span><span class="roster-form">${trend}</span></button>`;
}

function competitionPlayerSheet(player) {
  return `<section class="surface-card competition-player-sheet"><div class="card-row"><div><div class="card-kicker">${icon('club','sm')} ${escapeHtml(player.playerSource)}</div><h3 class="card-title">${escapeHtml(player.playerName)}</h3><p class="card-copy">${escapeHtml(player.playerPosition)} · ${escapeHtml(player.playerAge)}岁 · 预计第 ${escapeHtml(player.playerRank)} 顺位</p></div><span class="badge ${player.playerRole === '你' ? 'green' : 'blue'}">${escapeHtml(player.playerRole)}</span></div>${statGrid([['OVR', player.playerOvr], ['年龄', `${player.playerAge}岁`], ['预计顺位', `#${player.playerRank}`], ['近期状态', player.playerForm]])}</section>`;
}

function tacticsSection(club, state) {
  const position = rosterPosition(state.player?.position || 'CM');
  const style = tacticProfile(club.tactic || club.style);
  return `<section class="club-info-section"><div class="card-kicker">${icon('tactics','sm')} 战术画像</div><h3 class="card-title">${escapeHtml(club.formation || '4-3-3')} · ${escapeHtml(club.tactic || club.style || '均衡推进')}</h3><div class="tag-row"><span class="badge blue">${style.attack}</span><span class="badge purple">${style.press}</span><span class="badge green">${style.width}</span></div><div class="club-detail-lines"><div><span>你的战术职责</span><strong>${positionDuty(position)}</strong></div><div><span>球队传球节奏</span><strong>${style.tempo}</strong></div><div><span>防线高度</span><strong>${style.line}</strong></div></div></section>`;
}

function coachSection(club, state) {
  const trust = clamp(state.player?.coachTrust ?? state.relationships?.coach ?? 50);
  const form = clamp(state.player?.form ?? state.status?.form ?? 55);
  const review = trust >= 78 && form >= 70 ? '近期状态很好，已经可以承担更稳定的战术职责。' : trust >= 58 ? '训练态度可靠，但需要用连续比赛表现巩固位置。' : '目前仍在观察期，下一阶段要先提高训练投入和比赛稳定性。';
  const focus = form < 60 ? '体能与比赛持续性' : trust < 65 ? '无球跑动与战术执行' : '关键区域决策';
  return `<section class="club-info-section"><div class="card-kicker">${icon('coach','sm')} 主教练关系</div><div class="card-row"><h3 class="card-title">${escapeHtml(coachName(club))}</h3><span class="badge ${trust >= 70 ? 'green' : 'orange'}">信任 ${trust}</span></div><p class="card-copy">${review}</p>${metric('关系进度', trust, { tone: trust >= 70 ? 'green' : 'orange' })}<div class="coach-focus"><span>下一阶段要求</span><strong>${focus}</strong></div></section>`;
}

function facilitiesSection(club, state) {
  const base = clamp((number(club.youth, 60) + number(club.finance, 60)) / 2);
  const level = clamp(Math.max(1, number(state.training?.facilityLevel, Math.round(base / 20))), 1, 5);
  const facilities = [
    ['training', '训练基地', Math.max(level, Math.round(number(club.youth, 60) / 20)), `训练成长 +${Math.round(number(club.youth, 60) / 12)}%`, '短板训练的成长效率'],
    ['academy', '青训学院', Math.max(1, Math.round(number(club.youth, 60) / 20)), `青年机会 ${clamp(club.youthUsage || club.opportunity, 50)}%`, '年轻球员进入轮换的通道'],
    ['medical', '医疗中心', Math.max(1, Math.round((100 - number(club.rep, 60) / 3) / 20)), `恢复效率 +${Math.round(5 + number(club.finance, 60) / 18)}%`, '伤病与疲劳管理'],
    ['analytics', '数据分析', Math.max(1, Math.round(number(club.rep, 60) / 20)), `比赛复盘 +${Math.round(number(club.rep, 60) / 14)}%`, '比赛决策与位置适配'],
    ['scout', '球探系统', Math.max(1, Math.round(number(club.reputation || club.rep, 60) / 20)), `市场覆盖 ${number(club.finance, 60)}%`, '获取位置竞争与转会信息'],
    ['recovery', '恢复中心', Math.max(1, Math.round(number(club.finance, 60) / 20)), `疲劳消退 +${Math.round(4 + number(club.finance, 60) / 24)}%`, '训练间隔与出场准备']
  ];
  return `<details class="club-accordion club-facilities" open><summary><span><span class="card-kicker">${icon('facility','sm')} 俱乐部设施</span><strong>基础设施直接影响你的成长节奏</strong></span><span class="badge blue">平均 ${level}/5</span></summary><div class="club-facility-grid">${facilities.map(([ico, name, stars, effect, copy]) => `<article class="club-facility-card"><div class="club-facility-icon">${icon(ico === 'academy' ? 'growth' : ico, 'sm')}</div><div class="card-row"><strong>${name}</strong><span class="facility-stars">${'★'.repeat(Math.min(5, stars))}${'☆'.repeat(Math.max(0, 5 - stars))}</span></div><b>${effect}</b><p>${copy}</p></article>`).join('')}</div></details>`;
}

function contractSection(club, state, current) {
  const months = number(state.career?.contractMonths, 24);
  const years = number(state.career?.contract?.years, Math.ceil(months / 12));
  const wage = number(state.career?.weeklySalary, number(state.finance?.weeklyWage, 1800));
  const role = roleLabel(state, number(state.player?.ovr), number(club.rep, 60), number(state.player?.coachTrust ?? 50));
  const status = months <= 12 ? '本赛季结束前需要谈判' : months >= 36 ? '长期合同' : `还有 ${Math.ceil(months / 12)} 个赛季`;
  const attitude = role === '核心' || role === '主力' ? '核心非卖品' : months <= 12 ? '非常希望续约' : '愿意听取合理报价';
  return `<details class="club-accordion club-contract"><summary><span><span class="card-kicker">${icon('contract','sm')} 合同与未来</span><strong>${current ? status : '加入后的条件预览'}</strong></span><span class="badge ${months <= 12 ? 'orange' : 'green'}">${attitude}</span></summary><div class="club-contract-grid">${statGrid([['合同状态', status], ['周薪', `€${wage.toLocaleString()}`], ['球队角色', role], ['剩余年限', `${Math.max(0, years)} 个赛季`]])}<div class="club-future-note"><div class="card-kicker">转会兴趣预览</div><p>当前市场关注度 ${clamp(state.player?.ovr * .72 + state.player?.potential * .18 || 48)}。经纪人建议先用训练和连续出场换取更高的谈判筹码。</p><div class="tag-row"><span class="badge blue">续约意愿 ${attitude}</span><span class="badge orange">租借可能 ${role === '青训' || role === '边缘球员' ? '中等' : '较低'}</span><span class="badge purple">市场 ${state.transfer?.watchlist?.length ? '已有关注' : '等待报价'}</span></div></div></div></details>`;
}

function honorsSection(club, state) {
  const honors = state.career?.honors || {};
  const items = [...(honors.trophies || []), ...(honors.personalAwards || [])].slice(-4);
  return `<details class="club-accordion club-honors"><summary><span><span class="card-kicker">${icon('trophy','sm')} 荣誉与历史</span><strong>${items.length ? `${items.length} 项存档荣誉` : '等待你的第一座奖杯'}</strong></span><span class="badge gold">俱乐部档案</span></summary><div class="club-honors-body"><p class="card-copy">${escapeHtml(club.honours || '球队历史荣誉将在生涯推进后逐步记录。')}</p>${items.length ? `<div class="club-honors-grid">${items.map(item => `<article><div class="trophy-frame">${trophyMarkup(item, 'small')}</div><strong>${escapeHtml(item.name || item.cn || '生涯荣誉')}</strong><span>${escapeHtml(item.season || '本存档')} · ${escapeHtml(item.club || clubName(club))}</span></article>`).join('')}</div>` : '<div class="club-honors-empty">完成赛季目标后，球队成绩和个人奖项会在这里形成职业履历。</div>'}</div></details>`;
}

function clubCard(club, active, position) {
  const needs = club.needs || club.need || [];
  const fit = needs.includes(position) ? '位置正缺人' : number(club.youthUsage || club.opportunity) >= 70 ? '青年机会' : '体系稳定';
  const theme = getClubTheme(club);
  return `<button class="club-directory-card ${active ? 'is-active' : ''}" data-club="${escapeHtml(club.id)}" style="--club-accent:${theme.accent};--club-accent-soft:${theme.soft}"><div class="card-row"><div class="club-card-crest">${crestSvg(club, { size: 48 })}</div><span class="badge ${active ? 'green' : 'blue'}">${fit}</span></div><h3 class="card-title">${escapeHtml(clubName(club))}</h3><p class="card-copy">${escapeHtml(location(club) || '联赛资料待补充')}</p><div class="club-card-metrics"><span>实力 <b>${clamp(club.rep || club.reputation)}</b></span><span>青训 <b>${clamp(club.youth || club.academy)}</b></span><span>机会 <b>${clamp(club.youthUsage || club.opportunity)}</b></span></div></button>`;
}

function recentMatches(state) {
  return (state.schedule || []).filter(item => item.status === 'played').slice(-5).map(item => {
    const score = String(item.score || '').split(/[-:]/).map(Number);
    const result = score.length === 2 && score.every(Number.isFinite) ? score[0] > score[1] ? 'W' : score[0] === score[1] ? 'D' : 'L' : 'D';
    return { ...item, result };
  });
}

function rankFor(club, clubs) {
  const league = club.leagueId || club.league || club.leagueCn;
  return 1 + clubs.filter(item => (item.leagueId || item.league || item.leagueCn) === league && number(item.rep || item.reputation) > number(club.rep || club.reputation)).length;
}

function competitionRank(club, player, state) {
  const position = rosterPosition(player.position || 'CM');
  const seasonYear = Number(String(state.simulation?.date || '2026').slice(0, 4));
  const roster = dataRepository.rosterForClub(club.id, { limit: 30, seed: player.name || 'career', seasonYear }).filter(item => item.position === position);
  return 1 + roster.filter(item => number(item.ovr) > number(player.ovr, 60)).length;
}

function roleLabel(state, ovr, rep, trust) {
  if (String(state.player?.team || state.career?.squadLevel || '').includes('青年') || String(state.player?.team || '').includes('U')) return '青训';
  if (trust >= 82 && ovr >= rep + 5) return '核心';
  if (trust >= 70 && ovr >= rep - 1) return '主力';
  if (trust >= 55 && ovr >= rep - 8) return '轮换';
  if (ovr >= rep - 14) return '替补';
  return '边缘球员';
}

function seasonGoal(club, rank) {
  const rep = number(club.rep || club.reputation, 60);
  if (rep >= 86 || rank <= 2) return '争冠';
  if (rep >= 76 || rank <= 5) return '争夺洲际资格';
  if (rep >= 66) return '稳定排名';
  return '保级与培养';
}

function coachName(club) { return club?.coachName || COACH_NAMES[hash(club?.id) % COACH_NAMES.length]; }
function stadiumName(club) { return club?.stadium || `${club?.city || club?.country || '球队'}主场`; }
function cityName(club) { return club?.city || String(club?.cn || club?.name || club?.country || '球队').replace(/足球俱乐部$/, ''); }
function hash(value) { let result = 2166136261; for (const char of String(value || 'club')) result = Math.imul(result ^ char.charCodeAt(0), 16777619); return result >>> 0; }

function getClubTheme(club) {
  const source = club?.primaryColor || club?.primary || club?.color;
  const accent = /^#[0-9a-f]{6}$/i.test(String(source || '')) ? source : PALETTES[hash(club?.id) % PALETTES.length][0];
  const soft = PALETTES.find(item => item[0].toLocaleLowerCase() === String(accent).toLocaleLowerCase())?.[1] || PALETTES[hash(club?.id) % PALETTES.length][1];
  return { accent, soft };
}

function tacticProfile(tactic = '') {
  if (/压迫/.test(tactic)) return { attack: '高位压迫', press: '压迫强度 · 高', width: '边路参与 · 中', tempo: '快速', line: '高位' };
  if (/反击/.test(tactic)) return { attack: '快速反击', press: '压迫强度 · 中', width: '纵向推进 · 强', tempo: '直接', line: '中低位' };
  if (/传中/.test(tactic)) return { attack: '边路传中', press: '压迫强度 · 中', width: '边路使用 · 高', tempo: '中速', line: '中位' };
  return { attack: /控球|渗透/.test(tactic) ? '控球推进' : '均衡推进', press: '压迫强度 · 中', width: '边路使用 · 中', tempo: '中速', line: '中位' };
}

function positionDuty(position) {
  return { GK: '高位站位 · 出球 · 禁区控制', ST: '禁区终结 · 前场压迫 · 背身支点', CF: '禁区终结 · 前场压迫 · 背身支点', LW: '内收推进 · 一对一 · 反抢', LM: '边路推进 · 回收防守 · 反抢', RW: '边路拉开 · 内切 · 反抢', RM: '边路推进 · 内切 · 反抢', CAM: '肋部接应 · 最后一传 · 反抢', SS: '肋部接应 · 禁区后插 · 反抢', CM: '攻守转换 · 节奏控制 · 接应', CDM: '保护防线 · 出球 · 拦截', LB: '套边推进 · 回收防守', LWB: '套边推进 · 回收防守', RB: '套边推进 · 回收防守', RWB: '套边推进 · 回收防守', CB: '防线站位 · 对抗 · 出球' }[position] || '攻守转换 · 接应';
}

function rosterPosition(position) {
  const direct = POSITION_ALIASES[position] || position;
  return Object.entries(POSITION_NAMES).find(([, name]) => name === direct)?.[0] || direct;
}

// Kept as a small compatibility seam for existing page audits and callers.
function selectedDetail(club, state, clubs, currentId, theme) { return clubProfile(club, state, clubs, currentId, theme); }
