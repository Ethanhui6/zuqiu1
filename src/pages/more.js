import { icon } from '../components/icons.js';

const items=[
  ['settings','????','????????????','simulation'],
  ['map','????','????????????','world'],
  ['leaderboard','?????','?????????????','leaderboard'],
  ['trophy','????','???????????','career'],
  ['analytics','????','????????????','analytics'],
  ['medical','????','??????????','medical'],
  ['locker','???','??????????','locker'],
  ['contract','????','????????','contract'],
  ['settings','??','???????????','settings']
];

export function morePage(app,state){
  const root=document.createElement('section');root.className='page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">??</h1><p class="page-subtitle">?????????????</p></div><span class="badge blue">V20</span></div><div class="stack">${group('?????',items.slice(0,4))}${group('????',items.slice(4,8))}${group('??',items.slice(8))}</div>`;
  const build=document.createElement('p');build.className='card-copy';build.style.margin='16px 4px 0';build.textContent='\u7248\u672c\u4fe1\u606f\u52a0\u8f7d\u4e2d...';root.append(build);
  fetch('./build-meta.json',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(meta=>{if(meta)build.textContent=`\u7248\u672c ${meta.version} \u00b7 ${String(meta.commitSha).slice(0,7)} \u00b7 ${meta.deploymentTarget} \u00b7 ${meta.buildTime}`;else build.textContent='\u7248\u672c\u4fe1\u606f\u4e0d\u53ef\u7528';}).catch(()=>{build.textContent='\u7248\u672c\u4fe1\u606f\u4e0d\u53ef\u7528';});
  root.addEventListener('click',e=>{const key=e.target.closest('[data-more]')?.dataset.more;if(!key)return;({simulation:()=>app.openSimulation(),world:()=>app.navigate('transfer'),leaderboard:()=>app.openLeaderboard(),career:()=>app.openCareerHub(),analytics:()=>app.openAnalytics(),medical:()=>app.openMedical(),locker:()=>app.openLocker(),contract:()=>app.openContract(),settings:()=>app.openSettings()})[key]?.();});
  return root;
}
function group(title,rows){return `<section class="surface-card"><div class="card-kicker">${title}</div><div style="height:8px"></div>${rows.map(([iconName,name,copy,key],i)=>`<button class="card-row" data-more="${key}" style="width:100%;min-height:58px;padding:8px 0;background:none;color:inherit;text-align:left;cursor:pointer;${i?'border-top:1px solid var(--line)':''}"><div class="card-row" style="justify-content:flex-start"><div class="icon-tile">${icon(iconName)}</div><div><strong>${name}</strong><div class="card-copy">${copy}</div></div></div>${icon('chevron','sm card-arrow')}</button>`).join('')}</section>`;}
