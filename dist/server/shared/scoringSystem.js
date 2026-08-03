export const SCORE_VERSION='18.8.0-1';

const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const whole=(value,fallback=0)=>Math.max(0,Math.round(finite(value,fallback)));
const bounded=(value,min,max)=>Math.max(min,Math.min(max,finite(value,min)));
const cap=(value,max)=>Math.max(0,Math.min(max,Math.round(finite(value))));
const ratio=(value,target)=>Math.max(0,Math.min(1,finite(value)/Math.max(1,target)));
const shortText=(value,fallback='—',max=40)=>{
  const output=String(value??'').trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,max);
  return output||fallback;
};

const POSITION_GROUPS={
  forward:new Set(['ST','SS','LW','RW']),
  midfield:new Set(['CAM','CM','CDM']),
  defense:new Set(['CB','LB','RB']),
  keeper:new Set(['GK'])
};

export function positionGroup(position){
  return Object.entries(POSITION_GROUPS).find(([,positions])=>positions.has(String(position)))?.[0]||'forward';
}

export function buildScoreEvidence(save,clubName='未知俱乐部'){
  const career=save?.career||{},stats=career.careerStats||{},fans=save?.fans||{},player=save?.player||{};
  const seasonHistory=(career.history||[]).filter(item=>item?.type==='season').length;
  const hiddenAchievements=(save?.achievements?.unlocked||[]).filter(id=>String(id).includes('hidden')||String(id).includes('secret')).length;
  const records=career.records&&typeof career.records==='object'?Object.values(career.records).filter(Boolean).length:0;
  const individualAwards=(career.trophies||[]).filter(item=>/金球|最佳|金靴|MVP|先生|门将/.test(String(item?.name||item))).length;
  const difficulty=String(save?.settings?.pace?.mode||'standard');
  return{
    scoreVersion:SCORE_VERSION,
    gameVersion:shortText(save?.gameVersion,'未知版本',24),
    createdAt:whole(save?.createdAt),updatedAt:whole(save?.updatedAt),
    difficulty,
    player:{
      name:shortText(player.name,'未命名球员',24),displayName:shortText(player.displayName||player.name,'未命名球员',24),
      nation:shortText(player.nation,'未知',24),position:shortText(player.position,'ST',6),age:whole(player.age,17),
      ovr:whole(player.ovr,30),peakOvr:whole(career.records?.peakOvr||player.ovr,30),initialOvr:whole(save?.meta?.initialOvr||62,30),potential:whole(player.potential,60),
      avatar:shortText(player.avatar||'', '',160)
    },
    career:{
      season:whole(career.season,1),seasonsCompleted:Math.max(seasonHistory,whole(career.season,1)-1),absoluteWeek:whole(career.calendar?.absoluteWeek,1),
      squadLevel:shortText(career.squadLevel,'青年队',24),teamRole:shortText(career.teamRole,'球员',24),clubName:shortText(clubName,'未知俱乐部',36),clubId:shortText(career.clubId,'',40),
      clubs:Math.max(1,new Set(career.clubHistory||[career.clubId]).size),transfers:whole(career.transferHistory?.length),trophies:whole(career.trophies?.length),
      individualAwards,records,hiddenAchievements,lowLeagueStart:Boolean(save?.meta?.lowLeagueStart),ending:career.retirement?shortText(career.retirement.name,'职业生涯结束',36):'',
      stats:{apps:whole(stats.apps),goals:whole(stats.goals),assists:whole(stats.assists),cleanSheets:whole(stats.cleanSheets),titles:whole(stats.titles),nationalApps:whole(stats.nationalApps),nationalGoals:whole(stats.nationalGoals),bestRating:bounded(stats.bestRating,0,10),hatTricks:whole(stats.hatTricks),bigGames:whole(stats.bigGames),saves:whole(stats.saves),tackles:whole(stats.tackles)}
    },
    achievements:{unlocked:whole(save?.achievements?.unlocked?.length),points:whole(save?.achievements?.score)},
    fans:{local:whole(fans.local),club:whole(fans.club),global:whole(fans.global),social:whole(fans.social),commercialValue:bounded(fans.commercialValue,0,100)},
    finance:{marketValue:whole(save?.finance?.marketValue)}
  };
}

function personalPerformance(evidence){
  const stats=evidence.career.stats,apps=Math.max(1,stats.apps),group=positionGroup(evidence.player.position);
  const base=ratio(stats.apps,700)*620+ratio(stats.bestRating,9.2)*420;
  const output={
    forward:ratio(stats.goals/apps,.75)*980+ratio(stats.assists/apps,.35)*480+ratio(stats.hatTricks,35)*300,
    midfield:ratio(stats.assists/apps,.5)*760+ratio(stats.goals/apps,.28)*430+ratio(stats.tackles/apps,2.2)*490+ratio(stats.bigGames,90)*80,
    defense:ratio(stats.cleanSheets/apps,.42)*680+ratio(stats.tackles/apps,3.2)*870+ratio(stats.assists/apps,.18)*240+ratio(stats.goals/apps,.1)*110,
    keeper:ratio(stats.cleanSheets/apps,.44)*720+ratio(stats.saves/apps,3.9)*1040+ratio(stats.bigGames,90)*220
  }[group];
  return cap(base+output,2800);
}

export function calculateCareerScore(input){
  const evidence=input?.player?input:buildScoreEvidence(input),stats=evidence.career.stats;
  const personal=personalPerformance(evidence);
  const teamHonours=cap(stats.titles*105+evidence.career.trophies*62,1200);
  const individualAwards=cap(evidence.career.individualAwards*115+stats.hatTricks*2,700);
  const nationalTeam=cap(ratio(stats.nationalApps,130)*430+ratio(stats.nationalGoals,70)*270+(stats.nationalApps>=80?100:0),800);
  const records=cap(evidence.career.records*82+ratio(stats.goals+stats.assists+stats.cleanSheets,700)*170,500);
  const keyMatches=cap(ratio(stats.bigGames,120)*340+ratio(stats.bestRating,9.5)*160,500);
  const longevity=cap(ratio(evidence.career.seasonsCompleted,20)*420+ratio(stats.apps,850)*180,600);
  const stability=cap(ratio(stats.apps/Math.max(1,evidence.career.seasonsCompleted),42)*230+ratio(stats.bestRating,9)*180+(evidence.player.peakOvr>=85?90:0),500);
  const difficultyFactor={immersive:1,standard:.78,fast:.62,legend:.92,legendary:.95}[evidence.difficulty]??.72;
  const difficulty=cap(500*difficultyFactor,500);
  const growth=Math.max(0,evidence.player.peakOvr-evidence.player.initialOvr);
  const comeback=cap(ratio(growth,30)*300+(evidence.career.lowLeagueStart?140:0)+(evidence.player.initialOvr<=60?60:0),500);
  const hidden=cap(evidence.career.hiddenAchievements*150+ratio(evidence.achievements.points,5000)*150,600);
  const oneClub=evidence.career.clubs===1&&evidence.career.seasonsCompleted>=10;
  const route=cap((oneClub?280:0)+(evidence.career.lowLeagueStart?220:0)+(stats.nationalApps>=100?170:0)+(evidence.career.ending?80:0)+ratio(evidence.achievements.unlocked,120)*50,800);
  const breakdown={personal,teamHonours,individualAwards,nationalTeam,records,keyMatches,longevity,stability,difficulty,comeback,hidden,route};
  const total=cap(Object.values(breakdown).reduce((sum,value)=>sum+value,0),10000);
  return{
    total,grade:scoreGrade(total,evidence),
    breakdown:{...breakdown,performance:personal,honours:teamHonours+individualAwards,development:comeback,influence:nationalTeam+route,achievements:hidden+records,endingBonus:evidence.career.ending?80:0}
  };
}

export function scoreGrade(score,evidence=null){
  const value=cap(score,10000);
  const rare=evidence&&value>=9400&&evidence.career.seasonsCompleted>=12&&evidence.career.stats.titles>=8&&evidence.career.individualAwards>=4&&evidence.career.stats.bigGames>=45&&evidence.career.hiddenAchievements>=2;
  if(rare)return'SSS';
  if(value>=8400)return'SS';
  if(value>=7000)return'S';
  if(value>=5500)return'A';
  if(value>=4000)return'B';
  if(value>=2400)return'C';
  return'D';
}

export function validateScoreEvidence(evidence,{initial=false}={}){
  const errors=[];
  if(!evidence||typeof evidence!=='object')return{ok:false,errors:['缺少计分证据']};
  const player=evidence.player||{},career=evidence.career||{},stats=career.stats||{},achievements=evidence.achievements||{},fans=evidence.fans||{},finance=evidence.finance||{};
  const range=(value,min,max,label)=>{if(!Number.isFinite(Number(value))||Number(value)<min||Number(value)>max)errors.push(`${label}超出允许范围`)};
  if(evidence.scoreVersion!==SCORE_VERSION)errors.push('计分版本不匹配');
  if(!String(player.name||'').trim()||String(player.name).length>24)errors.push('球员名称无效');
  if(!/^(GK|LB|CB|RB|CDM|CM|CAM|LW|RW|SS|ST)$/.test(String(player.position||'')))errors.push('位置代码无效');
  range(player.age,16,50,'年龄');range(player.ovr,30,99,'综合能力');range(player.potential,60,99,'潜力');
  range(career.season,1,25,'赛季');range(career.seasonsCompleted,0,24,'已完成赛季');range(career.absoluteWeek,1,1200,'职业周数');range(career.clubs,1,40,'效力球队');range(career.transfers,0,40,'转会次数');range(career.trophies,0,140,'奖杯数');
  range(stats.apps,0,1500,'出场数');range(stats.goals,0,3000,'进球数');range(stats.assists,0,3000,'助攻数');range(stats.cleanSheets,0,1500,'零封数');range(stats.titles,0,140,'冠军数');range(stats.nationalApps,0,400,'国家队出场');range(stats.nationalGoals,0,500,'国家队进球');range(stats.bestRating,0,10,'最高评分');range(stats.hatTricks,0,600,'帽子戏法');range(stats.bigGames,0,1500,'关键比赛');range(stats.saves,0,30000,'扑救数');range(stats.tackles,0,30000,'抢断数');
  range(achievements.unlocked,0,330,'成就数');range(achievements.points,0,100000,'成就分');
  for(const [key,value] of Object.entries(fans))range(value,0,key==='commercialValue'?100:2500000000,`粉丝.${key}`);
  range(finance.marketValue,0,1500000000,'身价');
  const seasons=Math.max(1,Number(career.seasonsCompleted)||1),apps=Number(stats.apps)||0;
  if(apps>seasons*62+45)errors.push('出场增长不符合赛季上限');
  if((Number(stats.goals)||0)>apps*3+12)errors.push('进球数与出场数不一致');
  if((Number(stats.assists)||0)>apps*3+12)errors.push('助攻数与出场数不一致');
  if((Number(stats.cleanSheets)||0)>apps+12)errors.push('零封数与出场数不一致');
  if(Number(career.seasonsCompleted)>Number(career.season))errors.push('赛季进度不一致');
  if(initial&&(Number(career.season)!==1||apps!==0||Number(career.seasonsCompleted)!==0))errors.push('运行会话不是从新生涯起点建立');
  return{ok:errors.length===0,errors};
}

export function stableEvidenceHash(evidence){
  const input=JSON.stringify(evidence);let hash=2166136261>>>0;
  for(let index=0;index<input.length;index++){hash^=input.charCodeAt(index);hash=Math.imul(hash,16777619)>>>0}
  return hash.toString(16).padStart(8,'0');
}
