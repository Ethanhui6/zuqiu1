export class AnimationDirector {
  constructor(){ this.timers=new Set(); this.frames=new Set(); this.reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; }
  timeout(fn,ms){ if(this.reduced) { fn(); return null; } const id=setTimeout(()=>{this.timers.delete(id);fn();},ms); this.timers.add(id); return id; }
  frame(fn){ if(this.reduced){fn(performance.now());return null;} const id=requestAnimationFrame(t=>{this.frames.delete(id);fn(t);}); this.frames.add(id); return id; }
  pulse(el,cls='feedback-flash'){ if(!el)return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); this.timeout(()=>el.classList.remove(cls),900); }
  clear(){ for(const id of this.timers) clearTimeout(id); for(const id of this.frames) cancelAnimationFrame(id); this.timers.clear(); this.frames.clear(); }
}

export const animationDirector = new AnimationDirector();
