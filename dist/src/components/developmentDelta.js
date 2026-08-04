import {el} from '../utils/dom.js';

export function createDevelopmentDelta({title,items=[],emptyText='暂无变化'}={}){
  const section=el('section',{className:'v20-development-delta'},[el('h3',{text:title||'成长变化'})]);
  if(!items.length){section.append(el('p',{className:'v20-development-delta__empty',text:emptyText}));return section}
  section.append(el('div',{className:'v20-development-delta__items'},items.map(item=>el('div',{className:`v20-development-delta__item v20-development-delta__item--${item.tone||'neutral'}`},[el('span',{text:item.label}),el('strong',{text:String(item.value)})]))));
  return section;
}
