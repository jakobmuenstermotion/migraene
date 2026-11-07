import {caveRegion,caveFloorAt} from './cave-space.mjs';
import {nurseryRegion,nurseryFloorAt} from './nursery-space.mjs';
import {inHome,homeRegion,homeFloorAt} from './home-space.mjs';
import {SAUGER as C} from './sauger-config.mjs';
import {sunnyHeight,sunnyInside,sunnyCollision,sunnyGapAt,sunnyRouteCollision,SUNNY} from './sunny-area.mjs';
export function createTestWorld(){return {enabled:false,platforms:[{x:21,z:-4.6,w:4,d:3,height:1},{x:23.5,z:4.8,w:3,d:3,height:2}],anchors:[{id:'a1',x:16,z:0,y:0,rank:1},{id:'a2',x:19,z:2,y:0,rank:2},{id:'a3',x:21,z:-4.6,y:1,rank:3},{id:'a4',x:23.5,z:4.8,y:2,rank:4}],deposit:{x:18,z:-2.8,y:0,units:C.test.depositUnits,max:C.test.depositUnits,budget:0},blocks:[{id:'b1',x:17,z:4,size:1,health:2},{id:'b2',x:19,z:4,size:2,health:4},{id:'b3',x:21,z:1,size:3,health:6}],movables:[{id:'m1',x:10,z:-3,weight:1},{id:'m2',x:11,z:-5,weight:2},{id:'m3',x:17,z:6,weight:3}],switch:{x:23,z:0,y:.6,on:false},breakable:{x:21,z:-1,y:.6,health:3},targetAnchor:null};}
export function groundAt(s,x,z){const w=s.testWorld;if(!w.enabled&&s.area==='sunny'&&caveRegion(x,z,1))return caveFloorAt(x,z);if(!w.enabled&&s.area==='sunny'&&homeRegion(x,z,1))return homeFloorAt(x,z);if(!w.enabled&&s.area==='sunny'&&nurseryRegion(x,z,1))return nurseryFloorAt(s,x,z);if(!w.enabled)return s.area==='sunny'?(sunnyInside(x,z)&&!sunnyGapAt(x,z)?sunnyHeight(x,z):null):0;if(x>=8&&x<=25&&Math.abs(z)<=7){if(x>13&&x<15)return null;for(const p of w.platforms)if(Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2)return p.height;return 0;}return Math.hypot(x/11.4,z/8.6)<=1.03?0:null;}
export function collides(s,x,y,z,radius=.35,ignore=null){
 if(!s.testWorld.enabled){if(s.area!=='sunny')return false;const h=groundAt(s,x,z);return sunnyCollision(x,y,z,radius)||sunnyRouteCollision(s,x,y,z,radius)||(h!==null&&y<h-.05);}
 for(const o of [...s.testWorld.blocks.filter(b=>b.health>0),...s.testWorld.movables]){if(o===ignore)continue;const r=o.size?o.size*.25+.35:.5;if(Math.hypot(o.x-x,o.z-z)<r+radius&&y<(o.size??1)*.6)return true;}
 const rock=s.testWorld.deposit;if(rock.units>1&&Math.hypot(rock.x-x,rock.z-z)<1.15+radius&&y<1.8)return true;
 const ground=groundAt(s,x,z);return ground!==null&&y<ground-.05;
}
export function walkable(s,x,z,fromY=0){const h=groundAt(s,x,z);return h!==null&&h<=fromY+.35&&!collides(s,x,h,z);}
export function spawnTestMaterials(s,near=false){
 const p=near?s.player:{x:17,z:0},kinds=Object.keys(C.material);s.resources=[];
 for(let i=0;i<48;i++){const a=i*2.399,r=.8+(i%8)*.32,kind=kinds[i%4],y=kind==='fruit'?[1.5,2.8,4.4][i%3]:.08,x=p.x+Math.sin(a)*r,z=p.z+Math.cos(a)*r,h=groundAt(s,x,z);if(h===null)continue;s.resources.push({id:i,kind,x,y:y+h,z,homeX:x,homeY:y+h,homeZ:z,status:'ground',progress:0,respawnAt:0});}
}
export function enterTestWorld(s){if(s.area==='sunny'&&!s.testWorld.enabled)s.sunnyResources=s.resources;if(s.home)s.home.interior=false;s.testWorld.enabled=true;Object.assign(s.player,{x:12.2,z:0,y:0,angle:Math.PI/2});s.flight.safe={x:12.2,z:0,y:0};s.testWorld.targetAnchor=null;spawnTestMaterials(s);s.testBlob={x:18,z:1,y:.45,status:'wild',slowUntil:0,stunUntil:0};}
export function leaveTestWorld(s){if(s.home)s.home.interior=false;s.testWorld.enabled=false;s.anchorPull=null;s.testWorld.targetAnchor=null;s.flight.active=false;Object.assign(s.player,{x:0,z:4.3,y:0,angle:Math.PI});s.flight.safe={x:0,z:4.3,y:0};if(s.area==='sunny'){s.resources=s.sunnyResources;Object.assign(s.player,SUNNY.spawn,{y:sunnyHeight(SUNNY.spawn.x,SUNNY.spawn.z)});s.flight.safe={x:s.player.x,y:s.player.y,z:s.player.z};}}


