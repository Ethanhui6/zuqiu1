import {APP_VERSION} from './app/config.js';
import {dataRepository} from './services/dataRepository.js';
import {saveManager} from './services/storage/saveManager.js';
import {gameStore} from './app/store.js';
import {applyTheme,cycleTheme} from './app/theme.js';
import {Router} from './app/router.js';
import {createAppShell,updateShell} from './components/appShell.js';
import {showToast} from './components/toast.js';
import {renderSaveSelect} from './pages/saveSelectPage.js';
import {renderOnboarding} from './pages/onboardingPage.js';
import {renderCareerPage} from './pages/careerPage.js';
import {renderMatchPage} from './pages/matchPage.js';
import {renderTrainingPage} from './pages/trainingPage.js';
import {renderTransferPage} from './pages/transferPage.js';
import {renderWorldPage} from './pages/worldPage.js';
import {renderProfilePage} from './pages/profilePage.js';

const root=document.querySelector('#app');const boot=document.querySelector('#boot');let shell,router,ctx,unsubscribeStore=null,updateBanner=null,reloadingForUpdate=false;
applyTheme();

async function start(){
  try{
    await dataRepository.init();const migration=saveManager.migrateLegacyIfNeeded();if(migration)showToast(migration.note||'旧存档已迁移',{type:'success',duration:4200});
    boot?.remove();showSaveSelector();registerServiceWorker();
  }catch(error){console.error(error);boot.innerHTML=`<strong>载入失败</strong><span>${error.message}</span><button onclick="location.reload()">重新载入</button>`}
}
function showSaveSelector(){unsubscribeStore?.();unsubscribeStore=null;document.body.classList.remove('in-game');root.replaceChildren();renderSaveSelect(root,{onOpen:openSlot,onNew:()=>renderOnboarding(root,{repo:dataRepository,onComplete:save=>{const id=saveManager.createSlot(save);openSlot(id)},onCancel:showSaveSelector})})}
function openSlot(id){const save=saveManager.load(id);if(!save){showToast('存档无法读取',{type:'error'});return}gameStore.load(save,id);mountGame()}
function mountGame(){document.body.classList.add('in-game');root.replaceChildren();shell=createAppShell({onNavigate:navigate,onTheme:()=>{const mode=cycleTheme();gameStore.state.settings.theme=mode;gameStore.saveNow();showToast(`外观已切换：${{system:'跟随系统',light:'浅色',dark:'深色'}[mode]}`)},onSave:()=>{gameStore.saveNow();showToast('存档已保存',{type:'success'})}});root.append(shell.root);router=new Router(shell.main,{career:renderCareerPage,match:renderMatchPage,training:renderTrainingPage,transfer:renderTransferPage,world:renderWorldPage,profile:renderProfilePage});ctx={store:gameStore,repo:dataRepository,navigate,refresh:()=>{router.refresh(ctx);update()},onReturnToSlots:showSaveSelector};unsubscribeStore=gameStore.subscribe(()=>update());navigate('career')}
function navigate(route){router.go(route,ctx);update()}
function update(){if(!shell||!gameStore.state)return;const club=dataRepository.getClub(gameStore.state.career.clubId);updateShell(shell,gameStore.state,club,router.route);document.title=`${gameStore.state.player.name} · 绿茵浮沉 V18`}
async function registerServiceWorker(){if(!('serviceWorker'in navigator))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`);if(reg.waiting)promptUpdate(reg);reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)promptUpdate(reg)})});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadingForUpdate)return;reloadingForUpdate=true;location.reload()})}catch(error){console.warn('Service Worker 注册失败',error)}}
function promptUpdate(reg){if(updateBanner?.isConnected)return;const bar=document.createElement('div');updateBanner=bar;bar.className='update-banner';const message=document.createElement('span');message.textContent='新版本已经准备好';const update=document.createElement('button');update.type='button';update.textContent='立即更新';const later=document.createElement('button');later.type='button';later.textContent='稍后';bar.append(message,update,later);document.body.append(bar);update.onclick=()=>reg.waiting?.postMessage({type:'SKIP_WAITING'});later.onclick=()=>{bar.remove();updateBanner=null}}
start();
