import {portalSpotValid} from './portal-blob.mjs';
import {startSpecial,SPECIAL_RULES,rank} from './special-blobs.mjs';
import {resourceArea} from './blob-workers.mjs';
import {onLava} from './volcano-area.mjs';
import {volcanoRegion} from './volcano-area.mjs';
import {iceRegion} from './ice-area.mjs';
import {buildingAccessible} from './building-access.mjs';
import {HOME_ROOM,HOME_ROOMS,HOME_FITTINGS,homeRegion,inHome,homeCollision,homeRectFits,HOME_LAYOUT} from './home-space.mjs';
import {MARKET,syncMarket} from './market.mjs';
import {BUILDING_SPECS,WORKSHOPS,FURNITURE,placeableSpec,placeableType} from './crafting-config.mjs';
import {coastPool,coastGap,coastShore} from './coast-area.mjs';
import {serviceZone,pickupZone,SUNNY,sunnyHeight,sunnyInside,sunnyGapAt,sunnyCollision,workshopPose,stationBounds,ancientTreeRadius} from './sunny-area.mjs';
import {woodlandStream} from './woodland-regions.mjs';

// Shared placement contract for workshops and, later, crafted furniture.
// Building ownership and recipes remain with their own systems.
export const PLACEABLES=BUILDING_SPECS;
const BLOB_SPOT={w:1.6,d:1.6,height:1.2};
const isBlobSpot=id=>String(id).startsWith('blobspot:');
const spotOf=(s,id)=>{const [,blob,slot]=String(id).split(':');return {blob:s.forestBlobs?.roster.find(b=>b.id===blob),slot:slot===undefined?null:Number(slot)};};
// Standort des Häufchenblobs: frei auf dem Boden eines schon besuchten Gebiets.
function blobSpotStatus(s,x,z){const h=sunnyHeight(x,z);if(!sunnyInside(x,z)||sunnyGapAt(x,z)||onLava(x,z,.4)||coastPool(x,z)||coastGap(x,z)||!s.forestBlobs.unlocked.includes(resourceArea(x,z))||sunnyCollision(x,h,z,.4))return {valid:false,reason:'ground'};return {valid:true,y:h};}
export function placeBlobSpot(s,id,pose){const {blob,slot}=spotOf(s,id);if(blob?.job?.type==='portal'){if(!blobSpotStatus(s,pose.x,pose.z).valid||!portalSpotValid(s,blob,slot,pose.x,pose.z))return false;blob.job.points[slot]={x:pose.x,z:pose.z};s.forestBlobs.revision++;if(!blob.active&&blob.job.points.length>=2)startSpecial(s,blob.id);return true;}if(!blob?.job||blob.job.type!=='pile'||!blobSpotStatus(s,pose.x,pose.z).valid)return false;Object.assign(blob.job,{x:pose.x,z:pose.z,held:[],target:null,returning:false,piles:[],lastKind:null,scanAt:0});/* Jakob 7.11.: am neuen Ort frisch anfangen */if(blob.work)blob.work.path=[];s.forestBlobs.revision++;if(!blob.active)startSpecial(s,blob.id);return true;}
export function placementBounds(id,pose){const spec=isBlobSpot(id)?BLOB_SPOT:PLACEABLES[id]??placeableSpec(id);if(!spec||!pose)return null;if(spec.wall&&homeRegion(pose.x,pose.z,2))pose=snapToWall(pose);const rotation=((pose.rotation??0)%(Math.PI*2)+Math.PI*2)%(Math.PI*2),c=Math.abs(Math.cos(rotation)),s=Math.abs(Math.sin(rotation));return {...pose,rotation,height:spec.height??3,localW:spec.w,localD:spec.d,w:c*spec.w+s*spec.d,d:s*spec.w+c*spec.d};}
export function placementOverlap(a,b,margin=0){const axes=[a.rotation,b.rotation].flatMap(r=>[[Math.cos(r),-Math.sin(r)],[Math.sin(r),Math.cos(r)]]);for(const [x,z]of axes){const projection=p=>Math.abs(x*Math.cos(p.rotation)-z*Math.sin(p.rotation))*p.localW/2+Math.abs(x*Math.sin(p.rotation)+z*Math.cos(p.rotation))*p.localD/2;if(Math.abs((a.x-b.x)*x+(a.z-b.z)*z)>=projection(a)+projection(b)+margin)return false;}return true;}
function homePlacementStatus(s,id,b){
 const spec=placeableSpec(id);if(!FURNITURE[placeableType(id)]||spec.height>HOME_ROOM.wall-.1)return {valid:false,reason:'interior'};
 if(spec.outdoor)return {valid:false,reason:'interior'};
 if(spec.wall){for(const [other,p]of Object.entries(s.placements??{})){if(other===id||!placeableSpec(other)?.wall)continue;if(Math.abs(p.x-b.x)<1.6&&Math.abs(p.z-b.z)<.5)return {valid:false,reason:'occupied'};}return {valid:true,y:HOME_ROOM.floor};}
 if(!homeRectFits(b.x,b.z,b.w,b.d))return {valid:false,reason:'wall'};
 const virtualCharger=!String(id).startsWith('charger_')&&!Object.keys(s.placements??{}).some(k=>k.startsWith('charger_'))&&(!s.intro||s.builtSites?.introVacuum)&&!(s.crafting?.loose?.charger>0);
 for(const f of HOME_FITTINGS.filter(f=>!['bed','desk','shelf'].includes(f.id)&&(f.id!=='charger'||virtualCharger)))if(Math.abs(b.x-HOME_ROOM.x-f.x)<(b.w+f.w)/2+.2&&Math.abs(b.z-HOME_ROOM.z-f.z)<(b.d+f.d)/2+.2)return {valid:false,reason:'fitting'};
 if(Math.abs(b.x-HOME_ROOM.x)<b.w/2+1.15&&b.z+b.d/2>HOME_ROOM.z+2.8)return {valid:false,reason:'door'};
 if(Math.abs(s.player.x-b.x)<b.w/2+.45&&Math.abs(s.player.z-b.z)<b.d/2+.45)return {valid:false,reason:'player'};
 for(const [other,p]of Object.entries(s.placements??{})){if(other===id)continue;const f=placementBounds(other,p),otherSpec=placeableSpec(other);if(!f||spec.floor||otherSpec?.floor||otherSpec?.wall)continue;if(placementOverlap(b,f,.2))return {valid:false,reason:'occupied'};}
 if(spec.station){const preview={...s,placements:{...s.placements,[id]:b}};if([serviceZone(preview,id),pickupZone(preview,id)].some(p=>homeCollision(p.x,p.z,.32)||Object.entries(s.placements??{}).some(([other,q])=>{if(other===id)return false;const f=placementBounds(other,q);if(!f||placeableSpec(other)?.floor)return false;const dx=p.x-q.x,dz=p.z-q.z;return Math.abs(Math.cos(f.rotation)*dx-Math.sin(f.rotation)*dz)<f.localW/2+.32&&Math.abs(Math.sin(f.rotation)*dx+Math.cos(f.rotation)*dz)<f.localD/2+.32;})))return {valid:false,reason:'access'};}return {valid:true,y:HOME_ROOM.floor};
}
// Wandbilder rasten an der Rückwand des Zimmers ein, im Hauptzimmer neben den Fenstern; die Seitenwände sieht man von der Kamera aus kaum.
function snapToWall(pose){const lx=pose.x-HOME_ROOM.x,lz=pose.z-HOME_ROOM.z,room=HOME_ROOMS.find(r=>r.level<=HOME_LAYOUT.level&&lx>=r.x0&&lx<=r.x1&&lz>=r.z0-1&&lz<=r.z1+1)??HOME_ROOMS[0];const clamp=(a,b)=>Math.max(a,Math.min(b,lx)),free=room===HOME_ROOMS[0]?[clamp(-5.1,-4.3),-.65,clamp(3,5.1)].sort((a,b)=>Math.abs(a-lx)-Math.abs(b-lx))[0]:clamp(room.x0+.9,room.x1-.9);return {...pose,x:HOME_ROOM.x+free,z:HOME_ROOM.z+room.z0+.24,rotation:0};}
export function placementStatus(s,id,pose,opts){if(id!=='market')return placementCheck(s,id,pose,opts);const old={x:MARKET.x,z:MARKET.z};MARKET.x=1e5;MARKET.z=1e5;try{return placementCheck(s,id,pose,opts);}finally{Object.assign(MARKET,old);}}
function placementCheck(s,id,pose,{restoring=false}={}){if(isBlobSpot(id)){if(!Number.isFinite(pose?.x))return {valid:false,reason:'invalid'};const ground=blobSpotStatus(s,pose.x,pose.z),{blob,slot}=spotOf(s,id);if(ground.valid&&blob?.job?.type==='portal'&&!portalSpotValid(s,blob,slot,pose.x,pose.z))return {valid:false,reason:'portal'};return ground;}
 const b=placementBounds(id,pose);if(!b||![b.x,b.z,b.rotation].every(Number.isFinite))return {valid:false,reason:'invalid'};if(placeableSpec(id)?.wall&&!homeRegion(b.x,b.z,2))return {valid:false,reason:'interior'};
 if(s.area!=='sunny'||s.testWorld.enabled)return {valid:false,reason:'area'};
 if(!s.placements?.[id]&&Object.keys(s.placements??{}).length>=128)return {valid:false,reason:'capacity'};
 if(homeRegion(b.x,b.z,2))return homePlacementStatus(s,id,b);if(inHome(s)&&homeRegion(s.player.x,s.player.z)&&!FURNITURE[placeableType(id)])return {valid:false,reason:'interior'};
 if((WORKSHOPS[id]||PLACEABLES[id])&&Math.hypot(b.x/33,b.z/(b.z>0?34.5:23))>.88)return {valid:false,reason:'homebase'};if(!s.placements?.[id]&&Object.keys(s.placements??{}).length>=128)return {valid:false,reason:'capacity'};const heights=[];
 for(let ix=-1;ix<=1;ix+=.5)for(let iz=-1;iz<=1;iz+=.5){const lx=ix*(b.localW/2+.22),lz=iz*(b.localD/2+.22),x=b.x+Math.cos(b.rotation)*lx+Math.sin(b.rotation)*lz,z=b.z-Math.sin(b.rotation)*lx+Math.cos(b.rotation)*lz,h=sunnyHeight(x,z),stream=woodlandStream(x,z);if(coastPool(x,z)||coastGap(x,z)||x>coastShore(z)-1||!sunnyInside(x,z)||(FURNITURE[placeableType(id)]?onLava(x,z,.5):(iceRegion(x,z,1)||volcanoRegion(x,z,1)))||sunnyGapAt(x,z)||ancientTreeRadius(x,z)<7||(stream&&stream.distance<stream.width+.5))return {valid:false,reason:'ground'};if(sunnyCollision(x,h,z,.3))return {valid:false,reason:'obstacle'};heights.push(h);}
 if(Math.max(...heights)-Math.min(...heights)>.45)return {valid:false,reason:'slope'};
 for(const f of [SUNNY.home,SUNNY.storage,...(id!=='nursery'&&s.placements?.nursery?[stationBounds(s)]:[]),MARKET])if(!(FURNITURE[placeableType(id)]&&f===SUNNY.home&&Math.abs(b.x-f.x)+b.w/2<f.w/2-.3&&Math.abs(b.z-f.z)+b.d/2<f.d/2-.3)&&Math.abs(b.x-f.x)<(b.w+f.w)/2+1.2&&Math.abs(b.z-f.z)<(b.d+f.d)/2+1.6)return {valid:false,reason:'building'};
 for(const p of [SUNNY.drop,...SUNNY.anchors,...Object.values(SUNNY.interactions).filter(p=>p!==SUNNY.interactions.press&&p!==SUNNY.interactions.blobStation),...SUNNY.routeObstacles.map(o=>({x:o.gateX,z:o.gateZ}))])if(Math.abs(b.x-p.x)<b.w/2+1.1&&Math.abs(b.z-p.z)<b.d/2+1.1)return {valid:false,reason:'access'};
 if(Math.abs(s.player.x-b.x)<b.w/2+.45&&Math.abs(s.player.z-b.z)<b.d/2+.45)return {valid:false,reason:'player'};
 for(const [other,p]of Object.entries(s.placements??{})){if(other===id)continue;const f=placementBounds(other,p);if(f&&placementOverlap(b,f,.4))return {valid:false,reason:'occupied'};}
 if(id==='market'){const x=b.x+Math.sin(b.rotation)*2.5,z=b.z+Math.cos(b.rotation)*2.5;if(!sunnyInside(x,z)||sunnyCollision(x,sunnyHeight(x,z),z,.4))return {valid:false,reason:'access'};}else if(!restoring&&(PLACEABLES[id]||WORKSHOPS[id])&&!buildingAccessible(s,id,b))return {valid:false,reason:'unreachable'};
 return {valid:true,y:sunnyHeight(b.x,b.z)};
}
export function commitPlacement(s,id,pose){if(isBlobSpot(id))return placeBlobSpot(s,id,pose);if(!placementStatus(s,id,pose).valid)return false;const b=placementBounds(id,pose);if(PLACEABLES[id]&&id!=='market'&&s.buildings?.[id]!==true)return false;if(WORKSHOPS[id]&&!s.crafting?.workshops[id]?.owned)return false;if(FURNITURE[placeableType(id)]&&!s.placements?.[id]){const c=s.crafting;if(!(c?.loose[placeableType(id)]>0))return false;c.loose[placeableType(id)]--;}s.placements??={};s.placements[id]={x:b.x,z:b.z,rotation:b.rotation};if(id==='market')syncMarket(s);s.layoutRevision=(s.layoutRevision??0)+1;for(const blob of s.forestBlobs?.roster??[])if(blob.work){blob.work.path=[];blob.work.target=null;blob.work.retryAt=0;}return true;}
// Beim Laden ist die Ausbaustufe des Hauses evtl. noch nicht gesetzt; Möbel in Anbau-Räumen gelten deshalb als passend
// (sie konnten nur nach dem Kauf dort aufgestellt werden).
export function restorePlacements(s,data){const level=HOME_LAYOUT.level;HOME_LAYOUT.level=2;try{restorePlacementList(s,data);}finally{HOME_LAYOUT.level=level;}syncMarket(s);}
function restorePlacementList(s,data){s.placements={};s.layoutRevision=(s.layoutRevision??0)+1;for(const id of Object.keys(data??{}).filter(id=>id==='press'||id==='nursery'||id==='market'||WORKSHOPS[id]||/^[a-z]+_[1-9][0-9]{0,5}$/.test(id)&&FURNITURE[placeableType(id)]).slice(0,130)){const p=data?.[id];if(!p)continue;const old=s.player;s.player={x:1e6,z:1e6};try{if(placementStatus(s,id,p,{restoring:true}).valid){const b=placementBounds(id,p);s.placements[id]={x:b.x,z:b.z,rotation:b.rotation};}else if(FURNITURE[placeableType(id)]&&s.crafting)s.crafting.loose[placeableType(id)]=(s.crafting.loose[placeableType(id)]??0)+1;}finally{s.player=old;}}}
export function interactionAt(s,id){if(id!=='press')return SUNNY.interactions[id];return serviceZone(s,id);}

