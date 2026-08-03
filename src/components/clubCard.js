import {el,button} from '../utils/dom.js';
import {formatMoney} from '../utils/format.js';
import {createClubCrest} from './clubCrest.js';

function stars(value=50){
  const count=Math.max(1,Math.min(5,Math.round(Number(value)/20)));
  return `${'★'.repeat(count)}${'☆'.repeat(5-count)}`;
}
function opportunity(value=50){const n=Number(value||0);if(n>=78)return'很多';if(n>=60)return'较多';if(n>=42)return'中等';return'较少'}
function fitText(club,position){if(position&&club.needs?.includes(position))return'位置正缺人';if(Number(club.youthUsage)>=70)return'年轻球员机会较多';return club.tactic||'体系稳定'}
function safeLeague(club){return club.leagueCn||club.leagueNative||'联赛未标注'}

export function createAcademyClubCard(club,offer,{selected=false,position='',onSelect}={}){
  const card=button('',{className:`club-select-card ${selected?'is-selected':''}`,onClick:onSelect});
  card.setAttribute('aria-pressed',String(selected));
  card.append(
    createClubCrest(club,{size:'normal'}),
    el('span',{className:'club-card__identity'},[
      el('strong',{className:'club-card__name',text:club.cn}),
      el('small',{className:'club-card__sub',text:`${club.country} · ${safeLeague(club)} · ${offer.squad}`}),
      el('span',{className:'club-card__tagline',text:fitText(club,position)})
    ]),
    el('span',{className:'club-select-card__check',text:selected?'✓':'',attrs:{'aria-hidden':'true'}}),
    el('span',{className:'club-card__meta club-card__meta--academy'},[
      compactMetric('青训',stars(club.youth)),compactMetric('年轻机会',opportunity(club.youthUsage)),compactMetric('青年周薪',formatMoney(offer.weeklyWage)),compactMetric('培养角色',offer.role||'青年队培养')
    ])
  );
  return card;
}

export function createWorldClubCard(club,{playerPosition='',onOpen}={}){
  const card=button('',{className:'club-card',onClick:onOpen});
  card.append(
    el('span',{className:'club-card__header'},[
      createClubCrest(club,{size:'normal'}),
      el('span',{className:'club-card__identity'},[
        el('strong',{className:'club-card__name',text:club.cn}),
        el('small',{className:'club-card__sub',text:`${club.country} · ${safeLeague(club)}`}),
        el('span',{className:'club-card__tagline',text:club.tactic||'均衡战术'})
      ]),
      el('span',{className:'club-rating'},[el('strong',{text:String(club.rep||'—')}),el('small',{text:'实力'})])
    ]),
    el('span',{className:'club-card__meta'},[
      compactMetric('青训等级',stars(club.youth)),compactMetric('年轻机会',opportunity(club.youthUsage)),compactMetric('适配提示',fitText(club,playerPosition)),compactMetric('位置需求',(club.needs||[]).slice(0,2).join('、')||'暂无')
    ]),
    el('span',{className:'club-card__footer'},[
      el('span',{className:'tag',text:club.recruitment||'综合招募'}),
      el('span',{className:'club-card__action',text:'查看详情 ›'})
    ])
  );
  return card;
}

function compactMetric(label,value){return el('span',{className:'club-meta-item'},[el('small',{text:label}),el('strong',{text:String(value)})])}
export {createClubCrest} from './clubCrest.js';
