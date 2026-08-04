class OverlayManager {
  constructor(){this.entries=new Map();this.sequence=0}

  host(channel='overlay'){
    const selector=channel==='toast'?'#toast-root':'#overlay-root';
    return document.querySelector(selector)||document.body;
  }

  mount(node,{channel='overlay',kind='overlay',scope='page',interactive=false}={}){
    if(!node)return null;
    this.release(node,'remount');
    node.dataset.overlayManaged='true';
    node.dataset.overlayKind=kind;
    node.dataset.overlayScope=scope;
    node.style.pointerEvents=interactive?'auto':'none';
    const entry={id:++this.sequence,node,kind,scope,timers:new Set(),frames:new Set(),cleanups:new Set()};
    this.entries.set(node,entry);
    this.host(channel).append(node);
    return node;
  }

  cleanup(node,callback){const entry=this.entries.get(node);if(entry&&typeof callback==='function')entry.cleanups.add(callback);return callback}

  timer(node,callback,delay){
    const entry=this.entries.get(node);if(!entry)return 0;
    const id=setTimeout(()=>{entry.timers.delete(id);if(this.entries.has(node))callback()},delay);
    entry.timers.add(id);return id;
  }

  frame(node,callback){
    const entry=this.entries.get(node);if(!entry)return 0;
    const id=requestAnimationFrame(time=>{entry.frames.delete(id);if(this.entries.has(node))callback(time)});
    entry.frames.add(id);return id;
  }

  release(node,reason='complete'){
    const entry=this.entries.get(node);if(!entry){node?.remove?.();return false}
    this.entries.delete(node);
    entry.timers.forEach(clearTimeout);entry.frames.forEach(cancelAnimationFrame);
    entry.timers.clear();entry.frames.clear();
    entry.cleanups.forEach(callback=>{try{callback(reason)}catch(error){console.warn('浮层清理失败',error)}});
    entry.cleanups.clear();
    node.style.pointerEvents='none';node.setAttribute('aria-hidden','true');node.remove();
    return true;
  }

  clearScope(scope='page',reason='route-change'){
    [...this.entries.values()].filter(entry=>entry.scope===scope).forEach(entry=>this.release(entry.node,reason));
  }

  clearAll(reason='reset'){[...this.entries.keys()].forEach(node=>this.release(node,reason))}

  diagnostics(){
    const entries=[...this.entries.values()];
    return{total:entries.length,interactive:entries.filter(entry=>getComputedStyle(entry.node).pointerEvents!=='none').length,kinds:entries.map(entry=>entry.kind)};
  }
}

export const overlayManager=new OverlayManager();

