import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultState } from '../src/core/store.js';
import { CLUB_INTERACTIONS, CURRENT_CLUB_ACTIONS, resolveClubInteraction } from '../src/core/clubInteractionEngine.js';
import { clubInteractionActions } from '../src/pages/clubs.js';

const club={id:'club-current',cn:'当前测试俱乐部',name:'Current Test Club'};

function state(){
  const value=createDefaultState();
  value.player={name:'俱乐部互动测试',club:club.cn,clubId:club.id,position:'CM',ovr:70,potential:82,fitness:90,fatigue:20,morale:60,coachTrust:60,stats:{speed:65,shooting:64,passing:72,dribbling:69,defending:62,physical:66}};
  return value;
}

test('phase 10 gives every current-club action choices, a result, and persisted changes',()=>{
  assert.deepEqual(clubInteractionActions(true),CURRENT_CLUB_ACTIONS);
  assert.equal(CURRENT_CLUB_ACTIONS.length,10);
  for(const action of CURRENT_CLUB_ACTIONS){
    const scenario=CLUB_INTERACTIONS[action];
    assert.ok(scenario.title&&scenario.situation);
    assert.ok(scenario.choices.length>=2&&scenario.choices.length<=4,`${action} must expose two to four choices`);
    for(const selected of scenario.choices){
      const save=state(),before=JSON.stringify(save),result=resolveClubInteraction(save,{action,choiceId:selected.id,club});
      assert.ok(result.result&&result.animation);
      assert.ok(Object.keys(result.changes).length>0,`${action}/${selected.id} must change gameplay data`);
      assert.notEqual(JSON.stringify(save),before);
      assert.equal(save.clubInteractions.history[0].choiceId,selected.id);
      assert.equal(save.clubInteractions.cooldowns[`${club.id}:${action}`],'2026-07-08');
    }
  }
  const source=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/openClubInteraction\(action,club\)/);
  assert.match(source,/data-club-choice/);
  assert.match(source,/data-club-interaction-result/);
  assert.match(source,/success-pop/);
});
