export class AnimationFallback{
  apply(definition,result,target){
    if(target instanceof HTMLElement){target.dataset.animationState='complete';target.dataset.animationId=definition?.id||'none'}
    return{status:'fallback',animationId:definition?.id||'',result,cleaned:true};
  }
}

