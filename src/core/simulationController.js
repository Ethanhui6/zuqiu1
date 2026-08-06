import { advanceInjury } from './injuryEngine.js';
import { applyGrowthToState } from './playerDevelopmentEngine.js';

const addDays=(date,days)=>{ const d=new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); };
const daysBetween=(a,b)=>Math.round((new Date(`${b}T00:00:00Z`)-new Date(`${a}T00:00:00Z`))/86400000);

export class SimulationController {
  constructor(store,eventEngine){ this.store=store; this.eventEngine=eventEngine; this.running=false; this.cancelled=false; }
  pause(){ this.cancelled=true; this.running=false; this.store.set(s=>{s.simulation.paused=true;return s;}); }
  resume(){ this.cancelled=false; this.store.set(s=>{s.simulation.paused=false;return s;}); }
  nextMatch(state){ return state.schedule.find(m=>m.status==='upcoming' && m.date>=state.simulation.date) || null; }
  nextEventDate(state){ const offset=2+((state.events.history.length+state.season.week)%5); return addDays(state.simulation.date,offset); }
  describe(action,state=this.store.get()){
    const match=this.nextMatch(state);
    const map={
      nextEvent:{label:'下一事件',target:this.nextEventDate(state),days:daysBetween(state.simulation.date,this.nextEventDate(state)),pause:'遇到待处理事件',summary:false},
      nextMatch:{label:'下一场比赛',target:match?.date||state.simulation.date,days:match?daysBetween(state.simulation.date,match.date):0,pause:'比赛前准备',summary:true},
      week:{label:'推进一周',target:addDays(state.simulation.date,7),days:7,pause:'关键事件或比赛',summary:true},
      month:{label:'推进一个月',target:addDays(state.simulation.date,30),days:30,pause:'关键事件或比赛',summary:true},
      halfSeason:{label:'推进半赛季',target:addDays(state.simulation.date,120),days:120,pause:'比赛、伤病或转会窗口',summary:true},
      window:{label:'推进至转会窗口',target:`${new Date(state.simulation.date).getUTCFullYear()+1}-01-01`,days:daysBetween(state.simulation.date,`${new Date(state.simulation.date).getUTCFullYear()+1}-01-01`),pause:'转会窗口开启',summary:true},
      seasonEnd:{label:'推进至赛季结束',target:`${new Date(state.simulation.date).getUTCFullYear()+1}-06-30`,days:daysBetween(state.simulation.date,`${new Date(state.simulation.date).getUTCFullYear()+1}-06-30`),pause:'赛季结束',summary:true}
    };
    return map[action];
  }
  async advance(action){
    if(this.running) return {status:'busy'};
    const desc=this.describe(action); if(!desc) throw new Error('未知推进方式');
    if(this.store.get().simulation.paused) return {status:'paused'};
    this.running=true; this.cancelled=false;
    const max=Math.max(0,desc.days); let processed=0; let stopReason='target'; let generatedEvent=null; let matchReady=null;
    for(let i=0;i<max;i++){
      if(this.cancelled||this.store.get().simulation.paused){ stopReason='paused'; break; }
      this.store.set(state=>{
        const nextDate=addDays(state.simulation.date,1);
        const key=`day:${nextDate}`;
        if(state.simulation.processedKeys.includes(key)) return state;
        state.simulation.date=nextDate; state.simulation.processedKeys.push(key); state.simulation.processedKeys=state.simulation.processedKeys.slice(-400);
        state.season.week=1+Math.floor(daysBetween(`${new Date(nextDate).getUTCFullYear()}-07-01`,nextDate)/7);
        state.season.progress=Math.max(0,Math.min(100,Math.round(daysBetween(`${new Date(nextDate).getUTCFullYear()}-07-01`,nextDate)/365*100)));
        state.injuries=state.injuries.map(injury=>advanceInjury(injury,1,{date:nextDate,recoveryBonus:state.training.autoStrategy==='recovery'?.18:0}));
        if(state.player && (state.season.week%2===0) && !state.simulation.processedKeys.includes(`micro:${state.season.week}`)){
          applyGrowthToState(state,{passing:.02,physical:.015},{source:'时间推进',fatigue:state.player.fatigue||0,facility:74,coachQuality:72,injured:state.injuries.some(x=>x.status==='active')});
          state.simulation.processedKeys.push(`micro:${state.season.week}`);
        }
        return state;
      });
      processed++;
      const state=this.store.get(); const match=this.nextMatch(state);
      if(match && match.date===state.simulation.date){ matchReady=match; stopReason='match'; break; }
      if(action==='nextEvent' && state.simulation.date>=desc.target){
        this.store.set(s=>{generatedEvent=this.eventEngine.schedule(s,{priority:'important'});return s;}); stopReason='event'; break;
      }
      if(['week','month','halfSeason','window','seasonEnd'].includes(action)){
        const density=state.settings.mode==='legend'?3:state.settings.mode==='fast'?8:state.settings.mode==='ultra'?12:5;
        if(processed%density===0 && !state.events.pending.length){
          this.store.set(s=>{generatedEvent=this.eventEngine.schedule(s,{priority:state.settings.mode==='legend'?'important':'normal'});return s;});
          if(generatedEvent && state.settings.autoPauseCritical && generatedEvent.priority==='important'){stopReason='event';break;}
        }
      }
      await Promise.resolve();
    }
    const dueToday=this.nextMatch(this.store.get());
    if(action==='nextMatch'&&dueToday?.date===this.store.get().simulation.date){matchReady=dueToday;stopReason='match';}
    this.store.set(state=>{ if(desc.summary && processed>0) state.simulation.summaries.unshift({date:state.simulation.date,action,days:processed,reason:stopReason}); return state; });
    this.running=false;
    return {status:'ok',processed,stopReason,event:generatedEvent,match:matchReady,description:desc};
  }
}
