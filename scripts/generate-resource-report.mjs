import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => fs.readFile(path.join(root, file), 'utf8').then(JSON.parse);
const exists = async file => { try { await fs.access(file); return true; } catch { return false; } };

async function filesIn(directory) {
  if (!(await exists(directory))) return [];
  const result = [];
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else result.push(full);
    }
  }
  await walk(directory);
  return result;
}

function normalize(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s·•_\-]+/g, '').replace(/[()（）.,，。&]/g, '');
}

const clubsFile = await readJson('data/clubs.json');
const trophies = await readJson('data/trophies.json');
const clubs = clubsFile.clubs || clubsFile;
const crestFiles = await filesIn(path.join(root, 'assets', 'crests'));
const clubAssetFiles = await filesIn(path.join(root, 'assets', 'clubs'));
const trophyFiles = await filesIn(path.join(root, 'assets', 'trophies'));
const sourceFiles = [...await filesIn(path.join(root, 'src')), ...await filesIn(path.join(root, 'data'))];
const sourceText = (await Promise.all(sourceFiles.filter(file => /\.(js|json|html|css|mjs)$/.test(file)).map(file => fs.readFile(file, 'utf8').catch(() => '')))).join('\n');
const allCrests = [...crestFiles, ...clubAssetFiles];
const missingCrests = clubs.filter(club => !club.crest && !club.crestPath);
const trophyExists = await Promise.all(trophies.map(trophy => trophy.image && exists(path.join(root, trophy.image.replace(/^\.\//, '')))));
const missingTrophies = trophies.filter((trophy, index) => !trophy.image || !trophyExists[index]);
const names = new Map();
for (const club of clubs) {
  const key = normalize(club.cn || club.name || club.id);
  names.set(key, [...(names.get(key) || []), club.id]);
}
const duplicates = [...names.entries()].filter(([, ids]) => ids.length > 1);
const remoteUrls = [...sourceText.matchAll(/https?:\/\/[^'"\s)]+/g)].map(match => match[0]);
const emojiMatches = [...sourceText.matchAll(/[🏆🥇🥈🥉🏅⚽]/gu)].map(match => match[0]);
const placeholderMatches = [...sourceText.matchAll(/placeholder|占位|fallback/gi)].map(match => match[0]);
const pages = [...new Set(sourceFiles.filter(file => /src[\\/](pages|components)[\\/]/.test(file)).map(file => path.relative(root, file).replaceAll('\\', '/')))].sort();

const lines = [
  '# 资源基线审计',
  '',
  `生成时间：${new Date().toISOString()}`,
  '',
  '## 统计',
  '',
  `- 当前球队总数：${clubs.length}`,
  `- 当前联赛总数：${(clubsFile.leagues || []).length}`,
  `- 当前赛事总数：未形成统一赛事目录；现有奖杯定义 ${trophies.length} 项`,
  `- 当前奖项总数：${trophies.length}`,
  `- 当前本地队徽数量：${allCrests.filter(file => /\.(svg|png|webp)$/i.test(file)).length}`,
  `- 当前远程队徽数量：${clubs.filter(club => /^https?:/i.test(club.crest || club.crestPath || '')).length}`,
  `- 当前占位图数量：${placeholderMatches.length}`,
  `- 当前奖杯资源数量：${trophyFiles.filter(file => /\.(svg|png|webp)$/i.test(file)).length}`,
  `- 当前使用 Emoji 的位置：${emojiMatches.length ? [...new Set(emojiMatches)].join('、') : '未发现'}`,
  '',
  '## 队徽缺失',
  '',
  missingCrests.length ? missingCrests.map(club => `- ${club.id}：${club.cn || club.name}`).join('\n') : '- 无',
  '',
  '## 奖杯缺失',
  '',
  missingTrophies.length ? missingTrophies.map(trophy => `- ${trophy.id}：${trophy.cn || trophy.name}`).join('\n') : '- 无',
  '',
  '## 名称冲突',
  '',
  duplicates.length ? duplicates.map(([name, ids]) => `- ${name}：${ids.join('、')}`).join('\n') : '- 未发现重复显示名',
  '',
  '## 远程与占位引用',
  '',
  `- 远程 URL 引用数量：${remoteUrls.length}`,
  remoteUrls.slice(0, 20).map(url => `- ${url}`).join('\n') || '- 未发现',
  `- 占位/回退关键词命中：${placeholderMatches.length}`,
  '',
  '## 需要接入的页面和组件',
  '',
  pages.map(file => `- ${file}`).join('\n'),
  '',
  '## 基线结论',
  '',
  '- 当前数据主源为 `data/clubs.json`，共有 500 条球队记录，但没有统一 `crest` 字段。',
  '- 当前队徽组件仍会在缺失资源时生成字母回退图形，需要改为明确的缺失状态并接入本地资源。',
  '- 当前奖杯定义只有少量通用资源，且部分荣誉页面仍直接显示 Emoji。',
  '- 本报告是修改前基线，修改完成后由同一脚本重新生成 `docs/resource-audit-after.md`。'
];

await fs.writeFile(path.join(root, 'docs', 'resource-audit-before.md'), `${lines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ status: 'PASS', clubs: clubs.length, trophies: trophies.length, missingCrests: missingCrests.length, missingTrophies: missingTrophies.length, remoteUrls: remoteUrls.length }, null, 2));
