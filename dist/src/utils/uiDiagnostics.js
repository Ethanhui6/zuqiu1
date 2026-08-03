let dispose=null;
function overflowNodes(){
  const width=document.documentElement.clientWidth;
  return [...document.querySelectorAll('body *')].filter(node=>{
    if(!(node instanceof HTMLElement)||node.hidden)return false;
    const style=getComputedStyle(node);
    if(style.position==='fixed'&&node.classList.contains('sheet-backdrop'))return false;
    const rect=node.getBoundingClientRect();
    return rect.width>0&&(rect.right>width+1||rect.left<-1);
  });
}
function pathOf(node){
  const parts=[];let current=node;
  while(current&&current!==document.body&&parts.length<5){
    const id=current.id?`#${current.id}`:'';
    const cls=current.classList?.length?`.${[...current.classList].slice(0,3).join('.')}`:'';
    parts.unshift(`${current.tagName?.toLowerCase()||'node'}${id}${cls}`);current=current.parentElement;
  }
  return parts.join(' > ');
}
export function installUiDiagnostics(){
  const params=new URLSearchParams(location.search);
  if(!params.has('ui-debug')&&!params.has('tap-debug'))return()=>{};
  const update=()=>{
    const over=overflowNodes();
    if(over.length)console.warn('检测到横向越界元素',over.map(node=>({path:pathOf(node),rect:node.getBoundingClientRect()})));
  };
  const tap=event=>{
    if(!params.has('tap-debug'))return;
    const top=document.elementFromPoint(event.clientX,event.clientY);
    console.info('点击诊断',{target:pathOf(event.target),top:pathOf(top),path:event.composedPath().slice(0,6).map(pathOf)});
  };
  const observer=new MutationObserver(()=>requestAnimationFrame(update));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
  window.addEventListener('resize',update,{passive:true});document.addEventListener('pointerup',tap,true);update();
  dispose=()=>{observer.disconnect();window.removeEventListener('resize',update);document.removeEventListener('pointerup',tap,true)};
  return dispose;
}
