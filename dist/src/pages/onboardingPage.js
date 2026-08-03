import {POSITION_CONFIG,CAREER_SETTINGS,ATTR_LABELS,PACE_MODES} from '../app/config.js';
import {createSeed} from '../services/rng.js';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../systems/career/careerSystem.js';
import {calculateOvr} from '../systems/career/ovr.js';
import {createRadarChart} from '../components/radarChart.js';
import {createTalentCard,talentTheme,talentPotentialRange,talentStrengths,talentScoutQuote} from '../components/talentCard.js';
import {createAcademyClubCard} from '../components/clubCard.js';
import {createField,createDateField} from '../components/formControls.js';
import {el,button,clear} from '../utils/dom.js';
import {showToast} from '../components/toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';

const DRAFT_KEY='fc18:onboardingDraft';
const GAME_START_DATE='2026-07-01';
const nations=['中国','日本','韩国','英格兰','西班牙','德国','法国','意大利','葡萄牙','荷兰','比利时','巴西','阿根廷','美国','墨西哥','澳大利亚','沙特阿拉伯','摩洛哥','塞内加尔','尼日利亚'];
const stepNames=['基础身份','身体与国籍','场上位置','球员风格','天赋报告','青年队与节奏'];
const stepTitles=['定义你的身份','完善身体与注册信息','在球场上找到位置','选择你的踢球方式','查看球探评估','选择职业起点与节奏'];
const stepCopy=['填写姓名、球衣显示名和生日。生日作为纯日期保存，不经过时区转换。','身高、体重、惯用脚和号码会影响初始形象与成长边界。','点击球场位置，能力图和职责说明会同步变化。','风格影响训练倾向和球队适配，但不会锁死后期路线。','比较潜力、优势和风险；每个存档只有有限重抽次数。','从符合条件的青年队中选择，并决定职业生涯的推进节奏。'];

function defaultDraft(){return{step:1,seed:createSeed(),name:'赵天佑',displayName:'天佑',nation:'中国',age:17,birthDate:'2009-06-15',height:178,weight:70,foot:'右脚',number:10,position:'ST',style:'禁区终结者',rerolls:CAREER_SETTINGS.maxRerolls,talents:[],selectedTalent:0,academyOffers:[],selectedAcademy:0,paceMode:'standard'}}
function loadDraft(){
  try{
    const saved=JSON.parse(sessionStorage.getItem(DRAFT_KEY)||'null');
    if(!saved||typeof saved!=='object')return defaultDraft();
    return{...defaultDraft(),...saved,step:Math.min(6,Math.max(1,Number(saved.step)||1)),seed:Number(saved.seed)||createSeed()};
  }catch{return defaultDraft()}
}
function saveDraft(draft){
  const safe={...draft,talents:draft.talents||[],academyOffers:draft.academyOffers||[]};
  sessionStorage.setItem(DRAFT_KEY,JSON.stringify(safe));
}
function clearDraft(){sessionStorage.removeItem(DRAFT_KEY)}
function parsePureDate(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
  if(!match)return null;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  const maxDay=new Date(year,month,0).getDate();
  if(month<1||month>12||day<1||day>maxDay)return null;
  return{year,month,day};
}
function ageOnDate(birthDate,referenceDate=GAME_START_DATE){
  const birth=parsePureDate(birthDate),ref=parsePureDate(referenceDate);if(!birth||!ref)return NaN;
  let age=ref.year-birth.year;
  if(ref.month<birth.month||(ref.month===birth.month&&ref.day<birth.day))age-=1;
  return age;
}
function formatLocalDate(value){const d=parsePureDate(value);return d?`${d.year}年${d.month}月${d.day}日`:'日期无效'}

export function renderOnboarding(root,{repo,onComplete,onCancel=null}){
  const draft=loadDraft();
  root.className='onboarding-root';
  clear(root);
  const shell=el('section',{className:'player-setup'});
  const top=el('header',{className:'setup-header'});
  const body=el('main',{className:'setup-main',attrs:{id:'setup-main',tabindex:'-1'}});
  const foot=el('footer',{className:'setup-actions'});
  shell.append(top,body,foot);root.append(shell);

  function persist(){draft.age=ageOnDate(draft.birthDate);saveDraft(draft)}
  function render({focusMain=false}={}){
    persist();
    top.replaceChildren(progress(),header());
    body.replaceChildren(content());
    foot.replaceChildren(...footerButtons());
    body.scrollTop=0;
    if(focusMain)requestAnimationFrame(()=>body.focus({preventScroll:true}));
  }
  function progress(){
    const percent=Math.round((draft.step/6)*100);
    const wrap=el('div',{className:'setup-progress',attrs:{'aria-label':`第${draft.step}步，共6步`}});
    wrap.append(
      el('div',{className:'setup-progress-label'},[
        el('strong',{text:`第 ${draft.step} / 6 步`}),el('span',{text:`${percent}%`})
      ]),
      el('div',{className:'setup-progress-track',attrs:{role:'progressbar','aria-valuemin':'1','aria-valuemax':'6','aria-valuenow':String(draft.step)}},[
        el('i',{attrs:{style:`transform:scaleX(${draft.step/6})`}})
      ]),
      el('div',{className:'setup-progress-desktop'},stepNames.map((name,index)=>el('span',{className:index+1<draft.step?'is-complete':index+1===draft.step?'is-active':'',text:index+1<draft.step?`✓ ${name}`:`${index+1} ${name}`})))
    );
    return wrap;
  }
  function header(){return el('div',{className:'onboarding-header'},[el('span',{className:'eyebrow',text:'创建球员'}),el('h1',{text:stepTitles[draft.step-1]}),el('p',{text:stepCopy[draft.step-1]})])}
  function footerButtons(){
    const buttons=[];
    if(draft.step>1)buttons.push(button('上一步',{className:'button button--secondary',onClick:()=>{draft.step-=1;render({focusMain:true})}}));
    else if(onCancel)buttons.push(button('返回存档',{className:'button button--secondary',onClick:()=>{persist();onCancel()}}));
    const last=draft.step===6;
    buttons.push(button(last?'开始职业生涯':'下一步',{className:'button button--primary',onClick:()=>{
      if(!validate())return;
      if(last){
        const talent=draft.talents[draft.selectedTalent],offer=draft.academyOffers[draft.selectedAcademy];
        const club=repo.getClub(offer.clubId),sourceTemplate=repo.templates.find(item=>item.id===talent.sourceTemplateId);
        clearDraft();onComplete(createNewSave({...draft,talent,academyOffer:offer,sourceTemplate},club,'new'));return;
      }
      draft.step+=1;prepareStep();render({focusMain:true});
    }}));
    return buttons;
  }
  function content(){
    const panel=el('section',{className:'setup-panel'});
    if(draft.step===1)panel.append(identityStep());
    else if(draft.step===2)panel.append(bodyStep());
    else if(draft.step===3)panel.append(positionStep());
    else if(draft.step===4)panel.append(styleStep());
    else if(draft.step===5)panel.append(talentStep());
    else panel.append(finalStep());
    return panel;
  }
  function identityStep(){
    const grid=el('div',{className:'form-grid form-grid--single'});
    const name=createField({label:'姓名',name:'name',value:draft.name,placeholder:'请输入球员姓名',required:true,onInput:value=>{draft.name=value.trimStart();persist()}});
    const display=createField({label:'球衣显示名',name:'displayName',value:draft.displayName,placeholder:'例如：天佑',help:'建议2至12个字符。',required:true,onInput:value=>{draft.displayName=value.trimStart();persist()}});
    const date=createDateField({label:'出生日期',name:'birthDate',value:draft.birthDate,min:'2007-01-01',max:'2010-12-31',help:`当前选择：${formatLocalDate(draft.birthDate)}。开局年龄必须为16至18岁。`,onChange:value=>{draft.birthDate=value;draft.age=ageOnDate(value);persist()}});
    date.control.lang='zh-CN';
    grid.append(name.wrapper,display.wrapper,date.wrapper);
    return grid;
  }
  function bodyStep(){
    const grid=el('div',{className:'form-grid'});
    const nation=createField({label:'国家或地区',name:'nation',value:draft.nation,options:nations,onChange:value=>{draft.nation=value;draft.academyOffers=[];persist()}});
    const height=createField({label:'身高（厘米）',name:'height',type:'number',value:draft.height,min:150,max:210,step:1,inputMode:'numeric',help:'范围150至210厘米。',onInput:value=>{draft.height=Number(value);persist()}});
    const weight=createField({label:'体重（公斤）',name:'weight',type:'number',value:draft.weight,min:45,max:120,step:1,inputMode:'numeric',help:'范围45至120公斤。',onInput:value=>{draft.weight=Number(value);persist()}});
    const foot=createField({label:'惯用脚',name:'foot',value:draft.foot,options:['右脚','左脚','双足'],onChange:value=>{draft.foot=value;persist()}});
    const number=createField({label:'喜欢的号码',name:'number',type:'number',value:draft.number,min:1,max:99,step:1,inputMode:'numeric',onInput:value=>{draft.number=Number(value);persist()}});
    grid.append(nation.wrapper,height.wrapper,weight.wrapper,foot.wrapper,number.wrapper);
    return grid;
  }
  function positionStep(){
    const layout=el('div',{className:'position-layout'}),pitch=el('div',{className:'pitch-selector',attrs:{role:'group','aria-label':'场上位置选择'}});
    Object.entries(POSITION_CONFIG).forEach(([id,config])=>{
      const positionButton=button(config.name,{className:`pitch-position ${draft.position===id?'is-selected':''}`,onClick:async()=>{draft.position=id;draft.style=config.roles[0];draft.talents=[];draft.academyOffers=[];persist();const attrs=positionPreviewAttrs(id);await animationDirector.play('hex-growth',{id:`onboarding:${id}`,oldValues:[50,50,50,50,50,50],newValues:Object.values(attrs).slice(0,6),keeper:id==='GK'},{token:`position:${id}:${draft.seed}`});render();}});
      positionButton.style.left=`${config.x}%`;positionButton.style.top=`${config.y}%`;positionButton.dataset.position=id;positionButton.setAttribute('aria-pressed',String(draft.position===id));pitch.append(positionButton);
    });
    const config=POSITION_CONFIG[draft.position],preview=positionPreviewAttrs(draft.position),ovr=calculateOvr(preview,draft.position),labels=config.group==='keeper'?ATTR_LABELS.keeper:ATTR_LABELS.outfield;
    const detail=el('aside',{className:'position-detail'},[
      el('span',{className:'eyebrow',text:'位置球探预览'}),el('h2',{text:config.name}),el('p',{text:positionDuty(config.group)}),
      el('div',{className:'position-preview'},[
        createRadarChart(preview,draft.position,{size:190}),
        el('div',{className:'position-rating'},[el('small',{text:'位置适配总评'}),el('strong',{text:String(ovr)}),el('span',{text:`重点：${config.focus.map(key=>labels[key]).join('、')}`})])
      ]),
      el('h3',{text:'发展路线'}),el('div',{className:'tag-row'},config.roles.slice(0,3).map(role=>el('span',{className:'tag',text:role})))
    ]);
    layout.append(pitch,detail);return layout;
  }
  function styleStep(){
    const config=POSITION_CONFIG[draft.position],grid=el('div',{className:'choice-grid'});
    config.roles.forEach((style,index)=>{
      const card=button('',{className:`selection-card ${draft.style===style?'is-selected':''}`,onClick:()=>{draft.style=style;draft.talents=[];draft.academyOffers=[];persist();render();}});
      card.setAttribute('aria-pressed',String(draft.style===style));
      card.append(el('span',{className:'selection-index',text:String(index+1)}),el('div',{},[el('h3',{text:style}),el('p',{text:styleDescription(style)})]),el('span',{className:'selection-check',text:draft.style===style?'✓':''}));grid.append(card);
    });return grid;
  }
  function talentStep(){
    if(!draft.talents.length)prepareTalents();
    const wrap=el('div',{className:'talent-layout'}),toolbar=el('div',{className:'talent-toolbar'},[
      el('p',{text:`剩余重抽 ${draft.rerolls} 次。重抽会替换当前全部候选。`}),
      button('重新抽取',{className:'button button--secondary',disabled:draft.rerolls<=0,onClick:async()=>{if(draft.rerolls<=0)return;draft.rerolls-=1;prepareTalents(true);persist();await animationDirector.play('card-draw',{id:`talents:${draft.seed}`,cards:draft.talents.map(item=>item.name),chosen:0,rarity:draft.talents[0]?.rarityKey,label:'新天赋候选已生成'},{token:`talent-draw:${draft.seed}`});render();}})
    ]),grid=el('div',{className:'talent-grid'});
    draft.talents.forEach((talent,index)=>{
      const source=repo.templates.find(item=>item.id===talent.sourceTemplateId),attrs=source?.attrs||positionPreviewAttrs(draft.position);
      grid.append(createTalentCard(talent,{selected:draft.selectedTalent===index,position:draft.position,style:draft.style,attrs,onSelect:async()=>{draft.selectedTalent=index;draft.academyOffers=[];persist();await animationDirector.play('scout-radar',{id:`talent:${talent.id}`,score:Math.min(98,Math.round((talent.potential||80))),label:`已选择 ${talent.name}`},{token:`scout:${draft.seed}:${talent.id}`});render();}}));
    });
    wrap.append(toolbar,grid);return wrap;
  }
  function finalStep(){
    if(!draft.talents.length)prepareTalents();if(!draft.academyOffers.length)prepareAcademies();
    const wrap=el('div',{className:'final-setup'}),talent=draft.talents[draft.selectedTalent],source=repo.templates.find(item=>item.id===talent.sourceTemplateId),previewAttrs=source?.attrs||positionPreviewAttrs(draft.position),theme=talentTheme(talent),config=POSITION_CONFIG[draft.position];
    const report=el('section',{className:'scout-report scout-report--compact'});report.style.setProperty('--report-color',talent.color||theme.color);
    report.append(
      el('div',{className:'scout-report__head'},[
        el('div',{className:'scout-report__title'},[el('span',{className:'eyebrow',text:'最终球探摘要'}),el('h2',{text:draft.name}),el('p',{text:`${config.name} · ${draft.style} · ${draft.nation}`})]),
        el('div',{className:'scout-report__rating'},[el('strong',{text:`${'★'.repeat(theme.stars)}${'☆'.repeat(5-theme.stars)}`}),el('span',{text:`${talent.rarity}天赋 · 潜力 ${talentPotentialRange(talent)}`})])
      ]),
      el('div',{className:'scout-report__body'},[
        createRadarChart(previewAttrs,draft.position,{size:160}),
        el('div',{className:'scout-report__traits'},[
          el('h3',{text:'优势'}),el('ul',{className:'scout-points'},talentStrengths(previewAttrs,draft.position).slice(0,3).map(text=>el('li',{text}))),
          el('div',{className:'scout-risk'},[el('strong',{text:'培养风险：'}),document.createTextNode(talent.cost)]),
          el('div',{className:'scout-report__quote',text:talentScoutQuote(talent,draft.style)})
        ])
      ])
    );
    const academy=el('section',{className:'final-setup-section'},[el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'青年队邀请'}),el('h2',{text:'选择职业起点'})])])]);
    const list=el('div',{className:'academy-offers'});
    draft.academyOffers.forEach((offer,index)=>{const club=repo.getClub(offer.clubId);list.append(createAcademyClubCard(club,offer,{selected:draft.selectedAcademy===index,position:draft.position,onSelect:()=>{draft.selectedAcademy=index;persist();render();}}))});
    academy.append(list);
    const pace=el('section',{className:'final-setup-section'},[el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'职业节奏'}),el('h2',{text:'决定推进方式'})])])]);
    const paceGrid=el('div',{className:'pace-mode-grid'});
    Object.values(PACE_MODES).forEach((mode,index)=>{
      const selected=draft.paceMode===mode.id;
      const card=button('',{className:`pace-mode-card ${selected?'is-selected':''}`,pressed:selected,onClick:()=>{draft.paceMode=mode.id;persist();render();}});
      card.append(
        el('div',{className:'pace-mode-card__top'},[el('span',{className:'pace-mode-card__icon',text:['◌','▶','»','★'][index]}),el('div',{},[el('h3',{text:mode.name}),el('small',{text:`单赛季约 ${mode.seasonMinutes}`})]),el('span',{className:'selection-check',text:selected?'✓':''})]),
        el('div',{className:'pace-mode-card__facts'},[paceFact('比赛',mode.matchDetail),paceFact('事件',mode.eventFrequency),paceFact('自动模拟',mode.autoSimulation),paceFact('暂停',mode.pausePolicy)])
      );paceGrid.append(card);
    });
    pace.append(paceGrid);wrap.append(report,academy,pace);return wrap;
  }
  function paceFact(label,value){return el('div',{className:'pace-fact'},[el('small',{text:label}),el('strong',{text:value})])}
  function prepareStep(){if(draft.step===5&&!draft.talents.length)prepareTalents();if(draft.step===6&&!draft.academyOffers.length)prepareAcademies()}
  function prepareTalents(force=false){if(force)draft.seed=createSeed();draft.talents=createTalentCandidates({seed:draft.seed,position:draft.position,style:draft.style,templates:repo.templates,count:3});draft.selectedTalent=0;draft.academyOffers=[];persist()}
  function prepareAcademies(){const talent=draft.talents[draft.selectedTalent],source=repo.templates.find(item=>item.id===talent.sourceTemplateId),ovr=source?calculateOvr(source.attrs,draft.position):62;draft.academyOffers=generateAcademyOffers({seed:draft.seed,nation:draft.nation,position:draft.position,ovr,talent,clubs:repo.clubs});draft.selectedAcademy=0;persist()}
  function validate(){
    if(draft.step===1){
      const age=ageOnDate(draft.birthDate);draft.age=age;
      if(!draft.name.trim()||draft.name.trim().length>20){showToast('姓名需为1至20个字符',{type:'error'});return false}
      if(!draft.displayName.trim()||draft.displayName.trim().length>12){showToast('球衣显示名需为1至12个字符',{type:'error'});return false}
      if(!Number.isFinite(age)||age<16||age>18){showToast('开局年龄必须为16至18岁，请重新选择生日',{type:'error'});return false}
    }
    if(draft.step===2&&(!nations.includes(draft.nation)||draft.height<150||draft.height>210||draft.weight<45||draft.weight>120||draft.number<1||draft.number>99)){showToast('请检查身体信息，数值超出允许范围',{type:'error'});return false}
    if(draft.step===5&&!draft.talents.length){showToast('天赋候选尚未生成',{type:'error'});return false}
    if(draft.step===6&&(!draft.academyOffers.length||!PACE_MODES[draft.paceMode])){showToast('请选择青年队和职业节奏',{type:'error'});return false}
    return true;
  }
  render();
  return()=>{persist();clear(root)};
}

export function positionPreviewAttrs(position){const config=POSITION_CONFIG[position]||POSITION_CONFIG.ST,entries=Object.entries(config.weights),max=Math.max(...entries.map(([,weight])=>weight));const attrs={};for(const[key,weight]of entries)attrs[key]=Math.round(42+(weight/max)*43+(config.focus.includes(key)?7:0));return attrs}
function positionDuty(group){if(group==='keeper')return'保护球门、组织后场并处理一对一。';if(group==='defense')return'防守空间、赢下对抗并支持后场出球。';if(group==='midfield')return'连接攻防、控制节奏并覆盖中场区域。';if(group==='creative')return'在前场创造机会，连接中场与锋线。';return'攻击防线身后，制造进球并决定比赛。'}
function styleDescription(style){const map={禁区终结者:'专注无球跑位和门前终结，回撤参与较少。',支点中锋:'利用身体保护球权，为队友创造前插空间。',全能前锋:'兼顾推进、做球与终结，对综合能力要求更高。',速度型前锋:'攻击防线身后，以启动和冲刺制造机会。',伪九号:'频繁回撤连接中场，用传球和盘带打乱防线。',古典组织核心:'以视野和传球主导前场节奏，防守负担较轻。'};return map[style]||`${style}会改变训练倾向、比赛选择与球队适配。`}
