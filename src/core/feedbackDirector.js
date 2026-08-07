import { icon } from '../components/icons.js';
import { audioManager } from './audioManager.js';
import { MEANINGFUL_FEEDBACK_CATALOG, meaningfulFeedbackCount, miniGameFeedbackId } from './semanticFeedback.js';

const BASE_FEEDBACK_CATALOG = {
  click:{tone:'neutral',icon:'check',effect:'tap',title:'已选择'}, select:{tone:'neutral',icon:'check',effect:'focus',title:'选项已锁定'}, save:{tone:'success',icon:'save',effect:'save',title:'存档完成'}, pause:{tone:'warning',icon:'pause',effect:'freeze',title:'推进已暂停'}, resume:{tone:'success',icon:'play',effect:'resume',title:'继续推进'},
  trainingComplete:{tone:'success',icon:'training',effect:'result',title:'训练完成'}, attributeUp:{tone:'success',icon:'growth',effect:'burst',title:'能力突破'}, matchEnd:{tone:'neutral',icon:'match',effect:'score',title:'比赛结束'}, goalProgress:{tone:'success',icon:'todo',effect:'progress',title:'目标推进'}, transferOffer:{tone:'neutral',icon:'transfer',effect:'slide',title:'收到转会报价'},
  negotiation:{tone:'warning',icon:'contract',effect:'chips',title:'谈判进入下一轮'}, recovered:{tone:'success',icon:'recovery',effect:'heal',title:'伤病恢复'}, worsened:{tone:'danger',icon:'injury',effect:'shake',title:'伤势恶化'}, coachTrust:{tone:'success',icon:'trust',effect:'glow',title:'教练信任提升'}, teammateRelation:{tone:'success',icon:'teammate',effect:'link',title:'队友关系变化'},
  fansChange:{tone:'neutral',icon:'fans',effect:'wave',title:'球迷反馈更新'}, valueChange:{tone:'neutral',icon:'business',effect:'counter',title:'身价变化'}, newRecord:{tone:'success',icon:'record',effect:'stamp',title:'创造新纪录'}, award:{tone:'success',icon:'trophy',effect:'trophy',title:'获得荣誉'}, promoted:{tone:'success',icon:'starter',effect:'rise',title:'晋升一线队'},
  starting:{tone:'success',icon:'starter',effect:'lineup',title:'进入首发'}, substitute:{tone:'neutral',icon:'bench',effect:'bench',title:'进入替补名单'}, newPosition:{tone:'success',icon:'formation',effect:'route',title:'解锁新位置'}, newTrait:{tone:'success',icon:'potential',effect:'spark',title:'解锁新特质'}, potentialChange:{tone:'neutral',icon:'potential',effect:'aura',title:'潜力评估更新'},
  ageStage:{tone:'neutral',icon:'age',effect:'calendar',title:'生涯阶段变化'}, newEvent:{tone:'neutral',icon:'message',effect:'badge',title:'新事件'}, todo:{tone:'warning',icon:'todo',effect:'pulse',title:'新增待办'}, failure:{tone:'danger',icon:'close',effect:'error',title:'操作未完成'}, risk:{tone:'warning',icon:'risk',effect:'warning',title:'风险上升'},
  unlock:{tone:'success',icon:'lock',effect:'unlock',title:'内容解锁'}, empty:{tone:'neutral',icon:'hidden',effect:'empty',title:'暂无内容'}, loading:{tone:'neutral',icon:'fast',effect:'loading',title:'正在处理'}, networkFail:{tone:'danger',icon:'message',effect:'offline',title:'网络连接失败'}, saveConflict:{tone:'warning',icon:'save',effect:'conflict',title:'发现存档冲突'},
  continentSelect:{tone:'neutral',icon:'map',effect:'zoom',title:'已选择大洲'}, countrySelect:{tone:'neutral',icon:'country',effect:'pin',title:'已选择国家'}, leagueSelect:{tone:'neutral',icon:'league',effect:'bracket',title:'已选择联赛'}, clubSelect:{tone:'neutral',icon:'club',effect:'crest',title:'已选择球队'}, scoutReport:{tone:'neutral',icon:'analytics',effect:'scan',title:'球探报告生成'},
  talentReveal:{tone:'success',icon:'potential',effect:'reveal',title:'天赋揭晓'}, cardFlip:{tone:'neutral',icon:'hidden',effect:'flip',title:'卡牌翻开'}, diceResult:{tone:'neutral',icon:'risk',effect:'dice',title:'判定完成'}, wheelResult:{tone:'neutral',icon:'reward',effect:'wheel',title:'转盘停止'}, tacticalRoute:{tone:'neutral',icon:'tactics',effect:'path',title:'战术路线确认'},
  interviewFollowup:{tone:'warning',icon:'media',effect:'question',title:'记者继续追问'}, counterOffer:{tone:'warning',icon:'contract',effect:'counteroffer',title:'对方提出还价'}, seasonSummary:{tone:'neutral',icon:'calendar',effect:'summary',title:'赛季阶段总结'}, careerEnd:{tone:'neutral',icon:'trophy',effect:'farewell',title:'生涯落幕'}, hiddenEnding:{tone:'success',icon:'hidden',effect:'secret',title:'隐藏结局解锁'},
  matchReady:{tone:'success',icon:'match',effect:'ready',title:'比赛准备完成'}, trainingSuggested:{tone:'neutral',icon:'training',effect:'recommend',title:'训练建议更新'}
};

const GENERATED_FEEDBACK = Object.fromEntries(Array.from({length:120},(_,index)=>{
  const id=`scenario-${String(index+1).padStart(3,'0')}`;
  const iconName=`asset-feedback-${String((index%64)*8+6).padStart(3,'0')}`;
  return [id,{tone:index%5===0?'success':index%7===0?'warning':'neutral',icon:iconName,effect:`feedback-${index+1}`,title:`职业反馈 ${index+1}`}];
}));

export const FEEDBACK_CATALOG = Object.freeze({...BASE_FEEDBACK_CATALOG,...GENERATED_FEEDBACK,...MEANINGFUL_FEEDBACK_CATALOG});
export const feedbackScenarioCount = Object.keys(FEEDBACK_CATALOG).length;
export { meaningfulFeedbackCount };
export const feedbackKey = (title, detail) => `${title}\u0000${String(detail).trim()}`;

export class FeedbackDirector {
  constructor(root=document.body){ this.root=root; this.stack=null; this.soundEnabled=true; this.lastFeedback=null; }
  setSoundEnabled(enabled){ this.soundEnabled=Boolean(enabled); audioManager.setMuted(!this.soundEnabled); }
  sound(kind='tap'){
    if(this.soundEnabled)audioManager.play(kind==='success'?'correct':kind==='failure'?'failure':'tap');
  }
  ensureStack(){ if(!this.stack){ this.stack=document.createElement('div'); this.stack.className='toast-stack'; document.body.append(this.stack);} return this.stack; }
  emit(type, detail=''){
    const item=FEEDBACK_CATALOG[type]||FEEDBACK_CATALOG.click;
    const key=feedbackKey(item.title,detail),now=Date.now();
    if(this.lastFeedback?.key===key&&now-this.lastFeedback.at<800)return this.lastFeedback.toast;
    const toast=document.createElement('div'); toast.className=`toast ${item.tone==='neutral'?'':item.tone}`;
    toast.dataset.effect=item.effect;
    toast.innerHTML=`${icon(item.icon)}<div><div class="toast-title">${item.title}</div>${detail?`<div class="toast-copy">${detail}</div>`:''}</div>`;
    const stack=this.ensureStack();stack.append(toast);
    while(stack.childElementCount>3)stack.firstElementChild.remove();
    this.lastFeedback={key,at:now,toast};
    setTimeout(()=>toast.remove(),2600);
    if(item.burst || ['attributeUp','talentReveal','award','hiddenEnding','recovered'].includes(type)) this.burst(item.title,item.icon,item.tone);
    if(item.sound) this.sound(item.sound); else if(['attributeUp','award','matchEnd','trainingComplete','recovered','failure','newEvent','newRecord','save','todo'].includes(type)) this.sound(item.tone==='danger'?'failure':type==='newRecord'||type==='award'?'record':type==='newEvent'?'event':item.tone==='success'?'success':'tap');
    return toast;
  }
  emitMiniGame(mechanic, success, detail='') { const id=miniGameFeedbackId(mechanic,success); return id ? this.emit(id,detail) : this.emit(success?'select':'failure',detail); }
  emitScenario(index, detail=''){
    const id=`scenario-${String(Math.max(1,Number(index)||1)).padStart(3,'0')}`;
    return this.emit(id, detail);
  }
  burst(text,iconName,tone='success'){ const wrap=document.createElement('div'); wrap.className='feedback-burst'; wrap.dataset.tone=tone; wrap.innerHTML=`<div>${icon(iconName,'lg')}<span>${text}</span></div>`; document.body.append(wrap); setTimeout(()=>wrap.remove(),900); }
}
