const VERSION='green-pitch-v18.5.0-20260803-10';
const STATIC_CACHE=`${VERSION}-static`;
const DATA_CACHE=`${VERSION}-data`;
const CORE=[
  './','./index.html','./styles.css','./icon.svg','./manifest.webmanifest',
  './assets/crests/placeholder.svg',
  './src/main.js','./src/app/config.js','./src/app/router.js','./src/app/store.js','./src/app/theme.js',
  './src/components/appShell.js','./src/components/clubCard.js','./src/components/clubCrest.js','./src/components/eventCard.js','./src/components/formControls.js','./src/components/playerCard.js','./src/components/radarChart.js','./src/components/sheet.js','./src/components/talentCard.js','./src/components/toast.js',
  './src/pages/careerPage.js','./src/pages/matchPage.js','./src/pages/morePage.js','./src/pages/onboardingPage.js','./src/pages/profilePage.js','./src/pages/saveSelectPage.js','./src/pages/trainingPage.js','./src/pages/transferPage.js','./src/pages/worldPage.js',
  './src/services/dataRepository.js','./src/services/rng.js','./src/services/storage/migrations.js','./src/services/storage/saveManager.js',
  './src/styles/theme.css','./src/styles/base.css','./src/styles/components.css','./src/styles/pages.css','./src/styles/mobile-v18.5.css',
  './src/utils/dom.js','./src/utils/format.js','./src/utils/scrollLock.js','./src/utils/viewport.js','./src/utils/uiDiagnostics.js',
  './data/clubs.json','./data/legend-templates.json','./data/achievements.json','./data/positions.json','./data/events/index.json','./data/events/story-chains.json','./data/version.json'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.addAll(CORE)));
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
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok)(await caches.open(STATIC_CACHE)).put('./index.html',response.clone());
        return response;
      }catch{return (await caches.match('./index.html'))||Response.error()}
    })());return;
  }
  if(url.pathname.includes('/data/')){
    event.respondWith((async()=>{
      const cache=await caches.open(DATA_CACHE);
      const cached=await cache.match(event.request);
      const network=fetch(event.request,{cache:'no-cache'}).then(response=>{if(response.ok)cache.put(event.request,response.clone());return response}).catch(()=>null);
      return cached||(await network)||new Response(JSON.stringify({error:'离线数据不可用'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8'}});
    })());return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(STATIC_CACHE);
    const cached=await cache.match(event.request);
    if(cached)return cached;
    try{
      const response=await fetch(event.request);
      if(response.ok&&['script','style','image','font'].includes(event.request.destination))cache.put(event.request,response.clone());
      return response;
    }catch{return Response.error()}
  })());
});
