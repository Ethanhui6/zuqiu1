import {bodyOf,failure,json,repository} from '../_shared.js';
import {checkpointRun} from '../../../server/leaderboard/leaderboardService.js';
export async function onRequestPost({request,env}){try{return json(await checkpointRun(repository(env),await bodyOf(request)))}catch(error){return failure(error)}}

