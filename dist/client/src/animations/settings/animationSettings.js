export const ANIMATION_MODES=Object.freeze({
  full:{id:'full',name:'完整',label:'完整',duration:1},standard:{id:'standard',name:'标准',label:'标准',duration:.82},simple:{id:'simple',name:'简洁',label:'简洁',duration:.42},major:{id:'major',name:'仅重大事件',label:'仅重大事件',duration:.72},off:{id:'off',name:'关闭非必要动画',label:'关闭非必要动画',duration:0}
});

export class AnimationSettings{
  constructor({mode='standard',reducedMotion}={}){this.mode=ANIMATION_MODES[mode]?mode:'standard';this.reducedMotion=reducedMotion??Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)}
  setMode(mode){this.mode=ANIMATION_MODES[mode]?mode:'standard'}
  setReducedMotion(value){this.reducedMotion=Boolean(value)}
  resolve(definition,override){
    const mode=ANIMATION_MODES[override]||ANIMATION_MODES[this.mode]||ANIMATION_MODES.standard;
    const essential=definition.importance==='essential',major=definition.importance==='major'||essential;
    const play=essential||(!this.reducedMotion&&mode.id!=='off'&&(mode.id!=='major'||major));
    return{mode:mode.id,play,compact:this.reducedMotion||mode.id==='simple',duration:play?Math.max(300,Math.round(definition.duration*(this.reducedMotion ? .18 : mode.duration))):0};
  }
}
