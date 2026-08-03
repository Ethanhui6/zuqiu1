import assert from 'node:assert/strict';
import {MemoryLeaderboardRepository} from '../server/database/memoryLeaderboardRepository.js';
import {createRunSession,checkpointRun,listLeaderboard,submitRun} from '../server/leaderboard/leaderboardService.js';
import {SCORE_VERSION,stableEvidenceHash} from '../src/systems/scoring/scoringSystem.js';

const initial={scoreVersion:SCORE_VERSION,gameVersion:'18.8.0',createdAt:1000,updatedAt:1000,player:{name:'测试球员',nation:'中国',position:'ST',age:17,ovr:62,potential:86},career:{season:1,seasonsCompleted:0,absoluteWeek:1,squadLevel:'18岁以下青年队',teamRole:'新人',clubName:'测试足球俱乐部',clubs:1,transfers:0,trophies:0,ending:'',stats:{apps:0,goals:0,assists:0,cleanSheets:0,titles:0,nationalApps:0,nationalGoals:0,bestRating:0,hatTricks:0,bigGames:0,saves:0,tackles:0}},achievements:{unlocked:0,points:0},fans:{local:300,club:500,global:0,social:250,commercialValue:1},finance:{marketValue:120000}};
const repo=new MemoryLeaderboardRepository(),session=await createRunSession(repo,{playerKey:'player-test',seedHash:'seed-test',evidence:initial,evidenceHash:stableEvidenceHash(initial)},{now:1000,id:'run-test'});
assert.equal(session.eligible,true);
const progressed=structuredClone(initial);Object.assign(progressed,{updatedAt:2000});Object.assign(progressed.career,{absoluteWeek:2});Object.assign(progressed.career.stats,{apps:1,goals:1,bestRating:7.8});Object.assign(progressed.player,{ovr:63});
await checkpointRun(repo,{runId:'run-test',sequence:1,reason:'career-advanced',evidence:progressed,evidenceHash:stableEvidenceHash(progressed)},{now:2000});
const submission=await submitRun(repo,{runId:'run-test',evidence:progressed,evidenceHash:stableEvidenceHash(progressed)},{now:3000,id:'entry-test'});
assert.equal(submission.verified,true);assert.ok(submission.score>0);
const board=await listLeaderboard(repo,50);assert.equal(board.entries.length,1);assert.equal(board.entries[0].player_name,'测试球员');
const old=structuredClone(initial);old.career.season=4;old.career.seasonsCompleted=3;old.career.stats.apps=100;old.career.absoluteWeek=121;
const oldSession=await createRunSession(repo,{playerKey:'player-old',seedHash:'seed-old',evidence:old,evidenceHash:stableEvidenceHash(old)},{now:4000,id:'run-old'});assert.equal(oldSession.eligible,false);
const cheater=structuredClone(initial);cheater.career.stats.apps=1;cheater.career.stats.goals=999;
await assert.rejects(()=>createRunSession(repo,{playerKey:'player-bad',seedHash:'seed-bad',evidence:cheater,evidenceHash:stableEvidenceHash(cheater)}));
console.log(JSON.stringify({status:'PASS',verifiedScore:submission.score,worldEntries:board.entries.length,oldSaveEligible:oldSession.eligible,forgedStatsRejected:true},null,2));
