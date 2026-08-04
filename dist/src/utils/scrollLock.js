let lockCount=0;
let saved={scrollY:0,bodyStyle:'',htmlStyle:''};

/** iOS 安全的背景滚动锁。支持嵌套 Sheet。 */
export function lockPageScroll(){
  lockCount+=1;
  if(lockCount>1)return;
  const body=document.body;
  const html=document.documentElement;
  saved={scrollY:window.scrollY||0,bodyStyle:body.getAttribute('style')||'',htmlStyle:html.getAttribute('style')||''};
  const scrollbarGap=Math.max(0,window.innerWidth-html.clientWidth);
  body.style.position='fixed';
  body.style.top=`-${saved.scrollY}px`;
  body.style.left='0';
  body.style.right='0';
  body.style.width='100%';
  if(scrollbarGap)body.style.paddingRight=`${scrollbarGap}px`;
  html.style.overflow='hidden';
  body.dataset.scrollLocked='true';
}

export function unlockPageScroll(){
  if(lockCount===0)return;
  lockCount-=1;
  if(lockCount>0)return;
  const body=document.body;
  const html=document.documentElement;
  body.setAttribute('style',saved.bodyStyle);
  html.setAttribute('style',saved.htmlStyle);
  delete body.dataset.scrollLocked;
  requestAnimationFrame(()=>window.scrollTo({top:saved.scrollY,left:0,behavior:'instant'}));
}

export function forceUnlockPageScroll(){
  lockCount=1;
  unlockPageScroll();
}
