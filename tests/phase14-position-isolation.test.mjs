import test from 'node:test';
import assert from 'node:assert/strict';
import { PlayStyleEligibility, TraitEligibility, normalizePosition, playStyleEligibility, traitEligibility } from '../src/core/positionResolver.js';
import { PLAYER_STYLE_DEFINITIONS, SECONDARY_TRAITS } from '../src/data/playerProfiles.js';
import { playerStylesForPosition, scoutDraft, secondaryTraitsForPosition } from '../src/pages/createPlayer.js';
import { radarChart } from '../src/components/radar.js';
import { migrateState } from '../src/core/store.js';
import { ensureTraits, evaluateTraits, traitDefinitions } from '../src/systems/trait/traitSystem.js';

const positions=['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','LM','RM'];

test('phase 14 resolves every play style and secondary trait in the data layer',()=>{
  assert.ok(new PlayStyleEligibility());assert.ok(new TraitEligibility());
  for(const position of positions){
    const styles=playerStylesForPosition(position),traits=secondaryTraitsForPosition(position);
    assert.ok(styles.length,`${position} needs a play style`);assert.ok(traits.length,`${position} needs a trait`);
    assert.ok(styles.every(style=>playStyleEligibility.eligible(position,style)),`${position} received an illegal style`);
    assert.ok(traits.every(trait=>traitEligibility.eligible(position,trait)),`${position} received an illegal trait`);
  }
  assert.equal(playerStylesForPosition('GK').length, 5);
  assert.ok(playerStylesForPosition('GK').every(style=>style.positions.includes('GK')));
  assert.ok(!playerStylesForPosition('ST').some(style=>style.positions.includes('GK')));
  assert.ok(secondaryTraitsForPosition('GK').some(trait=>trait.id==='门将指挥'));
  assert.ok(!secondaryTraitsForPosition('ST').some(trait=>trait.id==='门将指挥'));
  assert.ok(!secondaryTraitsForPosition('GK').some(trait=>trait.id==='高强度压迫'));
  assert.equal(playStyleEligibility.resolve('ST','清道夫门将',PLAYER_STYLE_DEFINITIONS),'禁区终结者');
  assert.equal(traitEligibility.resolve('ST','门将指挥',SECONDARY_TRAITS),'稳定发挥');
  assert.equal(normalizePosition('LM'),'LW');assert.equal(normalizePosition('RM'),'RW');
});

test('phase 14 sanitizes illegal drafts, saves, and runtime trait unlocks',()=>{
  const draft={previewSeed:'phase14',name:'',country:'中国',position:'ST',style:'清道夫门将',secondaryTrait:'门将指挥',height:181,weight:76};
  scoutDraft(draft);assert.equal(draft.style,'禁区终结者');assert.equal(draft.secondaryTrait,'稳定发挥');
  const migrated=migrateState({player:{position:'ST',style:'清道夫门将',secondaryTrait:'门将指挥',ovr:70,potential:84,stats:{speed:70,shooting:70,passing:60,dribbling:65,defending:40,physical:68}}});
  assert.equal(migrated.player.style,'禁区终结者');assert.equal(migrated.player.secondaryTrait,'稳定发挥');
  const save={player:{position:'GK',secondaryPositions:['CB','ST']},career:{traits:{progress:{},unlocked:['versatile']},careerStats:{},matchHistory:[],weeklyPlan:{history:[]},history:[]}};
  assert.deepEqual(ensureTraits(save).unlocked,[]);assert.ok(!evaluateTraits(save).some(trait=>trait.id==='versatile'));
  assert.ok(!traitDefinitions('GK').some(trait=>trait.id==='versatile'));assert.ok(traitDefinitions('ST').some(trait=>trait.id==='versatile'));
});

test('phase 14 keeps goalkeeper and outfield radar vocabularies separate',()=>{
  const stats={speed:74,shooting:68,passing:71,dribbling:73,defending:64,physical:70,goalkeeping:{saves:76,reaction:75,positioning:74,handling:73,aerial:72,distribution:71}};
  const keeper=radarChart(stats,stats,88,'GK'),outfield=radarChart(stats,stats,88,'ST');
  for(const label of['扑救','手控','开球','反应','站位','指挥'])assert.match(keeper,new RegExp(`>${label}<`));
  for(const label of['速度','射门','传球','盘带','防守','身体'])assert.match(outfield,new RegExp(`>${label}<`));
  assert.doesNotMatch(keeper,/>射门</);assert.doesNotMatch(outfield,/>扑救</);
});
