import assert from 'node:assert/strict';
import {getNavigationAlerts,getRecommendedAction} from '../src/systems/guidance/guidanceSystem.js';

const club={id:'club-a',cn:'测试俱乐部',leagueId:'league-a',leagueCn:'测试联赛',country:'中国',level:1,rep:60};
const opponent={id:'club-b',cn:'测试对手',leagueId:'league-a',leagueCn:'测试联赛',country:'中国',level:1,rep:58};
const repo={clubs:[club,opponent],getClub(id){return this.clubs.find(item=>item.id===id)||club}};
function baseSave(){
  return{
    career:{
      season:1,clubId:club.id,squadLevel:'18岁以下青年队',calendar:{week:1},
      weekState:{trainingDone:false,matchDone:false},
      pending:{event:null,match:null,offers:[]},
      objectives:{active:[]},
      schedule:{season:1,clubId:club.id,squadLevel:'18岁以下青年队',fixtures:[{id:'f1',week:1,played:false,opponentId:opponent.id,competition:'青年联赛',home:true}]}
    },
    achievements:{unlocked:['a1'],notified:[]}
  };
}

const save=baseSave();
let alerts=getNavigationAlerts(save,repo);
assert.deepEqual(alerts,{career:2,match:1,training:1,transfer:0,more:1});
assert.equal(getRecommendedAction(save,repo).id,'training','训练待处理应成为优先引导');

save.career.pending.offers=[{id:'o1',status:'待处理'}];
alerts=getNavigationAlerts(save,repo);
assert.equal(alerts.transfer,1);
assert.equal(getRecommendedAction(save,repo).id,'transfer','转会报价应高于训练提醒');

save.career.pending.match={id:'m1',resolved:false};
assert.equal(getRecommendedAction(save,repo).id,'match','比赛待处理应高于转会提醒');

save.career.pending.event={id:'e1',resolved:false};
assert.equal(getRecommendedAction(save,repo).id,'event','关键事件应为最高优先级');

save.career.pending.event.resolved=true;
save.career.pending.match.resolved=true;
save.career.pending.offers[0].status='已拒绝';
save.career.weekState.trainingDone=true;
save.career.objectives.active=['starter','fitness'];
assert.equal(getRecommendedAction(save,repo).id,'fixture','全部待办完成后应提示下一场比赛');

console.log(JSON.stringify({status:'PASS',version:'20.1.0',cases:['导航徽标连接真实待办数量','关键事件优先级','比赛优先级','转会优先级','训练优先级','完成待办后引导下一场比赛']},null,2));
