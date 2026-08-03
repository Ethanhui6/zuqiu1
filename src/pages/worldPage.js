import {el,button,clear} from '../utils/dom.js';
import {CAREER_SETTINGS} from '../app/config.js';
import {formatNumber} from '../utils/format.js';
import {openSheet} from '../components/sheet.js';
import {createWorldClubCard,createClubCrest} from '../components/clubCard.js';

export function renderWorldPage(container,ctx){
  const {repo,store}=ctx;clear(container);let query='',country='全部',page=1;
  const root=el('section',{className:'page'}),title=el('div',{className:'page-title'},[
    el('div',{},[el('span',{className:'eyebrow',text:'球队世界'}),el('h1',{text:'寻找适合你的足球环境'}),el('p',{text:'浏览真实俱乐部名称与独立模拟评级，重点比较青训、风格和年轻球员机会。'})])
  ]),filters=el('div',{className:'world-filters'}),search=el('input',{className:'search-input',attrs:{type:'search',placeholder:'搜索球队、联赛或国家','aria-label':'搜索球队'}}),select=el('select',{className:'select-input',attrs:{'aria-label':'按国家筛选'}}),grid=el('div',{className:'club-grid'}),pager=el('div',{className:'pager'});
  ['全部',...new Set(repo.clubs.map(club=>club.country))].forEach(name=>select.append(el('option',{text:name,attrs:{value:name}})));
  filters.append(search,select);root.append(title,filters,grid,pager);container.append(root);

  function update(){
    grid.replaceChildren();pager.replaceChildren();
    const q=query.toLowerCase(),all=repo.clubs.filter(club=>(country==='全部'||club.country===country)&&(club.cn.includes(query)||club.native.toLowerCase().includes(q)||club.leagueCn.includes(query)||club.country.includes(query)));
    const pages=Math.max(1,Math.ceil(all.length/CAREER_SETTINGS.worldPageSize));page=Math.min(page,pages);
    all.slice((page-1)*CAREER_SETTINGS.worldPageSize,page*CAREER_SETTINGS.worldPageSize).forEach(club=>grid.append(createWorldClubCard(club,{playerPosition:store.state?.player?.position||'',onOpen:()=>showClub(club)})));
    pager.append(
      button('上一页',{className:'button button--secondary',disabled:page<=1,onClick:()=>{page--;update();container.scrollTop=0}}),
      el('span',{text:`第 ${page}/${pages} 页 · ${all.length} 家`}),
      button('下一页',{className:'button button--secondary',disabled:page>=pages,onClick:()=>{page++;update();container.scrollTop=0}})
    );
  }
  function showClub(club){
    const content=el('div',{className:'club-detail'},[
      el('div',{className:'club-detail-hero'},[createClubCrest(club,{size:'large'}),el('div',{},[el('h2',{text:club.cn}),el('p',{className:'muted',text:`${club.country} · ${club.city} · ${club.leagueCn}`}),el('div',{className:'tag-row'},[el('span',{className:'tag',text:club.tactic}),el('span',{className:'tag',text:`联赛层级 ${club.tier}`})])])]),
      el('div',{className:'metric-grid'},[
        metric('综合实力',club.rep),metric('青训等级',club.youth),metric('年轻机会',club.youthUsage),metric('财政能力',club.finance)
      ]),
      el('div',{className:'detail-list'},[
        detail('球队风格',club.tactic),detail('招募偏好',club.recruitment),detail('主要位置需求',club.needs.join('、')),detail('球场容量',formatNumber(club.stadiumCapacity)),detail('数据说明','球队名称为身份资料；评级与未核实字段属于独立模拟值。')
      ])
    ]);
    openSheet({title:club.cn,subtitle:`${club.country} · ${club.leagueCn}`,content,size:'large'});
  }
  search.oninput=()=>{query=search.value.trim();page=1;update()};select.onchange=()=>{country=select.value;page=1;update()};update();return()=>{};
}
function metric(label,value){return el('div',{className:'metric'},[el('small',{text:label}),el('strong',{text:String(value)})])}
function detail(label,value){return el('div',{className:'detail-row'},[el('span',{text:label}),el('strong',{text:String(value)})])}
