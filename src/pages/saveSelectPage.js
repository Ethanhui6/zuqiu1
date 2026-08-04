import {el,button,clear} from '../utils/dom.js';
import {saveManager} from '../services/storage/saveManager.js';
import {formatNumber} from '../utils/format.js';
import {showToast} from '../components/toast.js';
import {APP_VERSION} from '../app/config.js';

export function renderSaveSelect(root,{onOpen,onNew}){
  clear(root);
  root.className='save-select-root';
  const slots=saveManager.list();
  const wrap=el('section',{className:'save-select v20-save-console'});
  wrap.append(el('header',{className:'v20-save-console__header'},[
    el('div',{className:'v20-save-console__identity'},[
      el('span',{className:'v20-save-console__mark',text:'20',attrs:{'aria-hidden':'true'}}),
      el('div',{},[
        el('span',{className:'eyebrow',text:'绿茵浮沉'}),
        el('h1',{text:'V20 职业控制台'}),
        el('p',{text:'选择一段生涯继续推进，或从青年队创建新的职业道路。'})
      ])
    ]),
    el('div',{className:'v20-save-console__status',attrs:{role:'group','aria-label':'存档状态'}},[
      statusMetric(`${formatNumber(slots.length)}/3`,'存档槽位'),
      statusMetric('本地','保存位置'),
      statusMetric(`V${APP_VERSION}`,'当前版本')
    ])
  ]));

  const grid=el('div',{className:'save-grid v20-save-console__grid'});
  slots.forEach(meta=>{
    const card=el('article',{className:'save-card v20-save-slot'},[
      el('div',{className:'save-card__main'},[
        el('div',{className:'v20-save-slot__head'},[
          el('span',{className:'slot-badge',text:meta.id.replace('slot-','存档 ')}),
          el('time',{text:new Date(meta.updatedAt).toLocaleString('zh-CN'),attrs:{datetime:new Date(meta.updatedAt).toISOString()}})
        ]),
        el('h2',{text:meta.name}),
        el('div',{className:'v20-save-slot__stats'},[
          statusMetric(`${meta.age}岁`,'年龄'),
          statusMetric(String(meta.ovr),'综合能力'),
          statusMetric(meta.clubId||'待定','当前俱乐部')
        ])
      ]),
      el('div',{className:'save-actions'},[
        button('继续',{className:'button button--primary',onClick:()=>onOpen(meta.id)}),
        button('删除',{className:'button button--danger',onClick:()=>{
          if(confirm(`确定删除 ${meta.name} 的存档吗？`)){
            saveManager.delete(meta.id);
            showToast('存档已删除');
            renderSaveSelect(root,{onOpen,onNew});
          }
        }})
      ])
    ]);
    grid.append(card);
  });

  if(slots.length<3){
    const newCard=button('',{className:'save-card save-card--new v20-save-slot v20-save-slot--new',ariaLabel:'创建新生涯',onClick:onNew});
    newCard.append(el('span',{className:'new-plus',text:'＋',attrs:{'aria-hidden':'true'}}),el('strong',{text:'创建新生涯'}),el('small',{text:'建立球员档案并选择青年队起点'}));
    grid.append(newCard);
  }

  wrap.append(
    el('div',{className:'v20-save-console__section-head'},[
      el('div',{},[el('span',{className:'eyebrow',text:'生涯管理'}),el('h2',{text:'生涯存档'})]),
      el('span',{text:`${formatNumber(slots.length)} 个进行中`})
    ]),
    grid,
    el('footer',{className:'save-footer v20-save-console__footer'},[
      el('span',{text:'本地自动保存 · 支持导入导出 · 离线可进入'}),
      el('span',{text:`现有存档 ${formatNumber(slots.length)}/3`})
    ])
  );
  root.append(wrap);
}

function statusMetric(value,label){return el('div',{className:'v20-save-console__metric'},[el('strong',{text:value}),el('small',{text:label})])}
