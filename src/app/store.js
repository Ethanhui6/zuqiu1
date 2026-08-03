import {saveManager} from '../services/storage/saveManager.js';

/**
 * 单一游戏状态容器。所有用户操作先修改状态，再同步写入 localStorage，
 * 避免关闭标签页或刷新时丢失刚生成的事件、比赛与报价。
 */
export class GameStore{
  constructor(){this.state=null;this.listeners=new Set();this.activeSlot=null}
  load(save,slotId){this.state=save;this.activeSlot=slotId;saveManager.setCurrent(slotId);this.emit('load');return save}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
  emit(reason='update',payload){for(const fn of this.listeners)fn(this.state,reason,payload)}
  update(mutator,reason='update',payload){
    if(!this.state)throw new Error('没有已载入的职业生涯');
    mutator(this.state);
    this.state.updatedAt=Date.now();
    saveManager.save(this.state,this.activeSlot);
    this.emit(reason,payload);
    return this.state;
  }
  replace(save,reason='replace'){
    if(!save)throw new Error('不能载入空存档');
    this.state=save;
    saveManager.save(save,this.activeSlot);
    this.emit(reason);
  }
  saveNow(){if(this.state)return saveManager.save(this.state,this.activeSlot);return null}
}
export const gameStore=new GameStore();
