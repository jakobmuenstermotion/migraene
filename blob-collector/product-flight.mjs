import {SUNNY,sunnyHeight} from './sunny-area.mjs';
export const PRODUCT_FLIGHT_SECONDS=1.3;
// Visual only: production credits the bag once in advancePress, never here.
export function productFlightPose(age,reduced=false,player=SUNNY.spawn,origin=SUNNY.press){
 const t=Math.max(0,Math.min(1,age/PRODUCT_FLIGHT_SECONDS)),e=t*t*(3-2*t),from={x:0,y:.94,z:1},to={x:player.x-origin.x,y:(player.y??sunnyHeight(player.x,player.z))-sunnyHeight(origin.x,origin.z)+1.1,z:player.z-origin.z};
 const angle=origin.rotation??0,dx=to.x,dz=to.z;to.x=Math.cos(angle)*dx-Math.sin(angle)*dz;to.z=Math.sin(angle)*dx+Math.cos(angle)*dz;
 return {x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e+Math.sin(t*Math.PI)*(reduced?.35:2.1),z:from.z+(to.z-from.z)*e,scale:1-Math.max(0,(t-.85)/.15)*.8,visible:age>=0&&age<PRODUCT_FLIGHT_SECONDS};
}
