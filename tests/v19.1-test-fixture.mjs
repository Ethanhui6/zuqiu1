import fs from 'node:fs/promises';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../src/systems/career/careerSystem.js';
import {setGameDate} from '../src/systems/career/gameClock.js';
import {ensureSchedule} from '../src/systems/schedule/scheduleSystem.js';

const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const clubData=await read('../data/clubs.json');
const templates=await read('../data/legend-templates.json');
const achievements=await read('../data/achievements.json');
export const repo={
  clubs:clubData.clubs.map(c=>({...c,youth:c.youth??70,youthUsage:c.youthUsage??60,finance:c.finance??70,attack:c.attack??c.rep,defense:c.defense??c.rep,needs:Array.isArray(c.needs)&&c.needs.length?c.needs:['ST','CM','CB','GK'],tactic:c.tactic||'控球推进'})),
  templates,achievements,
  getClub(id){return this.clubs.find(c=>c.id===id)||this.clubs[0]},
  async loadEventCategory(cat){return read(`../data/events/${cat}.json`)}
};

export function makeSave({seed='v19.1-test',date='2026-08-03',position='ST',pace='standard'}={}){
  const talents=createTalentCandidates({seed,position,style:'全能前锋',templates,count:3});
  const academy=generateAcademyOffers({seed,nation:'中国',position,ovr:64,talent:talents[0],clubs:repo.clubs});
  const club=repo.getClub(academy[0].clubId);
  const save=createNewSave({seed,name:'时间测试球员',displayName:'测试',nation:'中国',age:17,birthDate:'2009-06-15',height:180,weight:72,foot:'右脚',number:9,position,style:'全能前锋',talent:talents[0],academyOffer:academy[0],sourceTemplate:templates.find(t=>t.id===talents[0].sourceTemplateId),paceMode:pace},club,'slot-time');
  save.career.pending.event=null;save.career.pending.match=null;save.career.pending.offers=[];
  save.settings.pace.mode=pace;save.settings.pace.speed='turbo';save.settings.pace.autoTraining=true;save.settings.pace.autoMatch=true;
  for(const key of Object.keys(save.settings.pace.autoPause))save.settings.pace.autoPause[key]=false;
  setGameDate(save,date);save.career.calendar.nextEventDate='2099-12-31';save.career.schedule=null;ensureSchedule(save,repo);
  return save;
}
