import { EVENT_TEMPLATES } from '../data/events.js';

function hash(value){ let h=2166136261; for(const ch of value){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619);} return (h>>>0).toString(36); }
function todayIndex(date){ return Math.floor(new Date(`${date}T00:00:00Z`).getTime()/86400000); }

export class EventEngine {
  constructor(templates=EVENT_TEMPLATES){ this.templates=templates; }
  fingerprint(template){ return hash(`${template.id}:${template.category}:${template.interaction}:${template.choices.map(c=>c.id).join('|')}`); }
  eligible(state, template){
    const fp=this.fingerprint(template), day=todayIndex(state.simulation.date);
    const cooldown=state.events.cooldowns[fp]||0;
    const seasonCount=state.events.seasonCounts[template.id]||0;
    const careerCount=state.events.careerCounts[template.id]||0;
    const recent=state.events.history.slice(-8);
    const sameInteraction=recent.slice(-3).filter(e=>e.interaction===template.interaction).length;
    const sameCategory=recent.slice(-3).filter(e=>e.category===template.category).length;
    return day>=cooldown && seasonCount<3 && careerCount<8 && sameInteraction<2 && sameCategory<3 && !state.events.pending.some(e=>e.templateId===template.id);
  }
  schedule(state,{priority='normal'}={}){
    const candidates=this.templates.filter(t=>this.eligible(state,t));
    if(!candidates.length) return null;
    const seed=todayIndex(state.simulation.date)+state.events.history.length*17+state.season.week*13;
    const template=candidates[Math.abs(seed)%candidates.length];
    const event={ id:`evt-${Date.now()}-${template.id}`, templateId:template.id, fingerprint:this.fingerprint(template), priority, createdAt:state.simulation.date, ...structuredClone(template) };
    state.events.pending.push(event);
    return event;
  }
  resolve(state,eventId,choiceId){
    const idx=state.events.pending.findIndex(e=>e.id===eventId);
    if(idx<0) throw new Error('事件不存在或已经处理');
    const event=state.events.pending[idx];
    const choice=event.choices.find(c=>c.id===choiceId);
    if(!choice) throw new Error('无效事件选项');
    state.events.pending.splice(idx,1);
    const result={ eventId:event.id, templateId:event.templateId, title:event.title, interaction:event.interaction, category:event.category, choiceId, choiceLabel:choice.label, effects:structuredClone(choice.effects||{}), resolvedAt:state.simulation.date };
    state.events.history.push(result);
    state.events.resolved.push(result);
    state.events.cooldowns[event.fingerprint]=todayIndex(state.simulation.date)+14;
    state.events.seasonCounts[event.templateId]=(state.events.seasonCounts[event.templateId]||0)+1;
    state.events.careerCounts[event.templateId]=(state.events.careerCounts[event.templateId]||0)+1;
    for(const person of event.participants||[]) state.events.characterMemory[person]={lastSeen:state.simulation.date,lastEvent:event.templateId,count:(state.events.characterMemory[person]?.count||0)+1};
    return result;
  }
}
