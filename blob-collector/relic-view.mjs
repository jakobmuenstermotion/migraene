import * as T from './vendor/three.module.js';
import {ScenicBatch} from './scenic-geometry.mjs';
import {RELICS,relicY} from './relics.mjs';
import {ICE_ROOM,inCave} from './cave-space.mjs';
import {storyState} from './story-dialogs.mjs';
// Jakob 7.11.: uralte Bauteile auf alten Steinsockeln mit sanftem Leuchten, daneben die vergilbte Blaupause.
// Dazu die kleine Eisgrotte (eigener Raum, nur über den Anker IV am Gipfel).
function relicModel(r){const g=new T.Group(),mat=new T.MeshStandardMaterial({color:r.color,emissive:r.glow,emissiveIntensity:.55,roughness:.35,metalness:.4}),dark=new T.MeshStandardMaterial({color:'#5d5447',roughness:.8,metalness:.3});
 if(r.id==='relicforest'){const gear=new T.Mesh(new T.TorusGeometry(.26,.08,8,20),mat);g.add(gear);for(let i=0;i<10;i++){const t=new T.Mesh(new T.BoxGeometry(.09,.12,.12),mat);const a=i/10*Math.PI*2;t.position.set(Math.cos(a)*.35,Math.sin(a)*.35,0);t.rotation.z=a;g.add(t);}const hub=new T.Mesh(new T.CylinderGeometry(.09,.09,.16,12),dark);hub.rotation.x=Math.PI/2;g.add(hub);for(let i=0;i<3;i++){const v=new T.Mesh(new T.CylinderGeometry(.02,.03,.5,5),new T.MeshStandardMaterial({color:'#6f8a4a'}));v.position.set(Math.cos(i*2.1)*.2,Math.sin(i*2.1)*.2,.06);v.rotation.z=i*2.1;g.add(v);}}
 else if(r.id==='reliccoast'){const coil=new T.Mesh(new T.TorusKnotGeometry(.18,.05,48,8,2,5),mat);g.add(coil);for(const y of [-.3,.3]){const c=new T.Mesh(new T.CylinderGeometry(.2,.2,.06,16),dark);c.position.y=y;g.add(c);}const core=new T.Mesh(new T.CylinderGeometry(.05,.05,.6,10),new T.MeshStandardMaterial({color:'#f2ede0',emissive:'#bfefff',emissiveIntensity:.4}));g.add(core);}
 else{const body=new T.Mesh(new T.CylinderGeometry(.2,.24,.42,8),mat);g.add(body);const wheel=new T.Mesh(new T.TorusGeometry(.2,.04,6,16),dark);wheel.position.y=.32;wheel.rotation.x=Math.PI/2;g.add(wheel);for(let i=0;i<4;i++){const sp=new T.Mesh(new T.BoxGeometry(.4,.03,.03),dark);sp.position.y=.32;sp.rotation.y=i*Math.PI/4;g.add(sp);}for(const s of [-1,1]){const p=new T.Mesh(new T.CylinderGeometry(.06,.06,.2,8),dark);p.rotation.z=Math.PI/2;p.position.set(s*.3,0,0);g.add(p);}}
 return g;}
function pedestal(){const b=new ScenicBatch(),box=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,10);b.add(cyl,'#8d8676',0,.12,0,.62,.24,.62);b.add(cyl,'#a39c8a',0,.5,0,.36,.6,.36);b.add(cyl,'#8d8676',0,.84,0,.5,.1,.5);for(let i=0;i<5;i++){const a=i*1.3;b.add(box,'#6f9a4c',Math.cos(a)*.5,.16,Math.sin(a)*.5,.22,.1,.16,0,a,0);}const g=new T.Group();b.finish(g);box.dispose();cyl.dispose();return g;}
export class RelicView{
 constructor(scene){this.root=new T.Group();scene.add(this.root);this.items=new Map();
  for(const r of RELICS){const g=new T.Group();g.position.set(r.x,relicY(r),r.z);g.add(pedestal());const model=relicModel(r);model.position.y=1.35;g.add(model);const halo=new T.Mesh(new T.SphereGeometry(.55,16,10),new T.MeshBasicMaterial({color:r.glow,transparent:true,opacity:.18,depthWrite:false}));halo.position.y=1.35;g.add(halo);
   const paper=new T.Mesh(new T.PlaneGeometry(.34,.44),new T.MeshStandardMaterial({color:'#d8c39a',roughness:1,side:T.DoubleSide}));paper.rotation.set(-Math.PI/2+.1,0,.4);paper.position.set(.55,.04,.35);g.add(paper);
   g.userData={model,halo,room:r.room};this.root.add(g);this.items.set(r,g);}
  this.cave=this.buildCave();scene.add(this.cave);}
 buildCave(){const root=new T.Group();root.position.set(ICE_ROOM.x,ICE_ROOM.floor,ICE_ROOM.z);const b=new ScenicBatch(),box=new T.BoxGeometry(1,1,1),ico=new T.IcosahedronGeometry(1,1),cone=new T.ConeGeometry(1,1,6),W=ICE_ROOM.w,D=ICE_ROOM.d;
  b.add(box,'#cfe6ef',0,-.15,0,W+1,.3,D+1);for(let i=0;i<40;i++){const x=(Math.sin(i*12.9)*.5)*W*.9,z=(Math.cos(i*7.3)*.5)*D*.9;b.add(box,i%2?'#e6f4fa':'#bcdbe8',x,.02,z,1.2+i%3*.4,.04,.9+i%2*.5,0,i,0);}
  for(let i=0;i<34;i++){const a=i/34*Math.PI*2,x=Math.cos(a)*W*.52,z=Math.sin(a)*D*.52;if(z>D*.4&&Math.abs(x)<1.8)continue;b.add(ico,['#8fb8cc','#a9cfe0','#7ea6bd'][i%3],x,1.4+(i%4)*.3,z,1.4,2.2+(i%3)*.5,1.2,i,i*.7,0);}
  for(let i=0;i<26;i++){const x=(Math.sin(i*5.1)*.45)*W,z=(Math.cos(i*3.7)*.45)*D;b.add(cone,'#e9f8ff',x,3.2-(i%3)*.2,z,.12,.9+(i%4)*.3,.12,Math.PI,0,0);}
  for(const [x,z,s] of [[-4.6,-3.4,1],[4.2,-3.8,.9],[-5.2,2.6,.7],[5,2.2,.8],[-2.4,-4.4,.6],[2.6,-4.6,.7]]){for(let k=0;k<4;k++)b.add(cone,'#9fe6ff',x+Math.sin(k*1.7)*.25*s,.5*s+k*.08,z+Math.cos(k*1.7)*.25*s,.16*s,1+k*.25*s,.16*s,Math.sin(k)*.3,0,Math.cos(k)*.3);}
  b.add(box,'#7aa0b5',0,1.6,D/2+.2,W,3.2,.4);b.finish(root);
  const light=new T.PointLight('#bfefff',6,16,1.4);light.position.set(0,2.8,-1);root.add(light);root.add(new T.HemisphereLight('#e8f8ff','#5d7f93',.7));box.dispose();ico.dispose();cone.dispose();root.visible=false;return root;}
 update(s){const notes=storyState(s).notes,inIce=inCave(s)&&s.cave?.room==='ice';this.cave.visible=inIce;this.root.visible=!s.testWorld?.enabled&&s.area==='sunny';
  for(const [r,g] of this.items){const got=notes.includes(r.note.id),here=r.room?inIce:!s.cave?.interior&&!s.home?.interior&&!s.nursery?.interior;g.visible=here;g.userData.model.visible=g.userData.halo.visible=!got;const t=s.time;g.userData.model.rotation.y=t*.6;g.userData.model.position.y=1.35+Math.sin(t*1.6)*.06;g.userData.halo.material.opacity=.14+Math.sin(t*2)*.05;}}
}
