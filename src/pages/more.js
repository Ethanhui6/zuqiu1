import { icon } from '../components/icons.js';
import { APP_VERSION } from '../app/config.js';
import { displayVersion } from '../core/contentVersion.js';

const items=[
  ['settings','主题外观','跟随系统、深色或浅色','theme'],
  ['message','新闻中心','查看比赛、训练和职业动态','news'],
  ['club','俱乐部目录','国家、赛事、联赛与俱乐部详情','clubs'],
  ['leaderboard','生涯排行榜','本地排行、青年新星与潜力榜','leaderboard'],
  ['trophy','我的生涯','总结、关系、成就与存档','career'],
  ['share','生涯分享卡','生成可复制、可分享的职业档案','share'],
  ['trophy','荣誉室','奖杯、个人奖项与逐赛季履历','honors'],
  ['analytics','数据分析','评分趋势、投入与成长收益','analytics'],
  ['settings','设置','音效、动画、字体和存档','settings']
];

export function morePage(app,state){
  const root=document.createElement('section');root.className='page more-page';
  root.innerHTML=`<div class="page-head"><div><h1 class="page-title">更多</h1><p class="page-subtitle">生涯档案与设置</p></div><span class="badge blue">V${displayVersion(APP_VERSION)}</span></div><div class="stack">${group('信息',items.slice(0,3))}${group('生涯档案',items.slice(3,8))}${group('系统',items.slice(8))}</div>`;
  root.addEventListener('click',e=>{const key=e.target.closest('[data-more]')?.dataset.more;if(!key)return;({clubs:()=>app.navigate('clubs'),leaderboard:()=>app.openLeaderboard(),career:()=>app.openCareerHub(),share:()=>app.openCareerShare(),honors:()=>app.openHonors(),analytics:()=>app.openAnalytics(),settings:()=>app.openSettings(),theme:()=>app.openThemeSettings(),news:()=>app.openNewsCenter()})[key]?.();});
  return root;
}
function group(title,rows){return `<section class="surface-card"><div class="card-kicker">${title}</div><div style="height:8px"></div>${rows.map(([iconName,name,copy,key],i)=>`<button class="card-row" data-more="${key}" style="width:100%;min-height:58px;padding:8px 0;background:none;color:inherit;text-align:left;cursor:pointer;${i?'border-top:1px solid var(--line)':''}"><div class="card-row" style="justify-content:flex-start"><div class="icon-tile">${icon(iconName)}</div><div><strong>${name}</strong><div class="card-copy">${copy}</div></div></div>${icon('chevron','sm card-arrow')}</button>`).join('')}</section>`;}
