import {el,button,clear} from '../utils/dom.js';
import {createPlayerCard} from '../components/playerCard.js';
import {achievementProgress} from '../systems/achievement/achievementSystem.js';
import {RELATION_KEYS,RELATION_LABELS,relationshipScore} from '../systems/relationship/relationshipSystem.js';
import {formatMoney} from '../utils/format.js';
import {showToast} from '../components/toast.js';
import {saveManager} from '../services/storage/saveManager.js';
import {POSITION_CONFIG} from '../app/config.js';
import {TRAINING_STRATEGIES,MATCH_STRATEGIES,CAREER_STRATEGIES,getPaceMode,getSpeed,setStrategies} from '../systems/pace/paceSystem.js';
import {ANIMATION_MODES} from '../animations/settings/animationSettings.js';
import {animationDirector} from '../animations/director/animationDirector.js';

export function renderProfilePage(container,ctx){
  const {store,repo,onReturnToSlots}=ctx,save=store.state,club=repo.getClub(save.career.clubId);clear(container);const page=el('section',{className:'page'});page.append(el('div',{className:'profile-grid'},[createPlayerCard(save,club,{compact:true}),careerSummary(save,repo)]),relations(save),achievements(save,repo),settings(save,store,onReturnToSlots,repo,ctx));container.append(page);return()=>{}
}
function careerSummary(save,repo){const c=save.career.careerStats,position=POSITION_CONFIG[save.player.position]?.name||'未知位置',notes=save.meta?.migrationNotes||[];return el('section',{className:'glass-card profile-summary'},[el('span',{className:'eyebrow',text:'生涯档案'}),el('h1',{text:save.player.name}),el('p',{text:`${save.player.nation} · ${position} · ${save.player.foot} · ${save.player.height}厘米 / ${save.player.weight}公斤`}),el('div',{className:'metric-grid'},[['总出场',c.apps],['总进球',c.goals],['总助攻',c.assists],['国家队',c.nationalApps],['奖杯',c.titles],['最高评分',c.bestRating||'—']].map(([l,v])=>metric(l,v))),el('div',{className:'detail-list'},[detail('成长模板',save.player.talent.name),detail('稀有度',save.player.talent.rarity),detail('当前身价',formatMoney(save.finance.marketValue)),detail('现金资产',formatMoney(save.finance.cash)),detail('效力球队',`${new Set(save.career.clubHistory).size}家`),detail('存档版本',save.gameVersion),notes.length?detail('最近迁移说明',notes.at(-1)):null])])}
function relations(save){const section=el('section',{className:'section-block'},[el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'关系网络'}),el('h2',{text:'职业关系'})]),el('small',{className:'muted',text:'信任、尊重、竞争、熟悉与矛盾共同作用'})])]);const grid=el('div',{className:'relation-grid'});RELATION_KEYS.forEach(key=>{const r=save.relations[key],score=relationshipScore(r);grid.append(el('article',{className:'glass-card relation-card'},[el('div',{className:'relation-score',text:String(score)}),el('div',{},[el('h3',{text:RELATION_LABELS[key]}),el('p',{text:`信任 ${r.trust} · 尊重 ${r.respect} · 熟悉 ${r.familiarity}`}),el('small',{text:`竞争 ${r.rivalry} · 矛盾 ${r.conflict}`})])]))});section.append(grid);return section}
function achievements(save,repo){let limit=36,filter='全部';const section=el('section',{className:'section-block'});const head=el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'成就系统'}),el('h2',{text:`已解锁 ${save.achievements.unlocked.length}/${repo.achievements.length}`})])]);const controls=el('div',{className:'achievement-filters'});['全部','已解锁','未解锁','隐藏'].forEach(x=>controls.append(button(x,{className:'filter-chip',onClick:e=>{filter=x;limit=36;renderList()}})));const list=el('div',{className:'achievement-grid'});const more=button('加载更多',{className:'button button--secondary',onClick:()=>{limit+=36;renderList()}});function renderList(){list.replaceChildren();const items=repo.achievements.filter(a=>filter==='全部'||filter==='已解锁'&&save.achievements.unlocked.includes(a.id)||filter==='未解锁'&&!save.achievements.unlocked.includes(a.id)&&!a.hidden||filter==='隐藏'&&a.hidden).slice(0,limit);items.forEach(a=>{const unlocked=save.achievements.unlocked.includes(a.id),progress=achievementProgress(save,a);const card=button('',{className:`achievement-card ${unlocked?'is-unlocked':''} ${a.hidden&&!unlocked?'is-hidden':''}`,disabled:!unlocked,onClick:()=>animationDirector.play('trophy-reveal',{id:a.id,label:a.name},{token:`trophy:${a.id}:${save.updatedAt}`})});card.append(el('span',{className:'achievement-icon',text:unlocked?'🏆':a.hidden?'？':'◇'}),el('div',{},[el('h3',{text:a.hidden&&!unlocked?'隐藏成就':a.name}),el('p',{text:a.hidden&&!unlocked?'继续职业生涯以发现条件':a.description}),el('div',{className:'mini-progress'},[el('i',{attrs:{style:`width:${progress.ratio*100}%`}})]),el('small',{text:unlocked?`已解锁 · 成就分 ${a.reward}`:`进度 ${progress.current}/${progress.target}`})]));list.append(card)});more.hidden=items.length>=repo.achievements.filter(a=>filter==='全部'||filter==='已解锁'&&save.achievements.unlocked.includes(a.id)||filter==='未解锁'&&!save.achievements.unlocked.includes(a.id)&&!a.hidden||filter==='隐藏'&&a.hidden).length}
 renderList();section.append(head,controls,list,more);return section}
function settings(save,store,onReturnToSlots,repo,ctx){
  const section=el('section',{className:'section-block'},[el('div',{className:'section-heading'},[el('div',{},[el('span',{className:'eyebrow',text:'游戏与存档'}),el('h2',{text:'设置'})])])]);
  const card=el('section',{className:'glass-card settings-card'});
  const training=selectControl(Object.values(TRAINING_STRATEGIES).map(x=>[x.id,x.name]),save.career.strategies.training);
  training.onchange=()=>store.update(s=>setStrategies(s,{training:training.value}),'strategy-training');
  const match=selectControl(Object.values(MATCH_STRATEGIES).map(x=>[x.id,x.name]),save.career.strategies.match);
  match.onchange=()=>store.update(s=>setStrategies(s,{match:match.value}),'strategy-match');
  const career=selectControl(Object.values(CAREER_STRATEGIES).map(x=>[x.id,x.name]),save.career.strategies.career);
  career.onchange=()=>store.update(s=>setStrategies(s,{career:career.value}),'strategy-career');
  const animation=selectControl(Object.entries(ANIMATION_MODES).map(([id,item])=>[id,item.label]),save.settings.animationMode||'standard');
  animation.onchange=()=>{store.update(s=>{s.settings.animationMode=animation.value},'animation-mode');animationDirector.settings.setMode(animation.value);showToast(`动画模式已切换为：${ANIMATION_MODES[animation.value].label}`,{type:'success'})};
  const pace=getPaceMode(save),speed=getSpeed(save);
  const paceButton=button('',{className:'settings-open-row',ariaLabel:'打开游戏节奏设置',onClick:()=>ctx.openPaceSettings?.()});
  paceButton.append(el('span',{},[el('strong',{text:'游戏节奏'}),el('small',{text:'推进速度、自动模拟和关键节点暂停统一在这里管理。'})]),el('span',{className:'settings-open-row__value',text:`${pace.name} · ${speed.id==='turbo'?'极速':speed.label} ›`}));
  card.append(
    el('div',{className:'setting-row setting-row--static'},[el('div',{},[el('strong',{text:'界面外观'}),el('small',{text:'V20使用浅色职业控制台和悬浮导航。'})]),el('span',{className:'tag tag--accent',text:'浅色'})]),
    paceButton,
    settingRow('自动训练策略','快速推进时使用的训练方向',training),
    settingRow('自动比赛策略','普通比赛自动决策偏好',match),
    settingRow('职业策略','自动事件和转会倾向',career),
    settingRow('动画表现','完整、标准、简洁、仅重大事件或关闭非必要动画',animation),
    fileActions(save,store,onReturnToSlots)
  );section.append(card);return section;
}

function fileActions(save,store,onReturnToSlots){
  const input=el('input',{attrs:{type:'file',accept:'application/json'},className:'visually-hidden'});
  input.onchange=async()=>{try{await saveManager.import(input.files[0]);showToast('存档导入成功',{type:'success'});location.reload()}catch{showToast('存档导入失败',{type:'error'})}};
  return el('div',{className:'settings-actions'},[
    button('手动保存',{className:'button',onClick:()=>{store.saveNow();showToast('存档已保存',{type:'success'})}}),button('导出存档',{className:'button',onClick:()=>saveManager.export(save)}),button('导入存档',{className:'button',onClick:()=>input.click()}),button('存档槽位',{className:'button button--secondary',onClick:onReturnToSlots}),input
  ]);
}
function selectControl(items,value){const select=el('select',{className:'select-input'});items.forEach(([v,n])=>select.append(el('option',{text:n,attrs:{value:v,selected:v===value}})));return select}
function settingRow(title,copy,control){return el('label',{className:'setting-row'},[el('div',{},[el('strong',{text:title}),el('small',{text:copy})]),control])}

function metric(label,value){return el('div',{className:'metric'},[el('small',{text:label}),el('strong',{text:String(value)})])}
function detail(label,value){return el('div',{className:'detail-row'},[el('span',{text:label}),el('strong',{text:String(value)})])}
