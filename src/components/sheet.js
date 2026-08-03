import {el,button} from '../utils/dom.js';
let backdrop,current,previousOverflow='',previousFocus=null,viewportHandler=null,keyHandler=null;

function cleanupViewport(){
  if(viewportHandler&&window.visualViewport)window.visualViewport.removeEventListener('resize',viewportHandler);
  viewportHandler=null;
  if(keyHandler)document.removeEventListener('keydown',keyHandler);
  keyHandler=null;
}
function applyViewportHeight(){
  if(!current)return;
  const height=window.visualViewport?.height||window.innerHeight;
  current.style.setProperty('--sheet-viewport',`${Math.max(320,height)}px`);
}
export function closeSheet(){
  if(!backdrop)return;
  const oldBackdrop=backdrop,oldCurrent=current;
  backdrop=null;current=null;
  oldBackdrop.classList.remove('is-open');oldCurrent?.classList.remove('is-open');
  cleanupViewport();
  document.documentElement.classList.remove('has-open-sheet');
  document.body.classList.remove('has-open-sheet');
  document.body.style.overflow=previousOverflow;
  setTimeout(()=>oldBackdrop.remove(),190);
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  previousFocus=null;
}
export function openSheet({title,subtitle='',content,actions=[],dismissible=true,size='normal'}){
  closeSheet();
  previousFocus=document.activeElement;
  previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  document.documentElement.classList.add('has-open-sheet');
  document.body.classList.add('has-open-sheet');

  backdrop=el('div',{className:'sheet-backdrop'});
  current=el('section',{className:`sheet sheet--${size}`,attrs:{role:'dialog','aria-modal':'true','aria-label':title,tabindex:'-1'}});
  const handle=el('div',{className:'sheet-handle',attrs:{'aria-hidden':'true'}});
  const closeButton=dismissible?button('×',{className:'icon-button',ariaLabel:'关闭弹窗',onClick:closeSheet}):null;
  const head=el('header',{className:'sheet-header'},[
    el('div',{},[el('h2',{text:title}),subtitle?el('p',{text:subtitle}):null]),
    closeButton
  ]);
  const body=el('div',{className:'sheet-body',attrs:{tabindex:'0'}});
  if(typeof content==='string')body.textContent=content;else if(content)body.append(content);
  const foot=el('footer',{className:'sheet-footer'});
  actions.forEach(action=>foot.append(button(action.label,{className:action.className||'button',disabled:action.disabled,onClick:()=>{
    const result=action.onClick?.();
    if(result!==false&&action.close!==false)closeSheet();
  }})));
  current.append(handle,head,body);if(actions.length)current.append(foot);
  backdrop.append(current);document.body.append(backdrop);
  applyViewportHeight();
  viewportHandler=applyViewportHeight;window.visualViewport?.addEventListener('resize',viewportHandler);
  keyHandler=event=>{if(event.key==='Escape'&&dismissible){event.preventDefault();closeSheet()}};document.addEventListener('keydown',keyHandler);
  if(dismissible)backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeSheet()});
  requestAnimationFrame(()=>{
    backdrop.classList.add('is-open');current.classList.add('is-open');
    (closeButton||current).focus({preventScroll:true});
  });
  return{body,sheet:current,close:closeSheet};
}
