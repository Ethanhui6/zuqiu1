import {APP_VERSION,NAV_ITEMS} from '../app/config.js';
import {el,button,icon} from '../utils/dom.js';
import {formatMoney} from '../utils/format.js';
export function createAppShell({onNavigate,onTheme,onSave}){
  const root=el('div',{className:'app-shell'});const header=el('header',{className:'app-header glass'});const main=el('main',{className:'page-container',attrs:{id:'page-container'}});const nav=el('nav',{className:'tab-bar glass',attrs:{'aria-label':'主要导航'}});
  const brand=el('div',{className:'header-brand'},[el('div',{className:'brand-ball',text:'⚽'}),el('div',{},[el('strong',{text:'绿茵浮沉'}),el('small',{text:`V${APP_VERSION} · 球员的一生`})])]);
  const actions=el('div',{className:'header-actions'},[button('◐',{className:'icon-button',ariaLabel:'切换外观',onClick:onTheme}),button('存',{className:'icon-button',ariaLabel:'手动保存',onClick:onSave})]);header.append(brand,actions);
  NAV_ITEMS.forEach(item=>{const b=button('',{className:'tab-button',ariaLabel:item.label,onClick:()=>onNavigate(item.id)});b.dataset.route=item.id;b.append(icon(item.icon),el('span',{text:item.label}));nav.append(b)});root.append(header,main,nav);return{root,header,main,nav,brand,actions};
}
export function updateShell(shell,save,club,route){shell.brand.querySelector('strong').textContent=save.player.name;shell.brand.querySelector('small').textContent=`${club.cn} · ${save.player.age}岁 · ${formatMoney(save.finance.marketValue)}`;shell.nav.querySelectorAll('.tab-button').forEach(b=>b.classList.toggle('is-active',b.dataset.route===route))}
