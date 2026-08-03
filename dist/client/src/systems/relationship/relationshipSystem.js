import {clamp} from '../../utils/format.js';
export const RELATION_KEYS=['coach','teammates','captain','agent','management','fans','media','nationalCoach'];
export const RELATION_LABELS={coach:'主教练',teammates:'队友',captain:'队长',agent:'经纪人',management:'管理层',fans:'球迷',media:'媒体',nationalCoach:'国家队教练'};
export function createRelations(){const one=()=>({trust:50,respect:50,rivalry:10,familiarity:20,conflict:5});return Object.fromEntries(RELATION_KEYS.map(k=>[k,one()]))}
export function applyRelation(save,key,effects={}){const rel=save.relations[key];if(!rel)return;for(const prop of ['trust','respect','rivalry','familiarity','conflict'])if(effects[prop])rel[prop]=clamp(rel[prop]+effects[prop],0,100)}
export function relationshipScore(rel){return Math.round(rel.trust*.35+rel.respect*.3+rel.familiarity*.18-rel.conflict*.12-rel.rivalry*.05)}
export function coachSelectionBonus(save){const r=save.relations.coach;return (r.trust-50)*.12+(r.respect-50)*.08-(r.conflict)*.08}
