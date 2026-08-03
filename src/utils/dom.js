export function el(tag,{className='',text='',html='',attrs={},dataset={}}={},children=[]){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined&&text!=='')node.textContent=text;
  if(html)node.innerHTML=html;
  for(const[key,value]of Object.entries(attrs)){
    if(typeof value==='boolean'){if(value)node.setAttribute(key,'');continue}
    if(value!==undefined&&value!==null)node.setAttribute(key,String(value));
  }
  for(const[key,value]of Object.entries(dataset))node.dataset[key]=String(value);
  for(const child of children.flat())if(child)node.append(child);
  return node;
}
export function clear(node){while(node.firstChild)node.firstChild.remove();return node}
export function icon(text){return el('span',{className:'ui-icon',text,attrs:{'aria-hidden':'true'}})}
function bindPressFeedback(node){
  const end=()=>node.classList.remove('is-pressing');
  node.addEventListener('pointerdown',event=>{if(!node.disabled&&(event.pointerType!=='mouse'||event.button===0))node.classList.add('is-pressing')});
  node.addEventListener('pointerup',end);node.addEventListener('pointercancel',end);node.addEventListener('pointerleave',end);node.addEventListener('blur',end);
  node.style.touchAction='manipulation';
  return node;
}
export function button(label,{className='button',onClick,ariaLabel,disabled=false,pressed,dataset={}}={}){
  const node=el('button',{className,text:label,attrs:{type:'button','aria-label':ariaLabel||label},dataset});
  node.disabled=disabled;
  if(pressed!==undefined)node.setAttribute('aria-pressed',String(Boolean(pressed)));
  if(onClick)node.addEventListener('click',onClick);
  return bindPressFeedback(node);
}
export function fragment(...nodes){const result=document.createDocumentFragment();nodes.flat().forEach(node=>node&&result.append(node));return result}
