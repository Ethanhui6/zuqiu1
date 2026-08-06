const STORAGE_KEY = 'football-career-v20';
const VERSION = 20;
import { normalizePlayer } from './playerDevelopmentEngine.js';

export function createDefaultState() {
  return {
    version: VERSION,
    route: 'career',
    createdAt: new Date().toISOString(),
    settings: { mode: 'standard', autoSkipLow: true, autoPauseCritical: true, motion: 'full', sound: true, haptics: true },
    simulation: { paused: false, speed: 1, date: '2026-07-01', processedKeys: [], summaries: [], queue: [] },
    player: null,
    season: { year: '2026/27', week: 1, progress: 0, appearances: 0, goals: 0, assists: 0, rating: 0, objectives: [] },
    schedule: [
      { id: 'm1', date: '2026-07-06', competition: '季前热身赛', opponent: '河畔竞技', venue: '主场', status: 'upcoming' },
      { id: 'm2', date: '2026-07-13', competition: '青年联赛', opponent: '北城学院', venue: '客场', status: 'upcoming' },
      { id: 'm3', date: '2026-07-20', competition: '青年联赛', opponent: '海港青年队', venue: '主场', status: 'upcoming' }
    ],
    injuries: [],
    relationships: { coach: 52, teammates: 48, captain: 45, fans: 1200, media: 36, rivalry: 18 },
    career: { marketValue: 650000, weeklySalary: 1800, contractMonths: 30, clubInterest: [], achievements: [], growthLog: [], injuryLog: [], history: [], honors: { trophies: [], personalAwards: [], seasons: [], retirement: null, legendProfile: null } },
    training: { selectedPlan: null, completedWeek: 0, autoStrategy: 'balanced', plansUsed: [], lastResult: null },
    events: { pending: [], history: [], cooldowns: {}, seasonCounts: {}, careerCounts: {}, characterMemory: {}, forcedPauses: 0, resolved: [] },
    transfer: { continent: null, country: null, league: null, club: null, offers: [], watchlist: [] },
    ui: { notices: [], lastFeedback: null }
  };
}

export function migrateState(input) {
  const base = createDefaultState();
  if (!input || typeof input !== 'object') return base;
  const state = { ...base, ...input };
  state.settings = { ...base.settings, ...(input.settings || {}) };
  state.simulation = { ...base.simulation, ...(input.simulation || {}) };
  state.season = { ...base.season, ...(input.season || {}) };
  state.relationships = { ...base.relationships, ...(input.relationships || {}) };
  state.career = { ...base.career, ...(input.career || {}) };
  state.career.honors = { ...base.career.honors, ...(input.career?.honors || {}) };
  state.training = { ...base.training, ...(input.training || {}) };
  state.events = { ...base.events, ...(input.events || {}) };
  state.transfer = { ...base.transfer, ...(input.transfer || {}) };
  state.ui = { ...base.ui, ...(input.ui || {}) };
  state.player = normalizePlayer(input.player);
  if (state.player) state.player.previousStats = normalizeStats(input.player?.previousStats, state.player.stats);
  state.schedule = Array.isArray(input.schedule) ? input.schedule : [];
  state.injuries = Array.isArray(input.injuries) ? input.injuries : [];
  state.career.growthLog = Array.isArray(state.career.growthLog) ? state.career.growthLog : [];
  state.career.history = Array.isArray(state.career.history) ? state.career.history : [];
  state.career.honors.trophies = Array.isArray(state.career.honors.trophies) ? state.career.honors.trophies : [];
  state.career.honors.personalAwards = Array.isArray(state.career.honors.personalAwards) ? state.career.honors.personalAwards : [];
  state.career.honors.seasons = Array.isArray(state.career.honors.seasons) ? state.career.honors.seasons : [];
  state.training.plansUsed = Array.isArray(state.training.plansUsed) ? state.training.plansUsed : [];
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
