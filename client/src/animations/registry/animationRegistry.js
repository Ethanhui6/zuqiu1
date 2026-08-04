export class AnimationRegistry{
  constructor(definitions=[]){this.items=new Map();definitions.forEach(item=>this.register(item))}
  register(definition){
    if(!definition?.id||typeof definition.create!=='function')throw new Error('动画定义无效');
    if(this.items.has(definition.id))throw new Error(`动画重复注册：${definition.id}`);
    const normalized=Object.freeze({category:'core',importance:'normal',duration:800,easing:'cubic-bezier(.22,1,.36,1)',skippable:true,...definition});
    if(normalized.duration<300||normalized.duration>3000)throw new Error(`动画时长越界：${normalized.id}`);
    this.items.set(normalized.id,normalized);return normalized;
  }
  get(id){return this.items.get(id)||null}
  has(id){return this.items.has(id)}
  list(){return[...this.items.values()]}
}

