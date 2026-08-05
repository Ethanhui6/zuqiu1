import {DeterministicRng} from '../../services/rng.js';
import {clamp} from '../../utils/format.js';
import {applyRelation} from '../relationship/relationshipSystem.js';
import {applyDevelopment} from '../../core/playerDevelopmentEngine.js';

const EVENTS=[
  {id:'coach-intensity',title:'教练临时安排高强度合练',desc:'教练希望你在关键比赛前提高训练强度。',when:s=>!s.status.injury&&s.status.fatigue<70,choices:[
    {id:'accept',name:'主动参加',hint:'成长和信任更高，疲劳与风险上升',effects:{xp:14,fatigue:14,coachTrust:4,injuryRisk:9}},
    {id:'controlled',name:'控制强度',hint:'收益稳定，风险较低',effects:{xp:8,fatigue:7,coachTrust:2,injuryRisk:2}},
    {id:'decline',name:'保存状态',hint:'保持健康，但教练评价略降',effects:{fitness:5,coachTrust:-2,injuryRisk:-4}}
  ]},
  {id:'extra-practice',title:'队友邀请赛后加练',desc:'一名同位置队友邀请你留下完成专项练习。',when:s=>!s.status.injury,choices:[
    {id:'join',name:'一起加练',hint:'提升专项经验和队友关系',effects:{xp:10,fatigue:8,teammates:5}},
    {id:'video',name:'改看录像',hint:'增加战术理解，体能消耗较少',effects:{xp:6,fatigue:2,coachTrust:2}},
    {id:'rest',name:'婉拒并恢复',hint:'恢复体能，关系变化有限',effects:{fitness:6,teammates:-1}}
  ]},
  {id:'minor-discomfort',title:'训练中出现轻微不适',desc:'医疗团队建议你立即调整本次训练计划。',when:s=>s.status.fatigue>=45&&!s.status.injury,choices:[
    {id:'stop',name:'立即停止',hint:'降低复发风险，损失本次成长',effects:{fitness:5,fatigue:-12,injuryRisk:-8}},
    {id:'light',name:'改为轻量训练',hint:'保留少量收益，风险可控',effects:{xp:4,fatigue:-4,injuryRisk:1}},
    {id:'push',name:'坚持完成',hint:'高收益高风险',effects:{xp:12,fatigue:10,coachTrust:3,injuryRisk:18}}
  ]},
  {id:'tactical-breakthrough',title:'新战术理解取得突破',desc:'你开始更快读懂球队在无球阶段的要求。',when:s=>['tactics','newPosition'].includes(s.career.trainingPlan),choices:[
    {id:'study',name:'继续深入',hint:'提升战术经验和教练信任',effects:{xp:10,coachTrust:4,fatigue:3}},
    {id:'practice',name:'带入实战',hint:'提升位置适配，疲劳更高',effects:{xp:8,fatigue:7,positionFit:6}}
  ]},
  {id:'weak-foot-breakthrough',title:'弱势脚训练出现突破',desc:'连续训练后，你开始更自然地使用弱势脚处理球。',when:s=>s.career.trainingPlan==='weakFoot',choices:[
    {id:'repeat',name:'重复动作',hint:'提高稳定性，疲劳增加',effects:{xp:11,fatigue:6}},
    {id:'match-use',name:'准备比赛使用',hint:'解锁隐藏进度，短期风险略高',effects:{xp:7,trait:'versatile',injuryRisk:2}}
  ]},
  {id:'academy-focus',title:'青年队教练单独指导',desc:'教练愿意在训练后为你安排一段一对一指导。',when:s=>s.career.squadLevel!=='一线队',choices:[
    {id:'technical',name:'打磨技术',hint:'提高核心属性经验',effects:{xp:12,fatigue:5,coachTrust:3}},
    {id:'role',name:'询问上场角色',hint:'提高信任和队内顺位信息',effects:{coachTrust:5,positionFit:4}},
    {id:'recovery',name:'优先恢复',hint:'保持健康，成长较少',effects:{fitness:7,fatigue:-6}}
  ]},
  {id:'media-training',title:'媒体拍到你独自加练',desc:'训练结束后的一段加练被俱乐部媒体记录下来。',when:s=>s.status.fatigue<65,choices:[
    {id:'share',name:'公开训练片段',hint:'提高粉丝与媒体热度',effects:{fans:900,fatigue:3}},
    {id:'quiet',name:'保持低调',hint:'提高职业评价，热度变化较小',effects:{coachTrust:2,xp:4}},
    {id:'team',name:'强调团队帮助',hint:'改善队友关系和球迷评价',effects:{teammates:4,fans:350}}
  ]}
];

function ensureState(save){
  save.career.trainingEvents={current:null,history:[],resolvedWeeks:[],...(save.career.trainingEvents||{})};
  save.career.trainingEvents.history??=[];save.career.trainingEvents.resolvedWeeks??=[];
  return save.career.trainingEvents;
}
function weekKey(save){return`${save.career.gameClock?.seasonId}:${save.career.gameClock?.competitionWeek}`}

export function ensureTrainingEvent(save){
  const state=ensureState(save),key=weekKey(save);if(state.current&&!state.current.resolved)return state.current;if(state.resolvedWeeks.includes(key))return null;
  const eligible=EVENTS.filter(event=>event.when(save));if(!eligible.length)return null;
  const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;
  const recent=new Set(state.history.slice(0,4).map(item=>item.templateId));const pool=eligible.filter(event=>!recent.has(event.id));const template=rng.pick(pool.length?pool:eligible);
  const event={id:`training-${key}-${template.id}`,templateId:template.id,title:template.title,desc:template.desc,choices:structuredClone(template.choices),resolved:false,createdAt:save.career.gameClock?.currentDate};
  state.current=event;save.rng=rng.snapshot();return event;
}

export function resolveTrainingEvent(save,choiceId){
  const state=ensureState(save),event=state.current;if(!event||event.resolved)throw new Error('当前没有待处理训练事件');const choice=event.choices.find(item=>item.id===choiceId);if(!choice)throw new Error('训练事件选项不存在');
  const effects=choice.effects||{},before={fitness:save.status.fitness,fatigue:save.status.fatigue,coachTrust:save.status.coachTrust,fans:save.fans.social};
  const focus=(save.career.trainingPlan==='shooting'?'sho':save.career.trainingPlan==='speed'?'pac':save.career.trainingPlan==='defense'?'def':'pas');
  const growth=applyDevelopment(save,{[focus]:Math.max(0,effects.xp||0)},{source:'training-event',reason:`${event.title}：${choice.name}`});
  if(effects.fitness)save.status.fitness=clamp(save.status.fitness+effects.fitness,0,100);
  if(effects.fatigue)save.status.fatigue=clamp(save.status.fatigue+effects.fatigue,0,100);
  if(effects.coachTrust)save.status.coachTrust=clamp(save.status.coachTrust+effects.coachTrust,0,100);
  if(effects.teammates)applyRelation(save,'teammates',{trust:effects.teammates,respect:Math.max(0,Math.round(effects.teammates/2)),familiarity:Math.max(1,effects.teammates)});
  if(effects.fans){save.fans.social=Math.max(0,save.fans.social+effects.fans);save.fans.mediaHeat=clamp(save.fans.mediaHeat+2,0,100)}
  if(effects.positionFit){save.career.positionFit=clamp(Number(save.career.positionFit||50)+effects.positionFit,0,100)}
  if(effects.trait){save.career.traits.progress[effects.trait]=(save.career.traits.progress[effects.trait]||0)+12}
  const risk=Number(effects.injuryRisk||0);if(risk>0){const rng=new DeterministicRng(save.rng.seed,save.rng.state);rng.counter=save.rng.counter||0;if(rng.bool(Math.min(.55,risk/100))){save.status.injury={name:risk>=15?'肌肉拉伤':'轻微不适',severity:risk>=15?.28:.1,remainingMatches:risk>=15?2:1,recurrenceRisk:20+risk};save.status.fitness=clamp(save.status.fitness-12,0,100)}save.rng=rng.snapshot()}
  event.resolved=true;event.choiceId=choice.id;event.result={summary:choice.hint,effects:structuredClone(effects),growth,before,after:{fitness:save.status.fitness,fatigue:save.status.fatigue,coachTrust:save.status.coachTrust,fans:save.fans.social,injury:save.status.injury?.name||null}};
  const key=weekKey(save);state.resolvedWeeks.push(key);state.resolvedWeeks=state.resolvedWeeks.slice(-60);state.history.unshift({id:event.id,templateId:event.templateId,title:event.title,choice:choice.name,date:save.career.gameClock?.currentDate,result:event.result});state.history=state.history.slice(0,50);state.current=null;
  save.career.history.push({type:'training-event',year:save.career.year,title:event.title,text:`${choice.name}：${choice.hint}`});return{event,choice,result:event.result};
}
