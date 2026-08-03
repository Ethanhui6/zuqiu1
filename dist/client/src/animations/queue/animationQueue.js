export class AnimationQueue{
  constructor(){this.tail=Promise.resolve();this.pending=new Map();this.sequence=0;this.generation=0}
  enqueue(task,{token=`animation-${++this.sequence}`}={}){
    if(this.pending.has(token))return this.pending.get(token);
    const generation=this.generation;
    const run=this.tail.catch(()=>null).then(()=>generation===this.generation?task():{status:'cancelled'}).finally(()=>this.pending.delete(token));
    this.pending.set(token,run);this.tail=run;return run;
  }
  clear(){this.generation++;this.pending.clear();this.tail=Promise.resolve()}
  has(token){return this.pending.has(token)}
  get size(){return this.pending.size}
}
