import {el,button,clear} from '../utils/dom.js';
import {getPaceMode,getSpeed} from '../systems/pace/paceSystem.js';
import {openSheet,closeSheet} from '../components/sheet.js';
import {openFacilityCenter,openDataAnalysis,openMedicalCenter,openLockerRoom,openHonoursRoom} from '../components/facilityCenterSheet.js';
import {showToast} from '../components/toast.js';
import {saveManager} from '../services/storage/saveManager.js';
import {APP_VERSION} from '../app/config.js';
import {generateStateMessages,markMessageRead,unreadMessages} from '../systems/messages/messageCenterSystem.js';

const GROUPS=[
  {title:'游戏与世界',items:[
    {id:'pace',icon:'◷',title:'游戏节奏',copy:'推进模式、自动模拟和关键节点暂停'},
    {route:'world',icon:'◎',title:'球队世界',copy:'从世界地图进入国家、联赛和球队'},
    {route:'rankings',icon:'♜',title:'生涯排行榜',copy:'比较本地存档和已认证世界成绩'},
    {route:'profile',icon:'●',title:'我的生涯',copy:'职业数据、关系、成就和生涯档案'},
    {id:'messages',icon:'◉',title:'消息中心',copy:'查看教练、队友、经纪人和俱乐部消息'}
  ]},
  {title:'球队与设施',items:[
    {id:'facilities',icon:'▦',title:'生涯数据中心',copy:'能力分析、身体记录、球队关系和荣誉'},
    {id:'analysis',icon:'▥',title:'数据分析',copy:'能力、评分、体能、信任和粉丝趋势'},
    {id:'honours',icon:'♢',title:'荣誉室',copy:'奖杯、成就、纪录和代表比赛'}
  ]},
  {title:'存档与账户',items:[
    {id:'save',icon:'✓',title:'保存当前生涯',copy:'立即写入当前存档槽和本地备份'},
    {id:'slots',icon:'▤',title:'多存档管理',copy:'返回存档选择页，切换或新建生涯'},
    {id:'export',icon:'⇩',title:'导出存档',copy:'下载可迁移的JSON存档文件'},
    {id:'import',icon:'⇧',title:'导入存档',copy:'校验并导入其他设备的生涯存档'}
  ]},
  {title:'显示与声音',items:[
    {id:'motion',icon:'≈',title:'动画与动态效果',copy:'动画等级、减少动态效果和数字滚动'},
    {id:'appearance',icon:'☼',title:'显示模式',copy:'当前版本统一使用精致浅色体育界面'},
    {id:'feedback',icon:'⌁',title:'声音与触感',copy:'管理音效和轻量触感反馈'}
  ]},
  {title:'通用',items:[
    {id:'privacy',icon:'◌',title:'隐私与数据',copy:'本地存档、公开排名和数据使用说明'},
    {id:'help',icon:'?',title:'帮助与规则',copy:'职业节奏、存档恢复和玩法说明'},
    {id:'updates',icon:'↻',title:'更新日志',copy:`当前版本 V${APP_VERSION}`},
    {id:'about',icon:'i',title:'关于游戏',copy:'版本、构建和数据说明'}
  ]}
];

export function renderMorePage(container,ctx){
  clear(container);
  const {store,repo}=ctx,save=store.state,pace=getPaceMode(save),speed=getSpeed(save),club=repo.getClub(save.career.clubId);
  const page=el('section',{className:'page v20-more-page'});
  page.append(el('header',{className:'v20-page-intro'},[
    el('span',{className:'eyebrow',text:'次级功能中心'}),
    el('h1',{text:'世界、成就与设置'}),
    el('p',{text:'常用职业操作留在底部导航，设施、存档和详细设置集中在这里。'})
  ]));
  for(const group of GROUPS){
    const section=el('section',{className:'v20-settings-group'},[el('h2',{text:group.title})]);
    const list=el('div',{className:'v20-settings-list'});
    for(const item of group.items){
      const status=statusFor(item.id,save,pace,speed);
      list.append(button('',{className:'v20-settings-row',onClick:()=>handle(item)},[
        el('span',{className:'v20-settings-icon',text:item.icon,attrs:{'aria-hidden':'true'}}),
        el('span',{className:'v20-settings-copy'},[
          el('strong',{text:item.title}),
          el('small',{text:item.copy})
        ]),
        status?el('span',{className:'v20-settings-status',text:status}):null,
        el('span',{className:'v20-settings-arrow',text:'›',attrs:{'aria-hidden':'true'}})
      ]));
    }
    section.append(list);page.append(section);
  }
  page.append(el('footer',{className:'v20-version-footer'},[
    el('strong',{text:`绿茵浮沉 V${APP_VERSION}`}),
    el('span',{text:`存档结构 ${save.schemaVersion} · ${club.cn}`})
  ]));
  container.append(page);

  async function handle(item){
    if(item.route){ctx.navigate(item.route);return}
    const shared={store,repo,ctx};
    if(item.id==='pace'){ctx.openPaceSettings?.();return}
    if(item.id==='facilities'){openFacilityCenter(shared);return}
    if(item.id==='analysis'){openDataAnalysis(shared);return}
    if(item.id==='honours'){openHonoursRoom(shared);return}
    if(item.id==='save'){store.saveNow();showToast('当前生涯已保存',{type:'success'});return}
    if(item.id==='slots'){ctx.onReturnToSlots?.();return}
    if(item.id==='export'){saveManager.export(store.state);showToast('存档文件正在下载',{type:'success'});return}
    if(item.id==='import'){openImport(store,ctx);return}
    if(item.id==='motion'){openMotionSettings(store);return}
    if(item.id==='appearance'){openInfo('显示模式','当前版本统一采用浅色 iOS 体育界面，保证创建、生涯、比赛、训练和转会页面视觉一致。');return}
    if(item.id==='feedback'){openFeedbackSettings(store);return}
    if(item.id==='messages'){openMessageCenter(store,repo,ctx);return}
    if(item.id==='privacy'){openInfo('隐私与数据','本地存档默认只保存在当前设备。未通过服务器验证的离线存档不会进入正式世界排行榜，也不会公开邮箱、设备信息或位置。');return}
    if(item.id==='help'){openInfo('帮助与规则','主页的当前重点会提示下一项职业操作。训练、比赛、转会和重大事件处理后会立即写入存档；损坏主档会尝试从最近备份恢复。');return}
    if(item.id==='updates'){openInfo('更新日志',`V${APP_VERSION}：重构移动端首页、设施中心、训练事件、转会卡、世界地图和赛后摘要。`);return}
    const info=await loadBuildInfo();
    openInfo('关于游戏',info
      ?`绿茵浮沉 V${info.version}\n构建 ${info.shortCommitSha} · ${info.branch}\n时间 ${new Date(info.buildTime).toLocaleString('zh-CN')}\n环境 ${info.deploymentTarget}`
      :`绿茵浮沉 V${APP_VERSION}\n本地开发构建，部署信息暂不可用。`);
  }
  return()=>{};
}

function statusFor(id,save,pace,speed){
  if(id==='pace')return`${pace.name} · ${speed.id==='turbo'?'极速':speed.label}`;
  if(id==='medical')return save.status.injury?'待处理':save.status.fatigue>=65?'建议恢复':'正常';
  if(id==='honours')return`${save.career.careerStats?.titles||0}座奖杯`;
  if(id==='save')return'当前槽位';
  if(id==='motion')return save.settings.reducedMotion?'减少动态':save.settings.animationMode==='full'?'完整':'标准';
  return'';
}

async function loadBuildInfo(){
  try{
    const response=await fetch('./build-meta.json',{cache:'no-store'});
    if(!response.ok)throw new Error('build metadata unavailable');
    return await response.json();
  }catch{return null}
}


function openMessageCenter(store,repo,ctx){
  store.update(state=>generateStateMessages(state,repo),'message-center-refresh');
  const save=store.state,messages=unreadMessages(save);
  const content=el('div',{className:'v20-message-list'});
  if(!messages.length){
    content.append(el('div',{className:'empty-state compact'},[
      el('strong',{text:'目前没有未处理消息'}),
      el('p',{text:'教练、队友、经纪人和俱乐部会在职业状态变化时发送消息。'})
    ]));
  }else{
    for(const message of messages){
      content.append(button('',{className:`v20-message-card priority-${message.priority||'info'}`,onClick:()=>{
        store.update(state=>markMessageRead(state,message.id),'message-read');
        closeSheet();
        if(message.action)ctx.navigate(message.action);else ctx.refresh?.();
      }},[
        el('div',{},[
          el('small',{text:`${message.source||'系统'} · ${message.type||'通知'}`}),
          el('strong',{text:message.title||'职业消息'}),
          el('p',{text:message.text||'有一项职业状态发生变化。'})
        ]),
        el('span',{className:'v20-settings-arrow',text:'›',attrs:{'aria-hidden':'true'}})
      ]));
    }
  }
  openSheet({title:'消息中心',subtitle:`${messages.length}条未处理消息`,content});
}

function openMotionSettings(store){
  const save=store.state;
  const modes=[['full','完整'],['standard','标准'],['compact','简洁'],['major','仅重大事件']];
  const content=el('div',{className:'v20-plan-list'});
  for(const[id,label]of modes){
    content.append(button('',{className:`v20-plan-card ${save.settings.animationMode===id?'is-selected':''}`,onClick:()=>{
      store.update(state=>{state.settings.animationMode=id},'animation-mode');
      closeSheet();showToast(`动画等级已设为${label}`,{type:'success'});
    }},[el('div',{},[el('strong',{text:label}),el('small',{text:id==='full'?'保留完整重要演出':id==='standard'?'平衡节奏与反馈':id==='compact'?'缩短普通演出':'只保留评级、成就和关键节点'})]),el('span',{text:save.settings.animationMode===id?'✓':'›'})]));
  }
  const reduce=el('input',{attrs:{type:'checkbox',checked:Boolean(save.settings.reducedMotion),'aria-label':'减少动态效果'}});
  reduce.addEventListener('change',()=>store.update(state=>{state.settings.reducedMotion=reduce.checked},'reduced-motion'));
  content.append(el('label',{className:'pace-toggle-row'},[el('span',{},[el('strong',{text:'减少动态效果'}),el('small',{text:'缩短轨迹、关闭粒子并减弱大型缩放。'})]),el('span',{className:'ios-switch'},[reduce,el('i')])]));
  openSheet({title:'动画与动态效果',subtitle:'设置会立即保存到当前存档。',content});
}

function openFeedbackSettings(store){
  const save=store.state;save.settings.sound??=true;save.settings.haptics??=true;
  const content=el('div',{className:'pace-toggle-list'});
  for(const[key,title,copy]of [['sound','音效','播放克制的比赛、合同和成就反馈音。'],['haptics','触感反馈','在支持的设备上使用轻量震动反馈。']]){
    const input=el('input',{attrs:{type:'checkbox',checked:save.settings[key]!==false,'aria-label':title}});
    input.addEventListener('change',()=>store.update(state=>{state.settings[key]=input.checked},'feedback-setting'));
    content.append(el('label',{className:'pace-toggle-row'},[el('span',{},[el('strong',{text:title}),el('small',{text:copy})]),el('span',{className:'ios-switch'},[input,el('i')])]));
  }
  openSheet({title:'声音与触感',subtitle:'设置会写入当前存档。',content});
}

function openImport(store,ctx){
  const input=el('input',{attrs:{type:'file',accept:'application/json,.json','aria-label':'选择存档文件'}});
  input.addEventListener('change',async()=>{
    try{
      const result=await saveManager.import(input.files?.[0]);
      closeSheet();showToast('存档导入成功，正在返回存档列表',{type:'success'});ctx.onReturnToSlots?.();
      return result;
    }catch(error){showToast(error.message,{type:'error'})}
  });
  openSheet({title:'导入存档',subtitle:'文件会先进行格式、大小和完整性校验。',content:el('div',{className:'v20-import-card'},[el('p',{text:'选择由本游戏导出的 JSON 存档。导入成功后会创建或替换一个本地存档槽。'}),input])});
}

function openInfo(title,text){openSheet({title,content:el('div',{className:'v20-info-sheet'},String(text).split('\n').map(line=>el('p',{text:line})))})}
