import {coastCaustics,coastRockGeometry} from './coast-reference-assets.mjs';
import {shadeTexture,cozyLeafGeometry} from './cozy-assets.mjs';
import * as T from './vendor/three.module.js';
import {ScenicBatch} from './scenic-geometry.mjs';
import {COAST,coastShore,coastHeight,coastRiver,CAVE_WALLS,COAST_GATES,COAST_WIND_TREES,WIND_POOL,windLower,windUpper,windContour,reefLand,reefDistance,reefHeight} from './coast-area.mjs';
// Authored compositions, not scatter: each anchor is a deliberately placed vignette.
export const COAST_VIGNETTES=[
 {name:'Beckengarten West',x:71,z:9,size:.65},{name:'Beckengarten Ost',x:77,z:14,size:.6},{name:'Lagunenbüsche',x:66,z:16,size:.8},{name:'Süddüne',x:76,z:21,size:.6},{name:'Westlicher Dünengarten',x:54,z:-5,size:1.7},{name:'Buchtenhang',x:61,z:2,size:1.3},{name:'Südlicher Strandhafer',x:60,z:20,size:1.5},{name:'Salzwiese',x:68,z:-3,size:1.1},{name:'Muschelsaum',x:75,z:3,size:1.2},{name:'Mündungshang',x:56,z:-24,size:1.3},{name:'Heller Felsgarten',x:68,z:-17,size:1.2},{name:'Ankunftsdüne',x:49,z:1,size:1.4},{name:'Palmenmulde',x:56,z:9,size:1.2},{name:'Sichelbucht',x:64,z:17,size:1.1},
 {name:'Winddüne',x:61,z:-13,size:1.6},{name:'Muschelbank',x:73,z:-9,size:.9},{name:'Lagunenrand',x:68,z:9,size:1.1},
 {name:'Mündungsschilf',x:63,z:-24,size:1.2},{name:'Felsnase',x:73,z:-21,size:1.2},{name:'Salzgras',x:53,z:20,size:1.5},
 {name:'Klippenfuß',x:52,z:-33,size:1.3},{name:'Windterrasse West',x:61.5,z:-42.5,size:.75},{name:'Windterrasse Ost',x:75,z:-48,size:.8},{name:'Nordbucht',x:67,z:-37,size:1.1},{name:'Beckensteg',x:76,z:21,size:.9}
];
// Neugestaltung: steile Flächen werden zu blaugrauen Steinschichten mit Fugen und Moosflecken
// (wie die Schlucht). Erwartet cliffP (Weltposition) und cliffNy (Normalen-y); Farben linear.
export const CLIFF_SLAB_GLSL=`
  float cliffSteep=1.-smoothstep(.5,.78,cliffNy);
  float cliffLayer=cliffP.y*1.05+sin(cliffP.x*.37+cliffP.z*.31)*.55+sin(cliffP.x*1.3-cliffP.z*.9)*.12,cliffBand=floor(cliffLayer),cliffLf=fract(cliffLayer);
  float cliffJ=(cliffP.x+cliffP.z)*.42+cliffBand*.61+sin(cliffP.y*2.3+cliffBand)*.15,cliffJv=fract(cliffJ);
  float cliffHash=fract(sin(cliffBand*91.7+floor(cliffJ)*13.1)*4375.5);
  vec3 cliffSlab=mix(vec3(.2,.24,.29),vec3(.34,.38,.43),cliffHash);
  cliffSlab*=1.+.16*(cliffLf-.5)+.05*sin(cliffP.x*3.1+cliffP.z*2.7);
  float cliffSeam=max(1.-smoothstep(0.,.06,cliffLf),(1.-smoothstep(0.,.03,min(cliffJv,1.-cliffJv)))*step(.35,cliffHash));
  cliffSlab*=1.-cliffSeam*.24;
  float cliffMoss=sin(cliffP.x*1.3+sin(cliffP.z*1.1)*1.5)*sin(cliffP.z*1.7+cliffP.y*.9);
  cliffSlab=mix(cliffSlab,vec3(.12,.25,.05)*(.85+.3*cliffHash),smoothstep(.5,.85,cliffMoss)*.8);
  diffuseColor.rgb=mix(diffuseColor.rgb,cliffSlab,cliffSteep);
`;
const offsets=[[-.9,.2],[-.45,-.58],[.05,.4],[.58,-.22],[1,.57],[-1.3,-.55],[.38,.98],[1.35,-.65],[-.7,1.1]];
export function configureCoastWater(material,time,pool=null){material.onBeforeCompile=shader=>{shader.uniforms.coastTime=time;shader.uniforms.coastCaustics={value:coastCaustics()};shader.uniforms.waterPool={value:new T.Vector4(pool?.x??0,pool?.z??0,pool?.rx??0,pool?.rz??0)};shader.vertexShader='uniform float coastTime;varying vec2 coastXZ;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(position.x*.32+coastTime*.75)*.025+sin(position.y*.43-coastTime*.55)*.018;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ncoastXZ=(modelMatrix*vec4(transformed,1.)).xz;');shader.fragmentShader='uniform float coastTime;uniform sampler2D coastCaustics;uniform vec4 waterPool;varying vec2 coastXZ;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float shore=79.+2.5*sin(coastXZ.y*.12)+1.3*sin(coastXZ.y*.31);
 float d=max(0.,coastXZ.x-shore);float reef=length((coastXZ-vec2(99.,11.))/vec2(16.,14.));
 if(waterPool.z>0.)d=max(0.,(1.-length((coastXZ-waterPool.xy)/waterPool.zw))*min(waterPool.z,waterPool.w));
 float shallow=max(1.-smoothstep(0.,12.,d),1.-smoothstep(.7,1.8,reef));
 vec2 drift=vec2(sin(coastXZ.y*1.7+sin(coastXZ.x*.6)+coastTime*.4),cos(coastXZ.x*1.8+sin(coastXZ.y*.8)-coastTime*.3))*.07;
 float cells=texture2D(coastCaustics,coastXZ/5.+drift+vec2(coastTime*.003,0.)).b;
 float cells2=texture2D(coastCaustics,coastXZ/9.-drift*.7).b;
 /* Neugestaltung: leuchtenderes Türkis im Flachwasser, kräftiges Blau in der Tiefe */diffuseColor.rgb=mix(vec3(.006,.12,.3),vec3(.025,.38,.46),shallow);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.05,.52,.5),(1.-smoothstep(0.,3.,d))*.45);
 diffuseColor.rgb+=vec3(.2,.32,.26)*(smoothstep(.1,.45,cells)*.16+smoothstep(.15,.5,cells2)*.09)*(.35+.65*shallow);
 float wash=.5+.42*sin(coastTime*.65+coastXZ.y*.16),lace=texture2D(coastCaustics,coastXZ/2.8+vec2(coastTime*.008,-coastTime*.012)).b;
 float foam=(1.-smoothstep(.12,.85,abs(d-wash)))*(.38+.62*lace);
 foam=max(foam,(1.-smoothstep(.04,.18,d))*.72);if(waterPool.z<=0.)foam*=smoothstep(-36.,-31.,coastXZ.y);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.98,.90),foam*.88);
 `);};material.customProgramCacheKey=()=> 'coast-soft-water-redesign';}

function beam(b,g,color,a,c,r){const p=new T.Vector3(...a),q=new T.Vector3(...c),mid=p.clone().add(q).multiplyScalar(.5),rotation=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),q.clone().sub(p).normalize()));b.add(g,color,mid.x,mid.y,mid.z,r,p.distanceTo(q),r,rotation.x,rotation.y,rotation.z);}
export class CoastPolish{
 constructor(root){this.root=new T.Group();root.add(this.root);this.time={value:0};this.gates=new Map();const bushCore=new T.IcosahedronGeometry(1,0),coastalLeaf=cozyLeafGeometry(),stone=coastRockGeometry(),sphere=new T.SphereGeometry(1,9,6),twig=new T.CylinderGeometry(1,1,1,6),leaf=new T.ConeGeometry(.045,.8,3),staticArt=new ScenicBatch({smooth:true}),plants=new ScenicBatch();
 // Warm limestone islands: low rubble and large asymmetric silhouettes share colour families.
 const formations=[[60,20,1.4,1.1],[66,22,1,.7],[73,-16,1.3,1.4],[77,-12,.8,.55],[65,-38,2,2.8],[69,-38,1.1,1.5],[55,-36,1.7,2.4],[76,7,.9,.7],[71,20,1.2,.65]];
 for(const [x,z,r,h]of formations){const y=coastHeight(x,z);staticArt.add(stone,'#838d98',x,y+h*.43,z,r,h*.65,r*.75,.09,x*.6,.16);staticArt.add(stone,'#97a0a8',x-r*.42,y+h*.28,z+.27,r*.69,h*.37,r*.55,.12,z,.2);for(const [dx,dz]of offsets.slice(0,4))staticArt.add(stone,'#8f98a2',x+dx*r,y+.07,z+dz*r,r*.13,.12,r*.1,0,dx,0);}
 for(const v of COAST_VIGNETTES){for(const [i,[dx,dz]]of offsets.entries()){const x=v.x+dx*v.size,z=v.z+dz*v.size,y=coastHeight(x,z);for(let j=0;j<5;j++)plants.add(leaf,['#a4ae77','#bbba83','#819e70'][i%3],x+Math.sin(j*2.4)*.13,y+.3,z+Math.cos(j*2.4)*.13,1,.9+(i%3)*.3,1,.17,j*2.4,.15);if(i===1||i===4||i===6){/* Neugestaltung: dichte Buschkuppel mit dunklem Kern und Hell-Dunkel-Abstufung statt flacher Sternblätter */staticArt.add(bushCore,'#2f5226',x,y+.42,z,.5,.4,.5,0,0,0);for(let k=0;k<38;k++){const a=k*2.399,u=(k+.5)/38,phi=Math.acos(1-u*1.15),rr=.52,dx=Math.sin(phi)*Math.sin(a),dy=Math.cos(phi),dz=Math.sin(phi)*Math.cos(a),shade=Math.max(0,Math.min(1,.5+dy*.5+(Math.sin(k*1.7)*.12)));plants.add(coastalLeaf,shade>.8?(k%2?'#5a8f2c':'#6c9e31'):shade>.5?(k%2?'#3f7425':'#4a8029'):(k%2?'#2a4f1d':'#335c22'),x+dx*rr,y+.42+dy*rr*.8,z+dz*rr,.42,.72,.54,-.5+dy*.6+(k%3)*.15,a,.2*Math.sin(k));}staticArt.add(stone,'#bbae8d',x+.32,y+.04,z+.3,.16,.1,.14,.1,i,.1);}}}
 // Pools have their own miniature gardens; no flower-shaped unsuckable props.
 for(const [x,z]of [[74,12],[78,19],[69,17]])for(const [i,[dx,dz]]of offsets.entries()){if(dx<-.3)continue;/* Landseite der Becken frei lassen */const px=x+dx*2.2,pz=z+dz*1.5,y=coastHeight(px,pz);staticArt.add(stone,i%2?'#9baea1':'#c0c7ad',px,y+.12,pz,.3+(i%3)*.1,.22,.27,0,i,.08);for(let j=0;j<3;j++)plants.add(leaf,'#709b87',px+.1*j,y+.2,pz,1,.45,1,.2,j,0);}
 // A dark, recessed cave mouth framed by a low irregular natural rock arch.
 const ridgeRock=new T.IcosahedronGeometry(1,1),cliffArt=new ScenicBatch();
 const cy=coastHeight(50,-20.4);this.caveRoof=new T.Group();this.root.add(this.caveRoof);const shape=new T.Shape();shape.moveTo(-4.4,-.4);shape.lineTo(-4.6,1.2);shape.lineTo(-4.1,2.7);shape.lineTo(-3.3,3.5);shape.lineTo(-1.8,3.9);shape.lineTo(0,3.65);shape.lineTo(1.8,4);shape.lineTo(3.3,3.45);shape.lineTo(4.25,2.65);shape.lineTo(4.5,1.1);shape.lineTo(4.3,-.4);shape.closePath();const hole=new T.Path();hole.moveTo(-1.95,-.45);hole.lineTo(-1.95,.95);hole.bezierCurveTo(-1.95,2.05,-1.15,2.65,0,2.65);hole.bezierCurveTo(1.15,2.65,1.95,2.05,1.95,.95);hole.lineTo(1.95,-.45);hole.closePath();shape.holes.push(hole);const archGeometry=new T.ExtrudeGeometry(shape,{depth:1.1,bevelEnabled:true,bevelSize:.16,bevelThickness:.12,bevelSegments:2,curveSegments:12});const ap=archGeometry.attributes.position;for(let i=0;i<ap.count;i++){const x=ap.getX(i),y=ap.getY(i),z=ap.getZ(i),outer=Math.max(0,Math.min(1,(Math.abs(x)-1.9)*.65+(y-2.55)*.4));ap.setXYZ(i,x+outer*(.16*Math.sin(y*4+x*3)),y+outer*(.16*Math.sin(x*3+y*2)),z+outer*.15*Math.sin(x*3+y*4));}archGeometry.computeVertexNormals();const arch=new T.Mesh(archGeometry,new T.MeshStandardMaterial({color:'#667c77',roughness:1}));arch.position.set(50,cy,-21.7);arch.castShadow=true;arch.visible=false;this.caveRoof.add(arch);const mouth=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshBasicMaterial({color:'#172d2a',side:T.DoubleSide}));mouth.position.set(50,cy+1.05,-21.62);mouth.scale.set(2.02,1.72,1);this.root.add(mouth);this.caveArch=mouth;
 // Interlocking ledges break up the opening's silhouette, leaving its centre clear.
 for(const [x,y,z,rx,ry,rz,rot] of [[45.8,1.35,-21.1,1.65,2.1,1.35,.2],[47.4,3.15,-21.7,2.45,.72,1.5,-.18],[50.3,3.45,-21.8,2.75,.66,1.55,.08],[53,3.1,-21.8,2.1,.85,1.4,-.08],[54,1.5,-21.2,1.65,2.05,1.25,-.2],[44.7,.45,-20.7,.85,.65,.8,.2],[55.1,.45,-20.8,.9,.7,.75,-.2]]){
  /* Neugestaltung: blaugraue Felsen mit Moosdecke statt einheitlich grüngrauer Klumpen */cliffArt.add(ridgeRock,['#7f8994','#8f99a3','#717c88','#86909b'][Math.round(x*3)%4],x,cy+y,z,rx,ry,rz,.08,rot,.08);if(y>2.5)cliffArt.add(ridgeRock,Math.round(x)%2?'#5f8a34':'#6f9a3a',x-rx*.15,cy+y+ry*.72,z-.15,rx*.5,ry*.16,rz*.55,.05,rot+.6,.05);
 }
 for(const [x,z]of [[46.3,-20],[53.7,-20],[48,-21.2],[52,-21.2]])for(let j=0;j<12;j++){const py=cy+3.8-j*.19,px=x+Math.sin(j*.8)*.12;beam(staticArt,twig,'#647d55',[px,py,z],[px+.03,py-.2,z],.018);plants.add(coastalLeaf,j%2?'#789958':'#9bae6c',px+.09,py,z,.23,.45,.28,.6,j,.2);}
 // Broken rock shelves connect the cave to the raised river bank. The opening
 // and bridge deck stay clear; these details sit behind the walkable areas.
 for(const [x,z,y,rx,ry,rz] of [
  [44.8,-24.1,.85,2.6,.65,1.8],[48.4,-24.7,1.35,3.3,.45,1.8],
  [52.8,-24.8,1.3,3,.55,1.6],[55.7,-25,.75,1.6,.7,1.4]
 ]){
  cliffArt.add(ridgeRock,'#8a939d',x,y,z,rx,ry,rz,.08,x*.16,.09);
  if(Math.round(x)%3!==0)for(let j=0;j<11;j++){const a=j*2.399,r=.25+(j%5)*.11;plants.add(coastalLeaf,j%3?'#678c58':'#9caf69',x+Math.sin(a)*r,y+ry*.85+.12,z+Math.cos(a)*r,.34,.48,.4,.35,a,.2);}
 }
 // Small light flecks at the foot of the cascade, with no extra lights.
 const fall=coastRiver(58.9);
 for(let i=0;i<19;i++){const a=i*2.399,r=.25+(i%5)*.17;
  staticArt.add(sphere,i%3?'#cae5d9':'#e4f1e5',59.1+Math.sin(a)*r,fall.water+.08+(i%3)*.04,fall.z+Math.cos(a)*Math.min(fall.half*.8,r*2),.18+(i%3)*.06,.07,.2+(i%4)*.05);
 }
 const floor=new T.Mesh(new T.CircleGeometry(1,36),new T.MeshStandardMaterial({color:'#878f81',roughness:1}));floor.rotation.x=-Math.PI/2;floor.scale.set(6.5,3.3,1);floor.position.set(50,coastHeight(50,-24)+.035,-24);floor.visible=false;this.root.add(floor);
 for(const gate of COAST_GATES.filter(g=>g.rockGate)){const mesh=new T.Mesh(ridgeRock.clone(),new T.MeshStandardMaterial({color:gate.rockGate===3?'#8a96a0':'#7a848f',roughness:.95,flatShading:true}));mesh.scale.set(gate.gateWidth??gate.gateRadius,1.6,1);mesh.position.set(gate.x,coastHeight(gate.x,gate.z)+1.2,gate.z);mesh.castShadow=true;this.root.add(mesh);this.gates.set(gate.id,{mesh,gate});}
 // Layered rock under the existing causeway reads as a natural stone crossing.
 for(const [x,z,r]of [[82,5.3,1.6],[84.5,5.7,1.8],[87,6.1,1.5]]){const y=coastHeight(x,z);staticArt.add(stone,'#b2a084',x,y-.65,z,r,.72,.95,.03,x,.05);staticArt.add(stone,'#c3b08e',x+.15,y-.28,z,r*.92,.3,.92,.01,z,.03);}
 // A sculpted coral island and its narrow flooded limestone causeway.
 const rp=[],rc=[],ri=[],sand=new T.Color('#e5d7aa'),reef=new T.Color('#91c2ad'),color=new T.Color();
 const vertex=(x,z)=>{rp.push(x,reefHeight(x,z)+.025,z);color.copy(sand).lerp(reef,Math.max(0,Math.min(1,(reefDistance(x,z)-.65)*1.8)));rc.push(color.r,color.g,color.b);return rp.length/3-1;};
 // Clip each edge against a continuous contour, rather than dropping entire square cells.
 const clip=poly=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=reefDistance(a.x,a.z)-1.18,db=reefDistance(b.x,b.z)-1.18;if(da<=0)out.push(a);if((da<0)!==(db<0)){const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}return out;};
 for(let j=0;j<56;j++)for(let i=0;i<100;i++){const x=78+i*.4,z=-1+j*.45,poly=clip([{x,z},{x,z:z+.45},{x:x+.4,z:z+.45},{x:x+.4,z}]);if(poly.length<3)continue;const ids=poly.map(p=>vertex(p.x,p.z));for(let k=1;k<ids.length-1;k++)ri.push(ids[0],ids[k],ids[k+1]);}
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rp,3));rg.setAttribute('color',new T.Float32BufferAttribute(rc,3));rg.setIndex(ri);rg.computeVertexNormals();const reefFloor=new T.Mesh(rg,new T.MeshStandardMaterial({vertexColors:true,roughness:.9}));reefFloor.receiveShadow=true;this.root.add(reefFloor);
 for(const [i,[x,z]]of [[92,8],[94,15],[99,5],[105,10],[101,18],[109,14]].entries()){const y=coastHeight(x,z);staticArt.add(stone,'#b8c9b2',x,y+.15,z,.8,.35,.55,0,i,.12);for(let j=0;j<6;j++){const a=j*2.4,px=x+Math.sin(a)*.6,pz=z+Math.cos(a)*.6,h=.35+(j%3)*.15,c=['#d78e8c','#dca88a','#a1b9cb'][i%3];beam(staticArt,twig,c,[px,y,pz],[px+.08,y+h,pz],.045);beam(staticArt,twig,c,[px+.05,y+h*.6,pz],[px-.12,y+h*.9,pz+.09],.033);beam(staticArt,twig,c,[px+.05,y+h*.65,pz],[px+.19,y+h*.9,pz-.06],.03);}}
 // Larger reef compositions frame the clear sandy walking channels.
 for(const [i,[x,z,r]]of [[88,11,1.1],[94,2,1.6],[106,3.5,1.4],[111,12,1.8],[105,19,1.6],[91,18,1.3]].entries()){const y=reefHeight(x,z);staticArt.add(stone,'#a1bfb0',x,y+.2,z,r,.45,r*.68,.1,i,.1);for(let j=0;j<7;j++){const a=j*2.399,px=x+offsets[j][0]*r*.63,pz=z+offsets[(j+i)%offsets.length][1]*r*.6,h=.35+((j*3+i)%5)*.16,c=['#ce8d9a','#b09cbd','#dfab7c'][i%3];beam(staticArt,twig,c,[px,y,pz],[px+Math.sin(a)*.15,y+h,pz+Math.cos(a)*.15],.065);for(const side of [-1,1]){beam(staticArt,twig,c,[px,y+h*.5,pz],[px+side*.23,y+h*.9,pz+.08],.042);staticArt.add(sphere,c,px+side*.23,y+h*.94,pz+.08,.09,.12,.09);}staticArt.add(sphere,c,px+Math.sin(a)*.15,y+h,pz+Math.cos(a)*.15,.1,.13,.1);}}
 // Separate radial terrace meshes give the skyline a continuous, weathered silhouette.
 for(const [tier,cx,cz,rx,rz]of [[0,64,-43,13,10],[1,53,-47,8.5,7.2]]){const p=[],colors=[],ids=[],col=new T.Color(),segments=96,rings=30;for(let j=0;j<=rings+8;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,r=(j<=rings?j/rings:1+(j-rings)*.028)*windContour(a),x=cx+Math.cos(a)*rx*r,z0=cz+Math.sin(a)*rz*r,z=z0>-33?-33+(z0+33)*.12:z0,top=tier?6.2+.13*Math.sin(x*.4+z*.3):-.6+Math.max(0,Math.min(8,-z-32))*.34,edge=j>rings?Math.sin((j-rings)/8*Math.PI/2):0,y=top*(1-edge)+(tier?2.02:COAST.sea-.5)*edge+(edge>0?Math.sin(a*11+Math.sin(a*3)*2)*.24*edge:0);p.push(x,y+.035,z);/* Neugestaltung: grüne Terrassenkrone, Moosrand, blaugraue Wand */col.set(j>rings?(j===rings+1?'#6f9440':'#8f99a3'):tier?'#86a44c':'#7d9f45').multiplyScalar(.97+.025*Math.sin(x*.7+z*.6));colors.push(col.r,col.g,col.b);if(j<=rings+7&&i<segments){const q=j*(segments+1)+i;ids.push(q,q+1,q+segments+1,q+1,q+segments+2,q+segments+1);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(ids);geo.computeVertexNormals();const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 cliffWorld;varying float cliffNormalY;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncliffWorld=transformed;cliffNormalY=abs(objectNormal.y);');shader.fragmentShader='varying vec3 cliffWorld;varying float cliffNormalY;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat naturalGrain=fract(sin(dot(floor(cliffWorld.xz*3.),vec2(127.1,311.7)))*43758.5453);diffuseColor.rgb*=.97+naturalGrain*.05;/* Neugestaltung: ruhige gemalte Grasfelder auf der Terrassenkrone */vec2 tq=cliffWorld.xz;float tf=sin(tq.x*.33+sin(tq.y*.29)*1.6)*sin(tq.y*.41-sin(tq.x*.23)*1.2);diffuseColor.rgb*=mix(vec3(.9,.92,.86),vec3(1.06,1.05,.98),smoothstep(-.35,.35,tf));vec3 cliffP=cliffWorld;float cliffNy=cliffNormalY;'+CLIFF_SLAB_GLSL);};material.customProgramCacheKey=()=> 'weathered-cliff-redesign';const mesh=new T.Mesh(geo,material);mesh.receiveShadow=true;this.root.add(mesh);}
 for(const [x,z,y,r,h]of [[76,-43,.3,1.4,2],[72,-50,.2,1.8,2.1],[64,-52,.3,1.6,2],[58,-49,.2,1.1,1.8],[59,-48,3.8,1.2,1.9],[53,-52,3.9,1.4,1.8],[47,-46,4,1.1,1.7]]){staticArt.add(stone,'#8e9e96',x,y,z,r,h,r*.8,.18,x*.7,.1);staticArt.add(stone,'#b0b7a3',x-.3,y+h*.6,z+.2,r*.7,.35,r*.55,.1,z,.12);}
 for(const [x,z,r]of [[72,-39,1.2],[68,-50,1.5],[59,-50,1],[58,-38,.8],[51,-50,.9],[48,-45,1.1],[55,-43,.65],[74,-45,1.4]]){const y=coastHeight(x,z);staticArt.add(stone,'#a4b2a0',x,y+.2,z,r,.6,r*.7,.1,x,.17);staticArt.add(stone,'#c0c4a5',x+.5*r,y+.1,z+.3*r,r*.6,.3,r*.5,.1,z,.2);}
 // Tufts soften the plateau without adding collision objects to the walking route.
 for(const [cx,cz] of [[63,-45],[67,-39],[72,-44],[57,-47],[49,-46]]){
  const y=coastHeight(cx,cz);
  for(let j=0;j<19;j++){const a=j*2.399,r=.12+(j%7)*.11;plants.add(coastalLeaf,j%3?'#71935f':'#a5ad73',cx+Math.sin(a)*r,y+.12+(j%3)*.04,cz+Math.cos(a)*r,.27,.42,.3,.35,a,.18);}
 } for(const [cx,cz]of [[62,-39],[68,-40],[70,-46],[61,-47],[65,-50],[55,-48],[50,-46],[53,-43]])for(const [i,[dx,dz]]of offsets.entries()){const x=cx+dx,z=cz+dz,y=coastHeight(x,z);for(let j=0;j<5;j++)plants.add(leaf,['#8c9e73','#acb48a','#779574'][i%3],x+Math.sin(j*2.4)*.12,y+.18,z+Math.cos(j*2.4)*.12,1,.6,1,.28,j*2.4,.2);if(i===1||i===5)staticArt.add(sphere,'#839c79',x,y+.2,z,.35,.22,.3);}
 // Small rocky gardens on the broad upper slopes leave the approach and anchor landing clear.
 for(const [cx,cz,size]of [[71,-44,1.4],[66,-48,1.15],[60,-43,.9],[56,-50,.8],[74,-40,.8],[63,-39,.7]]){const y=coastHeight(cx,cz);staticArt.add(stone,'#aab1a1',cx,y+.13,cz,size*.7,.26,size*.5,.12,cx,.08);staticArt.add(stone,'#879a8c',cx+size*.7,y+.12,cz+.3,size*.34,.2,size*.3,.07,cz,.1);for(let i=0;i<24;i++){const a=i*2.399,r=.2+(i%5)*.09,x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r;plants.add(coastalLeaf,i%3?'#658756':'#99a65c',x,y+.12+(i%4)*.08,z,.32,.65,.42,.2,a,.3);}}
 // Neugestaltung: kleiner Felsentümpel auf der unteren Terrasse mit Steinrand und Gras; das Seegras daran ist echt (material-plan-resources.mjs).
 {const {x,z,rx,rz}=WIND_POOL,y=coastHeight(x,z),pool=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshStandardMaterial({color:'#80bdb0',roughness:.3,side:T.DoubleSide}));pool.rotation.x=-Math.PI/2;pool.position.set(x,y+.06,z);pool.scale.set(rx,rz,1);configureCoastWater(pool.material,this.time,{x,z,rx,rz});this.root.add(pool);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+.15*Math.sin(i*3),px=x+Math.cos(a)*(rx+.1),pz=z+Math.sin(a)*(rz+.1);staticArt.add(stone,['#8f99a3','#7f8994','#a0a9b2'][i%3],px,y+.04,pz,.2+(i%3)*.06,.1+(i%2)*.05,.18,.1,a,.08);if(i%3===0)staticArt.add(stone,'#6f9a3a',px,y+.12,pz,.14,.03,.12,0,a,0);}
  for(let j=0;j<16;j++){const a=j*2.399,r=Math.max(rx,rz)+.55+(j%4)*.16,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r*.8;plants.add(coastalLeaf,j%3?'#71935f':'#a5ad73',px,y+.1,pz,.26,.4,.3,.35,a,.18);}}
 // Three low wind-shaped coastal trees on the upper plateau.
 for(const [x,z,h] of COAST_WIND_TREES){
  const y=coastHeight(x,z),lean=.48;
  beam(staticArt,twig,'#8d795d',[x,y,z],[x+lean,y+h*.78,z+.05],.11);
  beam(staticArt,twig,'#8d795d',[x+.2,y+h*.5,z],[x+.85,y+h*.9,z+.13],.065);
  for(let i=0;i<54;i++){const a=i*2.399,r=.12+Math.sqrt((i%18)/18)*.75,px=x+lean+Math.sin(a)*r,pz=z+Math.cos(a)*r*.65,py=y+h*.7+(i%9)*.08;
   plants.add(coastalLeaf,['#668959','#83a567','#a9b879'][i%3],px,py,pz,.5,.6,.55,-.3+(i%4)*.22,a,.16);
  }
 }
 this.grass=plants.finish(this.root);this.grass.castShadow=false;const uniform=this.time;this.grass.material.onBeforeCompile=shader=>{shader.uniforms.coastTime=uniform;shader.vertexShader='uniform float coastTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(coastTime*1.3+position.x*.8+position.z*.6)*.035;');};
 this.static=staticArt.finish(this.root);this.caveStone=cliffArt.finish(this.root);this.caveStone.material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 cliffWorld;varying float cliffNormalY;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncliffWorld=transformed;cliffNormalY=abs(objectNormal.y);');shader.fragmentShader='varying vec3 cliffWorld;varying float cliffNormalY;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec3 cliffP=cliffWorld;float cliffNy=cliffNormalY;'+CLIFF_SLAB_GLSL);};this.caveStone.material.customProgramCacheKey=()=> 'cave-stone-slab-redesign';
 const shadeSites=[[55,-14,2.5],[55,10,2.7],[62,-17,2.8],[65,1,2.8],[70,-10,2.4],...formations.map(([x,z,r])=>[x,z,r*1.5])],dummy=new T.Object3D();this.contactShade=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:shadeTexture(),color:'#758577',transparent:true,opacity:.19,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),shadeSites.length);for(const [i,[x,z,r]]of shadeSites.entries()){dummy.position.set(x,coastHeight(x,z)+.04,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(r,r*.72,1);dummy.updateMatrix();this.contactShade.setMatrixAt(i,dummy.matrix);}this.contactShade.instanceMatrix.needsUpdate=true;this.contactShade.frustumCulled=false;this.root.add(this.contactShade);
 const submerged=new ScenicBatch();for(const [i,[x,z,r]]of [[81,-11,1.2],[83,-8,1.6],[81,-3,1],[84,1,1.4],[82,13,1.2],[86,20,1.5],[86,1,1.2],[89,-2,1.1],[112,16,1.5]].entries()){submerged.add(stone,i%2?'#356f74':'#498b80',x,COAST.sea+.02,z,r,.035,r*.75,.0,i,0);submerged.add(stone,'#78aaa0',x+.6*r,COAST.sea+.025,z+.4*r,r*.5,.035,r*.4,0,i,0);}this.submerged=submerged.finish(this.root);this.submerged.castShadow=false;this.submerged.material=new T.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.26,depthWrite:false,roughness:.9});
 // A few authored creatures, reused geometries: three tiny crabs and four distant seabirds.
 this.crabs=[];for(const [x,z]of [[66,14],[73,-13],[71,18]]){const group=new T.Group(),b=new ScenicBatch(),y=coastHeight(x,z);b.add(sphere,'#bf8f69',0,.08,0,.14,.065,.12);for(const side of [-1,1])for(let j=0;j<3;j++)beam(b,twig,'#bd8865',[side*.1,.07,j*.06-.06],[side*.23,.02,j*.09-.09],.012);b.finish(group);group.position.set(x,y,z);this.root.add(group);this.crabs.push({group,x,z,y});}
 this.birds=[];for(let i=0;i<4;i++){const group=new T.Group(),body=new T.Mesh(sphere,new T.MeshStandardMaterial({color:'#ede9d4'}));body.scale.set(.13,.075,.2);group.add(body);const wings=[];for(const side of [-1,1]){const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(side*.62,-.12);shape.lineTo(side*.2,.1);const wing=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshStandardMaterial({color:'#e4e5d5',side:T.DoubleSide}));wing.rotation.x=-Math.PI/2;group.add(wing);wings.push(wing);}this.root.add(group);this.birds.push({group,wings,i});}
 for(const g of [coastalLeaf,stone,ridgeRock,sphere,twig,leaf])g.dispose();
 }
 update(s){this.time.value=s.time;for(const {mesh,gate}of this.gates.values()){const o=s.obstacles.find(o=>o.id===gate.id),elapsed=o?.cleared?s.time-(Number.isFinite(o.clearedAt)?o.clearedAt:s.time-2):0,t=o?.cleared?Math.min(1,elapsed/1.2):0;mesh.visible=!o?.cleared||t<1;mesh.position.y=coastHeight(gate.x,gate.z)+1.2-t*2.5;mesh.rotation.z=t*1.2;mesh.position.x=gate.x+t*2;}
 this.caveRoof.visible=true;this.caveArch.visible=true;
 for(const {group,x,z,y}of this.crabs){group.position.set(x+Math.sin(s.time*.35+x)*.25,y,z+Math.cos(s.time*.2+z)*.12);group.rotation.y=Math.sin(s.time*.35+x)*.3;}
 for(const {group,wings,i}of this.birds){const a=s.time*.035+i*.4;group.position.set(87+Math.sin(a)*13,3.4+Math.sin(a*2+i)*.4,-8+Math.cos(a)*17);group.rotation.y=a;wings.forEach((w,j)=>w.rotation.z=Math.sin(s.time*3.4+i)*.24*(j?1:-1));}
 }
}
