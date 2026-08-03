import {el,button} from '../utils/dom.js';
import {lockPageScroll,unlockPageScroll} from '../utils/scrollLock.js';
import {overlayManager} from '../services/overlay/overlayManager.js';
let backdrop=null,current=null,previousFocus=null,viewportHandler=null,keyHandler=null,closing=false,removeTimer=0;

function cleanupListeners(){
  if(viewportHandler&&window.visualViewport){
    window.visualViewport.removeEventListener('resize',viewportHandler);
    window.visualViewport.removeEventListener('scroll',viewportHandler);
  }
  if(keyHandler)document.removeEventListener('keydown',keyHandler);
  viewportHandler=null;keyHandler=null;
}
function applyViewportHeight(){
  if(!current)return;
  const height=window.visualViewport?.height||window.innerHeight;
  current.style.setProperty('--sheet-viewport',`${Math.max(240,height)}px`);
}
function focusableNodes(){
  if(!current)return[];
  return [...current.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[href],[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.getClientRects().length);
}
function trapFocus(event){
  if(event.key==='Escape'&&current?.dataset.dismissible==='true'){event.preventDefault();closeSheet();return}
  if(event.key!=='Tab')return;
  const nodes=focusableNodes();if(!nodes.length){event.preventDefault();current?.focus();return}
  const first=nodes[0],last=nodes.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}
export function closeSheet(){
  if(!backdrop||closing)return;
  closing=true;
  const oldBackdrop=backdrop,oldCurrent=current,focus=previousFocus;
  backdrop=null;current=null;previousFocus=null;
  oldBackdrop.setAttribute('aria-hidden','true');
  oldBackdrop.style.pointerEvents='none';
  oldBackdrop.classList.add('is-closing');
  oldBackdrop.classList.remove('is-open');oldCurrent?.classList.remove('is-open');
  cleanupListeners();
  document.documentElement.classList.remove('has-open-sheet');
  document.body.classList.remove('has-open-sheet');
  unlockPageScroll();
  let removed=false;
  const remove=()=>{
    if(removed)return;
    removed=true;
    overlayManager.release(oldBackdrop,'sheet-close');closing=false;
    if(focus?.isConnected)focus.focus({preventScroll:true});
  };
  oldCurrent?.addEventListener('transitionend',remove,{once:true});
  clearTimeout(removeTimer);removeTimer=setTimeout(remove,280);
}
export function destroySheet({restoreFocus=false}={}){
  clearTimeout(removeTimer);removeTimer=0;
  const old=backdrop,focus=previousFocus;backdrop=null;current=null;previousFocus=null;closing=false;
  cleanupListeners();
  if(typeof document==='undefined')return;
  document.documentElement.classList.remove('has-open-sheet');document.body.classList.remove('has-open-sheet');unlockPageScroll();if(old)overlayManager.release(old,'sheet-destroy');
  if(restoreFocus&&focus?.isConnected)focus.focus({preventScroll:true});
}
export function openSheet({title,subtitle='',content,actions=[],dismissible=true,size='normal'}){
  if(backdrop){
    destroySheet();
  }
  closing=false;previousFocus=document.activeElement;lockPageScroll();
  document.documentElement.classList.add('has-open-sheet');document.body.classList.add('has-open-sheet');

  backdrop=el('div',{className:'sheet-backdrop',attrs:{'aria-hidden':'false'}});
  current=el('section',{className:`sheet sheet--${size}`,attrs:{role:'dialog','aria-modal':'true','aria-label':title,tabindex:'-1'}});
  current.dataset.dismissible=String(dismissible);
  const handle=el('div',{className:'sheet-handle',attrs:{'aria-hidden':'true'}});
  const closeButton=dismissible?button('关闭',{className:'sheet-close-button',ariaLabel:'关闭弹窗',onClick:closeSheet}):null;
  const head=el('header',{className:'sheet-header'},[
    el('div',{className:'sheet-heading'},[el('h2',{text:title}),subtitle?el('p',{text:subtitle}):null]),closeButton
  ]);
  const body=el('div',{className:'sheet-body',attrs:{tabindex:'0'}});
  if(typeof content==='string')body.textContent=content;else if(content)body.append(content);
  const foot=el('footer',{className:'sheet-footer'});
  actions.forEach(action=>foot.append(button(action.label,{className:action.className||'button',disabled:action.disabled,onClick:()=>{
    const result=action.onClick?.();if(result!==false&&action.close!==false)closeSheet();
  }})));
  current.append(handle,head,body);if(actions.length)current.append(foot);
  backdrop.append(current);overlayManager.mount(backdrop,{channel:'overlay',kind:'sheet',scope:'page',interactive:true});
  applyViewportHeight();
  viewportHandler=applyViewportHeight;
  window.visualViewport?.addEventListener('resize',viewportHandler,{passive:true});
  window.visualViewport?.addEventListener('scroll',viewportHandler,{passive:true});
  keyHandler=trapFocus;document.addEventListener('keydown',keyHandler);
  if(dismissible)backdrop.addEventListener('pointerup',event=>{if(event.target===backdrop)closeSheet()});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    backdrop?.classList.add('is-open');current?.classList.add('is-open');
    (closeButton||current)?.focus({preventScroll:true});
  }));
  return{body,sheet:current,close:closeSheet};
}
