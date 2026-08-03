import {el} from '../utils/dom.js';
const PLACEHOLDER='./assets/crests/placeholder.svg';

function localCrestPath(club){
  const path=club?.crestPath||club?.crest||'';
  return typeof path==='string'&&path.startsWith('./assets/crests/')?path:PLACEHOLDER;
}

export function createClubCrest(club,{size='normal',decorative=false}={}){
  const className=`club-crest club-crest--${size}`;
  const img=el('img',{className,attrs:{src:localCrestPath(club),alt:decorative?'':`${club?.cn||'俱乐部'}队徽`,width:size==='large'?72:size==='small'?44:56,height:size==='large'?72:size==='small'?44:56,loading:'lazy',decoding:'async'}});
  img.dataset.fallback='0';
  img.addEventListener('error',()=>{
    if(img.dataset.fallback==='1')return;
    img.dataset.fallback='1';img.src=PLACEHOLDER;img.alt=decorative?'':'俱乐部队徽占位图';
  });
  return img;
}
