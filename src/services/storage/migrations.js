import {SAVE_SCHEMA} from '../../app/config.js';
import {createSeed} from '../rng.js';

const oldKeys=['green-pitch-career-v18','football-career-save','career-sim-save'];
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;

function relation(value=50){return{trust:num(value,50),respect:50,rivalry:10,familiarity:20,conflict:5}}

export function buildDefaultSave(){
  return{
    schemaVersion:SAVE_SCHEMA,gameVersion:'18.0.0',createdAt:Date.now(),updatedAt:Date.now(),rng:{seed:createSeed(),state:0,counter:0},settings:{theme:'system',reducedMotion:false},
    player:null,career:null,status:null,relations:null,fans:null,finance:null,achievements:{unlocked:[],notified:[],score:0},meta:{migrationNotes:[],checksum:''}
  };
}

export function migrateLegacy(raw){
  if(!raw||typeof raw!=='object')return null;
  if(raw.schemaVersion===SAVE_SCHEMA)return normalizeSave(raw);
  const base=buildDefaultSave();
  const attrs=raw.attrs||raw.stats||{};
  const position=raw.pos||raw.position||'ST';
  const mapped={pac:num(attrs.pac??attrs.PAC,62),sho:num(attrs.sho??attrs.SHO,58),pas:num(attrs.pas??attrs.PAS,57),dri:num(attrs.dri??attrs.DRI,60),def:num(attrs.def??attrs.DEF,45),phy:num(attrs.phy??attrs.PHY,58)};
  base.rng.seed=raw.seed||createSeed();
  base.player={
    id:raw.id||`legacy-${Date.now()}`,name:raw.name||'旧存档球员',displayName:raw.displayName||raw.name||'旧存档球员',nation:raw.nation||raw.nationality||'中国',birthDate:raw.birthDate||'2010-01-01',
    age:num(raw.age,18),height:num(raw.height,178),weight:num(raw.weight,72),foot:raw.foot||'右脚',number:num(raw.number,10),position,secondaryPositions:raw.secondaryPositions||[],style:raw.style||raw.templateName||'全面型球员',
    talent:{id:'legacy',name:raw.templateName||'旧版本成长模板',rarity:raw.rarity||'普通',description:'由旧版本存档迁移',growthMultiplier:1,potential:num(raw.potential,82),cost:'无'},attrs:mapped,ovr:num(raw.ovr,65),potential:num(raw.potential,82),xp:raw.xp||{pac:0,sho:0,pas:0,dri:0,def:0,phy:0},hidden:{discipline:58,professionalism:58,consistency:55,bigMatch:50,leadership:45,injuryProne:30,learning:60}
  };
  const stats=raw.stats||raw.careerStats||{};
  base.career={
    year:num(raw.year,2026),season:num(raw.season,1),month:num(raw.month,1),seasonProgress:num(raw.seasonProgress,0),clubId:raw.clubId||raw.team?.id||raw.teamId||'CHN1-SHA',squadLevel:raw.youth===false?'一线队':'U18青年队',teamRole:raw.role||'青年队新人',
    contract:{type:raw.youth===false?'职业合同':'青训合同',years:num(raw.contractYears,2),weeklyWage:num(raw.salary??raw.weeklyWage,300),releaseClause:0,appearancePromise:'逐步培养'},
    seasonStats:{apps:num(raw.seasonStats?.apps,0),starts:0,minutes:0,goals:num(raw.seasonStats?.goals,0),assists:num(raw.seasonStats?.assists,0),cleanSheets:num(raw.seasonStats?.cleanSheets,0),rating:num(raw.seasonStats?.rating,0),yellow:0,red:0},
    careerStats:{apps:num(stats.apps??stats.appearances,0),goals:num(stats.goals,0),assists:num(stats.assists,0),cleanSheets:num(stats.cleanSheets,0),titles:num(stats.trophies,0),nationalApps:num(stats.nationalApps,0),nationalGoals:num(stats.nationalGoals,0),bestRating:0},
    history:raw.history||[],clubHistory:raw.clubHistory||[raw.clubId||'CHN1-SHA'],records:{},trophies:raw.honours||raw.trophies||[],pending:{event:null,match:null,offers:[],delayedEffects:[]},eventMemory:{triggered:[],recentTags:[],choices:[],chainsOpen:[],chainsClosed:[],cooldowns:{}},transferHistory:[],rejectedClubs:[],retirement:null
  };
  base.status={fitness:num(raw.fitness,85),morale:num(raw.morale,70),form:num(raw.form,55),fatigue:num(raw.fatigue,10),injury:raw.injury||null,suspension:0,coachTrust:num(raw.coachTrust,45)};
  base.relations={coach:relation(raw.coachTrust),teammates:relation(50),captain:relation(45),agent:relation(50),management:relation(45),fans:relation(50),media:relation(40),nationalCoach:relation(25)};
  base.fans={local:num(raw.localFans,300),club:num(raw.clubFans,500),global:num(raw.globalFans,0),social:num(raw.fans,500),mediaHeat:num(raw.fame,5),commercialValue:num(raw.commercialValue,2),sentiment:50,history:[]};
  base.finance={cash:num(raw.money,2000),marketValue:num(raw.value,120000),weeklyWage:num(raw.salary??raw.weeklyWage,300),sponsorships:[]};
  base.achievements.unlocked=raw.achievements||[];
  base.meta.migrationNotes.push(`已从旧存档版本 ${raw.schemaVersion||raw.version||'未知'} 迁移。无法恢复的关系和隐藏属性使用中性默认值。`);
  return normalizeSave(base);
}


/** 为同版本早期构建和旧存档补齐新增字段，不覆盖玩家已有进度。 */
export function normalizeSave(save){
  if(!save||typeof save!=='object'||!save.player||!save.career)return save;
  save.schemaVersion=SAVE_SCHEMA;save.gameVersion='18.0.0';
  save.rng??={seed:createSeed(),state:0,counter:0};save.rng.seed??=createSeed();save.rng.state=Number(save.rng.state||0);save.rng.counter=Number(save.rng.counter||0);
  save.settings={theme:'system',reducedMotion:false,...(save.settings||{})};
  save.player.attrs={pac:60,sho:55,pas:55,dri:58,def:45,phy:56,...(save.player.attrs||{})};
  save.player.xp={pac:0,sho:0,pas:0,dri:0,def:0,phy:0,...(save.player.xp||{})};
  save.player.hidden={discipline:55,professionalism:55,consistency:55,bigMatch:50,leadership:45,injuryProne:30,learning:60,...(save.player.hidden||{})};
  save.player.talent={id:'normalized',name:'均衡成长模板',rarity:'普通',rarityKey:'common',description:'由存档兼容层补齐',growthMultiplier:1,potential:Number(save.player.potential||82),cost:'无',...(save.player.talent||{})};
  save.career.contract={type:'职业合同',years:2,weeklyWage:300,releaseClause:0,appearancePromise:'逐步培养',...(save.career.contract||{})};
  save.career.seasonStats={apps:0,starts:0,minutes:0,goals:0,assists:0,cleanSheets:0,rating:0,yellow:0,red:0,shots:0,keyPasses:0,tackles:0,saves:0,...(save.career.seasonStats||{})};
  save.career.careerStats={apps:0,goals:0,assists:0,cleanSheets:0,titles:0,nationalApps:0,nationalGoals:0,bestRating:0,hatTricks:0,bigGames:0,saves:0,tackles:0,...(save.career.careerStats||{})};
  save.career.history??=[];save.career.clubHistory??=[save.career.clubId||'CHN1-SHA'];save.career.records??={};save.career.trophies??=[];save.career.transferHistory??=[];save.career.rejectedClubs??=[];save.career.trainingPlan??='tactics';save.career.retirement??=null;
  save.career.pending={event:null,match:null,offers:[],delayedEffects:[],...(save.career.pending||{})};
  save.career.pending.offers??=[];save.career.pending.delayedEffects??=[];
  save.career.eventMemory={triggered:[],recentTags:[],choices:[],chainsOpen:[],chainsClosed:[],cooldowns:{},lastChoiceSignature:'',...(save.career.eventMemory||{})};
  save.status={fitness:85,morale:70,form:55,fatigue:10,injury:null,suspension:0,coachTrust:45,...(save.status||{})};
  const keys=['coach','teammates','captain','agent','management','fans','media','nationalCoach'];save.relations??={};for(const key of keys)save.relations[key]={...relation(),...(save.relations[key]||{})};
  save.fans={local:300,club:500,global:0,social:250,mediaHeat:2,commercialValue:1,sentiment:55,history:[],...(save.fans||{})};save.fans.history??=[];
  save.finance={cash:2000,marketValue:120000,weeklyWage:save.career.contract.weeklyWage||300,sponsorships:[],...(save.finance||{})};save.finance.sponsorships??=[];
  save.achievements={unlocked:[],notified:[],score:0,...(save.achievements||{})};save.achievements.unlocked??=[];save.achievements.notified??=[];
  save.meta={migrationNotes:[],checksum:'',...(save.meta||{})};save.meta.migrationNotes??=[];
  return save;
}

export function findLegacySave(){
  for(const key of oldKeys){try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw)return{key,save:migrateLegacy(raw)}}catch{}}
  return null;
}

export function migrateV10ToV18(raw){return migrateLegacy(raw)}
export function migrateV11ToV18(raw){return migrateLegacy(raw)}
export function migrateV12ToV18(raw){return migrateLegacy(raw)}
export function migrateV17ToV18(raw){return migrateLegacy(raw)}
