import * as T from './vendor/three.module.js';
import {WORKSHOPS,FURNITURE,workshopSpec,placeableType} from './crafting-config.mjs';
import {pickupZone,serviceZone,inServiceZone,sunnyHeight,workshopPose,SUNNY} from './sunny-area.mjs';
import {buildingBuilt} from './homebase-build.mjs';
import {homeRegion,inHome} from './home-space.mjs';
import {daylightAt} from './daylight.mjs';

export class WorkshopAtmosphere{
 constructor(scene){
  this.root=new T.Group();scene.add(this.root);this.markers=new Map();
  const shapePad=new T.Shape();shapePad.moveTo(-.72,-1.3);shapePad.lineTo(.72,-1.3);shapePad.quadraticCurveTo(.9,-1.3,.9,-1.1);shapePad.lineTo(.9,1.1);shapePad.quadraticCurveTo(.9,1.3,.7,1.3);shapePad.lineTo(-.7,1.3);shapePad.quadraticCurveTo(-.9,1.3,-.9,1.1);shapePad.lineTo(-.9,-1.1);shapePad.quadraticCurveTo(-.9,-1.3,-.72,-1.3);const ring=new T.ShapeGeometry(shapePad);
  for(const id of ['storage','market','press',...Object.keys(WORKSHOPS),...['storage','press',...Object.keys(WORKSHOPS).filter(id=>id!=='vacuumshop')].map(id=>id+':out')]){const m=new T.Mesh(ring,new T.MeshBasicMaterial({color:'#e6cc8c',transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;const shape=new T.Shape();shape.moveTo(-.12,.42);shape.lineTo(.12,.42);shape.lineTo(.12,0);shape.lineTo(.34,0);shape.lineTo(0,-.36);shape.lineTo(-.34,0);shape.lineTo(-.12,0);shape.closePath();const arrow=new T.Mesh(new T.ShapeGeometry(shape),m.material);arrow.position.z=.005;arrow.rotation.z=id.endsWith(':out')?0:Math.PI;m.add(arrow);this.root.add(m);this.markers.set(id,m);}
  this.lights=Array.from({length:4},()=>{const l=new T.PointLight('#ffd18a',0,8,2);l.castShadow=false;scene.add(l);return l;});
  const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);data.set([255,201,112,Math.round(Math.max(0,1-r)**2*170)],(y*32+x)*4);}
  const tex=new T.DataTexture(data,32,32);tex.magFilter=tex.minFilter=T.LinearFilter;tex.needsUpdate=true;this.glows=new T.InstancedMesh(new T.PlaneGeometry(6,6),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending}),128);/* Jakob 6.11.: ohne Tiefentest, sonst schneidet unebener Boden den flachen Lichtschein gerade ab (kantige Lichtkegel) */this.glows.frustumCulled=false;this.root.add(this.glows);this.dummy=new T.Object3D();
 }
 update(s){
  this.root.visible=!s.testWorld.enabled;const indoor=inHome(s),night=daylightAt(s.time+(s.daylightOffset??0)).night;
  for(const id of Object.keys(s.placements??{}))if(workshopSpec(id)?.indoor)for(const key of [id,id+':out'])if(!this.markers.has(key)){const m=this.markers.get('press').clone();m.material=m.material.clone();for(const a of m.children){a.material=m.material;a.rotation.z=key.endsWith(':out')?0:Math.PI;}this.root.add(m);this.markers.set(key,m);}for(const [id,m]of this.markers){const out=id.endsWith(':out'),owner=out?id.slice(0,-4):id,preview=s.placementPreview?.id===owner;m.visible=(workshopSpec(owner)?.indoor?homeRegion(s.placements?.[owner]?.x??0,s.placements?.[owner]?.z??0)===indoor:!indoor)&&!s.nursery?.interior&&(['storage','market'].includes(owner)||owner==='press'?(owner==='press'?buildingBuilt(s,'press')||preview:true):!!s.placements?.[owner]||preview);if(!m.visible)continue;const p=out?pickupZone(s,owner):serviceZone(s,owner),within=Math.hypot(s.player.x-p.x,s.player.z-p.z)<=p.radius;const pose=owner==='storage'?SUNNY.storage:owner==='market'?{rotation:0}:workshopPose(s,owner),a=pose.rotation??0;m.scale.set(p.radius/1.05,1,1);m.rotation.set(-Math.PI/2,0,a);m.position.set(p.x,sunnyHeight(p.x,p.z)+.045,p.z);m.material.color.set(within?'#c8e9a5':out?'#a9dadd':'#e7cc8b');m.material.opacity=within?.24:.09;}

  const layout=s.layoutRevision??0;
  if(this.layout!==layout||this.poses!==s.placements||this.indoor!==indoor){
   this.layout=layout;this.poses=s.placements;this.indoor=indoor;
   this.lamps=Object.entries(s.placements??{}).filter(([id,p])=>(FURNITURE[placeableType(id)]?.light||['lamp','torch','belllamp'].includes(FURNITURE[placeableType(id)]?.shape))&&homeRegion(p.x,p.z)===indoor).map(([id,p])=>{const f=FURNITURE[placeableType(id)];return {...p,id,y:sunnyHeight(p.x,p.z),range:f.lightRange??8,top:(f.height??2.4)-.4};});
   const halos=this.lamps.filter(p=>p.range>8);this.glows.count=Math.min(128,this.lamps.length+halos.length);
   for(let i=0;i<this.glows.count;i++){const halo=i>=this.lamps.length,p=halo?halos[i-this.lamps.length]:this.lamps[i];if(halo){this.dummy.position.set(p.x,p.y+p.top,p.z+.3);this.dummy.rotation.set(-.9,0,0);this.dummy.scale.setScalar(.42);this.dummy.updateMatrix();this.glows.setMatrixAt(i,this.dummy.matrix);continue;}this.dummy.position.set(p.x,p.y+.06,p.z);this.dummy.rotation.set(-Math.PI/2,0,0);this.dummy.scale.setScalar(Math.min(3.6,Math.max(1.4,p.range*1.5/6.5)));this.dummy.updateMatrix();this.glows.setMatrixAt(i,this.dummy.matrix);}if(this.glows.count)this.glows.instanceMatrix.needsUpdate=true;this.sortedAt=-Infinity;
  }
  const lamps=this.lamps;if(s.time-(this.sortedAt??-Infinity)>.4){this.sortedAt=s.time;for(const p of lamps)p.distance=(p.x-s.player.x)**2+(p.z-s.player.z)**2;lamps.sort((a,b)=>a.distance-b.distance);}
  this.glows.material.opacity=night*.55;
  for(let i=0;i<4;i++){const p=lamps[i],l=this.lights[i];/* Jakob 8.11.: Lampen leuchten weiter (1,5-fache Reichweite, sanfter Abfall), aber nicht mehr so grell; Licht etwas höher, damit kein greller Fleck am Boden entsteht. */const far=p&&p.range>10;l.distance=(p?.range??8)*1.5;l.decay=1;l.intensity=p&&!s.testWorld.enabled&&!s.nursery?.interior?night*(far?1.6+p.range*.06:1.5)*(1+Math.sin(s.time*5+i)*.035):0;if(p)l.position.set(p.x,p.y+Math.max(far?p.top:1.7,2.2),p.z);}
 }
}
