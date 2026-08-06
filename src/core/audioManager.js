const STORAGE_KEY = 'football-career-audio-v1';
const DEFAULTS = Object.freeze({ master: 0.45, music: 0.22, ambience: 0.22, effects: 0.5, muted: false });
const PATTERNS = {
  tap: [330], confirm: [440, 660], back: [520, 360], panel: [390, 520], warning: [220, 180], failure: [180, 130],
  countdown: [280], whistle: [720, 960], correct: [520, 780], wrong: [160], combo: [440, 550, 660],
  record: [520, 660, 880], goal: [440, 660, 880, 1040], crowd: [240, 300, 360], trophy: [660, 880, 1100],
  recovery: [380, 460, 540], event: [300, 450], rare: [420, 620, 920], match: [260, 340], save: [500, 700]
};

function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}

export class AudioManager {
  constructor() { this.settings = loadSettings(); this.context = null; this.active = new Set(); this.last = new Map(); }
  configure(settings = {}) { this.settings = { ...this.settings, ...settings }; this.persist(); }
  persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings)); } catch {} }
  setMuted(value) { this.settings.muted = Boolean(value); this.persist(); }
  setLevel(key, value) { if (key in DEFAULTS && key !== 'muted') this.settings[key] = Math.max(0, Math.min(1, Number(value) || 0)); this.persist(); }
  stopAll() { this.active.forEach(node => { try { node.stop(); } catch {} }); this.active.clear(); }
  play(kind = 'tap', { category = 'effects', force = false } = {}) {
    if (this.settings.muted || !this.settings.master || typeof window === 'undefined') return false;
    const now = Date.now(); if (!force && now - (this.last.get(kind) || 0) < 90) return false; this.last.set(kind, now);
    const Context = window.AudioContext || window.webkitAudioContext; if (!Context) return false;
    try {
      this.context ||= new Context();
      if (this.context.state === 'suspended') void this.context.resume();
      const gain = this.context.createGain();
      const volume = this.settings.master * (this.settings[category] ?? this.settings.effects) * 0.055;
      gain.gain.setValueAtTime(volume, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.18);
      gain.connect(this.context.destination);
      const notes = PATTERNS[kind] || PATTERNS.tap;
      notes.forEach((frequency, index) => {
        const oscillator = this.context.createOscillator(); oscillator.type = kind === 'warning' ? 'square' : 'sine';
        oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start(this.context.currentTime + index * 0.045); oscillator.stop(this.context.currentTime + 0.16 + index * 0.045);
        this.active.add(oscillator); oscillator.addEventListener('ended', () => this.active.delete(oscillator), { once: true });
      });
      return true;
    } catch { return false; }
  }
}

export const audioManager = new AudioManager();
export const AUDIO_CATALOG = Object.freeze(Object.keys(PATTERNS).map(id => ({ id, source: '项目自制 Web Audio 合成音，无外部素材', license: 'MIT' })));
