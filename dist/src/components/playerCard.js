import {POSITION_CONFIG} from '../app/config.js';
import {el} from '../utils/dom.js';
import {formatMoney,formatNumber} from '../utils/format.js';
import {createRadarChart} from './radarChart.js';
import {totalFans} from '../systems/fan/fanSystem.js';

function initials(name){return String(name||'球').slice(-2)}
function colorFrom(text){let h=0;for(const c of String(text))h=(h*31+c.charCodeAt(0))%360;return`hsl(${h} 72% 54%)`}
export function createPlayerCard(save,club,{compact=false}={}){
  const p=save.player;const article=el('article',{className:`player-card ${compact?'player-card--compact':''}`});article.style.setProperty('--team-color',colorFrom(club.id));article.dataset.rarity=p.talent.rarity;
  if(save.status.injury)article.dataset.injured='true';
  const top=el('div',{className:'player-card__top'},[
    el('div',{className:'rating-block'},[el('strong',{text:p.ovr}),el('span',{text:POSITION_CONFIG[p.position]?.name||p.position}),el('small',{text:`潜力 ${p.potential}`})]),
    el('div',{className:'player-avatar',text:initials(p.displayName),attrs:{'aria-label':`${p.name}的生成头像`}})
  ]);
  const title=el('div',{className:'player-card__identity'},[el('h2',{text:p.displayName}),el('p',{text:`${p.nation} · ${p.age}岁 · ${club.cn} · ${save.career.squadLevel} · ${p.number}号`})]);
  const middle=el('div',{className:'player-card__middle'},[createRadarChart(p.attrs,p.position,{size:compact?170:210}),el('div',{className:'player-card__facts'},[
    fact('身价',formatMoney(save.finance.marketValue)),fact('周薪',formatMoney(save.finance.weeklyWage)),fact('合同',`${save.career.contract.years}年`),fact('粉丝',formatNumber(totalFans(save))),fact('社交关注',formatNumber(save.fans.social)),fact('商业价值',`${save.fans.commercialValue}/100`),fact('赛季数据',`${save.career.seasonStats.goals}球 · ${save.career.seasonStats.assists}助`),fact('奖杯',String(save.career.careerStats.titles))
  ])]);
  const tags=el('div',{className:'tag-row'},[el('span',{className:'tag tag--accent',text:p.talent.rarity}),el('span',{className:'tag',text:p.style}),el('span',{className:'tag',text:save.career.teamRole}),save.status.injury?el('span',{className:'tag tag--danger',text:'伤病恢复中'}):el('span',{className:'tag tag--success',text:'状态可用'})]);
  article.append(top,title,middle,tags);return article;
}
function fact(label,value){return el('div',{className:'mini-fact'},[el('small',{text:label}),el('strong',{text:value})])}
