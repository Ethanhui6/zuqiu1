import {bodyOf,failure,json,repository} from '../_shared.js';
import {createRunSession} from '../../../server/leaderboard/leaderboardService.js';
export async function onRequestPost({request,env}){try{return json(await createRunSession(repository(env),await bodyOf(request)),201)}catch(error){return failure(error)}}

