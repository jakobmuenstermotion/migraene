import * as T from './vendor/three.module.js';
import {SUNNY,sunnyHeight,sunnyInside,sunnyGapAt,sunnyCollision,pathDistance,facilityFootprint} from './sunny-area.mjs';
import {FALLEN_LOGS} from './tree-profiles.mjs';
import {lakeRadius} from './lake-area.mjs';
import {WOODLANDS,woodlandPathDistance,woodlandAt} from './woodland-regions.mjs';
import {coastRegion,coastShore,windLower,windUpper} from './coast-area.mjs';
import {iceRegion,icePondRadius} from './ice-area.mjs';
import {volcanoRegion} from './volcano-area.mjs';
import {ScenicBatch} from './scenic-geometry.mjs';
// Herumliegende Stämme und Steine (Jakob 31.10.): der Kraftsauger baut sie über das Vorkommen-System ab, sie wachsen langsam
// nach. Mengen und Zeiten sind Testwerte. Große Felsen mit Kollision bleiben stehen.
const REGEN=45;
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
let cache=null;
export function sceneryList(){if(cache)return cache;const out=[],used=[],add=(look,kind,x,z,size,angle,max)=>{const id='scene_'+look+'_'+out.length;out.push({id,scenery:true,look,kind,x,z,y:sunnyHeight(x,z),size,angle,r:Math.max(.45,size*.8),max,regen:REGEN});used.push([x,z]);},free=(x,z,gap=1.6)=>used.every(([a,b])=>Math.hypot(a-x,b-z)>gap)&&!sunnyCollision(x,sunnyHeight(x,z),z,.5),rock=(look,kind,x,z,size,angle)=>add(look,kind,x,z,size,angle,Math.round(size*5)+1);
 // Lichtung und Waldgebiete
 for(const log of FALLEN_LOGS)add('log','wood',log.x,log.z,1,log.angle,12);
 for(const [x,z]of [[-10,6],[10,-2],[-21,2],[19,11],[-8,17]])if(sunnyInside(x,z)&&free(x,z,.5))add('stump','wood',x,z,1,x,6);
 for(const [x,z,a]of [[-14,7,.7],[14,4,-.5],[-18,-9,1.2]])if(sunnyInside(x,z)&&free(x,z,.5))add('thin','wood',x,z,.62,a,4);
 let r=seeded(7213);for(let i=0;i<70;i++){const a=r()*Math.PI*2,x=Math.cos(a)*(15+r()*28),z=Math.sin(a)*(12+r()*23),size=.35+r()*.55,turn=r()*6;if(lakeRadius(x,z)<1.22||pathDistance(x,z)<1.8||sunnyGapAt(x,z)||facilityFootprint(x,z,1)||!sunnyInside(x,z)||coastRegion(x,z,1)||woodlandAt(x,z)||!free(x,z))continue;rock('moss','stone',x,z,size,turn);}
 for(const w of WOODLANDS)for(let i=0;i<80;i+=4){const a=i*2.399,d=.25+(i%11)*.065,x=w.x+Math.cos(a)*w.rx*d,z=w.z+Math.sin(a)*w.rz*d;if(coastRegion(x,z,1)||iceRegion(x,z,1)||volcanoRegion(x,z,1)||woodlandPathDistance(x,z)<1.7||!free(x,z,.8))continue;rock('moss','stone',x,z,.5+(i%5)*.22,a);}
 r=seeded(5119);for(const w of WOODLANDS){let n=0;for(let t=0;t<60&&n<3;t++){const a=r()*Math.PI*2,d=.3+r()*.5,x=w.x+Math.cos(a)*w.rx*d,z=w.z+Math.sin(a)*w.rz*d;if(coastRegion(x,z,1)||iceRegion(x,z,1)||volcanoRegion(x,z,1)||woodlandPathDistance(x,z)<2.4||!free(x,z,2.5))continue;add('log','wood',x,z,.85,r()*6,10);n++;}}
 // Küste: nur Steine, Treibholz bleibt selten
 r=seeded(3307);for(let t=0,n=0;t<500&&n<18;t++){const x=48+r()*44,z=-34+r()*68;if(!coastRegion(x,z)||x>coastShore(z)-1.5||windLower(x,z)||windUpper(x,z)||sunnyHeight(x,z)<-3.4||!free(x,z,2.2))continue;rock('coast','stone',x,z,.4+r()*.5,r()*6);n++;}
 // Eistal
 r=seeded(9127);for(let t=0,rocks=0,logs=0;t<1500&&(rocks<16||logs<8);t++){const x=8+r()*64,z=-105+r()*78;if(!iceRegion(x,z)||icePondRadius(x,z)<1.15||!free(x,z,2.4))continue;if(rocks<16){rock('snow','stone',x,z,.45+r()*.55,r()*6);rocks++;}else{add('frostlog','frostwood',x,z,.8,r()*6,8);logs++;}}
 // Vulkan
 r=seeded(6421);for(let t=0,rocks=0,logs=0;t<1500&&(rocks<14||logs<6);t++){const x=-88+r()*74,z=18+r()*82;if(!volcanoRegion(x,z)||!free(x,z,2.4))continue;if(rocks<14){rock('ash','clay',x,z,.45+r()*.55,r()*6);rocks++;}else{add('charlog','wood',x,z,.8,r()*6,8);logs++;}}
 return cache=out;}
export const createSceneryDeposits=()=>sceneryList().map(d=>({...d,units:d.max,budget:0}));
function looks(){const rock=new T.DodecahedronGeometry(1,0),cyl=new T.CylinderGeometry(1,1,1,9),disc=new T.CircleGeometry(1,14),blob=new T.SphereGeometry(1,7,5),mk=fn=>{const b=new ScenicBatch();fn(b);const holder=new T.Group(),geometry=b.finish(holder).geometry;return geometry;},stone=(color,cap,capH=.2)=>mk(b=>{b.add(rock,color,0,.42,0,1,.72,.86,.1,.3,.1);b.add(rock,color,.62,.16,.34,.42,.3,.36,.2,1.4,0);if(cap)b.add(blob,cap,-.05,.86,.02,.72,capH,.62);}),trunk=(bark,end,moss)=>mk(b=>{b.add(cyl,bark,0,.33,0,.34,2.8,.34,0,0,Math.PI/2);for(const side of [-1,1])b.add(disc,end,side*1.405,.33,0,.31,.31,1,0,side*Math.PI/2,0);if(moss)for(let i=0;i<4;i++)b.add(blob,moss,i*.5-.75,.62,.08,.32,.09,.2);});
 const out={moss:stone('#98a297','#688f4d'),coast:stone('#8f99a3','#6f9a3a',.12),snow:stone('#6e788b','#f4f8fc',.26),ash:stone('#5f5049',null),log:trunk('#8b6948','#c5a477','#70935a'),frostlog:trunk('#6f6a6a','#d4d8dc','#f2f6fa'),charlog:trunk('#352b28','#7a3a22',null),thin:trunk('#927352','#b79a6b',null),stump:mk(b=>{b.add(cyl,'#846547',0,.22,0,.38,.44,.4);b.add(disc,'#c5a477',0,.448,0,.34,.34,1,-Math.PI/2);for(let j=0;j<4;j++){const a=j*1.6;b.add(rock,'#796447',Math.sin(a)*.32,.05,Math.cos(a)*.32,.24,.08,.16,0,a,0);}})};
 for(const g of [rock,cyl,disc,blob])g.dispose();return out;}
export class SceneryView{
 constructor(scene){this.root=new T.Group();scene.add(this.root);const list=sceneryList(),geos=looks(),material=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.92});this.meshes=new Map();this.slots=new Map();this.dummy=new T.Object3D();this.tint=new T.Color();const counts={};for(const d of list)counts[d.look]=(counts[d.look]??0)+1;for(const [look,n]of Object.entries(counts)){const mesh=new T.InstancedMesh(geos[look],material,n);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.count=n;this.root.add(mesh);this.meshes.set(look,{mesh,used:0});}
  for(const d of list){const e=this.meshes.get(d.look),slot=e.used++;this.slots.set(d.id,{mesh:e.mesh,slot,d});const v=.88+.2*((d.x*7.13+d.z*3.7)%1+1)%1*.5;e.mesh.setColorAt(slot,this.tint.setRGB(v,v,v));this.pose(e.mesh,slot,d,1,0);}for(const {mesh}of this.meshes.values()){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}this.key='';this.beams=new T.InstancedMesh(new T.CylinderGeometry(.22,.34,6,10,1,true),new T.MeshBasicMaterial({color:'#ffe9a0',transparent:true,opacity:.13,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}),12);this.beams.count=0;this.beams.frustumCulled=false;this.root.add(this.beams);}
 pose(mesh,slot,d,scale,shake){const size=d.size*scale;this.dummy.position.set(d.x+shake,d.y-.02,d.z+shake*.6);this.dummy.rotation.set(0,d.angle,0);this.dummy.scale.setScalar(size);if(scale<=0)this.dummy.scale.setScalar(0);this.dummy.updateMatrix();mesh.setMatrixAt(slot,this.dummy.matrix);}
 update(s){this.root.visible=!s.testWorld?.enabled;{const list=s.resources.filter(r=>r.eventItem&&r.status==='ground').slice(0,12);for(let i=0;i<list.length;i++){const r=list[i],q=.75+.25*Math.sin(s.time*3+i);this.dummy.position.set(r.x,r.y+3,r.z);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(q,1,q);this.dummy.updateMatrix();this.beams.setMatrixAt(i,this.dummy.matrix);}this.beams.count=list.length;this.beams.instanceMatrix.needsUpdate=true;}const list=s.iceDeposits;if(!list)return;const mined=s.miningDeposit;let key=mined??'';for(const d of list)if(d.scenery&&d.units<d.max)key+=d.id+Math.round(d.units*4);if(key===this.key&&!mined)return;this.key=key;for(const d of list){if(!d.scenery)continue;const e=this.slots.get(d.id);if(!e)continue;const f=d.units/d.max,scale=d.units<1?0:.35+.65*f,shake=d.id===mined?Math.sin(s.time*57)*.03:0;this.pose(e.mesh,e.slot,e.d,scale,shake);}for(const {mesh}of this.meshes.values())mesh.instanceMatrix.needsUpdate=true;}
}
