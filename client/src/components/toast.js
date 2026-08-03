import {el} from '../utils/dom.js';
let node,timer;
function toastHost(){return document.querySelector('#toast-root')||document.body}
export function showToast(message,{type='info',duration=2200}={}){
  const host=toastHost();
  if(!node||!node.isConnected){node=el('div',{className:'toast',attrs:{role:'status','aria-live':'polite'}});host.append(node)}
  else if(node.parentElement!==host)host.append(node);
  node.textContent=message;node.dataset.type=type;node.classList.add('is-visible');clearTimeout(timer);timer=setTimeout(()=>node.classList.remove('is-visible'),duration)
}
