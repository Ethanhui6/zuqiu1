import assert from 'node:assert/strict';
import {MemoryLeaderboardRepository} from '../server/database/memoryLeaderboardRepository.js';
import {checkpoint,finishRun,listWorldLeaderboard,startRun,submitAction} from '../server/authority/authorityService.js';
import {CONFIG_VERSION,GAME_VERSION} from '../server/authority/authoritativeEngine.js';
import {scoreGrade} from '../src/systems/scoring/scoringSystem.js';

const rareEvidence={career:{seasonsCompleted:14,individualAwards:5,hiddenAchievements:3,stats:{titles:9,bigGames:60}}};
assert.equal(scoreGrade(9800,null),'SS','仅靠分数不得获得SSS');assert.equal(scoreGrade(9800,rareEvidence),'SSS','满足稀有条件后才允许SSS');

const base={userId:'user-authority-test',gameVersion:GAME_VERSION,configVersion:CONFIG_VERSION,difficulty:'standard',profile:{name:'权威测试球员',publicNickname:'测试玩家',nation:'中国',position:'GK',ovr:62,potential:88,clubName:'测试青训队'}};
const actionBody=(session,sequence,nonce,action,stateHash=session.stateHash)=>({runId:session.runId,sessionToken:session.sessionToken,sequence,nonce,stateHash,gameVersion:GAME_VERSION,configVersion:CONFIG_VERSION,action:{actionId:`action-${nonce}`,...action}});

const repo=new MemoryLeaderboardRepository(),session=await startRun(repo,base,{now:1000,runId:'run-authority-valid',serverSeed:'server-seed-valid',sessionToken:'session-token-valid'});
let confirmed=await submitAction(repo,actionBody(session,1,'nonce-training',{type:'training',payload:{focus:'technique'}}),{now:2000});
Object.assign(session,{stateHash:confirmed.stateHash});assert.equal(confirmed.result.type,'training');
confirmed=await submitAction(repo,actionBody(session,2,'nonce-match',{type:'match',payload:{mode:'interactive'}}),{now:3000});
Object.assign(session,{stateHash:confirmed.stateHash});assert.equal(confirmed.result.type,'match');assert.ok(confirmed.result.saves>=2,'门将评分由服务器扑救数据驱动');
confirmed=await submitAction(repo,actionBody(session,3,'nonce-event',{type:'event',payload:{choice:2}}),{now:4000});
Object.assign(session,{stateHash:confirmed.stateHash});assert.equal(confirmed.result.type,'event');
const snap=await checkpoint(repo,{runId:session.runId,sessionToken:session.sessionToken},{now:4500});assert.ok(snap.score>=0&&snap.score<=10000);assert.match(snap.grade,/^(D|C|B|A|S|SS|SSS)$/);
confirmed=await submitAction(repo,actionBody(session,4,'nonce-retire',{type:'retire',payload:{}}),{now:5000});Object.assign(session,{stateHash:confirmed.stateHash});
const finished=await finishRun(repo,{runId:session.runId,sessionToken:session.sessionToken,score:10000,grade:'SSS'},{now:6000});
assert.equal(finished.verified,true);assert.notEqual(finished.score,10000,'客户端分数不会被采用');assert.notEqual(finished.grade,'SSS','客户端伪造评级不会被采用');
const board=await listWorldLeaderboard(repo,{limit:100});assert.equal(board.entries.length,1);assert.equal(board.entries[0].player_name,'权威测试球员');
await assert.rejects(()=>finishRun(repo,{runId:session.runId,sessionToken:session.sessionToken,score:9999,grade:'SSS'},{now:6100}),error=>error.code==='duplicate_finish');

async function malicious(id){return startRun(repo,{...base,userId:`user-${id}`},{now:10000,runId:`run-${id}`,serverSeed:`seed-${id}`,sessionToken:`token-${id}`})}
const scoreRun=await malicious('score');await assert.rejects(()=>submitAction(repo,actionBody(scoreRun,1,'nonce-score',{type:'match',payload:{score:10000}})),error=>error.code==='impossible_state');
const gradeRun=await malicious('grade');await assert.rejects(()=>submitAction(repo,actionBody(gradeRun,1,'nonce-grade',{type:'event',payload:{choice:0,grade:'SSS'}})),error=>error.code==='impossible_state');
const attrRun=await malicious('attribute');await assert.rejects(()=>submitAction(repo,actionBody(attrRun,1,'nonce-attribute',{type:'training',payload:{ovr:99}})),error=>error.code==='impossible_state');
const honourRun=await malicious('honour');await assert.rejects(()=>submitAction(repo,actionBody(honourRun,1,'nonce-honour',{type:'event',payload:{choice:0,honours:99}})),error=>error.code==='impossible_state');
const versionRun=await malicious('version');const wrongVersion=actionBody(versionRun,1,'nonce-version',{type:'training',payload:{}});wrongVersion.gameVersion='99.0.0';await assert.rejects(()=>submitAction(repo,wrongVersion),error=>error.code==='version_mismatch');
const skipRun=await malicious('skip');await assert.rejects(()=>submitAction(repo,actionBody(skipRun,2,'nonce-skip',{type:'training',payload:{}})),error=>error.code==='sequence_invalid');
const stateRun=await malicious('state');await assert.rejects(()=>submitAction(repo,actionBody(stateRun,1,'nonce-state',{type:'training',payload:{}},'forged-state-hash')),error=>error.code==='state_hash_mismatch');
const replayRun=await malicious('replay');const replayFirst=await submitAction(repo,actionBody(replayRun,1,'nonce-replay',{type:'training',payload:{}}));replayRun.stateHash=replayFirst.stateHash;await assert.rejects(()=>submitAction(repo,actionBody(replayRun,2,'nonce-replay',{type:'training',payload:{}})),error=>error.code==='replay');
const duplicateRun=await malicious('duplicate');const duplicateFirst=await submitAction(repo,actionBody(duplicateRun,1,'nonce-duplicate-1',{type:'training',actionId:'same-settlement',payload:{}}));duplicateRun.stateHash=duplicateFirst.stateHash;await assert.rejects(()=>submitAction(repo,{...actionBody(duplicateRun,2,'nonce-duplicate-2',{type:'training',payload:{}}),action:{type:'training',actionId:'same-settlement',payload:{}}}),error=>error.code==='impossible_state');
const concurrentRun=await malicious('concurrent');const concurrentBodyA=actionBody(concurrentRun,1,'nonce-concurrent-a',{type:'training',payload:{}}),concurrentBodyB=actionBody(concurrentRun,1,'nonce-concurrent-b',{type:'training',payload:{}}),concurrent=await Promise.allSettled([submitAction(repo,concurrentBodyA),submitAction(repo,concurrentBodyB)]);assert.equal(concurrent.filter(item=>item.status==='fulfilled').length,1);assert.equal(concurrent.filter(item=>item.status==='rejected').length,1);
const speedRun=await malicious('speedrun');await assert.rejects(()=>submitAction(repo,actionBody(speedRun,1,'nonce-speedrun',{type:'retire',payload:{careerYears:20}})),error=>error.code==='impossible_state');
const rateRun=await malicious('rate');let rateLimited=false;for(let index=0;index<92;index++){try{await submitAction(repo,actionBody(rateRun,2,`nonce-rate-${index}`,{type:'training',payload:{}}))}catch(error){if(error.code==='rate_limited'){rateLimited=true;break}}}assert.equal(rateLimited,true,'API速率限制必须生效');
await assert.rejects(()=>finishRun(repo,{runId:'offline-local-save',sessionToken:'forged-token'}),error=>error.code==='run_missing');
const afterAttacks=await listWorldLeaderboard(repo,{limit:100});assert.equal(afterAttacks.entries.length,1,'异常成绩不得进入正式世界榜');
assert.ok(repo.flags.length>=9,'拒绝动作必须写入反作弊审计标记');

console.log(JSON.stringify({status:'PASS',authoritativeFlow:true,serverScore:finished.score,serverGrade:finished.grade,verifiedEntries:afterAttacks.entries.length,attacksRejected:['localStorage分数','伪造SSS','修改属性','重复提交','重放旧请求','跳过sequence','并发请求','伪造荣誉','伪造版本','速通20年','离线冒充'],auditFlags:repo.flags.length},null,2));
