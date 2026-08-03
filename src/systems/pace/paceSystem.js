import {AUTO_PAUSE_RULES,DEFAULT_AUTO_PAUSE,DEFAULT_STRATEGIES,PACE_MODES,SPEED_LEVELS} from '../../app/config.js';
import {clamp} from '../../utils/format.js';

export const TRAINING_STRATEGIES={
  balanced:{id:'balanced',name:'均衡成长',plan:'tactics',desc:'兼顾成长、体能和战术理解。'},
  shooting:{id:'shooting',name:'重点射门',plan:'shooting',desc:'优先终结与得分能力。'},
  speed:{id:'speed',name:'重点速度',plan:'speed',desc:'优先爆发、启动和反击能力。'},
  passing:{id:'passing',name:'重点传球',plan:'passing',desc:'优先视野、组织和机会创造。'},
  physical:{id:'physical',name:'重点身体',plan:'physical',desc:'优先对抗、耐力与稳定出场。'},
  health:{id:'health',name:'保持健康',plan:'recovery',desc:'疲劳过高时自动降低训练强度。'},
  newPosition:{id:'newPosition',name:'适应新位置',plan:'newPosition',desc:'增加第二位置熟练度与战术适配。'}
};

export const MATCH_STRATEGIES={
  aggressive:{id:'aggressive',name:'积极表现',focus:['sho','dri','pac'],styles:['aggressive','gamble'],desc:'追求高回报，承担更多失误和疲劳风险。'},
  stable:{id:'stable',name:'稳定发挥',focus:['pas','def','phy'],styles:['safe','professional'],desc:'优先稳定评分和教练信任。'},
  team:{id:'team',name:'团队优先',focus:['pas','def'],styles:['team','heart'],desc:'优先传球、协防和队友关系。'},
  conserve:{id:'conserve',name:'保存体能',focus:['phy','pas'],styles:['safe'],desc:'降低伤病风险，牺牲部分数据表现。'},
  stats:{id:'stats',name:'争取数据',focus:['sho','dri','pas'],styles:['aggressive','gamble'],desc:'优先进球、助攻和个人曝光。'}
};

export const CAREER_STRATEGIES={
  stay:{id:'stay',name:'留队发展',eventStyles:['professional','safe','team'],desc:'优先教练信任、稳定出场与续约。'},
  starter:{id:'starter',name:'争取首发',eventStyles:['aggressive','professional'],desc:'优先短期出场和位置竞争。'},
  loan:{id:'loan',name:'接受租借',eventStyles:['longterm','negotiate'],desc:'在出场受限时优先寻找租借机会。'},
  transfer:{id:'transfer',name:'寻求转会',eventStyles:['negotiate','aggressive'],desc:'提高转会事件权重并主动吸引关注。'},
  eliteLeague:{id:'eliteLeague',name:'优先高水平联赛',eventStyles:['longterm','gamble'],desc:'接受更激烈竞争以换取更高上限。'},
  salary:{id:'salary',name:'优先高工资',eventStyles:['negotiate','gamble'],desc:'合同与商业收益优先。'},
  minutes:{id:'minutes',name:'优先出场时间',eventStyles:['safe','professional'],desc:'优先承诺明确、竞争较小的球队。'}
};

export function ensurePaceState(save){
  save.settings??={};
  save.settings.pace={
    mode:'standard',
    speed:'normal',
    autoPause:{...DEFAULT_AUTO_PAUSE},
    ...(save.settings.pace||{})
  };
  save.settings.pace.autoPause={...DEFAULT_AUTO_PAUSE,...(save.settings.pace.autoPause||{})};
  save.career??={};
  save.career.strategies={...DEFAULT_STRATEGIES,...(save.career.strategies||{})};
  save.career.advance={running:false,lastSummary:null,history:[],...(save.career.advance||{})};
  save.career.advance.history??=[];
  return save.settings.pace;
}

export function getPaceMode(save){return PACE_MODES[ensurePaceState(save).mode]||PACE_MODES.standard}
export function getSpeed(save){return SPEED_LEVELS.find(item=>item.id===ensurePaceState(save).speed)||SPEED_LEVELS[1]}
export function setPaceMode(save,mode){if(!PACE_MODES[mode])throw new Error('未知职业节奏');ensurePaceState(save).mode=mode;return PACE_MODES[mode]}
export function setSpeed(save,speed){if(!SPEED_LEVELS.some(item=>item.id===speed))throw new Error('未知推进速度');ensurePaceState(save).speed=speed;return getSpeed(save)}
export function setAutoPause(save,key,value){if(!(key in AUTO_PAUSE_RULES))throw new Error('未知自动暂停规则');ensurePaceState(save).autoPause[key]=Boolean(value);return ensurePaceState(save).autoPause}
export function setStrategies(save,next){ensurePaceState(save);save.career.strategies={...save.career.strategies,...next};if(next.training&&TRAINING_STRATEGIES[next.training])save.career.trainingPlan=TRAINING_STRATEGIES[next.training].plan;return save.career.strategies}

export function eventInterval(save,rng){const [min,max]=getPaceMode(save).eventInterval;return rng.int(min,max)}
export function speedDelay(save){return getSpeed(save).delay}
export function autoPauseEnabled(save,key){return ensurePaceState(save).autoPause[key]!==false}

export function eventPauseReason(save,event){
  const tags=new Set([event.category,...(event.tags||[]),event.pressure]);
  const title=event.title||'';
  if(event.rarity==='legend'||tags.has('legend')||/传奇|金球|世界级/.test(title))return autoPauseEnabled(save,'legendEvent')?'legendEvent':null;
  if(event.category==='contract'||/续约|合同/.test(title))return autoPauseEnabled(save,'contract')?'contract':null;
  if(event.category==='coach'||/主教练|教练/.test(title))return autoPauseEnabled(save,'coachTalk')?'coachTalk':null;
  if(event.category==='injury'||/伤病|手术|康复/.test(title))return autoPauseEnabled(save,'injury')?'injury':null;
  if(event.category==='national-team'||event.category==='national'||/国家队|征召/.test(title))return autoPauseEnabled(save,'nationalCall')?'nationalCall':null;
  if(['transfer','agent'].includes(event.category)||/转会|租借|试训/.test(title))return autoPauseEnabled(save,'careerTurn')?'careerTurn':null;
  if(['高压','生涯转折'].includes(event.pressure)||tags.has('unique'))return autoPauseEnabled(save,'careerTurn')?'careerTurn':null;
  return null;
}

export function matchPauseReason(save,match){
  if(/决赛/.test(match.competition||'')||match.importance==='冠军争夺战')return autoPauseEnabled(save,'final')?'final':null;
  if(match.importance!=='普通联赛'&&match.importance!=='普通比赛')return autoPauseEnabled(save,'importantMatch')?'importantMatch':null;
  if(match.starts&&!save.career.records?.firstStart)return autoPauseEnabled(save,'firstStart')?'firstStart':null;
  return null;
}

export function shouldPauseForEvent(save,event,{target}={}){
  if(target==='nextEvent')return true;
  const mode=getPaceMode(save).id;
  if(mode==='immersive')return true;
  // 标准、快速与传奇速通均严格遵守玩家的自动暂停规则。
  // 关闭某项规则后，不再因为事件分类被隐式强制暂停。
  return Boolean(eventPauseReason(save,event));
}

export function shouldPauseForMatch(save,match,{target}={}){
  if(target==='nextMatch')return true;
  const mode=getPaceMode(save).id;
  if(mode==='immersive')return true;
  if(matchPauseReason(save,match))return true;
  return false;
}

export function matchPresentationFor(save,match){
  if(matchPauseReason(save,match))return'interactive';
  return getPaceMode(save).ordinaryMatchMode;
}

function choiceScore(choice,save){
  const strategy=CAREER_STRATEGIES[save.career.strategies?.career]||CAREER_STRATEGIES.stay;
  const match= MATCH_STRATEGIES[save.career.strategies?.match]||MATCH_STRATEGIES.stable;
  const e=choice.effects||{};
  let score=0;
  if(strategy.eventStyles.includes(choice.style))score+=22;
  if(match.focus.includes(choice.focus))score+=8;
  score+=(Number(e.trust||e.coach||0))*1.8+(Number(e.xp||0))*.12+(Number(e.morale||0))*.8+(Number(e.fans||0))/1800;
  score-=Math.max(0,-Number(e.fitness||0))*1.2+Number(e.injuryRisk||0)*.55;
  if(choice.delayedEffects?.length)score+=5;
  return score;
}

export function selectAutoEventChoice(save,event,rng){
  const ranked=event.choices.map(choice=>({choice,score:choiceScore(choice,save)+rng.next()*10})).sort((a,b)=>b.score-a.score);
  return ranked[0]?.choice||event.choices[0];
}

export function selectAutoMatchChoice(save,match,rng){
  const strategy=MATCH_STRATEGIES[save.career.strategies?.match]||MATCH_STRATEGIES.stable;
  const ranked=match.keyChoices.map(choice=>{
    let score=strategy.focus.includes(choice.focus)?18:0;
    if(strategy.id==='conserve'&&['phy','pas','def'].includes(choice.focus))score+=10;
    if(strategy.id==='stats'&&['sho','dri','pas'].includes(choice.focus))score+=10;
    return{choice,score:score+rng.next()*12};
  }).sort((a,b)=>b.score-a.score);
  return ranked[0]?.choice||match.keyChoices[0]||null;
}

export function paceSummary(save){const pace=getPaceMode(save),speed=getSpeed(save);return{pace,speed,autoPause:{...ensurePaceState(save).autoPause},strategies:{...save.career.strategies}}}
export function fatigueSafety(save){return clamp((100-save.status.fitness)+save.status.fatigue,0,200)}
