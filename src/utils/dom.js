import {icon as renderIcon} from '../components/icons.js';

export function el(tag,{className='',text='',attrs={},dataset={}}={},children=[]){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined&&text!=='')node.textContent=text;
  for(const[key,value]of Object.entries(attrs)){
    if(typeof value==='boolean'){if(value)node.setAttribute(key,'');continue}
    if(value!==undefined&&value!==null)node.setAttribute(key,String(value));
  }
  for(const[key,value]of Object.entries(dataset))node.dataset[key]=String(value);
  for(const child of children.flat())if(child)node.append(child);
  return node;
}
export function clear(node){while(node.firstChild)node.firstChild.remove();return node}
export function icon(name,className=''){
  const template=document.createElement('template');
  template.innerHTML=renderIcon(name,className);
  return template.content.firstElementChild;
}
function bindPressFeedback(node){
  const end=()=>node.classList.remove('is-pressing');
  node.addEventListener('pointerdown',event=>{if(!node.disabled&&(event.pointerType!=='mouse'||event.button===0))node.classList.add('is-pressing')});
  node.addEventListener('pointerup',end);node.addEventListener('pointercancel',end);node.addEventListener('pointerleave',end);node.addEventListener('blur',end);
  node.style.touchAction='manipulation';
  return node;
}
export function button(label,{className='button',onClick,ariaLabel,disabled=false,pressed,dataset={}}={},children=[]){
  const node=el('button',{className,text:label,attrs:{type:'button','aria-label':ariaLabel||label},dataset});
  for(const child of children.flat())if(child)node.append(child);
  node.disabled=disabled;
  if(pressed!==undefined)node.setAttribute('aria-pressed',String(Boolean(pressed)));
  if(onClick)node.addEventListener('click',event=>{
    if(node.dataset.pending==='true'){event.preventDefault();return}
    const result=onClick(event);
    if(result&&typeof result.then==='function'){
      node.dataset.pending='true';node.disabled=true;node.setAttribute('aria-busy','true');
      Promise.resolve(result).finally(()=>{if(node.isConnected){node.dataset.pending='false';node.disabled=false;node.removeAttribute('aria-busy')}});
    }
  });
  return bindPressFeedback(node);
}
export function fragment(...nodes){const result=document.createDocumentFragment();nodes.flat().forEach(node=>node&&result.append(node));return result}
