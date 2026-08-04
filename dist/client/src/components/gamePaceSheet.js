import {AUTO_PAUSE_RULES,EVENT_ANIMATION_SPEEDS,PACE_MODES,SPEED_LEVELS} from '../app/config.js';
import {el,button} from '../utils/dom.js';
import {openSheet} from './sheet.js';
import {showToast} from './toast.js';
import {ensurePaceState,persistPacePreferences,setAutoPause,setPaceMode,setPaceOption,setSpeed} from '../systems/pace/paceSystem.js';

export function openGamePaceSheet({store}){
  const save=store.state;ensurePaceState(save);
  const content=el('div',{className:'pace-settings'});
  const speedGrid=el('div',{className:'pace-segment-grid pace-segment-grid--five',attrs:{role:'group','aria-label':'选择时间推进速度'}});
  const paceSelect=el('select',{className:'select-input',attrs:{'aria-label':'职业节奏模式'}});
  Object.values(PACE_MODES).forEach(mode=>paceSelect.append(el('option',{text:`${mode.name} · 单赛季约${mode.seasonMinutes}`,attrs:{value:mode.id,selected:mode.id===save.settings.pace.mode}})));
  paceSelect.addEventListener('change',()=>apply(state=>setPaceMode(state,paceSelect.value),'pace-mode',`职业节奏：${PACE_MODES[paceSelect.value].name}`));

  const eventSpeed=el('div',{className:'pace-segment-grid pace-segment-grid--three',attrs:{role:'group','aria-label':'普通事件动画速度'}});
  const speedButtons=new Map(),eventButtons=new Map();
  SPEED_LEVELS.forEach(item=>{
    const compact=item.id==='paused'?'暂停':item.id==='turbo'?'极速':item.label;
    const control=button(compact,{className:'pace-segment-button',pressed:item.id===save.settings.pace.speed,onClick:()=>apply(state=>setSpeed(state,item.id),'speed-changed',`当前速度：${item.label}`)});
    control.dataset.value=item.id;speedButtons.set(item.id,control);speedGrid.append(control);
  });
  Object.values(EVENT_ANIMATION_SPEEDS).forEach(item=>{
    const control=button(item.label,{className:'pace-segment-button',pressed:item.id===save.settings.pace.eventAnimationSpeed,onClick:()=>apply(state=>setPaceOption(state,'eventAnimationSpeed',item.id),'event-animation-speed',`普通事件动画：${item.label}`)});
    control.dataset.value=item.id;eventButtons.set(item.id,control);eventSpeed.append(control);
  });

  const automation=el('div',{className:'pace-toggle-list'},[
    toggleRow('自动推进普通训练','关闭后，推进时间会在每周训练前暂停。','autoTraining'),
    toggleRow('自动模拟普通比赛','关闭后，每场比赛都会等待你选择呈现方式。','autoMatch')
  ]);
  const pauseGrid=el('div',{className:'pace-toggle-list'});
  Object.entries(AUTO_PAUSE_RULES).forEach(([key,label])=>pauseGrid.append(toggleRow(`${label}自动暂停`,'出现该节点时停止快速推进，等待玩家处理。',key,true)));

  content.append(
    settingSection('职业节奏','决定普通内容的自动处理程度。',paceSelect),
    settingSection('时间推进速度','设置后立即生效，普通页面不再显示大型速度栏。',speedGrid),
    settingSection('普通事件动画速度','只改变演出时长，不改变已经确定的游戏结果。',eventSpeed),
    settingSection('自动处理', '让普通内容快速通过，关键事项仍由提醒系统提示。',automation),
    settingSection('关键节点暂停', '可以逐项决定哪些职业节点必须由你亲自处理。',pauseGrid)
  );

  function toggleRow(title,copy,key,isPause=false){
    const input=el('input',{attrs:{type:'checkbox','aria-label':title,checked:isPause?save.settings.pace.autoPause[key]!==false:save.settings.pace[key]!==false}});
    input.addEventListener('change',()=>apply(state=>isPause?setAutoPause(state,key,input.checked):setPaceOption(state,key,input.checked),isPause?'auto-pause':'pace-option',`${title}${input.checked?'已开启':'已关闭'}`));
    return el('label',{className:'pace-toggle-row'},[el('span',{},[el('strong',{text:title}),el('small',{text:copy})]),el('span',{className:'ios-switch'},[input,el('i')])]);
  }
  function apply(mutator,reason,message){
    store.update(state=>{mutator(state);persistPacePreferences(state)},reason);
    sync();showToast(message,{type:'success',duration:1500});
  }
  function sync(){
    const state=ensurePaceState(store.state);
    speedButtons.forEach((node,id)=>{const active=id===state.speed;node.classList.toggle('is-active',active);node.setAttribute('aria-pressed',String(active))});
    eventButtons.forEach((node,id)=>{const active=id===state.eventAnimationSpeed;node.classList.toggle('is-active',active);node.setAttribute('aria-pressed',String(active))});
  }
  sync();
  return openSheet({title:'游戏节奏',subtitle:'控制推进速度、自动处理和关键节点暂停。所有设置会写入当前存档。',content,size:'large'});
}

function settingSection(title,copy,content){
  return el('section',{className:'pace-settings-section'},[el('div',{className:'pace-settings-section__heading'},[el('h3',{text:title}),el('p',{text:copy})]),content]);
}
