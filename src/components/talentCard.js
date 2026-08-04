import {ATTR_LABELS,POSITION_CONFIG} from '../app/config.js';
import {el,button} from '../utils/dom.js';

const THEMES={
  普通:{icon:'◇',stars:2,color:'#8e8e93'},
  优秀:{icon:'✦',stars:3,color:'#30a14e'},
  稀有:{icon:'◆',stars:4,color:'#1677ff'},
  精英:{icon:'♛',stars:4,color:'#8b5cf6'},
  传奇:{icon:'★',stars:5,color:'#c58a00'},
  隐藏:{icon:'✹',stars:5,color:'#d63b28'}
};
function theme(talent){return THEMES[talent.rarity]||THEMES.普通}
function potentialRange(value){
  const center=Number(value||80);
  return`${Math.max(60,center-3)}–${Math.min(99,center+2)}`;
}
function topTraits(attrs,position){
  const labels=POSITION_CONFIG[position]?.group==='keeper'?ATTR_LABELS.keeper:ATTR_LABELS.outfield;
  return Object.entries(attrs||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([key,value])=>`${labels[key]||key}基础 ${value>=78?'突出':value>=68?'良好':'可塑'}`);
}
function quote(talent,style){
  if(talent.rarity==='传奇')return`“这是极少见的成长轮廓，但只有稳定出场与正确培养才能兑现。”`;
  if(talent.rarity==='精英')return`“关键能力已经显出上限，${style}路线值得重点培养。”`;
  if(talent.rarity==='优秀')return`“基础完成度高于同龄球员，发展方向清楚。”`;
  return`“没有耀眼标签，但训练态度和比赛选择仍可能改变上限。”`;
}
export function createTalentCard(talent,{selected=false,position='ST',style='',attrs={},onSelect}={}){
  const t=theme(talent),stars=`${'★'.repeat(t.stars)}${'☆'.repeat(5-t.stars)}`;
  const card=button('',{className:`v20-talent-card ${selected?'is-selected':''}`,onClick:onSelect});
  card.style.setProperty('--rarity-color',talent.color||t.color);
  card.dataset.rarity=talent.rarity;
  card.setAttribute('aria-pressed',String(selected));
  card.append(
    el('div',{className:'v20-talent-card__top'},[
      el('span',{className:'talent-emblem',text:t.icon,attrs:{'aria-hidden':'true'}}),
      el('span',{className:'rarity-badge',text:talent.rarity}),
      el('span',{className:'talent-stars',text:stars,attrs:{'aria-label':`${t.stars}星天赋`}})
    ]),
    el('h3',{text:talent.name}),
    el('p',{className:'v20-talent-card__subtitle',text:`${POSITION_CONFIG[position]?.name||position} · ${style}`}),
    el('div',{className:'talent-potential'},[
      el('div',{},[el('small',{text:'潜力区间'}),el('strong',{text:potentialRange(talent.potential)})]),
      el('div',{},[el('small',{text:'成长效率'}),el('strong',{text:`×${Number(talent.growthMultiplier||1).toFixed(2)}`})])
    ]),
    el('ul',{className:'scout-points'},topTraits(attrs,position).map(text=>el('li',{text}))),
    el('div',{className:'scout-risk'},[el('strong',{text:'风险：'}),document.createTextNode(talent.cost||'需要稳定比赛时间才能兑现成长。')]),
    el('p',{className:'scout-quote',text:quote(talent,style)})
  );
  return card;
}
export function talentTheme(talent){return theme(talent)}
export function talentPotentialRange(talent){return potentialRange(talent.potential)}
export function talentStrengths(attrs,position){return topTraits(attrs,position)}
export function talentScoutQuote(talent,style){return quote(talent,style)}
