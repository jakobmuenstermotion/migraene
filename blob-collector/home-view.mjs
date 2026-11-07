import {makeVacuumTool} from './vacuum-models.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import * as T from './vendor/three.module.js';
import {daylightAt} from './daylight.mjs';
import {ScenicBatch} from './scenic-geometry.mjs';
import {HOME_ROOM,inHome} from './home-space.mjs';
import {chargerPos} from './charger-building.mjs';
export class HomeView{
 constructor(scene){this.root=new T.Group();scene.add(this.root);this.root.position.set(HOME_ROOM.x,HOME_ROOM.floor,HOME_ROOM.z);const b=new ScenicBatch(),box=new T.BoxGeometry(1,1,1),ball=new T.SphereGeometry(1,12,8),cyl=new T.CylinderGeometry(1,1,1,12);
  const block=(c,x,y,z,w,h,d)=>b.add(box,c,x,y,z,w,h,d),orb=(c,x,y,z,w,h,d)=>b.add(ball,c,x,y,z,w,h,d);
  block('#a4835f',0,-.15,0,12.25,.3,10.2);for(let i=0;i<24;i++){const x=-5.75+i*.5;block(i%3?'#cdb18a':'#d8bd94',x,.015,0,.485,.04,10);for(const z of [-3.3,0,3.3])block('#ae936e',x,.04,z,.48,.012,.018);}
  {const x=-6;block('#e4d4b0',x,1.4,0,.2,2.8,10.1);block('#9b8059',x,.18,0,.25,.36,10);block('#ae9067',x,2.76,0,.3,.18,10.2);}block('#e8d8b7',0,1.4,-5,12,2.8,.2);block('#a58a63',0,.18,-4.87,12,.36,.09);block('#af9064',0,2.77,-5,12.2,.18,.3);
  for(const side of [-1,1]){block('#d9cba7',side*3.55,.47,5,4.9,.94,.2);block('#b1966c',side*3.55,.95,5,5.05,.1,.27);block('#a78b64',side*1.12,1.15,5,.2,2.3,.2);}block('#9b8059',0,.015,5.1,2.1,.08,.6);
  // Bright windows and warm trim make the larger room feel like the same cottage.
  for(const x of [-2.4,1.1]){block('#a58b65',x,1.75,-4.84,1.95,1.65,.12);block('#d9e9d0',x,1.75,-4.75,1.69,1.4,.07);block('#b29b73',x,1.75,-4.69,.065,1.45,.06);block('#b29b73',x,1.75,-4.69,1.75,.065,.06);block('#c0a175',x,.88,-4.65,2.15,.13,.4);for(const sx of [-1,1])block('#a4b29a',x+sx*.98,1.8,-4.63,.22,1.85,.15);}
  const pcx=2.9,pcz=-3.7;block('#a38660',pcx,.78,pcz,1.15,.12,.75);for(const x of [-.45,.45])block('#8a7657',pcx+x,.38,pcz,.1,.76,.5);block('#557d74',pcx,1.2,pcz-.15,.95,.64,.13);block('#b7d9c0',pcx,1.22,pcz-.07,.79,.45,.025);block('#769786',pcx,.92,pcz+.18,.75,.04,.25);block('#e8cf96',pcx,1.22,pcz-.045,.2,.17,.01);
  // Jakob 7.11.: Die Ladestation selbst ist ein aufstellbares Gebäude (crafting-view, Form 'charger'); hier nur Lämpchen und abgestellter Sauger.
  const ch={x:0,z:0};this.chargerGroup=new T.Group();
  for(const [x,z]of [[5.2,-4.4],[-5.2,4.2]]){b.add(cyl,'#c9a173',x,.28,z,.28,.52,.28);for(let i=0;i<5;i++){const a=i*2.4;orb('#78956e',x+Math.sin(a)*.23,.85+i%2*.15,z+Math.cos(a)*.23,.15,.48,.13);}}
  b.finish(this.root);
  // Neugestaltung: Hausanbau. Je Stufe eine eigene Gruppe; die Trennwand bekommt einen Durchgang, sobald der Raum dahinter
  // freigeschaltet ist. Wintergarten mit hellem Mosaikboden, Glasfront und (durchsichtigem) Glasdach.
  this.levels=[];const wall=(g,x,z0,z1,door)=>{const seg=(a,c)=>{if(c-a<.05)return;g.add(box,'#e4d4b0',x,1.4,(a+c)/2,.2,2.8,c-a);g.add(box,'#9b8059',x,.18,(a+c)/2,.25,.36,c-a);};if(door){seg(z0,door[0]);seg(door[1],z1);g.add(box,'#ae9067',x,2.55,(door[0]+door[1])/2,.3,.5,door[1]-door[0]);g.add(box,'#a78b64',x,1.15,door[0],.24,2.3,.16);g.add(box,'#a78b64',x,1.15,door[1],.24,2.3,.16);}else seg(z0,z1);g.add(box,'#ae9067',x,2.76,(z0+z1)/2,.3,.18,z1-z0+.2);};
  for(let level=0;level<=2;level++){const g=new ScenicBatch();
   // Ostwand des Hauptraums: geschlossen auf Stufe 0, sonst mit Durchgang.
   wall(g,6,-5,5,level>=1?[-.9,.7]:null);
   if(level>=1){g.add(box,'#a4835f',10,-.15,-1,8.2,.3,8.2);for(let i=0;i<16;i++)g.add(box,i%3?'#d6bb92':'#e0c79f',6.25+i*.5,.015,-1,.485,.04,8);
    g.add(box,'#e8d8b7',10,1.4,-5,8,2.8,.2);g.add(box,'#e8d8b7',10,.7,3,8,1.4,.2);g.add(box,'#af9064',10,2.77,-5,8.2,.18,.3);
    for(const x of [8,12]){g.add(box,'#a58b65',x,1.75,-4.84,1.9,1.6,.12);g.add(box,'#d9e9d0',x,1.75,-4.75,1.65,1.35,.07);}
    wall(g,14,-5,3,level>=2?[-.8,.8]:null);
    g.add(box,'#c9a173',12.9,.28,-4.1,.5,.52,.5);for(let i=0;i<5;i++)g.add(ball,'#78956e',12.9+Math.sin(i*2.4)*.2,.85+i%2*.15,-4.1+Math.cos(i*2.4)*.2,.15,.45,.13);}
   if(level>=2){g.add(box,'#b8aa92',18,-.15,-1,8.2,.3,8.2);for(let i=0;i<16;i++)for(let j=0;j<16;j++)g.add(box,['#e9dfc8','#cfe3dc','#e8d4c2','#d8e6ef'][(i*3+j*5)%4],14.25+i*.5,.015,-4.75+j*.5,.47,.04,.47);
    for(const z of [-5,3])g.add(box,'#d9e9ea',18,1.1,z,8,1.6,.08);for(const z of [-5,3])for(let i=0;i<=4;i++)g.add(box,'#8f7454',14+i*2,1.4,z,.12,2.8,.14);g.add(box,'#d9e9ea',22,1.1,-1,.08,1.6,8);for(let i=0;i<=4;i++)g.add(box,'#8f7454',22,1.4,-5+i*2,.14,2.8,.12);
    for(const z of [-5,3])g.add(box,'#8f7454',18,.25,z,8,.5,.18);g.add(box,'#8f7454',22,.25,-1,.18,.5,8);
    for(const [x,z] of [[15,-4.2],[21,-4.2],[21,2.2]]){g.add(cyl,'#b98a62',x,.32,z,.35,.6,.35);for(let i=0;i<7;i++)g.add(ball,i%2?'#6f9a62':'#8fb56e',x+Math.sin(i*2.4)*.28,.95+i%3*.2,z+Math.cos(i*2.4)*.28,.2,.55,.18);}}
   const mesh=g.finish(this.root);mesh.visible=false;this.levels.push(mesh);}
  // Glasdach des Wintergartens: zarte Sprossen und leicht getöntes Glas.
  this.glassRoof=new T.Group();{const glass=new T.Mesh(new T.BoxGeometry(8,.04,8),new T.MeshStandardMaterial({color:'#cfe9f0',transparent:true,opacity:.18,roughness:.1,depthWrite:false}));glass.position.set(18,2.9,-1);this.glassRoof.add(glass);const ribs=new ScenicBatch();for(let i=0;i<=4;i++)ribs.add(box,'#8f7454',14+i*2,2.88,-1,.08,.08,8);ribs.finish(this.glassRoof);}this.glassRoof.visible=false;this.root.add(this.glassRoof);
  this.annexLight=new T.PointLight('#ffe6be',3,16,1.5);this.annexLight.position.set(14,3.2,-1);this.annexLight.visible=false;this.root.add(this.annexLight);
  box.dispose();ball.dispose();cyl.dispose();this.light=new T.PointLight('#ffe6be',4,18,1.5);this.light.position.set(0,3.3,0);this.root.add(this.light);this.ambient=new T.HemisphereLight('#fff0d7','#b8a385',.5);this.root.add(this.ambient);this.root.add(this.chargerGroup);this.toolSlot=new T.Group();this.toolSlot.position.set(ch.x,.72,ch.z+.02);this.chargerGroup.add(this.toolSlot);{const bolt=new T.Shape();[[.05,.34],[-.17,-.03],[-.02,-.03],[-.07,-.34],[.17,.07],[.02,.07]].forEach(([x,y],i)=>i?bolt.lineTo(x,y):bolt.moveTo(x,y));bolt.closePath();this.ledMat=new T.MeshBasicMaterial({color:'#6f7f79'});const m=new T.Mesh(new T.ShapeGeometry(bolt),this.ledMat);m.position.set(ch.x,1.35,ch.z-.44);m.scale.setScalar(1.15);this.chargerGroup.add(m);const base=new T.Mesh(new T.RingGeometry(.4,.5,28),this.ledMat);base.rotation.x=-Math.PI/2;base.position.set(ch.x,.235,ch.z+.05);this.chargerGroup.add(base);}this.root.visible=false;
 }
 update(s){this.root.visible=inHome(s);this.light.visible=this.ambient.visible=this.root.visible;const level=Math.max(0,Math.min(2,s.home?.expansion|0));this.levels?.forEach((m,i)=>m.visible=i===level);if(this.glassRoof)this.glassRoof.visible=level>=2;if(this.annexLight){this.annexLight.visible=this.root.visible&&level>=1;this.annexLight.intensity=3+daylightAt(s.time+(s.daylightOffset??0)).night*6;}{const cp=chargerPos(s);this.chargerGroup.visible=Boolean(cp);if(cp){this.chargerGroup.position.set(cp.x-HOME_ROOM.x,0,cp.z-HOME_ROOM.z);this.chargerGroup.rotation.y=cp.rotation??0;}const docked=Boolean(s.charging)&&Boolean(cp),id=s.vacuumId;if(docked&&this.dockedId!==id){this.dockedId=id;this.toolSlot.clear();const tool=makeVacuumTool(effectiveVacuum(s));tool.rotation.x=-.45;tool.rotation.y=.25;tool.scale.setScalar(1.25);this.toolSlot.add(tool);}this.toolSlot.visible=docked;const full=docked&&s.battery.charge>=s.battery.max-.01;this.ledMat.color.set(!docked?'#6f7f79':full?'#7fe26a':(Math.sin(s.time*5)>0?'#ffc23a':'#a8802a'));}this.light.intensity=4+daylightAt(s.time+(s.daylightOffset??0)).night*8;}
}

