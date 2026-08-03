export class Router{
  constructor(container,pages){this.container=container;this.pages=pages;this.route='career';this.cleanup=null;this.scroll=new Map()}
  go(route,ctx){if(!this.pages[route])route='career';if(this.cleanup)this.cleanup();const old=this.route;if(old)this.scroll.set(old,this.container.scrollTop);this.route=route;this.container.dataset.route=route;this.container.classList.remove('page-enter');void this.container.offsetWidth;this.container.classList.add('page-enter');this.cleanup=this.pages[route](this.container,ctx)||null;requestAnimationFrame(()=>{this.container.scrollTop=this.scroll.get(route)||0})}
  refresh(ctx){this.go(this.route,ctx)}
}
