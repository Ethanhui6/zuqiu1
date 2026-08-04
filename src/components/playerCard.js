import {POSITION_CONFIG} from '../app/config.js';
import {el} from '../utils/dom.js';
import {formatMoney,formatNumber} from '../utils/format.js';
import {createRadarChart} from './radarChart.js';
import {totalFans} from '../systems/fan/fanSystem.js';
import {careerStage} from '../systems/career/ovr.js';

function initials(name){return String(name||'球').slice(-2)}
function colorFrom(text){let h=0;for(const c of String(text))h=(h*31+c.charCodeAt(0))%360;return`hsl(${h} 72% 54%)`}
export function createPlayerCard(save,club,{variant='compact'}={}){
  const p=save.player,detail=variant==='detail';
  const article=el('article',{className:`v20-player-card v20-player-card--${detail?'detail':'compact'}`});article.style.setProperty('--team-color',colorFrom(club.id));article.dataset.rarity=p.talent.rarity;
  if(save.status.injury)article.dataset.injured='true';
  const top=el('div',{className:'v20-player-card__top'},[
    el('div',{className:'v20-player-rating'},[el('strong',{text:p.ovr}),el('span',{text:POSITION_CONFIG[p.position]?.name||p.position}),el('small',{text:`潜力 ${p.potential}`})]),
    el('div',{className:'v20-player-card__avatar',text:initials(p.displayName||p.name),attrs:{'aria-label':`${p.name}的生成头像`}})
  ]);
  const title=el('div',{className:'v20-player-card__identity'},[el('h2',{text:p.displayName||p.name}),el('p',{text:`${p.nation} · ${p.age}岁 · ${club.cn} · ${save.career.squadLevel} · ${p.number}号`})]);
  const facts=el('div',{className:'v20-player-card__facts'},[
    fact('身价',formatMoney(save.finance.marketValue)),fact('生涯阶段',careerStage(p.age,save.career.squadLevel)),fact('位置',POSITION_CONFIG[p.position]?.name||p.position),fact('潜力',p.potential),
    ...(detail?[fact('周薪',formatMoney(save.finance.weeklyWage)),fact('合同',`${save.career.contract.years}年`),fact('粉丝',formatNumber(totalFans(save))),fact('赛季数据',`${save.career.seasonStats.goals}球 · ${save.career.seasonStats.assists}助`)]:[])
  ]);
  const tags=el('div',{className:'v20-player-card__tags'},[el('span',{text:p.talent.rarity}),el('span',{text:p.style}),el('span',{text:save.career.teamRole}),el('span',{text:save.status.injury?'伤病恢复中':'状态可用'})]);
  article.append(top,title,detail?el('div',{className:'v20-player-card__detail'},[createRadarChart(p.attrs,p.position,{size:210}),facts]):facts,tags);return article;
}
function fact(label,value){return el('div',{className:'v20-player-fact'},[el('small',{text:label}),el('strong',{text:String(value)})])}
