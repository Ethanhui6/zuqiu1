import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSave,repo} from './v19.1-test-fixture.mjs';
import {calculateOvr,careerStage} from '../src/systems/career/ovr.js';
import {progressRecovery,resolveTraining} from '../src/systems/training/trainingSystem.js';
import {consumeResolvedEvent,generateEvent,resolveEventChoice} from '../src/systems/event/eventEngine.js';
import {deferAttention,navigationAttention,primaryAttention} from '../src/systems/attention/attentionManager.js';
import {nextMatchCountdown} from '../src/pages/careerPage.js';
import {daysBetween} from '../src/utils/gameDate.js';

test('能力评分使用当前位置权重并保持有限范围',()=>{
  const attrs={pac:72,sho:65,pas:78,dri:76,def:58,phy:67},ovr=calculateOvr(attrs,'CM');
  assert.ok(Number.isInteger(ovr)&&ovr>=1&&ovr<=99);
  assert.equal(ovr,calculateOvr(attrs,'CM'));
});

test('年龄与阵容阶段映射稳定',()=>{
  assert.equal(careerStage(18,'青年队'),'青训期');
  assert.equal(careerStage(21,'一线队'),'突破期');
  assert.equal(careerStage(28,'一线队'),'成长期');
  assert.equal(careerStage(33,'一线队'),'生涯末期');
});

test('训练与伤病恢复写入当前存档结构',()=>{
  const save=makeSave({seed:'core-training'}),club=repo.getClub(save.career.clubId),before=structuredClone(save.player.xp);
  const result=resolveTraining(save,club);
  assert.ok(result.plan.focus.some(key=>save.player.xp[key]>before[key]));
  save.status.injury={name:'测试伤病',severity:.2,remainingMatches:1};
  assert.equal(progressRecovery(save,club).recovered,true);assert.equal(save.status.injury,null);
});

test('事件选择写入历史、冷却与确定性结果',()=>{
  const save=makeSave({seed:'core-event'});save.career.pending.event={id:'test-event',title:'测试事件',templateTitle:'测试事件',category:'training',tags:['training'],cooldown:2,choices:[{id:'steady',text:'按计划执行',style:'safe',focus:'pas',base:.8,effects:{xp:20,trust:2}}],resolved:false};
  const result=resolveEventChoice(save,'steady');
  assert.equal(result.event.resolved,true);assert.equal(save.career.eventMemory.choices.at(-1).eventId,'test-event');assert.ok(save.career.eventMemory.cooldowns['test-event']>save.career.season);
});

test('延后当前事项会选择下一项，并在相关状态变化后恢复',()=>{
  const save=makeSave({seed:'core-attention'});
  save.career.objectives.active=[{id:'goal-a'},{id:'goal-b'}];
  save.achievements.unlocked=[];
  save.career.messages.items=[];
  save.career.weekState.trainingDone=false;
  save.status.fatigue=20;
  const first=primaryAttention(save,repo);
  assert.match(first.id,/^training:/);
  deferAttention(save,first);
  assert.notEqual(primaryAttention(save,repo).id,first.id);
  save.status.fatigue=21;
  assert.equal(primaryAttention(save,repo).id,first.id);
});

test('紧急事件和比赛不可延后且始终保留导航提醒',()=>{
  for(const kind of ['event','match']){
    const save=makeSave({seed:`core-urgent-${kind}`});
    save.career.pending.event=kind==='event'?{id:'event-1',resolved:false}:null;
    save.career.pending.match=kind==='match'?{id:'match-1',resolved:false}:null;
    const urgent=primaryAttention(save,repo);
    assert.equal(urgent.level,'urgent');assert.equal(deferAttention(save,urgent),false);
    assert.equal(primaryAttention(save,repo).id,urgent.id);
    assert.ok(navigationAttention(save,repo)[urgent.route]>0);
  }
});

test('报价与医疗事项会在相关状态变化后重新出现',()=>{
  const offerSave=makeSave({seed:'core-offer-defer'});
  offerSave.career.pending.offers=[{id:'offer-1',status:'待处理',expiresDate:'2026-08-10'}];
  offerSave.career.pending.event=null;offerSave.career.pending.match=null;offerSave.career.weekState.trainingDone=true;
  const offer=primaryAttention(offerSave,repo);assert.match(offer.id,/^offers:/);deferAttention(offerSave,offer);
  assert.notEqual(primaryAttention(offerSave,repo).id,offer.id);
  offerSave.career.pending.offers[0].expiresDate='2026-08-09';assert.equal(primaryAttention(offerSave,repo).id,offer.id);

  const medicalSave=makeSave({seed:'core-medical-defer'});
  medicalSave.career.pending.event=null;medicalSave.career.pending.match=null;medicalSave.career.weekState.trainingDone=true;
  medicalSave.career.objectives.active=[{id:'a'},{id:'b'}];medicalSave.status.injury={name:'拉伤',severity:.3,remainingMatches:3};
  const medical=primaryAttention(medicalSave,repo);assert.match(medical.id,/^medical:/);deferAttention(medicalSave,medical);
  assert.notEqual(primaryAttention(medicalSave,repo).id,medical.id);
  medicalSave.status.injury.severity=.4;assert.equal(primaryAttention(medicalSave,repo).id,medical.id);
});

test('生涯页下一场比赛倒计时始终非负',()=>{
  const save=makeSave({seed:'core-countdown'});
  const countdown=nextMatchCountdown(save,repo);
  assert.ok(countdown>=0);
  assert.equal(countdown,daysBetween(save.career.gameClock.currentDate,save.career.schedule.fixtures.find(item=>!item.played).date));
});

test('事件池耗尽时近期兜底事件的可见内容不重复',async()=>{
  const save=makeSave({seed:'core-fallback'}),emptyRepo={...repo,async loadEventCategory(){return[]}};
  const visible=[];
  for(let index=0;index<5;index++){
    const event=await generateEvent(save,emptyRepo,{category:'training'});
    assert.match(event.title,new RegExp(`${index+1}$`));
    visible.push([event.title,event.description,event.person,event.choices.map(choice=>choice.text).join('|')].join('|'));
    resolveEventChoice(save,event.choices[0].id);
    consumeResolvedEvent(save);
  }
  assert.equal(new Set(visible).size,visible.length);
});
