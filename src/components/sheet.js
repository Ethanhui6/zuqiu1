import {el,button} from '../utils/dom.js';
let backdrop,current,previousOverflow='';
export function closeSheet(){if(!backdrop)return;const oldBackdrop=backdrop,oldCurrent=current;backdrop=null;current=null;oldBackdrop.classList.remove('is-open');oldCurrent?.classList.remove('is-open');setTimeout(()=>oldBackdrop.remove(),180);document.body.style.overflow=previousOverflow}
export function openSheet({title,subtitle='',content,actions=[],dismissible=true,size='normal'}){
  closeSheet();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';backdrop=el('div',{className:'sheet-backdrop'});current=el('section',{className:`sheet sheet--${size}`,attrs:{role:'dialog','aria-modal':'true','aria-label':title}});
  const handle=el('div',{className:'sheet-handle'});const head=el('header',{className:'sheet-header'},[el('div',{},[el('h2',{text:title}),subtitle?el('p',{text:subtitle}):null]),dismissible?button('×',{className:'icon-button',ariaLabel:'关闭',onClick:closeSheet}):null]);
  const body=el('div',{className:'sheet-body'});if(typeof content==='string')body.innerHTML=content;else if(content)body.append(content);
  const foot=el('footer',{className:'sheet-footer'});actions.forEach(a=>foot.append(button(a.label,{className:a.className||'button',disabled:a.disabled,onClick:()=>{const result=a.onClick?.();if(result!==false&&a.close!==false)closeSheet()}})));
  current.append(handle,head,body);if(actions.length)current.append(foot);backdrop.append(current);document.body.append(backdrop);requestAnimationFrame(()=>{backdrop.classList.add('is-open');current.classList.add('is-open')});if(dismissible)backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeSheet()});return{body,sheet:current,close:closeSheet};
}
