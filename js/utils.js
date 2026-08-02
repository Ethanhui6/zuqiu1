'use strict';
const U={
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  avg:a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,
  esc:s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])),
  hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0},
  rng(seed){let x=(typeof seed==='number'?seed:U.hash(seed))||1;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}},
  pick(a,r=Math.random){return a[Math.floor(r()*a.length)]},
  weighted(items,r=Math.random){const total=items.reduce((s,x)=>s+x.w,0);let n=r()*total;for(const x of items){n-=x.w;if(n<=0)return x}return items.at(-1)},
  money(n){if(n>=1e8)return `€${(n/1e8).toFixed(2)}亿`;if(n>=1e4)return `€${Math.round(n/1e4)}万`;return `€${Math.round(n)}`},
  season(y){return `${String(y).slice(-2)}/${String(y+1).slice(-2)}`},
  uid(){return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`},
  debounce(fn,ms=120){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}},
  wait:ms=>new Promise(r=>setTimeout(r,ms)),
  seededShuffle(a,seed){const r=U.rng(seed),b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
};
