import { el } from '../utils/dom.js';

const sizeMap = { large: 72, normal: 56, small: 44 };

export function normalizeClubName(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s.·'’‘`-]+/g, '').replace(/足球俱乐部|footballclub|fc$/i, '');
}
export function getClubById(clubId, clubs = []) { return clubs.find(club => club?.id === clubId) || null; }
export function resolveClubAlias(name, clubs = []) {
  const key = normalizeClubName(name);
  return clubs.find(club => [club.id, club.cn, club.name, club.nameZh, club.en, club.nameEn, club.native, ...(club.aliases || [])].some(alias => normalizeClubName(alias) === key)) || null;
}
export function getClubCrest(club) { const value = club?.crestPath || club?.crest || ''; return validateClubCrest(value) ? value : null; }
export function validateClubCrest(value) { return typeof value === 'string' && /^\.\/assets\/clubs\/[^/]+\/[^/]+\.(?:svg|png|webp)$/i.test(value); }

export function crestSvg(club, { size = 48, decorative = false } = {}) {
  const label = `${club?.cn || club?.name || club?.nameZh || '俱乐部'}队徽`;
  const path = getClubCrest(club);
  if (!path) return `<span class="club-crest club-crest--inline club-crest--missing" role="img" aria-label="${decorative ? '' : `${escapeHtml(label)}资源暂未匹配`}" data-crest-status="missing">—</span>`;
  return `<img class="club-crest club-crest--inline" src="${escapeHtml(path)}" alt="${decorative ? '' : escapeHtml(label)}" width="${Number(size) || 48}" height="${Number(size) || 48}" loading="lazy" decoding="async">`;
}

export function createClubCrest(club, { size = 'normal', decorative = false } = {}) {
  const pixels = sizeMap[size] || sizeMap.normal;
  const label = `${club?.cn || club?.name || club?.nameZh || '俱乐部'}队徽`;
  const path = getClubCrest(club);
  if (!path) return el('span', { className: `club-crest club-crest--${size} club-crest--missing`, attrs: { role: 'img', 'aria-label': decorative ? '' : `${label}资源暂未匹配`, 'data-crest-status': 'missing' }, text: '—' });
  const image = el('img', { className: `club-crest club-crest--${size}`, attrs: { src: path, alt: decorative ? '' : label, width: pixels, height: pixels, loading: 'lazy', decoding: 'async' } });
  image.addEventListener('error', () => { image.replaceWith(createClubCrest({ ...club, crest: null }, { size, decorative })); });
  return image;
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
