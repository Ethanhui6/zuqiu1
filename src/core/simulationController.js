import { advanceInjury } from './injuryEngine.js';
import { applyGrowthToState } from './playerDevelopmentEngine.js';
import { keyedRandom } from '../services/rng.js';
import { createTrainingOpportunity } from './trainingOpportunities.js';
import { addNews } from './newsEngine.js';

const addDays=(date,days)=>{ const d=new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); };
const daysBetween=(a,b)=>Math.round((new Date(`${b}T00:00:00Z`)-new Date(`${a}T00:00:00Z`))/86400000);

// Fast mode is intentionally a short career-management loop, not a timed simulation.
export const FAST_SEASON_PACE=Object.freeze({
  mode:'fast', trainingWeeks:Object.freeze([6,20]), maxTrainingNodes:2, autoEventCheckDays:8,
  targetSeconds:Object.freeze({min:15,max:30}), expectedActions:Object.freeze({advance:3,training:2}),
  actionSeconds:Object.freeze({advance:2,training:7})
});
export const assessFastSeasonPace=({advanceActions=FAST_SEASON_PACE.expectedActions.advance,trainingChoices=FAST_SEASON_PACE.expectedActions.training}={})=>{
  const estimatedSeconds=advanceActions*FAST_SEASON_PACE.actionSeconds.advance+trainingChoices*FAST_SEASON_PACE.actionSeconds.training;
  return {advanceActions,trainingChoices,estimatedSeconds,withinTarget:estimatedSeconds>=FAST_SEASON_PACE.targetSeconds.min&&estimatedSeconds<=FAST_SEASON_PACE.targetSeconds.max};
};

export class CareerDirector {
  constructor(store,eventEngine){ this.store=store; this.eventEngine=eventEngine; this.running=false; this.cancelled=false; }
  pause(){ this.cancelled=true; this.running=false; this.store.set(s=>{s.simulation.paused=true;return s;}); }
  resume(){ this.cancelled=false; this.store.set(s=>{s.simulation.paused=false;return s;}); }
  nextMatch(state){ return state.schedule.find(m=>m.status==='upcoming' && m.date>=state.simulation.date) || null; }
  isKeyMatch(match){ return Boolean(match?.important); }
  shouldAutoSimulateMatch(match){ return Boolean(match)&&!this.isKeyMatch(match); }
  nextEventDate(state){ const offset=2+((state.events.history.length+state.season.week)%5); return addDays(state.simulation.date,offset); }
  seasonEndDate(state){ const date=new Date(`${state.simulation.date}T00:00:00Z`),year=date.getUTCFullYear(); return `${date.getUTCMonth()>=6?year+1:year}-06-30`; }
  ensureFixtures(state){
    if(!state.player||state.season.progress>=99)return;
    if(state.schedule.some(match=>match.status==='upcoming'&&match.date>=state.simulation.date))return;
    const opponents=['河畔竞技','北城学院','海港青年队','山城体育','东港联队','中央公园'];
    const played=state.schedule.filter(match=>match.status==='played');
    state.schedule=[...played,...opponents.map((opponent,index)=>({id:`${state.season.year}-fixture-${index}-${state.simulation.date}`,date:addDays(state.simulation.date,7+index*21),competition:index%3===0?'国内杯赛':'青年联赛',opponent,venue:index%2?'客场':'主场',status:'upcoming',season:state.season.year}))];
  }
  nextNode(state=this.store.get()){
    if (state.career?.offSeason?.status === 'active') return { type: 'off-season', label: '安排休赛期', action: 'offSeason', blocked: true };
    if (state.events?.pending?.length) return { type: 'event', label: '处理待办事件', action: 'nextEvent', blocked: true };
    if (state.training?.currentOpportunity) return { type: 'training', label: '处理关键训练机会', action: 'training', blocked: true, target: state.training.currentOpportunity.createdAt };
    const match = this.nextMatch(state);
    if (!match||this.shouldAutoSimulateMatch(match)) return { type: 'time', label: '快速结算到下一个职业节点', target: this.seasonEndDate(state), action: 'seasonEnd', match };
    if (match) return { type: 'match', label: `准备 ${match.competition}`, target: match.date, action: 'nextMatch', match };
    if (state.season?.progress >= 99) return { type: 'season', label: '赛季结算', target: state.simulation.date, action: 'seasonEnd' };
    return { type: 'time', label: '推进至下一关键节点', target: addDays(state.simulation.date, 30), action: 'month' };
  }
  describe(action,state=this.store.get()){
    const match=this.nextMatch(state);
    const map={
      nextEvent:{label:'下一事件',target:this.nextEventDate(state),days:daysBetween(state.simulation.date,this.nextEventDate(state)),pause:'遇到待处理事件',summary:false},
      nextMatch:{label:'下一场比赛',target:match?.date||state.simulation.date,days:match?daysBetween(state.simulation.date,match.date):0,pause:'比赛前准备',summary:true},
      week:{label:'推进一周',target:addDays(state.simulation.date,7),days:7,pause:'关键事件或比赛',summary:true},
      month:{label:'推进一个月',target:addDays(state.simulation.date,30),days:30,pause:'关键事件或比赛',summary:true},
      halfSeason:{label:'推进半赛季',target:addDays(state.simulation.date,120),days:120,pause:'比赛、伤病或转会窗口',summary:true},
      window:{label:'推进至转会窗口',target:`${new Date(state.simulation.date).getUTCFullYear()+1}-01-01`,days:daysBetween(state.simulation.date,`${new Date(state.simulation.date).getUTCFullYear()+1}-01-01`),pause:'转会窗口开启',summary:true},
      seasonEnd:{label:'推进至赛季结束',target:this.seasonEndDate(state),days:daysBetween(state.simulation.date,this.seasonEndDate(state)),pause:'赛季结束',summary:true}
    };
    return map[action];
  }
  settleAutoMatch(state,match){
    const fixture=state.schedule.find(item=>item.id===match?.id);
    if(!state.player||!fixture||fixture.status!=='upcoming')return false;
    const rng=keyedRandom(fixture.id,fixture.date,state.player.ovr,state.season.appearances);
    const played=rng.bool(.84);
    const rating=Number((played?Math.max(5.8,Math.min(9.1,6.2+(state.player.ovr-55)/34+rng.next()*.9)):0).toFixed(1));
    const goals=played&&rng.bool(['ST','LW','RW','SS','CAM'].includes(state.player.position)?.24:.10)?1:0;
    const assists=played&&rng.bool(['CM','CAM','LW','RW'].includes(state.player.position)?.22:.12)?1:0;
    const teamGoals=played?goals+(rng.bool(.48)?1:0):0;
    const opponentGoals=rng.int(0,2);
    fixture.status='played';fixture.score=`${teamGoals}-${opponentGoals}`;fixture.rating=rating;fixture.played=played;fixture.auto=true;
    if(!played){state.career.history.push({date:state.simulation.date,type:'比赛',summary:`${state.player.club} ${teamGoals}-${opponentGoals} ${fixture.opponent}`,rating:0,goals:0,assists:0,minutes:0,auto:true});return true;}
    const oldApps=state.season.appearances;
    applyGrowthToState(state,{passing:.04,physical:.03},{source:'自动模拟比赛',fatigue:state.player.fatigue||0,facility:74,coachQuality:72,mode:state.settings.mode,injured:false});
    state.player.fatigue=Math.max(0,Math.min(100,(state.player.fatigue||0)+8));
    state.player.fitness=Math.max(10,100-state.player.fatigue*.7);
    state.season.appearances=oldApps+1;state.season.goals+=goals;state.season.assists+=assists;
    state.season.rating=Number(((state.season.rating*oldApps+rating)/(oldApps+1)).toFixed(2));
    state.career.marketValue=Math.max(0,state.career.marketValue+Math.round((rating-6)*18000+goals*50000+assists*32000));
    state.career.history.push({date:state.simulation.date,type:'比赛',summary:`${state.player.club} ${teamGoals}-${opponentGoals} ${fixture.opponent}`,rating,goals,assists,minutes:played?Math.round(55+rng.next()*30):0,auto:true});
    addNews(state,{id:`auto-match-${fixture.id}`,type:'比赛',title:`${fixture.competition}完成自动结算`,copy:`${state.player.club} ${teamGoals}-${opponentGoals} ${fixture.opponent}，评分 ${rating}。`});
    return true;
  }
  async advance(action){
    if(this.running) return {status:'busy'};
    this.store.set(state=>{this.ensureFixtures(state);return state;});
    const desc=this.describe(action); if(!desc) throw new Error('未知推进方式');
    if(this.store.get().simulation.paused) return {status:'paused'};
    if(this.store.get().training.currentOpportunity)return {status:'needs-training',trainingOpportunity:this.store.get().training.currentOpportunity,processed:0,stopReason:'training'};
    const dueMatch=action==='nextMatch'&&this.nextMatch(this.store.get());
    if(dueMatch?.date===this.store.get().simulation.date){
      if(this.shouldAutoSimulateMatch(dueMatch)){this.store.set(state=>{this.settleAutoMatch(state,dueMatch);return state;});return {status:'ok',processed:0,autoMatches:1,stopReason:'match-auto',event:null,match:dueMatch,description:desc};}
      return {status:'ok',processed:0,stopReason:'match',event:null,match:dueMatch,description:desc};
    }
    this.running=true; this.cancelled=false;
    const max=Math.max(0,desc.days); let processed=0; let autoMatches=0; let stopReason='target'; let generatedEvent=null; let matchReady=null; let trainingOpportunity=null;
    for(let i=0;i<max;i++){
      if(this.cancelled||this.store.get().simulation.paused){ stopReason='paused'; break; }
      this.store.set(state=>{
        const nextDate=addDays(state.simulation.date,1);
        const key=`day:${nextDate}`;
        if(state.simulation.processedKeys.includes(key)) return state;
        state.simulation.date=nextDate; state.simulation.processedKeys.push(key); state.simulation.processedKeys=state.simulation.processedKeys.slice(-400);
        const year=new Date(`${nextDate}T00:00:00Z`).getUTCFullYear(),seasonStart=`${new Date(`${nextDate}T00:00:00Z`).getUTCMonth()>=6?year:year-1}-07-01`;
        state.season.week=1+Math.floor(daysBetween(seasonStart,nextDate)/7);
        state.season.progress=Math.max(0,Math.min(100,Math.round(daysBetween(seasonStart,nextDate)/365*100)));
        state.injuries=state.injuries.map(injury=>advanceInjury(injury,1,{date:nextDate,recoveryBonus:state.training.autoStrategy==='recovery'?.18:0}));
        const microKey=`micro:${seasonStart.slice(0,4)}:${state.season.week}`;
        if(state.player && (state.season.week%2===0) && !state.simulation.processedKeys.includes(microKey)){
          applyGrowthToState(state,{passing:.02,physical:.015},{source:'日常成长',fatigue:state.player.fatigue||0,facility:74,coachQuality:72,mode:state.settings.mode,injured:state.injuries.some(x=>x.status==='active')});
          state.simulation.processedKeys.push(microKey);
        }
        return state;
      });
      processed++;
      const state=this.store.get(); const match=this.nextMatch(state);
      if(match && match.date===state.simulation.date){
        if(this.shouldAutoSimulateMatch(match)){this.store.set(next=>{this.settleAutoMatch(next,match);return next;});autoMatches++;continue;}
        matchReady=match; stopReason='match'; break;
      }
      const trainingKey=`training-node:${state.season.year}:${state.season.week}`;
      if(!state.training.currentOpportunity&&Number(state.training.seasonTrainingCount||0)<FAST_SEASON_PACE.maxTrainingNodes&&FAST_SEASON_PACE.trainingWeeks.includes(state.season.week)&&new Date(`${state.simulation.date}T00:00:00Z`).getUTCDay()===1&&!state.simulation.processedKeys.includes(trainingKey)){
        this.store.set(next=>{next.simulation.processedKeys.push(trainingKey);trainingOpportunity=createTrainingOpportunity(next,{seed:`${next.simulation.date}:${trainingKey}`});return next;});
        if(trainingOpportunity){stopReason='training';break;}
      }
      if(action==='nextEvent' && state.simulation.date>=desc.target){
        this.store.set(s=>{generatedEvent=this.eventEngine.schedule(s,{priority:'important'});return s;}); stopReason='event'; break;
      }
      if(['week','month','halfSeason','window','seasonEnd'].includes(action)){
        const density=state.settings.mode==='legend'?3:state.settings.mode===FAST_SEASON_PACE.mode?FAST_SEASON_PACE.autoEventCheckDays:state.settings.mode==='ultra'?12:5;
        if(processed%density===0 && !state.events.pending.length && !(state.settings.mode===FAST_SEASON_PACE.mode&&state.settings.autoSkipLow!==false)){
          this.store.set(s=>{generatedEvent=this.eventEngine.schedule(s,{priority:state.settings.mode==='legend'?'important':'normal'});return s;});
          if(generatedEvent && state.settings.autoPauseCritical && generatedEvent.priority==='important'){stopReason='event';break;}
        }
      }
      await Promise.resolve();
    }
    this.store.set(state=>{ if(desc.summary && processed>0) state.simulation.summaries.unshift({date:state.simulation.date,action,days:processed,reason:stopReason}); return state; });
    this.running=false;
    return {status:'ok',processed,autoMatches,stopReason,event:generatedEvent,match:matchReady,trainingOpportunity,description:desc};
  }
}

// Preserves existing imports while the production entry uses CareerDirector directly.
export { CareerDirector as SimulationController };
