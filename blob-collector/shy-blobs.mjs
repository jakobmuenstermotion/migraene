import {SUNNY,sunnyHeight,sunnyInside,sunnyGapAt,sunnyCollision} from './sunny-area.mjs';
import {REGION_TREES} from './woodland-regions.mjs';
import {buildingBuilt} from './homebase-build.mjs';
const covers=[...SUNNY.trees.map(([x,z])=>({x,z})),...REGION_TREES,...SUNNY.cliffs];
export function advanceShyHide(s,b,dt){if(buildingBuilt(s,'nursery')){delete b.hiding;if(!b.fleeing)b.hideProgress=0;b.shySeconds=0;return false;}if(b.status!=='wild')return false;
 if(!b.hiding){if(Math.hypot(b.x-s.player.x,b.z-s.player.z)<8)b.shySeconds=(b.shySeconds??0)+dt;if((b.shySeconds??0)<2.5)return false;
  const target=covers.filter(p=>Math.hypot(p.x-b.x,p.z-b.z)<12).sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z)).find(p=>{for(let i=1;i<9;i++){const t=i/10,x=b.x+(p.x-b.x)*t,z=b.z+(p.z-b.z)*t;if(!sunnyInside(x,z)||sunnyGapAt(x,z)||i<7&&sunnyCollision(x,sunnyHeight(x,z),z,.2))return false;}return true;});if(!target)return false;b.hiding={from:{x:b.x,z:b.z},to:{x:target.x,z:target.z},duration:Math.max(1,Math.hypot(target.x-b.x,target.z-b.z)/7.5),elapsed:0};
 }
 const h=b.hiding;h.elapsed+=dt;const t=Math.min(1,h.elapsed/h.duration);b.hideProgress=Math.max(0,(t-.65)/.35);b.x=h.from.x+(h.to.x-h.from.x)*t;b.z=h.from.z+(h.to.z-h.from.z)*t;b.y=sunnyHeight(b.x,b.z)+.4-b.hideProgress*.3;b.angle=Math.atan2(h.to.x-h.from.x,h.to.z-h.from.z);return t===1;
}
