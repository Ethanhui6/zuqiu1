import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {makeSave,repo} from './v19.1-test-fixture.mjs';
import {collectAttentionItems,navigationAttention,currentObjectiveSummary} from '../src/systems/attention/attentionManager.js';
import {facilitySummaries,chooseMedicalPlan,lockerActions,resolveLockerAction,buildAnalysisSeries} from '../src/systems/facility/facilityExperienceSystem.js';
import {ensureTrainingEvent,resolveTrainingEvent} from '../src/systems/training/trainingEventSystem.js';
import {continentStats,countriesForContinent,leaguesForCountry,clubsForLeague,toggleFavorite,setTransferTarget,clubCoordinates} from '../src/systems/world/worldExplorerSystem.js';
import {upcomingFixtures} from '../src/systems/schedule/scheduleSystem.js';
import {migrateLegacy} from '../src/services/storage/migrations.js';

const passed=[];
const check=(name,fn)=>{fn();passed.push(name)};
const save=makeSave({seed:'v20-product-audit',position:'CM'});
save.career.weekState.trainingDone=false;

check('V20存档结构为23',()=>assert.equal(save.schemaVersion,23));
check('首页重点由真实状态生成',()=>{
  const items=collectAttentionItems(save,repo);
  assert.ok(items.length>=2);
  assert.ok(items.some(item=>item.route==='training'));
  const nav=navigationAttention(save,repo);
  assert.ok(Object.keys(nav).every(key=>['career','match','training','transfer','more'].includes(key)));
});
check('赛季目标摘要连接真实目标状态',()=>{
  const summary=currentObjectiveSummary(save);
  assert.ok(summary.title&&typeof summary.ratio==='number');
});
check('设施摘要连接比赛、伤病、关系和荣誉状态',()=>{
  const summaries=facilitySummaries(save);
  assert.deepEqual(Object.keys(summaries),['analysis','medical','locker','honours']);
  assert.ok(summaries.analysis.status.includes('比赛样本'));
});
check('医疗方案真实写入体能和设施历史',()=>{
  save.status.fatigue=70;const before=save.status.fatigue;
  const result=chooseMedicalPlan(save,repo.getClub(save.career.clubId),'rest');
  assert.ok(save.status.fatigue<before);
  assert.equal(save.career.facilityCenter.medicalHistory[0].id,result.id);
});
check('更衣室行动真实写入关系和周冷却',()=>{
  const action=lockerActions(save).find(item=>item.available);
  assert.ok(action);
  const result=resolveLockerAction(save,action.id);
  assert.equal(save.career.facilityCenter.lockerHistory[0].id,result.id);
  assert.ok(lockerActions(save).every(item=>!item.available));
});
check('数据分析产生真实趋势序列',()=>{
  const series=buildAnalysisSeries(save);
  for(const key of ['rating','goals','assists','ovr','fans','fitness','trust'])assert.ok(Array.isArray(series[key]),key);
  assert.ok(series.ovr.length>=4);
});
check('训练事件固定种子稳定且选择写入状态',()=>{
  const a=structuredClone(save),b=structuredClone(save);
  a.career.weekState.trainingDone=false;b.career.weekState.trainingDone=false;
  const eventA=ensureTrainingEvent(a),eventB=ensureTrainingEvent(b);
  assert.equal(eventA?.id,eventB?.id);
  if(eventA){
    assert.ok(eventA.choices.length>=2&&eventA.choices.length<=4);
    const result=resolveTrainingEvent(a,eventA.choices[0].id);
    assert.ok(result.choice&&result.result?.effects);
    assert.equal(a.career.trainingEvents.current,null);
    assert.equal(a.career.trainingEvents.history[0].id,eventA.id);
  }
});
check('足球世界支持大洲国家联赛球队逐级数据',()=>{
  const continents=continentStats(repo,save);assert.equal(continents.length,6);
  const continent=continents.find(item=>item.clubs>0);assert.ok(continent);
  const countries=countriesForContinent(repo,continent.id,save);assert.ok(countries.length);
  const leagues=leaguesForCountry(repo,countries[0].country,save);assert.ok(leagues.length);
  const clubs=clubsForLeague(repo,leagues[0].leagueId,save,{limit:8});assert.ok(clubs.length&&clubs.length<=8);
  const club=clubs[0];assert.equal(toggleFavorite(save,club.id),true);assert.equal(setTransferTarget(save,club.id),club.id);
  const point=clubCoordinates(club);assert.ok(point.x>=5&&point.x<=95&&point.y>=8&&point.y<=92);
});
check('赛程与下一场列表严格按日期排序',()=>{
  const fixtures=upcomingFixtures(save,repo,20);
  for(let i=1;i<fixtures.length;i++)assert.ok(fixtures[i-1].date<=fixtures[i].date,`${fixtures[i-1].date} > ${fixtures[i].date}`);
});
check('旧存档迁移补齐V20真实状态',()=>{
  const migrated=migrateLegacy({name:'旧档球员',age:24,pos:'CM',ovr:74,potential:82,attrs:{pac:70,sho:60,pas:78,dri:75,def:62,phy:68},clubId:'CHN1-SHA'});
  assert.equal(migrated.schemaVersion,23);
  assert.ok(migrated.career.facilityCenter&&migrated.career.worldExplorer&&migrated.career.trainingEvents&&migrated.career.ui);
});

const files={
  career:await fs.readFile(new URL('../src/pages/careerPage.js',import.meta.url),'utf8'),
  training:await fs.readFile(new URL('../src/pages/trainingPage.js',import.meta.url),'utf8'),
  transfer:await fs.readFile(new URL('../src/pages/transferPage.js',import.meta.url),'utf8'),
  world:await fs.readFile(new URL('../src/pages/worldPage.js',import.meta.url),'utf8'),
  more:await fs.readFile(new URL('../src/pages/morePage.js',import.meta.url),'utf8'),
  match:await fs.readFile(new URL('../src/pages/matchPage.js',import.meta.url),'utf8'),
  saveSelect:await fs.readFile(new URL('../src/pages/saveSelectPage.js',import.meta.url),'utf8'),
  profile:await fs.readFile(new URL('../src/pages/profilePage.js',import.meta.url),'utf8'),
  css:await fs.readFile(new URL('../src/styles/v20-product.css',import.meta.url),'utf8'),
  sw:await fs.readFile(new URL('../sw.js',import.meta.url),'utf8')
};
check('首页首屏使用重点、人物卡、职业控制台和双小卡',()=>{
  for(const token of ['v20-focus-card','v20-career-identity','createPlayerCard','v20-career-console','v20-career-growth','v20-career-actions'])assert.ok(files.career.includes(token),token);
});
check('训练、转会、世界和更多入口均有真实交互',()=>{
  assert.ok(files.training.includes('resolveTrainingEvent')&&files.training.includes('selectTrainingPlan'));
  assert.ok(files.transfer.includes('respondOffer')&&files.transfer.includes('openClubDetail'));
  assert.ok(files.world.includes('continentStats')&&files.world.includes('clubsForLeague')&&files.world.includes('openClubDetail'));
  assert.ok(files.more.includes('openFacilityCenter')&&files.more.includes('markMessageRead'));
});
check('赛后使用四张摘要卡和详情Sheet',()=>{
  assert.ok(files.match.includes('v20-match-summary-grid'));
  for(const token of ['比赛结果','个人表现','关键事件','教练评价'])assert.ok(files.match.includes(token),token);
});
check('移动端样式包含紧凑双卡、2×2设施、地图和设置分组',()=>{
  for(const token of ['.v20-career-page','.v20-home-twin','.v20-facility-grid','.v20-world-map','.v20-settings-list','.v20-match-summary-grid'])assert.ok(files.css.includes(token),token);
});
check('用户界面不再显示World Explorer或危险直出文字',()=>{
  const ui=Object.values(files).join('\n');
  for(const token of ['World Explorer','[object Object]','Loading','Continue','Transfer Offer'])assert.equal(ui.includes(token),false,token);
});
check('V20首屏使用紧凑生涯入口且不再显示V19文案',()=>{
  assert.match(files.saveSelect,/v20-save-console/);
  assert.match(files.saveSelect,/v20-save-slot--new/);
  assert.match(files.saveSelect,/创建新生涯/);
  assert.match(files.css,/\.v20-save-console/);
  assert.match(files.css,/\.v20-save-console__status/);
  assert.doesNotMatch(`${files.saveSelect}\n${files.profile}`,/V19/);
});
check('V20 Service Worker缓存当前生产入口并清理旧缓存',()=>{
  assert.match(files.sw,/career-__BUILD_ID__/);
  assert.match(files.sw,/networkFirst/);
  assert.match(files.sw,/cacheFirst/);
  assert.match(files.sw,/SKIP_WAITING/);
  assert.doesNotMatch(files.sw,/client\.navigate|clients\.matchAll/);
  for(const token of ['./index.html','./styles.css','./src/main.js'])assert.ok(files.sw.includes(token),token);
  assert.ok(files.sw.includes('caches.delete')&&files.sw.includes('clients.claim'));
});
check('生产页面不使用整页innerHTML重建',()=>{
  for(const [name,text] of Object.entries(files))if(name!=='css'&&name!=='sw')assert.equal(/\.innerHTML\s*=/.test(text),false,name);
});

console.log(JSON.stringify({status:'PASS',version:'20.1.3',passed:passed.length,cases:passed},null,2));
