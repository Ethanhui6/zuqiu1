const YEAR_PATTERN = /^(\d{4})\/(\d{2})$/;

export function ensureHonors(state) {
  const honors = state.career.honors = {
    trophies: [],
    personalAwards: [],
    seasons: [],
    retirement: null,
    legendProfile: null,
    ...(state.career.honors || {})
  };
  honors.trophies = Array.isArray(honors.trophies) ? honors.trophies : [];
  honors.personalAwards = Array.isArray(honors.personalAwards) ? honors.personalAwards : [];
  honors.seasons = Array.isArray(honors.seasons) ? honors.seasons : [];
  return honors;
}

function nextSeason(year) {
  const match = YEAR_PATTERN.exec(String(year || ''));
  const start = match ? Number(match[1]) : new Date().getUTCFullYear();
  return `${start + 1}/${String((start + 2) % 100).padStart(2, '0')}`;
}

function addOnce(list, item) {
  if (list.some(existing => existing.id === item.id)) return false;
  list.push(item);
  return true;
}

function simulatedHonor(id, name, season, club, category) {
  return { id, name, season, club, category, dataOrigin: 'generated-fallback', source: 'career simulation' };
}

export function settleSeason(state) {
  const honors = ensureHonors(state);
  const season = state.season;
  const player = state.player;
  const club = player?.club || 'Unknown club';
  const key = `${season.year}:${player?.clubId || club}`;
  if (honors.seasons.some(record => record.id === key)) return { alreadySettled: true, trophies: [], personalAwards: [], record: null };

  const appearances = Number(season.appearances || 0);
  const goals = Number(season.goals || 0);
  const assists = Number(season.assists || 0);
  const rating = Number(season.rating || 0);
  if (appearances === 0) return { alreadySettled: false, trophies: [], personalAwards: [], record: null };
  const trophies = [];
  const personalAwards = [];
  if (appearances >= 12 && rating >= 7.4) trophies.push(simulatedHonor(`${key}:league`, 'League Champion', season.year, club, 'team'));
  if (appearances >= 10 && goals + assists >= 12) trophies.push(simulatedHonor(`${key}:domestic`, 'Domestic Cup', season.year, club, 'team'));
  if (goals >= 10) personalAwards.push(simulatedHonor(`${key}:golden-boot`, 'Golden Boot', season.year, club, 'personal'));
  if (rating >= 7.8 && appearances >= 15) personalAwards.push(simulatedHonor(`${key}:player-year`, 'Player of the Year', season.year, club, 'personal'));
  if (player?.age <= 21 && rating >= 7.2 && appearances >= 12) personalAwards.push(simulatedHonor(`${key}:young`, 'Young Player of the Year', season.year, club, 'personal'));
  trophies.forEach(item => addOnce(honors.trophies, item));
  personalAwards.forEach(item => addOnce(honors.personalAwards, item));

  const record = { id: key, year: season.year, club, clubId: player?.clubId || null, appearances, goals, assists, rating, trophies: trophies.map(item => item.name), personalAwards: personalAwards.map(item => item.name), dataOrigin: 'generated-fallback' };
  honors.seasons.unshift(record);
  state.career.history.unshift({ date: state.simulation.date, type: 'season-summary', title: `${season.year} season summary`, recordId: key, dataOrigin: 'generated-fallback' });
  state.season = { ...season, year: nextSeason(season.year), week: 1, progress: 0, appearances: 0, goals: 0, assists: 0, rating: 0 };
  return { alreadySettled: false, trophies, personalAwards, record };
}

export function retireCareer(state) {
  const honors = ensureHonors(state);
  if (honors.retirement) return honors.retirement;
  const totals = honors.seasons.reduce((total, season) => ({
    appearances: total.appearances + season.appearances,
    goals: total.goals + season.goals,
    assists: total.assists + season.assists
  }), { appearances: 0, goals: 0, assists: 0 });
  const score = Math.min(100, 35 + honors.seasons.length * 8 + honors.trophies.length * 6 + honors.personalAwards.length * 5);
  const tier = score >= 90 ? 'all-time legend' : score >= 70 ? 'club legend' : score >= 50 ? 'fan favourite' : 'career professional';
  honors.legendProfile = { score, tier, player: state.player?.name || null, club: state.player?.club || null, dataOrigin: 'generated-fallback' };
  honors.retirement = {
    date: state.simulation.date,
    age: state.player?.age || null,
    club: state.player?.club || null,
    seasons: honors.seasons.length,
    trophies: honors.trophies.length,
    personalAwards: honors.personalAwards.length,
    totals,
    legendProfile: honors.legendProfile,
    summary: `${totals.appearances} appearances, ${totals.goals} goals, ${honors.trophies.length + honors.personalAwards.length} honors`,
    dataOrigin: 'generated-fallback'
  };
  return honors.retirement;
}
