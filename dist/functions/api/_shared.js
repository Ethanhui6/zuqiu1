import {D1LeaderboardRepository} from '../../server/database/d1LeaderboardRepository.js';
import {LeaderboardError} from '../../server/leaderboard/leaderboardService.js';

export const repository=env=>new D1LeaderboardRepository(env.DB);
export async function bodyOf(request){try{return await request.json()}catch{throw new LeaderboardError('请求体不是有效 JSON',400)}}
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export function failure(error){
  console.error('leaderboard-api',error);
  if(error instanceof LeaderboardError)return json({error:error.message,details:error.details},error.status);
  if(String(error?.message||'').includes('D1'))return json({error:'世界榜数据库尚未配置'},503);
  return json({error:'排行榜服务暂时不可用'},500);
}

