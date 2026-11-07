import {CONFIG,leafVariation} from './simulation.mjs';

const smooth=t=>t*t*(3-2*t);
export function returningLeafPose(leaf,reduced=false,out={}){
  const t=Math.max(0,Math.min(1,leaf.returnProgress)),e=smooth(t),remaining=1-e,phase=leafVariation(leaf.id,leaf.respawnCycle)*Math.PI*2,motion=reduced?0:1;
  out.x=leaf.homeX-(1.3+Math.sin(phase)*.35)*remaining+Math.sin(t*8+phase)*.32*Math.sin(t*Math.PI)*motion;
  out.z=leaf.homeZ-.35*remaining+Math.sin(t*6+phase)*.25*Math.sin(t*Math.PI)*motion;
  out.y=leaf.homeY+(2.1+leafVariation(leaf.id,19)*1.4)*remaining;
  out.angle=leaf.homeAngle+Math.sin(t*7+phase)*remaining*.9*motion;
  out.roll=Math.sin(t*12+phase)*.55*remaining*motion;out.pitch=Math.cos(t*9+phase)*.45*remaining*motion;
  out.size=leaf.size*smooth(Math.min(1,t/.22));return out;
}
export function createWindLeaves(count=CONFIG.windLeaves){return Array.from({length:count},(_,id)=>({id,phase:leafVariation(id,29),duration:25+leafVariation(id,31)*21,z:(leafVariation(id,37)*2-1)*7,height:1.7+leafVariation(id,41)*2.7,size:.6+leafVariation(id,43)*.32,color:id%5}));}
export function windLeafPose(leaf,time,out={}){
  const t=(time/leaf.duration+leaf.phase)%1,phase=leaf.phase*Math.PI*2;
  out.x=-13+t*26;out.z=leaf.z+Math.sin(t*6+phase)*.65;out.y=.07+leaf.height*(1-smooth(Math.min(1,t/.9)))+Math.sin(time*.7+phase)*.16*Math.sin(Math.PI*Math.min(1,t/.9));
  out.angle=time*.7+phase;out.roll=Math.sin(time*1.4+phase)*.65;out.pitch=Math.cos(time*1.1+phase)*.5;
  out.size=leaf.size*smooth(Math.min(1,t/.08,(1-t)/.05));return out;
}
export function blobStretch(progress,distance=Infinity){
  const t=Math.min(1,Math.max(0,progress)),shrink=1-smooth(Math.max(0,(t-.7)/.3))*.96;
  const length=Math.min(1+Math.sin(t*Math.PI)*2.8,Math.max(2.7,(distance+.32)/.53));
  const width=shrink/Math.sqrt(length);
  return {x:width,y:width,z:length*shrink};
}
export function blobCapturePose(blob,player,opening){
  const t=Math.max(0,Math.min(1,blob.progress)),scale=blobStretch(t),side=(blob.captureSide??0)*(1-smooth(t)),angle=player.angle+side;
  // The whole local body box remains on the outside of the nozzle plane.
  // This includes its width when approaching the opening at an angle.
  const clearance=.65*scale.z+.7*scale.x*Math.abs(Math.tan(side))+.02;
  const distance=Math.max(clearance,(blob.captureDistance??1)*(1-smooth(Math.min(1,t/.65))));
  return {x:opening.x+Math.sin(angle)*distance,y:opening.y+Math.sin(t*Math.PI)*.13,z:opening.z+Math.cos(angle)*distance,angle:angle+Math.PI,scale};
}
export function deliveryPosition(delivery){
  const t=Math.min(1,Math.max(0,delivery.progress)),e=1-(1-t)*(1-t),curl=Math.sin(t*Math.PI);
  // Start with a forward kick out of the opening, then converge on the basket.
  const kick=curl*(1-t)*.2,target=delivery.target??{x:CONFIG.basketX,y:CONFIG.basketY,z:CONFIG.basketZ};
  return {x:delivery.x+(target.x-delivery.x)*e+Math.sin(delivery.angle)*kick,y:delivery.y+(target.y-delivery.y)*e+curl*.13,z:delivery.z+(target.z-delivery.z)*e+Math.cos(delivery.angle)*kick};
}
// Every stream starts on the actual outer edge of the suction sector and
// converges on the opening, rather than continuing behind the character.
export function airPoint(lane,progress,time=0){
  const t=Math.min(1,Math.max(0,progress)),a=lane*CONFIG.suctionHalfAngle;
  const curl=Math.sin(t*Math.PI),r=CONFIG.suctionRadius;
  return {x:Math.sin(a)*r*(1-t)+Math.sin(t*7+lane*5+time)*.075*curl,y:.1*(1-t)+.42*t+curl*(.14+Math.cos(lane*5)*.08),z:Math.cos(a)*r*(1-t)+.984*t};
}
