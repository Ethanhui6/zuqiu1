import {el,button} from '../utils/dom.js';
import {icon} from './icons.js';

export function ReferenceCard(children=[],{className='',tag='article'}={}){
  return el(tag,{className:`surface-card ${className}`.trim()},children);
}

export function ReferenceButton(label,{className='app-button primary',iconName='',...options}={}){
  const node=button(label,{className,...options});
  if(iconName)node.insertAdjacentHTML('afterbegin',icon(iconName,'sm'));
  return node;
}

export function ReferenceIconButton(iconName,{className='icon-button',...options}={}){
  const node=button('',{className, ...options, ariaLabel:options.ariaLabel||iconName});
  node.innerHTML=icon(iconName);
  return node;
}

export const ReferencePageHeader=(title,subtitle='',children=[])=>el('header',{className:'page-head'},[
  el('div',{},[el('h1',{className:'page-title',text:title}),subtitle?el('p',{className:'page-subtitle',text:subtitle}):null]),...children
]);
