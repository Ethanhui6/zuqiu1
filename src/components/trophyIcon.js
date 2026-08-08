import { el } from '../utils/dom.js';

export const TROPHY_ASSETS = Object.freeze({
  'world-cup': './assets/trophies/world-cup.svg', champions: './assets/trophies/champions.svg', league: './assets/trophies/league.svg', domestic: './assets/trophies/domestic.svg', 'club-world': './assets/trophies/club-world.svg', supercup: './assets/trophies/supercup.svg', national: './assets/trophies/national.svg', 'golden-boot': './assets/trophies/golden-boot.svg', young: './assets/trophies/young.svg', 'player-year': './assets/trophies/player-year.svg', ballon: './assets/trophies/ballon.svg', legend: './assets/trophies/legend.svg',
  'premier-league': './assets/trophies/premier-league.svg', 'fa-cup': './assets/trophies/fa-cup.svg', 'league-cup': './assets/trophies/league-cup.svg', 'la-liga': './assets/trophies/la-liga.svg', bundesliga: './assets/trophies/bundesliga.svg', 'serie-a': './assets/trophies/serie-a.svg', 'ligue-1': './assets/trophies/ligue-1.svg', europa: './assets/trophies/europa.svg', afc: './assets/trophies/afc.svg', euros: './assets/trophies/euros.svg', 'copa-america': './assets/trophies/copa-america.svg', 'asian-cup': './assets/trophies/asian-cup.svg', 'best-keeper': './assets/trophies/best-keeper.svg', 'assists-king': './assets/trophies/assists-king.svg', 'best-xi': './assets/trophies/best-xi.svg',
  'league-title': './assets/trophies/league-title.svg', 'domestic-cup': './assets/trophies/domestic-cup.svg', 'continental-title': './assets/trophies/continental-title.svg', 'golden-glove': './assets/trophies/golden-glove.svg', 'best-defender': './assets/trophies/best-defender.svg', 'young-player': './assets/trophies/young-player.svg', 'player-of-season': './assets/trophies/player-of-season.svg', 'world-player': './assets/trophies/world-player.svg',
  'thai-league': './assets/trophies/thai-league.svg', 'hungarian-league': './assets/trophies/hungarian-league.svg', 'ecuadorian-league': './assets/trophies/ecuadorian-league.svg', 'best-midfielder': './assets/trophies/best-midfielder.svg', 'best-forward': './assets/trophies/best-forward.svg', 'golden-boy': './assets/trophies/golden-boy.svg', 'world-cup-golden-ball': './assets/trophies/world-cup-golden-ball.svg', 'world-cup-golden-boot': './assets/trophies/world-cup-golden-boot.svg', 'world-cup-best-young': './assets/trophies/world-cup-best-young.svg'
});

export const OBTAINABLE_AWARD_IDS = Object.freeze(['ballon', 'golden-boot', 'young', 'player-year', 'legend', 'best-keeper', 'assists-king', 'best-xi', 'golden-glove', 'best-defender', 'young-player', 'player-of-season', 'world-player', 'best-midfielder', 'best-forward', 'golden-boy', 'world-cup-golden-ball', 'world-cup-golden-boot', 'world-cup-best-young']);

export function trophyAsset(id) { return TROPHY_ASSETS[id] || null; }

export function trophyMarkup(trophy = {}, size = 'small') {
  const pixels = size === 'large' ? 72 : size === 'small' ? 40 : 56;
  const name = trophy.name || trophy.cn || trophy.id || 'Honor';
  const source = trophy.image || trophyAsset(trophy.assetId || trophy.id);
  if (!source) return `<span class="trophy-icon trophy-icon--${size} trophy-icon--fallback" role="img" aria-label="${escapeHtml(name)}" data-trophy-status="fallback">${fallbackTrophySvg()}</span>`;
  return `<img class="trophy-icon trophy-icon--${size}" src="${source}" alt="${escapeHtml(name)}" width="${pixels}" height="${pixels}" loading="lazy" decoding="async">`;
}

export function createTrophyIcon(trophy = {}, { size = 'normal', decorative = false } = {}) {
  const pixels = size === 'large' ? 72 : size === 'small' ? 40 : 56;
  const name = trophy.name || trophy.cn || trophy.id || 'Honor';
  const source = trophy.image || trophyAsset(trophy.assetId || trophy.id);
  if (!source) {
    const fallback = el('span', { className: `trophy-icon trophy-icon--${size} trophy-icon--fallback`, attrs: { role: 'img', 'aria-label': decorative ? '' : name, 'data-trophy-status': 'fallback' } });
    fallback.innerHTML = fallbackTrophySvg();
    return fallback;
  }
  return el('img', { className: `trophy-icon trophy-icon--${size}`, attrs: { src: source, alt: decorative ? '' : name, width: pixels, height: pixels, loading: 'lazy', decoding: 'async' } });
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function fallbackTrophySvg() { return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M17 8h30v18c0 10-6 17-15 20-9-3-15-10-15-20z" fill="#d97706"/><path d="M17 13H7v8c0 8 5 13 13 14M47 13h10v8c0 8-5 13-13 14M32 46v9m-12 4h24" fill="none" stroke="#92400e" stroke-width="5" stroke-linecap="round"/><path d="m32 17 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fff7d6"/></svg>'; }
