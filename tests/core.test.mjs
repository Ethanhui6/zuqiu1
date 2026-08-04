import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDevelopment, computeOverall, seasonTargetRange } from '../src/core/playerDevelopmentEngine.js';
import { createInjury, advanceInjury, chooseTreatment } from '../src/core/injuryEngine.js';
import { EventEngine } from '../src/core/eventEngine.js';

const player={name:'测试球员',position:'中场',age:18,potential:88,ovr:60,stats:{speed:60,shooting:56,passing:64,dribbling:63,defending:48,physical:55}};

test('能力成长使用浮点并可触发整数突破',()=>{
  const out=applyDevelopment(player,{passing:1.2,dribbling:.8},{fatigue:20,facility:80,coachQuality:78});
  assert.ok(out.player.stats.passing>64);
  assert.equal(out.player.ovr,computeOverall(out.player.stats,'中场'));
  assert.ok(Number.isFinite(out.changes.passing));
});

test('年龄阶段目标区间正确',()=>{
  assert.deepEqual(seasonTargetRange(18,88),[4,9]);
  assert.deepEqual(seasonTargetRange(21,82),[2,6]);
  assert.deepEqual(seasonTargetRange(25,80),[0,3]);
});

test('伤病状态能随时间进入恢复并最终清除',()=>{
  let injury=createInjury({severity:'minor',date:'2026-07-01'});
  injury={...injury,remainingDays:5,originalDays:7,progress:28};
  injury=chooseTreatment(injury,'steady');
  injury=advanceInjury(injury,10,{date:'2026-07-11'});
  assert.equal(injury.status,'recovered');
  assert.equal(injury.remainingDays,0);
  assert.equal(injury.progress,100);
});

test('事件指纹、冷却与历史去重有效',()=>{
  const engine=new EventEngine();
  const state={simulation:{date:'2026-07-01'},season:{week:1},events:{pending:[],history:[],cooldowns:{},seasonCounts:{},careerCounts:{},characterMemory:{},resolved:[]}};
  const event=engine.schedule(state,{priority:'important'});
  assert.ok(event);
  const result=engine.resolve(state,event.id,event.choices[0].id);
  assert.equal(state.events.pending.length,0);
  assert.equal(state.events.history.length,1);
  assert.ok(state.events.cooldowns[event.fingerprint]>0);
  assert.equal(result.templateId,event.templateId);
});
