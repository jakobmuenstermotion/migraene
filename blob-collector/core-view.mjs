import * as T from './vendor/three.module.js';
import {volcanoHeight,CORE_ZONE,volcanoZoneAt,VOLCANO_PEAK} from './volcano-area.mjs';
// Vulkankern (Endgame, Jakob 6.11.): eigenes Gebiet in der Welt, rechts (östlich) neben dem Magmasee, vom Kraterrand nur durch den
// Lavafluss getrennt; man sieht die vier Anlagen schon von drüben. Rechts dahinter der Berg als geschlossener Kegel.
// Vier große Anlagen: Energie (Turbinen), Hauptleitung (Rohrnetz), Filter (Kammern), Druck/Ansaugung (zentrale Konstruktion).
// Jede hat zwei Reparaturstufen (sichtbar: rostig → halb aktiv → voll aktiv) und danach eine eigene Startsequenz (~6 s).
// Koordinaten der Anlagen relativ zur Gebietsmitte CORE_CENTER.
export const CORE_CENTER={x:CORE_ZONE.x,z:CORE_ZONE.z};
export const CORE_STATIONS={
 coreEnergy:{name:'Energieversorgung',x:-10.5,z:0,rot:-Math.PI/2,color:'#ffb04a',glow:'#ffd27a'},
 corePipes:{name:'Hauptleitung',x:0,z:-8.8,rot:Math.PI,color:'#6fd0e8',glow:'#bdf2ff'},
 coreFilter:{name:'Filtersystem',x:10.5,z:0,rot:Math.PI/2,color:'#9be08a',glow:'#d8ffc7'},
 corePressure:{name:'Druck und Ansaugung',x:0,z:8.8,rot:0,color:'#ef8fb0',glow:'#ffd0e2'}
};
export const CORE_SWITCH={x:-9,z:-6.5};
export const stationWorld=id=>{const st=CORE_STATIONS[id]??CORE_SWITCH;return {x:CORE_CENTER.x+st.x,z:CORE_CENTER.z+st.z};};
export const CORE_SEQ_SECONDS=6;
export const stationLevel=(s,id)=>(s.builtSites?.[id+'2']?2:s.builtSites?.[id+'1']?1:0);
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
// Betriebsgrad 0..1.2: aus Reparaturstufe, laufender Startsequenz und fertigem Betrieb.
export function stationPower(s,id){const lv=stationLevel(s,id),seq=s.endgame?.seq;if(s.builtSites?.[id+'3']){if(seq?.id===id&&s.time-seq.at<CORE_SEQ_SECONDS)return .45+.75*smooth((s.time-seq.at)/CORE_SEQ_SECONDS);return 1.2;}return lv===2?.45:lv===1?.2:0;}
// Steht man am Kraterrand vor dem Lavafluss, schwenkt die Kamera nach rechts und zeigt die vier Anlagen drüben.
// Jakob 7.11.: Der Blick über den Lavafluss zum Kern ist eine kurze Fahrt (4,5 s) und kehrt dann zur Figur zurück.
// Erneut erst, wenn man den Uferstreifen verlassen hat und mindestens eine Minute vergangen ist.
export const CORE_GLIMPSE_SECONDS=4.5;
export const coreFocus=s=>{const seq=s.endgame?.seq,p=s.player,atRiver=!s.cave?.interior&&!s.home?.interior&&p.x>-31&&p.x<-22&&p.z>66&&p.z<88&&volcanoZoneAt(p.x,p.z)?.id==='crater';if(!atRiver&&s.coreGlimpse&&s.time-s.coreGlimpse.at>60)s.coreGlimpse=null;if((!seq||s.time-seq.at>CORE_SEQ_SECONDS)&&atRiver){s.coreGlimpse??={at:s.time};if(s.time-s.coreGlimpse.at<CORE_GLIMPSE_SECONDS)return {x:p.x+13,z:p.z-1,zoom:.5};}if(!seq||s.time-seq.at>CORE_SEQ_SECONDS||!CORE_STATIONS[seq.id])return null;const q=stationWorld(seq.id);return {x:q.x,z:q.z+1.5,zoom:1.2};};
export class CoreView{
 constructor(scene){this.root=new T.Group();scene.add(this.root);this.root.position.set(CORE_CENTER.x,0,CORE_CENTER.z);const hY=(x,z)=>volcanoHeight(CORE_CENTER.x+x,CORE_CENTER.z+z);
  const mat=(c,r=.8,m=.2)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}),glowMat=c=>new T.MeshStandardMaterial({color:'#2a2a2e',emissive:c,emissiveIntensity:0,roughness:.5}),dark=mat('#6a6571',.9,.3),rust=mat('#9a5c40',1,.1),steel=mat('#6c717c',.5,.5);
  const box=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,28),sph=new T.SphereGeometry(1,16,12),tor=new T.TorusGeometry(1,.1,8,40),cone=new T.ConeGeometry(1,1,24,1);
  const add=(parent,geo,m,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o;};
  // Der Berg: geschlossener, undurchsichtiger Kegel rechts (Osten) hinter der Druckanlage, außerhalb der begehbaren Fläche.
  this.baseY=hY(0,0);this.mountain=new T.Group();this.mountain.position.set(VOLCANO_PEAK.x-CORE_CENTER.x,VOLCANO_PEAK.y,VOLCANO_PEAK.z-CORE_CENTER.z);this.root.add(this.mountain);
  // Ein richtiger Vulkankegel mit Krater oben (Drehprofil), dunkles Gestein mit glühenden Lavarinnen. Steht man nördlich davon, wird er durchscheinend.
  {const P=VOLCANO_PEAK,prof=[[P.r+.6,-.3],[P.r,.4],[P.r*.78,P.h*.32],[P.r*.55,P.h*.62],[P.r*.36,P.h*.9],[P.r*.33,P.h],[P.r*.24,P.h*.97],[P.r*.16,P.h*.86],[0,P.h*.84]].map(([r,y])=>new T.Vector2(r,y));this.mountainMat=new T.MeshStandardMaterial({color:'#4a3d3c',roughness:1,transparent:true,opacity:1,flatShading:true});this.slopeMat=new T.MeshStandardMaterial({color:'#463a3a',roughness:1,transparent:true,opacity:1,flatShading:true});/* Jakob 6.11.: felsiger statt glatt: Profil mit mehr Stufen, Ecken je nach Winkel und Höhe verschoben, harte Kanten */const lathe=new T.LatheGeometry(prof.flatMap((v,i)=>i<prof.length-1?[v,new T.Vector2((v.x+prof[i+1].x)/2*(1+(i%2?.06:-.05)),(v.y+prof[i+1].y)/2)]:[v]),40),lp=lathe.attributes.position;for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i),z=lp.getZ(i),r=Math.hypot(x,z);if(r<.3||y>P.h*.83)continue;const a=Math.atan2(z,x),n=.11*Math.sin(a*5+y*.9)+.08*Math.sin(a*11-y*1.7)+.06*Math.sin(a*23+y*3.1)+.05*Math.cos(y*4.3+a*3);lp.setX(i,x*(1+n));lp.setZ(i,z*(1+n));lp.setY(i,y+.25*Math.sin(a*7+y));}lathe.computeVertexNormals();const m=new T.Mesh(lathe,this.mountainMat);m.castShadow=true;m.receiveShadow=true;this.mountain.add(m);
   this.crater=add(this.mountain,cyl,new T.MeshStandardMaterial({color:'#2a1a16',emissive:'#ff7a2e',emissiveIntensity:.5}),0,P.h*.86,0,P.r*.2,.15,P.r*.2);
   const lavaM=new T.MeshBasicMaterial({color:'#ff7a2e'});for(let i=0;i<5;i++){const a=i*1.27+.4,strip=new T.Mesh(new T.BoxGeometry(.22,P.h*.55,.08),lavaM);strip.position.set(Math.cos(a)*P.r*.52,P.h*.58,Math.sin(a)*P.r*.52);strip.lookAt(0,P.h*.58,0);strip.rotateX(-.55);this.mountain.add(strip);}
   /* Felsvorsprünge an den Hängen */for(let i=0;i<22;i++){const a=i*2.39,hh=P.h*(.12+(i%5)*.13),rr=P.r*(1-hh/P.h*.68)*.98;const rock=add(this.mountain,new T.DodecahedronGeometry(1,0),this.slopeMat,Math.cos(a)*rr,hh,Math.sin(a)*rr,.9+(i%3)*.5,.6+(i%2)*.4,.8+(i%4)*.35);rock.rotation.set(i,i*.6,i*.3);}
   for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=P.r*(.95+(i%3)*.06);add(this.mountain,new T.DodecahedronGeometry(1,0),mat(i%2?'#3f3637':'#4a3f40',.95,.05),Math.cos(a)*r,.3,Math.sin(a)*r,.9+(i%3)*.4,.7+(i%2)*.5,.9+(i%4)*.3);}}
  
  // ===== Energieversorgung: zwei Turbinen im Ring, Schornstein, Dampf =====
  const E=CORE_STATIONS.coreEnergy;this.energy=new T.Group();this.energy.position.set(E.x,hY(E.x,E.z)-.15,E.z);this.energy.scale.setScalar(.6);this.energy.rotation.y=E.rot;this.root.add(this.energy);add(this.energy,box,dark,0,.4,0,8,.8,6);
  this.turbines=[-2.1,2.1].map(x=>{const g=new T.Group();g.position.set(x,1.5,.4);this.energy.add(g);const ring=add(g,tor,rust,0,0,0,1.85,1.85,1.85);ring.rotation.x=Math.PI/2;const hub=add(g,cyl,steel,0,0,0,.6,.5,.6);const blades=new T.Group();g.add(blades);for(let i=0;i<8;i++){const b=add(blades,box,glowMat(E.color),0,0,0,2,.06,.34);b.rotation.y=i*Math.PI/4;b.position.set(Math.cos(i*Math.PI/4)*1.1,0,-Math.sin(i*Math.PI/4)*1.1);}return {blades,hub};});
  this.chimney=add(this.energy,cyl,rust,0,3.2,-2.8,1,5,1);this.chimneyTop=add(this.energy,cyl,glowMat(E.color),0,5.8,-2.8,1.15,.4,1.15);
  this.vents=[-3.2,-1.1,1.1,3.2].map(x=>add(this.energy,cone,glowMat(E.color),x,.95,3,.5,.8,.5));
  this.steam=new T.InstancedMesh(new T.SphereGeometry(.4,8,6),new T.MeshBasicMaterial({color:'#e8e2dc',transparent:true,opacity:.45}),30);this.steam.frustumCulled=false;this.energy.add(this.steam);
  // ===== Hauptleitung: Rohrnetz mit Lücken, die sich schließen =====
  const Pp=CORE_STATIONS.corePipes;this.pipesGroup=new T.Group();this.pipesGroup.position.y=hY(0,-7.6);this.root.add(this.pipesGroup);
  /* Ringleitung um den Bergfuß, verbindet alle vier Anlagen */const trunk=Array.from({length:13},(_,i)=>{const a=i/12*Math.PI*2;return [Math.cos(a)*7.4,Math.sin(a)*7.4];}),bra=[[[0,-7.4],[0,-8.4]],[[0,7.4],[0,8.2]]];this.segs=[];
  const seg=(a,b,need,m)=>{const len=Math.hypot(b[0]-a[0],b[1]-a[1]),dir=Math.atan2(b[0]-a[0],b[1]-a[1]),g=new T.Group();g.position.set((a[0]+b[0])/2,.45,(a[1]+b[1])/2);g.rotation.y=dir;this.pipesGroup.add(g);const full=add(g,cyl,glowMat(Pp.color),0,0,0,.28,len,.28);full.rotation.x=Math.PI/2;for(let k=0;k<3;k++){const fl=add(g,cyl,steel,0,0,(-len/2+(k+.5)*len/3),.36,.14,.36);fl.rotation.x=Math.PI/2;}
   const stubs=[-1,1].map(sg=>{const st=add(g,cyl,rust,0,0,sg*(len/2-.4),.28,.8,.28);st.rotation.x=Math.PI/2;return st;});const junk=add(g,box,rust,.3,-.25,0,.35,.22,.5);junk.rotation.y=.6;this.segs.push({g,full,stubs,junk,need,len,a,b});};
  trunk.forEach((p,i)=>{if(i<trunk.length-1)seg(p,trunk[i+1],i%2?2:1);});for(const br of bra)br.forEach((p,i)=>{if(i<br.length-1)seg(p,br[i+1],2);});
  this.hubs=[[0,-8.6],[-7.4,0],[7.4,0],[0,7.4]].map(([x,z])=>add(this.pipesGroup,sph,glowMat(Pp.color),x,.6,z,.6,.6,.6));
  this.flow=new T.InstancedMesh(new T.OctahedronGeometry(.14,0),new T.MeshBasicMaterial({color:'#bdf2ff'}),60);this.flow.frustumCulled=false;this.pipesGroup.add(this.flow);this.flowPaths=[trunk,bra[0],bra[1]];
  // ===== Filtersystem: drei Glaskammern mit drehenden Platten, vier Sammelkammern =====
  const F=CORE_STATIONS.coreFilter;this.filter=new T.Group();this.filter.position.set(F.x,hY(F.x,F.z)-.15,F.z);this.filter.scale.setScalar(.6);this.filter.rotation.y=F.rot;this.root.add(this.filter);add(this.filter,box,dark,0,.35,0,10.4,.7,5.4);
  this.chambers=[-3.3,0,3.3].map((x,i)=>{const g=new T.Group();g.position.set(x,0,-.6);this.filter.add(g);add(g,cyl,steel,0,.9,0,1.7,.4,1.7);const glass=add(g,cyl,new T.MeshStandardMaterial({color:'#bfe8e0',transparent:true,opacity:.3,roughness:.1,metalness:.1}),0,2.9,0,1.3,4,1.3);glass.castShadow=false;const discs=[1.6,2.7,3.8].map((y,k)=>add(g,cyl,glowMat(F.color),0,y,0,1.25-k*.1,.1,1.25-k*.1));const lamp=add(g,sph,glowMat(F.color),0,5.2,0,.55,.55,.55);return {discs,lamp};});
  this.tanks=['#7fc46a','#6fb7e8','#e8f6ff','#ff8a3c'].map((c,i)=>add(this.filter,box,glowMat(c),-3.9+i*2.6,.95,2,1.5,1.1,1.2));this.tankColors=['#7fc46a','#6fb7e8','#e8f6ff','#ff8a3c'];
  // ===== Druck- und Ansaugsystem: zentrale Konstruktion am Berg =====
  const Q=CORE_STATIONS.corePressure;this.pressure=new T.Group();this.pressure.position.set(Q.x,hY(Q.x,Q.z)-.15,Q.z);this.pressure.scale.setScalar(.6);this.pressure.rotation.y=Q.rot;this.root.add(this.pressure);add(this.pressure,cyl,dark,0,.4,0,3.9,.8,3.9);
  this.barrel=add(this.pressure,cyl,steel,0,3,0,2,5,2);this.funnel=add(this.pressure,new T.CylinderGeometry(1,.55,1,28,1,true),mat('#555a66',.6,.5),0,6.2,0,2.6,1.6,2.6);this.funnel.material.side=T.DoubleSide;
  this.pistons=[0,1,2,3].map(i=>{const a=i*Math.PI/2+.8,px=Math.cos(a)*2.7,pz=Math.sin(a)*2.7;add(this.pressure,cyl,rust,px,1.1,pz,.5,2,.5);return add(this.pressure,cyl,glowMat(Q.color),px,2.6,pz,.34,2,.34);});
  this.pressRing=add(this.pressure,tor,glowMat(Q.color),0,4.4,0,2.4,2.4,2.4);this.pressRing.rotation.x=Math.PI/2;this.core=add(this.pressure,sph,glowMat(Q.color),0,3.6,0,1.2,1.2,1.2);
  // Felsschalen: Vor der Reparatur liegen die Anlagen fast ganz unter Vulkangestein; jede Stufe legt etwas mehr frei, aber es bleibt Fels.
  const crag=new T.DodecahedronGeometry(1,0),rockA=mat('#3f3637',.95,.05),rockB=mat('#4a3f40',.95,.05);this.shells={};for(const [id,st] of Object.entries(CORE_STATIONS)){const g=new T.Group();g.position.set(st.x,hY(st.x,st.z)-.1,st.z);this.root.add(g);const parts=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.3,r=1.5+(i%3)*.25,m=add(g,crag,i%2?rockA:rockB,Math.cos(a)*r,.5,Math.sin(a)*r,1,1,1);m.rotation.set(i,i*.7,i*.3);m.userData.base=[1.1+(i%3)*.3,1.2+(i%2)*.5];parts.push(m);}const cap=add(g,crag,rockA,0,1.6,0,1.9,1.3,1.8);cap.userData.base=[1.9,1.3];cap.userData.cap=true;parts.push(cap);this.shells[id]=parts;}
  this.motes=new T.InstancedMesh(new T.OctahedronGeometry(.1,0),new T.MeshBasicMaterial({color:'#ffe9a8'}),90);this.motes.frustumCulled=false;this.root.add(this.motes);this.dummy=new T.Object3D();
  // Schalter des Vulkansaugers
  const swY=hY(CORE_SWITCH.x,CORE_SWITCH.z);this.switchBox=add(this.root,box,dark,CORE_SWITCH.x,swY+.55,CORE_SWITCH.z,1.4,1.1,.9);this.switchLamp=add(this.root,sph,glowMat('#6aff9a'),CORE_SWITCH.x,swY+1.3,CORE_SWITCH.z,.24,.24,.24);


 }
 update(s){const here=!s.testWorld?.enabled&&s.area==='sunny'&&!s.home?.interior&&!s.nursery?.interior&&!s.cave?.interior&&Math.hypot(s.player.x-CORE_CENTER.x,s.player.z-CORE_CENTER.z)<70;this.root.visible=here;if(!here)return;const t=s.time,act=Boolean(s.builtSites?.coreActivate),on=act&&Boolean(s.endgame?.active),d=this.dummy;
  const pw={};for(const id of Object.keys(CORE_STATIONS))pw[id]=stationPower(s,id);const lv=id=>stationLevel(s,id);
  // Energie
  {const k=pw.coreEnergy,L=lv('coreEnergy');this.turbines.forEach((tb,i)=>{tb.blades.rotation.y+=.016*(.4+k*14)*(i?-1:1)*(L||s.builtSites?.coreEnergy3?1:0);tb.blades.children.forEach(b=>{b.material.emissiveIntensity=k*(i===0||L>=2||k>1?1.5:.2);});});this.chimneyTop.material.emissiveIntensity=k*1.6;this.vents.forEach((v,i)=>{v.material.emissiveIntensity=k*(1.2+Math.sin(t*5+i)*.4);v.scale.y=.8+k*.5+Math.sin(t*6+i)*.05;});
   this.steam.visible=k>.5;if(k>.5)for(let i=0;i<30;i++){const u=((t*.35+i/30)%1);d.position.set(((i*7)%9-4.5)*.25,5.9+u*4,-2.8+Math.sin(i)*.4);d.scale.setScalar(.5+u*1.3);d.updateMatrix();this.steam.setMatrixAt(i,d.matrix);}this.steam.instanceMatrix.needsUpdate=true;}
  // Hauptleitung
  {const k=pw.corePipes,L=lv('corePipes');for(const sg of this.segs){const ok=L>=sg.need||s.builtSites?.corePipes3;sg.full.visible=Boolean(ok);sg.stubs.forEach(x=>x.visible=!ok);sg.junk.visible=!ok;sg.full.material.emissiveIntensity=ok?(k>1?1+Math.sin(t*4+sg.len)*.3:.3+k):0;}this.hubs.forEach((h,i)=>{h.material.emissiveIntensity=L?(k>1?1.6:.4+k):0;});
   this.flow.visible=k>.9;if(k>.9){let n=0;this.flowPaths.forEach((path,pi)=>{const total=path.reduce((a,p,i)=>i?a+Math.hypot(p[0]-path[i-1][0],p[1]-path[i-1][1]):a,0);for(let i=0;i<20&&n<60;i++){let dist=((t*3.5+i*total/20)%total),k2=1;for(;k2<path.length;k2++){const sl=Math.hypot(path[k2][0]-path[k2-1][0],path[k2][1]-path[k2-1][1]);if(dist<=sl){const f=dist/sl;d.position.set(path[k2-1][0]+(path[k2][0]-path[k2-1][0])*f,.45,path[k2-1][1]+(path[k2][1]-path[k2-1][1])*f);break;}dist-=sl;}d.scale.setScalar(1);d.updateMatrix();this.flow.setMatrixAt(n++,d.matrix);}});this.flow.instanceMatrix.needsUpdate=true;}}
  // Filter
  {const k=pw.coreFilter,L=lv('coreFilter');this.chambers.forEach((c,i)=>{const active=s.builtSites?.coreFilter3||(L>=1&&(i<2||L>=2));c.lamp.material.emissiveIntensity=active?(k>1?2+Math.sin(t*5+i)*.5:1):0;c.discs.forEach((ds,j)=>{ds.rotation.y+=.016*(L||s.builtSites?.coreFilter3?(.5+k*9)*(j%2?-1:1):0);ds.material.emissiveIntensity=active?.4+k*1.2:0;});});this.tanks.forEach((tk,i)=>{tk.material.emissiveIntensity=(s.builtSites?.coreFilter3||(L>=1&&i<2)||L>=2)?(k>1?1.6:.7):0;});}
  // Druck
  {const k=pw.corePressure,L=lv('corePressure'),act2=Boolean(s.builtSites?.corePressure3);this.pistons.forEach((p,i)=>{p.position.y=2.6+(L||act2?Math.sin(t*(2+k*7)+i*1.6)*.7*Math.min(1,k+.3):0);p.material.emissiveIntensity=L||act2?.5+k:0;});this.pressRing.rotation.z+=.016*(k>0?.5+k*5:0);this.pressRing.material.emissiveIntensity=k*1.5;this.core.material.emissiveIntensity=L||act2?(k>1?2.2+Math.sin(t*8)*.5:.6+k):0;this.crater.material.emissiveIntensity=.3+(act?.9:0)+k*.4;}
  // Felsschalen schrumpfen je Stufe, ganz verschwinden sie nie; der Deckel bricht erst mit der Startsequenz auf.
  for(const [id,parts] of Object.entries(this.shells)){const L=lv(id),run=Boolean(s.builtSites?.[id+'3']),f=run?.35:L===2?.5:L===1?.65:.8;for(const m of parts){const [b,h]=m.userData.base;if(m.userData.cap){m.visible=!run;m.scale.set(b*(L?.5:.7),h*(L?.4:.65),b*(L?.5:.7));}else m.scale.set(b*f,h*f,b*f);}}
  const ready=['coreEnergy','corePipes','coreFilter','corePressure'].every(k=>s.builtSites?.[k+'3']);this.switchBox.visible=this.switchLamp.visible=ready;
  this.switchLamp.material.emissiveIntensity=act?(on?2:.3):0;
  // Berg durchscheinend, solange die Figur hinter (nördlich von) ihm steht und die Kamera durch ihn schauen müsste.
  {const lz=s.player.z-CORE_CENTER.z,lx=s.player.x-CORE_CENTER.x,behind=lz<-1&&Math.abs(lx)<VOLCANO_PEAK.r+2&&lz>-14,target=behind?.28:1;this.mountainMat.opacity+=(target-this.mountainMat.opacity)*.12;this.mountainMat.depthWrite=this.mountainMat.opacity>.95;this.slopeMat.opacity=this.mountainMat.opacity;this.slopeMat.depthWrite=this.mountainMat.depthWrite;}
  // Sog-Partikel: bei Probelauf des Druck-Systems und bei eingeschaltetem Vulkansauger strömen sie zum Berg
  const flowK=Math.max(on?1:0,pw.corePressure>.6?pw.corePressure/1.2:0);this.motes.visible=flowK>0;if(flowK>0){for(let i=0;i<90;i++){const u=((t*.4+i/90)%1),a=i*2.4;const ang=i*2.4+t*.3,r0=12-((i*7)%5),r=r0*(1-u)+.6*u;d.position.set(Math.cos(ang+u*3)*r,this.baseY+.5+u*(VOLCANO_PEAK.h+1)+Math.sin(u*6.28)*.6,Math.sin(ang+u*3)*r);d.scale.setScalar(.7+(1-u)*.6);d.updateMatrix();this.motes.setMatrixAt(i,d.matrix);}this.motes.instanceMatrix.needsUpdate=true;}}
}
