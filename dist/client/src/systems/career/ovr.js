import {ATTR_KEYS,POSITION_CONFIG} from '../../app/config.js';
import {clamp} from '../../utils/format.js';
export function calculateOvr(attrs,position){const cfg=POSITION_CONFIG[position]||POSITION_CONFIG.ST;const raw=ATTR_KEYS.reduce((s,k)=>s+(attrs[k]||0)*(cfg.weights[k]||0),0);return clamp(Math.round(raw),1,99)}
export function careerStage(age,squadLevel){if(squadLevel?.includes('青年')||age<=18)return'青训期';if(age<=21)return'突破期';if(age<=28)return'成长期';if(age<=32)return'巅峰期';return'生涯末期'}
export function teamRole(save,club){
  const p=save.player,s=save.status;const delta=p.ovr-club.rep+(s.coachTrust-50)*.08+(s.form-50)*.05;
  if(save.career.squadLevel!=='一线队')return delta>-4?'青年队核心':'青年队球员';if(delta<-9)return'未进入名单';if(delta<-5)return'替补';if(delta<-1)return'轮换';if(delta<5)return'主力';if(delta<10)return'核心';return'队长核心';
}
