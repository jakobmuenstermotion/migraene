// Separate interior coordinates keep the cottage footprint and outdoor routes unchanged.
export const HOME_ROOM={x:-150,z:-120,w:12,d:10,floor:1,wall:2.8,zoom:1.42};
export const HOME_FITTINGS=[
 {id:'bed',x:-4,z:-2.7,w:2,d:2.9},
 {id:'desk',x:3.9,z:-3.8,w:2.5,d:1},
 {id:'shelf',x:-4.9,z:1.1,w:.65,d:2.7},
 {id:'computer',x:2.9,z:-3.7,w:1.15,d:.75},
 {id:'charger',x:4.8,z:1.3,w:1.2,d:1.1}
];
// Neugestaltung (Jakob 29.10.): Hausanbau. Stufe 1 öffnet nach Osten ein zweites Zimmer, Stufe 2 dahinter einen
// Wintergarten mit Glasdach. Koordinaten relativ zur Raummitte; Durchgänge in den Trennwänden.
export const HOME_ROOMS=[{id:'main',x0:-6,x1:6,z0:-5,z1:5,level:0},{id:'annex',x0:6,x1:14,z0:-5,z1:3,level:1},{id:'garden',x0:14,x1:22,z0:-5,z1:3,level:2,glass:true}];
export const HOME_DOORWAYS=[{x:6,z0:-.9,z1:.7,level:1},{x:14,z0:-.8,z1:.8,level:2}];
// Kollision und Boden kennen keinen Spielstand; die Simulation setzt die aktuelle Ausbaustufe hier.
export const HOME_LAYOUT={level:0};
export function setHomeLevel(s){HOME_LAYOUT.level=Math.max(0,Math.min(2,(s?.home?.expansion|0)));}
const activeRooms=()=>HOME_ROOMS.filter(r=>r.level<=HOME_LAYOUT.level);
export function inHome(s){return s.area==='sunny'&&!s.testWorld.enabled&&s.home?.interior===true;}
// Gesamter Innenraumbereich einschließlich späterer Anbauten (für Sichtbarkeit und Platzierungsraum).
export function homeRegion(x,z,margin=0){const dx=x-HOME_ROOM.x,dz=z-HOME_ROOM.z;return dx>=-HOME_ROOM.w/2-margin&&dx<=22+margin&&Math.abs(dz)<=HOME_ROOM.d/2+margin;}
export function homeRoomAt(x,z,inset=0){const dx=x-HOME_ROOM.x,dz=z-HOME_ROOM.z;return activeRooms().find(r=>dx>r.x0+inset&&dx<r.x1-inset&&dz>r.z0+inset&&dz<r.z1-inset)??null;}
export function homeFloorAt(x,z){const dx=x-HOME_ROOM.x,dz=z-HOME_ROOM.z;if(homeRoomAt(x,z,-.05))return HOME_ROOM.floor;return Math.abs(dx)<.9&&dz>0&&dz<HOME_ROOM.d/2+.9?HOME_ROOM.floor:null;}
const sMoveable=id=>['bed','desk','shelf','charger'].includes(id);
export function homeCollision(x,z,r=.35){const dx=x-HOME_ROOM.x,dz=z-HOME_ROOM.z;
 const inside=!!homeRoomAt(x,z,r),door=HOME_DOORWAYS.some(d=>d.level<=HOME_LAYOUT.level&&Math.abs(dx-d.x)<r+.3&&dz>d.z0+r*.4&&dz<d.z1-r*.4),front=Math.abs(dx)<1.05-r&&dz>0&&dz<HOME_ROOM.d/2+1;
 if(!inside&&!door&&!front)return true;
 return HOME_FITTINGS.filter(f=>!sMoveable(f.id)).some(f=>Math.abs(dx-f.x)<f.w/2+r&&Math.abs(dz-f.z)<f.d/2+r);}
// Möbel müssen vollständig in einem freigeschalteten Raum stehen.
export function homeRectFits(x,z,w,d,margin=.35){const dx=x-HOME_ROOM.x,dz=z-HOME_ROOM.z;return activeRooms().some(r=>dx-w/2>r.x0+margin&&dx+w/2<r.x1-margin&&dz-d/2>r.z0+margin&&dz+d/2<r.z1-margin);}
// Jakob 7.11.: Die Ladestation steht frei im Haus (charger-building.mjs chargerPos); pos = deren Ort.
export function homeCharger(s,exterior={x:-8.4,z:-13.95},pos=null){const f=HOME_FITTINGS.find(f=>f.id==='charger');return inHome(s)?pos??{x:HOME_ROOM.x+f.x,z:HOME_ROOM.z+f.z}:exterior;}
export function homeCameraZoom(s){return inHome(s)?HOME_ROOM.zoom:null;}

export function wardrobeNearby(s){return inHome(s)&&Object.entries(s.placements??{}).some(([id,p])=>id.startsWith('wardrobe_')&&Math.hypot(p.x-s.player.x,p.z-s.player.z)<2.5);}
