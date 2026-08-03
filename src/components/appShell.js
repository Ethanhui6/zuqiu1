import {APP_VERSION,NAV_ITEMS} from '../app/config.js';
import {el,button,icon} from '../utils/dom.js';
import {formatMoney} from '../utils/format.js';
import {getSpeed} from '../systems/pace/paceSystem.js';
import {getNavigationAlerts,getRecommendedAction} from '../systems/guidance/guidanceSystem.js';
import {createGuidanceBanner,destroyGuidanceBanner,updateGuidanceBanner} from './guidanceBanner.js';

export function createAppShell({onNavigate,onSave,onBack,onHome,onPaceSettings}={}){
  const root=el('div',{className:'app-shell',attrs:{'data-app-shell':'true'}});
  const header=el('header',{className:'AppHeader app-header',attrs:{'data-app-region':'header'}});
  const main=el('main',{className:'MainViewport main-viewport page-container',attrs:{id:'page-container',tabindex:'-1','data-app-region':'main'}});

  const left=el('div',{className:'header-side header-side--left'});
  const back=button('',{className:'header-nav-button header-back',ariaLabel:'返回生涯首页',onClick:onBack});
  back.append(el('span',{className:'header-nav-icon',text:'‹',attrs:{'aria-hidden':'true'}}),el('span',{className:'header-nav-label',text:'生涯'}));
  left.append(back);

  const brand=button('',{className:'header-brand',ariaLabel:'返回主页',onClick:onHome});
  brand.append(
    el('span',{className:'brand-ball',text:'⚽',attrs:{'aria-hidden':'true'}}),
    el('span',{className:'header-brand__copy'},[el('strong',{text:'绿茵浮沉'}),el('small',{text:`V${APP_VERSION}`})])
  );

  const right=el('div',{className:'header-side header-side--right'});
  const paceButton=button('',{className:'header-pace-button',ariaLabel:'打开游戏节奏设置',onClick:onPaceSettings});
  paceButton.append(el('span',{className:'header-pace-button__icon',text:'⏱',attrs:{'aria-hidden':'true'}}),el('span',{className:'header-pace-button__value',text:'1倍'}));
  const save=button('保存',{className:'header-save-button',ariaLabel:'手动保存',onClick:onSave});
  right.append(paceButton,save);
  header.append(left,brand,right);

  const guidance=createGuidanceBanner({onActivate:route=>onNavigate?.(route)});
  const nav=el('nav',{className:'BottomNavigation bottom-navigation tab-bar',attrs:{'aria-label':'主要导航','data-app-region':'navigation'}});
  NAV_ITEMS.forEach(item=>{
    const navButton=button('',{className:'tab-button',ariaLabel:item.label,onClick:()=>onNavigate?.(item.id)});
    navButton.dataset.route=item.id;
    navButton.append(icon(item.icon),el('span',{className:'tab-button__label',text:item.label}),el('span',{className:'tab-badge',attrs:{'aria-hidden':'true'}}));
    nav.append(navButton);
  });

  const scrollHint=button('',{className:'scroll-hint',ariaLabel:'下方还有内容，向下滚动'});
  scrollHint.append(el('span',{text:'下方还有内容'}),el('span',{className:'scroll-hint__chevron',text:'⌄',attrs:{'aria-hidden':'true'}}));
  const scrollController=installScrollController(main,scrollHint);

  const overlayRoot=el('div',{className:'OverlayRoot overlay-root',attrs:{id:'overlay-root','data-app-region':'overlays','aria-live':'off'}});
  const toastRoot=el('div',{className:'ToastRoot toast-root',attrs:{id:'toast-root','data-app-region':'toasts','aria-live':'polite'}});
  root.append(header,guidance.root,main,nav,scrollHint,overlayRoot,toastRoot);
  return{root,header,main,guidance,nav,scrollHint,scrollController,overlayRoot,toastRoot,brand,back,save,paceButton,destroy(){
    scrollController.destroy();
    destroyGuidanceBanner(guidance);
    nav.querySelectorAll('.tab-badge').forEach(badge=>{clearTimeout(badge._arrivalTimer);badge._arrivalTimer=0;badge.classList.remove('is-arriving')});
  }};
}

export function updateShell(shell,save,club,route,repo){
  shell.brand.querySelector('strong').textContent=save.player.name;
  shell.brand.querySelector('small').textContent=`${club.cn} · ${save.player.age}岁 · ${formatMoney(save.finance.marketValue)}`;
  const away=route!=='career';
  shell.back.hidden=!away;
  shell.header.dataset.route=route;
  const speed=getSpeed(save);
  shell.paceButton.querySelector('.header-pace-button__value').textContent=speed.id==='turbo'?'极速':speed.label;
  shell.paceButton.dataset.speed=speed.id;
  shell.paceButton.setAttribute('aria-label',`当前速度${speed.label}，打开游戏节奏设置`);

  updateGuidanceBanner(shell.guidance,getRecommendedAction(save,repo));
  const alerts=getNavigationAlerts(save,repo);
  shell.nav.querySelectorAll('.tab-button').forEach(buttonNode=>{
    const target=buttonNode.dataset.route;
    const active=target===route||(target==='more'&&['world','profile','rankings','more'].includes(route));
    buttonNode.classList.toggle('is-active',active);
    buttonNode.setAttribute('aria-current',active?'page':'false');
    const badge=buttonNode.querySelector('.tab-badge'),count=Math.max(0,Number(alerts[target]||0)),previous=Number(buttonNode.dataset.alertCount||0);
    buttonNode.dataset.alertCount=String(count);
    badge.hidden=count<=0;
    badge.textContent=count>9?'9+':String(count);
    buttonNode.setAttribute('aria-label',count?`${buttonNode.querySelector('.tab-button__label').textContent}，${count}项待处理`:buttonNode.querySelector('.tab-button__label').textContent);
    if(count>previous){
      badge.classList.remove('is-arriving');void badge.offsetWidth;badge.classList.add('is-arriving');
      clearTimeout(badge._arrivalTimer);badge._arrivalTimer=setTimeout(()=>badge.classList.remove('is-arriving'),720);
    }
  });
  shell.scrollController.setRoute(route);
}

function installScrollController(main,hint){
  let frame=0,currentRoute='',routeSeen=false,destroyed=false;
  const evaluate=()=>{
    frame=0;if(destroyed||!main.isConnected)return;
    const hasMore=main.scrollHeight-main.clientHeight-main.scrollTop>72;
    const atTop=main.scrollTop<28;
    const visible=hasMore&&atTop&&!routeSeen;
    hint.classList.toggle('is-visible',visible);
    hint.setAttribute('aria-hidden',String(!visible));
    hint.tabIndex=visible?0:-1;
  };
  const schedule=()=>{if(frame)return;frame=requestAnimationFrame(evaluate)};
  const onScroll=()=>{if(main.scrollTop>36)routeSeen=true;schedule()};
  const onClick=()=>{routeSeen=true;hint.classList.remove('is-visible');main.scrollBy({top:Math.max(220,main.clientHeight*.58),behavior:'smooth'})};
  main.addEventListener('scroll',onScroll,{passive:true});hint.addEventListener('click',onClick);
  const resizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;resizeObserver?.observe(main);
  const mutationObserver=new MutationObserver(schedule);mutationObserver.observe(main,{childList:true,subtree:true});
  window.addEventListener('resize',schedule,{passive:true});
  return{
    setRoute(route){if(route!==currentRoute){currentRoute=route;routeSeen=false;hint.classList.remove('is-visible')}requestAnimationFrame(()=>requestAnimationFrame(schedule))},
    destroy(){destroyed=true;if(frame)cancelAnimationFrame(frame);main.removeEventListener('scroll',onScroll);hint.removeEventListener('click',onClick);window.removeEventListener('resize',schedule);resizeObserver?.disconnect();mutationObserver.disconnect();clearTimeout(hint._arrivalTimer)}
  };
}
