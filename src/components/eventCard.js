import {el,button} from '../utils/dom.js';
import {eventChoiceMeta} from '../systems/event/eventEngine.js';

const STYLE={
  safe:{icon:'🛡️',color:'#248a3d',risk:'低风险',reward:'稳定'},
  professional:{icon:'✓',color:'#248a3d',risk:'低风险',reward:'信任'},
  team:{icon:'🤝',color:'#1677ff',risk:'低风险',reward:'关系'},
  technical:{icon:'🎯',color:'#1677ff',risk:'中风险',reward:'技术'},
  balanced:{icon:'⚖️',color:'#1677ff',risk:'中风险',reward:'均衡'},
  longterm:{icon:'🧠',color:'#8b5cf6',risk:'中风险',reward:'长期'},
  heart:{icon:'♥',color:'#d63384',risk:'中风险',reward:'士气'},
  negotiate:{icon:'💬',color:'#c46b12',risk:'中风险',reward:'谈判'},
  counter:{icon:'⚡',color:'#1677ff',risk:'中风险',reward:'速度'},
  aggressive:{icon:'🔥',color:'#d70015',risk:'高风险',reward:'高回报'},
  gamble:{icon:'🎲',color:'#d70015',risk:'高风险',reward:'爆发'},
  self:{icon:'✦',color:'#8b5cf6',risk:'中风险',reward:'个人'}
};
const CATEGORY_ICON={比赛:'⚽',训练:'⌁',转会:'↗',合同:'✍️',媒体:'🎙️',伤病:'✚',青训:'🌱',教练:'▦',队友:'🤝',球迷:'📣',国家队:'🏳️'};
function styleMeta(choice){return STYLE[choice.style]||STYLE.balanced}
function categoryIcon(event){
  const key=Object.keys(CATEGORY_ICON).find(x=>String(event.categoryCn||'').includes(x));
  return CATEGORY_ICON[key]||'◉';
}
function splitDescription(text=''){
  const parts=String(text).split(/(?<=[。！？])/).filter(Boolean);
  return{short:parts.slice(0,2).join('')||text,long:parts.slice(2).join('')};
}
export function createEventCard(event,{onChoose}={}){
  const wrap=el('div',{className:'v20-event-card'}),desc=splitDescription(event.description);
  const scene=el('section',{className:'v20-event-scene'});
  scene.style.setProperty('--event-color',event.pressure?.includes('高')?'#d70015':event.pressure?.includes('低')?'#248a3d':'#1677ff');
  scene.append(
    el('div',{className:'v20-event-scene__top'},[
      el('span',{className:'v20-event-scene__icon',text:categoryIcon(event),attrs:{'aria-hidden':'true'}}),
      el('div',{className:'tag-row'},[
        el('span',{className:'tag tag--accent',text:event.categoryCn}),
        el('span',{className:'tag',text:event.pressure}),
        el('span',{className:'tag',text:`${event.choices.length}种选择`})
      ])
    ]),
    el('h3',{text:event.title}),
    el('p',{className:'v20-event-description',text:desc.short})
  );
  if(desc.long){
    scene.append(el('details',{className:'v20-event-details'},[
      el('summary',{text:'查看完整情境'}),
      el('p',{className:'v20-event-description',text:desc.long})
    ]));
  }
  const choices=el('div',{className:'v20-event-choices'});
  event.choices.forEach(choice=>{
    const meta=styleMeta(choice),card=button('',{className:'v20-event-choice',onClick:()=>onChoose?.(choice)});
    card.style.setProperty('--choice-color',meta.color);
    card.append(
      el('span',{className:'v20-event-choice__icon',text:meta.icon,attrs:{'aria-hidden':'true'}}),
      el('span',{className:'v20-event-choice__copy'},[el('strong',{text:choice.text}),el('small',{text:choice.hint||'选择会立即写入存档，并可能影响后续剧情。'})]),
      el('span',{className:'v20-event-choice__assessment'},[el('span',{text:meta.risk}),el('b',{text:`${meta.reward} · ${eventChoiceMeta(choice)}`})])
    );
    choices.append(card);
  });
  wrap.append(scene,choices);
  return wrap;
}
