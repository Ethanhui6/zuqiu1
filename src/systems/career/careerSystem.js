import {ATTR_KEYS,CAREER_SETTINGS,POSITION_CONFIG,TALENT_RARITY,DEFAULT_AUTO_PAUSE,DEFAULT_STRATEGIES} from '../../app/config.js';
import {DeterministicRng,createSeed} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {calculateOvr,careerStage,teamRole} from './ovr.js';
import {createRelations} from '../relationship/relationshipSystem.js';
import {createFans} from '../fan/fanSystem.js';

const baseAttrs={pac:58,sho:55,pas:55,dri:57,def:45,phy:55};

export function createTalentCandidates({seed,position,style,templates,count=3}){
  const rng=new DeterministicRng(`${seed}|talents|${position}|${style}`);const list=[];
  const rarityEntries=Object.entries(TALENT_RARITY),rarityTotal=rarityEntries.reduce((sum,[,cfg])=>sum+Number(cfg.weight||0),0);
  for(let i=0;i<count;i++){
    let roll=rng.next()*rarityTotal,rarity='common';for(const [key,cfg] of rarityEntries){roll-=Number(cfg.weight||0);if(roll<=0){rarity=key;break}}const cfg=TALENT_RARITY[rarity];
    const pool=templates.filter(x=>x.position===(position==='SS'?'CAM':position));const source=rng.pick(pool)||null;
    const pot=rng.int(cfg.potential[0],cfg.potential[1]);
    const effect=rarity==='legend'&&source?`灵感来源：${source.name}。提高关键属性上限，但不能保证达到同等成就。`:rarity==='elite'?'成长速度明显提升，稳定性要求更高。':rarity==='good'?'拥有清晰优势，同时存在一项发展短板。':'成长均衡，需要依靠比赛和训练争取上限。';
    list.push({id:`talent-${i}-${rng.state}`,name:source&&rarity==='legend'?`${source.name}式成长轨迹`:`${style}·${cfg.name}天赋`,rarity:cfg.name,rarityKey:rarity,color:cfg.color,description:effect,growthMultiplier:cfg.growth,potential:pot,sourceTemplateId:source?.id||null,cost:rarity==='legend'?'状态波动与伤病风险略高':rarity==='elite'?'高强度训练更易疲劳':rarity==='good'?'弱项成长较慢':'没有额外保护'});
  }
  return list;
}

export function generateAcademyOffers({seed,nation,position,ovr,talent,clubs}){
  const rng=new DeterministicRng(`${seed}|academy|${nation}|${position}`);
  let candidates=clubs.filter(c=>c.country===nation&&c.youth>=55&&c.rep<=Math.max(84,ovr+24));
  if(candidates.length<3)candidates=clubs.filter(c=>c.youth>=65&&c.rep<=Math.max(80,ovr+20));
  const scored=candidates.map(c=>({club:c,score:c.youth*.42+c.youthUsage*.22-(c.rep-ovr)*.16+(c.needs.includes(position)?9:0)+rng.next()*13})).sort((a,b)=>b.score-a.score);
  const picked=[];for(const item of scored){if(!picked.some(x=>x.club.id===item.club.id))picked.push(item);if(picked.length===3)break}
  return picked.map(({club,score},i)=>({clubId:club.id,squad:i===0&&talent.rarityKey==='legend'?'19岁以下青年队':'18岁以下青年队',role:i===0?'重点培养对象':i===1?'地区希望之星':'试训球员',contractYears:2,weeklyWage:Math.round(120+club.finance*4+score*2),reason:club.needs.includes(position)?'该位置是青训重点补强方向':'青训体系与成长风格匹配'}));
}


function openingHook(draft,club,rng){
  const situations=[
    {id:'academy-rival',title:'唯一重点培养名额',description:`${club.cn}只会在本阶段确定一名重点培养球员。你必须决定如何与同位置天才竞争。`,choices:[
      {id:'press',text:'主动争取高强度训练',hint:'高风险 · 提高教练关注，也会增加疲劳',style:'aggressive',focus:'phy',base:.58,effects:{xp:34,trust:7,morale:1,fans:300,fitness:-5,injuryRisk:14},unlockChain:'academy-competition'},
      {id:'technical',text:'用技术表现赢得名额',hint:'中风险 · 提高位置能力与比赛机会',style:'technical',focus:'pas',base:.66,effects:{xp:42,trust:4,morale:3,fans:220,fitness:-2,injuryRisk:7},unlockChain:'academy-competition'},
      {id:'longterm',text:'先制定长期成长计划',hint:'低风险 · 短期曝光较少，长期成长更稳',style:'longterm',focus:'dri',base:.78,effects:{xp:30,trust:2,morale:5,fans:80,fitness:1,injuryRisk:2},unlockChain:'academy-competition',delayedEffects:[{type:'coachTrust',amount:4}]}
    ]},
    {id:'trial-window',title:'豪门试训名单',description:'一家更强的学院愿意让你参加短期试训，但不会保证合同和出场时间。',choices:[
      {id:'trial',text:'接受试训并承担竞争风险',hint:'高风险 · 可能开启转会剧情',style:'gamble',focus:'pac',base:.52,effects:{xp:38,trust:-2,morale:4,fans:900,fitness:-4,injuryRisk:12},unlockChain:'academy-trial'},
      {id:'stay',text:'留在当前学院争取稳定首发',hint:'低风险 · 提高教练信任与短期出场',style:'safe',focus:'pas',base:.8,effects:{xp:25,trust:7,morale:3,fans:180,fitness:1,injuryRisk:2},unlockChain:'academy-stability'},
      {id:'condition',text:'要求先明确培养计划',hint:'中风险 · 可能改善条件，也可能失去机会',style:'negotiate',focus:'pas',base:.63,effects:{xp:28,trust:2,morale:2,fans:350,fitness:0,injuryRisk:4},unlockChain:'academy-trial'}
    ]},
    {id:'position-change',title:'改踢新位置的机会',description:`教练认为你的身体和技术特点适合尝试新的职责，这可能改变${draft.position}位置的发展路线。`,choices:[
      {id:'accept',text:'接受安排并学习新职责',hint:'稳定收益 · 增加战术适配和出场机会',style:'professional',focus:'pas',base:.76,effects:{xp:36,trust:6,morale:2,fans:120,fitness:-1,injuryRisk:3},unlockChain:'position-experiment'},
      {id:'refuse',text:'坚持原位置的成长路线',hint:'中风险 · 保留专精，但教练信任可能下降',style:'self',focus:'sho',base:.62,effects:{xp:42,trust:-4,morale:4,fans:250,fitness:-1,injuryRisk:5},unlockChain:'position-experiment'},
      {id:'trial',text:'只在训练中进行短期尝试',hint:'低风险 · 兼顾两个方向，成长速度较慢',style:'balanced',focus:'dri',base:.72,effects:{xp:30,trust:3,morale:2,fans:100,fitness:-2,injuryRisk:4},unlockChain:'position-experiment',delayedEffects:[{type:'morale',amount:2}]}
    ]},
    {id:'cup-sub',title:'青年杯替补机会',description:'球队在青年杯进入关键阶段，教练准备给你一次替补登场机会。',choices:[
      {id:'attack',text:'登场后主动争取决定比赛',hint:'高风险 · 个人数据和关注度上限更高',style:'aggressive',focus:'sho',base:.56,effects:{xp:40,trust:4,morale:5,fans:850,fitness:-5,injuryRisk:11},unlockChain:'cup-breakthrough'},
      {id:'team',text:'优先执行球队战术',hint:'低风险 · 提高教练和队友关系',style:'team',focus:'pas',base:.78,effects:{xp:28,trust:7,morale:3,fans:260,fitness:-2,injuryRisk:4},unlockChain:'cup-breakthrough'},
      {id:'prepare',text:'先确保完整热身和身体状态',hint:'低风险 · 降低受伤风险，短期表现机会减少',style:'safe',focus:'phy',base:.84,effects:{xp:18,trust:3,morale:2,fans:80,fitness:4,injuryRisk:0},unlockChain:'cup-breakthrough'}
    ]}
  ];
  const base=rng.pick(situations);
  return{...base,id:`opening-${base.id}-${rng.state}`,category:'academy',categoryCn:'职业开局',phase:'青训期',pressure:'生涯转折',tags:['academy','opening','unique'],weight:1,cooldown:99,unique:true,repeatable:false,prerequisite:[],next:null,conditions:{},person:'青训主管',generatedAt:{season:1,month:1,week:1,rngState:rng.state},resolved:false};
}

export function createNewSave(draft,club,slotId){
  const seed=draft.seed||createSeed();const rng=new DeterministicRng(seed);const cfg=POSITION_CONFIG[draft.position]||POSITION_CONFIG.ST;
  const attrs={...baseAttrs};for(const key of cfg.focus)attrs[key]+=rng.int(2,6);if(draft.talent.rarityKey==='legend'&&draft.sourceTemplate){for(const key of ATTR_KEYS)attrs[key]=clamp(Math.round(attrs[key]*.55+draft.sourceTemplate.attrs[key]*.45),45,78)}
  const age=clamp(Number(draft.age)||17,16,18);const ovr=calculateOvr(attrs,draft.position);
  const save={schemaVersion:18,gameVersion:'18.3.0',createdAt:Date.now(),updatedAt:Date.now(),rng:{...rng.snapshot()},settings:{theme:'system',reducedMotion:false,pace:{mode:draft.paceMode||'standard',speed:'normal',autoPause:{...DEFAULT_AUTO_PAUSE}}},
    player:{id:`player-${slotId}-${Date.now()}`,name:draft.name,displayName:draft.displayName||draft.name,nation:draft.nation,birthDate:draft.birthDate||`${2026-age}-06-15`,age,height:Number(draft.height)||178,weight:Number(draft.weight)||72,foot:draft.foot||'右脚',number:Number(draft.number)||10,position:draft.position,secondaryPositions:[],style:draft.style,talent:draft.talent,attrs,ovr,potential:draft.talent.potential,xp:Object.fromEntries(ATTR_KEYS.map(k=>[k,0])),hidden:{discipline:rng.int(45,78),professionalism:rng.int(45,82),consistency:rng.int(42,78),bigMatch:rng.int(40,76),leadership:rng.int(35,72),injuryProne:rng.int(12,48),learning:rng.int(48,86)}},
    career:{year:2026,season:1,month:1,seasonProgress:0,clubId:club.id,squadLevel:draft.academyOffer.squad,teamRole:draft.academyOffer.role,contract:{type:'青训合同',years:draft.academyOffer.contractYears,weeklyWage:draft.academyOffer.weeklyWage,releaseClause:0,appearancePromise:'根据青年队表现逐步培养'},seasonStats:emptySeasonStats(),careerStats:{apps:0,goals:0,assists:0,cleanSheets:0,titles:0,nationalApps:0,nationalGoals:0,bestRating:0,hatTricks:0,bigGames:0,saves:0,tackles:0},history:[],clubHistory:[club.id],records:{},trophies:[],pending:{event:openingHook(draft,club,rng),match:null,offers:[],delayedEffects:[]},eventMemory:{triggered:[],recentEventIds:[],recentTags:[],recentTitles:[],recentTemplateTitles:[],recentChoiceSignatures:[],recentPersons:[],recentOpponents:[],choices:[],chainsOpen:[],chainsClosed:[],cooldowns:{},typeCounts:{},generatedCount:0,duplicateCount:0,lastAvailableCount:0,lastFilteredCount:0,lastChoiceSignature:''},transferHistory:[],offerHistory:[],rejectedClubs:[],transferWindows:{},actionLocks:{},facilities:{visits:[],locks:{}},loan:null,trainingPlan:'tactics',retirement:null,calendar:{week:1,absoluteWeek:1},weekState:{trainingDone:true,eventDone:false,matchDone:false},schedule:null,strategies:{...DEFAULT_STRATEGIES},objectives:{season:1,candidates:[],active:[],completed:[],rewarded:[]},advance:{running:false,lastSummary:null,history:[],resumeTarget:null},lastMatchResult:null,majorNodes:[]},
    status:{fitness:88,morale:72,form:55,fatigue:8,injury:null,suspension:0,coachTrust:45},relations:createRelations(),fans:createFans(),finance:{cash:2000,marketValue:120000,weeklyWage:draft.academyOffer.weeklyWage,sponsorships:[]},achievements:{unlocked:[],notified:[],score:0},meta:{migrationNotes:[],checksum:''}}
  return save;
}

export function emptySeasonStats(){return{apps:0,starts:0,minutes:0,goals:0,assists:0,cleanSheets:0,rating:0,yellow:0,red:0,shots:0,keyPasses:0,tackles:0,saves:0}}

export function updateCareerStage(save,club){
  save.career.teamRole=teamRole(save,club);const p=save.player,s=save.status;
  if(save.career.squadLevel!=='一线队'){
    const need=club.rep-10;const performance=save.career.seasonStats.rating||0;
    if(p.ovr>=need&&s.coachTrust>=58&&performance>=6.8&&!s.injury){save.career.squadLevel='一线队';save.career.contract.type='职业合同';save.career.contract.weeklyWage=Math.max(save.career.contract.weeklyWage,Math.round(2500+(p.ovr-60)*500));save.finance.weeklyWage=save.career.contract.weeklyWage;save.career.history.push({type:'promotion',year:save.career.year,title:'升入一线队',text:`以 ${p.ovr} 的综合能力和稳定表现获得一线队合同。`});}
  }
  return careerStage(p.age,save.career.squadLevel);
}

export function advanceSeason(save){
  save.career.history.push({type:'season',year:save.career.year,season:save.career.season,clubId:save.career.clubId,stats:{...save.career.seasonStats},ovr:save.player.ovr});
  save.career.year++;save.career.season++;save.career.month=1;save.career.seasonProgress=0;save.player.age++;save.career.contract.years=Math.max(0,save.career.contract.years-1);save.career.seasonStats=emptySeasonStats();save.status.fatigue=clamp(save.status.fatigue-24,0,100);save.status.fitness=clamp(save.status.fitness+18,0,100);save.career.pending.event=null;save.career.pending.match=null;save.career.pending.offers=[];save.career.schedule=null;save.career.calendar={week:1,absoluteWeek:save.career.calendar?.absoluteWeek||1,nextEventWeek:1};save.career.weekState={trainingDone:false,eventDone:false,matchDone:false,trainingResult:null};save.career.objectives={season:save.career.season,candidates:[],active:[],completed:save.career.objectives?.completed||[],rewarded:save.career.objectives?.rewarded||[]};
  if(save.career.loan&&save.career.season>=save.career.loan.returnSeason){const loan={...save.career.loan};save.career.clubId=loan.parentClubId;save.career.loan=null;save.career.teamRole='轮换';save.status.coachTrust=48;save.career.history.push({type:'loan-return',year:save.career.year,season:save.career.season,title:'租借期结束',text:'租借期满后回到母队，重新竞争一线队位置。',from:loan.loanClubId,to:loan.parentClubId});}
}

export function shouldRetire(save){const age=save.player.age;const injury=save.status.injury?.severity||0;if(age>=40)return true;if(age>=35&&save.player.ovr<62)return true;if(age>=34&&injury>.7)return true;return false}
