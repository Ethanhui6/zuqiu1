import {saveManager} from '../services/storage/saveManager.js';

export class GameStore{
  constructor(){this.state=null;this.listeners=new Set();this.activeSlot=null}
  load(save,slotId){this.state=save;this.activeSlot=slotId;saveManager.setCurrent(slotId);this.emit('load');return save}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
  emit(reason='update',payload){for(const fn of this.listeners)fn(this.state,reason,payload)}
  update(mutator,reason='update',payload){if(!this.state)return;mutator(this.state);this.state.updatedAt=Date.now();saveManager.schedule(this.state,this.activeSlot);this.emit(reason,payload)}
  replace(save,reason='replace'){this.state=save;saveManager.save(save,this.activeSlot);this.emit(reason)}
  saveNow(){if(this.state)saveManager.save(this.state,this.activeSlot)}
}
export const gameStore=new GameStore();
