import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleUrl = 'https://legendevo.com/assets/localization-JORQmOXk.js';
const trophyBaseUrl = 'https://legendevo.com/assets/honours/icons';
const trophyIds = [
  'ballon-dor','golden-boot','playmaker','best-midfielder','best-defender','golden-glove','young-player','player-of-year',
  'liga-mx','bundesliga','brasileirao','premier-league','laliga','liga-profesional','ligue-1','serie-a','copa-de-primera','liga-bolivia','liga-de-primera','liga-dimayor','liga-futve','liga-uruguaya','liga1','ligapro-serie-a','2-bundesliga','championship','laliga-2','ligue-2','serie-b','primera-nacional','usa-mls',
  'arg-copa-argentina','bol-copa-bolivia','bra-copa-do-brasil','chi-copa-chile','col-copa-colombia','ecu-copa-ecuador','eng-fa-cup','esp-copa-del-rey','fra-coupe-de-france','ger-dfb-pokal','ita-coppa-italia','mex-copa-mx','par-copa-paraguay','uru-copa-uruguay','usa-us-open','ven-copa-venezuela',
  'world-cup','club-world-cup','champions-league','libertadores','concacaf-champions','afc-champions-elite','caf-champions','ofc-champions','europa-league','conference-league','euro','copa-america','gold-cup','afcon','asian-cup','ofc-nations'
];

const normalize = value => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '');
const names = club => [club.cn, club.name, club.nameZh, club.native, club.en, club.nameEn, ...(club.aliases || [])].filter(Boolean);
const countryCode = club => String(club.countryCode || club.country_fifa_code || '').toUpperCase();
const score = (legacy, current, zhName) => {
  if (countryCode(current) && countryCode(current) !== legacy.country_fifa_code) return 0;
  const left = [zhName, legacy.name, legacy.short_name, legacy.abbreviation].map(normalize).filter(Boolean);
  const right = names(current).map(normalize).filter(Boolean);
  if (left.some(value => right.includes(value))) return 100;
  if (left.some(a => a.length >= 5 && right.some(b => b.length >= 5 && (a.includes(b) || b.includes(a))))) return 70;
  return 0;
};
const rating = legacy => Math.max(50, Math.min(92, 48 + Number(legacy.domestic_reputation || 1) * 9 + Number(legacy.continental_reputation || 1) * 2));
const fetchOk = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
};
async function download(url, target) {
  const body = Buffer.from(await (await fetchOk(url)).arrayBuffer());
  if (!body.length) throw new Error(`Empty asset: ${url}`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body);
}
async function batches(items, size, task) {
  for (let index = 0; index < items.length; index += size) await Promise.all(items.slice(index, index + size).map(task));
}

const source = await (await fetchOk(bundleUrl)).text();
const legacy = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const base = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs.json'), 'utf8'));
const expansion = JSON.parse(await fs.readFile(path.join(root, 'data', 'world-expansion.json'), 'utf8'));
const currentClubs = [...(base.clubs || base), ...(expansion.clubs || [])];
const currentLeagues = [...(base.leagues || []), ...(expansion.leagues || [])];
const aliases = {};
const importedClubs = [];
const importedLeagues = [];

for (const club of legacy.o) {
  const zhName = legacy.b(club.id);
  const candidates = currentClubs.map(current => ({ current, score: score(club, current, zhName) })).filter(item => item.score).sort((a, b) => b.score - a.score);
  if (candidates[0] && (!candidates[1] || candidates[0].score > candidates[1].score)) {
    aliases[club.id] = candidates[0].current.id;
    continue;
  }
  const rep = rating(club);
  importedClubs.push({
    id: `legacy-${club.id}`, code: club.abbreviation, cn: zhName, nameZh: zhName, name: club.name, nameEn: club.name, native: club.name,
    aliases: [club.short_name, club.abbreviation].filter(Boolean), country: legacy.c(club.country_fifa_code), countryCode: club.country_fifa_code,
    leagueId: `legacy-${club.league_id}`, league: legacy.l(club.league_id), leagueCn: legacy.l(club.league_id), level: Number(club.tier) || 1,
    rep, reputation: rep, attack: rep, defense: rep, youth: Math.max(48, rep - 2), finance: rep, youthUsage: 55,
    crest: `./assets/clubs/legendevo/${club.id}.svg`, isReal: true,
    dataSource: { identity: 'LegendEvo legacy club catalog', sourceName: 'LegendEvo', sourceReference: `https://legendevo.com/#club-${club.id}`, verified: true },
    legacy: { id: club.id, leagueId: club.league_id, logoUrl: club.logo_url, primaryColor: club.primary_color, confederation: club.confederation }
  });
}

for (const league of legacy.L.values()) {
  const id = `legacy-${league.id}`;
  if (!currentLeagues.some(item => item.id === id)) importedLeagues.push({ id, cn: legacy.l(league.id), native: league.name || league.id, country: legacy.c(league.country_fifa_code), countryCode: league.country_fifa_code, level: Number(league.tier) || 1, isReal: true });
}

const sourceClubs = legacy.o.map(club => ({ ...club, name_zh: legacy.b(club.id), league_name_zh: legacy.l(club.league_id), country_name_zh: legacy.c(club.country_fifa_code), currentClubId: aliases[club.id] || `legacy-${club.id}` }));
await batches(importedClubs, 12, club => download(club.legacy.logoUrl, path.join(root, club.crest.replace(/^\.\//, ''))));
await batches(trophyIds, 12, id => download(`${trophyBaseUrl}/${id}.webp`, path.join(root, 'assets', 'trophies', 'legendevo', `${id}.webp`)));

await fs.writeFile(path.join(root, 'data', 'legendevo-clubs.json'), JSON.stringify({ source: bundleUrl, importedAt: new Date().toISOString(), sourceCount: sourceClubs.length, aliases, sourceClubs, clubs: importedClubs, leagues: importedLeagues }, null, 2));
await fs.writeFile(path.join(root, 'data', 'legendevo-trophies.json'), JSON.stringify(trophyIds.map(id => ({ id: `legendevo-${id}`, cn: id, native: id, image: `assets/trophies/legendevo/${id}.webp`, isReal: true, dataSource: { identity: 'LegendEvo legacy honor catalog', sourceName: 'LegendEvo', sourceReference: `${trophyBaseUrl}/${id}.webp`, verified: true } })), null, 2));
console.log(JSON.stringify({ status: 'PASS', sourceClubs: sourceClubs.length, matched: Object.keys(aliases).length, imported: importedClubs.length, leagues: importedLeagues.length, trophies: trophyIds.length }));
