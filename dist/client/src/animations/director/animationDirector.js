import {AnimationRegistry} from '../registry/animationRegistry.js';
import {AnimationQueue} from '../queue/animationQueue.js';
import {AnimationSettings} from '../settings/animationSettings.js';
import {AnimationFallback} from '../fallback/animationFallback.js';
import {CORE_ANIMATIONS} from '../definitions/coreAnimations.js';
import {overlayManager} from '../../services/overlay/overlayManager.js';

export class AnimationDirector{
  constructor({registry=new AnimationRegistry(CORE_ANIMATIONS),queue=new AnimationQueue(),settings=new AnimationSettings(),fallback=new AnimationFallback()}={}){
    this.registry=registry;this.queue=queue;this.settings=settings;this.fallback=fallback;this.provider=null;this.active=new Set();this.resources={timers:0,frames:0,listeners:0,layers:0};
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
    const layer=document.createElement('div');layer.className=`animation-layer animation-layer--${definition.id} ${resolved.compact?'is-compact':''}`;layer.dataset.animationId=definition.id;layer.dataset.animationState='start';layer.setAttribute('role','status');layer.setAttribute('aria-label',definition.name);layer.style.setProperty('--animation-duration',`${resolved.duration}ms`);layer.style.setProperty('--animation-easing',definition.easing);
    const stage=document.createElement('div');stage.className='animation-stage';const visual=definition.create(structuredClone(result));stage.append(visual);layer.append(stage);
    let timer=0,frame=0,done=false,resolveRun=()=>{};const cleanups=[];
    const finish=(status='complete',fromManager=false)=>{if(done)return null;done=true;if(timer){clearTimeout(timer);timer=0;this.resources.timers--}if(frame){cancelAnimationFrame(frame);frame=0;this.resources.frames--}cleanups.splice(0).forEach(fn=>fn());layer.dataset.animationState='end';layer.classList.add('is-ending');this.active.delete(finish);if(!fromManager)overlayManager.release(layer,status);this.resources.layers=Math.max(0,this.resources.layers-1);options.target?.setAttribute?.('data-animation-state','complete');const payload={status,animationId:definition.id,result,cleaned:true,duration:resolved.duration};resolveRun(payload);return payload};
    return new Promise(resolve=>{
      resolveRun=resolve;const complete=status=>finish(status);
      if(definition.skippable){const skip=document.createElement('button');skip.className='animation-skip';skip.type='button';skip.textContent='跳过';skip.setAttribute('aria-label',`跳过${definition.name}`);const onSkip=()=>complete('skipped');skip.addEventListener('click',onSkip,{once:true});this.resources.listeners++;cleanups.push(()=>{skip.removeEventListener('click',onSkip);this.resources.listeners--});layer.append(skip)}
      if(options.signal){const onAbort=()=>complete('aborted');options.signal.addEventListener('abort',onAbort,{once:true});this.resources.listeners++;cleanups.push(()=>{options.signal.removeEventListener('abort',onAbort);this.resources.listeners--})}
      overlayManager.mount(layer,{channel:'overlay',kind:'animation',scope:'page',interactive:false});
      overlayManager.cleanup(layer,reason=>finish(reason==='complete'?'complete':'cancelled',true));
      this.active.add(finish);this.resources.layers++;frame=requestAnimationFrame(()=>{this.resources.frames--;frame=0;if(!done){layer.dataset.animationState='process';layer.classList.add('is-playing')}});this.resources.frames++;
      timer=setTimeout(()=>complete('complete'),resolved.duration+50);this.resources.timers++;
    });
  }
  feedback(target,kind='confirm',{duration=320}={}){
    if(!target?.isConnected)return Promise.resolve({status:'fallback'});
    const className=`micro-feedback--${kind}`;target.classList.remove(className);void target.offsetWidth;target.classList.add(className);
    return new Promise(resolve=>{this.resources.timers++;setTimeout(()=>{this.resources.timers=Math.max(0,this.resources.timers-1);target.classList.remove(className);resolve({status:'complete',cleaned:true})},this.settings.reduced?1:duration)});
  }
  cancelAll(reason='route-change'){this.queue.clear();[...this.active].forEach(finish=>finish(reason));overlayManager.clearScope('page',reason)}
  diagnostics(){return{registered:this.registry.list().length,queued:this.queue.size,...this.resources}}
}

export const animationDirector=new AnimationDirector();
