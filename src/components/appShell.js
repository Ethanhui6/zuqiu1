import {NAV_ITEMS} from '../app/config.js';
import {el,button} from '../utils/dom.js';
import {icon} from './icons.js';
import {formatMoney} from '../utils/format.js';
import {getSpeed} from '../systems/pace/paceSystem.js';
import {navigationAttention} from '../systems/attention/attentionManager.js';

const ICONS={career:'home',match:'match',training:'training',transfer:'transfer',more:'settings'};

export function ReferenceAppShell({onNavigate,onSave,onBack,onHome,onPaceSettings}={}){
  const root=el('div',{className:'app-shell',attrs:{'data-app-shell':'true'}});
  const header=el('header',{className:'app-topbar',attrs:{'data-app-region':'header'}});
  const identity=button('',{className:'identity',ariaLabel:'返回生涯首页',onClick:onHome});
  identity.append(el('span',{className:'avatar',text:'18',attrs:{'aria-hidden':'true'}}),el('span',{className:'identity-copy'},[
    el('strong',{className:'identity-name',text:'球员'}),el('small',{className:'identity-meta',text:'青年队 · 18岁 · €650K'})
  ]));
  const actions=el('div',{className:'top-actions'});
  const pace=button('',{className:'app-button ghost',ariaLabel:'打开职业节奏设置',onClick:onPaceSettings});
  pace.innerHTML=`${icon('fast','sm')}<span data-speed>1倍</span>`;
  const save=button('',{className:'icon-button top-save',ariaLabel:'保存当前生涯',onClick:()=>{
    save.classList.remove('success-pop');void save.offsetWidth;save.classList.add('success-pop');onSave?.();
  }});
  save.innerHTML=icon('save');
  const pause=button('',{className:'icon-button',ariaLabel:'暂停推进',onClick:()=>onPaceSettings?.()});
  pause.innerHTML=icon('pause');
  actions.append(pause,pace,save);header.append(identity,actions);

  const main=el('main',{className:'app-main',attrs:{id:'page-container',tabindex:'-1','data-app-region':'main'}});
  const nav=el('nav',{className:'glass-tabbar',attrs:{'aria-label':'主导航','data-app-region':'navigation'}});
  NAV_ITEMS.forEach(item=>{
    const navButton=button('',{className:'tab-item',ariaLabel:item.label,onClick:()=>onNavigate?.(item.id)});
    navButton.dataset.route=item.id;
    navButton.innerHTML=`${icon(ICONS[item.id]||'settings')}<span class="tab-label">${item.label}</span><span class="tab-badge" hidden></span>`;
    nav.append(navButton);
  });
  const overlayRoot=el('div',{attrs:{id:'overlay-root','data-app-region':'overlays','aria-live':'off'}});
  const toastRoot=el('div',{attrs:{id:'toast-root','data-app-region':'toasts','aria-live':'polite'}});
  root.append(header,main,nav,overlayRoot,toastRoot);
  return{root,header,main,nav,overlayRoot,toastRoot,identity,save,pace,pause,destroy(){}};
}

export const createAppShell=ReferenceAppShell;

export function updateShell(shell,save,club,route,repo){
  const player=save.player||{},name=player.displayName||player.name||'球员';
  shell.identity.querySelector('.avatar').textContent=String(player.number||name.slice(-2));
  shell.identity.querySelector('.identity-name').textContent=name;
  shell.identity.querySelector('.identity-meta').textContent=`${club?.cn||'青年队'} · ${player.age||18}岁 · ${formatMoney(save.finance?.marketValue||0)}`;
  const speed=getSpeed(save),speedNode=shell.pace.querySelector('[data-speed]');
  if(speedNode)speedNode.textContent=speed.id==='turbo'?'极速':speed.label;
  shell.pace.setAttribute('aria-label',`当前职业节奏${speed.label}，打开设置`);
  const alerts=navigationAttention(save,repo);
  shell.nav.querySelectorAll('[data-route]').forEach(node=>{
    const target=node.dataset.route,active=target===route||(target==='more'&&['world','profile','rankings','more'].includes(route));
    node.classList.toggle('active',active);node.setAttribute('aria-current',active?'page':'false');
    const badge=node.querySelector('.tab-badge'),count=Math.max(0,Number(alerts[target]||0));
    badge.hidden=count<=0;badge.textContent=count>9?'9+':String(count);
  });
}
