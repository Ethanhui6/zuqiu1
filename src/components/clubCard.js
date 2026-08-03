import {el,button} from '../utils/dom.js';
import {formatMoney} from '../utils/format.js';

function hueFor(value='club'){
  let hash=0;
  for(const char of String(value))hash=(hash*33+char.charCodeAt(0))%360;
  return hash;
}
function clubColor(club){return `hsl(${hueFor(club.id||club.cn)} 62% 46%)`}
function stars(value=50){
  const count=Math.max(1,Math.min(5,Math.round(Number(value)/20)));
  return `${'★'.repeat(count)}${'☆'.repeat(5-count)}`;
}
function opportunity(value=50){
  const n=Number(value||0);
  if(n>=78)return'很多';
  if(n>=60)return'较多';
  if(n>=42)return'中等';
  return'较少';
}
function wageLevel(value=50){
  const n=Number(value||0);
  if(n>=82)return'顶级';
  if(n>=64)return'较高';
  if(n>=42)return'中等';
  return'基础';
}
function fitText(club,position){
  if(position&&club.needs?.includes(position))return'位置正缺人';
  if(Number(club.youthUsage)>=70)return'适合年轻球员';
  return club.tactic||'体系稳定';
}
export function createClubCrest(club,{size='normal'}={}){
  const crest=el('span',{className:`club-crest ${size==='small'?'club-crest--small':size==='large'?'club-crest--large':''}`,text:club.code||club.cn?.slice(0,2)||'队',attrs:{'aria-hidden':'true'}});
  crest.style.setProperty('--club-color',clubColor(club));
  return crest;
}
export function createAcademyClubCard(club,offer,{selected=false,position='',onSelect}={}){
  const card=button('',{className:`club-select-card ${selected?'is-selected':''}`,onClick:onSelect});
  card.style.setProperty('--club-color',clubColor(club));
  card.setAttribute('aria-pressed',String(selected));
  card.append(
    createClubCrest(club),
    el('div',{className:'club-card__identity'},[
      el('h3',{text:club.cn}),
      el('p',{text:`${club.country} · ${club.leagueCn} · ${offer.squad}`}),
      el('div',{className:'club-card__tags'},[
        el('span',{className:'club-mini-tag',text:`青训 ${stars(club.youth)}`}),
        el('span',{className:'club-mini-tag',text:club.tactic}),
        el('span',{className:'club-mini-tag',text:`机会 ${opportunity(club.youthUsage)}`}),
        el('span',{className:'club-mini-tag',text:fitText(club,position)})
      ])
    ]),
    el('div',{className:'club-select-card__side'},[
      el('strong',{text:formatMoney(offer.weeklyWage)}),
      el('small',{text:'青年周薪'}),
      el('small',{text:`发展 ${stars((club.youth+club.youthUsage)/2)}`})
    ])
  );
  return card;
}
export function createWorldClubCard(club,{playerPosition='',onOpen}={}){
  const card=button('',{className:'glass-card club-card',onClick:onOpen});
  card.style.setProperty('--club-color',clubColor(club));
  card.append(
    el('div',{className:'club-card__header'},[
      createClubCrest(club,{size:'small'}),
      el('div',{className:'club-card__identity'},[el('h3',{text:club.cn}),el('p',{text:`${club.country} · ${club.leagueCn}`})]),
      el('div',{className:'club-card__rating'},[el('strong',{text:String(club.rep)}),el('small',{text:'综合实力'})])
    ]),
    el('div',{className:'club-card__meta'},[
      metric('青训',stars(club.youth)),
      metric('年轻机会',opportunity(club.youthUsage)),
      metric('球队风格',club.tactic),
      metric('工资水平',wageLevel(club.finance))
    ]),
    el('div',{className:'club-card__fit'},[
      el('span',{text:'发展适配'}),
      el('strong',{text:fitText(club,playerPosition)})
    ])
  );
  return card;
}
function metric(label,value){return el('div',{},[el('small',{text:label}),el('strong',{text:String(value)})])}
