import { EVENT_TEMPLATES } from '../data/events.js';
import { selectScene } from '../data/sceneRegistry.js';

const DAY = 86400000;
const hash = value => { let h = 2166136261; for (const char of String(value)) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return h >>> 0; };
const dayIndex = date => Math.floor(new Date(`${date}T00:00:00Z`).getTime() / DAY);
const addDays = (date, days) => { const next = new Date(`${date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + days); return next.toISOString().slice(0, 10); };
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const RARITIES = ['common', 'rare', 'hidden', 'crisis', 'opportunity', 'legendary'];
const CHAIN_MAP = Object.freeze({
  'late-finishing': 'training-flip',
  'ankle-warning': 'branch-crisis',
  'agent-envelope': 'contract-table',
  'locker-balance': 'media-mistake',
  'media-mistake': 'locker-balance'
});
const isMatchTemplate = template => template?.kind === 'match' || template?.category === '比赛';

function ensureEvents(state) {
  state.events ??= {};
  for (const key of ['pending', 'history', 'resolved', 'delayedEffects', 'chains', 'lastInteractionIds', 'sceneHistory']) if (!Array.isArray(state.events[key])) state.events[key] = [];
  for (const key of ['cooldowns', 'sceneCooldowns', 'seasonCounts', 'careerCounts', 'characterMemory']) if (!state.events[key] || typeof state.events[key] !== 'object') state.events[key] = {};
  return state.events;
}

function rarity(template, priority, seed) {
  if (RARITIES.includes(template.rarity)) return template.rarity;
  const roll = hash(`${template.id}:${seed}`) % 100;
  if (priority === 'important' && roll < 8) return 'legendary';
  if (roll < 12) return 'crisis';
  if (roll < 28) return 'rare';
  if (roll < 42) return 'opportunity';
  return 'common';
}

function choiceMeta(choice, template) {
  const effects = choice.effects || {};
  const rewardKeys = Object.entries(effects).filter(([, value]) => Number(value) > 0 && !['risk', 'fatigue'].includes(String(value))).map(([key]) => key);
  const costKeys = Object.entries(effects).filter(([key, value]) => Number(value) < 0 || ['fatigue', 'risk'].includes(key)).map(([key]) => key);
  const risk = clamp(choice.risk ?? (Number(effects.risk || 0) * 3 + (costKeys.length ? 15 : 4)), 1, 95);
  return {
    ...choice,
    risk: Math.round(risk),
    rewardTypes: choice.rewardTypes || rewardKeys.slice(0, 3),
    costTypes: choice.costTypes || costKeys.slice(0, 3),
    durationWeeks: Number(choice.durationWeeks || (risk > 55 ? 2 : 0)),
    followUp: choice.followUp || CHAIN_MAP[template.id] || null
  };
}

function eventImpact(state, choice, event) {
  const player = state.player || {};
  const stats = player.stats || {};
  const statKey = Object.keys(choice.effects || {}).find(key => ['speed', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].includes(key));
  const stat = Number(stats[statKey] || player.ovr || 60);
  const morale = Number(player.morale || 50);
  const fatigue = Number(player.fatigue || 0);
  const trust = Number(player.coachTrust || 50);
  const pressure = Number(event.risk || choice.risk || 20);
  const chance = clamp(.46 + (stat - 60) / 180 + (morale - 50) / 300 + (trust - 50) / 360 - fatigue / 500 - pressure / 520, .18, .9);
  const roll = (hash(`${event.id}:${choice.id}:${state.simulation.date}`) % 1000) / 1000;
  const success = roll < chance;
  const multiplier = success ? 1 + (chance - .5) * .32 : .42;
  const effects = Object.fromEntries(Object.entries(choice.effects || {}).map(([key, value]) => {
    if (typeof value !== 'number') return [key, value];
    if (key === 'risk') return [key, Math.round(value)];
    const scaled = value >= 0 ? value * multiplier : value * (success ? 1 : 1.24);
    return [key, Number(scaled.toFixed(3))];
  }));
  return { success, chance: Number(chance.toFixed(3)), roll: Number(roll.toFixed(3)), effects };
}

export function estimateEventChance(state, event, choice) {
  return eventImpact(state, choice, event).chance;
}

export class EventEngine {
  constructor(templates = EVENT_TEMPLATES, { kind = 'career' } = {}) { this.templates = templates; this.kind = kind; }
  fingerprint(template) { return hash(`${template.id}:${template.category}:${template.interaction}:${template.choices.map(choice => choice.id).join('|')}`).toString(36); }

  flushDelayed(state) {
    const events = ensureEvents(state);
    const due = events.delayedEffects.filter(item => item.dueDate <= state.simulation.date);
    events.delayedEffects = events.delayedEffects.filter(item => item.dueDate > state.simulation.date);
    for (const item of due) {
      if (item.kind === 'event' && !events.pending.some(event => event.templateId === item.templateId)) {
        const template = this.templates.find(candidate => candidate.id === item.templateId);
        if (template) this.schedule(state, { priority: item.priority || 'important', forceTemplate: template, chainDepth: item.chainDepth || 1 });
      }
    }
    return due;
  }

  eligible(state, template) {
    const events = ensureEvents(state);
    if (this.kind === 'career' && isMatchTemplate(template)) return false;
    if (template.positions?.length && !template.positions.includes(state.player?.position)) return false;
    const conditions=template.conditions||{},age=Number(state.player?.age||16),ovr=Number(state.player?.ovr||0);
    if(Number.isFinite(Number(conditions.minAge))&&age<Number(conditions.minAge))return false;
    if(Number.isFinite(Number(conditions.maxAge))&&age>Number(conditions.maxAge))return false;
    if(Number.isFinite(Number(conditions.minOvr))&&ovr<Number(conditions.minOvr))return false;
    if(conditions.requiresInjury&&!state.injuries?.some(injury=>!['recovered','archived'].includes(injury.status)))return false;
    if(conditions.requiresOffSeason&&state.career?.offSeason?.status!=='active')return false;
    const fingerprint = this.fingerprint(template);
    const day = dayIndex(state.simulation.date);
    const recent = events.history.slice(-8);
    const sameInteraction = recent.slice(-3).filter(event => event.interaction === template.interaction).length;
    const sameCategory = recent.slice(-3).filter(event => event.category === template.category).length;
    return day >= (events.cooldowns[fingerprint] || 0)
      && (events.seasonCounts[template.id] || 0) < 3
      && (events.careerCounts[template.id] || 0) < 8
      && sameInteraction < 2
      && sameCategory < 3
      && !events.pending.some(event => event.templateId === template.id)
      && !events.lastInteractionIds.slice(-3).includes(template.interaction);
  }

  schedule(state, { priority = 'normal', forceTemplate = null, chainDepth = 0 } = {}) {
    const events = ensureEvents(state);
    this.flushDelayed(state);
    if (this.kind === 'career' && isMatchTemplate(forceTemplate)) return null;
    const candidates = forceTemplate ? [forceTemplate] : this.templates.filter(template => this.eligible(state, template));
    if (!candidates.length) return null;
    const seed = dayIndex(state.simulation.date) + events.history.length * 17 + Number(state.season?.week || 1) * 13;
    const template = candidates[Math.abs(hash(`${seed}:${priority}`)) % candidates.length];
    const currentRarity = rarity(template, priority, seed);
    const scene = selectScene(template, { recentIds: events.sceneHistory.slice(-3), seed: hash(`${seed}:${template.id}:${currentRarity}`) });
    const event = {
      id: `evt-${seed}-${template.id}-${events.history.length}`,
      kind: this.kind,
      templateId: template.id,
      fingerprint: this.fingerprint(template),
      priority,
      rarity: currentRarity,
      chainDepth,
      sceneId: scene.id,
      sceneName: scene.name,
      art: scene.art,
      createdAt: state.simulation.date,
      risk: currentRarity === 'crisis' ? 72 : currentRarity === 'legendary' ? 58 : currentRarity === 'rare' ? 42 : 24,
      ...structuredClone(template)
    };
    event.choices = event.choices.map(choice => choiceMeta(choice, event));
    events.pending.push(event);
    events.lastInteractionIds.push(event.interaction);
    events.lastInteractionIds = events.lastInteractionIds.slice(-12);
    events.sceneHistory.push(scene.id);
    events.sceneHistory = events.sceneHistory.slice(-12);
    events.sceneCooldowns[scene.id] = dayIndex(state.simulation.date) + 10;
    return event;
  }

  resolve(state, eventId, choiceId) {
    const events = ensureEvents(state);
    const index = events.pending.findIndex(event => event.id === eventId);
    if (index < 0) throw new Error('事件不存在或已经处理');
    const event = events.pending[index];
    const choice = event.choices.find(candidate => candidate.id === choiceId);
    if (!choice) throw new Error('无效事件选项');
    const outcome = eventImpact(state, choice, event);
    events.pending.splice(index, 1);
    const result = {
      eventId: event.id,
      templateId: event.templateId,
      title: event.title,
      interaction: event.interaction,
      category: event.category,
      sceneId: event.sceneId,
      rarity: event.rarity,
      choiceId,
      choiceLabel: choice.label,
      resultText: outcome.success ? choice.successText : choice.failureText,
      effects: outcome.effects,
      outcome: outcome.success ? 'success' : 'failure',
      chance: outcome.chance,
      roll: outcome.roll,
      risk: choice.risk,
      resolvedAt: state.simulation.date
    };
    events.history.push(result);
    events.resolved.push(result);
    events.cooldowns[event.fingerprint] = dayIndex(state.simulation.date) + (event.rarity === 'legendary' ? 35 : 14);
    events.seasonCounts[event.templateId] = (events.seasonCounts[event.templateId] || 0) + 1;
    events.careerCounts[event.templateId] = (events.careerCounts[event.templateId] || 0) + 1;
    for (const person of event.participants || []) events.characterMemory[person] = { lastSeen: state.simulation.date, lastEvent: event.templateId, count: (events.characterMemory[person]?.count || 0) + 1 };
    if (choice.followUp && outcome.success && events.careerCounts[choice.followUp] < 4) {
      const delayed = { kind: 'event', templateId: choice.followUp, dueDate: addDays(state.simulation.date, Math.max(2, choice.durationWeeks * 7 || 3)), priority: event.rarity === 'legendary' ? 'important' : 'normal', chainDepth: event.chainDepth + 1 };
      events.delayedEffects.push(delayed);
      events.chains.push({ from: event.templateId, to: choice.followUp, dueDate: delayed.dueDate, depth: delayed.chainDepth });
      result.followUp = delayed;
    }
    return result;
  }
}
