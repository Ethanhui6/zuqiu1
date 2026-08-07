import { el } from '../utils/dom.js';

const sizeMap = { large: 72, normal: 56, small: 44 };

export function normalizeClubName(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s.'\u2019-]+/g, '').replace(/footballclub|fc$/i, '');
}

export function getClubById(clubId, clubs = []) { return clubs.find(club => club?.id === clubId) || null; }

export function resolveClubAlias(name, clubs = []) {
  const key = normalizeClubName(name);
  return clubs.find(club => [club.id, club.cn, club.name, club.nameZh, club.en, club.nameEn, club.native, ...(club.aliases || [])].some(alias => normalizeClubName(alias) === key)) || null;
}

export function getClubCrest(club) {
  const value = club?.crestPath || club?.crest || '';
  return validateClubCrest(value) ? value : null;
}

export function validateClubCrest(value) { return typeof value === 'string' && /^\.\/assets\/clubs\/[^/]+\/[^/]+\.(?:svg|png|webp)$/i.test(value); }

export function crestSvg(club, { size = 48, decorative = false } = {}) {
  const label = `${club?.cn || club?.name || club?.nameZh || 'Club'} crest`;
  const path = getClubCrest(club);
  if (!path) return `<span class="club-crest club-crest--inline club-crest--fallback" role="img" aria-label="${decorative ? '' : escapeHtml(label)}" data-crest-status="fallback">${fallbackCrestSvg(club)}</span>`;
  return `<img class="club-crest club-crest--inline" src="${escapeHtml(path)}" alt="${decorative ? '' : escapeHtml(label)}" width="${Number(size) || 48}" height="${Number(size) || 48}" loading="lazy" decoding="async">`;
}

export function createClubCrest(club, { size = 'normal', decorative = false } = {}) {
  const pixels = sizeMap[size] || sizeMap.normal;
  const label = `${club?.cn || club?.name || club?.nameZh || 'Club'} crest`;
  const path = getClubCrest(club);
  if (!path) {
    const fallback = el('span', { className: `club-crest club-crest--${size} club-crest--fallback`, attrs: { role: 'img', 'aria-label': decorative ? '' : label, 'data-crest-status': 'fallback' } });
    fallback.innerHTML = fallbackCrestSvg(club);
    return fallback;
  }
  const image = el('img', { className: `club-crest club-crest--${size}`, attrs: { src: path, alt: decorative ? '' : label, width: pixels, height: pixels, loading: 'lazy', decoding: 'async' } });
  image.addEventListener('error', () => { image.replaceWith(createClubCrest({ ...club, crest: null, crestPath: null }, { size, decorative })); });
  return image;
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

function fallbackCrestSvg(club) {
  const palettes = [['#0f766e', '#ccfbf1'], ['#b91c1c', '#fee2e2'], ['#1d4ed8', '#dbeafe'], ['#a16207', '#fef3c7'], ['#7e22ce', '#f3e8ff'], ['#166534', '#dcfce7']];
  const key = String(club?.id || club?.cn || club?.name || 'club');
  const index = [...key].reduce((total, char) => total + char.codePointAt(0), 0) % palettes.length;
  const [primary, secondary] = palettes[index];
  return `<svg viewBox="0 0 64 72" aria-hidden="true" focusable="false"><path d="M32 3 58 12v25c0 16-10 26-26 32C16 63 6 53 6 37V12z" fill="${primary}"/><path d="M32 9 52 16v20c0 12-7 20-20 26-13-6-20-14-20-26V16z" fill="${secondary}" opacity=".92"/><path d="M14 28h36v7H14zm14-14h8v43h-8z" fill="${primary}" opacity=".92"/><circle cx="32" cy="35" r="8" fill="#fff"/><path d="m32 28 3 4-1 5h-4l-1-5zM25 36l4 2 1 5-4 2-4-4zm14 0 4-2 4 4-2 5-4-2zm-12 9 5-2 5 2-1 5h-8z" fill="${primary}"/></svg>`;
}
