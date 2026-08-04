import {clamp} from '../../utils/format.js';
export function createFans(){return{local:300,club:500,global:0,social:250,mediaHeat:2,commercialValue:1,sentiment:55,history:[]}}
export function applyFanChange(save,{local=0,club=0,global=0,social=0,heat=0,commercial=0,sentiment=0,reason='生涯变化'}={}){
  const f=save.fans,loyal=(save.career?.traits?.unlocked||[]).includes('loyal'),clubGain=club>0&&loyal?club*1.15:club;f.local=Math.max(0,f.local+Math.round(local));f.club=Math.max(0,f.club+Math.round(clubGain));f.global=Math.max(0,f.global+Math.round(global));f.social=Math.max(0,f.social+Math.round(social));f.mediaHeat=clamp(f.mediaHeat+heat,0,100);f.commercialValue=clamp(f.commercialValue+commercial,0,100);f.sentiment=clamp(f.sentiment+sentiment,0,100);
  f.history.push({year:save.career.year,season:save.career.season,month:save.career.month,total:f.local+f.club+f.global,social:f.social,reason});if(f.history.length>80)f.history.shift();
}
export function totalFans(save){const f=save.fans;return f.local+f.club+f.global}
export function performanceFanDelta({rating,goals,assists,importance=1,clubRep=70}){const base=Math.max(-300,Math.round((rating-6.2)*420*importance+goals*900+assists*520));const exposure=Math.max(.35,(clubRep-45)/35);return{club:base*exposure,global:Math.max(0,base*(clubRep>80?.42:.12)),social:base*.7,heat:rating>8?5:rating<5.8?-3:1,commercial:rating>7.8?1:0,sentiment:rating>7?3:rating<6?-4:0}}
