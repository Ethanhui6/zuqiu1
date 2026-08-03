import {positionGroup} from '../shared/scoringSystem.js';

export const GAME_VERSION='19.0.0';
export const CONFIG_VERSION='authority-1';
const CLUB_POOL=['海港竞技','北伦敦城','莱茵竞技','伊比利亚联队','米兰蓝星','巴黎新城','里斯本雄狮','大阪飞翼'];
const bounded=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));

async function entropy(seed,sequence,label){
  const bytes=new TextEncoder().encode(`${seed}|${sequence}|${label}`);
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  return new DataView(digest.buffer).getUint32(0)/0xffffffff;
}

export function initialAuthorityState(profile,now){
  const position=/^(GK|LB|CB|RB|CDM|CM|CAM|LW|RW|SS|ST)$/.test(String(profile?.position))?profile.position:'ST';
  return{
    player:{name:String(profile?.name||'在线球员').slice(0,24),publicNickname:String(profile?.publicNickname||'绿茵玩家').slice(0,24),nation:String(profile?.nation||'中国').slice(0,24),position,ovr:bounded(profile?.ovr||62,45,75),potential:bounded(profile?.potential||84,60,95)},
    career:{season:1,week:1,clubName:String(profile?.clubName||'青训俱乐部').slice(0,36),clubs:1,transfers:0,stats:{apps:0,goals:0,assists:0,cleanSheets:0,titles:0,nationalApps:0,nationalGoals:0,bestRating:0,hatTricks:0,bigGames:0,saves:0,tackles:0},trophies:0,individualAwards:0,records:0,hiddenAchievements:0,lowLeagueStart:Boolean(profile?.lowLeagueStart),ending:''},
    status:{fitness:88,morale:70,coachTrust:45,trainingProgress:0,fans:300},
    counters:{training:0,match:0,event:0,season:0},pendingOffer:null,actionIds:[],startedAt:now,completed:false
  };
}

function assertPayload(action){
  if(!action||typeof action!=='object')throw new Error('动作内容无效');
  const forbidden=['score','grade','rank','honours','honors','attributes','ovr','state'];
  const keys=[...Object.keys(action),...Object.keys(action.payload||{})].map(key=>key.toLowerCase());
  if(forbidden.some(key=>keys.includes(key)))throw new Error('客户端提交了服务端专属字段');
  if(!/^[a-z0-9-]{6,80}$/i.test(String(action.actionId||'')))throw new Error('动作标识无效');
}

export async function applyAuthoritativeAction(previous,action,{serverSeed,sequence}){
  assertPayload(action);
  if(previous.completed)throw new Error('运行已经结束');
  if(previous.actionIds.includes(action.actionId))throw new Error('检测到重复结算动作');
  const state=structuredClone(previous),random=await entropy(serverSeed,sequence,action.type);
  const stats=state.career.stats,group=positionGroup(state.player.position);
  let result;
  if(action.type==='training'){
    const focus=['technique','fitness','tactics','recovery'].includes(action.payload?.focus)?action.payload.focus:'technique';
    const gain=8+Math.floor(random*9);state.status.trainingProgress+=gain;state.status.fitness=bounded(state.status.fitness+(focus==='recovery'?8:-3),15,100);state.status.coachTrust=bounded(state.status.coachTrust+2,0,100);state.counters.training++;
    if(state.status.trainingProgress>=100&&state.player.ovr<state.player.potential){state.status.trainingProgress-=100;state.player.ovr++}
    result={type:'training',focus,gain,progress:state.status.trainingProgress,ovr:state.player.ovr};
  }else if(action.type==='match'){
    const mode=['instant','timeline','interactive'].includes(action.payload?.mode)?action.payload.mode:'instant';
    const quality=bounded(state.player.ovr/100+state.status.fitness/250+random*.45,0,1.5),goals=group==='forward'&&quality>.92?1+(quality>1.28?1:0):group==='midfield'&&quality>1.16?1:0,assists=group!=='keeper'&&quality>.78&&quality<1.28?1:0;
    const tackles=group==='defense'?2+Math.floor(random*4):group==='midfield'?1+Math.floor(random*3):Math.floor(random*2),saves=group==='keeper'?2+Math.floor(random*6):0,cleanSheet=(group==='keeper'||group==='defense')&&quality>.82?1:0;
    const rating=bounded(6+goals*.85+assists*.55+cleanSheet*.35+(random-.5)*1.2,4.5,10);
    Object.assign(stats,{apps:stats.apps+1,goals:stats.goals+goals,assists:stats.assists+assists,cleanSheets:stats.cleanSheets+cleanSheet,bestRating:Math.max(stats.bestRating,Number(rating.toFixed(1))),bigGames:stats.bigGames+(action.payload?.important?1:0),saves:stats.saves+saves,tackles:stats.tackles+tackles,hatTricks:stats.hatTricks+(goals>=3?1:0)});
    state.status.fitness=bounded(state.status.fitness-10-Math.floor(random*7),10,100);state.status.morale=bounded(state.status.morale+(rating>=7?4:-2),0,100);state.status.fans+=Math.round(Math.max(0,rating-5)*120);state.counters.match++;state.career.week++;
    result={type:'match',mode,goals,assists,tackles,saves,cleanSheet,rating:Number(rating.toFixed(1)),score:[Math.floor(random*4),Math.floor((1-random)*3)]};
  }else if(action.type==='event'){
    const choice=Math.floor(Number(action.payload?.choice));if(choice<0||choice>4)throw new Error('事件选项无效');
    const delta=Math.round((random-.35)*12);state.status.morale=bounded(state.status.morale+delta,0,100);state.status.coachTrust=bounded(state.status.coachTrust+Math.round(delta*.65),0,100);state.status.fans=Math.max(0,state.status.fans+Math.round(delta*80));state.counters.event++;
    if(random>.86&&!state.pendingOffer)state.pendingOffer={offerId:`offer-${sequence}`,clubName:CLUB_POOL[Math.floor(random*CLUB_POOL.length)],role:random>.93?'核心':'轮换',weeklyWage:800+Math.floor(random*5200)};
    result={type:'event',choice,outcome:delta>=6?'大成功':delta>=1?'取得进展':delta>=-3?'影响有限':'出现代价',effects:{morale:delta,coachTrust:Math.round(delta*.65),fans:Math.round(delta*80)},pendingOffer:state.pendingOffer};
  }else if(action.type==='requestTransfer'){
    state.pendingOffer={offerId:`offer-${sequence}`,clubName:CLUB_POOL[Math.floor(random*CLUB_POOL.length)],role:random>.72?'主力':'轮换',weeklyWage:1000+Math.floor(random*8000)};
    result={type:'transferOffer',offer:state.pendingOffer};
  }else if(action.type==='transferDecision'){
    if(!state.pendingOffer||state.pendingOffer.offerId!==action.payload?.offerId)throw new Error('转会报价不存在或已经失效');
    const decision=action.payload?.decision;if(!['accept','reject','defer','negotiate'].includes(decision))throw new Error('转会决定无效');
    if(decision==='accept'){state.career.clubName=state.pendingOffer.clubName;state.career.clubs++;state.career.transfers++}
    if(decision!=='defer'&&decision!=='negotiate')state.pendingOffer=null;
    if(decision==='negotiate')state.pendingOffer.weeklyWage=Math.round(state.pendingOffer.weeklyWage*(.95+random*.18));
    result={type:'transferDecision',decision,clubName:state.career.clubName,offer:state.pendingOffer};
  }else if(action.type==='advanceSeason'){
    if(state.counters.match<(state.career.season*2))throw new Error('本赛季有效比赛不足，不能结算赛季');
    state.career.season++;state.career.week=1;state.counters.season++;state.status.fitness=92;
    if(random>.84){state.career.stats.titles++;state.career.trophies++}
    result={type:'season',season:state.career.season,titles:state.career.stats.titles};
  }else if(action.type==='retire'){
    if(state.counters.training<1||state.counters.match<1||state.counters.event<1)throw new Error('生涯日志不完整，暂不能结算');
    state.completed=true;state.career.ending=state.career.season>=12?'足坛常青树':'新的起点';result={type:'retire',ending:state.career.ending};
  }else throw new Error('动作类型不受支持');
  state.actionIds=[...state.actionIds.slice(-99),action.actionId];
  return{state,result};
}

export function authorityEvidence(run){
  const state=run.state,stats=state.career.stats;
  return{scoreVersion:'18.8.0-1',gameVersion:run.gameVersion,createdAt:run.startedAt,updatedAt:run.updatedAt,difficulty:run.difficulty||'standard',player:{name:state.player.name,displayName:state.player.name,nation:state.player.nation,position:state.player.position,age:17+state.career.season-1,ovr:state.player.ovr,peakOvr:state.player.ovr,initialOvr:run.initialOvr,potential:state.player.potential,avatar:''},career:{season:state.career.season,seasonsCompleted:Math.max(0,state.career.season-1),absoluteWeek:Math.max(1,(state.career.season-1)*40+state.career.week),squadLevel:'一线队',teamRole:'职业球员',clubName:state.career.clubName,clubId:'server-club',clubs:state.career.clubs,transfers:state.career.transfers,trophies:state.career.trophies,individualAwards:state.career.individualAwards,records:state.career.records,hiddenAchievements:state.career.hiddenAchievements,lowLeagueStart:state.career.lowLeagueStart,ending:state.career.ending,stats},achievements:{unlocked:state.career.hiddenAchievements,points:state.career.records*100},fans:{local:state.status.fans,club:state.status.fans,global:0,social:state.status.fans,commercialValue:Math.min(100,state.status.fans/10000)},finance:{marketValue:state.player.ovr*100000}};
}
