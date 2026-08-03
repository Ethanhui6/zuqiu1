import {POSITION_CONFIG,CAREER_SETTINGS,ATTR_LABELS,PACE_MODES} from '../app/config.js';
import {createSeed} from '../services/rng.js';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../systems/career/careerSystem.js';
import {calculateOvr} from '../systems/career/ovr.js';
import {createRadarChart} from '../components/radarChart.js';
import {createTalentCard,talentTheme,talentPotentialRange,talentStrengths,talentScoutQuote} from '../components/talentCard.js';
import {createAcademyClubCard} from '../components/clubCard.js';
import {el,button,clear} from '../utils/dom.js';
import {showToast} from '../components/toast.js';

const nations=['中国','日本','韩国','英格兰','西班牙','德国','法国','意大利','葡萄牙','荷兰','比利时','巴西','阿根廷','美国','墨西哥','澳大利亚','沙特阿拉伯','摩洛哥','塞内加尔','尼日利亚'];
const stepNames=['基础信息','场上位置','踢球风格','天赋报告','青年队','职业节奏'];
const stepTitles=['定义你的身份','在球场上找到位置','选择你的踢球方式','查看球探评估','选择职业起点','决定生涯推进节奏'];
const stepCopy=['身份资料会影响身体成长、注册规则和初始球迷基础。','点击球场位置，能力图和职责说明会同步变化。','风格影响训练倾向和球队适配，但不会锁死后期路线。','比较潜力、优势和风险；每个存档只有有限重抽次数。','从符合条件的青年队中选择，靠表现争取进入一线队。','节奏只决定展示与自动模拟程度，随时可以在设置中修改。'];

export function renderOnboarding(root,{repo,onComplete,onCancel=null}){
  const draft={step:1,seed:createSeed(),name:'赵天佑',displayName:'天佑',nation:'中国',age:17,birthDate:'2009-06-15',height:178,weight:70,foot:'右脚',number:10,position:'ST',style:'禁区终结者',rerolls:CAREER_SETTINGS.maxRerolls,talents:[],selectedTalent:0,academyOffers:[],selectedAcademy:0,paceMode:'standard'};
  root.className='onboarding-root';

  function render(){
    clear(root);
    const shell=el('section',{className:'onboarding-card'});
    shell.append(progress(),header(),content(),footer());
    root.append(shell);
    root.scrollTop=0;
  }
  function progress(){
    const wrap=el('div',{className:'wizard-progress',attrs:{'aria-label':`创建球员，第${draft.step}步，共6步`}});
    for(let index=1;index<=6;index++){
      const state=index<draft.step?'is-complete':index===draft.step?'is-active':'is-pending';
      const marker=index<draft.step?'✓':String(index);
      wrap.append(el('div',{className:`wizard-step ${state}`,attrs:{'aria-current':index===draft.step?'step':undefined}},[
        el('span',{text:marker}),el('small',{text:stepNames[index-1]})
      ]));
    }
    return wrap;
  }
  function header(){
    return el('header',{className:'onboarding-header'},[
      el('div',{className:'eyebrow',text:`创建球员 · 第 ${draft.step}/6 步`}),
      el('h1',{text:stepTitles[draft.step-1]}),
      el('p',{text:stepCopy[draft.step-1]})
    ]);
  }
  function content(){
    if(draft.step===1)return identityStep();
    if(draft.step===2)return positionStep();
    if(draft.step===3)return styleStep();
    if(draft.step===4)return talentStep();
    if(draft.step===5)return academyStep();
    return paceStep();
  }
  function footer(){
    const wrap=el('footer',{className:'wizard-footer'});
    if(draft.step>1)wrap.append(button('上一步',{className:'button button--secondary',onClick:()=>{draft.step--;render();}}));
    else if(onCancel)wrap.append(button('返回存档',{className:'button button--secondary',onClick:onCancel}));
    const last=draft.step===6;
    wrap.append(button(last?'开始职业生涯':'继续',{className:'button button--primary',onClick:()=>{
      if(!validate())return;
      if(last){
        const talent=draft.talents[draft.selectedTalent],offer=draft.academyOffers[draft.selectedAcademy],club=repo.getClub(offer.clubId),sourceTemplate=repo.templates.find(item=>item.id===talent.sourceTemplateId);
        onComplete(createNewSave({...draft,talent,academyOffer:offer,sourceTemplate},club,'new'));
        return;
      }
      draft.step++;prepareStep();render();
    }}));
    return wrap;
  }
  function identityStep(){
    const form=el('div',{className:'form-grid'});
    const fields=[['姓名','text','name'],['球衣显示名','text','displayName'],['出生日期','date','birthDate'],['身高（厘米）','number','height'],['体重（公斤）','number','weight'],['喜欢的号码','number','number']];
    fields.forEach(([label,type,key])=>{
      const input=el('input',{attrs:{type,value:draft[key],min:key==='height'?155:key==='weight'?45:key==='number'?1:undefined,max:key==='height'?205:key==='weight'?110:key==='number'?99:undefined,inputmode:type==='number'?'numeric':undefined}});
      input.addEventListener('input',()=>{draft[key]=type==='number'?Number(input.value):input.value;});
      form.append(el('label',{className:'field'},[el('span',{text:label}),input]));
    });
    const nation=el('select');nations.forEach(name=>nation.append(el('option',{text:name,attrs:{value:name,selected:name===draft.nation}})));nation.onchange=()=>{draft.nation=nation.value;};
    const foot=el('select');['右脚','左脚','双足'].forEach(name=>foot.append(el('option',{text:name,attrs:{value:name,selected:name===draft.foot}})));foot.onchange=()=>{draft.foot=foot.value;};
    form.append(el('label',{className:'field'},[el('span',{text:'国家或地区'}),nation]),el('label',{className:'field'},[el('span',{text:'惯用脚'}),foot]));
    return form;
  }
  function positionStep(){
    const grid=el('div',{className:'position-layout'}),pitch=el('div',{className:'pitch-selector',attrs:{role:'group','aria-label':'场上位置选择'}});
    Object.entries(POSITION_CONFIG).forEach(([id,config])=>{
      const positionButton=button(config.name,{className:`pitch-position ${draft.position===id?'is-selected':''}`,onClick:()=>{draft.position=id;draft.style=config.roles[0];draft.talents=[];draft.academyOffers=[];render();}});
      positionButton.style.left=`${config.x}%`;positionButton.style.top=`${config.y}%`;positionButton.dataset.position=id;positionButton.setAttribute('aria-pressed',String(draft.position===id));pitch.append(positionButton);
    });
    const config=POSITION_CONFIG[draft.position],preview=positionPreviewAttrs(draft.position),ovr=calculateOvr(preview,draft.position),labels=config.group==='keeper'?ATTR_LABELS.keeper:ATTR_LABELS.outfield;
    const detail=el('aside',{className:'position-detail'},[
      el('div',{className:'eyebrow',text:'位置球探预览'}),el('h2',{text:config.name}),el('p',{text:positionDuty(config.group)}),
      el('div',{className:'position-preview'},[
        createRadarChart(preview,draft.position,{size:190}),
        el('div',{className:'position-rating'},[
          el('small',{text:'位置适配总评'}),el('strong',{text:String(ovr)}),el('span',{text:`重点：${config.focus.map(key=>labels[key]).join('、')}`})
        ])
      ]),
      el('h3',{text:'适合的发展路线'}),el('div',{className:'tag-row'},config.roles.map(role=>el('span',{className:'tag',text:role})))
    ]);
    grid.append(pitch,detail);return grid;
  }
  function styleStep(){
    const config=POSITION_CONFIG[draft.position],grid=el('div',{className:'choice-grid'});
    config.roles.forEach((style,index)=>{
      const card=button('',{className:`selection-card ${draft.style===style?'is-selected':''}`,onClick:()=>{draft.style=style;draft.talents=[];draft.academyOffers=[];render();}});
      card.setAttribute('aria-pressed',String(draft.style===style));
      card.append(el('span',{className:'selection-index',text:String(index+1)}),el('h3',{text:style}),el('p',{text:styleDescription(style)}));grid.append(card);
    });return grid;
  }
  function talentStep(){
    if(!draft.talents.length)prepareTalents();
    const wrap=el('div',{className:'talent-layout'}),toolbar=el('div',{className:'talent-toolbar'},[
      el('p',{text:`剩余重抽 ${draft.rerolls} 次。重抽会替换当前全部候选。`}),
      button('重新抽取',{className:'button button--secondary',disabled:draft.rerolls<=0,onClick:()=>{if(draft.rerolls<=0)return;draft.rerolls--;prepareTalents(true);render();}})
    ]),grid=el('div',{className:'talent-grid'});
    draft.talents.forEach((talent,index)=>{
      const source=repo.templates.find(item=>item.id===talent.sourceTemplateId),attrs=source?.attrs||positionPreviewAttrs(draft.position);
      grid.append(createTalentCard(talent,{selected:draft.selectedTalent===index,position:draft.position,style:draft.style,attrs,onSelect:()=>{draft.selectedTalent=index;draft.academyOffers=[];render();}}));
    });
    wrap.append(toolbar,grid);return wrap;
  }
  function academyStep(){
    if(!draft.academyOffers.length)prepareAcademies();
    const wrap=el('div',{className:'academy-layout'}),talent=draft.talents[draft.selectedTalent],source=repo.templates.find(item=>item.id===talent.sourceTemplateId),previewAttrs=source?.attrs||positionPreviewAttrs(draft.position),theme=talentTheme(talent),config=POSITION_CONFIG[draft.position];
    const report=el('section',{className:'scout-report'});report.style.setProperty('--report-color',talent.color||theme.color);
    report.append(
      el('div',{className:'scout-report__head'},[
        el('div',{className:'scout-report__title'},[el('span',{className:'eyebrow',text:'球探评估报告'}),el('h2',{text:draft.name}),el('p',{text:`${config.name} · ${draft.style} · ${draft.nation}`})]),
        el('div',{className:'scout-report__rating'},[el('strong',{text:`${'★'.repeat(theme.stars)}${'☆'.repeat(5-theme.stars)}`}),el('span',{text:`${talent.rarity}天赋 · 潜力 ${talentPotentialRange(talent)}`})])
      ]),
      el('div',{className:'scout-report__body'},[
        createRadarChart(previewAttrs,draft.position,{size:190}),
        el('div',{className:'scout-report__traits'},[
          el('h3',{text:'技术特点'}),
          el('ul',{className:'scout-points'},talentStrengths(previewAttrs,draft.position).map(text=>el('li',{text}))),
          el('div',{className:'scout-risk'},[el('strong',{text:'培养风险：'}),document.createTextNode(talent.cost)]),
          el('div',{className:'scout-report__quote',text:talentScoutQuote(talent,draft.style)})
        ])
      ])
    );
    const list=el('div',{className:'academy-offers'});
    draft.academyOffers.forEach((offer,index)=>{
      const club=repo.getClub(offer.clubId);
      list.append(createAcademyClubCard(club,offer,{selected:draft.selectedAcademy===index,position:draft.position,onSelect:()=>{draft.selectedAcademy=index;render();}}));
    });
    wrap.append(report,list);return wrap;
  }
  function paceStep(){
    const wrap=el('div',{className:'pace-mode-grid'});
    Object.values(PACE_MODES).forEach((mode,index)=>{
      const selected=draft.paceMode===mode.id;
      const card=button('',{className:`pace-mode-card ${selected?'is-selected':''}`,pressed:selected,onClick:()=>{draft.paceMode=mode.id;render();}});
      card.append(
        el('div',{className:'pace-mode-card__top'},[
          el('span',{className:'pace-mode-card__icon',text:['◌','▶','»','★'][index]}),
          el('div',{},[el('h3',{text:mode.name}),el('small',{text:`单赛季约 ${mode.seasonMinutes}`})]),
          el('span',{className:'selection-check',text:selected?'✓':''})
        ]),
        el('div',{className:'pace-mode-card__facts'},[
          paceFact('比赛呈现',mode.matchDetail),paceFact('事件频率',mode.eventFrequency),paceFact('自动模拟',mode.autoSimulation),paceFact('暂停规则',mode.pausePolicy)
        ])
      );
      wrap.append(card);
    });
    wrap.append(el('p',{className:'pace-mode-note',text:'标准模式为推荐默认值。进入游戏后，可用底部上方的速度控制器随时暂停、切换1倍、2倍、4倍或快速推进。'}));
    return wrap;
  }
  function paceFact(label,value){return el('div',{className:'pace-fact'},[el('small',{text:label}),el('strong',{text:value})])}
  function prepareStep(){if(draft.step===4&&!draft.talents.length)prepareTalents();if(draft.step===5&&!draft.academyOffers.length)prepareAcademies();}
  function prepareTalents(force=false){if(force)draft.seed=createSeed();draft.talents=createTalentCandidates({seed:draft.seed,position:draft.position,style:draft.style,templates:repo.templates,count:3});draft.selectedTalent=0;draft.academyOffers=[];}
  function prepareAcademies(){const talent=draft.talents[draft.selectedTalent],source=repo.templates.find(item=>item.id===talent.sourceTemplateId),ovr=source?calculateOvr(source.attrs,draft.position):62;draft.academyOffers=generateAcademyOffers({seed:draft.seed,nation:draft.nation,position:draft.position,ovr,talent,clubs:repo.clubs});draft.selectedAcademy=0;}
  function validate(){
    if(draft.step===1&&(!draft.name||!draft.displayName||draft.height<155||draft.height>205||draft.weight<45||draft.weight>110||draft.number<1||draft.number>99)){showToast('请完整填写合理的身份信息',{type:'error'});return false;}
    if(draft.step===4&&!draft.talents.length){showToast('天赋候选尚未生成',{type:'error'});return false;}
    if(draft.step===5&&!draft.academyOffers.length){showToast('青年队邀请尚未生成',{type:'error'});return false;}
    if(draft.step===6&&!PACE_MODES[draft.paceMode]){showToast('请选择职业节奏',{type:'error'});return false;}
    return true;
  }
  render();return()=>clear(root);
}

export function positionPreviewAttrs(position){
  const config=POSITION_CONFIG[position]||POSITION_CONFIG.ST,entries=Object.entries(config.weights),max=Math.max(...entries.map(([,weight])=>weight));
  const attrs={};for(const[key,weight]of entries)attrs[key]=Math.round(42+(weight/max)*43+(config.focus.includes(key)?7:0));return attrs;
}
function positionDuty(group){if(group==='keeper')return'保护球门、组织后场并处理一对一。';if(group==='defense')return'防守空间、赢下对抗并支持后场出球。';if(group==='midfield')return'连接攻防、控制节奏并覆盖中场区域。';if(group==='creative')return'在前场创造机会，连接中场与锋线。';return'攻击防线身后，制造进球并决定比赛。';}
function styleDescription(style){
  const map={禁区终结者:'专注无球跑位和门前终结，回撤参与较少。',支点中锋:'利用身体保护球权，为队友创造前插空间。',全能前锋:'兼顾推进、做球与终结，对综合能力要求更高。',速度型前锋:'攻击防线身后，以启动和冲刺制造机会。',伪九号:'频繁回撤连接中场，用传球和盘带打乱防线。',古典组织核心:'以视野和传球主导前场节奏，防守负担较轻。'};
  return map[style]||`${style}会改变训练倾向、比赛选择与球队适配。`;
}
