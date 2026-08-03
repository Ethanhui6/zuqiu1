export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const round=(n,d=0)=>Number(Number(n||0).toFixed(d));
export const formatNumber=n=>new Intl.NumberFormat('zh-CN',{notation:Math.abs(n)>=1000000?'compact':'standard',maximumFractionDigits:1}).format(Number(n||0));
export function formatMoney(n){
  n=Number(n||0);if(n>=1e8)return `€${(n/1e8).toFixed(2)}亿`;if(n>=1e4)return `€${(n/1e4).toFixed(n<1e6?1:0)}万`;return `€${Math.round(n).toLocaleString('zh-CN')}`;
}
export const percent=n=>`${Math.round(n)}%`;
export const dateLabel=(year,month)=>`${year}年 · 第${month}阶段`;
export function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
