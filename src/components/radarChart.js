import {ATTR_KEYS,ATTR_LABELS,POSITION_CONFIG} from '../app/config.js';
import {calculateOvr} from '../systems/career/ovr.js';
import {el} from '../utils/dom.js';
const NS='http://www.w3.org/2000/svg';
const GROUP_COLOR={keeper:'#5b5bd6',defense:'#248a3d',midfield:'#1677ff',creative:'#8b5cf6',attack:'#d85b1d'};
function svgEl(tag,attrs={}){const node=document.createElementNS(NS,tag);for(const[key,value]of Object.entries(attrs))node.setAttribute(key,String(value));return node}
function coordinates(values,radius=70,cx=100,cy=100){return values.map((value,index)=>{const angle=-Math.PI/2+index*Math.PI/3;const ratio=Math.max(.08,Math.min(1,Number(value||0)/99));return{x:cx+Math.cos(angle)*radius*ratio,y:cy+Math.sin(angle)*radius*ratio}})}
function points(values,radius=70,cx=100,cy=100){return coordinates(values,radius,cx,cy).map(point=>`${point.x},${point.y}`).join(' ')}
function grade(value){if(value>=90)return'S';if(value>=82)return'A';if(value>=74)return'B';if(value>=66)return'C';return'D'}
export function radarValues(attrs){return ATTR_KEYS.map(key=>Number(attrs[key]||0))}
export function createRadarChart(attrs,position,{size=220,animated=true,caption=true}={}){
  const wrap=el('div',{className:'radar-wrap'}),svg=svgEl('svg',{viewBox:'0 0 200 200',width:size,height:size,class:'radar-chart'});
  const title=svgEl('title');svg.append(title);
  for(let level=1;level<=5;level++)svg.append(svgEl('polygon',{points:points(ATTR_KEYS.map(()=>99*level/5)),class:'radar-grid'}));
  const labelNodes=[],valueNodes=[],pointNodes=[];
  ATTR_KEYS.forEach((key,index)=>{
    const angle=-Math.PI/2+index*Math.PI/3;
    svg.append(svgEl('line',{x1:100,y1:100,x2:100+Math.cos(angle)*70,y2:100+Math.sin(angle)*70,class:'radar-axis'}));
    const label=svgEl('text',{x:100+Math.cos(angle)*91,y:100+Math.sin(angle)*91-1,class:'radar-label','text-anchor':'middle'});
    const value=svgEl('text',{x:100+Math.cos(angle)*91,y:100+Math.sin(angle)*91+11,class:'radar-value','text-anchor':'middle'});
    labelNodes.push(label);valueNodes.push(value);svg.append(label,value);
  });
  const initial=animated?ATTR_KEYS.map(()=>8):ATTR_KEYS.map(key=>attrs[key]);
  const shape=svgEl('polygon',{points:points(initial),class:'radar-shape'});svg.append(shape);
  coordinates(initial).forEach(point=>{const dot=svgEl('circle',{cx:point.x,cy:point.y,r:2.8,class:'radar-point'});pointNodes.push(dot);svg.append(dot)});
  const center=svgEl('circle',{cx:100,cy:100,r:17,class:'radar-center'}),gradeNode=svgEl('text',{x:100,y:105,class:'radar-grade'});svg.append(center,gradeNode);
  wrap.append(svg);
  const captionNode=caption?el('div',{className:'radar-caption'}):null;if(captionNode)wrap.append(captionNode);
  function update(nextAttrs,nextPosition=position){
    const config=POSITION_CONFIG[nextPosition]||POSITION_CONFIG.ST,keeper=config.group==='keeper',labels=keeper?ATTR_LABELS.keeper:ATTR_LABELS.outfield,values=radarValues(nextAttrs),coords=coordinates(values),ovr=calculateOvr(nextAttrs,nextPosition),color=GROUP_COLOR[config.group]||'#1677ff';
    wrap.style.setProperty('--radar-color',color);wrap.dataset.group=config.group;
    const aria=ATTR_KEYS.map(key=>`${labels[key]} ${nextAttrs[key]}`).join('，');wrap.setAttribute('role','img');wrap.setAttribute('aria-label',`${config.name}能力图：${aria}，位置总评 ${ovr}`);title.textContent=`${config.name}能力图，${aria}，位置总评 ${ovr}`;
    labelNodes.forEach((node,index)=>node.textContent=labels[ATTR_KEYS[index]]);valueNodes.forEach((node,index)=>node.textContent=String(values[index]));
    shape.setAttribute('points',points(values));pointNodes.forEach((node,index)=>{node.setAttribute('cx',coords[index].x);node.setAttribute('cy',coords[index].y)});
    gradeNode.textContent=grade(ovr);if(captionNode){captionNode.replaceChildren(el('strong',{text:`${config.name} · ${ovr}`}),document.createTextNode(`　能力等级 ${grade(ovr)}`));}
  }
  if(animated){requestAnimationFrame(()=>requestAnimationFrame(()=>update(attrs,position)))}else update(attrs,position);
  wrap.update=update;return wrap;
}
