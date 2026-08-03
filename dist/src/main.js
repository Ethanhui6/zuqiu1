import {APP_VERSION} from './app/config.js';
import {dataRepository} from './services/dataRepository.js';
import {saveManager} from './services/storage/saveManager.js';
import {gameStore} from './app/store.js';
import {applyTheme} from './app/theme.js';
import {Router} from './app/router.js';
import {createAppShell,updateShell} from './components/appShell.js';
import {showToast} from './components/toast.js';
import {installViewportObserver} from './utils/viewport.js';
import {installUiDiagnostics} from './utils/uiDiagnostics.js';
import {forceUnlockPageScroll} from './utils/scrollLock.js';
import {ensureRankingRun,queueRankingCheckpoint} from './services/api/rankingSync.js';
import {renderSaveSelect} from './pages/saveSelectPage.js';
import {renderOnboarding} from './pages/onboardingPage.js';
import {renderCareerPage} from './pages/careerPage.js';
import {renderMatchPage} from './pages/matchPage.js';
import {renderTrainingPage} from './pages/trainingPage.js';
import {renderTransferPage} from './pages/transferPage.js';
import {renderWorldPage} from './pages/worldPage.js';
import {renderProfilePage} from './pages/profilePage.js';
import {renderMorePage} from './pages/morePage.js';
import {renderRankingsPage} from './pages/rankingsPage.js';
import {animationDirector} from './animations/director/animationDirector.js';
import {openGamePaceSheet} from './components/gamePaceSheet.js';

const root=document.querySelector('#app');
const boot=document.querySelector('#boot');
let shell,router,ctx,unsubscribeStore=null,updateBanner=null,reloadingForUpdate=false;
const GAME_ROUTES=new Set(['career','match','training','transfer','more','world','profile','rankings']);

applyTheme();
installViewportObserver();
installUiDiagnostics();
animationDirector.configure(()=>gameStore.state?.settings||{});

async function start(){
  try{
    await dataRepository.init();
    const migration=saveManager.migrateLegacyIfNeeded();
    if(migration)showToast(migration.note||'旧存档已迁移',{type:'success',duration:4200});
    boot?.remove();
    restoreInitialView();
    registerServiceWorker();
  }catch(error){
    console.error(error);
    if(boot){
      boot.replaceChildren();
      const title=document.createElement('strong');title.textContent='载入失败';
      const copy=document.createElement('span');copy.textContent=error?.message||'游戏资源无法读取';
      const retry=document.createElement('button');retry.type='button';retry.textContent='重新载入';retry.addEventListener('click',()=>location.reload());
      boot.append(title,copy,retry);
    }
  }
}

function historyUrl(view,route=''){
  const hash=view==='game'&&GAME_ROUTES.has(route)?route:view;
  return `${location.pathname}${location.search}#${hash}`;
}
function commitHistory(view,route,mode='push'){
  if(mode==='none')return;
  const method=mode==='replace'?'replaceState':'pushState';
  history[method]({view,route:view==='game'?route:null},'',historyUrl(view,route));
}
function viewFromLocation(){
  const hash=location.hash.slice(1);
  if(GAME_ROUTES.has(hash))return{view:'game',route:hash};
  if(hash==='create')return{view:'create',route:null};
  return{view:'saves',route:null};
}
function restoreInitialView(){
  const desired=viewFromLocation(),slot=saveManager.currentSlot();
  if(desired.view==='game'&&slot&&saveManager.load(slot)){openSlot(slot,{historyMode:'replace',initialRoute:desired.route});return}
  if(desired.view==='create'){showOnboarding({historyMode:'replace'});return}
  showSaveSelector({historyMode:'replace'});
}

function showSaveSelector({historyMode='replace'}={}){
  unsubscribeStore?.();unsubscribeStore=null;
  forceUnlockPageScroll();
  shell?.destroy?.();shell=null;router=null;
  document.body.classList.remove('in-game');
  root.replaceChildren();
  renderSaveSelect(root,{onOpen:id=>openSlot(id),onNew:()=>showOnboarding({historyMode:'push'})});
  commitHistory('saves',null,historyMode);
}

function showOnboarding({historyMode='push'}={}){
  unsubscribeStore?.();unsubscribeStore=null;
  forceUnlockPageScroll();
  shell?.destroy?.();shell=null;router=null;
  document.body.classList.remove('in-game');
  renderOnboarding(root,{repo:dataRepository,onComplete:save=>{const id=saveManager.createSlot(save);openSlot(id,{historyMode:'replace'})},onCancel:()=>showSaveSelector({historyMode:'replace'})});
  commitHistory('create',null,historyMode);
}

function openSlot(id,{historyMode='push',initialRoute='career'}={}){
  const save=saveManager.load(id);
  if(!save){showToast('存档无法读取，且没有可恢复备份',{type:'error'});return}
  gameStore.load(save,id);mountGame(initialRoute);
  commitHistory('game',initialRoute,historyMode);
  if(saveManager.lastNotice)showToast(saveManager.lastNotice,{type:'success',duration:4600});
}

function mountGame(initialRoute='career'){
  document.body.classList.add('in-game');
  root.className='';root.replaceChildren();
  shell=createAppShell({
    onNavigate:navigate,
    onBack:()=>navigate('career'),
    onHome:()=>navigate('career'),
    onSave:()=>{gameStore.saveNow();showToast('存档已保存',{type:'success'})},
    onPaceSettings:()=>openGamePaceSettings()
  });
  root.append(shell.root);
  router=new Router(shell.main,{
    career:renderCareerPage,
    match:renderMatchPage,
    training:renderTrainingPage,
    transfer:renderTransferPage,
    more:renderMorePage,
    world:renderWorldPage,
    profile:renderProfilePage,
    rankings:renderRankingsPage
  });
  ctx={store:gameStore,repo:dataRepository,navigate,refresh:()=>{router.refresh(ctx);update()},openPaceSettings:openGamePaceSettings,onReturnToSlots:()=>showSaveSelector({historyMode:'push'})};
  unsubscribeStore=gameStore.subscribe((state,reason)=>{
    update();
    void queueRankingCheckpoint(state,reason,dataRepository,()=>saveManager.save(state,gameStore.activeSlot));
  });
  navigate(initialRoute,{historyMode:'none'});
  void ensureRankingRun(gameStore,dataRepository);
}
function navigate(route,{historyMode='push'}={}){
  if(!router)return;
  const target=GAME_ROUTES.has(route)?route:'career',changed=target!==router.route;
  router.go(target,ctx);update();
  if(changed||historyMode==='replace')commitHistory('game',target,historyMode);
}

function openGamePaceSettings(){
  if(!gameStore.state)return;
  openGamePaceSheet({store:gameStore});
}

function update(){
  if(!shell||!gameStore.state)return;
  const club=dataRepository.getClub(gameStore.state.career.clubId);
  updateShell(shell,gameStore.state,club,router.route,dataRepository);
  document.title=`${gameStore.state.player.name} · 绿茵浮沉 V${APP_VERSION}`;
}

async function registerServiceWorker(){
  if(!('serviceWorker'in navigator))return;
  const development=['localhost','127.0.0.1'].includes(location.hostname)||new URLSearchParams(location.search).has('no-sw');
  if(development){
    const registrations=await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(item=>item.unregister()));
    return;
  }
  try{
    const reg=await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`);
    if(reg.waiting)promptUpdate(reg);
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;
      worker?.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller)promptUpdate(reg);
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(reloadingForUpdate)return;
      reloadingForUpdate=true;location.reload();
    });
  }catch(error){console.warn('离线缓存注册失败',error)}
}
function promptUpdate(reg){
  if(updateBanner?.isConnected)return;
  const bar=document.createElement('div');updateBanner=bar;bar.className='update-banner';
  const message=document.createElement('span');message.textContent='新版本已经准备好';
  const update=document.createElement('button');update.type='button';update.textContent='立即更新';
  const later=document.createElement('button');later.type='button';later.textContent='稍后';
  bar.append(message,update,later);(document.querySelector('#toast-root')||document.body).append(bar);
  update.addEventListener('click',()=>reg.waiting?.postMessage({type:'SKIP_WAITING'}));
  later.addEventListener('click',()=>{bar.remove();updateBanner=null});
}
window.addEventListener('popstate',event=>{
  const target=event.state?.view?event.state:viewFromLocation();
  if(target.view==='game'){
    const route=GAME_ROUTES.has(target.route)?target.route:viewFromLocation().route||'career';
    if(!gameStore.state){const slot=saveManager.currentSlot();if(slot){openSlot(slot,{historyMode:'none',initialRoute:route});return}}
    if(router){router.go(route,ctx);update();return}
  }
  if(target.view==='create'){showOnboarding({historyMode:'none'});return}
  showSaveSelector({historyMode:'none'});
});
start();
