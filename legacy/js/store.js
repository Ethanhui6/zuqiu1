'use strict';
const Store={
  key:'football-career-v9-saves',archiveKey:'football-career-v9-archives',settingsKey:'football-career-v9-settings',
  saves(){try{return JSON.parse(localStorage.getItem(this.key)||'[]')}catch{return[]}},
  save(player){const all=this.saves().filter(x=>x.id!==player.id);all.unshift(structuredClone(player));localStorage.setItem(this.key,JSON.stringify(all.slice(0,12)))},
  remove(id){localStorage.setItem(this.key,JSON.stringify(this.saves().filter(x=>x.id!==id)))},
  archives(){try{return JSON.parse(localStorage.getItem(this.archiveKey)||'[]')}catch{return[]}},
  archive(player){const a=this.archives();a.unshift(structuredClone(player));localStorage.setItem(this.archiveKey,JSON.stringify(a.slice(0,30)));this.remove(player.id)},
  settings(){try{return JSON.parse(localStorage.getItem(this.settingsKey)||'{}')}catch{return{}}},
  setSettings(x){localStorage.setItem(this.settingsKey,JSON.stringify(x))}
};
