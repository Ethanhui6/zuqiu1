export class AnimationQueue{
  constructor(){this.tail=Promise.resolve();this.pending=new Map();this.sequence=0}
  enqueue(task,{token=`animation-${++this.sequence}`}={}){
    if(this.pending.has(token))return this.pending.get(token);
    const run=this.tail.catch(()=>null).then(()=>task()).finally(()=>this.pending.delete(token));
    this.pending.set(token,run);this.tail=run;return run;
  }
  has(token){return this.pending.has(token)}
  get size(){return this.pending.size}
}

