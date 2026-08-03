import {bodyOf,failure,json,repository} from './_shared.js';
import {listLeaderboard,submitRun} from '../../server/leaderboard/leaderboardService.js';

export async function onRequestGet({request,env}){try{const limit=new URL(request.url).searchParams.get('limit');return json(await listLeaderboard(repository(env),limit))}catch(error){return failure(error)}}
export async function onRequestPost({request,env}){try{return json(await submitRun(repository(env),await bodyOf(request)),201)}catch(error){return failure(error)}}

