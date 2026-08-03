import {APP_VERSION,SAVE_SCHEMA,DEFAULT_AUTO_PAUSE,DEFAULT_STRATEGIES} from '../../app/config.js';
import {createSeed,hashString} from '../rng.js';

const oldKeys=['green-pitch-career-v18','football-career-save','career-sim-save','zuqiu-save','footballCareerSave','green-pitch-save'];
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const bounded=(v,d=50)=>Math.max(0,Math.min(100,num(v,d)));

function relation(value=50){return{trust:bounded(value),respect:50,rivalry:10,familiarity:20,conflict:5}}
function legacySeed(raw){
  const identity=JSON.stringify({name:raw?.name||raw?.player?.name,createdAt:raw?.createdAt,clubId:raw?.clubId||raw?.career?.clubId,age:raw?.age||raw?.player?.age,version:raw?.version||raw?.schemaVersion});
  return `legacy-${hashString(identity).toString(36)}`;
}

export function buildDefaultSave(){
  return{
    schemaVersion:SAVE_SCHEMA,gameVersion:APP_VERSION,createdAt:Date.now(),updatedAt:Date.now(),rng:{seed:createSeed(),state:0,counter:0},settings:{theme:'light',reducedMotion:false,animationMode:'standard',pace:{mode:'standard',speed:'normal',autoPause:{...DEFAULT_AUTO_PAUSE}}},
    player:null,career:null,status:null,relations:null,fans:null,finance:null,achievements:{unlocked:[],notified:[],score:0},meta:{migrationNotes:[],checksum:'',lastRecovery:null,ranking:{runId:null,eligible:false,lastSequence:0,lastSyncAt:null,status:'local-only'}}
  };
}

export function migrateLegacy(raw){
  if(!raw||typeof raw!=='object')return null;
  if(raw.schemaVersion===SAVE_SCHEMA&&raw.player&&raw.career)return normalizeSave(raw);
  const base=buildDefaultSave();
  const oldPlayer=raw.player||raw;
  const oldCareer=raw.career||raw;
  const attrs=oldPlayer.attrs||oldPlayer.stats||raw.attrs||raw.stats||{};
  const position=oldPlayer.pos||oldPlayer.position||raw.pos||raw.position||'ST';
  const mapped={pac:num(attrs.pac??attrs.PAC,62),sho:num(attrs.sho??attrs.SHO,58),pas:num(attrs.pas??attrs.PAS,57),dri:num(attrs.dri??attrs.DRI,60),def:num(attrs.def??attrs.DEF,45),phy:num(attrs.phy??attrs.PHY,58)};
  base.rng.seed=raw.rng?.seed||raw.seed||legacySeed(raw);base.rng.state=num(raw.rng?.state,0);base.rng.counter=num(raw.rng?.counter,0);
  base.player={
    id:oldPlayer.id||`legacy-${hashString(`${oldPlayer.name||'player'}|${base.rng.seed}`).toString(36)}`,
    name:oldPlayer.name||raw.name||'旧存档球员',displayName:oldPlayer.displayName||oldPlayer.name||raw.name||'旧存档球员',nation:oldPlayer.nation||oldPlayer.nationality||raw.nation||raw.nationality||'中国',birthDate:oldPlayer.birthDate||raw.birthDate||'2010-01-01',
    age:num(oldPlayer.age??raw.age,18),height:num(oldPlayer.height??raw.height,178),weight:num(oldPlayer.weight??raw.weight,72),foot:oldPlayer.foot||raw.foot||'右脚',number:num(oldPlayer.number??raw.number,10),position,secondaryPositions:oldPlayer.secondaryPositions||raw.secondaryPositions||[],style:oldPlayer.style||oldPlayer.templateName||raw.style||raw.templateName||'全面型球员',
    talent:{id:'legacy',name:oldPlayer.templateName||raw.templateName||'旧版本成长模板',rarity:oldPlayer.rarity||raw.rarity||'普通',rarityKey:'common',description:'由旧版本存档迁移',growthMultiplier:1,potential:num(oldPlayer.potential??raw.potential,82),cost:'无'},attrs:mapped,ovr:num(oldPlayer.ovr??raw.ovr,65),potential:num(oldPlayer.potential??raw.potential,82),xp:oldPlayer.xp||raw.xp||{pac:0,sho:0,pas:0,dri:0,def:0,phy:0},hidden:{discipline:58,professionalism:58,consistency:55,bigMatch:50,leadership:45,injuryProne:30,learning:60}
  };
  const stats=oldCareer.careerStats||oldCareer.stats||raw.careerStats||raw.stats||{};
  const seasonStats=oldCareer.seasonStats||raw.seasonStats||{};
  const clubId=oldCareer.clubId||raw.clubId||raw.team?.id||raw.teamId||'CHN1-SHA';
  base.career={
    year:num(oldCareer.year??raw.year,2026),season:num(oldCareer.season??raw.season,1),month:num(oldCareer.month??raw.month,1),seasonProgress:num(oldCareer.seasonProgress??raw.seasonProgress,0),clubId,
    squadLevel:(oldCareer.youth??raw.youth)===false?'一线队':oldCareer.squadLevel||'18岁以下青年队',teamRole:oldCareer.role||raw.role||oldCareer.teamRole||'青年队新人',
    contract:{type:(oldCareer.youth??raw.youth)===false?'职业合同':'青训合同',years:num(oldCareer.contractYears??raw.contractYears,2),weeklyWage:num(oldCareer.salary??raw.salary??oldCareer.weeklyWage??raw.weeklyWage,300),releaseClause:0,appearancePromise:'逐步培养'},
    seasonStats:{apps:num(seasonStats.apps,0),starts:num(seasonStats.starts,0),minutes:num(seasonStats.minutes,0),goals:num(seasonStats.goals,0),assists:num(seasonStats.assists,0),cleanSheets:num(seasonStats.cleanSheets,0),rating:num(seasonStats.rating,0),yellow:num(seasonStats.yellow,0),red:num(seasonStats.red,0),shots:num(seasonStats.shots,0),keyPasses:num(seasonStats.keyPasses,0),tackles:num(seasonStats.tackles,0),saves:num(seasonStats.saves,0)},
    careerStats:{apps:num(stats.apps??stats.appearances,0),goals:num(stats.goals,0),assists:num(stats.assists,0),cleanSheets:num(stats.cleanSheets,0),titles:num(stats.trophies??stats.titles,0),nationalApps:num(stats.nationalApps,0),nationalGoals:num(stats.nationalGoals,0),bestRating:num(stats.bestRating,0),hatTricks:num(stats.hatTricks,0),bigGames:num(stats.bigGames,0),saves:num(stats.saves,0),tackles:num(stats.tackles,0)},
    history:oldCareer.history||raw.history||[],clubHistory:oldCareer.clubHistory||raw.clubHistory||[clubId],records:oldCareer.records||{},trophies:oldCareer.honours||raw.honours||oldCareer.trophies||raw.trophies||[],
    pending:{event:null,match:null,offers:[],delayedEffects:[]},eventMemory:{triggered:[],recentEventIds:[],recentTags:[],recentCategories:[],recentTitles:[],recentTemplateTitles:[],recentChoiceSignatures:[],recentPersons:[],recentOpponents:[],choices:[],chainsOpen:[],chainsStarted:[],chainsClosed:[],cooldowns:{},typeCounts:{},generatedCount:0,duplicateCount:0,lastAvailableCount:0,lastFilteredCount:0,lastChoiceSignature:''},hiddenConsequences:[],
    transferHistory:oldCareer.transferHistory||[],offerHistory:[],rejectedClubs:oldCareer.rejectedClubs||[],trainingPlan:oldCareer.trainingPlan||'tactics',facilities:{visits:[],locks:{}},actionLocks:{},retirement:oldCareer.retirement||null
  };
  base.status={fitness:num(raw.fitness??raw.status?.fitness,85),morale:num(raw.morale??raw.status?.morale,70),form:num(raw.form??raw.status?.form,55),fatigue:num(raw.fatigue??raw.status?.fatigue,10),injury:raw.injury||raw.status?.injury||null,suspension:num(raw.status?.suspension,0),coachTrust:num(raw.coachTrust??raw.status?.coachTrust,45)};
  base.relations={coach:relation(raw.coachTrust),teammates:relation(50),captain:relation(45),agent:relation(50),management:relation(45),fans:relation(50),media:relation(40),nationalCoach:relation(25)};
  base.fans={local:num(raw.localFans??raw.fans?.local,300),club:num(raw.clubFans??raw.fans?.club,500),global:num(raw.globalFans??raw.fans?.global,0),social:num(typeof raw.fans==='number'?raw.fans:raw.fans?.social,500),mediaHeat:num(raw.fame??raw.fans?.mediaHeat,5),commercialValue:num(raw.commercialValue??raw.fans?.commercialValue,2),sentiment:num(raw.fans?.sentiment,50),history:raw.fans?.history||[]};
  base.finance={cash:num(raw.money??raw.finance?.cash,2000),marketValue:num(raw.value??raw.finance?.marketValue,120000),weeklyWage:num(raw.salary??raw.weeklyWage??raw.finance?.weeklyWage,300),sponsorships:raw.finance?.sponsorships||[]};
  base.achievements.unlocked=raw.achievements?.unlocked||raw.achievements||[];
  base.meta.migrationNotes.push(`已从旧存档版本 ${raw.schemaVersion||raw.version||'未知'} 迁移。无法恢复的关系和隐藏属性使用中性默认值。`);
  return normalizeSave(base);
}

/** 为同版本早期构建和旧存档补齐新增字段，不覆盖玩家已有进度。 */
export function normalizeSave(save){
  if(!save||typeof save!=='object'||!save.player||!save.career)return null;
  save.schemaVersion=SAVE_SCHEMA;save.gameVersion=APP_VERSION;
  save.createdAt=num(save.createdAt,Date.now());save.updatedAt=num(save.updatedAt,Date.now());
  const fallbackSeed=`save-${hashString(`${save.player.name||'球员'}|${save.createdAt}|${save.career.clubId||''}`).toString(36)}`;
  save.rng??={seed:fallbackSeed,state:0,counter:0};save.rng.seed??=fallbackSeed;save.rng.state=num(save.rng.state,0);save.rng.counter=num(save.rng.counter,0);
  save.settings={theme:'light',reducedMotion:false,animationMode:'standard',...(save.settings||{})};save.settings.pace={mode:'standard',speed:'normal',autoPause:{...DEFAULT_AUTO_PAUSE},...(save.settings.pace||{})};save.settings.pace.autoPause={...DEFAULT_AUTO_PAUSE,...(save.settings.pace.autoPause||{})};
  save.player.attrs={pac:60,sho:55,pas:55,dri:58,def:45,phy:56,...(save.player.attrs||{})};
  save.player.xp={pac:0,sho:0,pas:0,dri:0,def:0,phy:0,...(save.player.xp||{})};
  save.player.secondaryPositions??=[];
  save.player.hidden={discipline:55,professionalism:55,consistency:55,bigMatch:50,leadership:45,injuryProne:30,learning:60,...(save.player.hidden||{})};
  save.player.talent={id:'normalized',name:'均衡成长模板',rarity:'普通',rarityKey:'common',description:'由存档兼容层补齐',growthMultiplier:1,potential:Number(save.player.potential||82),cost:'无',...(save.player.talent||{})};
  save.career.contract={type:'职业合同',years:2,weeklyWage:300,releaseClause:0,appearancePromise:'逐步培养',...(save.career.contract||{})};
  save.career.seasonStats={apps:0,starts:0,minutes:0,goals:0,assists:0,cleanSheets:0,rating:0,yellow:0,red:0,shots:0,keyPasses:0,tackles:0,saves:0,...(save.career.seasonStats||{})};
  save.career.careerStats={apps:0,goals:0,assists:0,cleanSheets:0,titles:0,nationalApps:0,nationalGoals:0,bestRating:0,hatTricks:0,bigGames:0,saves:0,tackles:0,...(save.career.careerStats||{})};
  save.career.history??=[];save.career.clubHistory??=[save.career.clubId||'CHN1-SHA'];save.career.records??={};save.career.trophies??=[];save.career.transferHistory??=[];save.career.offerHistory??=[];save.career.rejectedClubs??=[];save.career.trainingPlan??='tactics';save.career.retirement??=null;save.career.actionLocks??={};save.career.transferWindows??={};save.career.loan??=null;
  save.career.facilities={visits:[],locks:{},...(save.career.facilities||{})};save.career.facilities.visits??=[];save.career.facilities.locks??={};
  save.career.calendar={week:Math.max(1,Math.min(40,(Number(save.career.month||1)-1)*4+1)),absoluteWeek:Math.max(1,(Number(save.career.season||1)-1)*40+1),nextEventWeek:1,...(save.career.calendar||{})};save.career.weekState={trainingDone:false,eventDone:false,matchDone:false,trainingResult:null,...(save.career.weekState||{})};save.career.schedule??=null;save.career.strategies={...DEFAULT_STRATEGIES,...(save.career.strategies||{})};save.career.objectives={season:save.career.season,candidates:[],active:[],completed:[],rewarded:[],...(save.career.objectives||{})};for(const key of ['candidates','active','completed','rewarded'])save.career.objectives[key]??=[];save.career.advance={running:false,lastSummary:null,history:[],resumeTarget:null,...(save.career.advance||{})};save.career.advance.history??=[];save.career.matchHistory??=[];save.career.lastMatchResult??=null;save.career.majorNodes??=[];
  save.career.pending={event:null,match:null,offers:[],delayedEffects:[],...(save.career.pending||{})};
  save.career.pending.offers??=[];save.career.pending.delayedEffects??=[];
  save.career.eventMemory={triggered:[],recentEventIds:[],recentTags:[],recentCategories:[],recentTitles:[],recentTemplateTitles:[],recentChoiceSignatures:[],recentPersons:[],recentOpponents:[],choices:[],chainsOpen:[],chainsStarted:[],chainsClosed:[],cooldowns:{},typeCounts:{},generatedCount:0,duplicateCount:0,lastAvailableCount:0,lastFilteredCount:0,lastChoiceSignature:'',...(save.career.eventMemory||{})};
  for(const key of ['triggered','recentEventIds','recentTags','recentCategories','recentTitles','recentTemplateTitles','recentChoiceSignatures','recentPersons','recentOpponents','choices','chainsOpen','chainsStarted','chainsClosed'])save.career.eventMemory[key]??=[];
  save.career.eventMemory.cooldowns??={};save.career.eventMemory.typeCounts??={};
  save.career.hiddenConsequences??=[];save.career.competitionState={level:1,continentalQualified:false,history:[],...(save.career.competitionState||{})};save.career.competitionState.history??=[];
  save.status={fitness:85,morale:70,form:55,fatigue:10,injury:null,suspension:0,coachTrust:45,...(save.status||{})};
  const keys=['coach','teammates','captain','agent','management','fans','media','nationalCoach'];save.relations??={};for(const key of keys)save.relations[key]={...relation(),...(save.relations[key]||{})};
  save.fans={local:300,club:500,global:0,social:250,mediaHeat:2,commercialValue:1,sentiment:55,history:[],...(save.fans||{})};save.fans.history??=[];
  save.finance={cash:2000,marketValue:120000,weeklyWage:save.career.contract.weeklyWage||300,sponsorships:[],...(save.finance||{})};save.finance.sponsorships??=[];
  save.achievements={unlocked:[],notified:[],score:0,...(save.achievements||{})};save.achievements.unlocked??=[];save.achievements.notified??=[];
  save.meta={migrationNotes:[],checksum:'',lastRecovery:null,...(save.meta||{})};save.meta.migrationNotes??=[];save.meta.ranking={runId:null,eligible:false,lastSequence:0,lastSyncAt:null,status:'local-only',...(save.meta.ranking||{})};
  return save;
}

function looksLikeCareer(raw){return raw&&typeof raw==='object'&&(raw.player||raw.name)&&(raw.career||raw.clubId||raw.teamId||raw.stats)}
export function findLegacySave(){
  const candidates=[...oldKeys];
  try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&!candidates.includes(key)&&/(football|career|zuqiu|green.?pitch|足球|生涯)/i.test(key))candidates.push(key)}}catch{}
  for(const key of candidates){try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(looksLikeCareer(raw)){const save=migrateLegacy(raw);if(save)return{key,save}}}catch{}}
  return null;
}

export function migrateV10ToV18(raw){return migrateLegacy(raw)}
export function migrateV11ToV18(raw){return migrateLegacy(raw)}
export function migrateV12ToV18(raw){return migrateLegacy(raw)}
export function migrateV17ToV18(raw){return migrateLegacy(raw)}
export function migrateV18ToV19(raw){return migrateLegacy(raw)}
