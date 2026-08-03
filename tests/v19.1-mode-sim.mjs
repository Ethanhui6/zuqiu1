import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {makeSave,repo} from './v19.1-test-fixture.mjs';
import {advanceToSeasonEnd,acknowledgeEventDecision,acknowledgeMatchDecision} from '../src/systems/career/timeAdvanceSystem.js';
import {resolveEventChoice} from '../src/systems/event/eventEngine.js';
import {resolveMatch} from '../src/systems/match/matchSystem.js';
import {respondOffer,availableOfferActions} from '../src/systems/transfer/transferSystem.js';
import {ensureGameClock} from '../src/systems/career/gameClock.js';
import {daysBetween} from '../src/utils/gameDate.js';

const modes=['immersive','standard','fast','legend'];
const results=[];

function rejectPendingOffers(save){
  for(const offer of [...(save.career.pending.offers||[])]){
    const actions=availableOfferActions(save,offer);
    if(actions.includes('reject'))respondOffer(save,repo,offer.id,'reject');
  }
}

async function simulateMode(mode){
  const save=makeSave({seed:`mode-${mode}`,date:'2026-08-03',pace:mode});
  save.settings.pace.speed='turbo';save.settings.pace.autoTraining=true;save.settings.pace.autoMatch=true;
  for(const key of Object.keys(save.settings.pace.autoPause))save.settings.pace.autoPause[key]=false;
  const startSeason=save.career.season,startDate=ensureGameClock(save).currentDate,start=performance.now();
  let pauses=0,interactiveMatches=0,events=0,majorNodes=0,guard=0;
  const eventIds=[],fingerprints=[],opponents=new Set(),rankHistory=[];
  while(save.career.season<startSeason+3&&guard<800){
    guard++;
    const result=await advanceToSeasonEnd(save,repo);
    for(const item of result.log||[]){
      if(item.type==='match'){opponents.add(item.opponent);}
      if(item.type==='event'){events++;eventIds.push(item.id);fingerprints.push(`${item.category}|${item.choice}|${item.outcome}`)}
      if(item.type==='node')majorNodes++;
    }
    rankHistory.push(save.career.squadCompetition?.rank||0);
    if(result.status==='paused'){
      pauses++;
      if(result.reason==='event'&&save.career.pending.event){
        const event=save.career.pending.event,choice=event.choices[0];events++;eventIds.push(event.id);fingerprints.push(event.fingerprint||`${event.category}|${choice?.style||choice?.text}`);resolveEventChoice(save,choice.id);acknowledgeEventDecision(save);
      }else if(result.reason==='match'&&save.career.pending.match){
        interactiveMatches++;const match=save.career.pending.match;resolveMatch(save,repo,match.keyChoices[0]?.id,{presentation:'interactive'});acknowledgeMatchDecision(save);
      }else if(result.reason==='transfer')rejectPendingOffers(save);
      else if(result.reason==='training'){save.settings.pace.autoTraining=true;}
      else if(result.reason==='paused'){save.settings.pace.speed='turbo';}
    }
  }
  assert.ok(guard<800,`${mode}模式模拟未能结束`);
  assert.equal(save.career.season,startSeason+3,`${mode}模式未完成3个赛季`);
  const history=save.career.matchHistory||[],uniqueEvents=new Set(eventIds.filter(Boolean)),uniqueFingerprints=new Set(fingerprints.filter(Boolean));
  return{
    mode,startDate,endDate:ensureGameClock(save).currentDate,actualDays:daysBetween(startDate,ensureGameClock(save).currentDate),
    pauses,matches:history.length,interactiveMatches,events,uniqueEventRatio:events?Number((uniqueEvents.size/events).toFixed(3)):1,
    fingerprintRepeatRate:fingerprints.length?Number((1-uniqueFingerprints.size/fingerprints.length).toFixed(3)):0,
    objectiveCycles:save.career.objectives?.cycleId||0,squadRankChanges:rankHistory.slice(1).filter((rank,index)=>rank!==rankHistory[index]).length,
    transfers:save.career.transferHistory?.length||0,traits:save.career.traits?.unlocked?.length||0,majorNodes,
    differentOpponents:new Set(history.map(item=>item.opponentId)).size,elapsedMs:Number((performance.now()-start).toFixed(1)),errors:0
  };
}

for(const mode of modes)results.push(await simulateMode(mode));
const immersive=results.find(x=>x.mode==='immersive'),fast=results.find(x=>x.mode==='fast'),legend=results.find(x=>x.mode==='legend');
assert.ok(immersive.pauses>fast.pauses,'沉浸模式应比快速模式拥有更多暂停');
assert.ok(immersive.pauses>legend.pauses,'沉浸模式应比传奇速通拥有更多暂停');
assert.ok(results.every(item=>item.matches>50),'每种模式都应完成足够比赛');
assert.ok(results.every(item=>item.differentOpponents>=12),'每种模式应拥有足够不同对手');
console.log(JSON.stringify({status:'PASS',results},null,2));
