import {NAV_ITEMS} from '../app/config.js';
import {el,button,icon} from '../utils/dom.js';
import {formatMoney} from '../utils/format.js';
import {getSpeed} from '../systems/pace/paceSystem.js';
import {navigationAttention} from '../systems/attention/attentionManager.js';

export function createAppShell({onNavigate,onSave,onBack,onHome,onPaceSettings}={}){
  const root=el('div',{className:'app-shell v20-app-shell',attrs:{'data-app-shell':'true'}});
  const header=el('header',{className:'AppHeader app-header v20-app-header',attrs:{'data-app-region':'header'}});

  const left=el('div',{className:'v20-header-side v20-header-side--left'});
  const back=button('',{className:'v20-header-icon-button v20-header-back',ariaLabel:'返回生涯首页',onClick:onBack});
  back.append(el('span',{text:'‹',attrs:{'aria-hidden':'true'}}),el('span',{className:'v20-header-action-label',text:'生涯'}));
  left.append(back);

  const identity=button('',{className:'v20-header-player',ariaLabel:'返回生涯首页',onClick:onHome});
  identity.append(
    el('span',{className:'v20-header-avatar',text:'球',attrs:{'aria-hidden':'true'}}),
    el('span',{className:'v20-header-player__copy'},[
      el('strong',{text:'球员'}),
      el('small',{text:'俱乐部 · 年龄 · 身价'})
    ])
  );

  const right=el('div',{className:'v20-header-side v20-header-side--right'});
  const paceButton=button('',{className:'v20-pace-chip',ariaLabel:'打开职业节奏设置',onClick:onPaceSettings});
  paceButton.append(el('span',{text:'◷',attrs:{'aria-hidden':'true'}}),el('span',{className:'v20-pace-chip__value',text:'1倍'}));
  const save=button('',{className:'v20-save-button',ariaLabel:'保存当前生涯',onClick:()=>{
    save.classList.remove('is-saved');save.classList.add('is-saving');
    const result=onSave?.();
    Promise.resolve(result).finally(()=>{
      if(!save.isConnected)return;
      save.classList.remove('is-saving');save.classList.add('is-saved');
      const label=save.querySelector('.v20-save-button__label');if(label)label.textContent='已保存';
      clearTimeout(save._savedTimer);save._savedTimer=setTimeout(()=>{save.classList.remove('is-saved');if(label)label.textContent='保存'},1200);
    });
  }});
  save.append(el('span',{className:'v20-save-button__icon',text:'✓',attrs:{'aria-hidden':'true'}}),el('span',{className:'v20-save-button__label',text:'保存'}));
  right.append(paceButton,save);
  header.append(left,identity,right);

  const main=el('main',{className:'MainViewport main-viewport page-container v20-main-viewport',attrs:{id:'page-container',tabindex:'-1','data-app-region':'main'}});
  const nav=el('nav',{className:'BottomNavigation bottom-navigation tab-bar v20-tab-bar',attrs:{'aria-label':'主要导航','data-app-region':'navigation'}});
  NAV_ITEMS.forEach(item=>{
    const navButton=button('',{className:'tab-button v20-tab-button',ariaLabel:item.label,onClick:()=>onNavigate?.(item.id)});
    navButton.dataset.route=item.id;
    navButton.append(icon(item.icon),el('span',{className:'tab-button__label',text:item.label}),el('span',{className:'tab-badge',attrs:{'aria-hidden':'true'}}));
    nav.append(navButton);
  });

  const scrollHint=button('',{className:'scroll-hint v20-scroll-hint',ariaLabel:'下方还有内容，向下滚动'});
  scrollHint.append(el('span',{text:'继续向下'}),el('span',{className:'scroll-hint__chevron',text:'⌄',attrs:{'aria-hidden':'true'}}));
  const scrollController=installScrollController(main,scrollHint);
  const overlayRoot=el('div',{className:'OverlayRoot overlay-root',attrs:{id:'overlay-root','data-app-region':'overlays','aria-live':'off'}});
  const toastRoot=el('div',{className:'ToastRoot toast-root',attrs:{id:'toast-root','data-app-region':'toasts','aria-live':'polite'}});
  root.append(header,main,nav,scrollHint,overlayRoot,toastRoot);
  return{root,header,main,nav,scrollHint,scrollController,overlayRoot,toastRoot,identity,back,save,paceButton,destroy(){
    scrollController.destroy();clearTimeout(save._savedTimer);
    nav.querySelectorAll('.tab-badge').forEach(badge=>{clearTimeout(badge._arrivalTimer);badge._arrivalTimer=0;badge.classList.remove('is-arriving')});
  }};
}

export function updateShell(shell,save,club,route,repo){
  const name=save.player?.displayName||save.player?.name||'球员';
  shell.identity.querySelector('.v20-header-avatar').textContent=String(name).slice(-2);
  shell.identity.querySelector('strong').textContent=name;
  shell.identity.querySelector('small').textContent=`${club.cn} · ${save.player.age}岁 · ${formatMoney(save.finance.marketValue)}`;
  const away=route!=='career';shell.back.hidden=!away;shell.header.dataset.route=route;
  const speed=getSpeed(save);shell.paceButton.querySelector('.v20-pace-chip__value').textContent=speed.id==='turbo'?'极速':speed.label;shell.paceButton.dataset.speed=speed.id;shell.paceButton.setAttribute('aria-label',`当前职业节奏${speed.label}，打开设置`);
  const alerts=navigationAttention(save,repo);
  shell.nav.querySelectorAll('.tab-button').forEach(buttonNode=>{
    const target=buttonNode.dataset.route,active=target===route||(target==='more'&&['world','profile','rankings','more'].includes(route));
    buttonNode.classList.toggle('is-active',active);buttonNode.setAttribute('aria-current',active?'page':'false');
    const badge=buttonNode.querySelector('.tab-badge'),count=Math.max(0,Number(alerts[target]||0)),previous=Number(buttonNode.dataset.alertCount||0);buttonNode.dataset.alertCount=String(count);badge.hidden=count<=0;badge.textContent=count>9?'9+':String(count);
    const label=buttonNode.querySelector('.tab-button__label').textContent;buttonNode.setAttribute('aria-label',count?`${label}，${count}项待处理`:label);
    if(count>previous){badge.classList.remove('is-arriving');void badge.offsetWidth;badge.classList.add('is-arriving');clearTimeout(badge._arrivalTimer);badge._arrivalTimer=setTimeout(()=>badge.classList.remove('is-arriving'),680)}
  });
  shell.scrollController.setRoute(route);
}

function installScrollController(main,hint){
  let frame=0,currentRoute='',routeSeen=false,destroyed=false;
  const evaluate=()=>{frame=0;if(destroyed||!main.isConnected)return;const hasMore=main.scrollHeight-main.clientHeight-main.scrollTop>88,atTop=main.scrollTop<26,visible=hasMore&&atTop&&!routeSeen;hint.classList.toggle('is-visible',visible);hint.setAttribute('aria-hidden',String(!visible));hint.tabIndex=visible?0:-1};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(evaluate)};
  const onScroll=()=>{if(main.scrollTop>36)routeSeen=true;schedule()};
  const onClick=()=>{routeSeen=true;hint.classList.remove('is-visible');main.scrollBy({top:Math.max(210,main.clientHeight*.52),behavior:'smooth'})};
  main.addEventListener('scroll',onScroll,{passive:true});hint.addEventListener('click',onClick);
  const resizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;resizeObserver?.observe(main);
  const mutationObserver=new MutationObserver(schedule);mutationObserver.observe(main,{childList:true,subtree:true});window.addEventListener('resize',schedule,{passive:true});
  return{setRoute(route){if(route!==currentRoute){currentRoute=route;routeSeen=false;hint.classList.remove('is-visible')}requestAnimationFrame(()=>requestAnimationFrame(schedule))},destroy(){destroyed=true;if(frame)cancelAnimationFrame(frame);main.removeEventListener('scroll',onScroll);hint.removeEventListener('click',onClick);window.removeEventListener('resize',schedule);resizeObserver?.disconnect();mutationObserver.disconnect()}};
}
