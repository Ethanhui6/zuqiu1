import {ATTR_KEYS,CAREER_SETTINGS,POSITION_CONFIG,TALENT_RARITY} from '../../app/config.js';
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

export function createNewSave(draft,club,slotId){
  const seed=draft.seed||createSeed();const rng=new DeterministicRng(seed);const cfg=POSITION_CONFIG[draft.position]||POSITION_CONFIG.ST;
  const attrs={...baseAttrs};for(const key of cfg.focus)attrs[key]+=rng.int(2,6);if(draft.talent.rarityKey==='legend'&&draft.sourceTemplate){for(const key of ATTR_KEYS)attrs[key]=clamp(Math.round(attrs[key]*.55+draft.sourceTemplate.attrs[key]*.45),45,78)}
  const age=clamp(Number(draft.age)||17,16,18);const ovr=calculateOvr(attrs,draft.position);
  const save={schemaVersion:18,gameVersion:'18.1.0',createdAt:Date.now(),updatedAt:Date.now(),rng:{...rng.snapshot()},settings:{theme:'system',reducedMotion:false},
    player:{id:`player-${slotId}-${Date.now()}`,name:draft.name,displayName:draft.displayName||draft.name,nation:draft.nation,birthDate:draft.birthDate||`${2026-age}-06-15`,age,height:Number(draft.height)||178,weight:Number(draft.weight)||72,foot:draft.foot||'右脚',number:Number(draft.number)||10,position:draft.position,secondaryPositions:[],style:draft.style,talent:draft.talent,attrs,ovr,potential:draft.talent.potential,xp:Object.fromEntries(ATTR_KEYS.map(k=>[k,0])),hidden:{discipline:rng.int(45,78),professionalism:rng.int(45,82),consistency:rng.int(42,78),bigMatch:rng.int(40,76),leadership:rng.int(35,72),injuryProne:rng.int(12,48),learning:rng.int(48,86)}},
    career:{year:2026,season:1,month:1,seasonProgress:0,clubId:club.id,squadLevel:draft.academyOffer.squad,teamRole:draft.academyOffer.role,contract:{type:'青训合同',years:draft.academyOffer.contractYears,weeklyWage:draft.academyOffer.weeklyWage,releaseClause:0,appearancePromise:'根据青年队表现逐步培养'},seasonStats:emptySeasonStats(),careerStats:{apps:0,goals:0,assists:0,cleanSheets:0,titles:0,nationalApps:0,nationalGoals:0,bestRating:0,hatTricks:0,bigGames:0,saves:0,tackles:0},history:[],clubHistory:[club.id],records:{},trophies:[],pending:{event:null,match:null,offers:[],delayedEffects:[]},eventMemory:{triggered:[],recentTags:[],recentTitles:[],recentChoiceSignatures:[],choices:[],chainsOpen:[],chainsClosed:[],cooldowns:{},lastChoiceSignature:''},transferHistory:[],offerHistory:[],rejectedClubs:[],transferWindows:{},actionLocks:{},facilities:{visits:[],locks:{}},loan:null,trainingPlan:'tactics',retirement:null},
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
  save.career.year++;save.career.season++;save.career.month=1;save.career.seasonProgress=0;save.player.age++;save.career.contract.years=Math.max(0,save.career.contract.years-1);save.career.seasonStats=emptySeasonStats();save.status.fatigue=clamp(save.status.fatigue-24,0,100);save.status.fitness=clamp(save.status.fitness+18,0,100);save.career.pending.event=null;save.career.pending.match=null;save.career.pending.offers=[];
  if(save.career.loan&&save.career.season>=save.career.loan.returnSeason){const loan={...save.career.loan};save.career.clubId=loan.parentClubId;save.career.loan=null;save.career.teamRole='轮换';save.status.coachTrust=48;save.career.history.push({type:'loan-return',year:save.career.year,season:save.career.season,title:'租借期结束',text:'租借期满后回到母队，重新竞争一线队位置。',from:loan.loanClubId,to:loan.parentClubId});}
}

export function shouldRetire(save){const age=save.player.age;const injury=save.status.injury?.severity||0;if(age>=40)return true;if(age>=35&&save.player.ovr<62)return true;if(age>=34&&injury>.7)return true;return false}
