const COUNTRY_FILES = {
  '中国': 'china', CN: 'china', '日本': 'japan', JP: 'japan', '韩国': 'south-korea', KR: 'south-korea',
  '英格兰': 'england', ENG: 'england', '苏格兰': 'scotland', SCT: 'scotland', '威尔士': 'wales', WLS: 'wales',
  '爱尔兰': 'ireland', IE: 'ireland', '法国': 'france', FR: 'france', '德国': 'germany', DE: 'germany',
  '西班牙': 'spain', ES: 'spain', '葡萄牙': 'portugal', PT: 'portugal', '意大利': 'italy', IT: 'italy',
  '荷兰': 'netherlands', NL: 'netherlands', '比利时': 'belgium', BE: 'belgium', '巴西': 'brazil', BR: 'brazil',
  '阿根廷': 'argentina', AR: 'argentina', '美国': 'usa', US: 'usa', '墨西哥': 'mexico', MX: 'mexico',
  '沙特阿拉伯': 'saudi-arabia', SA: 'saudi-arabia', '土耳其': 'turkey', TR: 'turkey', '尼日利亚': 'nigeria', NG: 'nigeria',
  '加纳': 'ghana', GH: 'ghana', '塞内加尔': 'senegal', SN: 'senegal', '摩洛哥': 'morocco', MA: 'morocco', '埃及': 'egypt', EG: 'egypt'
};
const NEIGHBORS = { 中国: ['日本', '韩国'], 日本: ['韩国', '中国'], 韩国: ['日本', '中国'], 英格兰: ['苏格兰', '威尔士'], 巴西: ['阿根廷', '葡萄牙'], 阿根廷: ['巴西', '西班牙'], 西班牙: ['葡萄牙', '法国'], 葡萄牙: ['西班牙', '巴西'], 德国: ['荷兰', '法国'], 法国: ['比利时', '德国'], 意大利: ['法国', '德国'] };

function hash(seed) { let value = 2166136261; for (const char of String(seed || '')) value = Math.imul(value ^ char.codePointAt(0), 16777619); return value >>> 0; }
function rng(seed) { let state = hash(seed); return () => ((state = Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296; }
function pick(list, random) { return list[Math.floor(random() * list.length)] || ''; }
function fileFor(country) { return COUNTRY_FILES[country] || 'other'; }
function weightedPick(list, random) { const entries = list.map(value => typeof value === 'string' ? { value, weight: 1 } : { value: value.name, weight: Number(value.weight || 1) }); const total = entries.reduce((sum, item) => sum + item.weight, 0); let roll = random() * total; return entries.find(item => (roll -= item.weight) <= 0)?.value || entries.at(-1)?.value || ''; }

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
export function generatePlayerName(countryCode, seed = 'player', profiles = {}) {
  const profile = profiles[fileFor(countryCode)] || profiles.other || { givenNamesMale: ['Alex'], familyNames: ['Morgan'], nameOrder: 'given-family', separator: ' ' };
  const random = rng(`${seed}|name|${countryCode}`);
  const parts = { givenName: weightedPick(profile.givenNamesMale, random), familyName: weightedPick(profile.familyNames, random) };
  return { ...parts, displayName: formatPlayerName(parts, profile), nickname: generateFootballNickname(countryCode, seed, profiles), countryCode: profile.countryCode, locale: profile.locale };
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
  const nearby = new Set(NEIGHBORS[nation] || []);
  const local = clubs.filter(club => club.country === nation).sort((a, b) => scoreClub(b, playerProfile) - scoreClub(a, playerProfile));
  const eligible = local.filter(club => evaluateClubFit(playerProfile, club).eligible);
  const localPool = [...eligible, ...local.filter(club => !eligible.includes(club))].slice(0, 5);
  const localOffers = localPool.map((club, index) => offer(club, index === 0 ? '家乡球队' : Number(club.rep || club.reputation) >= 80 ? '强队青训' : '本国青训', playerProfile, index === 0));
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
  const eligible = score >= required;
  const reasons = [need ? '该位置有明确需求' : '需要竞争现有位置', potential >= 86 ? '潜力符合重点培养标准' : '潜力处于常规观察范围', local ? '不占外援适应名额' : '需要额外评估注册与适应'];
  return { score, required, eligible, reasons, role: age <= 19 ? score >= required + 12 ? '一线队轮换观察' : '青年队培养' : score >= required + 10 ? '轮换球员' : '阵容竞争' };
}
function offer(club, type, profile, home = false) { const fit = evaluateClubFit(profile, club); const reason = `${home ? '本地培养关系稳定；' : ''}${fit.reasons.join('；')}。综合 ${fit.score}，门槛 ${fit.required}。`; return { clubId: club.id, club, type, reason, eligible: fit.eligible, score: fit.score, required: fit.required, requirements: fit.reasons, positionFit: fit.reasons[0], squad: fit.role, contract: `${Math.max(1, Math.round((club.youth || 60) / 25))}年`, weeklyWage: Math.max(100, Math.round(100 + Number(club.finance || 60) * 4)), adaptationRisk: type === '海外球探机会' ? '中等' : '低' }; }

export { COUNTRY_FILES, fileFor };
