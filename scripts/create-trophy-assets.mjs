import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'assets', 'trophies');
const trophies = {
  'premier-league': ['英超冠军', '#2f86c1', 'ball'], 'fa-cup': ['足总杯', '#b9782f', 'handles'], 'league-cup': ['联赛杯', '#3b9b7d', 'wide'], 'la-liga': ['西甲冠军', '#d75d48', 'crown'], 'bundesliga': ['德甲冠军', '#c23e4f', 'wide'], 'serie-a': ['意甲冠军', '#4d7db8', 'ball'], 'ligue-1': ['法甲冠军', '#8256a6', 'handles'], europa: ['欧联杯', '#d39a33', 'crown'], afc: ['亚冠冠军', '#3f8d91', 'ball'], euros: ['欧洲杯', '#5e73c4', 'crown'], 'copa-america': ['美洲杯', '#5d9a73', 'handles'], 'asian-cup': ['亚洲杯', '#b56d44', 'wide'], 'best-keeper': ['最佳门将', '#72a9c0', 'keeper'], 'assists-king': ['助攻王', '#b99542', 'slim'], 'best-xi': ['最佳阵容', '#746ca5', 'wide']
};
Object.assign(trophies, {
  'league-title': ['League Title', '#2f86c1', 'crown'], 'domestic-cup': ['Domestic Cup', '#b9782f', 'handles'], 'continental-title': ['Continental Title', '#586dc2', 'crown'], 'golden-glove': ['Golden Glove', '#72a9c0', 'keeper'], 'best-defender': ['Best Defender', '#4f8e77', 'wide'], 'young-player': ['Young Player', '#746ca5', 'ball'], 'player-of-season': ['Player of Season', '#b99542', 'slim'], 'world-player': ['World Player', '#936b2b', 'crown'],
  'thai-league': ['泰国顶级联赛冠军', '#29684f', 'crown'], 'hungarian-league': ['匈牙利顶级联赛冠军', '#c43d45', 'handles'], 'ecuadorian-league': ['厄瓜多尔顶级联赛冠军', '#efb72d', 'ball']
});
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
function art(id, [label, accent, shape]) {
  const body = shape === 'ball' ? '<circle cx="80" cy="48" r="16" fill="#f7e4a8"/><path d="M80 32l10 8-4 12H74l-4-12z" fill="#fff" opacity=".8"/>' : shape === 'keeper' ? '<path d="M63 32c-12 5-15 16-9 25l12 9 14-9c6-9 3-20-9-25z" fill="#e9f8ff"/><path d="M58 38l-7-8m21 2 8-10" stroke="#72a9c0" stroke-width="5" stroke-linecap="round"/>' : shape === 'handles' ? '<path d="M48 32c-18-2-22-10-22-15h10c0 5 4 8 12 8m64 7c18-2 22-10 22-15h-10c0 5-4 8-12 8" fill="none" stroke="#f7e4a8" stroke-width="6" stroke-linecap="round"/>' : shape === 'crown' ? '<path d="m52 30 10 14 18-20 18 20 10-14-4 42H56z" fill="#f7e4a8"/>' : shape === 'slim' ? '<path d="M67 25h26l-4 58H71z" fill="#f7e4a8"/>' : shape === 'wide' ? '<path d="M48 28h64l-8 56H56z" fill="#f7e4a8"/>' : '<path d="M57 30h46l-5 53H62z" fill="#f7e4a8"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${escape(label)}"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#fff8df"/><stop offset=".5" stop-color="${accent}"/><stop offset="1" stop-color="#936b2b"/></linearGradient></defs><rect width="160" height="160" rx="24" fill="#fbfcfe"/><circle cx="80" cy="74" r="55" fill="${accent}" opacity=".12"/><path d="M45 98h70v12H45zm12 12h46v12H57z" fill="#8a6b39"/><g fill="url(#g)" stroke="#8a6b39" stroke-width="2">${body}<path d="M52 26h56l-5 12H57z"/><path d="M69 86h22v13H69z"/></g><text x="80" y="144" fill="#2a3542" font-family="system-ui,sans-serif" font-size="10" font-weight="700" text-anchor="middle">${escape(label)}</text></svg>`;
}
await fs.mkdir(directory, { recursive: true });
await Promise.all(Object.entries(trophies).map(([id, value]) => fs.writeFile(path.join(directory, `${id}.svg`), art(id, value), 'utf8')));
console.log(JSON.stringify({ status: 'PASS', created: Object.keys(trophies).length }));
