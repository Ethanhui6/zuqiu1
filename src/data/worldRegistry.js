import { generatePlayerName } from '../services/playerIdentity.js';

export const DATA_ORIGINS = Object.freeze({
  OFFICIAL: 'official',
  VERIFIED_PUBLIC: 'verified-public',
  CURATED: 'curated',
  ESTIMATED: 'estimated',
  GENERATED_FALLBACK: 'generated-fallback'
});

const ORIGIN_VALUES = new Set(Object.values(DATA_ORIGINS));
export const REAL_SQUAD_SNAPSHOT_SEASON = 2026;
const POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LB', 'RB', 'CB', 'GK'];
const ATTRS = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
const CONTINENT_BY_PREFIX = { CHN: '亚洲', JPN: '亚洲', KOR: '亚洲', KSA: '亚洲', AUS: '大洋洲', ENG: '欧洲', ESP: '欧洲', GER: '欧洲', ITA: '欧洲', FRA: '欧洲', NED: '欧洲', POR: '欧洲', ARG: '南美洲', BRA: '南美洲', COL: '南美洲', CHI: '南美洲', URU: '南美洲', USA: '北美洲', MEX: '北美洲', RSA: '非洲' };
const PROFILE = {
  ST: { pac: 72, sho: 68, pas: 48, dri: 60, def: 30, phy: 62 },
  LW: { pac: 75, sho: 58, pas: 52, dri: 70, def: 30, phy: 48 },
  RW: { pac: 75, sho: 58, pas: 52, dri: 70, def: 30, phy: 48 },
  CAM: { pac: 58, sho: 55, pas: 68, dri: 68, def: 36, phy: 48 },
  CM: { pac: 52, sho: 46, pas: 67, dri: 58, def: 52, phy: 56 },
  CDM: { pac: 46, sho: 35, pas: 60, dri: 48, def: 68, phy: 62 },
  LB: { pac: 68, sho: 30, pas: 52, dri: 48, def: 64, phy: 58 },
  RB: { pac: 68, sho: 30, pas: 52, dri: 48, def: 64, phy: 58 },
  CB: { pac: 42, sho: 25, pas: 48, dri: 32, def: 72, phy: 70 },
  GK: { pac: 35, sho: 18, pas: 48, dri: 25, def: 74, phy: 68 }
};

function validOrigin(value, fallback) { return ORIGIN_VALUES.has(value) ? value : fallback; }
function sourceOrigin(entity, field, fallback) {
  const explicit = entity?.dataOrigin?.[field] || entity?.dataSource?.origins?.[field];
  if (explicit) return validOrigin(explicit, fallback);
  if (entity?.dataSource?.verified === true) return DATA_ORIGINS.VERIFIED_PUBLIC;
  return fallback;
}
function provenance(entity, kind, fallbackOrigin) {
  const source = entity?.dataSource || {};
  const origin = sourceOrigin(entity, kind, fallbackOrigin);
  const isReal = entity?.isReal ?? (origin !== DATA_ORIGINS.GENERATED_FALLBACK);
  return {
    isReal: Boolean(isReal),
    dataOrigin: origin,
    sourceName: entity?.sourceName || source.sourceName || source.identity || (isReal ? 'Curated public football data' : 'Deterministic fallback generator'),
    sourceReference: entity?.sourceReference || source.sourceReference || source.reference || (isReal ? 'project-curated-record' : 'deterministic-generator'),
    lastVerifiedAt: entity?.lastVerifiedAt || source.lastVerifiedAt || null,
    confidence: Number.isFinite(Number(entity?.confidence)) ? Number(entity.confidence) : (isReal ? 0.82 : 0.45)
  };
}
function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
function random(seed) {
  let value = hashSeed(seed);
  return () => { value = Math.imul(1664525, value) + 1013904223 >>> 0; return value / 4294967296; };
}
function normalizeAttrs(attrs = {}, position) {
  const base = PROFILE[position] || PROFILE.CM;
  return Object.fromEntries(ATTRS.map(key => [key, Number.isFinite(Number(attrs[key])) ? Number(attrs[key]) : base[key]]));
}

export function normalizeClub(club = {}) {
  const id = String(club.id || club.code || '');
  const hash = hashSeed(id);
  const meta = provenance(club, 'identity', DATA_ORIGINS.CURATED);
  return {
    ...club,
    id,
    name: club.name || club.cn || club.native || club.id,
    league: club.league || club.leagueCn || club.leagueId,
    continent: club.continent || CONTINENT_BY_PREFIX[id.slice(0, 3)] || '欧洲',
    x: club.x ?? 8 + hash % 84,
    y: club.y ?? 10 + (hash >>> 8) % 80,
    academy: club.academy ?? club.youth ?? 50,
    competition: club.competition ?? club.rep ?? 50,
    opportunity: club.opportunity ?? club.youthUsage ?? 50,
    style: club.style || club.tactic || 'balanced',
    formation: club.formation || '4-3-3',
    salary: club.salary || 'simulation range',
    ...meta,
    isReal: club.isReal ?? meta.isReal,
    provenance: meta,
    dataOrigin: {
      identity: sourceOrigin(club, 'identity', DATA_ORIGINS.CURATED),
      profile: sourceOrigin(club, 'profile', DATA_ORIGINS.CURATED),
      ratings: sourceOrigin(club, 'ratings', DATA_ORIGINS.ESTIMATED)
    }
  };
}

export function normalizePlayer(player = {}, snapshotSeason = REAL_SQUAD_SNAPSHOT_SEASON) {
  const position = POSITIONS.includes(player.position || player.pos) ? (player.position || player.pos) : 'CM';
  const id = String(player.id || `${player.clubId || 'free'}-${player.name || player.cn || 'player'}`);
  const meta = provenance(player, 'identity', DATA_ORIGINS.CURATED);
  const isReal = player.isReal ?? meta.isReal;
  const sourceSeason = Number(player.snapshotSeason || player.snapshotYear || snapshotSeason);
  const simulatedEndSeason = Number(player.simulatedEndSeason || sourceSeason + 4 + (hashSeed(id) % 7));
  return {
    ...player,
    id,
    name: player.name || player.cn || player.id,
    position,
    clubId: player.clubId || null,
    ovr: Number(player.ovr || 0),
    attrs: normalizeAttrs(player.attrs, position),
    ...meta,
    isReal,
    snapshotSeason: isReal ? sourceSeason : null,
    simulatedEndSeason: isReal ? simulatedEndSeason : null,
    provenance: meta,
    dataOrigin: {
      identity: sourceOrigin(player, 'identity', DATA_ORIGINS.CURATED),
      ratings: sourceOrigin(player, 'ratings', DATA_ORIGINS.CURATED)
    }
  };
}

export function createGeneratedPlayer({ clubId = 'free-agent', country = '', position = 'CM', index = 0, seed = '', nameProfiles = {} } = {}) {
  const pos = POSITIONS.includes(position) ? position : 'CM';
  const rnd = random(`${seed}|${clubId}|${pos}|${index}`);
  const attrs = Object.fromEntries(Object.entries(PROFILE[pos]).map(([key, value]) => [key, Math.round(value + (rnd() - 0.5) * 12)]));
  const ovr = Math.round(Object.values(attrs).reduce((sum, value) => sum + value, 0) / ATTRS.length);
  const generatedName = Object.keys(nameProfiles).length ? generatePlayerName(country, `${seed}|${clubId}|${index}`, nameProfiles).displayName : `青年队球员 ${index + 1}-${hashSeed(`${clubId}|${seed}`) % 10000}`;
  return {
    id: `generated-${clubId}-${pos}-${index}`,
    name: generatedName,
    cn: generatedName,
    position: pos,
    clubId,
    ovr,
    attrs,
    isReal: false,
    snapshotSeason: null,
    simulatedEndSeason: null,
    ...provenance({ isReal: false }, 'identity', DATA_ORIGINS.GENERATED_FALLBACK),
    provenance: provenance({ isReal: false }, 'identity', DATA_ORIGINS.GENERATED_FALLBACK),
    dataOrigin: { identity: DATA_ORIGINS.GENERATED_FALLBACK, ratings: DATA_ORIGINS.GENERATED_FALLBACK }
  };
}

export function validateRegistry({ clubs = [], leagues = [], players = [] } = {}) {
  const errors = [];
  const unique = (items, label) => {
    const ids = new Set();
    for (const item of items) {
      if (!item.id) errors.push(`${label} missing id`);
      else if (ids.has(item.id)) errors.push(`${label} duplicate id: ${item.id}`);
      ids.add(item.id);
    }
  };
  unique(clubs, 'club'); unique(leagues, 'league'); unique(players, 'player');
  const clubIds = new Set(clubs.map(club => club.id));
  const leagueIds = new Set(leagues.map(league => league.id));
  for (const club of clubs) if (club.leagueId && !leagueIds.has(club.leagueId)) errors.push(`club ${club.id} references missing league ${club.leagueId}`);
  for (const player of players) {
    if (player.clubId && !clubIds.has(player.clubId)) errors.push(`player ${player.id} references missing club ${player.clubId}`);
    if (!POSITIONS.includes(player.position)) errors.push(`player ${player.id} has invalid position ${player.position}`);
    if (typeof player.isReal !== 'boolean') errors.push(`player ${player.id} missing isReal`);
    if (!player.provenance?.dataOrigin) errors.push(`player ${player.id} missing provenance`);
  }
  for (const club of clubs) {
    if (typeof club.isReal !== 'boolean') errors.push(`club ${club.id} missing isReal`);
    if (!club.provenance?.dataOrigin) errors.push(`club ${club.id} missing provenance`);
  }
  return { valid: errors.length === 0, errors, counts: { clubs: clubs.length, leagues: leagues.length, players: players.length } };
}

function searchable(item) { return [item.id, item.name, item.cn, item.native, item.country, item.league, item.leagueCn, item.nation].filter(Boolean).join(' ').toLocaleLowerCase(); }

export function createWorldRegistry({ clubs = [], leagues = [], players = [], trophies = [], nameProfiles = {}, snapshotSeason = REAL_SQUAD_SNAPSHOT_SEASON } = {}) {
  const normalizedClubs = clubs.map(normalizeClub);
  const normalizedPlayers = players.map(player => normalizePlayer(player, snapshotSeason));
  const normalizedLeagues = leagues.map(league => ({
    ...league,
    id: String(league.id || ''),
    isReal: league.isReal ?? true,
    provenance: provenance(league, 'identity', DATA_ORIGINS.CURATED),
    dataOrigin: sourceOrigin(league, 'identity', DATA_ORIGINS.CURATED)
  }));
  const validation = validateRegistry({ clubs: normalizedClubs, leagues: normalizedLeagues, players: normalizedPlayers });
  const clubById = new Map(normalizedClubs.map(club => [club.id, club]));
  const leagueById = new Map(normalizedLeagues.map(league => [league.id, league]));
  const countries = [...new Set(normalizedClubs.map(club => club.country).filter(Boolean))].map(name => ({ id: name, name, isReal: true, dataOrigin: DATA_ORIGINS.CURATED }));
  const playersByClub = new Map();
  for (const player of normalizedPlayers) {
    if (!playersByClub.has(player.clubId)) playersByClub.set(player.clubId, []);
    playersByClub.get(player.clubId).push(player);
  }
  const reservedRealNames = new Set(normalizedPlayers.filter(player => player.isReal).map(player => player.name));
  const generatedNamesByScope = new Map();
  const rosterCache = new Map();
  const all = normalizedClubs.map(item => ({ item, text: searchable(item) }));
  return {
    clubs: normalizedClubs,
    leagues: normalizedLeagues,
    players: normalizedPlayers,
    trophies: trophies.map(trophy => ({
      ...trophy,
      isReal: trophy.isReal ?? true,
      provenance: provenance(trophy, 'identity', DATA_ORIGINS.CURATED),
      dataOrigin: sourceOrigin(trophy, 'identity', DATA_ORIGINS.CURATED)
    })),
    validation,
    countries,
    stats: { ...validation.counts, realPlayers: normalizedPlayers.filter(player => player.isReal).length, availablePlayers: normalizedClubs.length * 18, trophies: trophies.length, countries: countries.length },
    getClub(id) { return clubById.get(id) || normalizedClubs[0] || null; },
    getLeague(id) { return leagueById.get(id) || normalizedLeagues[0] || null; },
    leaguesForCountry(country) { return normalizedLeagues.filter(league => league.country === country); },
    clubsForLeague(leagueId) { return normalizedClubs.filter(club => club.leagueId === leagueId || club.league === leagueId); },
    search(query, limit = 20) {
      const needle = String(query || '').trim().toLocaleLowerCase();
      if (!needle) return normalizedClubs.slice(0, limit);
      return all.filter(({ text }) => text.includes(needle)).slice(0, limit).map(({ item }) => item);
    },
    realRosterForClub(clubId, { limit = 18, seasonYear = snapshotSeason } = {}) {
      const year = Number(seasonYear) || snapshotSeason;
      return (playersByClub.get(clubId) || []).filter(player => player.isReal && year >= player.snapshotSeason && year <= player.simulatedEndSeason).slice(0, limit);
    },
    playersForClub(clubId, { limit = 11, seed = 'fallback', seasonYear = snapshotSeason } = {}) {
      const year = Number(seasonYear) || snapshotSeason;
      const cacheKey = `${clubId}|${year}|${seed}|${limit}`;
      if (rosterCache.has(cacheKey)) return rosterCache.get(cacheKey);
      const result = [...this.realRosterForClub(clubId, { limit, seasonYear })];
      const club = clubById.get(clubId);
      const scopeKey = `${year}|${seed}`;
      const usedNames = generatedNamesByScope.get(scopeKey) || new Set();
      generatedNamesByScope.set(scopeKey, usedNames);
      for (let index = result.length; index < limit; index++) {
        let generated;
        for (let retry = 0; retry < 32; retry++) {
          generated = createGeneratedPlayer({ clubId, country: club?.country, index, position: POSITIONS[index % POSITIONS.length], seed: `${seed}|name-${retry}`, nameProfiles });
          if (!result.some(player => player.name === generated.name) && !reservedRealNames.has(generated.name) && !usedNames.has(generated.name)) break;
        }
        usedNames.add(generated.name);
        result.push(generated);
      }
      rosterCache.set(cacheKey, result);
      return result;
    },
    rosterForClub(clubId, options = {}) {
      return this.playersForClub(clubId, { limit: 18, ...options });
    }
  };
}
