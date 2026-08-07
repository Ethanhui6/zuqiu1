import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedbackDirector, MAX_PENDING_TOASTS, TOAST_COOLDOWN_MS } from '../src/core/feedbackDirector.js';

function fakeDocument(){
  const element=()=>({children:[],dataset:{},append(node){node.parent=this;this.children.push(node)},remove(){if(this.parent)this.parent.children=this.parent.children.filter(item=>item!==this)},setAttribute(){}});
  return{body:element(),createElement:element};
}

test('phase 11 serializes toast feedback and deduplicates a type for two seconds',()=>{
  const document=fakeDocument(),timers=[];let now=1000;
  const originalDocument=globalThis.document,originalTimeout=globalThis.setTimeout,originalNow=Date.now;
  globalThis.document=document;globalThis.setTimeout=(callback,delay)=>{timers.push({callback,delay});return timers.length};Date.now=()=>now;
  try{
    const director=new FeedbackDirector(document.body),first=director.emit('failure','操作未完成 1');
    for(let index=2;index<=20;index++)assert.equal(director.emit('failure',`操作未完成 ${index}`),first);
    assert.equal(director.stack.children.length,1);assert.equal(director.queue.length,0);
    now+=TOAST_COOLDOWN_MS-1;assert.equal(director.emit('failure','仍未完成'),first);
    now+=1;const next=director.emit('failure','可以再次提示');assert.notEqual(next,first);assert.equal(director.stack.children.length,1);assert.equal(director.queue.length,1);
    for(const type of['save','pause','resume','trainingComplete','attributeUp','matchEnd','goalProgress'])director.emit(type,type);
    assert.equal(director.stack.children.length,1);assert.equal(director.queue.length,MAX_PENDING_TOASTS);
    assert.equal(timers[0].delay,2600);timers.shift().callback();assert.equal(director.stack.children.length,1);
  }finally{globalThis.document=originalDocument;globalThis.setTimeout=originalTimeout;Date.now=originalNow}
});
