import {MOTION_PRESETS} from '../registry/presets.js';

class MotionDirector{
  constructor(){this.reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false}
  setReducedMotion(value){this.reduced=Boolean(value)}
  enter(node,preset='pageEnter'){
    const motion=MOTION_PRESETS[preset];
    if(!node||!motion||this.reduced)return;
    node.classList.remove(motion.className);
    void node.offsetWidth;
    node.classList.add(motion.className);
  }
}

export const motionDirector=new MotionDirector();
