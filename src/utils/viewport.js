let cleanup=null;

/** 同步 Safari 动态视口与键盘状态到 CSS 变量。 */
export function installViewportObserver(){
  cleanup?.();
  const root=document.documentElement;
  const viewport=window.visualViewport;
  let baseline=Math.max(window.innerHeight,viewport?.height||0);
  const update=()=>{
    const height=viewport?.height||window.innerHeight;
    const width=viewport?.width||window.innerWidth;
    baseline=Math.max(baseline,window.innerHeight,height);
    root.style.setProperty('--visual-viewport-height',`${Math.max(320,height)}px`);
    root.style.setProperty('--visual-viewport-width',`${Math.max(320,width)}px`);
    const keyboardOpen=baseline-height>Math.max(120,baseline*.2);
    document.body.classList.toggle('keyboard-open',keyboardOpen);
  };
  update();
  viewport?.addEventListener('resize',update,{passive:true});
  viewport?.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  const focusIn=event=>{
    if(!event.target.matches?.('input,select,textarea'))return;
    requestAnimationFrame(()=>event.target.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'}));
  };
  document.addEventListener('focusin',focusIn);
  cleanup=()=>{
    viewport?.removeEventListener('resize',update);
    viewport?.removeEventListener('scroll',update);
    window.removeEventListener('resize',update);
    document.removeEventListener('focusin',focusIn);
  };
  return cleanup;
}
