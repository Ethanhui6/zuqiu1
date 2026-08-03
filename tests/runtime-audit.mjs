import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createTalentCandidates,generateAcademyOffers,createNewSave} from '../src/systems/career/careerSystem.js';
import {generateEvent,resolveEventChoice,consumeResolvedEvent} from '../src/systems/event/eventEngine.js';
import {generateMatch,resolveMatch} from '../src/systems/match/matchSystem.js';
import {generateOffers,respondOffer,availableOfferActions,expireOffers,declareStay} from '../src/systems/transfer/transferSystem.js';
import {performFacilityAction} from '../src/systems/facility/facilitySystem.js';
import {SaveManager} from '../src/services/storage/saveManager.js';
import {GameStore} from '../src/app/store.js';
import {Router} from '../src/app/router.js';

const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const clubs=(await read('../data/clubs.json')).clubs.map((c,i)=>({...c,attack:c.attack??c.rep,defense:c.defense??c.rep,youth:c.youth??70,finance:c.finance??70,youthUsage:c.youthUsage??60,needs:c.needs??['ST','CM','CB','GK'],tactic:c.tactic??'控球推进',stadiumCapacity:c.stadiumCapacity??30000}));
const templates=await read('../data/legend-templates.json'),achievements=await read('../data/achievements.json');
const repo={clubs,templates,achievements,getClub(id){return clubs.find(c=>c.id===id)||clubs[0]},async loadEventCategory(cat){return read(`../data/events/${cat}.json`)}};
function makeSave(seed='audit',position='ST'){
  const talents=createTalentCandidates({seed,position,style:'全面型球员',templates,count:3}),talent=talents[0];
  const academy=generateAcademyOffers({seed,nation:'中国',position,ovr:64,talent,clubs}),club=repo.getClub(academy[0].clubId);
  return createNewSave({seed,name:'审计球员',displayName:'审计',nation:'中国',age:17,birthDate:'2009-01-01',height:180,weight:72,foot:'右脚',number:8,position,style:'全面型球员',talent,academyOffer:academy[0],sourceTemplate:templates.find(t=>t.id===talent.sourceTemplateId)},club,'audit');
}
const passed=[];const ok=(name,fn)=>{fn();passed.push(name)};

// 1. 设施不是空入口：修改真实状态、写历史、存在冷却和失败边界。
{
  const save=makeSave('facility','CM'),club=repo.getClub(save.career.clubId),before=save.player.xp.pas;
  const first=performFacilityAction(save,club,'academy');
  ok('青训基地写入能力经验',()=>assert.ok(first.ok&&save.player.xp.pas>before));
  ok('设施访问写入职业历史',()=>assert.equal(save.career.history.at(-1).type,'facility'));
  const second=performFacilityAction(save,club,'academy');ok('同阶段设施冷却生效',()=>assert.equal(second.ok,false));
  save.status.injury={name:'测试伤病',severity:.4,remainingMatches:3};save.finance.cash=0;
  const medical=performFacilityAction(save,club,'medical');ok('医疗中心存在资金不足边界',()=>assert.equal(medical.ok,false));
}

// 2. 防守球员零封分支必须真正运行，不能出现未声明变量。
{
  let found=null;
  for(let i=0;i<700&&!found;i++){
    const save=makeSave(`clean-${i}`,'CB');save.career.squadLevel='一线队';save.career.teamRole='主力';save.status.coachTrust=90;
    const match=generateMatch(save,repo);match.starts=true;match.substitute=false;
    const result=resolveMatch(save,repo,match.keyChoices[0].id);
    if(result.score[1]===0)found={save,result};
  }
  ok('后卫零封结算不报错',()=>assert.ok(found));
  ok('零封计入球员和生涯数据',()=>assert.ok(found.result.playerResult.cleanSheets===1&&found.save.career.careerStats.cleanSheets>=1));
  ok('比赛时间线包含有意义文本',()=>assert.ok(found.result.timeline.every(x=>x.text&&x.text.length>=4)));
}

// 3. 事件记忆：标题、选择结构和已触发记录保持，长流程不连续重复。
{
  const save=makeSave('event-memory','CAM'),titles=[],signatures=[];
  for(let i=0;i<70;i++){
    const event=await generateEvent(save,repo),signature=event.choices.map(x=>`${x.style}:${x.focus}`).sort().join('|');
    ok(`事件${i+1}选择数量有效`,()=>assert.ok(event.choices.length>=2&&event.choices.length<=5));
    assert.equal(titles.slice(-12).includes(event.title),false,`最近12次出现重复标题：${event.title}`);
    assert.notEqual(signatures.at(-1),signature,'连续事件选择结构重复');
    titles.push(event.title);signatures.push(signature);resolveEventChoice(save,event.choices[0].id);consumeResolvedEvent(save);
    save.career.month++;if(save.career.month>10){save.career.month=1;save.career.season++;save.player.age++}
  }
  ok('事件触发历史不被截断到短列表',()=>assert.equal(save.career.eventMemory.triggered.length,new Set(save.career.eventMemory.triggered).size));
  ok('事件标题记忆已持久化',()=>assert.ok(save.career.eventMemory.recentTitles.length>0));
  ok('事件选择结构记忆已持久化',()=>assert.ok(save.career.eventMemory.recentChoiceSignatures.length>0));
}

// 4. 转会是玩家状态机：生成不自动换队、拒绝/暂缓/谈判/过期/留队均有边界。
{
  const base=makeSave('transfer-audit','ST');base.career.squadLevel='一线队';base.career.teamRole='核心';base.career.month=1;base.player.ovr=89;base.player.potential=94;base.status.form=92;base.fans.mediaHeat=80;base.career.seasonStats={...base.career.seasonStats,apps:32,goals:28,assists:9,rating:8.2};
  const oldClub=base.career.clubId,offers=generateOffers(base,repo);
  ok('生成报价不会自动转会',()=>assert.equal(base.career.clubId,oldClub));
  const offer=offers.find(x=>x.type!=='续约')||offers[0];assert.ok(offer,'高水平测试球员应获得报价');
  const rejectSave=structuredClone(base),rejectOffer=rejectSave.career.pending.offers.find(x=>x.id===offer.id);respondOffer(rejectSave,repo,rejectOffer.id,'reject');ok('拒绝报价保持原俱乐部',()=>assert.equal(rejectSave.career.clubId,oldClub));
  const deferSave=structuredClone(base),deferOffer=deferSave.career.pending.offers.find(x=>x.id===offer.id);respondOffer(deferSave,repo,deferOffer.id,'defer');ok('暂缓后不能重复暂缓',()=>assert.equal(availableOfferActions(deferSave,deferOffer).includes('defer'),false));ok('重复暂缓会失败',()=>assert.throws(()=>respondOffer(deferSave,repo,deferOffer.id,'defer')));
  const limitSave=structuredClone(base),limitOffer=limitSave.career.pending.offers.find(x=>x.id===offer.id);limitOffer.negotiationRound=2;ok('谈判轮次达到上限后被禁止',()=>assert.equal(availableOfferActions(limitSave,limitOffer).some(x=>x.startsWith('negotiate')||x==='loan'||x==='clause'),false));ok('绕过界面继续谈判会失败',()=>assert.throws(()=>respondOffer(limitSave,repo,limitOffer.id,'negotiateWage')));
  const stale=structuredClone(base);stale.career.month=2;expireOffers(stale);ok('过期报价移入历史',()=>assert.ok(stale.career.pending.offers.length===0&&stale.career.offerHistory.length>0));ok('过期报价不能接受',()=>assert.throws(()=>respondOffer(stale,repo,offer.id,'accept')));
  const stay=structuredClone(base);declareStay(stay);ok('留队选择关闭本窗口报价',()=>assert.equal(stay.career.pending.offers.length,0));ok('同窗口不能重复刷留队奖励',()=>assert.throws(()=>declareStay(stay)));
}

// 5. 存档真实持久化、损坏恢复、无签名旧档迁移和导入校验。
class MemoryStorage{
  constructor(){this.map=new Map()}
  get length(){return this.map.size}
  key(i){return [...this.map.keys()][i]??null}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(String(k),String(v))}
  removeItem(k){this.map.delete(String(k))}
  clear(){this.map.clear()}
}
globalThis.localStorage=new MemoryStorage();
{
  const manager=new SaveManager(),save=makeSave('save-audit','CM'),id=manager.createSlot(save);save.status.morale=81;manager.save(save,id);
  localStorage.setItem(`fc18:save:${id}`,'{"broken":');const recovered=manager.load(id);
  ok('主存档损坏后从备份恢复',()=>assert.ok(recovered&&manager.lastNotice?.includes('备份')));
  const unsigned=makeSave('unsigned','GK');unsigned.meta.checksum='';localStorage.setItem('fc18:save:slot-2',JSON.stringify(unsigned));localStorage.setItem('fc18:slots',JSON.stringify([{id:'slot-2'}]));const loaded=manager.load('slot-2');
  ok('无校验早期存档可迁移',()=>assert.ok(loaded.meta.checksum));
  const bad={...makeSave('bad-import','ST'),meta:{checksum:'错误'}};const file={size:100,text:async()=>JSON.stringify(bad)};
  await assert.rejects(()=>manager.import(file),/校验失败/);passed.push('损坏导入文件被拒绝');
  const gameStore=new GameStore();gameStore.load(loaded,'slot-2');gameStore.update(s=>{s.status.morale=33},'audit');const immediate=JSON.parse(localStorage.getItem('fc18:save:slot-2'));
  ok('状态更新同步写入存档',()=>assert.equal(immediate.status.morale,33));
}

// 6. 路由刷新保持当前滚动位置，不执行页面切换动画。
{
  globalThis.requestAnimationFrame=fn=>{fn();return 1};
  const classes=new Set(),container={scrollTop:248,dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},get offsetWidth(){return 100}};
  const router=new Router(container,{career:()=>null});router.route='career';router.refresh({});
  ok('同页面刷新保持滚动位置',()=>assert.equal(container.scrollTop,248));
  ok('同页面刷新不添加进场动画',()=>assert.equal(classes.has('page-enter'),false));
}

// 7. 用户可见源码不残留明确英文占位词；主要按钮必须连接真实系统。
{
  const files=['../index.html','../manifest.webmanifest','../src/pages/careerPage.js','../src/pages/matchPage.js','../src/pages/trainingPage.js','../src/pages/transferPage.js','../src/pages/profilePage.js','../src/pages/onboardingPage.js','../src/components/appShell.js','../src/app/config.js'];
  const text=(await Promise.all(files.map(f=>fs.readFile(new URL(f,import.meta.url),'utf8')))).join('\n');
  for(const banned of ['Roguelike','B2B中场','U18青年队','U19青年队','Season Complete','Career Complete','Transfer Offer','Continue','Loading'])assert.equal(text.includes(banned),false,`仍存在英文或旧标签：${banned}`);
  const career=await fs.readFile(new URL('../src/pages/careerPage.js',import.meta.url),'utf8'),transfer=await fs.readFile(new URL('../src/pages/transferPage.js',import.meta.url),'utf8'),training=await fs.readFile(new URL('../src/pages/trainingPage.js',import.meta.url),'utf8');
  ok('设施按钮连接真实设施系统',()=>assert.ok(career.includes('performFacilityAction')&&career.includes("ctx.navigate('training')")&&career.includes("navigate('match')")));
  ok('转会按钮连接报价状态机',()=>assert.ok(transfer.includes('respondOffer')&&transfer.includes('declareStay')&&transfer.includes('submitInterest')));
  ok('训练按钮连接训练状态',()=>assert.ok(training.includes('selectTrainingPlan')&&training.includes('store.update')));
}

console.log(JSON.stringify({status:'PASS',passed:passed.length,cases:passed},null,2));
