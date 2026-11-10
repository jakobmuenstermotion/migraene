import {buildingBuilt} from './homebase-build.mjs';
import {fishPose} from './fishing.mjs';
import {BLUEPRINTS} from './crafting-config.mjs';
import {planTool} from './blueprint.mjs';
import {sunnyHeight} from './sunny-area.mjs';
import {vacuumContains,vacuumBounds} from './vacuums.mjs';
import {resourceAvailable} from './resource-world.mjs';
import {capacityFor,suctionCount,reservedBagSlots} from './inventory.mjs';
import {rootContactPoint,edgeContactPoint} from './root-contact.mjs';
export function automaticHasWork(s,mode){
 const key=mode.profileKey+':'+Math.round(s.player.x*10)+':'+Math.round(s.player.z*10)+':'+Math.round(s.player.angle*10);
 if(s.autoProbe?.key===key&&s.time-s.autoProbe.at<.08)return s.autoProbe.work;
 const p=s.player,contains=o=>vacuumContains(p,o,mode),room=suctionCount(s)+reservedBagSlots(s)<capacityFor(mode);
 let work=s.obstacles.some(o=>!o.cleared&&o.tool===mode.id&&(o.depth??0)<=(mode.digDepth??0)&&(o.size??1)<=(mode.obstacleSize??1)&&(o.route||room)&&contains(o.route&&o.tool==='ground'?rootContactPoint(o,p):o.route&&o.tool==='fan'&&o.gateRadius?edgeContactPoint(o,p):o));
 if(!work&&room)work=s.resources.some(r=>r.status==='pulling'||r.status==='ground'&&resourceAvailable(s,r)&&(!mode.filter||s.filters[r.kind]!==false)&&(!r.focusOnly||mode.id==='focus')&&(!r.hanging||mode.id==='focus'&&(mode.heightRank??0)>=(r.heightRank??1))&&contains(r));
 if(!work&&room&&(!mode.filter||s.filters.leaf!==false)){const b=vacuumBounds(p,mode);for(let x=Math.floor(b.minX/2.5);x<=Math.floor(b.maxX/2.5)&&!work;x++)for(let z=Math.floor(b.minZ/2.5);z<=Math.floor(b.maxZ/2.5)&&!work;z++)work=(s.leafIndex?.cells.get(x+','+z)??[]).some(l=>l.status==='ground'&&contains(l));}
 if(!work&&room&&mode.id==='focus')work=(s.fishing?.encounters??[]).some(e=>e.status==='jumping'&&contains(fishPose(e)));
 if(!work)work=BLUEPRINTS.some(b=>!s.crafting?.blueprints?.[b.id]&&planTool(b,mode)&&(b.depth??0)<=(mode.digDepth??0)&&contains({...b,y:sunnyHeight(b.x,b.z)+(b.height??.12)}));
 if(!work)work=Boolean(s.pullingLeaves?.length)||room&&buildingBuilt(s,'nursery')&&s.forestBlobs?.wild.some(b=>b.status==='wild'&&!b.hiding&&contains(b))||false;
 s.autoProbe={key,at:s.time,work};return work;
}
