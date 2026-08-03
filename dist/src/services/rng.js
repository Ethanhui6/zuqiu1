/** Deterministic xorshift32 PRNG. State is serializable in save files. */
export function hashString(input){
  let h=2166136261>>>0;
  for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}
  return h>>>0;
}
export function createSeed(){
  const buf=new Uint32Array(2);
  if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(buf);
  else{buf[0]=Date.now()>>>0;buf[1]=(performance?.now?.()??1)*1000>>>0}
  return `${buf[0].toString(36)}-${buf[1].toString(36)}`;
}
export class DeterministicRng{
  constructor(seed,state){this.seed=String(seed||'green-pitch');this.state=(state>>>0)||hashString(this.seed)||0x9e3779b9;this.counter=0}
  next(){let x=this.state>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;this.counter++;return(this.state>>>0)/4294967296}
  int(min,max){return Math.floor(this.next()*(max-min+1))+min}
  bool(prob=.5){return this.next()<prob}
  pick(arr){return arr.length?arr[Math.floor(this.next()*arr.length)]:undefined}
  shuffle(arr){const out=[...arr];for(let i=out.length-1;i>0;i--){const j=Math.floor(this.next()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
  weighted(items,getWeight=x=>x.weight??1){const total=items.reduce((s,x)=>s+Math.max(0,Number(getWeight(x))||0),0);if(total<=0)return this.pick(items);let roll=this.next()*total;for(const item of items){roll-=Math.max(0,Number(getWeight(item))||0);if(roll<=0)return item}return items.at(-1)}
  snapshot(){return{seed:this.seed,state:this.state>>>0,counter:this.counter}}
}
export function keyedRandom(seed,...parts){return new DeterministicRng(`${seed}|${parts.join('|')}`)}
