import {calculateOvr} from './ovr.js';

export function settleDevelopment(save,xpByAttribute){
  const player=save.player,gains=[];
  for(const [key,xp] of Object.entries(xpByAttribute)){
    player.xp[key]=(player.xp[key]||0)+xp;
    let levels=0;
    while(player.attrs[key]<Math.min(99,player.potential+2)){
      const threshold=65+(player.attrs[key]-50)*4.5;
      if(player.xp[key]<threshold)break;
      player.xp[key]-=threshold;player.attrs[key]++;levels++;
    }
    if(levels)gains.push({key,levels});
  }
  player.ovr=calculateOvr(player.attrs,player.position);
  return gains;
}
