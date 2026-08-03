import {el} from '../utils/dom.js';
let node,timer;
export function showToast(message,{type='info',duration=2200}={}){if(!node){node=el('div',{className:'toast',attrs:{role:'status','aria-live':'polite'}});document.body.append(node)}node.textContent=message;node.dataset.type=type;node.classList.add('is-visible');clearTimeout(timer);timer=setTimeout(()=>node.classList.remove('is-visible'),duration)}
