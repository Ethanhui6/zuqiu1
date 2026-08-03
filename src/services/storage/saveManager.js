import {APP_VERSION,SAVE_SCHEMA,SAVE_SLOTS} from '../../app/config.js';
import {hashString} from '../rng.js';
import {buildDefaultSave,findLegacySave,migrateLegacy,normalizeSave} from './migrations.js';

const INDEX_KEY='fc18:slots';
const CURRENT_KEY='fc18:current-slot';
const slotKey=id=>`fc18:save:${id}`;
const backupKey=id=>`fc18:backup:${id}`;

function checksum(save){const copy=structuredClone(save);if(copy.meta)copy.meta.checksum='';return hashString(JSON.stringify(copy)).toString(16)}
function wrap(save){save.schemaVersion=SAVE_SCHEMA;save.gameVersion=APP_VERSION;save.updatedAt=Date.now();save.meta??={migrationNotes:[],checksum:''};save.meta.checksum=checksum(save);return save}
function valid(save){if(!save||typeof save!=='object')return false;const stored=save.meta?.checksum;if(!stored)return true;return stored===checksum(save)}

export class SaveManager{
  constructor(){this.activeSlot=null;this.timer=null}
  list(){try{return JSON.parse(localStorage.getItem(INDEX_KEY)||'[]')}catch{return[]}}
  writeIndex(list){localStorage.setItem(INDEX_KEY,JSON.stringify(list.slice(0,SAVE_SLOTS)))}
  currentSlot(){return localStorage.getItem(CURRENT_KEY)||null}
  setCurrent(id){this.activeSlot=id;localStorage.setItem(CURRENT_KEY,id)}
  load(id=this.currentSlot()){
    if(!id)return null;this.setCurrent(id);
    try{
      const raw=JSON.parse(localStorage.getItem(slotKey(id))||'null');
      if(raw&&valid(raw))return normalizeSave(raw.schemaVersion===SAVE_SCHEMA?raw:migrateLegacy(raw));
      const backup=JSON.parse(localStorage.getItem(backupKey(id))||'null');if(backup&&valid(backup))return normalizeSave(backup.schemaVersion===SAVE_SCHEMA?backup:migrateLegacy(backup));
    }catch{}
    return null;
  }
  save(save,id=this.activeSlot||this.currentSlot()){
    if(!id)throw new Error('没有活动存档槽');
    const existing=localStorage.getItem(slotKey(id));if(existing)localStorage.setItem(backupKey(id),existing);
    const wrapped=wrap(save);localStorage.setItem(slotKey(id),JSON.stringify(wrapped));
    const list=this.list();const meta={id,name:save.player?.name||'未命名生涯',clubId:save.career?.clubId||'',age:save.player?.age||0,ovr:save.player?.ovr||0,updatedAt:wrapped.updatedAt,version:APP_VERSION};
    const next=[meta,...list.filter(x=>x.id!==id)].slice(0,SAVE_SLOTS);this.writeIndex(next);this.setCurrent(id);return wrapped;
  }
  schedule(save,id=this.activeSlot||this.currentSlot()){clearTimeout(this.timer);this.timer=setTimeout(()=>this.save(save,id),180)}
  createSlot(save=buildDefaultSave()){
    const used=new Set(this.list().map(x=>x.id));let id;for(let i=1;i<=SAVE_SLOTS;i++){if(!used.has(`slot-${i}`)){id=`slot-${i}`;break}}if(!id)id=this.list().sort((a,b)=>a.updatedAt-b.updatedAt)[0]?.id||'slot-1';
    this.setCurrent(id);this.save(save,id);return id;
  }
  delete(id){localStorage.removeItem(slotKey(id));localStorage.removeItem(backupKey(id));this.writeIndex(this.list().filter(x=>x.id!==id));if(this.currentSlot()===id)localStorage.removeItem(CURRENT_KEY)}
  export(save){const blob=new Blob([JSON.stringify(wrap(structuredClone(save)),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${save.player?.name||'球员'}-绿茵浮沉-V18存档.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  async import(file){const text=await file.text();const raw=JSON.parse(text);const migrated=normalizeSave(raw.schemaVersion===SAVE_SCHEMA?raw:migrateLegacy(raw));if(!migrated)throw new Error('无法识别的存档');const id=this.createSlot(migrated);return{id,save:migrated}}
  migrateLegacyIfNeeded(){if(this.list().length)return null;const legacy=findLegacySave();if(!legacy)return null;const id=this.createSlot(legacy.save);return{id,save:legacy.save,note:legacy.save.meta.migrationNotes.at(-1)}}
}
export const saveManager=new SaveManager();
