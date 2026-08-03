import {APP_VERSION,SAVE_SCHEMA,SAVE_SLOTS} from '../../app/config.js';
import {hashString} from '../rng.js';
import {buildDefaultSave,findLegacySave,migrateLegacy,normalizeSave} from './migrations.js';

const INDEX_KEY='fc18:slots';
const CURRENT_KEY='fc18:current-slot';
const slotKey=id=>`fc18:save:${id}`;
const backupKey=id=>`fc18:backup:${id}`;

function safeParse(text){try{return JSON.parse(text||'null')}catch{return null}}
function checksum(save){const copy=structuredClone(save);if(copy.meta)copy.meta.checksum='';return hashString(JSON.stringify(copy)).toString(16)}
function wrap(save){save.schemaVersion=SAVE_SCHEMA;save.gameVersion=APP_VERSION;save.updatedAt=Date.now();save.meta??={migrationNotes:[],checksum:'',lastRecovery:null};save.meta.checksum='';save.meta.checksum=checksum(save);return save}
function integrity(raw){if(!raw||typeof raw!=='object')return{ok:false,reason:'格式错误'};const stored=raw.meta?.checksum;if(!stored)return{ok:true,unsigned:true};return stored===checksum(raw)?{ok:true,unsigned:false}:{ok:false,reason:'校验和不匹配'}}
function prepare(raw){if(!raw||typeof raw!=='object')return null;return normalizeSave(raw.schemaVersion===SAVE_SCHEMA?raw:migrateLegacy(raw))}
function validPlayable(save){return Boolean(save?.player?.name&&save?.career?.clubId&&save?.rng?.seed)}

export class SaveManager{
  constructor(){this.activeSlot=null;this.timer=null;this.lastNotice=null}
  list(){const value=safeParse(localStorage.getItem(INDEX_KEY));return Array.isArray(value)?value:[]}
  writeIndex(list){localStorage.setItem(INDEX_KEY,JSON.stringify(list.slice(0,SAVE_SLOTS)))}
  currentSlot(){return localStorage.getItem(CURRENT_KEY)||null}
  setCurrent(id){this.activeSlot=id;localStorage.setItem(CURRENT_KEY,id)}
  load(id=this.currentSlot()){
    this.lastNotice=null;if(!id)return null;this.setCurrent(id);
    const primaryText=localStorage.getItem(slotKey(id));const primary=safeParse(primaryText);const primaryCheck=integrity(primary);
    if(primary&&primaryCheck.ok){
      const prepared=prepare(primary);if(!validPlayable(prepared))return null;
      if(primaryCheck.unsigned||primary.schemaVersion!==SAVE_SCHEMA||primary.gameVersion!==APP_VERSION){
        prepared.meta.migrationNotes.push(primaryCheck.unsigned?'已为早期无校验存档补充完整性校验。':`已将存档更新到 ${APP_VERSION}。`);
        this.persist(prepared,id,{skipBackup:false});this.lastNotice=prepared.meta.migrationNotes.at(-1);
      }
      return prepared;
    }
    const backup=safeParse(localStorage.getItem(backupKey(id)));const backupCheck=integrity(backup);
    if(backup&&backupCheck.ok){
      const recovered=prepare(backup);if(!validPlayable(recovered))return null;
      recovered.meta.lastRecovery={at:Date.now(),reason:primaryCheck.reason||'主存档无法解析'};
      recovered.meta.migrationNotes.push('主存档损坏，已从最近一次有效备份恢复。');
      this.persist(recovered,id,{skipBackup:true});this.lastNotice='主存档损坏，已从备份恢复。';return recovered;
    }
    return null;
  }
  persist(save,id,{skipBackup=false}={}){
    if(!id)throw new Error('没有活动存档槽');
    if(!validPlayable(save))throw new Error('存档缺少球员或职业生涯数据');
    if(!skipBackup){
      const existingText=localStorage.getItem(slotKey(id));const existing=safeParse(existingText);
      if(existing&&integrity(existing).ok)localStorage.setItem(backupKey(id),existingText);
    }
    const wrapped=wrap(save);localStorage.setItem(slotKey(id),JSON.stringify(wrapped));
    const list=this.list();const meta={id,name:save.player.name||'未命名生涯',clubId:save.career.clubId||'',age:Number(save.player.age||0),ovr:Number(save.player.ovr||0),updatedAt:wrapped.updatedAt,version:APP_VERSION};
    this.writeIndex([meta,...list.filter(x=>x.id!==id)]);this.setCurrent(id);return wrapped;
  }
  save(save,id=this.activeSlot||this.currentSlot()){return this.persist(save,id)}
  schedule(save,id=this.activeSlot||this.currentSlot()){clearTimeout(this.timer);return this.save(save,id)}
  createSlot(save=buildDefaultSave()){
    const used=new Set(this.list().map(x=>x.id));let id;
    for(let i=1;i<=SAVE_SLOTS;i++){if(!used.has(`slot-${i}`)){id=`slot-${i}`;break}}
    if(!id)id=this.list().sort((a,b)=>a.updatedAt-b.updatedAt)[0]?.id||'slot-1';
    this.setCurrent(id);this.save(save,id);return id;
  }
  delete(id){localStorage.removeItem(slotKey(id));localStorage.removeItem(backupKey(id));this.writeIndex(this.list().filter(x=>x.id!==id));if(this.currentSlot()===id)localStorage.removeItem(CURRENT_KEY)}
  export(save){const blob=new Blob([JSON.stringify(wrap(structuredClone(save)),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${save.player?.name||'球员'}-绿茵浮沉-V18存档.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  async import(file){
    if(!file)throw new Error('没有选择存档文件');if(file.size>8*1024*1024)throw new Error('存档文件超过8MB限制');
    const text=await file.text();const raw=safeParse(text);if(!raw)throw new Error('存档不是有效的JSON文件');
    const check=integrity(raw);if(raw.meta?.checksum&&!check.ok)throw new Error('存档校验失败，文件可能已损坏');
    const migrated=prepare(raw);if(!validPlayable(migrated))throw new Error('无法识别球员或职业生涯数据');
    if(check.unsigned)migrated.meta.migrationNotes.push('导入的早期存档没有校验和，已重新校验并保存。');
    const id=this.createSlot(migrated);return{id,save:migrated,notes:migrated.meta.migrationNotes};
  }
  migrateLegacyIfNeeded(){if(this.list().length)return null;const legacy=findLegacySave();if(!legacy)return null;const id=this.createSlot(legacy.save);return{id,save:legacy.save,note:legacy.save.meta.migrationNotes.at(-1)}}
}
export const saveManager=new SaveManager();
