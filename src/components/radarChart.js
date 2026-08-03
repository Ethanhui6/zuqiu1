import {ATTR_KEYS,ATTR_LABELS,POSITION_CONFIG} from '../app/config.js';
import {el} from '../utils/dom.js';
const NS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs={}){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n}
function points(values,radius=76,cx=100,cy=100){return values.map((v,i)=>{const a=-Math.PI/2+i*Math.PI/3;const ratio=Math.max(.08,Math.min(1,v/99));return`${cx+Math.cos(a)*radius*ratio},${cy+Math.sin(a)*radius*ratio}`}).join(' ')}
export function createRadarChart(attrs,position,{size=220,animated=true}={}){
  const keeper=POSITION_CONFIG[position]?.group==='keeper';const labels=keeper?ATTR_LABELS.keeper:ATTR_LABELS.outfield;const wrap=el('div',{className:'radar-wrap',attrs:{role:'img','aria-label':ATTR_KEYS.map(k=>`${labels[k]} ${attrs[k]}`).join('，')}});const svg=svgEl('svg',{viewBox:'0 0 200 200',width:size,height:size,class:'radar-chart'});
  for(let level=1;level<=5;level++){svg.append(svgEl('polygon',{points:points(ATTR_KEYS.map(()=>99*level/5)),class:'radar-grid'}))}
  ATTR_KEYS.forEach((key,i)=>{const a=-Math.PI/2+i*Math.PI/3;svg.append(svgEl('line',{x1:100,y1:100,x2:100+Math.cos(a)*76,y2:100+Math.sin(a)*76,class:'radar-axis'}));const t=svgEl('text',{x:100+Math.cos(a)*93,y:100+Math.sin(a)*93+4,class:'radar-label','text-anchor':'middle'});t.textContent=labels[key];svg.append(t)});
  const shape=svgEl('polygon',{points:animated?points(ATTR_KEYS.map(()=>8)):points(ATTR_KEYS.map(k=>attrs[k])),class:'radar-shape'});svg.append(shape);wrap.append(svg);
  if(animated)requestAnimationFrame(()=>requestAnimationFrame(()=>shape.setAttribute('points',points(ATTR_KEYS.map(k=>attrs[k])))));
  wrap.update=(next)=>shape.setAttribute('points',points(ATTR_KEYS.map(k=>next[k])));return wrap;
}
