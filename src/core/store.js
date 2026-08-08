const STORAGE_KEY = 'football-career-v20';
const VERSION = 23;
import { normalizePlayer } from './playerDevelopmentEngine.js';
import { playStyleEligibility, traitEligibility } from './positionResolver.js';
import { PLAYER_STYLE_DEFINITIONS, SECONDARY_TRAITS } from '../data/playerProfiles.js';

export function createDefaultState() {
  return {
    version: VERSION,
    route: 'career',
    createdAt: new Date().toISOString(),
    settings: { mode: 'standard', theme: 'light', autoSkipLow: true, autoPauseCritical: true, motion: 'full', sound: true, haptics: true },
    simulation: { paused: false, speed: 1, date: '2026-07-01', processedKeys: [], summaries: [], queue: [], lastKeyNode: null },
    player: null,
    season: { year: '2026/27', week: 1, progress: 0, appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, shots: 0, keyPasses: 0, tackles: 0, interceptions: 0, saves: 0, cleanSheets: 0, penaltySaves: 0, yellowCards: 0, redCards: 0, suspensions: 0, playerOfMatch: 0, injuryAbsences: 0, injuries: [], objectives: [], startOvr: null, startMarketValue: 650000, startStats: null, keyNodes: 0 },
    schedule: [],
    injuries: [],
    discipline: { yellowCards: 0, redCards: 0, suspensions: [], history: [] },
    relationships: { coach: 52, teammates: 48, captain: 45, management: 50, fans: 1200, media: 36, rivalry: 18 },
    career: { marketValue: 650000, weeklySalary: 1800, contractMonths: 30, clubInterest: [], achievements: [], growthLog: [], injuryLog: [], history: [], honors: { trophies: [], personalAwards: [], seasons: [], achievements: [], achievementLog: [], retirement: null, legendProfile: null } },
    training: { selectedPlan: null, completedWeek: 0, autoStrategy: 'balanced', plansUsed: [], lastResult: null, sessions: [], bestScores: {}, streak: 0, unlockedGames: [], challenge: { target: 3, progress: 0, reward: '教练信任 +3' }, facilityLevel: 1, coachBonus: 0, currentOpportunity: null, seasonTrainingCount: 0, opportunityHistory: [], resolvedNodes: [] },
    events: { pending: [], history: [], cooldowns: {}, sceneCooldowns: {}, sceneHistory: [], seasonCounts: {}, careerCounts: {}, characterMemory: {}, forcedPauses: 0, resolved: [], delayedEffects: [], chains: [], lastInteractionIds: [] },
    news: { items: [], unread: 0 },
    random: { seed: null, history: [], last: null },
    creation: { rerollsUsed: 0, seed: null, wizardStep: 0, wizardDraft: null },
    clubInteractions: { cooldowns: {}, history: [] },
    transfer: { continent: null, country: null, city: null, league: null, club: null, offers: [], contractOffer: null, watchlist: [], inbox: [], negotiations: [], evaluatedMonths: [], pipelines: {}, activeTab: 'received', clubTab: 'current', clubDirectory: {} },
  ui: { notices: [], lastFeedback: null, todos: [], lastOutcome: null, matchState: null }
  };
}

export function migrateState(input) {
  const base = createDefaultState();
  if (!input || typeof input !== 'object') return base;
  const state = { ...base, ...input };
  state.settings = { ...base.settings, ...(input.settings || {}) };
  if (!['immersive','standard','fast','legend'].includes(state.settings.mode)) state.settings.mode = 'standard';
  if (!['system','dark','light'].includes(state.settings.theme)) state.settings.theme = 'light';
  state.simulation = { ...base.simulation, ...(input.simulation || {}) };
  state.simulation.processedKeys = Array.isArray(state.simulation.processedKeys) ? state.simulation.processedKeys : [];
  state.simulation.summaries = Array.isArray(state.simulation.summaries) ? state.simulation.summaries : [];
  state.season = { ...base.season, ...(input.season || {}) };
  state.season.injuries = Array.isArray(state.season.injuries) ? state.season.injuries : [];
  state.relationships = { ...base.relationships, ...(input.relationships || {}) };
  state.career = { ...base.career, ...(input.career || {}) };
  state.career.honors = { ...base.career.honors, ...(input.career?.honors || {}) };
  state.training = { ...base.training, ...(input.training || {}) };
  state.training.currentOpportunity = state.training.currentOpportunity && typeof state.training.currentOpportunity === 'object' ? state.training.currentOpportunity : null;
  state.training.seasonTrainingCount = Math.max(0, Number(state.training.seasonTrainingCount || 0));
  state.training.opportunityHistory = Array.isArray(state.training.opportunityHistory) ? state.training.opportunityHistory : [];
  state.training.resolvedNodes = Array.isArray(state.training.resolvedNodes) ? state.training.resolvedNodes : [];
  state.events = { ...base.events, ...(input.events || {}) };
  for (const key of ['pending','history','resolved','delayedEffects','chains','lastInteractionIds','sceneHistory']) if (!Array.isArray(state.events[key])) state.events[key] = [];
  state.events.sceneCooldowns = state.events.sceneCooldowns && typeof state.events.sceneCooldowns === 'object' ? state.events.sceneCooldowns : {};
  state.news = { ...base.news, ...(input.news || {}) };
  state.news.items = Array.isArray(state.news.items) ? state.news.items : [];
  state.news.unread = state.news.items.filter(item => !item.read).length;
  state.random = { ...base.random, ...(input.random || {}) };
  state.random.seed = state.random.seed || `career-${state.createdAt}`;
  state.random.history = Array.isArray(state.random.history) ? state.random.history : [];
  state.creation = { ...base.creation, ...(input.creation || {}) };
  state.creation.rerollsUsed = Math.max(0, Math.min(10, Number(state.creation.rerollsUsed || 0)));
  state.creation.seed = state.creation.seed || `${state.createdAt}:identity`;
  state.creation.wizardStep = Math.max(0, Math.min(4, Number(state.creation.wizardStep || 0)));
  state.creation.wizardDraft = state.creation.wizardDraft && typeof state.creation.wizardDraft === 'object' ? state.creation.wizardDraft : null;
  state.clubInteractions = { ...base.clubInteractions, ...(input.clubInteractions || {}) };
  state.clubInteractions.cooldowns = state.clubInteractions.cooldowns && typeof state.clubInteractions.cooldowns === 'object' ? state.clubInteractions.cooldowns : {};
  state.clubInteractions.history = Array.isArray(state.clubInteractions.history) ? state.clubInteractions.history : [];
  state.transfer = { ...base.transfer, ...(input.transfer || {}) };
  state.transfer.clubDirectory = state.transfer.clubDirectory && typeof state.transfer.clubDirectory === 'object' ? state.transfer.clubDirectory : {};
  state.transfer.pipelines = state.transfer.pipelines && typeof state.transfer.pipelines === 'object' ? state.transfer.pipelines : {};
  for (const key of ['offers','watchlist','inbox','negotiations','evaluatedMonths']) if (!Array.isArray(state.transfer[key])) state.transfer[key] = [];
  if (!['received','agent','exploring','watchlist','history'].includes(state.transfer.activeTab)) state.transfer.activeTab = 'received';
  if (!['current','role','squad','contract','interest','offers','agent'].includes(state.transfer.clubTab)) state.transfer.clubTab = 'current';
  if (!state.transfer.city && state.transfer.club) {
    const club = Array.isArray(state.schedule) ? state.schedule.find(item => item.clubId === state.transfer.club) : null;
    state.transfer.city = club?.city || null;
  }
  state.ui = { ...base.ui, ...(input.ui || {}) };
  state.ui.todos = Array.isArray(state.ui.todos) ? state.ui.todos : [];
  state.ui.matchState = state.ui.matchState && typeof state.ui.matchState === 'object' ? state.ui.matchState : null;
  if (state.season.startOvr == null && state.player) state.season.startOvr = state.player.ovr;
  if (!Number.isFinite(Number(state.season.startMarketValue))) state.season.startMarketValue = state.career.marketValue || base.season.startMarketValue;
  state.player = normalizePlayer(input.player);
  if (state.player) {
    state.player.style = playStyleEligibility.resolve(state.player.position, state.player.style, PLAYER_STYLE_DEFINITIONS);
    state.player.secondaryTrait = traitEligibility.resolve(state.player.position, state.player.secondaryTrait, SECONDARY_TRAITS);
    state.player.previousStats = normalizeStats(input.player?.previousStats, state.player.stats);
  }
  if (!state.season.startStats || typeof state.season.startStats !== 'object') state.season.startStats = state.player ? { ...state.player.stats } : null;
  state.schedule = Array.isArray(input.schedule) ? input.schedule : [];
  state.injuries = Array.isArray(input.injuries) ? input.injuries : [];
  state.discipline = { ...base.discipline, ...(input.discipline || {}) };
  state.discipline.suspensions = Array.isArray(state.discipline.suspensions) ? state.discipline.suspensions : [];
  state.discipline.history = Array.isArray(state.discipline.history) ? state.discipline.history : [];
  state.career.growthLog = Array.isArray(state.career.growthLog) ? state.career.growthLog : [];
  state.career.history = Array.isArray(state.career.history) ? state.career.history : [];
  state.career.honors.trophies = Array.isArray(state.career.honors.trophies) ? state.career.honors.trophies : [];
  state.career.honors.personalAwards = Array.isArray(state.career.honors.personalAwards) ? state.career.honors.personalAwards : [];
  state.career.honors.seasons = Array.isArray(state.career.honors.seasons) ? state.career.honors.seasons : [];
  state.career.honors.achievements = Array.isArray(state.career.honors.achievements) ? state.career.honors.achievements : [];
  state.career.honors.achievementLog = Array.isArray(state.career.honors.achievementLog) ? state.career.honors.achievementLog : [];
  state.training.plansUsed = Array.isArray(state.training.plansUsed) ? state.training.plansUsed : [];
  state.training.sessions = Array.isArray(state.training.sessions) ? state.training.sessions : [];
  state.training.bestScores = state.training.bestScores && typeof state.training.bestScores === 'object' ? state.training.bestScores : {};
  state.training.unlockedGames = Array.isArray(state.training.unlockedGames) ? state.training.unlockedGames : [];
  state.training.challenge = { ...base.training.challenge, ...(state.training.challenge || {}) };
  state.training.facilityLevel = Number(state.training.facilityLevel || 1);
  state.training.coachBonus = Number(state.training.coachBonus || 0);
  state.version = VERSION;
  return state;
}

function normalizeStats(stats, fallback) {
  return Object.fromEntries(Object.keys(fallback).map(key=>[key,Number.isFinite(Number(stats?.[key]))?Number(stats[key]):fallback[key]]));
}

export class Store {
  constructor() {
    this.listeners = new Set();
    this.state = this.load();
  }
  load() {
    try { return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch { return createDefaultState(); }
  }
  get() { return this.state; }
  set(updater, { persist = true } = {}) {
    const next = typeof updater === 'function' ? updater(structuredClone(this.state)) : updater;
    this.state = migrateState(next);
    if (persist) this.save();
    this.listeners.forEach(fn => fn(this.state));
    return this.state;
  }
  patch(partial) { return this.set(state => Object.assign(state, partial)); }
  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    return true;
  }
  reset() {
    this.state = createDefaultState();
    this.save();
    this.listeners.forEach(fn => fn(this.state));
  }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  export() { return JSON.stringify(this.state, null, 2); }
  import(raw) { const next=migrateState(JSON.parse(raw)); this.state=next; this.save(); this.listeners.forEach(fn => fn(this.state)); }
}
