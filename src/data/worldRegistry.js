export const DATA_ORIGINS = Object.freeze({
  OFFICIAL: 'official',
  VERIFIED_PUBLIC: 'verified-public',
  CURATED: 'curated',
  ESTIMATED: 'estimated',
  GENERATED_FALLBACK: 'generated-fallback'
});

const ORIGIN_VALUES = new Set(Object.values(DATA_ORIGINS));
const POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LB', 'RB', 'CB', 'GK'];
const ATTRS = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
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
  return {
    ...club,
    id: String(club.id || club.code || ''),
    name: club.name || club.cn || club.native || club.id,
    league: club.league || club.leagueCn || club.leagueId,
    academy: club.academy ?? club.youth ?? 50,
    competition: club.competition ?? club.rep ?? 50,
    opportunity: club.opportunity ?? club.youthUsage ?? 50,
    style: club.style || club.tactic || 'balanced',
    dataOrigin: {
      identity: sourceOrigin(club, 'identity', DATA_ORIGINS.CURATED),
      profile: sourceOrigin(club, 'profile', DATA_ORIGINS.CURATED),
      ratings: sourceOrigin(club, 'ratings', DATA_ORIGINS.ESTIMATED)
    }
  };
}

export function normalizePlayer(player = {}) {
  const position = POSITIONS.includes(player.position || player.pos) ? (player.position || player.pos) : 'CM';
  return {
    ...player,
    id: String(player.id || `${player.clubId || 'free'}-${player.name || player.cn || 'player'}`),
    name: player.name || player.cn || player.id,
    position,
    clubId: player.clubId || null,
    ovr: Number(player.ovr || 0),
    attrs: normalizeAttrs(player.attrs, position),
    dataOrigin: {
      identity: sourceOrigin(player, 'identity', DATA_ORIGINS.CURATED),
      ratings: sourceOrigin(player, 'ratings', DATA_ORIGINS.CURATED)
    }
  };
}

export function createGeneratedPlayer({ clubId = 'free-agent', position = 'CM', index = 0, seed = '' } = {}) {
  const pos = POSITIONS.includes(position) ? position : 'CM';
  const rnd = random(`${seed}|${clubId}|${pos}|${index}`);
  const attrs = Object.fromEntries(Object.entries(PROFILE[pos]).map(([key, value]) => [key, Math.round(value + (rnd() - 0.5) * 12)]));
  const ovr = Math.round(Object.values(attrs).reduce((sum, value) => sum + value, 0) / ATTRS.length);
  return { id: `generated-${clubId}-${pos}-${index}`, name: `Academy prospect ${index + 1}`, position: pos, clubId, ovr, attrs, dataOrigin: { identity: DATA_ORIGINS.GENERATED_FALLBACK, ratings: DATA_ORIGINS.GENERATED_FALLBACK } };
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
  }
  return { valid: errors.length === 0, errors, counts: { clubs: clubs.length, leagues: leagues.length, players: players.length } };
}

function searchable(item) { return [item.id, item.name, item.cn, item.native, item.country, item.league, item.leagueCn, item.nation].filter(Boolean).join(' ').toLocaleLowerCase(); }

export function createWorldRegistry({ clubs = [], leagues = [], players = [], trophies = [] } = {}) {
  const normalizedClubs = clubs.map(normalizeClub);
  const normalizedPlayers = players.map(normalizePlayer);
  const normalizedLeagues = leagues.map(league => ({ ...league, id: String(league.id || ''), dataOrigin: sourceOrigin(league, 'identity', DATA_ORIGINS.CURATED) }));
  const validation = validateRegistry({ clubs: normalizedClubs, leagues: normalizedLeagues, players: normalizedPlayers });
  const clubById = new Map(normalizedClubs.map(club => [club.id, club]));
  const playersByClub = new Map();
  for (const player of normalizedPlayers) {
    if (!playersByClub.has(player.clubId)) playersByClub.set(player.clubId, []);
    playersByClub.get(player.clubId).push(player);
  }
  const all = normalizedClubs.map(item => ({ item, text: searchable(item) }));
  return {
    clubs: normalizedClubs,
    leagues: normalizedLeagues,
    players: normalizedPlayers,
    trophies: trophies.map(trophy => ({ ...trophy, dataOrigin: sourceOrigin(trophy, 'identity', DATA_ORIGINS.CURATED) })),
    validation,
    stats: { ...validation.counts, trophies: trophies.length },
    getClub(id) { return clubById.get(id) || normalizedClubs[0] || null; },
    search(query, limit = 20) {
      const needle = String(query || '').trim().toLocaleLowerCase();
      if (!needle) return normalizedClubs.slice(0, limit);
      return all.filter(({ text }) => text.includes(needle)).slice(0, limit).map(({ item }) => item);
    },
    playersForClub(clubId, { limit = 11, seed = 'fallback' } = {}) {
      const result = [...(playersByClub.get(clubId) || []).slice(0, limit)];
      for (let index = result.length; index < limit; index++) result.push(createGeneratedPlayer({ clubId, index, position: POSITIONS[index % POSITIONS.length], seed }));
      return result;
    }
  };
}
