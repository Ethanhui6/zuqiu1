export class MemoryLeaderboardRepository{
  constructor(){this.sessions=new Map();this.entries=new Map();this.authorityRuns=new Map();this.runEvents=new Map();this.snapshots=[];this.flags=[];this.reports=[]}
  async createSession(session){this.sessions.set(session.id,structuredClone(session))}
  async getSession(id){const value=this.sessions.get(id);return value?structuredClone(value):null}
  async updateCheckpoint(id,c){const s=this.sessions.get(id);Object.assign(s,{lastSequence:c.sequence,lastEvidence:structuredClone(c.evidence),lastEvidenceHash:c.evidenceHash,lastReason:c.reason,lastCheckpointAt:c.at,status:'tracking'})}
  async rejectSession(id,reason,at){const s=this.sessions.get(id);if(s)Object.assign(s,{status:'rejected',rejectionReason:reason,lastCheckpointAt:at})}
  async completeSession(id,at){const s=this.sessions.get(id);if(s)Object.assign(s,{status:'complete',lastCheckpointAt:at})}
  async upsertEntry(entry){this.entries.set(entry.runId,structuredClone(entry))}
  async listEntries(limit){return[...this.entries.values()].filter(x=>x.verified&&!x.withdrawn&&x.reviewStatus!=='pending').sort((a,b)=>b.score-a.score||a.submittedAt-b.submittedAt).slice(0,limit).map(x=>({run_id:x.runId,player_name:x.playerName,public_nickname:x.publicNickname,nation:x.nation,position:x.position,club_name:x.clubName,score:x.score,grade:x.grade,seasons:x.seasons,ending:x.ending,submitted_at:x.submittedAt,game_version:x.gameVersion,difficulty:x.difficulty}))}
  async createAuthorityRun(run){this.authorityRuns.set(run.id,structuredClone(run));this.runEvents.set(run.id,[])}
  async getAuthorityRun(id){const run=this.authorityRuns.get(id);return run?structuredClone(run):null}
  async hasNonce(runId,nonce){return(this.runEvents.get(runId)||[]).some(event=>event.nonce===nonce)}
  async commitAuthorityAction(previous,{state,stateHash,event,now}){const current=this.authorityRuns.get(previous.id);if(!current||current.sequence!==previous.sequence||current.stateHash!==previous.stateHash||current.status!=='active')return false;Object.assign(current,{state:structuredClone(state),stateHash,sequence:event.sequence,updatedAt:now});this.runEvents.get(previous.id).push(structuredClone(event));return true}
  async addScoreSnapshot(snapshot){this.snapshots.push(structuredClone(snapshot))}
  async addAntiCheatFlag(flag){this.flags.push(structuredClone(flag))}
  async hasBlockingFlags(runId){return this.flags.some(flag=>flag.runId===runId&&['high','critical'].includes(flag.severity)&&!['sequence_invalid','state_hash_mismatch','replay','concurrent_write'].includes(flag.code))}
  async finishAuthorityRun(runId,entry,now){const run=this.authorityRuns.get(runId);if(run)Object.assign(run,{status:'complete',updatedAt:now});this.entries.set(runId,structuredClone(entry))}
  async rankFor(entry){const sorted=[...this.entries.values()].filter(item=>item.verified&&!item.withdrawn&&item.reviewStatus!=='pending').sort((a,b)=>b.score-a.score||a.submittedAt-b.submittedAt);return Math.max(1,sorted.findIndex(item=>item.runId===entry.runId)+1)}
  async listAuthorityEntries({limit=50,offset=0,position='',gameVersion='',difficulty='',category='overall'}={}){return[...this.entries.values()].filter(item=>item.verified&&!item.withdrawn&&item.reviewStatus!=='pending'&&(!position||item.position===position)&&(!gameVersion||item.gameVersion===gameVersion)&&(!difficulty||item.difficulty===difficulty)&&(item.categories||[item.category||'overall']).includes(category)).sort((a,b)=>b.score-a.score||a.submittedAt-b.submittedAt).slice(offset,offset+limit).map((item,index)=>({...structuredClone(item),rank:offset+index+1,userId:undefined}))}
  async withdrawEntry(runId,userId){const entry=this.entries.get(runId);if(!entry||entry.userId!==userId)return false;entry.withdrawn=true;return true}
  async updateEntryPrivacy(runId,userId,privacy){const entry=this.entries.get(runId);if(!entry||entry.userId!==userId)return false;Object.assign(entry,privacy);return true}
  async reportEntry(report){this.reports.push(structuredClone(report))}
}
