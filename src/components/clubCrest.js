import {el} from '../utils/dom.js';
const PLACEHOLDER='./assets/crests/placeholder.svg';

export function crestSvg(club,{size=48}={}){
  const label=String(club?.cn||club?.name||club?.id||'FC').trim();
  const safeLabel=label.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const initials=label.replace(/[^\p{L}\p{N}]/gu,'').slice(0,2)||'FC';
  const seed=[...String(club?.id||label)].reduce((sum,char)=>sum+char.codePointAt(0),0);
  const hue=seed%360;
  return `<svg class="club-crest club-crest--fallback" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${safeLabel}队徽"><path fill="hsl(${hue} 45% 34%)" stroke="hsl(${(hue+42)%360} 70% 68%)" stroke-width="3" d="M10 8h44v20c0 14-8 23-22 28C18 51 10 42 10 28Z"/><path fill="none" stroke="currentColor" stroke-width="2" opacity=".45" d="M16 18h32M32 10v38"/><text x="32" y="36" fill="currentColor" font-size="13" font-family="system-ui,sans-serif" font-weight="800" text-anchor="middle">${initials}</text></svg>`;
}

function localCrestPath(club){
  const path=club?.crestPath||club?.crest||'';
  return typeof path==='string'&&path.startsWith('./assets/crests/')?path:PLACEHOLDER;
}

export function createClubCrest(club,{size='normal',decorative=false}={}){
  const className=`club-crest club-crest--${size}`;
  if(localCrestPath(club)===PLACEHOLDER){const fallback=el('span',{className:`${className} club-crest-fallback`,attrs:{'aria-label':decorative?'':`${club?.cn||club?.name||'俱乐部'}队徽`}});fallback.innerHTML=crestSvg(club,{size:size==='large'?72:size==='small'?44:56});return fallback;}
  const img=el('img',{className,attrs:{src:localCrestPath(club),alt:decorative?'':`${club?.cn||'俱乐部'}队徽`,width:size==='large'?72:size==='small'?44:56,height:size==='large'?72:size==='small'?44:56,loading:'lazy',decoding:'async'}});
  img.dataset.fallback='0';
  img.addEventListener('error',()=>{
    if(img.dataset.fallback==='1')return;
    img.dataset.fallback='1';img.src=PLACEHOLDER;img.alt=decorative?'':'俱乐部队徽占位图';
  });
  return img;
}
