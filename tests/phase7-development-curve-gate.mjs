import assert from 'node:assert/strict';
import { applySeasonDevelopment, DEVELOPMENT_PROFILES } from '../src/core/playerDevelopmentEngine.js';
import { createDefaultState } from '../src/core/store.js';

const specs={
  high:{position:'CM',profile:'wonderkid',potential:index=>90+index%7,rating:(age,index)=>7.35+(index%8)*.07,minutes:(age,index)=>1900+(index%9)*90},
  mid:{position:'CM',profile:'balanced',potential:index=>78+index%9,rating:(age,index)=>6.9+(index%7)*.07,minutes:(age,index)=>1450+(index%10)*95},
  low:{position:'CM',profile:'plateau',potential:index=>68+index%8,rating:(age,index)=>6.55+(index%6)*.06,minutes:(age,index)=>900+(index%10)*75},
  late:{position:'CM',profile:'late-bloomer',potential:index=>82+index%9,rating:(age,index)=>(age<21?6.65:7.2)+(index%7)*.06,minutes:(age,index)=>(age<21?950:1850)+(index%8)*85},
  keeper:{position:'GK',profile:'balanced',potential:index=>82+index%9,rating:(age,index)=>6.9+(index%7)*.065,minutes:(age,index)=>1350+(index%10)*100}
};

function career(kind,index,overrides={}){
  const spec=specs[kind],state=createDefaultState(),start=56+index%5;
  state.player={name:`${kind}-${index}`,position:spec.position,style:spec.position==='GK'?'清道夫门将':'全能中场',age:16,potential:spec.potential(index),dynamicPotential:spec.potential(index),developmentProfile:overrides.profile||spec.profile,stats:{speed:start,shooting:start,passing:start,dribbling:start,defending:start,physical:start},fatigue:12,fitness:90,morale:64+index%20,coachTrust:50+index%35};
  state.career.growthLog=[];state.training.facilityLevel=1+index%5;
  const snapshots=[{age:16,ovr:start,dynamicPotential:state.player.dynamicPotential}];
  for(let age=16;age<36;age++){
    state.player.age=age;state.season.minutes=spec.minutes(age,index);state.season.rating=spec.rating(age,index);state.season.injuryAbsences=Number(overrides.injuryAbsences?.(age,index)||0);state.training.seasonTrainingCount=1+index%3;
    applySeasonDevelopment(state,{leagueLevel:1+index%5,...overrides.context?.(age,index)});
    snapshots.push({age:age+1,ovr:state.player.ovr,dynamicPotential:state.player.dynamicPotential});
  }
  const peak=Math.max(...snapshots.map(item=>item.ovr)),peakAge=snapshots.find(item=>item.ovr===peak).age;
  return{kind,index,start:snapshots[0].ovr,peak,peakAge,final:snapshots.at(-1).ovr,snapshots,state};
}

const groups=Object.fromEntries(Object.keys(specs).map(kind=>[kind,Array.from({length:100},(_,index)=>career(kind,index))]));
const median=(items,key)=>items.map(item=>item[key]).sort((a,b)=>a-b)[Math.floor(items.length/2)];
const summary=Object.fromEntries(Object.entries(groups).map(([kind,items])=>[kind,{start:median(items,'start'),peak:median(items,'peak'),peakAge:median(items,'peakAge'),final:median(items,'final'),uniquePeaks:new Set(items.map(item=>item.peak)).size}]));

for(const [kind,items] of Object.entries(groups)){
  assert.equal(items.length,100);
  assert.ok(items.every(item=>item.peak>item.start),`${kind} must grow before peaking`);
  assert.ok(items.every(item=>item.final<item.peak),`${kind} must decline after peaking`);
  assert.ok(items.every(item=>item.snapshots.every(row=>Number.isFinite(row.ovr)&&row.ovr>=1&&row.ovr<=100)),`${kind} produced invalid OVR`);
  assert.ok(new Set(items.map(item=>item.snapshots.map(row=>row.ovr).join(','))).size>=60,`${kind} trajectories lack differentiation`);
}

assert.ok(summary.high.peak>=summary.mid.peak+5,JSON.stringify(summary));
assert.ok(summary.mid.peak>=summary.low.peak+4,JSON.stringify(summary));
assert.ok(summary.high.peakAge>=23&&summary.high.peakAge<=30,JSON.stringify(summary.high));
assert.ok(summary.mid.peakAge>=24&&summary.mid.peakAge<=31,JSON.stringify(summary.mid));
assert.ok(summary.late.peakAge>=27&&summary.late.peakAge>summary.mid.peakAge,JSON.stringify(summary.late));
assert.ok(summary.keeper.peakAge>=29&&summary.keeper.peakAge>summary.mid.peakAge,JSON.stringify(summary.keeper));
assert.ok(summary.high.peak-summary.high.final>=3,JSON.stringify(summary.high));
assert.ok(summary.keeper.peak-summary.keeper.final>=1,JSON.stringify(summary.keeper));

const profiles=['wonderkid','late-bloomer','early-peak','plateau','injury-setback','career-revival'];
for(const profile of profiles)assert.ok(DEVELOPMENT_PROFILES.has(profile));
const baseline=career('mid',98),early=career('mid',98,{profile:'early-peak'}),plateau=career('mid',98,{profile:'plateau'}),wonderkid=career('mid',98,{profile:'wonderkid'});
const injured=career('mid',97,{profile:'injury-setback',injuryAbsences:age=>age>=22&&age<=27?8:0});
const revival=career('mid',96,{profile:'career-revival',context:age=>age>=29&&age<=32?{rating:7.8,minutes:2400}:{}});
assert.ok(wonderkid.snapshots.find(item=>item.age===22).ovr>baseline.snapshots.find(item=>item.age===22).ovr,'wonderkid must separate early');
assert.ok(early.peakAge<=baseline.peakAge,'early peak must not peak later than balanced');
assert.ok(plateau.peak-baseline.peak<=1,'plateau must suppress mature growth');
assert.ok(injured.final<baseline.final,'injury setback must reduce the career outcome');
assert.ok(revival.snapshots.find(item=>item.age===33).ovr>=revival.snapshots.find(item=>item.age===29).ovr,'career revival must interrupt late decline');

function oneSeason(style,context={}){
  const state=createDefaultState();
  state.player={name:'factor-control',position:'CM',style,age:19,potential:86,dynamicPotential:84,developmentProfile:'balanced',stats:{speed:64,shooting:64,passing:64,dribbling:64,defending:64,physical:64},morale:context.morale??70,coachTrust:context.coach??60};
  state.career.growthLog=[];state.season={...state.season,minutes:context.minutes??1800,rating:context.rating??7.1,injuryAbsences:context.injuryAbsences??0};state.training.seasonTrainingCount=context.training??2;
  return applySeasonDevelopment(state,context);
}
const strong=oneSeason('全能中场',{minutes:2600,rating:7.9,training:3,leagueLevel:5,facility:92,coach:88,morale:86}),weak=oneSeason('全能中场',{minutes:300,rating:6.1,training:0,leagueLevel:1,facility:52,coach:38,morale:35,injuryAbsences:8});
assert.ok(strong.overallChange>weak.overallChange,'minutes, performance, training, league, facility, coach, morale and injury must affect growth');
assert.ok(strong.dynamicPotential>weak.dynamicPotential,'dynamic potential must respond to performance and availability');
const finisher=oneSeason('禁区终结者'),playmaker=oneSeason('组织核心');
assert.ok(finisher.changes.shooting>finisher.changes.passing,'finisher style must favor shooting');
assert.ok(playmaker.changes.passing>playmaker.changes.shooting,'playmaker style must favor passing');

console.log(JSON.stringify({status:'PASS',players:Object.values(groups).flat().length,ages:'16-36',summary,profiles:[...DEVELOPMENT_PROFILES]},null,2));
