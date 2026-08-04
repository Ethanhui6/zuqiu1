import {motionDirector} from '../animations/director/motionDirector.js';

/** 轻量路由：只替换当前页面容器，并为每个页面保存滚动位置。 */
export class Router{
  constructor(container,pages){this.container=container;this.pages=pages;this.route='career';this.cleanup=null;this.scroll=new Map()}
  render(route,ctx,{animate=true,restore='saved'}={}){
    if(!this.pages[route])route='career';
    const old=this.route;
    const currentScroll=this.container.scrollTop;
    if(old)this.scroll.set(old,currentScroll);
    if(this.cleanup)this.cleanup();
    this.route=route;
    this.container.dataset.route=route;
    this.container.classList.remove('page-enter');
    if(animate)motionDirector.enter(this.container);
    this.cleanup=this.pages[route](this.container,ctx)||null;
    const target=restore==='current'?currentScroll:(this.scroll.get(route)||0);
    requestAnimationFrame(()=>{this.container.scrollTop=target});
  }
  go(route,ctx){this.render(route,ctx,{animate:route!==this.route,restore:route===this.route?'current':'saved'})}
  refresh(ctx){this.render(this.route,ctx,{animate:false,restore:'current'})}
}
