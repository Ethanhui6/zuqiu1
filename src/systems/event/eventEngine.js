import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {applyFanChange} from '../fan/fanSystem.js';
import {applyRelation} from '../relationship/relationshipSystem.js';
import {activeObjectiveTags} from '../career/objectiveSystem.js';

const CATEGORY_BY_STAGE={
  青训期:['academy','training','coach','teammate','family','selection','match','fans'],
  突破期:['training','match','coach','teammate','locker','agent','media','transfer','rivalry','social'],
  成长期:['training','match','coach','locker','agent','contract','media','sponsor','national','leadership','tactics'],
  巅峰期:['match','leadership','contract','media','national','sponsor','rivalry','legacy','finance'],
  生涯末期:['legacy','leadership','contract','family','finance','recovery','media','national']
};

const PHASE_ALIASES={youth:'青训期',academy:'青训期',rotation:'突破期',breakthrough:'突破期',starter:'成长期',growth:'成长期',star:'巅峰期',peak:'巅峰期',veteran:'生涯末期',late:'生涯末期'};
const STYLE_LABEL={safe:'稳健',gamble:'冒险',technical:'技术',heart:'情感',self:'个人',longterm:'长期',aggressive:'强硬',negotiate:'谈判',professional:'职业',team:'团队',counter:'反击',balanced:'均衡'};
const PERSON_BY_CATEGORY={coach:'主教练',teammate:'队友',locker:'队长',agent:'经纪人',media:'记者',family:'家人',contract:'管理层',transfer:'球探',national:'国家队教练',leadership:'更衣室核心',training:'体能教练',academy:'青训主管',rivalry:'竞争对手'};

const SCENES={
  coach:[
    s=>s.career.squadLevel!=='一线队'&&s.status.coachTrust>=60?['一线队训练名额','主教练愿意给你一次跟随一线队训练的机会，但要求你先接受更严格的战术纪律。']:null,
    s=>s.career.teamRole==='未进入名单'?['你暂时不在比赛计划中','教练直言你最近的状态不足以进入名单，下一步回应会影响短期出场顺位。']:null,
    s=>['临时位置调整',`教练希望你在接下来的比赛中尝试不同职责，以解决${s.player.position}位置的阵容问题。`],
    s=>['关键比赛责任','教练准备在下一场重要比赛中增加你的责任，但不保证首发位置。'],
    s=>['训练态度谈话','教练组关注到你的训练选择，希望确认你是否愿意承担更高强度。']
  ],
  training:[
    s=>['训练负荷重新安排',`近期疲劳为 ${Math.round(s.status.fatigue)}，教练组要求你在成长和健康之间重新取舍。`],
    s=>['专项训练机会',`本周可以围绕${s.player.style}进行一次额外训练，但会增加比赛前的身体负担。`],
    s=>['弱项暴露','录像分析指出你的一个弱项正在影响比赛表现，现在需要决定是否改变训练重点。']
  ],
  match:[
    s=>['下一场比赛的角色',`教练组正在决定你是首发、替补还是留在名单外，你的准备方式会影响最终安排。`],
    s=>['关键对手研究','分析团队提供了对手弱点，你需要决定比赛中更强调个人数据还是团队执行。'],
    s=>['比赛日压力','近期表现让外界期待上升，这场比赛可能改变你的球队地位。']
  ],
  teammate:[
    s=>['队内竞争升温','同位置队友最近状态出色，你们正在竞争有限的出场时间。'],
    s=>['队友请求配合','一名队友希望你在比赛中更多支持他的跑位，这可能影响你的个人数据。'],
    s=>['更衣室分歧','队友对训练和比赛分工存在不同意见，你需要选择站队或保持中立。']
  ],
  locker:[
    s=>['更衣室需要表态','队内气氛出现波动，队长希望你对当前问题给出明确态度。'],
    s=>['队长职责试探','老队员开始观察你的领导方式，这次处理会影响长期更衣室地位。']
  ],
  agent:[
    s=>['经纪人带来新方向','经纪人提出一条更激进的职业路线，但短期出场和收入无法同时保证。'],
    s=>['市场价值评估',`你的当前身价正在变化，经纪人希望决定是继续积累表现，还是提前接触新球队。`]
  ],
  transfer:[
    s=>['新的球队关注','一家不同风格的球队开始持续观察你，但他们只愿意提供有限角色。'],
    s=>['租借还是留队','球队愿意讨论租借方案，留队则需要继续面对当前竞争。'],
    s=>['转会窗口前的选择','市场即将变化，你需要决定是否公开表达离队意愿。']
  ],
  contract:[
    s=>['合同条件出现分歧',`俱乐部愿意继续合作，但工资、角色和出场承诺无法全部满足。`],
    s=>['续约谈判前夕','管理层希望尽快确定未来，你的选择会影响转会自由和球队地位。']
  ],
  media:[
    s=>['赛后采访焦点','记者希望你评价球队表现，直接回答可能提升热度，也可能制造更衣室压力。'],
    s=>['舆论开始分化','近期表现让球迷评价出现分歧，你可以回应、沉默或把注意力放回比赛。']
  ],
  injury:[
    s=>['身体出现预警','医疗组发现潜在风险，继续训练可能保住位置，也可能让伤势恶化。'],
    s=>['康复进度选择','恢复情况好于预期，但提前复出会增加再次受伤概率。']
  ],
  recovery:[
    s=>['复出节奏决定','你已经接近恢复，医疗组和教练组对复出时间意见不同。']
  ],
  national:[
    s=>['国家队观察名单','国家队教练组正在评估你，接下来的比赛表现会影响是否正式征召。'],
    s=>['国家队角色竞争','你需要在有限时间内证明自己适合当前体系。']
  ],
  leadership:[
    s=>['队长责任靠近','教练组开始考虑让你承担更多更衣室责任。'],
    s=>['关键时刻的声音','球队需要有人在压力下稳定情绪，你可以主动站出来或专注个人表现。']
  ],
  academy:[
    s=>['青训名额竞争','学院只会保留有限的重点培养名额，你必须决定短期表现还是长期成长优先。'],
    s=>['豪门试训窗口','一支更强球队提供短期试训，但无法保证正式合同。']
  ],
  selection:[
    s=>['名单竞争最后阶段','教练将在本周确定比赛名单，你的训练选择会影响是否入选。']
  ],
  rivalry:[
    s=>['竞争对手公开挑战','同位置竞争者在媒体前表达信心，这会影响队内和球迷对你们的比较。']
  ],
  sponsor:[
    s=>['商业合作邀请','品牌愿意提供合作，但会增加场外活动和媒体曝光。']
  ],
  finance:[
    s=>['职业收入安排','你需要在短期消费、家庭支持和长期保障之间分配收入。']
  ],
  family:[
    s=>['家庭与职业冲突','家人希望你做出更稳定的选择，但这可能限制职业冒险。']
  ],
  legacy:[
    s=>['职业生涯的下一章','年龄和经历让你开始思考未来角色，这次选择会影响最终结局。']
  ]
};

const ACTION_WORDS={
  safe:'接受稳妥方案',professional:'按计划执行',aggressive:'主动争取更大责任',gamble:'冒险冲击机会',negotiate:'提出折中条件',team:'与队友共同解决',heart:'照顾关系与情绪',longterm:'优先长期成长',counter:'用表现正面回应',technical:'依靠技术方案',self:'坚持个人路线',balanced:'保持平衡'
};
const CATEGORY_ACTION_SUFFIX={coach:'并争取明确角色',training:'并调整训练重点',match:'并改变比赛策略',teammate:'并处理队内关系',locker:'并影响更衣室立场',agent:'并调整职业规划',transfer:'并改变转会方向',contract:'并重新谈判条件',media:'并控制舆论影响',injury:'并承担身体风险',recovery:'并确定复出节奏',national:'并争取征召机会',leadership:'并承担领导责任',academy:'并竞争培养名额',selection:'并争取进入名单'};

function phaseValues(value){if(!value)return[];const values=Array.isArray(value)?value:[value];return values.flatMap(item=>String(item).split(/[,|/]/)).map(item=>item.trim()).filter(Boolean).map(item=>PHASE_ALIASES[item]||item)}
function phaseEligible(value,current){const phases=phaseValues(value);if(!phases.length)return true;if(phases.includes(current))return true;if(current==='生涯末期'&&phases.includes('巅峰期'))return true;return false}

function inferStyle(choice,index=0){
  if(choice.style)return choice.style;
  const text=`${choice.text||choice.label||''} ${choice.hint||''}`;
  if(/高风险|冒险|强行|公开|主动争取/.test(text))return'gamble';
  if(/稳健|沉默|支持|按计划|保持/.test(text))return'safe';
  if(/长期|团队接管|未来|培养/.test(text))return'longterm';
  if(/关系|沟通|队长|队友|家人/.test(text))return'team';
  if(/谈判|条件|协商/.test(text))return'negotiate';
  if(/技术|录像|分析/.test(text))return'technical';
  if(/个人|展示|数据/.test(text))return'self';
  return['professional','aggressive','balanced','counter','heart'][index%5];
}
function inferFocus(choice,category,index=0){
  if(choice.focus)return choice.focus;
  const text=`${choice.text||choice.label||''} ${choice.hint||''}`;
  if(/速度|冲刺|爆发|跑位/.test(text))return'pac';
  if(/射门|进球|远射|点球/.test(text))return'sho';
  if(/传球|组织|沟通|团队|队长/.test(text))return'pas';
  if(/盘带|突破|展示|社交/.test(text))return'dri';
  if(/防守|回防|抢断|纪律/.test(text))return'def';
  if(/身体|体能|恢复|健康|对抗/.test(text))return'phy';
  const byCategory={social:['dri','pas','sho','pac','phy'],locker:['pas','phy','def','dri','pac'],media:['pas','dri','phy','sho','def'],family:['phy','pas','dri','pac','def'],coach:['pas','def','phy','dri','pac']};
  return(byCategory[category]||['pas','phy','dri','def','pac','sho'])[index%6];
}

function normalizeEvent(raw){
  const choices=(raw.choices||raw.options||[]).map((c,i)=>({id:c.id||`${raw.id}-choice-${i}`,text:c.text||c.label||`方案 ${i+1}`,hint:c.hint||c.style||'',style:inferStyle(c,i),focus:inferFocus(c,raw.category||'life',i),base:Number(c.base??.62),multiplier:Number(c.multiplier??1),effects:c.effects||{},outcomes:c.outcomes||null,delayedEffects:c.delayedEffects||[],hiddenEffects:c.hiddenEffects||{},unlockChain:c.unlockChain||null,closeChain:c.closeChain||null}));
  return{id:raw.id,chainId:raw.chainId||null,endChain:Boolean(raw.endChain),title:raw.title,description:raw.description||raw.text||'',category:raw.category||'life',categoryCn:raw.categoryCn||raw.categoryName||'职业事件',phase:raw.phase||raw.stage||null,pressure:raw.pressure||'中压',tags:raw.tags||[raw.category||'life'],weight:Number(raw.weight||1),cooldown:Number(raw.cooldown||raw.cooldownSeasons||3),unique:Boolean(raw.unique||raw.major),repeatable:raw.repeatable!==false,prerequisite:raw.prerequisite||raw.prerequisites||[],next:raw.next||raw.nextEvent||null,conditions:raw.conditions||{},choices};
}
function stage(save){if(save.career.squadLevel!=='一线队')return'青训期';if(save.player.age<=21)return'突破期';if(save.player.age<=28)return'成长期';if(save.player.age<=32)return'巅峰期';return'生涯末期'}
function includesPosition(list,pos){return !Array.isArray(list)||!list.length||list.includes(pos)}
function eventEligible(event,save){
  const mem=ensureMemory(save),c=event.conditions||{};
  if((event.unique||!event.repeatable)&&mem.triggered.includes(event.id))return false;if(event.chainId&&mem.chainsClosed.includes(event.chainId))return false;
  if((mem.cooldowns[event.id]||0)>save.career.season)return false;
  if(!phaseEligible(event.phase,stage(save)))return false;
  if(event.prerequisite?.length&&!event.prerequisite.every(x=>mem.triggered.includes(x)||mem.chainsOpen.includes(x)))return false;
  if(c.minAge!==undefined&&save.player.age<Number(c.minAge))return false;if(c.maxAge!==undefined&&save.player.age>Number(c.maxAge))return false;
  if(!includesPosition(c.positions,save.player.position))return false;
  if(Array.isArray(c.squadLevels)&&c.squadLevels.length&&!c.squadLevels.includes(save.career.squadLevel))return false;
  if(c.injured===true&&!save.status.injury)return false;if(c.injured===false&&save.status.injury)return false;
  if(c.minOvr!==undefined&&save.player.ovr<Number(c.minOvr))return false;if(c.maxOvr!==undefined&&save.player.ovr>Number(c.maxOvr))return false;
  if(c.minCoachTrust!==undefined&&save.status.coachTrust<Number(c.minCoachTrust))return false;
  return event.choices.length>=2;
}
function choiceSignature(choices){return choices.map(x=>`${x.style||'balanced'}:${x.focus||'pas'}`).sort().join('|')}
function titleKey(title=''){return String(title).replace(/[“”‘’"'，。！？、：；（）\s]/g,'').slice(0,42)}
function ensureMemory(save){
  save.career.eventMemory??={};const mem=save.career.eventMemory;
  mem.triggered??=[];mem.recentTags??=[];mem.recentTitles??=[];mem.recentTemplateTitles??=[];mem.recentChoiceSignatures??=[];mem.choices??=[];mem.chainsOpen??=[];mem.chainsClosed??=[];mem.cooldowns??={};mem.recentEventIds??=[];mem.recentPersons??=[];mem.recentOpponents??=[];mem.typeCounts??={};mem.generatedCount??=0;mem.duplicateCount??=0;mem.lastAvailableCount??=0;mem.lastFilteredCount??=0;
  return mem;
}
function renderVariables(text,save,repo){const club=repo.getClub(save.career.clubId);return String(text||'').replaceAll('{球员}',save.player.name).replaceAll('{俱乐部}',club.cn).replaceAll('{位置}',save.player.position).replaceAll('{年龄}',String(save.player.age))}
function selectChoices(event,rng,mem){
  const maxChoices=Math.min(5,event.choices.length),counts=[];
  for(let n=2;n<=maxChoices;n++)counts.push(n);
  if(!counts.length)return event.choices.slice(0,maxChoices);
  let best=null,bestPenalty=Infinity;
  for(let attempt=0;attempt<20;attempt++){
    const optionCount=counts[(rng.int(0,counts.length-1)+attempt)%counts.length];
    const candidate=rng.shuffle(event.choices).slice(0,optionCount),signature=choiceSignature(candidate),styleCount=new Set(candidate.map(x=>x.style)).size,focusCount=new Set(candidate.map(x=>x.focus)).size;
    const recentIndex=mem.recentChoiceSignatures.lastIndexOf(signature),penalty=(recentIndex>=0?100+(mem.recentChoiceSignatures.length-recentIndex):0)+(optionCount-styleCount)*7+(optionCount-focusCount)*3;
    if(penalty<bestPenalty){best=candidate;bestPenalty=penalty}
    if(penalty===0)break;
  }
  return best||event.choices.slice(0,Math.min(3,maxChoices));
}

function originalSummary(event){const text=String(event.description||'').replace(event.title,'').replace(/面对[^。！？]*[。！？]?/g,'').replace(/当前压力[:：][^。！？]*[。！？]?/g,'').trim();return text.slice(0,96)||'当前情况会影响你的出场、关系与长期职业路线。'}
function selectScene(event,save,rng){
  const builders=SCENES[event.category]||[];const valid=[];
  for(const builder of builders){try{const result=builder(save);if(result)valid.push(result)}catch{}}
  if(!valid.length)return[renderVariables(event.title,save,{getClub:()=>({cn:'球队'})}),originalSummary(event)];
  return rng.pick(valid);
}
function effectHint(choice){
  const e=choice.effects||{},risk=Number(e.injuryRisk||0)+Math.max(0,-Number(e.fitness||0))*2+(choice.style==='gamble'?10:0),reward=Number(e.xp||0)+Math.max(0,Number(e.trust||0))*4+Math.max(0,Number(e.fans||0))/300;
  const riskText=risk>=24?'高风险':risk>=12?'中风险':'低风险',rewardText=reward>=60?'高回报':reward>=30?'稳定收益':'长期收益';
  const consequence=[];if(Number(e.trust||0)!==0)consequence.push('教练关系');if(Number(e.fans||0)!==0)consequence.push('球迷评价');if(Number(e.fitness||0)!==0||Number(e.injuryRisk||0)>0)consequence.push('身体状态');if(choice.delayedEffects?.length||choice.style==='longterm')consequence.push('后续剧情');
  return`${riskText} · ${rewardText}${consequence.length?` · 影响${consequence.slice(0,2).join('和')}`:''}`;
}
function contextualize(event,choices,save,repo,rng){
  const [sceneTitle,description]=selectScene(event,save,rng),suffix=CATEGORY_ACTION_SUFFIX[event.category]||'并承担对应后果';
  const baseTitle=renderVariables(event.title,save,repo);
  const title=sceneTitle===baseTitle?sceneTitle:`${sceneTitle} · ${baseTitle}`;
  const used=new Set();
  const transformed=choices.map((choice,index)=>{
    let action=`${ACTION_WORDS[choice.style]||'作出判断'}${suffix}`;
    if(used.has(action))action=`${action}${index===1?'，保留退路':index===2?'，争取短期收益':index===3?'，接受长期代价':'，承担更高风险'}`;
    used.add(action);
    return{...choice,text:action,hint:effectHint(choice)};
  });
  return{...event,templateTitle:event.title,title:renderVariables(title,save,repo),description:renderVariables(description,save,repo),person:PERSON_BY_CATEGORY[event.category]||'职业环境',choices:transformed};
}
function categoryWeights(save,allowed,mem){
  const recent=mem.recentTags.slice(-5),objectiveTags=activeObjectiveTags(save);
  return allowed.map(category=>{
    let weight=recent.includes(category)?.12:1;
    if(objectiveTags.includes('starter')&&['coach','selection','training','match'].includes(category))weight*=1.7;
    if(objectiveTags.includes('transfer-interest')&&['agent','transfer','media'].includes(category))weight*=1.8;
    if(objectiveTags.includes('trust')&&['coach','training','locker'].includes(category))weight*=1.5;
    if(objectiveTags.includes('national')&&['national','match','media'].includes(category))weight*=1.7;
    return{category,weight};
  });
}

export async function generateEvent(save,repo,{category:forcedCategory=null}={}){
  if(save.career.pending.event)return save.career.pending.event;
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const mem=ensureMemory(save),stageCategories=CATEGORY_BY_STAGE[stage(save)]||CATEGORY_BY_STAGE.成长期,allowed=forcedCategory?[forcedCategory]:stageCategories,recentCategories=mem.recentTags.slice(-5),recentTitles=new Set(mem.recentTitles.slice(-20)),recentTemplateTitles=new Set(mem.recentTemplateTitles.slice(-20)),recentEventIds=new Set(mem.recentEventIds.slice(-20)),triggeredIds=new Set(mem.triggered);
  const activeStories=forcedCategory?[]:(repo.storyChains||[]).map(normalizeEvent).filter(event=>eventEligible(event,save)&&event.prerequisite?.some(token=>mem.chainsOpen.includes(token)));
  if(activeStories.length){
    const baseEvent=rng.weighted(activeStories,x=>x.weight)||activeStories[0],choices=selectChoices(baseEvent,rng,mem),event=contextualize(baseEvent,choices,save,repo,rng);
    const generated={...event,generatedAt:{season:save.career.season,month:save.career.month,week:save.career.calendar?.week||1,rngState:rng.state},resolved:false};
    mem.lastAvailableCount=activeStories.length;mem.lastFilteredCount=0;mem.generatedCount++;mem.typeCounts[generated.category]=(mem.typeCounts[generated.category]||0)+1;save.career.pending.event=generated;save.rng=rng.snapshot();return generated;
  }
  const categoryCandidates=categoryWeights(save,allowed,mem);let category=rng.weighted(categoryCandidates,x=>x.weight)?.category||allowed[0];
  let raw=(await repo.loadEventCategory(category)).map(normalizeEvent),pool=raw.filter(e=>eventEligible(e,save));mem.lastAvailableCount=raw.length;mem.lastFilteredCount=raw.length-pool.length;
  let fresh=pool.filter(e=>!triggeredIds.has(e.id)&&!recentEventIds.has(e.id)&&!recentTemplateTitles.has(titleKey(e.title)));
  if(fresh.length)pool=fresh;
  else if(!forcedCategory){
    pool=[];
    const alternatives=rng.shuffle(allowed.filter(x=>x!==category));
    for(const alternative of alternatives){const all=(await repo.loadEventCategory(alternative)).map(normalizeEvent),candidates=all.filter(e=>eventEligible(e,save)&&!triggeredIds.has(e.id)&&!recentEventIds.has(e.id)&&!recentTemplateTitles.has(titleKey(e.title)));mem.lastFilteredCount+=all.length-candidates.length;if(candidates.length){category=alternative;pool=candidates;fresh=candidates;break}}
  }else if(pool.length){
    // 关键事件类别必须保持语义一致；该类别的新模板耗尽时允许复用最久未出现的模板，
    // 但仍受冷却、唯一事件和生涯条件约束。
    const lessRecent=pool.filter(e=>!recentEventIds.has(e.id));if(lessRecent.length)pool=lessRecent;
  }
  if(!pool.length&&!forcedCategory){
    const fallbacks=[...new Set([...allowed,'training','academy','match','life'])];
    for(const fallback of fallbacks){const all=(await repo.loadEventCategory(fallback)).map(normalizeEvent).filter(e=>eventEligible(e,save));const candidates=all.filter(e=>!triggeredIds.has(e.id)&&!recentEventIds.has(e.id)&&!recentTemplateTitles.has(titleKey(e.title)));if(candidates.length){category=fallback;pool=candidates;fresh=candidates;break}}
  }
  if(!pool.length)throw new Error('事件库没有符合当前职业状态的事件');
  const weighted=pool.map(e=>{const sameTitle=recentTitles.has(titleKey(e.title)),chainBoost=(mem.chainsOpen.includes(e.id)||e.prerequisite?.some(x=>mem.chainsOpen.includes(x)))?3:1,tagPenalty=e.tags.some(t=>recentCategories.includes(t))?.28:1,personPenalty=mem.recentPersons.slice(-2).includes(PERSON_BY_CATEGORY[e.category])?.4:1;return{...e,_w:e.weight*(sameTitle?.03:1)*chainBoost*tagPenalty*personPenalty}});
  const baseEvent=rng.weighted(weighted,x=>x._w)||pool[0],choices=selectChoices(baseEvent,rng,mem),event=contextualize(baseEvent,choices,save,repo,rng);
  const generated={...event,generatedAt:{season:save.career.season,month:save.career.month,week:save.career.calendar?.week||1,rngState:rng.state},resolved:false};delete generated._w;
  if(mem.recentTitles.includes(titleKey(generated.title)))mem.duplicateCount++;
  mem.generatedCount++;mem.typeCounts[generated.category]=(mem.typeCounts[generated.category]||0)+1;
  save.career.pending.event=generated;save.rng=rng.snapshot();return generated;
}

function resolveOutcomeChoice(choice,rng,save){
  if(choice.outcomes?.length){const outcomes=choice.outcomes.map(o=>({...o,weight:Number(o.weight||1)}));return rng.weighted(outcomes,x=>x.weight)}
  const skill=save.player.attrs[choice.focus]||60,state=(save.status.morale+save.status.fitness+save.status.coachTrust)/300;
  const success=clamp(choice.base+(skill-60)/150+(state-.5)*.24-(save.status.fatigue/100)*.12,0.08,.94),roll=rng.next();
  const tier=roll<success*.2?'大成功':roll<success?'取得进展':roll<success+.2?'影响有限':'出现代价';
  const scale=(tier==='大成功'?1.6:tier==='取得进展'?1:tier==='影响有限'?.3:-.65)*Number(choice.multiplier||1),e=choice.effects||{};
  return{label:tier,effects:{xp:Math.round((e.xp||12)*scale),coach:Math.round((e.trust||e.coach||0)*scale),morale:Math.round((e.morale||0)*scale),fans:Math.round((e.fans||0)*scale),fitness:Math.round((e.fitness||0)*scale),money:Math.round((e.money||0)*scale),fatigue:scale<0?Math.round((e.injuryRisk||4)*.45):0},weight:1};
}
function addDelayed(save,choice,event,outcome,rng){
  const pending=save.career.pending.delayedEffects;
  for(const item of choice.delayedEffects||[])pending.push({...item,id:item.id||`DE-${event.id}-${choice.id}-${pending.length}`,dueSeason:Number(item.dueSeason||save.career.season+1),source:event.title});
  if(choice.style==='longterm'&&['大成功','取得进展'].includes(outcome.label))pending.push({id:`DE-${event.id}-${choice.id}-${save.career.season}`,dueSeason:save.career.season+1,type:'reputation',amount:outcome.label==='大成功'?3:1,source:event.title});
  if(rng.bool(.12)&&outcome.label==='大成功')pending.push({id:`DE-${event.id}-${choice.id}-bonus`,dueSeason:save.career.season+1,type:'fans',amount:800,source:event.title});
}

export function resolveEventChoice(save,choiceId){
  const event=save.career.pending.event;if(!event||event.resolved)throw new Error('没有待处理事件');const choice=event.choices.find(x=>x.id===choiceId);if(!choice)throw new Error('选择不存在');
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;const outcome=resolveOutcomeChoice(choice,rng,save),effects=outcome.effects||{},focus=choice.focus||'pas';
  save.player.xp[focus]=(save.player.xp[focus]||0)+Math.max(0,effects.xp||0);save.status.coachTrust=clamp(save.status.coachTrust+(effects.coach||effects.trust||0),0,100);save.status.morale=clamp(save.status.morale+(effects.morale||0),0,100);save.status.fitness=clamp(save.status.fitness+(effects.fitness||0),0,100);save.status.fatigue=clamp(save.status.fatigue+(effects.fatigue||0),0,100);save.finance.cash=Math.max(0,save.finance.cash+(effects.money||0));
  applyFanChange(save,{club:(effects.fans||0)*.45,global:(effects.fans||0)*.1,social:(effects.fans||0)*.45,heat:Math.sign(effects.fans||0),reason:event.title});
  if(choice.style==='heart'||choice.style==='team')applyRelation(save,'teammates',{trust:3,respect:2,familiarity:4});if(choice.style==='negotiate')applyRelation(save,'agent',{trust:2,respect:2});if(choice.style==='aggressive')applyRelation(save,'coach',{respect:2,conflict:outcome.label==='出现代价'?8:2});if(choice.style==='safe'||choice.style==='professional')applyRelation(save,'coach',{trust:2});
  const mem=ensureMemory(save);if(!mem.triggered.includes(event.id))mem.triggered.push(event.id);mem.recentTags.push(event.category,...event.tags.slice(0,2));mem.recentTags=mem.recentTags.slice(-20);mem.recentTitles.push(titleKey(event.title));mem.recentTitles=mem.recentTitles.slice(-20);mem.recentTemplateTitles.push(titleKey(event.templateTitle||event.title));mem.recentTemplateTitles=mem.recentTemplateTitles.slice(-20);mem.recentEventIds.push(event.id);mem.recentEventIds=mem.recentEventIds.slice(-20);mem.recentPersons.push(event.person||PERSON_BY_CATEGORY[event.category]||'职业环境');mem.recentPersons=mem.recentPersons.slice(-20);const signature=choiceSignature(event.choices);mem.recentChoiceSignatures.push(signature);mem.recentChoiceSignatures=mem.recentChoiceSignatures.slice(-20);mem.choices.push({eventId:event.id,title:event.title,choiceId,label:choice.text,outcome:outcome.label,season:save.career.season,month:save.career.month,week:save.career.calendar?.week||1});mem.choices=mem.choices.slice(-800);mem.cooldowns[event.id]=save.career.season+event.cooldown;mem.lastChoiceSignature=signature;
  if(event.chainId&&event.prerequisite?.length)mem.chainsOpen=mem.chainsOpen.filter(token=>!event.prerequisite.includes(token));
  if(event.next&&!mem.chainsOpen.includes(event.next))mem.chainsOpen.push(event.next);if(choice.unlockChain&&!mem.chainsOpen.includes(choice.unlockChain))mem.chainsOpen.push(choice.unlockChain);if(choice.closeChain){mem.chainsOpen=mem.chainsOpen.filter(x=>x!==choice.closeChain);if(!mem.chainsClosed.includes(choice.closeChain))mem.chainsClosed.push(choice.closeChain)}
  if(event.endChain&&event.chainId){mem.chainsOpen=mem.chainsOpen.filter(token=>!token.startsWith(`${event.chainId}-`)&&token!==event.chainId);if(!mem.chainsClosed.includes(event.chainId))mem.chainsClosed.push(event.chainId)}
  addDelayed(save,choice,event,outcome,rng);event.resolved=true;event.selectedChoice=choice;event.outcome=outcome;save.rng=rng.snapshot();return{event,choice,outcome};
}

export function consumeResolvedEvent(save){const event=save.career.pending.event;if(event?.resolved)save.career.pending.event=null}
export function applyDelayedEffects(save){
  const due=save.career.pending.delayedEffects.filter(x=>x.dueSeason<=save.career.season),remaining=save.career.pending.delayedEffects.filter(x=>x.dueSeason>save.career.season);save.career.pending.delayedEffects=remaining;
  for(const e of due){if(e.type==='reputation')save.fans.mediaHeat=clamp(save.fans.mediaHeat+Number(e.amount||0),0,100);if(e.type==='fans')applyFanChange(save,{social:Number(e.amount||0),global:Math.round(Number(e.amount||0)*.18),reason:e.source||'延迟影响'});if(e.type==='morale')save.status.morale=clamp(save.status.morale+Number(e.amount||0),0,100);if(e.type==='coachTrust')save.status.coachTrust=clamp(save.status.coachTrust+Number(e.amount||0),0,100)}return due;
}
export function eventChoiceMeta(choice){return STYLE_LABEL[choice.style]||'综合'}
export function isCriticalEvent(event){return Boolean(event.unique||event.pressure==='高压'||['contract','transfer','injury','national','leadership','legacy'].includes(event.category)||/决赛|征召|续约|转会|伤病|一线队/.test(event.title||''))}
export function eventDiagnostics(save){
  const mem=ensureMemory(save),recent=mem.choices.slice(-20),unique=new Set(recent.map(x=>x.eventId)).size;
  return{available:mem.lastAvailableCount,filtered:mem.lastFilteredCount,generated:mem.generatedCount,recentCount:recent.length,recentUnique:unique,recentRepeatRate:recent.length?Number(((recent.length-unique)/recent.length*100).toFixed(1)):0,typeCounts:{...mem.typeCounts},chainsOpen:[...mem.chainsOpen],chainsClosed:[...mem.chainsClosed],cooldowns:Object.keys(mem.cooldowns).length,recentPersons:[...mem.recentPersons.slice(-6)]};
}
