import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRepo = 'FCLOGO/fclogo.top';
const sourceRef = 'main';
const proxy = process.env.CLUB_ASSET_PROXY || process.env.HTTPS_PROXY || '';
const curlProxy = /^https?:\/\//i.test(proxy) && !proxy.includes('__FILL_IN_') ? proxy : null;
const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

function encodedPath(value) { return value.split('/').map(encodeURIComponent).join('/'); }
function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    .replace(/\b(football|futbol|futebol|club|clube|association|sporting|deportivo|deportiva)\b/g, '')
    .replace(/\b(fc|cf|afc|sc|ac|ss|as|us|ud|rc|sd|bsc|vfb|sv|st|ca)\b/g, '')
    .replace(/[\s·•_\-.,'’&()（）]+/g, '');
}
function text(value) { return String(value || '').replace(/^['"]|['"]$/g, '').trim(); }
function slug(value) { return String(value || 'other').toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other'; }
function countrySlug(country) {
  return ({中国:'china',日本:'japan',韩国:'south-korea',英格兰:'england',西班牙:'spain',德国:'germany',意大利:'italy',法国:'france',荷兰:'netherlands',葡萄牙:'portugal',比利时:'belgium',苏格兰:'scotland',土耳其:'turkey',沙特阿拉伯:'saudi-arabia',美国:'usa',巴西:'brazil',阿根廷:'argentina',墨西哥:'mexico',澳大利亚:'australia',瑞士:'switzerland',奥地利:'austria',希腊:'greece',捷克:'czechia',克罗地亚:'croatia',塞尔维亚:'serbia',丹麦:'denmark',挪威:'norway',瑞典:'sweden',阿联酋:'uae',卡塔尔:'qatar',南非:'south-africa',波兰:'poland',罗马尼亚:'romania',乌克兰:'ukraine',哥伦比亚:'colombia',智利:'chile',乌拉圭:'uruguay'}[country] || slug(country));
}
function parseInfo(value) {
  const fields = {};
  for (const key of ['fullName', 'localName', 'shortName', 'city', 'founded']) {
    const match = String(value || '').match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'));
    if (match) fields[key] = text(match[1]);
  }
  return fields;
}
function sourceName(folder) { return folder.split('/').at(-1).replace(/^\d+_/, ''); }
function sourceAliases(folder, info) { return [sourceName(folder), info.fullName, info.localName, info.shortName].filter(Boolean); }

async function curl(url, { binary = false } = {}) {
  const args = ['--location', '--fail', '--silent', '--show-error', '--max-time', '30'];
  if (curlProxy) args.push('--proxy', curlProxy);
  if (githubToken && url.includes('api.github.com')) args.push('--header', `Authorization: Bearer ${githubToken}`);
  args.push(url);
  const result = await execFileAsync('curl.exe', args, { encoding: binary ? 'buffer' : 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return result.stdout;
}
async function pool(items, worker, concurrency = 8) {
  const output = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      try { output[index] = await worker(items[index], index); } catch { output[index] = null; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return output;
}

const clubsFile = JSON.parse(await fs.readFile(path.join(root, 'data', 'clubs.json'), 'utf8'));
const clubs = clubsFile.clubs || clubsFile;
const tree = JSON.parse(await curl(`https://api.github.com/repos/${sourceRepo}/git/trees/${sourceRef}?recursive=1`));
if (tree.truncated) throw new Error('源仓库树被 GitHub 截断，拒绝猜测资源映射');
const svgPaths = tree.tree.filter(item => item.type === 'blob' && item.path.includes('/clubs/') && item.path.includes('/svg/') && item.path.endsWith('.svg') && !['mono', 'line', 'kit', 'wordmark', 'icon', 'graph'].some(term => item.path.toLocaleLowerCase().includes(term)));
const folders = new Map();
for (const item of svgPaths) {
  const folder = item.path.split('/svg/')[0];
  const current = folders.get(folder) || [];
  current.push(item.path);
  folders.set(folder, current);
}
const candidates = [...folders.entries()].map(([folder, files]) => {
  const sorted = files.sort((a, b) => {
    const year = file => Number(file.match(/v(\d{4})/)?.[1] || 0);
    return year(b) - year(a) || a.length - b.length;
  });
  const infoFiles = tree.tree.filter(item => item.type === 'blob' && item.path.startsWith(`${folder}/info/`) && /\.ya?ml$/i.test(item.path));
  const infoPath = infoFiles.find(item => /\.zh-cn\.ya?ml$/i.test(item.path))?.path || infoFiles[0]?.path || null;
  return { folder, svgPath: sorted[0], infoPath };
});
const infoResults = await pool(candidates, async candidate => {
  if (!candidate.infoPath) return { ...candidate, info: {} };
  const raw = await curl(`https://raw.githubusercontent.com/${sourceRepo}/${sourceRef}/${encodedPath(candidate.infoPath)}`);
  return { ...candidate, info: parseInfo(raw) };
});
const usableCandidates = infoResults.filter(Boolean).map(candidate => ({ ...candidate, aliases: sourceAliases(candidate.folder, candidate.info) }));
const used = new Set();
function matchClub(club) {
  const aliases = [club.cn, club.en, club.native, club.name, club.code].filter(Boolean);
  const normalized = aliases.map(normalize).filter(value => value.length >= 3);
  let best = null;
  for (const candidate of usableCandidates) {
    if (used.has(candidate.folder)) continue;
    const candidateKeys = candidate.aliases.map(normalize).filter(value => value.length >= 3);
    let score = 0;
    for (const left of normalized) for (const right of candidateKeys) {
      if (left === right) score = Math.max(score, 100);
      else if (left.length >= 5 && right.length >= 5 && (left.includes(right) || right.includes(left))) score = Math.max(score, 78);
    }
    if (!best || score > best.score) best = { candidate, score };
  }
  if (!best || best.score < 90) return null;
  used.add(best.candidate.folder);
  return best.candidate;
}

const mappings = clubs.map(club => ({ club, candidate: matchClub(club) }));
const downloaded = await pool(mappings.filter(item => item.candidate), async ({ club, candidate }) => {
  const country = countrySlug(club.country);
  const relative = `assets/clubs/${country}/${slug(club.id)}.svg`;
  const destination = path.join(root, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const raw = await curl(`https://raw.githubusercontent.com/${sourceRepo}/${sourceRef}/${encodedPath(candidate.svgPath)}`, { binary: true });
  const svg = raw.toString('utf8').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '').replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  if (!/<svg\b/i.test(svg) || /(?:href|src)\s*=\s*["']https?:/i.test(svg)) throw new Error(`Unsafe SVG: ${club.id}`);
  await fs.writeFile(destination, svg, 'utf8');
  return { id: club.id, relative, candidate, sourceUrl: `https://github.com/${sourceRepo}/blob/${sourceRef}/${candidate.svgPath}` };
}, 8);
function wikimediaQuery(club) {
  const sourceNameValue = club.en && /[A-Za-z]{4}/.test(club.en) ? club.en : club.native || club.cn;
  return `${sourceNameValue} football club crest`;
}
function wikimediaTitleMatches(club, title) {
  const sourceNameValue = club.en && /[A-Za-z]{4}/.test(club.en) ? club.en : club.native || club.cn;
  const cleanTitle = normalize(title.replace(/^File:/i, ''));
  const cleanSource = normalize(sourceNameValue);
  if (cleanSource.length >= 5 && cleanTitle.includes(cleanSource.slice(0, Math.min(cleanSource.length, 12)))) return true;
  const cjk = String(sourceNameValue).match(/[\u3400-\u9fff]{2,}/g)?.join('') || '';
  return Boolean(cjk && cleanTitle.includes(normalize(cjk.slice(0, 4))));
}
const wikimediaDownloaded = await pool(mappings.filter(item => !item.candidate), async ({ club }) => {
  const query = wikimediaQuery(club);
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=256&format=json`;
  let payload;
  try { payload = JSON.parse(await curl(apiUrl)); } catch { return null; }
  const pages = Object.values(payload.query?.pages || {});
  const page = pages.find(item => wikimediaTitleMatches(club, item.title) && /\.(svg|png|webp)$/i.test(item.imageinfo?.[0]?.url || ''));
  const image = page?.imageinfo?.[0];
  if (!page || !image?.url) return null;
  const extension = image.mime === 'image/svg+xml' ? 'svg' : image.mime === 'image/webp' ? 'webp' : image.mime === 'image/png' ? 'png' : null;
  if (!extension) return null;
  const relative = `assets/clubs/${countrySlug(club.country)}/${slug(club.id)}.${extension}`;
  const destination = path.join(root, relative);
  try {
    const raw = await curl(image.url, { binary: true });
    if (extension === 'svg') {
      const svg = raw.toString('utf8').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '').replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
      if (!/<svg\b/i.test(svg) || /(?:href|src)\s*=\s*["']https?:/i.test(svg)) return null;
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, svg, 'utf8');
    } else {
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, raw);
    }
  } catch { return null; }
  const license = text(image.extmetadata?.LicenseShortName?.value || image.extmetadata?.UsageTerms?.value || 'Wikimedia Commons file license; verify per file');
  return { id: club.id, relative, sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`, rawUrl: image.url, license, candidate: { svgPath: '', info: {} } };
}, 4);
const wikiLanguage = { 中国: 'zh', 日本: 'ja', 韩国: 'ko', 巴西: 'pt', 阿根廷: 'es', 西班牙: 'es', 墨西哥: 'es', 哥伦比亚: 'es', 智利: 'es', 乌拉圭: 'es', 葡萄牙: 'pt', 法国: 'fr', 德国: 'de', 意大利: 'it', 荷兰: 'nl', 比利时: 'nl', 苏格兰: 'en', 英格兰: 'en' };
function wikipediaSearchName(club) { return club.en && /[A-Za-z]{4}/.test(club.en) ? club.en : club.native || club.cn; }
function wikipediaTitleMatches(club, title) {
  const wanted = normalize(wikipediaSearchName(club));
  const actual = normalize(title);
  return wanted.length >= 4 && (actual.includes(wanted) || wanted.includes(actual));
}
function extractWikipediaImage(raw) {
  const match = String(raw || '').match(/\|\s*(?:image|logo|crest|badge|徽标|队徽|標誌|ロゴ)\s*=\s*(?:\[\[)?(?:File:|文件:|Image:|图像:|ファイル:)?([^|\]\n]+?)(?:\]\])?(?:\n|$)/i);
  return text(match?.[1]).replace(/^[:：]/, '').trim();
}
const wikiAlready = new Set([...downloaded.filter(Boolean), ...wikimediaDownloaded.filter(Boolean)].map(item => item.id));
const wikipediaDownloaded = await pool(mappings.filter(item => !item.candidate && !wikiAlready.has(item.club.id)), async ({ club }) => {
  const language = wikiLanguage[club.country] || 'en';
  const searchUrl = `https://${language}.wikipedia.org/w/api.php?action=query&generator=search&gsrnamespace=0&gsrsearch=${encodeURIComponent(`${wikipediaSearchName(club)} football club`)}&gsrlimit=3&format=json`;
  let searchPayload;
  try { searchPayload = JSON.parse(await curl(searchUrl)); } catch { return null; }
  const pages = Object.values(searchPayload.query?.pages || {}).filter(page => wikipediaTitleMatches(club, page.title));
  for (const page of pages) {
    const contentUrl = `https://${language}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page.title)}&prop=revisions&rvprop=content&rvslots=main&format=json`;
    let contentPayload;
    try { contentPayload = JSON.parse(await curl(contentUrl)); } catch { continue; }
    const article = Object.values(contentPayload.query?.pages || {})[0];
    const content = article?.revisions?.[0]?.slots?.main?.['*'];
    const fileName = extractWikipediaImage(content);
    if (!fileName || !/\.(svg|png|webp)$/i.test(fileName)) continue;
    const fileTitle = fileName.startsWith('File:') || fileName.startsWith('文件:') ? fileName : `File:${fileName}`;
    const imageUrl = `https://${language}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|mime|extmetadata&format=json`;
    let imagePayload;
    try { imagePayload = JSON.parse(await curl(imageUrl)); } catch { continue; }
    const imagePage = Object.values(imagePayload.query?.pages || {})[0];
    const image = imagePage?.imageinfo?.[0];
    const extension = image?.mime === 'image/svg+xml' ? 'svg' : image?.mime === 'image/webp' ? 'webp' : image?.mime === 'image/png' ? 'png' : null;
    if (!image?.url || !extension) continue;
    const relative = `assets/clubs/${countrySlug(club.country)}/${slug(club.id)}.${extension}`;
    const destination = path.join(root, relative);
    try {
      const raw = await curl(image.url, { binary: true });
      await fs.mkdir(path.dirname(destination), { recursive: true });
      if (extension === 'svg') {
        const svg = raw.toString('utf8').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '').replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
        if (!/<svg\b/i.test(svg) || /(?:href|src)\s*=\s*["']https?:/i.test(svg)) continue;
        await fs.writeFile(destination, svg, 'utf8');
      } else await fs.writeFile(destination, raw);
    } catch { continue; }
    const license = text(image.extmetadata?.LicenseShortName?.value || image.extmetadata?.UsageTerms?.value || 'Wikipedia Commons file license; verify per file');
    return { id: club.id, relative, sourceUrl: page.fullurl || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`, rawUrl: image.url, license, candidate: { svgPath: '', info: {} } };
  }
  return null;
}, 4);
const downloadedById = new Map([...downloaded.filter(Boolean), ...wikimediaDownloaded.filter(Boolean), ...wikipediaDownloaded.filter(Boolean)].map(item => [item.id, item]));
const updated = clubs.map(club => {
  const item = downloadedById.get(club.id);
  const country = countrySlug(club.country);
  const metadata = item?.candidate?.info || {};
  const aliases = [...new Set([club.cn, club.en, club.native, metadata.fullName, metadata.localName, metadata.shortName].filter(Boolean))];
  return {
    ...club,
    nameZh: club.cn,
    nameEn: club.en || club.native || club.cn,
    aliases,
    countryNameZh: club.country,
    countryCode: club.id.slice(0, 3),
    city: metadata.city || (club.city === '未核实' ? null : club.city) || null,
    leagueNameZh: club.leagueCn,
    divisionLevel: Number(club.level || 1),
    crest: item ? `./${item.relative}` : club.crest || null,
    crestSource: item ? { repository: item.rawUrl?.includes('wikimedia.org') ? 'Wikimedia Commons' : sourceRepo, sourcePage: item.sourceUrl, rawUrl: item.rawUrl || `https://raw.githubusercontent.com/${sourceRepo}/${sourceRef}/${encodedPath(item.candidate.svgPath)}`, license: item.license || 'MIT repository license; club marks remain the property of their owners', downloadedAt: new Date().toISOString().slice(0, 10), converted: false, modified: false } : club.crestSource || null,
    dataSource: { ...(club.dataSource || {}), crest: item ? 'FCLOGO public SVG repository' : club.crest ? 'FCLOGO public SVG repository' : 'unmatched after FCLOGO metadata search' }
  };
});
clubsFile.clubs = updated;
await fs.writeFile(path.join(root, 'data', 'clubs.json'), `${JSON.stringify(clubsFile, null, 2)}\n`, 'utf8');
const manifestLines = ['# 球队队徽来源', '', `来源仓库：[${sourceRepo}](https://github.com/${sourceRepo})`, '许可：仓库 LICENSE 为 MIT；球队商标和识别性标志仍归各自权利人所有，本项目仅作游戏识别用途。', '', '| clubId | 文件 | 来源页面 | 状态 |', '| --- | --- | --- | --- |'];
for (const { club } of mappings) {
  const item = downloadedById.get(club.id) || (club.crest ? { relative: club.crest.replace(/^\.\//, ''), sourceUrl: club.crestSource?.sourcePage, candidate: { svgPath: '' } } : null);
  manifestLines.push(`| ${club.id} | ${item ? `\`${item.relative}\`` : '未匹配'} | ${item ? item.sourceUrl : '已完成源仓库和中文元数据匹配，未找到可确认文件'} | ${item ? '已下载 SVG' : '未匹配'} |`);
}
await fs.mkdir(path.join(root, 'docs', 'attribution'), { recursive: true });
await fs.writeFile(path.join(root, 'docs', 'attribution', 'clubs.md'), `${manifestLines.join('\n')}\n`, 'utf8');
const matchedIds = new Set([...downloadedById.keys(), ...clubs.filter(club => club.crest).map(club => club.id)]);
console.log(JSON.stringify({ status: 'PASS', sourceRepo, sourceFolders: candidates.length, clubs: clubs.length, matched: matchedIds.size, unmatched: clubs.length - matchedIds.size, unmatchedIds: clubs.filter(club => !matchedIds.has(club.id)).map(club => club.id) }, null, 2));
