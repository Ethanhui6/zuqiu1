import { el } from '../utils/dom.js';

const TROPHY_ASSETS = {
  'world-cup': './assets/trophies/world-cup.svg', champions: './assets/trophies/champions.svg', league: './assets/trophies/league.svg', domestic: './assets/trophies/domestic.svg', 'club-world': './assets/trophies/club-world.svg', supercup: './assets/trophies/supercup.svg', national: './assets/trophies/national.svg', 'golden-boot': './assets/trophies/golden-boot.svg', young: './assets/trophies/young.svg', 'player-year': './assets/trophies/player-year.svg', ballon: './assets/trophies/ballon.svg', legend: './assets/trophies/legend.svg'
};

export function trophyAsset(id) { return TROPHY_ASSETS[id] || TROPHY_ASSETS.league; }
export function trophyMarkup(trophy = {}, size = 'small') { const pixels = size === 'large' ? 72 : size === 'small' ? 40 : 56; const name = trophy.name || trophy.cn || trophy.id || '荣誉'; return `<img class="trophy-icon trophy-icon--${size}" src="${trophy.image || trophyAsset(trophy.assetId || trophy.id)}" alt="${name}奖杯" width="${pixels}" height="${pixels}" loading="lazy" decoding="async">`; }
export function createTrophyIcon(trophy = {}, { size = 'normal', decorative = false } = {}) {
  const pixels = size === 'large' ? 72 : size === 'small' ? 40 : 56;
  const name = trophy.name || trophy.cn || trophy.id || '荣誉';
  return el('img', { className: `trophy-icon trophy-icon--${size}`, attrs: { src: trophy.image || trophyAsset(trophy.assetId || trophy.id), alt: decorative ? '' : `${name}奖杯`, width: pixels, height: pixels, loading: 'lazy', decoding: 'async' } });
}
