import { icon } from './icons.js';
import { radarChart } from './radar.js';
import { lockPageScroll, unlockPageScroll } from '../utils/scrollLock.js';

export function button(label,{variant='primary',iconName='',attrs=''}={}){ return `<button class="app-button ${variant}" ${attrs}>${iconName?icon(iconName,'sm'):''}<span>${label}</span></button>`; }
export function metric(label,value,{tone='',suffix=''}={}){ const width=Math.max(0,Math.min(100,Number(value)||0)); return `<div class="metric"><div class="metric-head"><span>${label}</span><b>${Math.round(width)}${suffix}</b></div><div class="metric-track"><div class="metric-fill ${tone}" style="width:${width}%"></div></div></div>`; }
export function statGrid(items){ return `<div class="stat-grid">${items.map(([label,value])=>`<div class="stat-cell"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`).join('')}</div>`; }
export function emptyState(title,copy,iconName='hidden'){ return `<div class="empty"><div class="empty-visual">${icon(iconName,'lg')}</div><h3>${title}</h3><p>${copy}</p></div>`; }

export class OverlayManager {
  constructor(root){ this.root=root; this.active=null; this.startY=0; this.escapeHandler=null; this.lastFocus=null; this.closeCallbacks=new Set(); this.locked=false; }
  onClose(callback){ if(typeof callback==='function')this.closeCallbacks.add(callback); return callback; }
  close(){ if(!this.active)return; const el=this.active; const focus=this.lastFocus; if(this.escapeHandler)document.removeEventListener('keydown',this.escapeHandler); this.escapeHandler=null; this.closeCallbacks.forEach(callback=>{try{callback()}catch{}}); this.closeCallbacks.clear(); if(this.locked){unlockPageScroll();this.locked=false;} document.body.classList.remove('has-open-sheet'); this.active=null; el.style.opacity='0'; el.remove(); focus?.focus?.(); }
  sheet(title,content,{wide=false,dismissible=true,onMount=null,onClose=null}={}){
    this.close(); this.lastFocus=document.activeElement; if(onClose)this.onClose(onClose); lockPageScroll(); this.locked=true; document.body.classList.add('has-open-sheet'); const overlay=document.createElement('div'); overlay.className='overlay';
    overlay.innerHTML=`<section class="sheet ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${title}" data-dismissible="${dismissible}"><div class="sheet-handle"></div><header class="sheet-head"><h2 class="sheet-title">${title}</h2>${dismissible?`<button class="icon-button" data-close-sheet aria-label="关闭">${icon('close')}</button>`:''}</header><div class="sheet-body">${content}</div></section>`;
    overlay.addEventListener('click',e=>{ if(dismissible&&(e.target===overlay||e.target.closest('[data-close-sheet]'))) this.close(); });
    const sheet=overlay.querySelector('.sheet');
    sheet.addEventListener('touchstart',e=>{this.startY=e.touches[0].clientY;},{passive:true});
    sheet.addEventListener('touchend',e=>{if(dismissible&&e.changedTouches[0].clientY-this.startY>90&&sheet.scrollTop<=0)this.close();},{passive:true});
    this.escapeHandler=e=>{if(dismissible&&e.key==='Escape')this.close();}; document.addEventListener('keydown',this.escapeHandler);
    this.root.append(overlay); this.active=overlay; (overlay.querySelector('[data-close-sheet]')||overlay.querySelector('button'))?.focus(); onMount?.(overlay); return overlay;
  }
  dialog(title,content){ this.close(); lockPageScroll(); this.locked=true; document.body.classList.add('has-open-sheet'); const overlay=document.createElement('div');overlay.className='overlay dialog-wrap';overlay.innerHTML=`<section class="dialog" role="dialog" aria-modal="true"><div class="card-row"><h2 class="sheet-title">${title}</h2><button class="icon-button" data-close-sheet>${icon('close')}</button></div><div style="height:12px"></div>${content}</section>`;overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-close-sheet]'))this.close();});this.root.append(overlay);this.active=overlay;return overlay;}
}

export function playerDetail(player,state){
  const prev=state.career.growthLog.at(-1)?.before||player.stats;
  return `<div class="card-row"><div><div class="card-kicker">${icon('club','sm')} ${player.club}</div><h3 class="card-title">${player.name} · ${player.position}</h3><div class="tag-row"><span class="badge blue">OVR ${player.ovr}</span><span class="badge purple">潜力 ${Math.round(player.potential)}</span><span class="badge green">${player.status||'健康'}</span></div></div><div class="avatar">${player.number}</div></div>${radarChart({...player.stats,goalkeeping:player.goalkeeping},prev,player.potential,player.position)}${statGrid([['身价',`€${Math.round(state.career.marketValue/1000)}K`],['周薪',`€${state.career.weeklySalary}`],['合同',`${state.career.contractMonths}月`],['粉丝',state.relationships.fans.toLocaleString()]])}`;
}
