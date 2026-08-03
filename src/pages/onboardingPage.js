import {POSITION_CONFIG,CAREER_SETTINGS} from '../app/config.js';
import {createSeed} from '../services/rng.js';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../systems/career/careerSystem.js';
import {calculateOvr} from '../systems/career/ovr.js';
import {createRadarChart} from '../components/radarChart.js';
import {el,button,clear} from '../utils/dom.js';
import {formatMoney} from '../utils/format.js';
import {showToast} from '../components/toast.js';

const nations=['中国','日本','韩国','英格兰','西班牙','德国','法国','意大利','葡萄牙','荷兰','比利时','巴西','阿根廷','美国','墨西哥','澳大利亚','沙特阿拉伯','摩洛哥','塞内加尔','尼日利亚'];

export function renderOnboarding(root,{repo,onComplete,onCancel=null}){
  const draft={step:1,seed:createSeed(),name:'赵天佑',displayName:'天佑',nation:'中国',age:17,birthDate:'2009-06-15',height:178,weight:70,foot:'右脚',number:10,position:'ST',style:'禁区终结者',rerolls:CAREER_SETTINGS.maxRerolls,talents:[],selectedTalent:0,academyOffers:[],selectedAcademy:0};
  root.className='onboarding-root';

  function render(){
    clear(root);
    const shell=el('section',{className:'onboarding-card'});
    shell.append(progress(),header(),content(),footer());
    root.append(shell);
  }

  function progress(){
    const wrap=el('div',{className:'wizard-progress'});
    for(let i=1;i<=5;i++){
      wrap.append(el('div',{className:`wizard-step ${i<=draft.step?'is-active':''}`},[
        el('span',{text:String(i)}),
        el('small',{text:['身份','位置','风格','天赋','青训'][i-1]})
      ]));
    }
    return wrap;
  }

  function header(){
    return el('header',{className:'onboarding-header'},[
      el('div',{className:'eyebrow',text:'创建球员'}),
      el('h1',{text:['定义你的身份','在球场上找到位置','选择踢球方式','抽取开局天赋','选择青年队起点'][draft.step-1]}),
      el('p',{text:['这些信息会影响国籍规则、身体成长和球迷基础。','点击球场圆点，查看职责、主要属性与成长路线。','风格决定训练倾向，不会限制后期发展。','每个存档只能有限重抽，传奇模板不会保证成功。','所有新角色从青年梯队开始，必须靠表现进入一线队。'][draft.step-1]})
    ]);
  }

  function content(){
    if(draft.step===1)return identityStep();
    if(draft.step===2)return positionStep();
    if(draft.step===3)return styleStep();
    if(draft.step===4)return talentStep();
    return academyStep();
  }

  function footer(){
    const wrap=el('footer',{className:'wizard-footer'});
    if(draft.step>1){
      wrap.append(button('上一步',{className:'button button--secondary',onClick:()=>{draft.step--;render();}}));
    }else if(onCancel){
      wrap.append(button('返回存档',{className:'button button--secondary',onClick:onCancel}));
    }
    const last=draft.step===5;
    wrap.append(button(last?'开始职业生涯':'继续',{
      className:'button button--primary',
      onClick:()=>{
        if(!validate())return;
        if(last){
          const talent=draft.talents[draft.selectedTalent];
          const offer=draft.academyOffers[draft.selectedAcademy];
          const club=repo.getClub(offer.clubId);
          const sourceTemplate=repo.templates.find(x=>x.id===talent.sourceTemplateId);
          const save=createNewSave({...draft,talent,academyOffer:offer,sourceTemplate},club,'new');
          onComplete(save);
          return;
        }
        draft.step++;
        prepareStep();
        render();
      }
    }));
    return wrap;
  }

  function identityStep(){
    const form=el('div',{className:'form-grid'});
    const fields=[['姓名','text','name'],['球衣显示名','text','displayName'],['出生日期','date','birthDate'],['身高（厘米）','number','height'],['体重（公斤）','number','weight'],['喜欢的号码','number','number']];
    fields.forEach(([label,type,key])=>{
      const input=el('input',{attrs:{type,value:draft[key],min:key==='height'?155:key==='weight'?45:key==='number'?1:undefined,max:key==='height'?205:key==='weight'?110:key==='number'?99:undefined}});
      input.addEventListener('input',()=>{draft[key]=type==='number'?Number(input.value):input.value;});
      form.append(el('label',{className:'field'},[el('span',{text:label}),input]));
    });
    const nation=el('select');
    nations.forEach(n=>nation.append(el('option',{text:n,attrs:{value:n,selected:n===draft.nation}})));
    nation.onchange=()=>{draft.nation=nation.value;};
    const foot=el('select');
    ['右脚','左脚','双足'].forEach(n=>foot.append(el('option',{text:n,attrs:{value:n,selected:n===draft.foot}})));
    foot.onchange=()=>{draft.foot=foot.value;};
    form.append(
      el('label',{className:'field'},[el('span',{text:'国家或地区'}),nation]),
      el('label',{className:'field'},[el('span',{text:'惯用脚'}),foot])
    );
    return form;
  }

  function positionStep(){
    const grid=el('div',{className:'position-layout'});
    const pitch=el('div',{className:'pitch-selector',attrs:{role:'group','aria-label':'场上位置选择'}});
    Object.entries(POSITION_CONFIG).forEach(([id,cfg])=>{
      const b=button(cfg.name,{className:`pitch-position ${draft.position===id?'is-selected':''}`,onClick:()=>{draft.position=id;draft.style=cfg.roles[0];render();}});
      b.style.left=`${cfg.x}%`;
      b.style.top=`${cfg.y}%`;
      b.dataset.position=id;
      pitch.append(b);
    });
    const cfg=POSITION_CONFIG[draft.position];
    const attrNames={pac:'速度',sho:'射门',pas:'传球',dri:'盘带',def:'防守',phy:'身体'};
    const detail=el('aside',{className:'position-detail'},[
      el('div',{className:'eyebrow',text:'场上位置'}),
      el('h2',{text:cfg.name}),
      el('p',{text:positionDuty(cfg.group)}),
      el('h3',{text:'主要属性'}),
      el('div',{className:'tag-row'},cfg.focus.map(k=>el('span',{className:'tag',text:attrNames[k]}))),
      el('h3',{text:'可选成长路线'}),
      el('ul',{className:'clean-list'},cfg.roles.map(x=>el('li',{text:x})))
    ]);
    grid.append(pitch,detail);
    return grid;
  }

  function styleStep(){
    const cfg=POSITION_CONFIG[draft.position];
    const grid=el('div',{className:'choice-grid'});
    cfg.roles.forEach((style,i)=>{
      const card=button('',{className:`selection-card ${draft.style===style?'is-selected':''}`,onClick:()=>{draft.style=style;render();}});
      card.append(el('span',{className:'selection-index',text:String(i+1)}),el('h3',{text:style}),el('p',{text:styleDescription(style)}));
      grid.append(card);
    });
    return grid;
  }

  function talentStep(){
    if(!draft.talents.length)prepareTalents();
    const wrap=el('div',{className:'talent-layout'});
    const actions=el('div',{className:'inline-actions'},[
      el('p',{text:`剩余重抽次数：${draft.rerolls}`}),
      button('重新抽取',{className:'button button--secondary',disabled:draft.rerolls<=0,onClick:()=>{if(draft.rerolls<=0)return;draft.rerolls--;prepareTalents(true);render();}})
    ]);
    wrap.append(actions);
    const grid=el('div',{className:'talent-grid'});
    draft.talents.forEach((t,i)=>{
      const card=button('',{className:`talent-card ${draft.selectedTalent===i?'is-selected':''}`,onClick:()=>{draft.selectedTalent=i;render();}});
      card.style.setProperty('--rarity-color',t.color);
      card.append(
        el('span',{className:'rarity-badge',text:t.rarity}),
        el('h3',{text:t.name}),
        el('p',{text:t.description}),
        el('div',{className:'tag-row'},[el('span',{className:'tag',text:`潜力 ${t.potential}`}),el('span',{className:'tag',text:`成长 ×${t.growthMultiplier}`})]),
        el('small',{className:'talent-cost',text:`潜在代价：${t.cost}`})
      );
      grid.append(card);
    });
    wrap.append(grid);
    return wrap;
  }

  function academyStep(){
    if(!draft.academyOffers.length)prepareAcademies();
    const wrap=el('div',{className:'academy-layout'});
    const talent=draft.talents[draft.selectedTalent];
    const source=repo.templates.find(x=>x.id===talent.sourceTemplateId);
    const previewAttrs=source?source.attrs:{pac:62,sho:60,pas:59,dri:61,def:48,phy:59};
    wrap.append(el('section',{className:'scout-report'},[
      el('div',{className:'report-rating'},[el('strong',{text:String(calculateOvr(previewAttrs,draft.position))}),el('span',{text:'球探预估'})]),
      createRadarChart(previewAttrs,draft.position,{size:190}),
      el('div',{},[el('h2',{text:`${draft.name} · ${draft.style}`}),el('p',{text:`${talent.rarity}天赋，潜力区间围绕 ${talent.potential} 展开。最终发展取决于训练、上场、伤病和职业选择。`})])
    ]));
    const list=el('div',{className:'academy-offers'});
    draft.academyOffers.forEach((o,i)=>{
      const club=repo.getClub(o.clubId);
      const card=button('',{className:`offer-card ${draft.selectedAcademy===i?'is-selected':''}`,onClick:()=>{draft.selectedAcademy=i;render();}});
      card.append(
        el('div',{className:'club-mark',text:club.code||club.cn.slice(0,1)}),
        el('div',{className:'offer-main'},[el('h3',{text:club.cn}),el('p',{text:`${club.leagueCn} · ${o.squad}`}),el('small',{text:`${o.role} · ${o.reason}`})]),
        el('div',{className:'offer-money'},[el('strong',{text:formatMoney(o.weeklyWage)}),el('small',{text:'周薪'})])
      );
      list.append(card);
    });
    wrap.append(list);
    return wrap;
  }

  function prepareStep(){
    if(draft.step===4&&!draft.talents.length)prepareTalents();
    if(draft.step===5&&!draft.academyOffers.length)prepareAcademies();
  }
  function prepareTalents(force=false){
    if(force)draft.seed=createSeed();
    draft.talents=createTalentCandidates({seed:draft.seed,position:draft.position,style:draft.style,templates:repo.templates,count:3});
    draft.selectedTalent=0;
    draft.academyOffers=[];
  }
  function prepareAcademies(){
    const t=draft.talents[draft.selectedTalent];
    const source=repo.templates.find(x=>x.id===t.sourceTemplateId);
    const ovr=source?calculateOvr(source.attrs,draft.position):62;
    draft.academyOffers=generateAcademyOffers({seed:draft.seed,nation:draft.nation,position:draft.position,ovr,talent:t,clubs:repo.clubs});
    draft.selectedAcademy=0;
  }
  function validate(){
    if(draft.step===1&&(!draft.name||draft.height<155||draft.height>205||draft.weight<45||draft.weight>110)){
      showToast('请完整填写合理的身份信息',{type:'error'});
      return false;
    }
    if(draft.step===4&&!draft.talents.length)return false;
    if(draft.step===5&&!draft.academyOffers.length)return false;
    return true;
  }

  render();
  return()=>clear(root);
}

function positionDuty(group){
  if(group==='keeper')return'保护球门、组织后场并处理一对一。';
  if(group==='defense')return'防守空间、赢下对抗并支持后场出球。';
  if(group==='midfield')return'连接攻防、控制节奏并覆盖中场区域。';
  if(group==='creative')return'在前场创造机会，连接中场与锋线。';
  return'攻击防线身后、制造进球和决定比赛。';
}
function styleDescription(style){return`${style}会改变该位置的训练倾向、比赛选择和球队适配。`;}
