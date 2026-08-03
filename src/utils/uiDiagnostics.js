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
  const panel=params.has('ui-debug')?document.createElement('aside'):null;
  if(panel){panel.className='ui-debug-panel';document.body.append(panel)}
  const update=()=>{
    const over=overflowNodes();
    if(panel){
      const vv=window.visualViewport;
      panel.textContent=[
        `视口 ${innerWidth}×${innerHeight}`,
        `可视 ${Math.round(vv?.width||innerWidth)}×${Math.round(vv?.height||innerHeight)}`,
        `页面 ${document.querySelector('.page-container')?.dataset.route||'启动'}`,
        `遮罩 ${document.querySelectorAll('.sheet-backdrop,.modal-backdrop').length}`,
        `横向越界 ${over.length}`
      ].join('\n');
    }
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
  dispose=()=>{observer.disconnect();window.removeEventListener('resize',update);document.removeEventListener('pointerup',tap,true);panel?.remove()};
  return dispose;
}
