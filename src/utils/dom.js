export function el(tag,{className='',text='',html='',attrs={},dataset={}}={},children=[]){
  const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined&&text!=='')node.textContent=text;if(html)node.innerHTML=html;
  for(const[k,v]of Object.entries(attrs)){if(typeof v==='boolean'){if(v)node.setAttribute(k,'');continue}if(v!==undefined&&v!==null)node.setAttribute(k,String(v))}
  for(const[k,v]of Object.entries(dataset))node.dataset[k]=String(v);
  for(const child of children.flat()){if(child)node.append(child)}return node;
}
export function clear(node){while(node.firstChild)node.firstChild.remove();return node}
export function icon(text){return el('span',{className:'ui-icon',text,attrs:{'aria-hidden':'true'}})}
export function button(label,{className='button',onClick,ariaLabel,disabled=false}={}){const b=el('button',{className,text:label,attrs:{type:'button','aria-label':ariaLabel||label}});b.disabled=disabled;if(onClick)b.addEventListener('click',onClick);return b}
export function fragment(...nodes){const f=document.createDocumentFragment();nodes.flat().forEach(n=>n&&f.append(n));return f}
