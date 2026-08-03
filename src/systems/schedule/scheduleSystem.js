import {keyedRandom} from '../../services/rng.js';

const SEASON_WEEKS=40;
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

function uniq(items){return [...new Set(items)]}
function chooseLeaguePool(save,repo,current){
  let pool=repo.clubs.filter(c=>c.id!==current.id&&c.leagueId===current.leagueId);
  if(pool.length<10)pool=repo.clubs.filter(c=>c.id!==current.id&&c.country===current.country&&Math.abs(c.rep-current.rep)<=18);
  if(pool.length<10)pool=repo.clubs.filter(c=>c.id!==current.id&&Math.abs(c.rep-current.rep)<=12);
  return pool;
}
function competitionFor(save){
  if(save.career.squadLevel==='一线队')return COMPETITIONS.league;
  if(/预备|二队/.test(save.career.squadLevel))return COMPETITIONS.reserveLeague;
  return COMPETITIONS.youthLeague;
}
function isContinentalEligible(save,current){return save.career.squadLevel==='一线队'&&(current.rep>=78||save.career.careerStats.titles>0)}
function noAdjacentRepeat(fixtures){
  for(let i=1;i<fixtures.length;i++){
    if(fixtures[i].opponentId===fixtures[i-1].opponentId){
      const swap=fixtures.findIndex((f,j)=>j>i&&f.opponentId!==fixtures[i-1].opponentId&&f.opponentId!==fixtures[i+1]?.opponentId);
      if(swap>i)[fixtures[i],fixtures[swap]]=[fixtures[swap],fixtures[i]];
    }
  }
  return fixtures;
}
function createFixture({save,current,opponent,competition,index,rng,week}){
  const strengthGap=Math.abs(current.rep-opponent.rep);
  let importance='普通联赛';
  if(competition.type==='cup')importance=index>=2?'杯赛淘汰赛':'杯赛';
  if(competition.type==='continental')importance=index>=4?'冠军争夺战':'洲际关键战';
  if(competition.type==='national')importance='国家队比赛';
  if(competition.type==='friendly'||competition.type==='preseason')importance='普通比赛';
  if(strengthGap<=3&&competition.type.includes('league'))importance=rng.bool(.22)?'德比战':'争四关键战';
  return{
    id:`F-${save.career.season}-${week}-${competition.type}-${opponent.id}-${index}`,
    season:save.career.season,week,competition:competition.name,competitionType:competition.type,
    opponentId:opponent.id,home:rng.bool(.5),importance,played:false,result:null,
    opponentSnapshot:{rep:opponent.rep,attack:opponent.attack,defense:opponent.defense,tactic:opponent.tactic||'均衡战术'}
  };
}
function assignWeeks(items,rng){
  const slots=rng.shuffle(Array.from({length:SEASON_WEEKS-2},(_,i)=>i+2)).slice(0,items.length).sort((a,b)=>a-b);
  return items.map((item,index)=>({...item,week:slots[index]||Math.min(SEASON_WEEKS,index+2)}));
}

export function generateSeasonSchedule(save,repo,{force=false}={}){
  const current=repo.getClub(save.career.clubId);
  const existing=save.career.schedule;
  if(!force&&existing&&existing.season===save.career.season&&existing.clubId===current.id&&existing.squadLevel===save.career.squadLevel)return existing;
  const rng=keyedRandom(save.rng.seed,'schedule',save.career.season,current.id,save.career.squadLevel);
  const leaguePool=rng.shuffle(chooseLeaguePool(save,repo,current));
  if(!leaguePool.length)throw new Error('当前环境没有可用联赛对手');
  const mainCompetition=competitionFor(save);
  const mainCount=save.career.squadLevel==='一线队'?26:24;
  const leagueOpponents=[];
  while(leagueOpponents.length<mainCount){for(const club of leaguePool){leagueOpponents.push(club);if(leagueOpponents.length>=mainCount)break}}
  const countryCupPool=rng.shuffle(repo.clubs.filter(c=>c.id!==current.id&&c.country===current.country));
  const crossBorderPool=rng.shuffle(repo.clubs.filter(c=>c.id!==current.id&&c.country!==current.country&&Math.abs(c.rep-current.rep)<=15));
  const specs=[];
  leagueOpponents.forEach((opponent,index)=>specs.push({opponent,competition:mainCompetition,index}));
  countryCupPool.slice(0,save.career.squadLevel==='一线队'?4:3).forEach((opponent,index)=>specs.push({opponent,competition:COMPETITIONS.cup,index}));
  crossBorderPool.slice(0,3).forEach((opponent,index)=>specs.push({opponent,competition:index===0?COMPETITIONS.preseason:COMPETITIONS.friendly,index}));
  if(isContinentalEligible(save,current))crossBorderPool.slice(3,9).forEach((opponent,index)=>specs.push({opponent,competition:COMPETITIONS.continental,index}));
  if(save.career.nationalTeam?.calledUp){
    const nationalOpponents=rng.shuffle(repo.clubs.filter(c=>c.id!==current.id&&c.country!==current.country)).slice(0,2);
    nationalOpponents.forEach((opponent,index)=>specs.push({opponent,competition:COMPETITIONS.national,index}));
  }
  const assigned=assignWeeks(rng.shuffle(specs).slice(0,36),rng).map((spec,index)=>createFixture({save,current,...spec,index,rng,week:spec.week}));
  assigned.sort((a,b)=>a.week-b.week||a.competition.localeCompare(b.competition,'zh-CN'));
  noAdjacentRepeat(assigned);
  save.career.schedule={season:save.career.season,clubId:current.id,squadLevel:save.career.squadLevel,weeks:SEASON_WEEKS,generatedAt:Date.now(),fixtures:assigned};
  return save.career.schedule;
}

export function ensureSchedule(save,repo){return generateSeasonSchedule(save,repo)}
export function nextFixture(save,repo,{fromWeek}={}){
  const schedule=ensureSchedule(save,repo),week=Number(fromWeek||save.career.calendar?.week||1);
  return schedule.fixtures.find(f=>!f.played&&f.week>=week)||null;
}
export function fixturesForWeek(save,repo,week=save.career.calendar?.week||1){return ensureSchedule(save,repo).fixtures.filter(f=>!f.played&&f.week===week)}
export function markFixturePlayed(save,fixtureId,result){const fixture=save.career.schedule?.fixtures?.find(f=>f.id===fixtureId);if(fixture){fixture.played=true;fixture.result=result;fixture.playedAt={season:save.career.season,week:save.career.calendar?.week||fixture.week}}return fixture}
export function scheduleStats(save){
  const fixtures=save.career.schedule?.fixtures||[],played=fixtures.filter(f=>f.played),opponents=uniq(fixtures.map(f=>f.opponentId));
  return{total:fixtures.length,played:played.length,remaining:fixtures.length-played.length,differentOpponents:opponents.length,competitions:Object.fromEntries(uniq(fixtures.map(f=>f.competition)).map(name=>[name,fixtures.filter(f=>f.competition===name).length]))};
}
export function upcomingFixtures(save,repo,count=8){const week=save.career.calendar?.week||1;return ensureSchedule(save,repo).fixtures.filter(f=>!f.played&&f.week>=week).slice(0,count)}
export function syncScheduleAfterClubChange(save,repo){
  const completed=(save.career.schedule?.fixtures||[]).filter(f=>f.played);
  const generated=generateSeasonSchedule(save,repo,{force:true});
  generated.fixtures=[...completed,...generated.fixtures.filter(f=>f.week>=(save.career.calendar?.week||1))].sort((a,b)=>a.week-b.week);
  return generated;
}
export {SEASON_WEEKS,COMPETITIONS};
