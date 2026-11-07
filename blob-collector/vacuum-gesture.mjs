// One shared geometry for the visible wheel and pointer hit testing.
export function wheelRadius(width,height=1000){return Math.min(230,width-110,(height-150)/1.73);}
export function wheelPosition(index,radius,out={}){const a=index*Math.PI/8;out.x=-Math.cos(a)*radius;out.y=-Math.sin(a)*radius;return out;}
export function wheelChoice(point,center,radius){
  const dx=point.x-center.x,dy=point.y-center.y,d=Math.hypot(dx,dy);
  if(d<58||d>radius+100||dy>35)return null;
  const angle=Math.atan2(-dy,-dx);if(angle<-.17||angle>1.85)return null;
  return Math.max(0,Math.min(4,Math.round(angle/(Math.PI/8))));
}

// One press has exactly one outcome: tap, held selection, or cancellation.
export function createVacuumPress({open,close,tap,select,delay=250,schedule=setTimeout,unschedule=clearTimeout}){
 let press=null;
 function cancel(){if(!press)return;unschedule(press.timer);press=null;close();}
 return {get active(){return Boolean(press);},get held(){return Boolean(press?.held);},
  start(){if(press)return;const p=press={held:false};p.timer=schedule(()=>{if(press===p){p.held=true;open();}},delay);},
  release(target){if(!press)return;const held=press.held;unschedule(press.timer);press=null;close();if(held){if(target!==null)select(target);}else tap();},cancel};
}
