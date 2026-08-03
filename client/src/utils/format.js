export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const round=(n,d=0)=>Number(Number(n||0).toFixed(d));
export const formatNumber=n=>new Intl.NumberFormat('zh-CN',{notation:Math.abs(Number(n||0))>=1000000?'compact':'standard',maximumFractionDigits:1}).format(Number(n||0));
export function formatMoney(n){
  n=Number(n||0);if(!Number.isFinite(n))n=0;
  if(n>=1e8)return `€${(n/1e8).toFixed(2)}亿`;
  if(n>=1e4)return `€${(n/1e4).toFixed(n<1e6?1:0)}万`;
  return `€${Math.round(n).toLocaleString('zh-CN')}`;
}
export const formatCurrency=formatMoney;
export const percent=n=>`${Math.round(Number(n)||0)}%`;
export const dateLabel=(year,month)=>`${Number(year)||0}年 · 第${Number(month)||0}阶段`;
export function formatLocalDate(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
  if(!match)return'日期未设置';
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}
export const formatDate=formatLocalDate;
export function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
export function safeText(value,fallback='—'){
  if(value===undefined||value===null||value==='')return fallback;
  if(typeof value==='number')return Number.isFinite(value)?String(value):fallback;
  if(typeof value==='string'||typeof value==='boolean')return String(value);
  if(Array.isArray(value))return value.map(item=>safeText(item,'')).filter(Boolean).join('、')||fallback;
  if(typeof value==='object')return Object.entries(value).map(([key,item])=>`${formatStatLabel(key)}：${safeText(item)}`).join(' · ')||fallback;
  return fallback;
}
const LABELS={injuryRisk:'受伤风险',coachTrust:'教练信任',relationship:'人际关系',morale:'士气',fitness:'体能',fatigue:'疲劳',reputation:'声望',matchRating:'比赛评分',transferInterest:'转会关注',totalScore:'游戏评分',grade:'生涯等级',verificationStatus:'验证状态',xp:'成长经验',fans:'球迷支持',fame:'公众关注',money:'资金',trust:'信任',respect:'尊重',conflict:'矛盾',potential:'潜力',ovr:'综合能力',weeklyWage:'周薪',probability:'成交概率'};
export function formatStatLabel(key){return LABELS[String(key||'')]||'其他数据'}
export function formatStatValue(value){return safeText(value)}
export function formatEffectList(value){
  if(Array.isArray(value))return value.map(item=>safeText(item)).filter(Boolean).join('、')||'暂无变化';
  if(value&&typeof value==='object')return Object.entries(value).filter(([,item])=>Number(item)!==0&&item!==''&&item!==null&&item!==undefined).map(([key,item])=>`${formatStatLabel(key)} ${formatStatValue(item)}`).join('、')||'暂无变化';
  return safeText(value,'暂无变化');
}
export function formatClubName(club){return safeText(club?.cn||club?.name||club,'未知俱乐部')}
export function formatPercentage(value){const number=Number(value);return `${Math.round(Number.isFinite(number)?number:0)}%`}
const TRANSFER_STATUS={pending:'等待决定',accepted:'已接受',rejected:'已拒绝',deferred:'已暂缓',expired:'已过期',negotiating:'谈判中',withdrawn:'已撤回',loan:'租借方案',review:'等待审核'};
export function formatTransferStatus(value){return TRANSFER_STATUS[value]||safeText(value,'等待决定')}
