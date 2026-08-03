import {el,button} from '../utils/dom.js';

export function createGuidanceBanner({onActivate}={}){
  const actionButton=button('',{className:'guidance-banner',ariaLabel:'查看当前优先事项',onClick:()=>onActivate?.(actionButton.dataset.route||'career')});
  const icon=el('span',{className:'guidance-banner__icon',text:'✦',attrs:{'aria-hidden':'true'}});
  const copy=el('span',{className:'guidance-banner__copy'},[
    el('small',{className:'guidance-banner__eyebrow',text:'优先事项'}),
    el('strong',{className:'guidance-banner__title',text:'查看当前职业安排'}),
    el('span',{className:'guidance-banner__detail',text:'系统会在这里提示最值得先处理的内容。'})
  ]);
  const arrow=el('span',{className:'guidance-banner__arrow',text:'›',attrs:{'aria-hidden':'true'}});
  actionButton.append(icon,copy,arrow);
  return{root:actionButton,icon,eyebrow:copy.querySelector('.guidance-banner__eyebrow'),title:copy.querySelector('.guidance-banner__title'),detail:copy.querySelector('.guidance-banner__detail')};
}

export function updateGuidanceBanner(component,action){
  if(!component?.root||!action)return;
  const changed=component.root.dataset.actionId!==action.id;
  component.root.dataset.actionId=action.id;
  component.root.dataset.route=action.route;
  component.root.dataset.tone=action.tone||'normal';
  component.icon.textContent=action.icon||'✦';
  component.eyebrow.textContent=action.eyebrow||'下一步';
  component.title.textContent=action.title||'继续职业生涯';
  component.detail.textContent=action.detail||'';
  component.root.setAttribute('aria-label',`${component.eyebrow.textContent}：${component.title.textContent}`);
  if(changed){
    clearTimeout(component.refreshTimer);
    component.root.classList.remove('is-refreshing');
    void component.root.offsetWidth;
    component.root.classList.add('is-refreshing');
    component.refreshTimer=setTimeout(()=>component.root?.classList.remove('is-refreshing'),460);
  }
}

export function destroyGuidanceBanner(component){
  if(!component)return;
  clearTimeout(component.refreshTimer);
  component.refreshTimer=0;
  component.root?.classList.remove('is-refreshing');
}
