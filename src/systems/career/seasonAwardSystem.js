import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {applyFanChange} from '../fan/fanSystem.js';

const ATTACKERS=new Set(['ST','SS','LW','RW']);
const CREATORS=new Set(['CAM','CM']);
const DEFENDERS=new Set(['CB','LB','RB','CDM']);

function ensureRecords(save){
  const defaults={goldenBoots:0,playerAwards:0,continentalTitles:0,worldCups:0,ballonDors:0,captainSeasons:0,eliteSeasons:0,hatTricks:0,bigGames:0,seasonBestGoals:0,seasonBestAssists:0,seasonBestCleanSheets:0,leagueTitles:0,cupTitles:0,youngPlayerAwards:0,bestDefenderAwards:0,goldenGloves:0,assistAwards:0};
  save.career.records??={};for(const[k,v]of Object.entries(defaults))if(!Number.isFinite(Number(save.career.records[k])))save.career.records[k]=v;
  save.career.trophies??=[];return save.career.records;
}
function addAward(save,{id,name,type='个人奖项',clubId,league,season,detail=''}){
  const key=`${id}-${season}-${clubId||'national'}`;if(save.career.trophies.some(x=>x.key===key))return null;
  const award={key,id,assetId:id,name,type,clubId:clubId||null,league:league||null,season,year:save.career.year,detail};save.career.trophies.push(award);return award;
}
function chance(rng,value){return rng.bool(clamp(value,0,0.92))}

/** 在赛季数据清零前结算球队冠军、位置奖项和国家队大赛。所有结果来自存档 RNG。 */
export function settleSeasonAwards(save,club){
  const records=ensureRecords(save),ss=save.career.seasonStats,season=save.career.season;
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const awards=[];const firstTeam=save.career.squadLevel==='一线队';const roleFactor=['主力','核心','队长核心'].some(x=>save.career.teamRole.includes(x))?1:.72;
  const rating=Number(ss.rating||0),apps=Number(ss.apps||0),goals=Number(ss.goals||0),assists=Number(ss.assists||0),cleanSheets=Number(ss.cleanSheets||0);
  records.seasonBestGoals=Math.max(records.seasonBestGoals,goals);records.seasonBestAssists=Math.max(records.seasonBestAssists,assists);records.seasonBestCleanSheets=Math.max(records.seasonBestCleanSheets,cleanSheets);
  if(rating>=7.6&&apps>=20)records.eliteSeasons++;
  if(save.career.teamRole.includes('队长'))records.captainSeasons++;

  if(firstTeam&&apps>=12){
    const playerImpact=clamp((rating-6.2)*.12+(goals+assists)*.0025,0,.25)*roleFactor;
    const leagueChance=(club.rep-66)/115+playerImpact;
    const cupChance=.09+(club.rep-65)/180+playerImpact*.55;
    const continentalChance=club.rep>=78?.035+(club.rep-78)/135+playerImpact*.42:0;
    if(chance(rng,leagueChance)){
      const a=addAward(save,{id:'league-title',name:`${club.leagueCn}冠军`,type:'俱乐部冠军',clubId:club.id,league:club.leagueCn,season,detail:'随队赢得联赛冠军'});if(a){awards.push(a);records.leagueTitles++;save.career.careerStats.titles++}
    }
    if(chance(rng,cupChance)){
      const a=addAward(save,{id:'domestic-cup',name:'国内杯赛冠军',type:'俱乐部冠军',clubId:club.id,league:club.leagueCn,season,detail:'随队赢得国内杯赛'});if(a){awards.push(a);records.cupTitles++;save.career.careerStats.titles++}
    }
    if(chance(rng,continentalChance)){
      const a=addAward(save,{id:'continental-title',name:'洲际俱乐部冠军',type:'俱乐部冠军',clubId:club.id,league:club.leagueCn,season,detail:'在洲际俱乐部赛事中夺冠'});if(a){awards.push(a);records.continentalTitles++;save.career.careerStats.titles++}
    }
  }

  if(apps>=12){
    if(ATTACKERS.has(save.player.position)&&goals>=Math.max(18,Math.round(24+(club.rep-75)*.18))){const a=addAward(save,{id:'golden-boot',name:'联赛金靴',clubId:club.id,league:club.leagueCn,season,detail:`赛季打入${goals}球`});if(a){awards.push(a);records.goldenBoots++}}
    if(CREATORS.has(save.player.position)&&assists>=Math.max(12,Math.round(15+(club.rep-75)*.10))){const a=addAward(save,{id:'assists-king',name:'联赛助攻王',clubId:club.id,league:club.leagueCn,season,detail:`赛季送出${assists}次助攻`});if(a){awards.push(a);records.assistAwards++}}
    if(save.player.position==='GK'&&cleanSheets>=14){const a=addAward(save,{id:'golden-glove',name:'联赛金手套',clubId:club.id,league:club.leagueCn,season,detail:`赛季完成${cleanSheets}场零封`});if(a){awards.push(a);records.goldenGloves++}}
    if(DEFENDERS.has(save.player.position)&&cleanSheets>=12&&rating>=7.15){const a=addAward(save,{id:'best-defender',name:'赛季最佳后卫',clubId:club.id,league:club.leagueCn,season,detail:'凭借稳定防守表现获奖'});if(a){awards.push(a);records.bestDefenderAwards++}}
    if(save.player.age<=21&&rating>=7.25&&apps>=18){const a=addAward(save,{id:'young-player',name:'最佳年轻球员',clubId:club.id,league:club.leagueCn,season,detail:'青年球员赛季表现突出'});if(a){awards.push(a);records.youngPlayerAwards++}}
    if(rating>=7.75&&apps>=22){const a=addAward(save,{id:'player-of-season',name:'赛季最佳球员',clubId:club.id,league:club.leagueCn,season,detail:`赛季平均评分${rating}`});if(a){awards.push(a);records.playerAwards++}}
    if(CREATORS.has(save.player.position)&&assists>=10&&rating>=7.45){const a=addAward(save,{id:'best-midfielder',name:'赛季最佳中场',clubId:club.id,league:club.leagueCn,season,detail:'组织与创造表现领先'});if(a)awards.push(a)}
    if(ATTACKERS.has(save.player.position)&&goals>=15&&rating>=7.45){const a=addAward(save,{id:'best-forward',name:'赛季最佳前锋',clubId:club.id,league:club.leagueCn,season,detail:'进攻表现领先'});if(a)awards.push(a)}
    if(rating>=7.5&&apps>=20){const a=addAward(save,{id:'best-xi',name:'赛季最佳阵容',clubId:club.id,league:club.leagueCn,season,detail:'入选赛季最佳阵容'});if(a)awards.push(a)}
    if(save.player.age<=21&&rating>=7.8&&apps>=20){const a=addAward(save,{id:'golden-boy',name:'金童奖',clubId:club.id,league:club.leagueCn,season,detail:'年度青年球员综合表现领先'});if(a)awards.push(a)}
    const globalScore=save.player.ovr+(rating-7)*7+goals*.12+assists*.10+records.continentalTitles*1.2;
    if(globalScore>=91&&chance(rng,.16+(globalScore-91)*.055)){
      const a=addAward(save,{id:'world-player',name:'世界年度最佳球员',clubId:club.id,league:club.leagueCn,season,detail:'在俱乐部与国际赛场综合表现领先'});if(a){awards.push(a);records.ballonDors++}
    }
  }

  if(firstTeam&&save.career.careerStats.nationalApps>=15&&season%4===0){
    const nationalScore=save.player.ovr+(rating-6.5)*4+save.player.hidden.bigMatch*.05;
    if(nationalScore>=80&&chance(rng,.08+(nationalScore-80)*.025)){
      const a=addAward(save,{id:'world-cup',name:'国家队世界冠军',type:'国家队冠军',season,detail:`代表${save.player.nation}赢得世界大赛`});if(a){awards.push(a);records.worldCups++;save.career.careerStats.titles++}
      if(rating>=8){const b=addAward(save,{id:'world-cup-golden-ball',name:'世界杯金球奖',season,detail:'世界大赛综合表现最佳'});if(b)awards.push(b)}
      if(goals>=8){const b=addAward(save,{id:'world-cup-golden-boot',name:'世界杯金靴奖',season,detail:'世界大赛进球表现领先'});if(b)awards.push(b)}
      if(save.player.age<=21&&rating>=7.4){const b=addAward(save,{id:'world-cup-best-young',name:'世界杯最佳年轻球员',season,detail:'世界大赛青年球员表现领先'});if(b)awards.push(b)}
    }
  }
  if(awards.length){applyFanChange(save,{club:awards.length*4200,global:awards.length*9500,social:awards.length*7200,heat:Math.min(14,awards.length*3),commercial:Math.min(6,awards.length),sentiment:5,reason:'赛季荣誉'});save.career.history.push({type:'awards',year:save.career.year,season,title:'赛季荣誉',text:awards.map(x=>x.name).join('、'),awards:awards.map(x=>x.key)})}
  save.rng=rng.snapshot();return awards;
}
