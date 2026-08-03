import {el,button,clear} from '../utils/dom.js';
import {CAREER_SETTINGS} from '../app/config.js';
import {formatNumber} from '../utils/format.js';
import {openSheet} from '../components/sheet.js';
import {createWorldClubCard,createClubCrest} from '../components/clubCard.js';
import {animationDirector} from '../animations/director/animationDirector.js';

export function renderWorldPage(container,ctx){
  const {repo,store}=ctx;
  clear(container);
  let query='',country='全部',page=1;
  const root=el('section',{className:'page world-page'});
  const title=el('header',{className:'page-title'},[
    el('div',{},[
      el('span',{className:'eyebrow',text:'球队世界'}),
      el('h1',{text:'寻找适合你的足球环境'}),
      el('p',{text:'按国家、联赛和球队名称搜索。手机端使用单列卡片，详情在底部面板中查看。'})
    ])
  ]);
  const filters=el('section',{className:'world-filters',attrs:{'aria-label':'球队筛选'}});
  const search=el('input',{className:'search-input',attrs:{type:'search',placeholder:'搜索球队、联赛或国家','aria-label':'搜索球队',enterkeyhint:'search'}});
  const select=el('select',{className:'select-input',attrs:{'aria-label':'按国家筛选'}});
  ['全部',...new Set(repo.clubs.map(club=>club.country))].forEach(name=>select.append(el('option',{text:name,attrs:{value:name}})));
  filters.append(search,select);
  const status=el('div',{className:'world-result-status',attrs:{'aria-live':'polite'}});
  const grid=el('div',{className:'club-grid'}),pager=el('nav',{className:'pager',attrs:{'aria-label':'球队分页'}});
  root.append(title,filters,status,grid,pager);container.append(root);

  function update(){
    grid.replaceChildren();pager.replaceChildren();
    const q=query.toLocaleLowerCase('zh-CN');
    const all=repo.clubs.filter(club=>(country==='全部'||club.country===country)&&(
      club.cn.includes(query)||String(club.native||'').toLocaleLowerCase('zh-CN').includes(q)||club.leagueCn.includes(query)||club.country.includes(query)
    ));
    const pages=Math.max(1,Math.ceil(all.length/CAREER_SETTINGS.worldPageSize));page=Math.min(Math.max(1,page),pages);
    status.textContent=`找到 ${all.length} 家俱乐部 · 第 ${page}/${pages} 页`;
    const visible=all.slice((page-1)*CAREER_SETTINGS.worldPageSize,page*CAREER_SETTINGS.worldPageSize);
    visible.forEach(club=>grid.append(createWorldClubCard(club,{playerPosition:store.state?.player?.position||'',onOpen:()=>showClub(club)})));
    if(!visible.length)grid.append(el('section',{className:'empty-state glass-card'},[el('div',{className:'empty-icon',text:'◎'}),el('h2',{text:'没有匹配的球队'}),el('p',{text:'尝试缩短搜索词或切换国家筛选。'})]));
    pager.append(
      button('上一页',{className:'button button--secondary',disabled:page<=1,onClick:()=>{page-=1;update();container.scrollTo({top:0,behavior:'smooth'})}}),
      el('span',{text:`${page} / ${pages}`}),
      button('下一页',{className:'button button--secondary',disabled:page>=pages,onClick:()=>{page+=1;update();container.scrollTo({top:0,behavior:'smooth'})}})
    );
  }
  async function showClub(club){
    await animationDirector.play('crest-assemble',{id:club.id,monogram:club.cn.slice(0,2),club:club.cn},{token:`crest:${club.id}`});
    const content=el('div',{className:'club-detail'},[
      el('div',{className:'club-detail-hero'},[
        createClubCrest(club,{size:'large'}),
        el('div',{className:'club-detail-title'},[
          el('h2',{text:club.cn}),
          el('p',{className:'muted',text:`${club.country} · ${club.city||'城市未标注'} · ${club.leagueCn}`}),
          el('div',{className:'tag-row'},[el('span',{className:'tag',text:club.tactic}),el('span',{className:'tag',text:`联赛层级 ${club.tier}`})])
        ])
      ]),
      el('div',{className:'metric-grid'},[
        metric('综合实力',club.rep),metric('青训等级',club.youth),metric('年轻机会',club.youthUsage),metric('财政能力',club.finance)
      ]),
      el('div',{className:'detail-list'},[
        detail('球队风格',club.tactic),detail('招募偏好',club.recruitment),detail('位置需求',(club.needs||[]).join('、')||'暂无'),detail('球场容量',formatNumber(club.stadiumCapacity)),detail('数据说明','球队名称用于游戏世界；能力与财政为独立模拟评级。')
      ])
    ]);
    openSheet({title:club.cn,subtitle:`${club.country} · ${club.leagueCn}`,content,size:'large'});
  }
  search.addEventListener('input',()=>{query=search.value.trim();page=1;update()});
  select.addEventListener('change',()=>{country=select.value;page=1;update()});
  update();return()=>{};
}
function metric(label,value){return el('div',{className:'metric'},[el('small',{text:label}),el('strong',{text:String(value??'—')})])}
function detail(label,value){return el('div',{className:'detail-row'},[el('span',{text:label}),el('strong',{text:String(value??'—')})])}
