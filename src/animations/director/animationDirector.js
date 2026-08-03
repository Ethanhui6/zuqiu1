import {AnimationRegistry} from '../registry/animationRegistry.js';
import {AnimationQueue} from '../queue/animationQueue.js';
import {AnimationSettings} from '../settings/animationSettings.js';
import {AnimationFallback} from '../fallback/animationFallback.js';
import {CORE_ANIMATIONS} from '../definitions/coreAnimations.js';

export class AnimationDirector{
  constructor({registry=new AnimationRegistry(CORE_ANIMATIONS),queue=new AnimationQueue(),settings=new AnimationSettings(),fallback=new AnimationFallback()}={}){
    this.registry=registry;this.queue=queue;this.settings=settings;this.fallback=fallback;this.provider=null;this.resources={timers:0,frames:0,listeners:0,layers:0};
  }
  configure(provider){this.provider=typeof provider==='function'?provider:null}
  mode(){return this.provider?.()?.animationMode||this.settings.mode}
  play(id,result={},options={}){
    const definition=this.registry.get(id);if(!definition)return Promise.resolve(this.fallback.apply({id},result,options.target));
    const token=options.token||`${id}:${result?.syncId||result?.id||Date.now()}`;
    return this.queue.enqueue(()=>this.#run(definition,result,options),{token});
  }
  playSequence(items=[]){return items.reduce((chain,item)=>chain.then(()=>this.play(item.id,item.result,item.options)),Promise.resolve())}
  async #run(definition,result,options){
    const resolved=this.settings.resolve(definition,options.mode||this.mode());
    if(!resolved.play||typeof document==='undefined')return this.fallback.apply(definition,result,options.target);
    const host=options.host||document.querySelector('#overlay-root')||document.body;
    const layer=document.createElement('div');layer.className=`animation-layer animation-layer--${definition.id} ${resolved.compact?'is-compact':''}`;layer.dataset.animationId=definition.id;layer.dataset.animationState='start';layer.setAttribute('role','status');layer.setAttribute('aria-label',definition.name);layer.style.setProperty('--animation-duration',`${resolved.duration}ms`);layer.style.setProperty('--animation-easing',definition.easing);
    const stage=document.createElement('div');stage.className='animation-stage';const visual=definition.create(structuredClone(result));stage.append(visual);layer.append(stage);
    let timer=0,frame=0,done=false;const cleanups=[];
    const finish=(status='complete')=>{if(done)return;done=true;if(timer){clearTimeout(timer);this.resources.timers--}if(frame){cancelAnimationFrame(frame);this.resources.frames--}cleanups.splice(0).forEach(fn=>fn());layer.dataset.animationState='end';layer.classList.add('is-ending');layer.style.pointerEvents='none';layer.remove();this.resources.layers--;options.target?.setAttribute?.('data-animation-state','complete');return{status,animationId:definition.id,result,cleaned:true,duration:resolved.duration}};
    return new Promise(resolve=>{
      const complete=status=>resolve(finish(status));
      if(definition.skippable){const skip=document.createElement('button');skip.className='animation-skip';skip.type='button';skip.textContent='跳过';skip.setAttribute('aria-label',`跳过${definition.name}`);const onSkip=()=>complete('skipped');skip.addEventListener('click',onSkip,{once:true});this.resources.listeners++;cleanups.push(()=>{skip.removeEventListener('click',onSkip);this.resources.listeners--});layer.append(skip)}
      if(options.signal){const onAbort=()=>complete('aborted');options.signal.addEventListener('abort',onAbort,{once:true});this.resources.listeners++;cleanups.push(()=>{options.signal.removeEventListener('abort',onAbort);this.resources.listeners--})}
      host.append(layer);this.resources.layers++;frame=requestAnimationFrame(()=>{this.resources.frames--;frame=0;layer.dataset.animationState='process';layer.classList.add('is-playing')});this.resources.frames++;
      timer=setTimeout(()=>complete('complete'),resolved.duration+50);this.resources.timers++;
    });
  }
  diagnostics(){return{registered:this.registry.list().length,queued:this.queue.size,...this.resources}}
}

export const animationDirector=new AnimationDirector();
