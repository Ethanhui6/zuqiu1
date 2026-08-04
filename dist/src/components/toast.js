import {el} from '../utils/dom.js';
import {overlayManager} from '../services/overlay/overlayManager.js';
let node=null;
export function showToast(message,{type='info',duration=2200}={}){
  if(node)overlayManager.release(node,'replace');
  const toast=el('div',{className:'toast',attrs:{role:'status','aria-live':'polite'}});node=toast;
  toast.textContent=String(message||'操作已完成');toast.dataset.type=type;
  overlayManager.mount(toast,{channel:'toast',kind:'toast',scope:'page',interactive:false});
  overlayManager.cleanup(toast,()=>{if(node===toast)node=null});
  overlayManager.frame(toast,()=>toast.classList.add('is-visible'));
  overlayManager.timer(toast,()=>{
    toast.classList.remove('is-visible');toast.classList.add('is-leaving');
    overlayManager.timer(toast,()=>overlayManager.release(toast,'timeout'),190);
  },Math.max(500,duration));
  return{close:()=>overlayManager.release(toast,'manual')};
}

export function clearToast(){if(node)overlayManager.release(node,'clear')}
