const choice=(id,label,hint,result,effects,extra={})=>Object.freeze({id,label,hint,result,effects:Object.freeze(effects),...extra});
const scene=(title,situation,choices)=>Object.freeze({title,situation,choices:Object.freeze(choices)});

export const CLUB_INTERACTIONS=Object.freeze({
  coach:scene('与主教练沟通','训练结束后，主教练把你留在场边，愿意听取你对当前角色的想法。',[
    choice('responsibility','主动承担更多责任','用训练和比赛表现争取更重要的任务。','教练认可了你的担当，会在接下来的比赛中重点观察。',{trust:4,fatigue:2}),
    choice('feedback','询问改进方向','请教练明确指出进入首发所缺少的环节。','你拿到了一份清晰的改进清单。',{trust:3,morale:2}),
    choice('freedom','争取自由发挥','希望在进攻阶段获得更多处理球权限。','教练同意尝试，但要求你对失误负责。',{trust:-1,morale:4})
  ]),
  minutes:scene('询问出场机会','下一轮名单公布前，你获得一次和教练组讨论出场顺位的机会。',[
    choice('start','直接争取首发','用近期状态说明自己已经准备好首发。','教练组记录了你的首发诉求。',{trust:2,morale:3}),
    choice('rotation','接受轮换计划','先保证稳定进入轮换，再逐步增加时间。','务实态度提升了教练组对你的信任。',{trust:4,morale:1}),
    choice('deadline','要求明确期限','希望教练说明多久后会重新评估顺位。','双方约定在下一阶段复盘出场情况。',{trust:-1,morale:2,management:2})
  ]),
  position:scene('讨论场上位置','战术会议后，助教询问你希望在接下来承担哪类位置职责。',[
    choice('natural','专注主位置','继续打磨当前最熟悉的位置。','教练组确认以主位置安排你的训练。',{trust:2,morale:2},{positionPlan:'natural'}),
    choice('attack','尝试更靠前','愿意承担更多向前跑动和创造任务。','新的进攻职责进入战术训练。',{morale:3,fatigue:2},{positionPlan:'attack'}),
    choice('utility','成为多面手','主动适应多个位置以增加出场机会。','你的战术适应性得到教练组认可。',{trust:4,fatigue:3},{positionPlan:'utility'})
  ]),
  training:scene('调整训练','训练团队给出三个周期方案，只能选择一个作为自动训练重点。',[
    choice('weakness','补齐能力短板','优先训练当前较弱的技术环节。','后续自动训练将优先补齐短板。',{trust:2,fatigue:2},{trainingStrategy:'weakness'}),
    choice('strength','放大核心优势','围绕最强能力建立鲜明比赛特点。','后续自动训练将强化你的核心优势。',{morale:2,fatigue:3},{trainingStrategy:'strength'}),
    choice('recovery','健康与恢复优先','降低负荷，优先恢复体能和控制伤病风险。','后续自动训练切换为恢复方案。',{fatigue:-8,morale:1},{trainingStrategy:'recovery'})
  ]),
  loan:scene('请求外租','经纪人和俱乐部同意讨论外租，但需要先确定你最看重的条件。',[
    choice('minutes','以稳定出场为先','只考虑能承诺轮换以上位置的球队。','俱乐部开始寻找能提供稳定时间的下家。',{trust:1,morale:2},{requestType:'loan-minutes'}),
    choice('development','以成长环境为先','优先考察训练设施和年轻球员培养。','外租名单将优先匹配培养环境。',{management:3,morale:1},{requestType:'loan-development'}),
    choice('level','挑战更高水平','接受更激烈竞争，争取更高联赛平台。','经纪人开始联系更高水平的候选球队。',{trust:2,fatigue:1},{requestType:'loan-level'})
  ]),
  stay:scene('表达留队意愿','管理层希望确认你对球队未来计划的态度。',[
    choice('commit','承诺长期留队','明确表示愿意成为长期计划的一部分。','俱乐部将你视为长期培养对象。',{trust:3,management:4,morale:2},{careerIntent:'long-stay'}),
    choice('role','留队但争取角色','愿意留下，同时希望获得更清晰的比赛定位。','双方会在赛季节点重新评估角色。',{trust:2,management:2,morale:3},{careerIntent:'stay-for-role'}),
    choice('season','至少完成本赛季','暂不承诺长期未来，但保证专注当前赛季。','俱乐部接受了你的阶段性承诺。',{trust:1,management:1,morale:2},{careerIntent:'finish-season'})
  ]),
  'transfer-request':scene('提交转会申请','你与经纪人准备向俱乐部说明离队诉求，需要决定沟通方式。',[
    choice('formal','正式提交申请','明确要求俱乐部开放转会谈判。','正式转会申请已进入管理层流程。',{trust:-5,management:-4,morale:2},{requestType:'transfer-formal'}),
    choice('private','先私下沟通','先说明职业规划，再决定是否公开申请。','管理层同意先进行内部评估。',{trust:-1,management:2,morale:1},{requestType:'transfer-private'}),
    choice('conditions','提出离队条件','只有收到符合竞技目标的报价才离开。','俱乐部记录了你的离队条件。',{trust:-2,management:1,morale:2},{requestType:'transfer-conditions'})
  ]),
  teammate:scene('与队友互动','更衣室训练结束后，队友邀请你参加一次小范围交流。',[
    choice('meal','参加球队聚餐','在场外建立更自然的关系。','轻松交流改善了更衣室气氛。',{teammates:5,morale:3}),
    choice('extra','邀请队友加练','用额外训练提升场上默契。','加练让你们更了解彼此的跑位。',{teammates:4,trust:2,fatigue:4}),
    choice('support','主动化解矛盾','帮助两名队友处理最近的分歧。','队友认可了你的沟通和担当。',{teammates:6,morale:1})
  ]),
  captain:scene('与队长交流','队长在赛前准备中询问你目前最需要哪种支持。',[
    choice('leadership','请教领导方式','学习如何在压力下影响队友。','队长愿意继续指导你的场上沟通。',{captain:5,trust:2}),
    choice('tactics','讨论战术细节','针对你的位置复盘防守和接应。','战术交流让你对球队要求更清楚。',{captain:4,morale:2}),
    choice('support','争取更衣室支持','坦诚说明自己正面对的竞争压力。','队长会在更衣室帮助你稳定位置。',{captain:6,morale:3})
  ]),
  management:scene('与管理层沟通','足球总监安排了一次短会，讨论你在俱乐部的下一阶段。',[
    choice('path','确认职业规划','询问未来两个赛季的角色和培养路线。','管理层给出了明确的阶段目标。',{management:5,morale:2},{careerIntent:'club-path'}),
    choice('facilities','争取训练资源','希望获得更针对你位置的训练支持。','俱乐部同意让教练组调整资源安排。',{management:3,trust:2},{careerIntent:'facility-support'}),
    choice('contract','了解合同态度','提前确认俱乐部对续约和角色的看法。','续约态度被记录，后续谈判会参考本次沟通。',{management:4,morale:1},{careerIntent:'contract-talk'})
  ])
});

export const CURRENT_CLUB_ACTIONS=Object.freeze(Object.keys(CLUB_INTERACTIONS));
export const clubInteractionScenario=action=>CLUB_INTERACTIONS[action]||null;

export function resolveClubInteraction(state,{action,choiceId,club}){
  const scenario=clubInteractionScenario(action),selected=scenario?.choices.find(item=>item.id===choiceId);
  if(!scenario||!selected||!state?.player||!club)throw new Error('Invalid club interaction');
  state.clubInteractions??={cooldowns:{},history:[]};
  state.clubInteractions.cooldowns??={};state.clubInteractions.history??=[];
  state.relationships??={};state.training??={};state.transfer??={offers:[]};state.transfer.offers??=[];
  const changes={};
  applyNumber(state.player,'coachTrust',selected.effects.trust,changes,'教练信任');
  applyNumber(state.player,'morale',selected.effects.morale,changes,'士气');
  applyNumber(state.player,'fatigue',selected.effects.fatigue,changes,'疲劳');
  applyNumber(state.relationships,'teammates',selected.effects.teammates,changes,'队友关系');
  applyNumber(state.relationships,'captain',selected.effects.captain,changes,'队长关系');
  applyNumber(state.relationships,'management',selected.effects.management,changes,'管理层关系');
  state.relationships.coach=state.player.coachTrust;
  state.player.fitness=Math.max(10,Math.min(100,Math.round(100-state.player.fatigue*.7)));
  if(selected.trainingStrategy){state.training.autoStrategy=selected.trainingStrategy;changes['训练策略']=selected.label}
  if(selected.positionPlan){state.clubInteractions.positionPlan=selected.positionPlan;changes['位置计划']=selected.label}
  if(selected.careerIntent){state.clubInteractions.careerIntent=selected.careerIntent;changes['职业意向']=selected.label}
  if(selected.requestType){
    const request={id:`request-${state.simulation.date}-${action}-${choiceId}`,clubId:club.id,status:'requested',type:selected.requestType};
    if(!state.transfer.offers.some(item=>item.id===request.id))state.transfer.offers.push(request);
    changes['申请状态']='已提交';
  }
  const key=`${club.id}:${action}`,cooldownUntil=addDays(state.simulation.date,7),clubName=club.cn||club.name||'当前俱乐部';
  state.clubInteractions.cooldowns[key]=cooldownUntil;
  const record={id:`${state.simulation.date}:${club.id}:${action}:${choiceId}`,date:state.simulation.date,clubId:club.id,clubName,action,title:scenario.title,choiceId,choiceLabel:selected.label,result:selected.result,changes};
  state.clubInteractions.history.unshift(record);state.clubInteractions.history=state.clubInteractions.history.slice(0,80);
  return{...record,cooldownUntil,animation:selected.requestType?'offer-enter':selected.effects.trust?'trust-flow':'morale-shift'};
}

function applyNumber(target,key,amount,changes,label){
  if(!Number.isFinite(Number(amount))||Number(amount)===0)return;
  const before=Number(target[key]??50),after=Math.max(0,Math.min(100,before+Number(amount)));
  target[key]=after;if(after!==before)changes[label]=after-before;
}

function addDays(value,days){const date=new Date(`${value}T00:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10)}
