import { el } from '../utils/dom.js';
import { TROPHY_LIST, TROPHY_REGISTRY } from '../data/trophyRegistry.js';

export const TROPHY_ASSETS = Object.freeze(Object.fromEntries(TROPHY_LIST.map(item => [item.id, item.asset])));

export const OBTAINABLE_AWARD_IDS = Object.freeze(TROPHY_LIST.filter(item => item.kind === 'award').map(item => item.id));

export function trophyAsset(id) { return TROPHY_REGISTRY[id]?.asset || null; }

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
