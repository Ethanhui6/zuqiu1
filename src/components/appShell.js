import {APP_VERSION,NAV_ITEMS} from '../app/config.js';
import {el,button,icon} from '../utils/dom.js';
import {formatMoney} from '../utils/format.js';

export function createAppShell({onNavigate,onTheme,onSave,onBack,onHome}){
  const root=el('div',{className:'app-shell'});
  const header=el('header',{className:'app-header glass'});
  const main=el('main',{className:'page-container',attrs:{id:'page-container',tabindex:'-1'}});
  const nav=el('nav',{className:'tab-bar glass',attrs:{'aria-label':'主要导航'}});

  const left=el('div',{className:'header-side header-side--left'});
  const back=button('',{className:'header-nav-button header-back',ariaLabel:'返回生涯首页',onClick:onBack});
  back.append(el('span',{text:'←',attrs:{'aria-hidden':'true'}}),el('span',{className:'header-nav-label',text:'生涯首页'}));
  left.append(back);

  const brand=button('',{className:'header-brand',ariaLabel:'返回生涯首页',onClick:onHome});
  brand.append(
    el('div',{className:'brand-ball',text:'⚽'}),
    el('div',{},[el('strong',{text:'绿茵浮沉'}),el('small',{text:`V${APP_VERSION} · 球员的一生`})])
  );

  const right=el('div',{className:'header-side header-side--right header-actions'});
  const home=button('⌂',{className:'header-nav-button header-home',ariaLabel:'返回主页',onClick:onHome});
  const theme=button('◐',{className:'icon-button theme-action',ariaLabel:'切换外观',onClick:onTheme});
  const save=button('存',{className:'icon-button save-action',ariaLabel:'手动保存',onClick:onSave});
  right.append(home,theme,save);
  header.append(left,brand,right);

  NAV_ITEMS.forEach(item=>{
    const navButton=button('',{className:'tab-button',ariaLabel:item.label,onClick:()=>onNavigate(item.id)});
    navButton.dataset.route=item.id;
    navButton.append(icon(item.icon),el('span',{text:item.label}));
    nav.append(navButton);
  });
  root.append(header,main,nav);
  return{root,header,main,nav,brand,actions:right,back,home,theme,save};
}

export function updateShell(shell,save,club,route){
  shell.brand.querySelector('strong').textContent=save.player.name;
  shell.brand.querySelector('small').textContent=`${club.cn} · ${save.player.age}岁 · ${formatMoney(save.finance.marketValue)}`;
  const away=route!=='career';
  shell.back.hidden=!away;
  shell.home.hidden=!away;
  shell.header.dataset.route=route;
  shell.nav.querySelectorAll('.tab-button').forEach(buttonNode=>{
    const active=buttonNode.dataset.route===route;
    buttonNode.classList.toggle('is-active',active);
    buttonNode.setAttribute('aria-current',active?'page':'false');
  });
}
