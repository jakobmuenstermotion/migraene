export const CAVE_ROOM={x:-225,z:-120,w:26,d:20,floor:0,zoom:1.1};
// Vulkankern (Endgame, Jakob 6.11.): zweiter Innenraum im selben Innenraum-System wie die Höhle, s.cave.room==='core'.
export const CORE_ROOM={x:-225,z:-40,w:40,d:34,floor:0,zoom:.3};
// Eisgrotte (Jakob 7.11.): kleine Grotte hoch in der Gipfelwand des Eistals, nur per Anker IV, s.cave.room==='ice'.
export const ICE_ROOM={x:-225,z:-200,w:14,d:12,floor:0,zoom:1.15};
export const ROOMS=[CAVE_ROOM,CORE_ROOM,ICE_ROOM];
export const roomOf=s=>s?.cave?.room==='core'?CORE_ROOM:s?.cave?.room==='ice'?ICE_ROOM:CAVE_ROOM;
export function inCave(s){return s.area==='sunny'&&!s.testWorld.enabled&&s.cave?.interior===true;}
export function caveRegion(x,z,margin=0){return ROOMS.some(R=>Math.abs(x-R.x)<R.w/2+margin&&Math.abs(z-R.z)<R.d/2+margin);}
const roomAt=(x,z)=>ROOMS.find(R=>Math.abs(x-R.x)<R.w/2+2&&Math.abs(z-R.z)<R.d/2+2)??CAVE_ROOM;
export function caveFloorAt(x,z){const R=roomAt(x,z),dx=x-R.x,dz=z-R.z;return Math.abs(dx)<R.w/2&&dz> -R.d/2&&(dz<R.d/2||Math.abs(dx)<1.4&&dz<R.d/2+1)?R.floor:null;}
export function caveCollision(x,z,r=.35){const R=roomAt(x,z),dx=x-R.x,dz=z-R.z;return Math.abs(dx)>R.w/2-r||dz< -R.d/2+r||dz>R.d/2-r&&Math.abs(dx)>1.5-r;}
