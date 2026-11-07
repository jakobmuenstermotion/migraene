import {sunnyHeight,sunnyCollision,stationDoor} from './sunny-area.mjs';
import {SPECIAL_RULES,rank} from './special-blobs.mjs';
import {blobPath} from './blob-navigation.mjs';
// Portalblob (Jakob 1.11., Testwerte in SPECIAL_RULES.portal): verbindet zwei, riesig drei Punkte. Durch welchen Ring man läuft, dort kommt man heraus.
export const PORTAL={open:4.6,free:2.4,depth:.42,single:1,pair:2.05,shrink:.3,grow:.3};
export const portalLimit=b=>SPECIAL_RULES.portal.points[rank(b)];
export const portalRange=b=>SPECIAL_RULES.portal.range[rank(b)];
export const portalCooldown=b=>SPECIAL_RULES.portal.cooldown[rank(b)];
export const portalBlobs=s=>(s.forestBlobs?.roster??[]).filter(b=>b.active&&b.job?.type==='portal'&&b.job.points?.length>=2);
// Ziele eines Punkts, in fester Reihenfolge: das erste ist der linke Ring, das zweite der rechte.
export const portalDests=(b,index)=>b.job.points.filter((_,i)=>i!==index);
export const portalReady=(s,b)=>s.time>=(b.job.readyAt??0);
const ROUTES=new Map();
// Nur dort, wo man wirklich hinlaufen kann: Sperren lassen sich nicht überspringen. Je 1,7-m-Zelle einmal gerechnet.
function reachable(s,x,z){const key=(s.layoutRevision??0)+':'+s.obstacles.filter(o=>o.route&&o.cleared).length+':'+Math.round(x/1.7)+','+Math.round(z/1.7);if(ROUTES.has(key))return ROUTES.get(key);if(ROUTES.size>400)ROUTES.clear();const ok=Boolean(blobPath(s,stationDoor(s),{x,z}));ROUTES.set(key,ok);return ok;}
export function portalSpotValid(s,b,slot,x,z){if(!b||!(slot>=0)||slot>=portalLimit(b)||slot>(b.job.points?.length??0))return false;const range=portalRange(b);if(b.job.points.some((p,i)=>i!==slot&&(Math.hypot(p.x-x,p.z-z)>range||Math.hypot(p.x-x,p.z-z)<6)))return false;return reachable(s,x,z);}
function exitSpot(p){const h=sunnyHeight(p.x,p.z);for(const [dx,dz]of [[0,1.9],[1.9,.8],[-1.9,.8],[0,-1.9],[0,1.2]]){const x=p.x+dx,z=p.z+dz,y=sunnyHeight(x,z);if(Math.abs(y-h)<1.2&&!sunnyCollision(x,y,z,.35))return {x,z,y};}return {x:p.x,z:p.z+.8,y:h};}
const indoors=s=>Boolean(s.home?.interior||s.nursery?.interior||s.cave?.interior);
export function updatePortals(s,dt){const p=s.player,jump=s.portalJump;if(jump){jump.t+=dt;if(!jump.moved&&jump.t>=PORTAL.shrink){jump.moved=true;Object.assign(p,jump.to);s.flight.safe={...p};s.portalLock={blob:jump.blob,index:jump.index};jump.owner.job.readyAt=s.time+portalCooldown(jump.owner);s.events?.push('lock');}if(!jump.moved){p.x=jump.from.x;p.z=jump.from.z;}else{p.x=jump.to.x;p.z=jump.to.z;}if(jump.t>=PORTAL.shrink+PORTAL.grow)s.portalJump=null;return;}
 if(indoors(s)||s.testWorld?.enabled||s.flight?.active||s.anchorPull||s.roundActive===false)return;const list=portalBlobs(s);if(s.portalLock){const b=list.find(o=>o.id===s.portalLock.blob),q=b?.job.points[s.portalLock.index];if(!q||Math.hypot(p.x-q.x,p.z-q.z)>PORTAL.free)s.portalLock=null;}if(!p.moving)return;
 for(const b of list){if(!portalReady(s,b))continue;for(let i=0;i<b.job.points.length;i++){if(s.portalLock?.blob===b.id&&s.portalLock.index===i)continue;const q=b.job.points[i],dx=p.x-q.x,dz=p.z-q.z,pair=b.job.points.length>2;if(Math.abs(dz)>PORTAL.depth||Math.abs(dx)>(pair?PORTAL.pair:PORTAL.single))continue;const dests=portalDests(b,i),dest=pair&&dx>0?dests[1]:dests[0];s.portalJump={t:0,from:{x:p.x,z:p.z},to:exitSpot(dest),blob:b.id,index:b.job.points.indexOf(dest),owner:b,moved:false};return;}}
}
export const portalJumpScale=s=>{const j=s.portalJump;if(!j)return 1;return j.t<PORTAL.shrink?Math.max(.02,1-j.t/PORTAL.shrink):Math.min(1,Math.max(.02,(j.t-PORTAL.shrink)/PORTAL.grow));};
