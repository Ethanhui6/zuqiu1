import {el,button,clear} from '../utils/dom.js';
import {saveManager} from '../services/storage/saveManager.js';
import {formatNumber} from '../utils/format.js';
import {showToast} from '../components/toast.js';
import {APP_VERSION} from '../app/config.js';

export function renderSaveSelect(root,{onOpen,onNew}){
  clear(root);
  root.className='save-select-root';
  const wrap=el('section',{className:'save-select'});
  wrap.append(el('header',{className:'save-hero'},[
    el('div',{className:'hero-ball',text:'⚽'}),
    el('span',{className:'eyebrow',text:`绿茵浮沉 V${APP_VERSION}`}),
    el('h1',{text:'从青年队出发，书写你的球员生涯'}),
    el('p',{text:'比赛、训练、关系、伤病、转会和选择会共同塑造每一局不同的职业生涯。'})
  ]));

  const slots=saveManager.list();
  const grid=el('div',{className:'save-grid'});
  slots.forEach(meta=>{
    const card=el('article',{className:'save-card glass-card'},[
      el('div',{className:'save-card__main'},[
        el('span',{className:'slot-badge',text:meta.id.replace('slot-','存档 ')}),
        el('h2',{text:meta.name}),
        el('p',{text:`${meta.age}岁 · 综合能力 ${meta.ovr} · ${new Date(meta.updatedAt).toLocaleString('zh-CN')}`})
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
    const newCard=button('',{className:'save-card save-card--new',onClick:onNew});
    newCard.append(el('span',{className:'new-plus',text:'＋'}),el('strong',{text:'创建新生涯'}),el('small',{text:'最多保留三个存档槽'}));
    grid.append(newCard);
  }

  wrap.append(
    grid,
    el('footer',{className:'save-footer'},[
      el('span',{text:'本地自动保存 · 支持导入导出 · 离线可进入'}),
      el('span',{text:`现有存档 ${formatNumber(slots.length)}/3`})
    ])
  );
  root.append(wrap);
}
