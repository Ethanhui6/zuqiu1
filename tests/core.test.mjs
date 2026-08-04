import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSave,repo} from './v19.1-test-fixture.mjs';
import {calculateOvr,careerStage} from '../src/systems/career/ovr.js';
import {progressRecovery,resolveTraining} from '../src/systems/training/trainingSystem.js';
import {resolveEventChoice} from '../src/systems/event/eventEngine.js';

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
