import {APP_VERSION,NAV_ITEMS,SPEED_LEVELS} from '../app/config.js';
import {el,button,icon} from '../utils/dom.js';
import {formatMoney} from '../utils/format.js';
import {getSpeed,getPaceMode} from '../systems/pace/paceSystem.js';

export function createAppShell({onNavigate,onSave,onBack,onHome,onSpeed}){
  const root=el('div',{className:'app-shell'});
  const header=el('header',{className:'app-header'});
  const main=el('main',{className:'page-container',attrs:{id:'page-container',tabindex:'-1'}});
  const speedDock=el('section',{className:'speed-dock',attrs:{'aria-label':'时间推进速度'}});
  const speedLabel=el('div',{className:'speed-dock__label'},[
    el('small',{text:'职业节奏'}),el('strong',{text:'标准模式'})
  ]);
  const speedControls=el('div',{className:'speed-dock__controls',attrs:{role:'group','aria-label':'选择推进速度'}});
  SPEED_LEVELS.forEach(item=>{
    const compact=item.id==='paused'?'Ⅱ':item.id==='turbo'?'»':item.label.replace('倍','×');
    const speedButton=button(compact,{className:'speed-button',ariaLabel:`推进速度：${item.label}`,onClick:()=>onSpeed?.(item.id)});
    speedButton.dataset.speed=item.id;
    speedButton.append(el('small',{text:item.label}));
    speedControls.append(speedButton);
  });
  speedDock.append(speedLabel,speedControls);

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
  const save=button('保存',{className:'header-save-button',ariaLabel:'手动保存',onClick:onSave});
  right.append(save);
  header.append(left,brand,right);

  const nav=el('nav',{className:'tab-bar',attrs:{'aria-label':'主要导航'}});
  NAV_ITEMS.forEach(item=>{
    const navButton=button('',{className:'tab-button',ariaLabel:item.label,onClick:()=>onNavigate(item.id)});
    navButton.dataset.route=item.id;
    navButton.append(icon(item.icon),el('span',{text:item.label}));
    nav.append(navButton);
  });

  root.append(header,main,speedDock,nav);
  return{root,header,main,speedDock,speedLabel,speedControls,nav,brand,back,save};
}

export function updateShell(shell,save,club,route){
  shell.brand.querySelector('strong').textContent=save.player.name;
  shell.brand.querySelector('small').textContent=`${club.cn} · ${save.player.age}岁 · ${formatMoney(save.finance.marketValue)}`;
  const away=route!=='career';
  shell.back.hidden=!away;
  shell.header.dataset.route=route;
  const speed=getSpeed(save),pace=getPaceMode(save);
  shell.speedLabel.querySelector('strong').textContent=pace.name;
  shell.speedDock.dataset.running=String(Boolean(save.career.advance?.running));
  shell.speedControls.querySelectorAll('.speed-button').forEach(node=>{
    const active=node.dataset.speed===speed.id;
    node.classList.toggle('is-active',active);
    node.setAttribute('aria-pressed',String(active));
  });
  shell.nav.querySelectorAll('.tab-button').forEach(buttonNode=>{
    const target=buttonNode.dataset.route;
    const active=target===route||(target==='more'&&['world','profile','more'].includes(route));
    buttonNode.classList.toggle('is-active',active);
    buttonNode.setAttribute('aria-current',active?'page':'false');
  });
}
