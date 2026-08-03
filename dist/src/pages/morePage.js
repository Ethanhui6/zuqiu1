import {el,button,clear} from '../utils/dom.js';
import {getPaceMode,getSpeed} from '../systems/pace/paceSystem.js';

export function renderMorePage(container,ctx){
  clear(container);
  const save=ctx.store.state,pace=getPaceMode(save),speed=getSpeed(save);
  const page=el('section',{className:'page more-page'});
  page.append(
    el('header',{className:'page-title'},[
      el('div',{},[
        el('span',{className:'eyebrow',text:'更多内容'}),
        el('h1',{text:'世界、成就与设置'}),
        el('p',{text:'次要入口集中在这里，底部导航只保留最常用的五项操作。'})
      ])
    ])
  );
  const grid=el('div',{className:'more-menu-grid'});
  const items=[
    {action:'pace',icon:'⏱',title:'游戏节奏',copy:`${pace.name} · 当前${speed.id==='turbo'?'极速':speed.label}，管理自动模拟和暂停规则。`,status:speed.id==='paused'?'已暂停':speed.id==='turbo'?'极速':speed.label},
    {route:'world',icon:'◎',title:'球队世界',copy:'搜索俱乐部、查看联赛与青训环境。'},
    {route:'rankings',icon:'♜',title:'生涯排行榜',copy:'比较本地存档，提交服务器验证的世界排名。'},
    {route:'profile',icon:'●',title:'我的生涯',copy:'查看职业数据、成就、关系和存档设置。'}
  ];
  items.forEach(item=>grid.append(button('',{className:'more-menu-card',onClick:()=>item.action==='pace'?ctx.openPaceSettings?.():ctx.navigate(item.route)},[
    el('span',{className:'more-menu-icon',text:item.icon,attrs:{'aria-hidden':'true'}}),
    el('span',{className:'more-menu-copy'},[el('strong',{text:item.title}),el('small',{text:item.copy})]),
    item.status?el('span',{className:'more-menu-status',text:item.status}):el('span',{className:'more-menu-arrow',text:'›',attrs:{'aria-hidden':'true'}})
  ])));
  page.append(grid);
  container.append(page);
  return()=>{};
}
