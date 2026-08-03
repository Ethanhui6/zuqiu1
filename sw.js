const VERSION='green-pitch-v18.3.0-20260803-8';
const STATIC_CACHE=`${VERSION}-static`;
const DATA_CACHE=`${VERSION}-data`;
const APP_SHELL=[
  './',
  './index.html',
  './styles.css',
  './icon.svg',
  './manifest.webmanifest',
  './src/app/config.js',
  './src/app/router.js',
  './src/app/store.js',
  './src/app/theme.js',
  './src/components/appShell.js',
  './src/components/clubCard.js',
  './src/components/eventCard.js',
  './src/components/playerCard.js',
  './src/components/radarChart.js',
  './src/components/sheet.js',
  './src/components/talentCard.js',
  './src/components/toast.js',
  './src/main.js',
  './src/pages/careerPage.js',
  './src/pages/matchPage.js',
  './src/pages/onboardingPage.js',
  './src/pages/profilePage.js',
  './src/pages/saveSelectPage.js',
  './src/pages/trainingPage.js',
  './src/pages/transferPage.js',
  './src/pages/worldPage.js',
  './src/services/dataRepository.js',
  './src/services/localization/zh-CN.js',
  './src/services/rng.js',
  './src/services/storage/migrations.js',
  './src/services/storage/saveManager.js',
  './src/styles/base.css',
  './src/styles/components.css',
  './src/styles/pages.css',
  './src/styles/theme.css',
  './src/styles/ux-v18.2.css',
  './src/styles/pace-v18.3.css',
  './src/systems/achievement/achievementSystem.js',
  './src/systems/career/careerSystem.js',
  './src/systems/career/objectiveSystem.js',
  './src/systems/career/timeAdvanceSystem.js',
  './src/systems/career/cycleSystem.js',
  './src/systems/career/nationalSystem.js',
  './src/systems/career/ovr.js',
  './src/systems/career/seasonAwardSystem.js',
  './src/systems/ending/endingSystem.js',
  './src/systems/event/eventEngine.js',
  './src/systems/facility/facilitySystem.js',
  './src/systems/fan/fanSystem.js',
  './src/systems/match/matchSystem.js',
  './src/systems/pace/paceSystem.js',
  './src/systems/schedule/scheduleSystem.js',
  './src/systems/relationship/relationshipSystem.js',
  './src/systems/training/trainingSystem.js',
  './src/systems/transfer/transferSystem.js',
  './src/utils/dom.js',
  './src/utils/format.js',
  './data/achievements.json',
  './data/clubs.json',
  './data/data-sources.json',
  './data/event-manifest.json',
  './data/events/academy.json',
  './data/events/agent.json',
  './data/events/coach.json',
  './data/events/contract.json',
  './data/events/family.json',
  './data/events/fans.json',
  './data/events/finance.json',
  './data/events/index.json',
  './data/events/injury.json',
  './data/events/leadership.json',
  './data/events/legacy.json',
  './data/events/life.json',
  './data/events/locker-room.json',
  './data/events/locker.json',
  './data/events/match-prep.json',
  './data/events/match.json',
  './data/events/media.json',
  './data/events/national-team.json',
  './data/events/national.json',
  './data/events/recovery.json',
  './data/events/rivalry.json',
  './data/events/selection.json',
  './data/events/social.json',
  './data/events/story-chains.json',
  './data/events/sponsor.json',
  './data/events/tactics.json',
  './data/events/teammate.json',
  './data/events/training.json',
  './data/events/transfer.json',
  './data/events.json',
  './data/faces.json',
  './data/legend-templates.json',
  './data/players.json',
  './data/positions.json',
  './data/trophies.json',
  './data/version.json'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.addAll(APP_SHELL)));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>!key.startsWith(VERSION)).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(async response=>{
      if(response.ok)(await caches.open(STATIC_CACHE)).put('./index.html',response.clone());return response;
    }).catch(()=>caches.match('./index.html')));return;
  }
  if(url.pathname.includes('/data/')){
    event.respondWith((async()=>{
      const cache=await caches.open(DATA_CACHE);const cached=await cache.match(event.request);
      const network=fetch(event.request,{cache:'no-cache'}).then(response=>{if(response.ok)cache.put(event.request,response.clone());return response}).catch(()=>null);
      return cached||(await network)||new Response(JSON.stringify({error:'离线数据不可用'}),{status:503,headers:{'Content-Type':'application/json'}});
    })());return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(event.request);if(cached)return cached;
    const response=await fetch(event.request);if(response.ok&&['script','style','image','font'].includes(event.request.destination))(await caches.open(STATIC_CACHE)).put(event.request,response.clone());return response;
  })());
});
