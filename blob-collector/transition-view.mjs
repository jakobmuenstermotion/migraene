import {autumnLeafGeometry} from './cozy-assets.mjs';
import {coastShore,coastHeight,COAST_GATE_ROCKS,COAST_ANCHORS,COAST_GATES} from './coast-area.mjs';
import * as T from './vendor/three.module.js';
import {SUNNY,sunnyHeight,sunnyTerrainHeight,ancientTreeShape} from './sunny-area.mjs';
import {ScenicBatch} from './scenic-geometry.mjs';
import {addGorge} from './gorge-view.mjs';
export function addTransitions(root){
 const b=new ScenicBatch(),rock=new T.DodecahedronGeometry(1,0),box=new T.BoxGeometry(1,1,1),stem=new T.CylinderGeometry(.07,.1,.5,6),cap=new T.SphereGeometry(1,9,5,0,Math.PI*2,0,Math.PI/2),disc=new T.CircleGeometry(1,20),log=new T.CylinderGeometry(1,1,1,9),leaf=new T.ConeGeometry(1,1,5),waterRoot=new T.Group();root.add(waterRoot);
 const stone=(x,z,s=1)=>b.add(rock,'#999b8b',x,sunnyTerrainHeight(x,z)+s*.45,z,s,s*.7,s*.8,.1,x,0);
 const patch=()=>{}; // Vegetation frames entrances without painted geometric ground patches.
 const gorge=addGorge(root);
 // Weathered rock collar follows the ancient tree's raised, rounded refuge.
 const cliffColor=new T.Color();function cliffVertex(angle,r){r*=ancientTreeShape(angle);const x=-43+Math.sin(angle)*r,z=-8+Math.cos(angle)*r/.95;return new T.Vector3(x,sunnyHeight(x,z)+.025,z);}
 for(let i=0;i<128;i++)for(const [outer,inner,tint]of [[5.5,5.3,'#637578'],[5.3,5.1,'#77888a'],[5.1,4.85,'#89938b']]){cliffColor.set(tint);const a=i*Math.PI/64,c=(i+1)*Math.PI/64,points=[cliffVertex(a,outer),cliffVertex(c,outer),cliffVertex(a,inner),cliffVertex(c,inner)];for(const j of [0,2,1,1,2,3]){b.positions.push(...points[j].toArray());b.colors.push(cliffColor.r,cliffColor.g,cliffColor.b);}}

 // Smooth grassy refuge cap; coarse ground grids stay underneath the separate mesa.
 for(let i=0;i<128;i++){const a=i*Math.PI/64,c=(i+1)*Math.PI/64;cliffColor.set(i%7?'#78948b':'#809c90');for(const point of [new T.Vector3(-43,sunnyHeight(-43,-8)+.026,-8),cliffVertex(a,4.85),cliffVertex(c,4.85)]){b.positions.push(...point.toArray());b.colors.push(cliffColor.r,cliffColor.g,cliffColor.b);}}
 // West: mushroom colonies below higher rock ledges and the ancient tree.
 for(let i=0;i<30;i++){const x=-32-(i%6)*2,z=1+(i%2?1:-1)*(2+Math.floor(i/6)*.7),y=sunnyHeight(x,z),s=.6+(i%4)*.2;b.add(stem,'#d3bf91',x,y+.25*s,z,s,s,s);b.add(cap,i%3?'#9d786c':'#b195ab',x,y+.46*s,z,.35*s,.2*s,.35*s);for(let j=0;j<3;j++)b.add(rock,'#e8d9b6',x+Math.cos(j*2.1)*.15*s,y+.56*s,z+Math.sin(j*2.1)*.15*s,.035,.018,.035);}
 for(let i=0;i<6;i++)stone(-33-i*2,5.5+(i%2)*1.3,1.1+(i%3)*.35);
 // Two distinct rocky risers lead uphill; their grass tops follow real terrain.
 for(const [base,rise] of [[-36,1.1],[-40,1.3]])for(let i=0;i<6;i++){const z=-1.6+i*1.02,x=base+(base===-36?.25*Math.sin(z*1.3):.35*Math.sin(z*.9)),y=sunnyHeight(x-.2,z),s=.85+(i%3)*.13;b.add(rock,i%2?'#8f9380':'#a0a08a',x-.2,y-rise*.43,z,.65*s,rise*.66,s*.7,.1*Math.sin(i),i*2.3,.1*Math.cos(i));b.add(rock,'#73835c',x-.6,y+.035,z,.72*s,.08,s*.65,0,i*.7,0);}
 // Southeast: moss and ferns increasingly crowd the sides of the path.
 for(let i=0;i<28;i++){const along=i/28,x=20+along*13,z=17+along*11,side=i%2?1:-1,px=x+side*(2+(i%3)*.5),pz=z-side*1.6;patch(px,pz,1.8,1.1,i%2?'#4c7955':'#61865b');for(let j=0;j<5;j++)b.add(leaf,'#36634b',px+Math.sin(j*2.4)*.35,sunnyHeight(px,pz)+.3,pz+Math.cos(j*2.4)*.35,.16,.55,.16,.3,j*2.4,.4);}
 // East: a natural notch through a weathered ridge, closed by real driftwood.
 for(let i=0;i<13;i++){const x=30+i*1.3,z=-2.5;if(x>42)patch(x,z,1.7,1.8,i%3?'#d0c89b':'#dbcc9f');for(const side of [-1,1]){const px=x+.7,pz=z+side*(3.2+i*.05);for(let j=0;j<3;j++)b.add(log,'#9caa70',px+j*.1,sunnyHeight(px,pz)+.5,pz,.018,.8+j*.15,.018,0,0,.15);}}
 /* Neugestaltung: kantige blaugraue Felsen mit Moos statt gleichförmiger Kugeln */const smoothRock=new T.DodecahedronGeometry(1,1);for(const r of COAST_GATE_ROCKS){if(r.i>=80)continue;const y=sunnyHeight(r.x,r.z),v=.82+.36*((r.i*37)%11)/10,sq=.7+.25*((r.i*13)%5)/4;b.add(smoothRock,['#7f8994','#8f99a3','#6f7a85','#88929c'][r.i%4],r.x,y+r.h*.4*sq,r.z,r.rx*v,r.h*.6*sq,r.rz*(2-v)*.9,.12*Math.sin(r.i),r.i*1.7,.12*Math.cos(r.i));if(r.i%2===0)b.add(smoothRock,r.i%4?'#6f9a3a':'#7aa440',r.x-.15,y+r.h*.8*sq,r.z+.08,r.rx*v*.7,.12,r.rz*.62,0,r.i,.12);if(r.i%3===0){const side=r.i%2?1:-1;b.add(rock,'#9fa89a',r.x+side*(r.rx+.35),y+.25,r.z+.4,.55,.4,.6,.1,r.i,.15);}}smoothRock.dispose();const ridgeColor=new T.Color();for(let i=0;i<144;i++){const x=40+i*.3,nx=x+.3,point=(xx,band)=>{const t=band/12,floor=coastHeight(xx,24,true),fade=Math.max(0,Math.min(1,(coastShore(24)-xx)/3)),crest=(1.25+.22*Math.sin(xx*.43)+.12*Math.sin(xx*1.2))*fade;return {x:xx,z:23.3+t*4.3+.22*Math.sin(xx*.8),y:floor+.025+Math.pow(Math.sin(t*Math.PI),1.8)*crest};};for(let band=0;band<12;band++){const p=[point(x,band),point(nx,band),point(x,band+1),point(nx,band+1)];ridgeColor.set('#b9aa8a');for(const k of [0,2,1,1,2,3]){b.positions.push(p[k].x,p[k].y,p[k].z);b.colors.push(ridgeColor.r,ridgeColor.g,ridgeColor.b);}}}

 const mesh=b.finish(root);for(const geometry of [rock,box,stem,cap,disc,log,leaf])geometry.dispose();return {mesh,water:waterRoot,gorge};
}
export class RouteView{
 constructor(root){this.items=new Map();this.anchors=new Map();const rock=new T.DodecahedronGeometry(1,0),log=new T.CylinderGeometry(1,1,1,10),cap=new T.CylinderGeometry(1,1,1,10);
  for(const o of [...SUNNY.routeObstacles,...COAST_GATES.filter(g=>g.kind==='root')]){const group=new T.Group();group.position.set(o.x,sunnyHeight(o.x,o.z),o.z);root.add(group);const b=new ScenicBatch();
   if(o.kind==='root'||o.id==='routeRoots'){
    // Windklippen-Wurzeln: Die Kollision sperrt die ganze Terrassenbreite hinter z=-36, darum zieht sich die Wand
    // zweifach gekachelt von Kante zu Kante (Mitte x=64), nicht gedreht. Saugkante und Sperre bleiben unverändert.
    const wind=o.id==='routeWindRoots',kw=wind?.76:1,tiles=wind?[-4.2,4.2]:[0],stumpX=wind?8.4:6.1;if(wind)group.position.set(64,sunnyHeight(64,o.z),o.z);else group.rotation.y=.65;
    // Neugestaltung: verflochtene Wurzelwand statt flacher Matte, damit die Sperre klar lesbar ist.
    // Gleiche Breite wie die Kollisionssperre (-5,5 … 5,5), nur Darstellung.
    const bark=['#5b3d26','#6e4a2e','#7d5636','#4f3522'],knob=new T.SphereGeometry(1,7,5);
    for(const ox of tiles){
    // Dicke Bögen, die aus dem Boden wachsen und wieder einsinken.
    for(let i=0;i<7;i++){
     const start=ox+(-5.6+i*1.45+Math.sin(i*2.3)*.35)*kw,span=(3.2+Math.sin(i*1.7)*.8)*kw,peak=.85+(i%3)*.22,dz=Math.sin(i*1.3)*.35;
     const pts=[new T.Vector3(start,-.15,dz-.2),new T.Vector3(start+span*.18,peak*.75,dz+.1),new T.Vector3(start+span*.5,peak,dz-.15),new T.Vector3(start+span*.82,peak*.7,dz+.2),new T.Vector3(start+span,-.15,dz-.1)];
     const tube=new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.15+(i%3)*.05,7,false);b.add(tube,bark[i%4]);tube.dispose();
     b.add(knob,bark[(i+1)%4],pts[2].x,pts[2].y,pts[2].z,.22,.2,.22);
    }
    // Verflochtene Wurzelstränge in Wellen, sie füllen die Wand bis etwa 1,3 m Höhe.
    for(let i=0;i<10;i++){
     const pts=[],z0=(i%2?.18:-.18)+Math.sin(i*1.9)*.12,h=.35+(i%5)*.18;
     for(let k=0;k<=12;k++){const x=ox+(-5.5+k*(11/12))*kw;pts.push(new T.Vector3(x,Math.max(.04,h+Math.sin(k*1.25+i*1.7)*.32+Math.sin(k*.5+i)*.12),z0+Math.sin(k*1.6+i)*.22));}
     const tube=new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.07+(i%3)*.025,6,false);b.add(tube,bark[(i+2)%4]);tube.dispose();
    }
    // Senkrechte Wurzelschlaufen wie Pfähle, damit die Wand von oben dicht wirkt.
    for(let i=0;i<14;i++){
     const x=ox+(-5.1+i*.78+Math.sin(i*3.1)*.2)*kw,top=.9+Math.sin(i*2.1)*.35,z=Math.sin(i*1.4)*.25;
     const pts=[new T.Vector3(x-.15,-.1,z-.12),new T.Vector3(x+.05,top*.55,z+.08),new T.Vector3(x-.05,top,z),new T.Vector3(x+.25,top*.8,z+.15)];
     const tube=new T.TubeGeometry(new T.CatmullRomCurve3(pts),10,.055+(i%2)*.02,5,false);b.add(tube,bark[i%4]);tube.dispose();
    }
    // Dunkle aufgewühlte Erde unter der Sperre.
    b.add(rock,'#4a3523',ox,-.05,0,6.1*kw,.55,1.25,0,0,0);b.add(rock,'#5a3f28',ox+.3,.12,.1,4.6*kw,.5,.95,0,.2,0);
    // Bögen quer zum Weg: von oben sichtbare Schlaufen, die den Durchgang versperren.
    for(let i=0;i<12;i++){
     const x=ox+(-5+i*.9+Math.sin(i*2.7)*.18)*kw,h=.95+(i%3)*.25,w=1.15+(i%2)*.35,tilt=Math.sin(i*1.9)*.25;
     const pts=[new T.Vector3(x-tilt,-.12,-w),new T.Vector3(x-tilt*.4,h*.8,-w*.45),new T.Vector3(x,h,0),new T.Vector3(x+tilt*.4,h*.8,w*.45),new T.Vector3(x+tilt,-.12,w)];
     const tube=new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.08+(i%3)*.03,6,false);b.add(tube,bark[(i+3)%4]);tube.dispose();
    }
    }
    // Knorrige Stümpfe an beiden Enden, aus denen die Wurzeln wachsen.
    const trunk=new T.CylinderGeometry(.55,.85,1,8);
    for(const side of [-1,1]){
     const sx=side*stumpX;b.add(trunk,'#5e4029',sx,.55,0,1,1.1,1,0,side,0);b.add(knob,'#4f3522',sx,1.12,0,.62,.2,.62);
     for(let k=0;k<6;k++){const a=k/6*Math.PI*2+side,pts=[new T.Vector3(sx+Math.cos(a)*.5,.5,Math.sin(a)*.5),new T.Vector3(sx+Math.cos(a)*1.05,.18,Math.sin(a)*1.05),new T.Vector3(sx+Math.cos(a)*1.6,-.1,Math.sin(a)*1.5)];const tube=new T.TubeGeometry(new T.CatmullRomCurve3(pts),8,.13,6,false);b.add(tube,bark[k%4]);tube.dispose();}
    }
    trunk.dispose();
    // Erdhügel und Steine an beiden Enden und in der Mitte.
    for(const [x,s]of [[-stumpX+.5,1.1],[stumpX-.5,1.05],[-.4,.7],...(wind?[[-4.6,.8],[4.1,.75]]:[])]){b.add(rock,'#5c4330',x,.05,0,s*1.1,s*.45,s*.8,0,x,0);b.add(rock,'#7b7f86',x+(x<0?.6:-.6),.18,.35,s*.42,s*.36,s*.38,.4,x*2,0);}
    // Moos und Laub auf den Wurzeln.
    const moss=autumnLeafGeometry();
    for(const ox of tiles)for(let i=0;i<70;i++){const x=ox+(-5.2+((i*37)%104)/10)*kw,y=.55+((i*13)%9)/10,z=((i*7)%5-2)*.12;b.add(moss,['#6f9a36','#86ad3e','#5b8a2e','#c98a3a'][i%4],x,y,z,1.5,1.5,1.5,.6*Math.sin(i),i*.9,.5*Math.cos(i));}
    moss.dispose();knob.dispose();
   }
   else{const leaf=autumnLeafGeometry();for(let i=0;i<500;i++){const a=i*2.399,r=Math.sqrt((i+.5)/500),x=Math.sin(a)*r*1.8,z=Math.cos(a)*r*3,y=.12+1.15*(1-r*r)+.12*Math.sin(i*1.7);b.add(leaf,['#a87d48','#c5a45d','#9ca15a','#c88f47'][i%4],x,y,z,1.4,1.4,1.4,.3*Math.sin(i),a,.4*Math.cos(i));}leaf.dispose();}
   b.finish(group);this.items.set(o.id,group);
  }
  for(const a of [...SUNNY.anchors,...COAST_ANCHORS]){const group=new T.Group();group.position.set(a.x,a.y??sunnyHeight(a.x,a.z),a.z);root.add(group);const lift=a.rank>=3,b=new ScenicBatch();if(lift){b.add(rock,'#667f83',0,.48,0,.45,.72,.36);for(const side of [-1,1])b.add(log,'#8ba8aa',side*.26,.84,0,.07,.65,.07,0,0,-side*.48);}else{b.add(log,'#957651',0,.42,0,.12,.84,.12);b.add(rock,'#959b8b',0,.13,0,.4,.16,.38);}b.finish(group);const ring=new T.Mesh(lift?new T.ConeGeometry(.24,.38,4):new T.TorusGeometry(.27,.065,8,24),new T.MeshStandardMaterial({color:lift?'#a2e3dc':'#d6bc78',emissive:lift?'#85dace':'#d6bc78',emissiveIntensity:.12,roughness:.55}));ring.position.y=lift?1.25:.98;group.add(ring);group.userData.anchorKind=lift?'lift':'crossing';this.anchors.set(a.id,{group,ring});}
  for(const geometry of [rock,log,cap])geometry.dispose();
 }
 update(s){for(const o of s.obstacles){const group=this.items.get(o.id);if(!group)continue;group.visible=!o.cleared;group.scale.y=1-o.progress*.8;group.rotation.z=o.progress?Math.sin(s.time*25)*.025*o.progress:0;}for(const [id,a]of this.anchors){const active=s.testWorld.targetAnchor===id;a.ring.material.emissiveIntensity=active?1.3:.12;a.ring.scale.setScalar(active?1.12:1);}}
}
