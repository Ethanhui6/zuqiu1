import {el,button,clear} from '../utils/dom.js';
import {formatNumber} from '../utils/format.js';
import {POSITION_CONFIG} from '../app/config.js';
import {buildScoreEvidence,calculateCareerScore} from '../systems/scoring/scoringSystem.js';
import {getLocalLeaderboard} from '../services/storage/localLeaderboard.js';
import {saveManager} from '../services/storage/saveManager.js';
import {getWorldLeaderboard} from '../services/api/leaderboardApi.js';
import {ensureRankingRun,syncAndSubmitRanking} from '../services/api/rankingSync.js';
import {showToast} from '../components/toast.js';
import {animationDirector} from '../animations/director/animationDirector.js';
import {openSheet} from '../components/sheet.js';
import {reportWorldEntry,updateWorldPrivacy,withdrawWorldEntry} from '../services/api/authoritativeRunApi.js';

const WORLD_CATEGORIES=[['overall','总榜'],['week','本周'],['month','本月'],['season','当前赛季'],['history','历史榜'],['forward','前锋'],['midfield','中场'],['defense','后卫'],['keeper','门将'],['one-club','一人一城'],['low-league','低级联赛逆袭'],['national','国家队传奇'],['veteran','老将传奇']];

export function renderRankingsPage(container,ctx){
  const {store,repo}=ctx,save=store.state,club=repo.getClub(save.career.clubId),evidence=buildScoreEvidence(save,club.cn),score=calculateCareerScore(evidence);
  clear(container);
  const page=el('section',{className:'page rankings-page'}),title=el('header',{className:'page-title'},[el('div',{},[el('span',{className:'eyebrow',text:'生涯排行榜'}),el('h1',{text:'本地成绩与服务器认证成绩分开记录'}),el('p',{text:'离线存档始终可进入本地榜；正式世界榜只显示服务器按连续动作日志重新结算的成绩。'})])]);
  const current=currentScoreCard(evidence,score,save.meta?.ranking),localSection=el('section',{className:'ranking-section'}),localHead=sectionHeading('本地存档榜','设备内全部存档 · 支持筛选和排序'),localControls=el('div',{className:'ranking-filter-bar'}),localList=el('div',{className:'ranking-list'});
  const position=selectControl([['all','全部位置'],...Object.entries(POSITION_CONFIG).map(([id,item])=>[id,item.name])]),sort=selectControl([['score','按游戏评分'],['updated','按最后游玩'],['apps','按出场次数'],['ovr','按最高能力']]),retired=selectControl([['all','全部状态'],['no','现役'],['yes','已退役']]),certified=selectControl([['all','全部认证'],['yes','已认证'],['no','仅本地']]);
  localControls.append(position,sort,retired,certified);localSection.append(localHead,localControls,localList);

  const worldSection=el('section',{className:'ranking-section'}),worldHead=sectionHeading('联网世界榜','服务端权威计分 · 可分页、筛选并查看公开生涯摘要'),worldActions=el('div',{className:'ranking-actions'}),refreshButton=button('刷新',{className:'button button--secondary'}),submitButton=button('发布当前生涯',{className:'button button--primary'}),privacyButton=button('公开信息',{className:'button',disabled:save.meta?.ranking?.status!=='verified'}),worldStatus=el('p',{className:'ranking-status',attrs:{'aria-live':'polite'},text:'正在连接世界榜…'}),categoryBar=el('div',{className:'achievement-filters ranking-categories'}),worldList=el('div',{className:'ranking-list'}),pager=el('nav',{className:'pager'});
  worldActions.append(refreshButton,submitButton,privacyButton);worldHead.append(worldActions);worldSection.append(worldHead,categoryBar,worldStatus,worldList,pager);
  page.append(title,current,localSection,worldSection);container.append(page);

  let category='overall',worldPage=1;
  function renderLocal(){localList.replaceChildren();const entries=getLocalLeaderboard(repo,{position:position.value,sort:sort.value,retired:retired.value,certified:certified.value});if(entries.length)entries.forEach(entry=>localList.append(rankingRow(entry,entry.localRank,{local:true})));else localList.append(empty('没有符合筛选条件的本地存档'))}
  [position,sort,retired,certified].forEach(control=>control.addEventListener('change',renderLocal));renderLocal();
  WORLD_CATEGORIES.forEach(([id,label])=>categoryBar.append(button(label,{className:`filter-chip ${id===category?'is-selected':''}`,onClick:event=>{category=id;worldPage=1;categoryBar.querySelectorAll('button').forEach(item=>item.classList.toggle('is-selected',item===event.currentTarget));void loadWorld()}})));

  async function loadWorld(){
    refreshButton.disabled=true;worldStatus.textContent='正在读取服务器验证成绩…';worldList.replaceChildren();pager.replaceChildren();
    try{
      const result=await getWorldLeaderboard({limit:25,page:worldPage,category}),entries=Array.isArray(result.entries)?result.entries:[];
      worldStatus.textContent=entries.length?`第 ${result.page||worldPage} 页 · ${entries.length} 条已验证记录`:'当前分类暂时没有已验证记录';
      if(entries.length)entries.forEach((entry,index)=>worldList.append(rankingRow(entry,entry.rank||((worldPage-1)*25+index+1))));else worldList.append(empty('尚无符合条件的服务器认证成绩'));
      pager.append(button('上一页',{className:'button button--secondary',disabled:worldPage<=1,onClick:()=>{worldPage--;void loadWorld()}}),el('span',{text:`第 ${worldPage} 页`}),button('下一页',{className:'button button--secondary',disabled:entries.length<25,onClick:()=>{worldPage++;void loadWorld()}}));
      if(entries.length>=3)void animationDirector.play('world-podium',{id:`podium:${entries.slice(0,3).map(entry=>entry.run_id||entry.player_name).join(':')}`,names:[entries[1]?.player_name||'亚军',entries[0]?.player_name||'冠军',entries[2]?.player_name||'季军']},{token:`podium:${entries.slice(0,3).map(entry=>entry.run_id||entry.player_name).join(':')}`});
    }catch(error){worldStatus.textContent='服务器暂不可用；本地排行榜仍可正常使用。';worldList.append(empty('恢复连接后可刷新世界榜，离线成绩不会伪装为认证成绩。'))}
    finally{refreshButton.disabled=false}
  }

  refreshButton.addEventListener('click',()=>void loadWorld());
  privacyButton.addEventListener('click',()=>openPrivacySettings(save,privacyButton,loadWorld));
  submitButton.addEventListener('click',async()=>{submitButton.disabled=true;try{let ranking=save.meta?.ranking;if(!ranking?.runId)ranking=await ensureRankingRun(store,repo);if(!ranking?.eligible)throw new Error('此存档没有服务器连续验证日志，只能进入本地榜');const result=await syncAndSubmitRanking(save,repo,()=>saveManager.save(save,store.activeSlot));privacyButton.disabled=false;await animationDirector.play('world-rank-change',{id:`rank:${result.entry?.runId}:${result.rank}`,from:Math.max(2,(result.rank||1)+5),to:result.rank||1,name:evidence.player.name},{token:`world-rank:${result.entry?.runId}:${result.rank}`});showToast(`发布成功：服务器评分 ${formatNumber(result.score)} · ${result.grade}级`,{type:'success',duration:4200});await loadWorld()}catch(error){showToast(error.message||'世界榜发布失败',{type:'error',duration:4600})}finally{submitButton.disabled=false}});
  void animationDirector.playSequence([{id:'career-score',result:{id:`score:${save.updatedAt}`,score:score.total,label:'当前生涯评分'},options:{token:`career-score:${save.updatedAt}`}},{id:'grade-reveal',result:{id:`grade:${save.updatedAt}`,grade:score.grade,label:`${score.grade}级生涯`},options:{token:`career-grade:${save.updatedAt}`}}]);
  void loadWorld();return()=>{};
}

function currentScoreCard(evidence,score,ranking){
  const items=[['个人表现',score.breakdown.personal],['团队荣誉',score.breakdown.teamHonours],['国家队',score.breakdown.nationalTeam],['关键比赛',score.breakdown.keyMatches],['职业长度',score.breakdown.longevity],['逆袭与路线',score.breakdown.comeback+score.breakdown.route]];
  return el('section',{className:'current-score-card'},[el('div',{className:'current-score-main'},[el('span',{className:'score-grade',text:score.grade}),el('strong',{text:formatNumber(score.total)}),el('small',{text:'满分10000'})]),el('div',{className:'score-player'},[el('h2',{text:evidence.player.name}),el('p',{text:`${POSITION_CONFIG[evidence.player.position]?.name||'球员'} · ${evidence.career.clubName} · 第${evidence.career.season}赛季`}),el('span',{className:`verification-pill ${ranking?.status==='verified'?'is-verified':''}`,text:ranking?.status==='verified'?'服务器已认证':ranking?.eligible?'服务器日志跟踪中':'仅本地计分'})]),el('div',{className:'score-breakdown'},items.map(([label,value])=>el('div',{className:'score-part'},[el('small',{text:label}),el('strong',{text:formatNumber(value)})]))) ]);
}
function rankingRow(entry,rank,{local=false}={}){
  const name=String(entry.player_name||entry.playerName||entry.name||'未命名球员'),club=String(entry.club_name||entry.clubName||entry.club||'未知俱乐部'),score=Number(entry.score)||0,grade=String(entry.grade||'D'),position=entry.position||'ST',certified=!local||Boolean(entry.certified);
  const details=local?`出场 ${entry.apps} · 进球 ${entry.goals} · 助攻 ${entry.assists} · 荣誉 ${entry.honours} · 最高能力 ${entry.peakOvr}`:`${entry.nation||'未知国籍'} · ${POSITION_CONFIG[position]?.name||position} · 第${entry.seasons||0}赛季`;
  const footer=local
    ?el('span',{className:`verified-mark ${certified?'':'is-local'}`,text:certified?'已认证':'仅本地'})
    :el('div',{className:'ranking-entry-actions'},[
      el('span',{className:'verified-mark',text:'已认证'}),
      button('举报',{className:'button button--small',onClick:async()=>{
        try{await reportWorldEntry(entry.run_id||entry.runId,'玩家举报异常成绩');showToast('举报已提交，感谢协助维护公平',{type:'success'})}
        catch(error){showToast(error.message||'举报提交失败',{type:'error'})}
      }})
    ]);
  return el('article',{className:`ranking-row ${entry.current?'is-current':''}`},[el('span',{className:`ranking-rank rank-${rank}`,text:rank<=3?['🥇','🥈','🥉'][rank-1]:String(rank)}),el('div',{className:'ranking-player'},[el('strong',{text:name}),el('small',{text:`${club} · ${details}`}),local?el('small',{text:`创建 ${dateTime(entry.createdAt)} · 最后游玩 ${dateTime(entry.updatedAt)}`}):null]),el('div',{className:'ranking-score'},[el('strong',{text:formatNumber(score)}),el('small',{text:`${grade}级`})]),footer]);
}
function dateTime(value){const date=new Date(Number(value)||0);return Number.isNaN(date.getTime())?'日期未知':date.toLocaleDateString('zh-CN')}
function sectionHeading(title,copy){return el('header',{className:'ranking-heading'},[el('div',{},[el('h2',{text:title}),el('p',{text:copy})])])}
function selectControl(items){const select=el('select',{className:'select-input'});items.forEach(([value,label])=>select.append(el('option',{text:label,attrs:{value}})));return select}
function empty(value){return el('div',{className:'ranking-empty'},[el('span',{text:'◎'}),el('p',{text:value})])}
function openPrivacySettings(save,trigger,reload){
  const ranking=save.meta?.ranking,input=el('input',{className:'field-control',attrs:{type:'text',maxlength:'24',value:save.player.displayName||save.player.name,'aria-label':'公开昵称'}}),visible=el('input',{attrs:{type:'checkbox',checked:true}}),content=el('div',{className:'settings-card'},[el('label',{className:'setting-row'},[el('div',{},[el('strong',{text:'公开昵称'}),el('small',{text:'不会公开邮箱、IP、设备标识、真实姓名或精确位置。'})]),input]),el('label',{className:'toggle-row'},[el('span',{text:'公开生涯详情'}),visible])]);
  openSheet({title:'世界榜公开信息',subtitle:'只影响服务器排行榜展示',content,actions:[{label:'撤回排名',className:'button button--danger',onClick:async()=>{try{await withdrawWorldEntry(ranking);ranking.status='withdrawn';trigger.disabled=true;showToast('世界榜排名已撤回',{type:'success'});await reload()}catch(error){showToast(error.message,{type:'error'})}}},{label:'保存设置',className:'button button--primary',onClick:async()=>{try{await updateWorldPrivacy(ranking,{publicNickname:input.value.trim(),publicDetails:visible.checked});showToast('公开信息已更新',{type:'success'});await reload()}catch(error){showToast(error.message,{type:'error'})}}}]});
}
