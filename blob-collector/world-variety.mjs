import {volcanoRegion} from './volcano-area.mjs';
import {iceRegion} from './ice-area.mjs';
import * as T from './vendor/three.module.js';
import {SUNNY,sunnyHeight,sunnyInside,sunnyGapAt,sunnyCollision,pathDistance} from './sunny-area.mjs';
import {ScenicBatch} from './scenic-geometry.mjs';
import {foliageGeometry} from './forest-detail.mjs';
// A single baked decoration mesh: varied woodland pockets keep paths open.
export function addWorldVariety(root){
 const b=new ScenicBatch(),stem=new T.CylinderGeometry(.012,.018,.3,4),petal=new T.CircleGeometry(1,7),disc=new T.CircleGeometry(1,18),wood=new T.CylinderGeometry(1,1,1,9),rock=new T.DodecahedronGeometry(1,0),leaf=foliageGeometry();let seed=8932;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const clear=(x,z)=>sunnyInside(x,z)&&!iceRegion(x,z,1)&&!volcanoRegion(x,z,1)&&!sunnyGapAt(x,z)&&pathDistance(x,z)>2.1&&!sunnyCollision(x,sunnyHeight(x,z),z,.6)&&![SUNNY.home,SUNNY.storage,SUNNY.press,SUNNY.blobStation].some(p=>Math.hypot(x-p.x,z-p.z)<4);
 const meadows=[[-7,8,'#e6bd67'],[8,3,'#ede5c5'],[-15,-3,'#d7b2bd'],[17,15,'#d9cc8b']];let flowers=0;
 // Wild blooms are rendered only by the collectible resource batches.

 const stumps=0;/* Stümpfe und dünne Stämme: scenery-pickups */
 let ferns=0;for(let i=0;i<32;i++){const a=random()*Math.PI*2,x=Math.cos(a)*(13+random()*16),z=Math.sin(a)*(9+random()*13);if(!clear(x,z))continue;const y=sunnyHeight(x,z);for(let j=0;j<5;j++){const heading=j*2.4;for(let k=1;k<=4;k++)for(const side of [-1,1])b.add(leaf,k%2?'#457455':'#669060',x+Math.sin(heading)*k*.15+Math.cos(heading)*side*.1,y+.12+Math.sin(k/5*Math.PI)*.2,z+Math.cos(heading)*k*.15-Math.sin(heading)*side*.1,.18,.18,.23,.3,heading+side*.8,.1);}ferns++;}
 const mesh=b.finish(root);for(const g of [stem,petal,disc,wood,rock,leaf])g.dispose();return {mesh,flowers,stumps,ferns};
}
