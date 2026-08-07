import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCareerTimeline, seasonHistory } from '../src/pages/career.js';
import { createDefaultState } from '../src/core/store.js';
import { completeOffSeason, retireCareer, settleSeason } from '../src/systems/honors/honorsSystem.js';

const crests=['usa/usa1-sea.svg','usa/usa1-por.svg','usa/usa1-nyr.svg','usa/usa1-nyc.svg','usa/usa1-mia.svg','usa/usa1-lag.svg','usa/usa1-lafc.svg','usa/usa1-clb.svg','usa/usa1-cin.svg','usa/usa1-atl.svg'].map(path=>`./assets/clubs/${path}`);

function career(){
  const save=createDefaultState();
  save.player={name:'Timeline Gate',club:'Club 1',clubId:'club-1',crestPath:crests[0],position:'CM',age:16,potential:93,dynamicPotential:93,developmentProfile:'wonderkid',style:'组织核心',status:'主力',stats:{speed:64,shooting:62,passing:68,dribbling:67,defending:60,physical:63},ovr:65,morale:78,coachTrust:76};
  save.career.growthLog=[];
  for(let index=0;index<10;index++){
    const start=2026+index,year=`${start}/${String((start+1)%100).padStart(2,'0')}`,club=`Club ${index+1}`;
    save.simulation.date=`${start+1}-06-30`;
    Object.assign(save.player,{club,clubId:`club-${index+1}`,crestPath:crests[index],status:index===6?'队长':'主力'});
    save.season={...save.season,year,startOvr:save.player.ovr,startStats:{...save.player.stats},startMarketValue:save.career.marketValue,appearances:24+index,starts:20,minutes:2100+index*40,goals:5+index,assists:7+index,rating:7.8,highlights:[index===3?'首次代表国家队出场':index===6?'被任命为球队队长':index===7?'获得金球奖':`第${index+1}赛季关键表现`],injuries:index===2?[{name:'脚踝扭伤'}]:[],transfer:index===1?{club}:null};
    if(index===4)save.career.history.push({date:`${start}-10-01`,type:'recovery',title:'伤愈复出',text:'完成康复并重返比赛名单。'});
    const settled=settleSeason(save);
    assert.equal(settled.record.year,year);
    completeOffSeason(save);
  }
  retireCareer(save);
  return save;
}

test('phase 9 builds a complete, aligned, duplicate-free ten-season career timeline',()=>{
  const save=career(),nodes=buildCareerTimeline(save),seasons=nodes.filter(node=>node.type==='season'),types=new Set(nodes.map(node=>node.type));
  assert.equal(seasons.length,10);
  assert.equal(new Set(nodes.map(node=>node.id)).size,nodes.length,'timeline IDs must be unique');
  assert.deepEqual(seasons.map(node=>Number(node.row.year.slice(0,4))),Array.from({length:10},(_,index)=>2026+index));
  for(let index=0;index<seasons.length;index++){
    const row=seasons[index].row;
    assert.equal(row.crestPath,crests[index]);
    assert.equal(row.club,`Club ${index+1}`);
    for(const key of ['age','position','startOvr','endOvr','appearances','goals','assists','rating','trophies','personalAwards'])assert.notEqual(row[key],undefined,`${row.year} missing ${key}`);
    assert.ok(nodes.filter(node=>node.season===row.year).length>=2,`${row.year} is missing its timeline nodes`);
  }
  for(const type of ['debut','first-goal','transfer','national','injury','comeback','trophy','golden-boy','ballon-dor','captain','retirement'])assert.ok(types.has(type),`missing ${type}`);
  const html=seasonHistory(save);
  assert.equal((html.match(/data-timeline-type="season"/g)||[]).length,10);
  for(const value of ['职业生涯时间轴','OVR','出场','进球','助攻','评分','荣誉','职业首秀','职业生涯首球','伤愈复出','获得金球奖','正式退役'])assert.match(html,new RegExp(value));
});
