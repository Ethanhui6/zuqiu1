import {ensureRngState,keyedRandom} from '../../services/rng.js';
import {addGameDays,compareGameDates} from '../../utils/gameDate.js';
import {ensureGameClock} from '../career/gameClock.js';

const SEASON_WEEKS=52;
const COMPETITIONS={
  youthLeague:{name:'青年联赛',type:'youth-league'},
  reserveLeague:{name:'预备队联赛',type:'reserve-league'},
  league:{name:'国内联赛',type:'league'},
  cup:{name:'国内杯赛',type:'cup'},
  continental:{name:'洲际比赛',type:'continental'},
  friendly:{name:'友谊赛',type:'friendly'},
  preseason:{name:'季前赛',type:'preseason'},
  national:{name:'国家队比赛',type:'national'}
};

function uniq(items){return[...new Set(items)]}
function leagueLevel(save,current){return Math.max(1,Number(save.career.competitionState?.level||current.level||1))}
function chooseLeaguePool(save,repo,current){
  const level=leagueLevel(save,current);
  let pool=level===Number(current.level||1)?repo.clubs.filter(c=>c.id!==current.id&&c.leagueId===current.leagueId):repo.clubs.filter(c=>c.id!==current.id&&c.country===current.country&&Number(c.level||1)===level);
  if(pool.length<10)pool=repo.clubs.filter(c=>c.id!==current.id&&c.country===current.country&&Math.abs(c.rep-current.rep)<=18);
  if(pool.length<10)pool=repo.clubs.filter(c=>c.id!==current.id&&Math.abs(c.rep-current.rep)<=12);
  return pool;
}
function competitionFor(save,current){
  if(save.career.squadLevel==='一线队')return COMPETITIONS.league;
  if(/预备|二队/.test(save.career.squadLevel))return COMPETITIONS.reserveLeague;
  return COMPETITIONS.youthLeague;
}
function isContinentalEligible(save,current){return save.career.squadLevel==='一线队'&&(save.career.competitionState?.continentalQualified||current.rep>=78||save.career.careerStats.titles>0)}
function noAdjacentRepeat(fixtures){
  for(let i=1;i<fixtures.length;i++){
    if(fixtures[i].opponentId===fixtures[i-1].opponentId){
      const swap=fixtures.findIndex((f,j)=>j>i&&f.opponentId!==fixtures[i-1].opponentId&&f.opponentId!==fixtures[i+1]?.opponentId);
      if(swap>i)[fixtures[i],fixtures[swap]]=[fixtures[swap],fixtures[i]];
    }
  }
  return fixtures;
}
function createFixture({save,current,opponent,competition,index,rng,week,date}){
  const strengthGap=Math.abs(current.rep-opponent.rep);
  let importance='普通联赛';
  if(competition.type==='cup')importance=index>=2?'杯赛淘汰赛':'杯赛';
  if(competition.type==='continental')importance=index>=4?'冠军争夺战':'洲际关键战';
  if(competition.type==='national')importance='国家队比赛';
  if(competition.type==='friendly'||competition.type==='preseason')importance='普通比赛';
  if(strengthGap<=3&&competition.type.includes('league'))importance=rng.bool(.22)?'德比战':'争四关键战';
  return{
    id:`F-${save.career.season}-${date}-${competition.type}-${opponent.id}-${index}`,
    season:save.career.season,date,week,round:index+1,roundLabel:competition.type==='cup'?`第${index+1}轮`:competition.type==='continental'?`第${index+1}比赛日`:`第${index+1}轮`,competition:competition.name,competitionType:competition.type,
    opponentId:opponent.id,home:rng.bool(.5),importance,played:false,result:null,
    opponentSnapshot:{rep:opponent.rep,attack:opponent.attack,defense:opponent.defense,tactic:opponent.tactic||'均衡战术'}
  };
}
function assignDates(items,rng,seasonStartDate){
  const used=new Set(),slots=[];
  for(let week=2;week<=49;week++)for(const offset of [2,5])slots.push({week,offset});
  const selected=rng.shuffle(slots).slice(0,items.length).sort((a,b)=>a.week-b.week||a.offset-b.offset);
  return items.map((item,index)=>{
    const slot=selected[index]||{week:Math.min(49,index+2),offset:index%2?5:2};
    let date=addGameDays(seasonStartDate,(slot.week-1)*7+slot.offset);
    while(used.has(date))date=addGameDays(date,1);
    used.add(date);return{...item,week:slot.week,date};
  });
}

export function generateSeasonSchedule(save,repo,{force=false}={}){
  const current=repo.getClub(save.career.clubId),clock=ensureGameClock(save);
  save.career.competitionState={level:Number(current.level||1),continentalQualified:false,history:[],...(save.career.competitionState||{})};
  const existing=save.career.schedule;
  if(!force&&existing&&existing.seasonId===clock.seasonId&&existing.clubId===current.id&&existing.squadLevel===save.career.squadLevel)return existing;
  const rngState=ensureRngState(save,{seed:`schedule-${clock.seasonId}-${current.id}`});
  const rng=keyedRandom(rngState.seed,'schedule',clock.seasonId,current.id,save.career.squadLevel);
  const leaguePool=rng.shuffle(chooseLeaguePool(save,repo,current));
  if(!leaguePool.length)throw new Error('当前环境没有可用联赛对手');
  const mainCompetition={...competitionFor(save,current)};
  if(mainCompetition.type==='league')mainCompetition.name=leagueLevel(save,current)===Number(current.level||1)?current.leagueCn:`国内第${leagueLevel(save,current)}级联赛`;
  const mainCount=save.career.squadLevel==='一线队'?30:24;
  const leagueOpponents=[];
  while(leagueOpponents.length<mainCount){for(const club of leaguePool){leagueOpponents.push(club);if(leagueOpponents.length>=mainCount)break}}
  const countryCupPool=rng.shuffle(repo.clubs.filter(c=>c.id!==current.id&&c.country===current.country));
  const crossBorderPool=rng.shuffle(repo.clubs.filter(c=>c.id!==current.id&&c.country!==current.country&&Math.abs(c.rep-current.rep)<=15));
  const specs=[];
  leagueOpponents.forEach((opponent,index)=>specs.push({opponent,competition:mainCompetition,index}));
  countryCupPool.slice(0,save.career.squadLevel==='一线队'?5:3).forEach((opponent,index)=>specs.push({opponent,competition:COMPETITIONS.cup,index}));
  crossBorderPool.slice(0,3).forEach((opponent,index)=>specs.push({opponent,competition:index===0?COMPETITIONS.preseason:COMPETITIONS.friendly,index}));
  if(isContinentalEligible(save,current))crossBorderPool.slice(3,11).forEach((opponent,index)=>specs.push({opponent,competition:COMPETITIONS.continental,index}));
  if(save.career.nationalTeam?.calledUp){
    const nationalOpponents=rng.shuffle(repo.clubs.filter(c=>c.id!==current.id&&c.country!==current.country)).slice(0,3);
    nationalOpponents.forEach((opponent,index)=>specs.push({opponent,competition:COMPETITIONS.national,index}));
  }
  const assigned=assignDates(rng.shuffle(specs).slice(0,44),rng,clock.seasonStartDate).map(spec=>createFixture({save,current,...spec,index:spec.index,rng,week:spec.week,date:spec.date}));
  assigned.sort((a,b)=>compareGameDates(a.date,b.date)||a.competition.localeCompare(b.competition,'zh-CN'));
  noAdjacentRepeat(assigned);
  assigned.sort((a,b)=>compareGameDates(a.date,b.date)||a.competition.localeCompare(b.competition,'zh-CN'));
  save.career.schedule={season:save.career.season,seasonId:clock.seasonId,clubId:current.id,squadLevel:save.career.squadLevel,weeks:SEASON_WEEKS,generatedAt:Date.now(),fixtures:assigned};
  return save.career.schedule;
}

function reconcilePastFixtures(save,schedule){
  const clock=ensureGameClock(save);
  for(const fixture of schedule.fixtures||[]){
    if(!fixture.played&&compareGameDates(fixture.date,clock.currentDate)<0){
      fixture.played=true;fixture.result=null;fixture.skipped=true;
      fixture.playedAt={season:save.career.season,date:fixture.date,week:fixture.week,reason:'载入存档时已过期'};
    }
  }
  return schedule;
}
export function ensureSchedule(save,repo){return reconcilePastFixtures(save,generateSeasonSchedule(save,repo))}
export function nextFixture(save,repo,{fromDate,fromWeek}={}){
  const clock=ensureGameClock(save),schedule=ensureSchedule(save,repo);
  const date=fromDate||clock.currentDate;
  const ordered=[...(schedule.fixtures||[])].sort((a,b)=>compareGameDates(a.date,b.date)||Number(a.round||0)-Number(b.round||0));
  if(fromWeek&&!fromDate)return ordered.find(f=>!f.played&&f.week>=Number(fromWeek))||null;
  return ordered.find(f=>!f.played&&compareGameDates(f.date,date)>=0)||null;
}
export function fixturesForDate(save,repo,date=ensureGameClock(save).currentDate){return ensureSchedule(save,repo).fixtures.filter(f=>!f.played&&f.date===date)}
export function fixturesForWeek(save,repo,week=ensureGameClock(save).competitionWeek){return ensureSchedule(save,repo).fixtures.filter(f=>!f.played&&f.week===week)}
export function markFixturePlayed(save,fixtureId,result){const fixture=save.career.schedule?.fixtures?.find(f=>f.id===fixtureId);if(fixture){fixture.played=true;fixture.result=result;fixture.playedAt={season:save.career.season,date:ensureGameClock(save).currentDate,week:ensureGameClock(save).competitionWeek}}return fixture}
export function scheduleStats(save){
  const fixtures=save.career.schedule?.fixtures||[],played=fixtures.filter(f=>f.played),opponents=uniq(fixtures.map(f=>f.opponentId));
  return{total:fixtures.length,played:played.length,remaining:fixtures.length-played.length,differentOpponents:opponents.length,competitions:Object.fromEntries(uniq(fixtures.map(f=>f.competition)).map(name=>[name,fixtures.filter(f=>f.competition===name).length]))};
}
export function upcomingFixtures(save,repo,count=8){const date=ensureGameClock(save).currentDate;return [...ensureSchedule(save,repo).fixtures].filter(f=>!f.played&&compareGameDates(f.date,date)>=0).sort((a,b)=>compareGameDates(a.date,b.date)||Number(a.round||0)-Number(b.round||0)).slice(0,count)}
export function syncScheduleAfterClubChange(save,repo){
  const currentDate=ensureGameClock(save).currentDate,completed=(save.career.schedule?.fixtures||[]).filter(f=>f.played);
  const generated=generateSeasonSchedule(save,repo,{force:true});
  generated.fixtures=[...completed,...generated.fixtures.filter(f=>compareGameDates(f.date,currentDate)>=0)].sort((a,b)=>compareGameDates(a.date,b.date));
  return generated;
}
export function settleCompetitionState(save,repo){
  const current=repo.getClub(save.career.clubId),state=save.career.competitionState??={level:Number(current.level||1),continentalQualified:false,history:[]};
  state.history??=[];
  if(save.career.squadLevel!=='一线队'){
    state.history.push({season:save.career.season,level:state.level,continentalQualified:false,outcome:'青年或预备队赛事',source:'独立模拟'});
    state.history=state.history.slice(-24);save.career.competitionState=state;return state;
  }
  const rngState=ensureRngState(save,{seed:`league-state-${save.career.season}-${current.id}`});
  const rng=keyedRandom(rngState.seed,'league-state',save.career.season,current.id),stats=save.career.seasonStats;
  const teamIndex=current.rep+rng.int(-17,17)+Math.min(7,Number(stats.rating||0)-6.5)*2;
  const before=Math.max(1,Number(state.level||current.level||1));let level=before,outcome='留在当前级别';
  if(before>1&&teamIndex>=70){level=before-1;outcome='升级'}
  else if(before<3&&teamIndex<=49){level=before+1;outcome='降级'}
  const continentalQualified=level===1&&(teamIndex>=77||save.career.careerStats.titles>0);
  state.level=level;state.continentalQualified=continentalQualified;
  state.history.push({season:save.career.season,levelBefore:before,levelAfter:level,continentalQualified,outcome,teamIndex:Math.round(teamIndex),source:'独立模拟'});
  state.history=state.history.slice(-24);save.career.competitionState=state;
  save.career.history.push({type:'competition-state',season:save.career.season,title:outcome,text:`联赛层级 ${before} → ${level}${continentalQualified?'，获得洲际赛事资格':''}。`,source:'独立模拟'});
  return state;
}
export {SEASON_WEEKS,COMPETITIONS};
