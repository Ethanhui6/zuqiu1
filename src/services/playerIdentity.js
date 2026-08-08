const COUNTRY_FILES = {
  '中国': 'china', CN: 'china', '日本': 'japan', JP: 'japan', '韩国': 'south-korea', KR: 'south-korea',
  '英格兰': 'england', ENG: 'england', '苏格兰': 'scotland', SCT: 'scotland', '威尔士': 'wales', WLS: 'wales',
  '爱尔兰': 'ireland', IE: 'ireland', '法国': 'france', FR: 'france', '德国': 'germany', DE: 'germany',
  '西班牙': 'spain', ES: 'spain', '葡萄牙': 'portugal', PT: 'portugal', '意大利': 'italy', IT: 'italy',
  '荷兰': 'netherlands', NL: 'netherlands', '比利时': 'belgium', BE: 'belgium', '巴西': 'brazil', BR: 'brazil',
  '阿根廷': 'argentina', AR: 'argentina', '美国': 'usa', US: 'usa', '墨西哥': 'mexico', MX: 'mexico',
  '越南': 'vietnam', VN: 'vietnam', '泰国': 'thailand', TH: 'thailand',
  '沙特阿拉伯': 'saudi-arabia', SA: 'saudi-arabia', '土耳其': 'turkey', TR: 'turkey', '尼日利亚': 'nigeria', NG: 'nigeria',
  '加纳': 'ghana', GH: 'ghana', '塞内加尔': 'senegal', SN: 'senegal', '摩洛哥': 'morocco', MA: 'morocco', '埃及': 'egypt', EG: 'egypt'
};
const NEIGHBORS = { 中国: ['日本', '韩国'], 日本: ['韩国', '中国'], 韩国: ['日本', '中国'], 英格兰: ['苏格兰', '威尔士'], 巴西: ['阿根廷', '葡萄牙'], 阿根廷: ['巴西', '西班牙'], 西班牙: ['葡萄牙', '法国'], 葡萄牙: ['西班牙', '巴西'], 德国: ['荷兰', '法国'], 法国: ['比利时', '德国'], 意大利: ['法国', '德国'] };
const ORIGIN_REGIONS = {
  中国: '东亚', 日本: '东亚', 韩国: '东亚', 英格兰: '欧洲', 西班牙: '欧洲', 葡萄牙: '欧洲', 法国: '欧洲', 德国: '欧洲', 意大利: '欧洲', 荷兰: '欧洲', 比利时: '欧洲', 土耳其: '欧洲',
  巴西: '南美洲', 阿根廷: '南美洲', 美国: '北美洲', 墨西哥: '北美洲', 越南: '东南亚', 泰国: '东南亚', 沙特阿拉伯: '西亚', 尼日利亚: '非洲', 加纳: '非洲', 塞内加尔: '非洲', 摩洛哥: '非洲', 埃及: '非洲'
};
const STARTING_COUNTRY_FALLBACKS = { 越南: '泰国', 尼日利亚: '南非', 加纳: '南非', 塞内加尔: '南非', 摩洛哥: '南非', 埃及: '卡塔尔' };
const DEFAULT_NAME_PROFILE = { countryCode: 'OTHER', locale: 'en-US', givenNamesMale: ['Alex','Sam','Noah','Leo','Milan','Kai','Daniel','Adam'], familyNames: ['Morgan','Taylor','Lee','Martin','Silva','Novak','Wilson','Bennett'], nameOrder: 'given-family', separator: ' ' };
export const CLUB_ENTRY_ROUTES = Object.freeze({
  DIRECT_CONTRACT: { label: '直接职业合同', squad: '一线队直接合同', contract: '职业合同' },
  ACADEMY: { label: '青训录取', squad: 'U18青训重点培养', contract: '青训合同' },
  TRIAL: { label: '试训邀请', squad: '季前试训名单', contract: '试训协议' },
  SCOUT_WATCH: { label: '球探观察', squad: '球探观察名单', contract: '观察期4周' },
  RESERVE_TEAM: { label: '预备队合同', squad: '预备队培养', contract: '预备队合同' },
  LOAN_DEVELOPMENT: { label: '租借培养', squad: '签约后租借培养', contract: '培养合同' },
  REJECTED: { label: '暂不接纳', squad: '继续发展后再评估', contract: '暂无方案' }
});

function hash(seed) { let value = 2166136261; for (const char of String(seed || '')) value = Math.imul(value ^ char.codePointAt(0), 16777619); return value >>> 0; }
function rng(seed) { let state = hash(seed); return () => ((state = Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296; }
function pick(list, random) { return list[Math.floor(random() * list.length)] || ''; }
function fileFor(country) { return COUNTRY_FILES[country] || 'other'; }
function weightedPick(list, random) { const entries = list.map(value => typeof value === 'string' ? { value, weight: 1 } : { value: value.name, weight: Number(value.weight || 1) }); const total = entries.reduce((sum, item) => sum + item.weight, 0); let roll = random() * total; return entries.find(item => (roll -= item.weight) <= 0)?.value || entries.at(-1)?.value || ''; }

const CHINA_FAMILY_EXTRA = '王李张刘陈杨黄赵周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段钱汤尹黎易常武乔贺赖龚文'.split('');
const CHINA_GIVEN_EXTRA = '天宇浩然子轩嘉豪明哲俊杰思远博文家伟志远晨阳泽凯文昊俊驰修远安邦子涵雨泽亦凡承恩景行知远书言宏远云帆启航星河远航'.split('');
function chinaPools(profile) {
  const baseFamilyNames = profile.familyNames || [];
  const baseGivenNames = profile.givenNamesMale || [];
  if (baseFamilyNames.length < 2 || baseGivenNames.length < 2) return { familyNames: baseFamilyNames, givenNames: baseGivenNames };
  const familyNames = [...new Set([...baseFamilyNames, ...CHINA_FAMILY_EXTRA])];
  const chars = [...new Set(CHINA_GIVEN_EXTRA)];
  const givenNames = [...baseGivenNames];
  for (const first of chars) for (const second of chars) if (first !== second) givenNames.push(`${first}${second}`);
  return { familyNames, givenNames: [...new Set(givenNames)] };
}
function expandedPools(profile) {
  const separator = profile.separator ?? ' ';
  const givenBase = (profile.givenNamesMale || []).map(value => typeof value === 'string' ? value : value.name).filter(Boolean);
  const familyBase = (profile.familyNames || []).map(value => typeof value === 'string' ? value : value.name).filter(Boolean);
  if (givenBase.length < 2 || familyBase.length < 2) return { givenNames: givenBase, familyNames: familyBase };
  if (profile.nameOrder === 'family-given' && !separator) return { givenNames: givenBase, familyNames: familyBase };
  const givenNames = givenBase.map(name => ({ name, weight: 8 }));
  for (const first of givenBase) for (const second of givenBase) if (first !== second) givenNames.push({ name: `${first}${separator}${second}`, weight: 3 });
  for (const first of givenBase) for (const second of givenBase) for (const third of givenBase) if (first !== second && second !== third && first !== third) givenNames.push({ name: `${first}${separator}${second}${separator}${third}`, weight: .25 });
  return { givenNames, familyNames: familyBase };
}
function chineseParts(profile, random) {
  const pools = chinaPools(profile);
  for (let attempt = 0; attempt < 12; attempt++) {
    const familyName = weightedPick(pools.familyNames, random);
    const givenName = weightedPick(pools.givenNames, random);
    if (givenName && givenName[0] !== familyName && !/^(.).?\1$/.test(givenName)) return { givenName, familyName };
  }
  return { givenName: pools.givenNames[0] || '天佑', familyName: pools.familyNames[0] || '王' };
}

export function formatPlayerName({ givenName = '', familyName = '' } = {}, profile = {}) {
  const order = profile.nameOrder || 'given-family';
  const separator = profile.separator ?? ' ';
  return order === 'family-given' ? `${familyName}${separator}${givenName}`.trim() : `${givenName}${separator}${familyName}`.trim();
}
export function generateFootballNickname(countryCode, seed, profiles = {}) {
  const profile = profiles[fileFor(countryCode)] || profiles.other;
  if (!profile?.nicknameRules?.length) return '';
  return pick(['小将', '闪电', '猎鹰', '新星', 'The Kid'], rng(`${seed}|nickname|${countryCode}`));
}
function buildPlayerName(countryCode, seed = 'player', profiles = {}) {
  const profile = profiles[fileFor(countryCode)] || profiles.other || DEFAULT_NAME_PROFILE;
  const random = rng(`${seed}|name|${countryCode}`);
  const pools = fileFor(countryCode) === 'china' ? chinaPools(profile) : expandedPools(profile);
  const parts = fileFor(countryCode) === 'china' ? chineseParts(profile, random) : { givenName: weightedPick(pools.givenNames, random), familyName: weightedPick(pools.familyNames, random) };
  return { ...parts, displayName: formatPlayerName(parts, profile), nickname: generateFootballNickname(countryCode, seed, profiles), countryCode: profile.countryCode, locale: profile.locale };
}
export class LocalizedNameGenerator {
  constructor(profiles = {}) { this.profiles = profiles; }
  generate(countryCode, seed = 'player') { return buildPlayerName(countryCode, seed, this.profiles); }
  generateUnique(countryCode, seed, reserved = new Set()) {
    for (let attempt = 0; attempt < 4096; attempt++) {
      const identity = this.generate(countryCode, `${seed}|unique|${attempt}`);
      if (!reserved.has(identity.displayName)) { reserved.add(identity.displayName); return identity; }
    }
    throw new Error(`姓名池已耗尽：${countryCode}`);
  }
}
export function generatePlayerName(countryCode, seed = 'player', profiles = {}) { return new LocalizedNameGenerator(profiles).generate(countryCode, seed); }
export function createPlayerOriginProfile(nationality, worldState = {}) {
  const clubs = worldState.clubs || [], nameProfile = worldState.nameProfiles?.[fileFor(nationality)] || worldState.nameProfiles?.other || {};
  const localClubs = clubs.filter(club => club.country === nationality);
  const preferredFallback = STARTING_COUNTRY_FALLBACKS[nationality];
  const fallbackCountry = clubs.some(club => club.country === preferredFallback) ? preferredFallback : clubs[0]?.country || nationality;
  const startingCountry = localClubs.length ? nationality : fallbackCountry;
  const startingClubs = localClubs.length ? localClubs : clubs.filter(club => club.country === startingCountry);
  return {
    nationality,
    nameLocale: nameProfile.locale || 'en-US',
    startingCountry,
    startingLeaguePool: [...new Set(startingClubs.map(club => club.leagueId || club.leagueCn || club.league).filter(Boolean))],
    startingClubPool: startingClubs.map(club => club.id),
    region: ORIGIN_REGIONS[nationality] || '国际',
    language: String(nameProfile.locale || 'en-US').split('-')[0]
  };
}
export function validatePlayerName(input) {
  const value = String(input ?? '').trim();
  if (!value) return { valid: true, empty: true, value: '' };
  if (value.length > 24) return { valid: false, empty: false, value, error: '姓名不能超过24个字符' };
  if (!/[\p{L}\p{N}\u3400-\u9fff]/u.test(value) || /[^\p{L}\p{M}\p{N}\u3400-\u9fff .·'’-]/u.test(value)) return { valid: false, empty: false, value, error: '姓名包含不支持的字符' };
  return { valid: true, empty: false, value };
}
export function generateStartingClubOffers(playerProfile, worldState = {}, seed = 'career') {
  const clubs = worldState.clubs || [];
  const nation = playerProfile.country || playerProfile.nation || playerProfile.countryName;
  const position = playerProfile.position;
  const originProfile = playerProfile.originProfile?.nationality === nation ? playerProfile.originProfile : createPlayerOriginProfile(nation, worldState);
  const startingClubIds = new Set(originProfile.startingClubPool);
  const nearby = new Set(NEIGHBORS[nation] || []);
  const local = clubs.filter(club => startingClubIds.size ? startingClubIds.has(club.id) : club.country === nation).sort((a, b) => scoreClub(b, playerProfile) - scoreClub(a, playerProfile));
  const eligible = local.filter(club => evaluateClubFit(playerProfile, club).eligible);
  const localPool = [...eligible, ...local.filter(club => !eligible.includes(club))].slice(0, 5);
  const localOffers = localPool.map((club, index) => { const home = club.country === nation; return offer(club, home && index === 0 ? '家乡球队' : home ? Number(club.rep || club.reputation) >= 80 ? '强队青训' : '本国青训' : '区域青训通道', playerProfile, home && index === 0); });
  if (localOffers.length >= 3) return localOffers.slice(0, 5);
  const related = clubs.filter(club => nearby.has(club.country) && !local.some(item => item.id === club.id)).sort((a, b) => scoreClub(b, playerProfile) - scoreClub(a, playerProfile));
  const result = [...localOffers, ...related.slice(0, 3 - localOffers.length).map(club => offer(club, '邻近青训项目', playerProfile))];
  if (result.length < 3) result.push(...clubs.filter(club => !result.some(item => item.clubId === club.id)).slice(0, 3 - result.length).map(club => offer(club, '海外球探机会', playerProfile)));
  return result.slice(0, 5);
}

function scoreClub(club, profile) { return Number(club.youth || club.youthUsage || 0) * .5 + Number(club.opportunity || club.youthUsage || 0) * .3 + (club.needs || []).includes(profile.position) * 20 + (club.city && profile.birthplace && club.city === profile.birthplace ? 16 : 0) - Number(club.rep || club.reputation || 0) * .05; }
export function evaluateClubFit(profile, club) {
  const ovr = Number(profile.ovr || 55), potential = Number(profile.potential || ovr + 12), age = Number(profile.age || 16), rep = Number(club.rep || club.reputation || 60);
  const need = (club.needs || []).includes(profile.position), local = !profile.country && !profile.nation || club.country === (profile.country || profile.nation);
  const recent = Number(profile.recentRating || profile.rating || 6.5);
  const score = Math.round(ovr * .58 + potential * .24 + Math.max(0, 19 - age) * 2 + (need ? 7 : 0) + Math.max(-3, recent - 6.5) * 3);
  const required = Math.round(rep - 8 + (local ? 0 : 4));
  const entryRoute = score >= required - 2 && ovr >= 82 ? 'DIRECT_CONTRACT'
    : age <= 18 && potential >= 88 ? 'ACADEMY'
    : age <= 20 && potential >= 84 && score >= required - 25 ? 'TRIAL'
    : age <= 18 && potential >= 80 ? 'SCOUT_WATCH'
    : score >= required - 12 ? 'RESERVE_TEAM'
    : age <= 22 && potential >= 80 && score >= required - 24 ? 'LOAN_DEVELOPMENT'
    : 'REJECTED';
  const entry = CLUB_ENTRY_ROUTES[entryRoute],eligible=entryRoute!=='REJECTED';
  const reasons = [need ? '该位置有明确需求' : '需要竞争现有位置', potential >= 86 ? '潜力符合重点培养标准' : '潜力处于常规观察范围', local ? '不占外援适应名额' : '需要额外评估注册与适应', eligible?`当前入口：${entry.label}`:'当前能力与潜力组合尚无可行入口'];
  return { score, required, eligible, entryRoute, entryLabel:entry.label, reasons, role:entry.squad, contractType:entry.contract };
}
function offer(club, type, profile, home = false) { const fit = evaluateClubFit(profile, club); const years=Math.max(1,Math.round((club.youth||60)/25));const reason = `${home ? '本地培养关系稳定；' : type === '区域青训通道' ? '本国联赛数据暂缺，由同区域合作项目提供入口；' : ''}${fit.reasons.join('；')}。综合 ${fit.score}，门槛 ${fit.required}。`; return { clubId: club.id, club, type, reason, eligible: fit.eligible, entryRoute:fit.entryRoute, entryLabel:fit.entryLabel, score: fit.score, required: fit.required, requirements: fit.reasons, positionFit: fit.reasons[0], squad: fit.role, contract: fit.entryRoute==='REJECTED'?fit.contractType:`${fit.contractType} · ${years}年`, weeklyWage: fit.entryRoute==='SCOUT_WATCH'?0:Math.max(100,Math.round(100+Number(club.finance||60)*4)), adaptationRisk: ['海外球探机会','区域青训通道'].includes(type) ? '中等' : '低' }; }

export { COUNTRY_FILES, fileFor };
