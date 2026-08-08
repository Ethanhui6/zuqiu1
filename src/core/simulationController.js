import { advanceInjury } from './injuryEngine.js';
import { matchAvailability, recordMatchCard, serveSuspension } from './disciplineEngine.js';
import { applyGrowthToState } from './playerDevelopmentEngine.js';
import { keyedRandom } from '../services/rng.js';
import { createTrainingOpportunity } from './trainingOpportunities.js';
import { addNews, generateWorldNews } from './newsEngine.js';
import { dataRepository } from '../services/dataRepository.js';
import { CLUBS } from '../data/clubs.js';
import { generateTransferActivity } from './transferInboxEngine.js';

const addDays=(date,days)=>{ const d=new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); };
const daysBetween=(a,b)=>Math.round((new Date(`${b}T00:00:00Z`)-new Date(`${a}T00:00:00Z`))/86400000);
export const FICTIONAL_OPPONENTS=new Set(['河畔竞技','北城学院','海港青年队','山城体育','东港联队','中央公园']);
export const SEASON_STAT_FIELDS=Object.freeze(['appearances','starts','minutes','goals','assists','shots','keyPasses','tackles','interceptions','saves','cleanSheets','yellowCards','redCards','playerOfMatch','injuryAbsences']);

export function createRealFixtures(state,clubs=dataRepository.clubs?.length?dataRepository.clubs:CLUBS){
  const player=state.player,current=clubs.find(club=>club.id===player?.clubId)||clubs.find(club=>(club.cn||club.name)===player?.club)||{id:player?.clubId||'career-club',name:player?.club,country:player?.country||player?.nation,continent:player?.continent,league:player?.league};
  if(!player||clubs.length<2)return [];
  const league=club=>club.leagueId||club.leagueCn||club.league;
  const order=[...clubs].filter(club=>club.id!==current.id).sort((a,b)=>{
    const priority=club=>(league(club)===league(current)?0:club.country===current.country?1:club.continent&&club.continent===current.continent?2:3);
    return priority(a)-priority(b)||fixtureHash(`${state.season?.year}:${current.id}:${a.id}`)-fixtureHash(`${state.season?.year}:${current.id}:${b.id}`);
  });
  const leagueOpponents=order.filter(club=>league(club)===league(current));
  const opponents=leagueOpponents.length?leagueOpponents:order.slice(0,20);
  const count=Math.max(34,Math.min(40,leagueOpponents.length*2+4));
  const leagueName=current.leagueCn||current.league||player.league||'联赛';
  const keyRounds=new Set(['fast','legend'].includes(state.settings?.mode)?[]:[Math.floor(count*.48),count-1]);
  const cupRounds=new Map([[Math.floor(count*.32),'国内杯赛'],[Math.floor(count*.72),'洲际赛事']]);
  return Array.from({length:count},(_,index)=>{
    const opponent=opponents[index%opponents.length],home=index%2===0;
    return {id:`${state.season?.year||'season'}-${current.id}-${opponent.id}-${index}`,date:addDays(state.simulation.date,7+Math.round(index*322/(count-1))),competition:cupRounds.get(index)||leagueName,opponent:opponent.cn||opponent.name,opponentId:opponent.id,opponentCrest:opponent.crest||opponent.crestPath||null,opponentLeague:opponent.leagueCn||opponent.league||null,venue:home?'主场':'客场',home,status:'upcoming',important:keyRounds.has(index),round:index+1,season:state.season?.year};
  });
}

export function replaceFictionalFixtures(state,clubs=dataRepository.clubs||[]){
  if(!(state.schedule||[]).some(match=>match.status==='upcoming'&&FICTIONAL_OPPONENTS.has(match.opponent)))return false;
  const replacements=createRealFixtures(state,clubs);
  if(!replacements.length)return false;
  const preserved=(state.schedule||[]).filter(match=>match.status!=='upcoming'||!FICTIONAL_OPPONENTS.has(match.opponent));
  state.schedule=[...preserved,...replacements].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  return true;
}

function fixtureHash(value){let hash=2166136261;for(const char of String(value))hash=Math.imul(hash^char.charCodeAt(0),16777619);return hash>>>0;}

function positionGroup(position){
  if(position==='GK')return 'keeper';
  if(['CB','LB','RB','LWB','RWB','DM','CDM'].includes(position))return 'defense';
  if(['CM','CAM','AM','LM','RM'].includes(position))return 'midfield';
  return 'attack';
}

function simulatedPlayerStats(player,rng,{played,starts,minutes,goals,assists,opponentGoals,rating}){
  const group=positionGroup(player.position);
  if(!played)return {played:false,starts:false,minutes:0,goals:0,assists:0,shots:0,keyPasses:0,tackles:0,interceptions:0,saves:0,cleanSheets:0,rating:0};
  const stats={played:true,starts,minutes,goals,assists,shots:0,keyPasses:0,tackles:0,interceptions:0,saves:0,cleanSheets:0,rating};
  if(group==='keeper'){stats.saves=rng.int(2,8);stats.keyPasses=rng.int(0,1);}
  else if(group==='defense'){stats.shots=rng.int(goals,2);stats.keyPasses=rng.int(0,2);stats.tackles=rng.int(2,7);stats.interceptions=rng.int(1,5);}
  else if(group==='midfield'){stats.shots=rng.int(goals,3);stats.keyPasses=rng.int(1,5);stats.tackles=rng.int(1,4);stats.interceptions=rng.int(0,3);}
  else{stats.shots=rng.int(Math.max(1,goals),6);stats.keyPasses=rng.int(0,3);stats.tackles=rng.int(0,2);stats.interceptions=rng.int(0,1);}
  stats.cleanSheets=opponentGoals===0&&['keeper','defense'].includes(group)?1:0;
  return stats;
}

export function recordMatchResult(state,match,result={}){
  const fixture=state.schedule.find(item=>item.id===match?.id);
  if(!fixture||fixture.status!=='upcoming')return false;
  const played=Boolean(result.played),rating=played?Math.max(0,Number(result.rating)||0):0;
  const stats={played,starts:played&&Boolean(result.starts),minutes:played?Math.max(0,Number(result.minutes)||0):0,rating,yellowCards:result.card==='yellow'?1:0,redCards:result.card==='red'?1:0,playerOfMatch:played&&rating>=8.5?1:0,injuryAbsences:result.unavailable==='injury'?1:0};
  for(const field of ['goals','assists','shots','keyPasses','tackles','interceptions','saves','cleanSheets'])stats[field]=played?Math.max(0,Number(result[field])||0):0;
  fixture.status='played';fixture.score=result.score||'-';fixture.rating=rating;fixture.played=played;fixture.auto=Boolean(result.auto);fixture.unavailable=result.unavailable||null;fixture.playerStats={...stats};
  if(result.card)recordMatchCard(state,result.card,{date:state.simulation.date,matchId:fixture.id});
  if(result.unavailable==='suspension')serveSuspension(state,fixture.id);
  if(result.unavailable==='injury')state.season.injuryAbsences=Number(state.season.injuryAbsences||0)+1;
  if(played){
    const oldApps=Number(state.season.appearances||0);
    state.season.appearances=oldApps+1;
    state.season.starts=Number(state.season.starts||0)+(stats.starts?1:0);
    for(const field of ['minutes','goals','assists','shots','keyPasses','tackles','interceptions','saves','cleanSheets'])state.season[field]=Number(state.season[field]||0)+stats[field];
    state.season.rating=Number(((Number(state.season.rating||0)*oldApps+rating)/(oldApps+1)).toFixed(2));
    state.season.playerOfMatch=Number(state.season.playerOfMatch||0)+stats.playerOfMatch;
  }
  state.career.history.push({date:state.simulation.date,type:'比赛',summary:result.summary||`${state.player.club} ${fixture.score} ${fixture.opponent}`,...stats,auto:Boolean(result.auto),unavailable:result.unavailable||null,...(result.history||{})});
  return true;
}

// Fast mode is intentionally a short career-management loop, not a timed simulation.
export const FAST_SEASON_PACE=Object.freeze({
  mode:'fast', trainingWeeks:Object.freeze([6,20]), eventWeeks:Object.freeze([12,32]), maxTrainingNodes:2, autoEventCheckDays:8,
  targetSeconds:Object.freeze({min:20,max:35}), expectedActions:Object.freeze({advance:5,training:2,events:2}),
  actionSeconds:Object.freeze({advance:2,training:7,event:2.5})
});
export const CAREER_PACE_RULES=Object.freeze({
  immersive:Object.freeze({seasonsPerRound:1,matchMode:'interactive',eventMode:'pause'}),
  standard:Object.freeze({seasonsPerRound:2,matchMode:'ordinary-auto',eventMode:'important-pause'}),
  fast:Object.freeze({seasonsPerRound:3,matchMode:'instant',eventMode:'career-turn-pause'}),
  legend:Object.freeze({seasonsPerRound:3,matchMode:'instant',eventMode:'career-turn-pause',legacyAlias:'fast'})
});
export function seasonsPerRound(mode='standard'){return CAREER_PACE_RULES[mode]?.seasonsPerRound||1;}
export const assessFastSeasonPace=({advanceActions=FAST_SEASON_PACE.expectedActions.advance,trainingChoices=FAST_SEASON_PACE.expectedActions.training,eventChoices=FAST_SEASON_PACE.expectedActions.events}={})=>{
  const estimatedSeconds=advanceActions*FAST_SEASON_PACE.actionSeconds.advance+trainingChoices*FAST_SEASON_PACE.actionSeconds.training+eventChoices*FAST_SEASON_PACE.actionSeconds.event;
  return {advanceActions,trainingChoices,eventChoices,estimatedSeconds,withinTarget:estimatedSeconds>=FAST_SEASON_PACE.targetSeconds.min&&estimatedSeconds<=FAST_SEASON_PACE.targetSeconds.max};
};

export class CareerDirector {
  constructor(store,eventEngine){ this.store=store; this.eventEngine=eventEngine; this.running=false; this.cancelled=false; }
  pause(){ this.cancelled=true; this.running=false; this.store.set(s=>{s.simulation.paused=true;return s;}); }
  resume(){ this.cancelled=false; this.store.set(s=>{s.simulation.paused=false;return s;}); }
  nextMatch(state){ return state.schedule.find(m=>m.status==='upcoming' && m.date>=state.simulation.date) || null; }
  isKeyMatch(match){ return Boolean(match?.important); }
  shouldAutoSimulateMatch(match,state=this.store.get()){
    if(!match)return false;
    if(state.settings?.mode==='immersive')return false;
    if(['fast','legend'].includes(state.settings?.mode))return true;
    return !this.isKeyMatch(match);
  }
  nextEventDate(state){ const offset=2+((state.events.history.length+state.season.week)%5); return addDays(state.simulation.date,offset); }
  seasonEndDate(state){ const date=new Date(`${state.simulation.date}T00:00:00Z`),year=date.getUTCFullYear(); return `${date.getUTCMonth()>=6?year+1:year}-06-30`; }
  ensureFixtures(state){
    if(!state.player||state.season.progress>=99)return;
    replaceFictionalFixtures(state);
    if(state.schedule.some(match=>match.status==='upcoming'&&match.date>=state.simulation.date))return;
    if(state.schedule.some(match=>match.season===state.season.year))return;
    const played=state.schedule.filter(match=>match.status==='played');
    state.schedule=[...played,...createRealFixtures(state)];
  }
  nextNode(state=this.store.get()){
    if (state.career?.honors?.retirement) return { type: 'retirement', label: '职业生涯已结束', action: 'career', blocked: true };
    if (state.career?.offSeason?.status === 'active') return { type: 'off-season', label: '安排休赛期', action: 'offSeason', blocked: true };
    if (state.events?.pending?.length) return { type: 'event', label: '处理待办事件', action: 'nextEvent', blocked: true };
    if (state.training?.currentOpportunity) return { type: 'training', label: '处理关键训练机会', action: 'training', blocked: true, target: state.training.currentOpportunity.createdAt };
    const match = this.nextMatch(state);
    if (!match||this.shouldAutoSimulateMatch(match,state)) return { type: 'time', label: '快速结算到下一个职业节点', target: this.seasonEndDate(state), action: 'seasonEnd', match };
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
    const unavailable=matchAvailability(state);
    if(unavailable)return recordMatchResult(state,fixture,{played:false,auto:true,unavailable:unavailable.type,summary:`${state.player.club} 缺阵 ${fixture.opponent}`});
    const rng=keyedRandom(fixture.id,fixture.date,state.player.ovr,state.season.appearances);
    const played=rng.bool(.84);
    const starts=played&&rng.bool(.76);
    const minutes=played?(starts?rng.int(70,90):rng.int(14,36)):0;
    const rating=Number((played?Math.max(5.8,Math.min(9.1,6.2+(state.player.ovr-55)/34+rng.next()*.9)):0).toFixed(1));
    const group=positionGroup(state.player.position);
    const goals=played&&rng.bool(group==='attack'?.26:group==='midfield'?.12:group==='defense'?.05:.005)?1:0;
    const assists=played&&rng.bool(group==='midfield'?.24:group==='attack'?.16:group==='defense'?.10:.02)?1:0;
    const teamGoals=played?goals+(rng.bool(.48)?1:0):0;
    const opponentGoals=rng.int(0,2);
    const stats=simulatedPlayerStats(state.player,rng,{played,starts,minutes,goals,assists,opponentGoals,rating});
    const card=played?(rng.bool(.012)?'red':rng.bool(.075)?'yellow':null):null;
    recordMatchResult(state,fixture,{...stats,score:`${teamGoals}-${opponentGoals}`,auto:true,card});
    if(!played)return true;
    applyGrowthToState(state,{passing:.04,physical:.03},{source:'自动模拟比赛',fatigue:state.player.fatigue||0,facility:74,coachQuality:72,mode:state.settings.mode,injured:false});
    state.player.fatigue=Math.max(0,Math.min(100,(state.player.fatigue||0)+8));
    state.player.fitness=Math.max(10,100-state.player.fatigue*.7);
    state.career.marketValue=Math.max(0,state.career.marketValue+Math.round((rating-6)*18000+goals*50000+assists*32000));
    if(fixture.important||goals||assists||rating>=8.2||card)addNews(state,{id:`auto-match-${fixture.id}`,type:'比赛',title:`${state.player.name}对${fixture.opponent}贡献焦点表现`,copy:`${fixture.competition}：${state.player.club} ${teamGoals}-${opponentGoals} ${fixture.opponent}，评分 ${rating}${goals?`、进球 ${goals}`:''}${assists?`、助攻 ${assists}`:''}。`});
    return true;
  }
  async advance(action){
    if(this.running) return {status:'busy'};
    if(this.store.get().career?.honors?.retirement) return {status:'retired',processed:0,autoMatches:0,stopReason:'retirement'};
    this.store.set(state=>{this.ensureFixtures(state);return state;});
    const desc=this.describe(action); if(!desc) throw new Error('未知推进方式');
    if(this.store.get().simulation.paused) return {status:'paused'};
    if(this.store.get().training.currentOpportunity)return {status:'needs-training',trainingOpportunity:this.store.get().training.currentOpportunity,processed:0,stopReason:'training'};
    const dueMatch=action==='nextMatch'&&this.nextMatch(this.store.get());
    if(dueMatch?.date===this.store.get().simulation.date){
      if(this.shouldAutoSimulateMatch(dueMatch,this.store.get())||matchAvailability(this.store.get())){this.store.set(state=>{this.settleAutoMatch(state,dueMatch);return state;});return {status:'ok',processed:0,autoMatches:1,stopReason:'match-auto',event:null,match:dueMatch,description:desc};}
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
        if (nextDate.endsWith('-01')) {
          generateWorldNews(state, dataRepository.clubs?.length ? dataRepository.clubs : CLUBS, dataRepository.players || [], nextDate);
          const activity = generateTransferActivity(state, dataRepository.clubs?.length ? dataRepository.clubs : CLUBS, nextDate);
          const offer = activity.find(item => item.stage === 'formal_offer');
          if (offer) addNews(state, { id: offer.id, date: nextDate, type: '转会', title: `${offer.clubName} 发来正式报价`, copy: '经纪人已把合同方案放入转会收件箱。', read: false });
        }
        return state;
      });
      processed++;
      const state=this.store.get(); const match=this.nextMatch(state);
      if(match && match.date===state.simulation.date){
        if(this.shouldAutoSimulateMatch(match,state)||matchAvailability(state)){this.store.set(next=>{this.settleAutoMatch(next,match);return next;});autoMatches++;continue;}
        matchReady=match; stopReason='match'; break;
      }
      const trainingKey=`training-node:${state.season.year}:${state.season.week}`;
      if(!state.training.currentOpportunity&&Number(state.training.seasonTrainingCount||0)<FAST_SEASON_PACE.maxTrainingNodes&&FAST_SEASON_PACE.trainingWeeks.includes(state.season.week)&&!state.simulation.processedKeys.includes(trainingKey)){
        this.store.set(next=>{next.simulation.processedKeys.push(trainingKey);trainingOpportunity=createTrainingOpportunity(next,{seed:`${next.simulation.date}:${trainingKey}`});return next;});
        if(trainingOpportunity){stopReason='training';break;}
      }
      const paceEventKey=`pace-event:${state.season.year}:${state.season.week}`;
      if(state.settings.mode===FAST_SEASON_PACE.mode&&FAST_SEASON_PACE.eventWeeks.includes(state.season.week)&&!state.events.pending.length&&!state.simulation.processedKeys.includes(paceEventKey)){
        this.store.set(next=>{next.simulation.processedKeys.push(paceEventKey);generatedEvent=this.eventEngine.schedule(next,{priority:'important'});return next;});
        if(generatedEvent){stopReason='event';break;}
      }
      if(action==='nextEvent' && state.simulation.date>=desc.target){
        this.store.set(s=>{generatedEvent=this.eventEngine.schedule(s,{priority:'important'});return s;}); stopReason='event'; break;
      }
      if(['week','month','halfSeason','window','seasonEnd'].includes(action)){
        const density=state.settings.mode==='legend'?3:state.settings.mode===FAST_SEASON_PACE.mode?FAST_SEASON_PACE.autoEventCheckDays:state.settings.mode==='ultra'?12:5;
        if(processed%density===0 && !state.events.pending.length && !(state.settings.mode===FAST_SEASON_PACE.mode&&state.settings.autoSkipLow!==false)){
          const priority=state.settings.mode==='immersive'||state.settings.mode==='legend'?'important':'normal';
          this.store.set(s=>{generatedEvent=this.eventEngine.schedule(s,{priority});return s;});
          if(generatedEvent && state.settings.autoPauseCritical && (generatedEvent.priority==='important'||state.settings.mode==='immersive')){stopReason='event';break;}
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
