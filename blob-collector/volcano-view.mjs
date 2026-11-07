import * as T from './vendor/three.module.js';
import {ScenicBatch} from './scenic-geometry.mjs';
import {seeded} from './cozy-assets.mjs';
import {sunnyHeight,sunnyCore as sunnyInside} from './sunny-area.mjs';
import {VOLCANO_ZONES,VOLCANO_LAVA,VOLCANO_LAKE,VOLCANO_TRAIL,VOLCANO_SPRINGS,VOLCANO_PEAK,VOLCANO_GATES,VOLCANO_DEPOSITS,VOLCANO_ROCKS,VOLCANO_TREES,volcanoContour,volcanoHeight,volcanoRegion,volcanoTrailDistance,lavaDistance,lavaWidth,lakeRadius,VOLCANO_RIVER,VOLCANO_FLAGS} from './volcano-area.mjs';
// Neugestaltung Vulkan (Jakob 30.10., Bildvorlage): warmer dunkler Aschegrund, zähflüssiges Magma mit hellem Kern und
// Kruste, glühende Ufer und Felsrisse, Basaltsäulen, weicher Rauch. Keine neuen Lichter: alles Glühen ist Eigenleuchten,
// nur die vorhandenen Lichter werden im Gebiet warm getönt.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const hash=(a,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
function faceUp(g){g.computeVertexNormals();const n=g.attributes.normal;let sum=0;for(let i=0;i<n.count;i++)sum+=n.getY(i);if(sum<0){const idx=g.index.array;for(let i=0;i<idx.length;i+=3){const a=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=a;}g.index.needsUpdate=true;g.computeVertexNormals();}return g;}
// Magma: helle Adern und zähe Schlieren, dunkle Krustenschollen, roter Rand, nach innen immer heller.
const MAGMA_GLSL=`
 float mT=vTime,mIn=clamp(vInner,0.,1.);
 float mA=sin(q.x*.85+sin(q.y*.75+mT*.17)*2.1+mT*.26),mB=sin(q.y*1.25+sin(q.x*1.05-mT*.13)*1.9-mT*.19),mC=sin((q.x+q.y)*2.3+sin(q.x*1.7-q.y*1.3+mT*.21)*2.4);
 float mHeat=.34+.26*mA+.18*mB+.08*mC+mIn*.12;
 vec3 mCol=mix(vec3(.85,.09,.01),vec3(1.,.3,.02),smoothstep(.08,.42,mHeat));
 mCol=mix(mCol,vec3(1.,.58,.05),smoothstep(.38,.68,mHeat));
 mCol=mix(mCol,vec3(1.,.8,.24),smoothstep(.72,1.1,mHeat));
 mCol=mix(mCol,vec3(1.,.97,.7),smoothstep(1.,1.25,mHeat));
 float mPlate=sin(q.x*1.5+sin(q.y*1.4-mT*.06)*2.+mT*.05)*sin(q.y*1.7-sin(q.x*1.2+mT*.05)*1.8);
 float mCrust=smoothstep(.62,.8,mPlate)*(1.-smoothstep(.55,.95,mHeat));
 mCol=mix(mCol,vec3(.1,.025,.015),mCrust*.92);
 mCol=mix(vec3(.5,.03,.005),mCol,smoothstep(.8,.87,vRaw));
`;
// Gemalter Boden (Jakob 31.10., wie die Wiese): große ruhige Farbfelder, Krümel nur an den Feldgrenzen, wenige lange Risse.
// Kachelbar auf PAINT_TILE Metern. Rot = Farbton des Feldes, Grün = Riss (außen dunkel, im Kern Glut).
const PAINT_TILE=48;let paintedAsh=null;
function paintedAshTexture(){
 if(paintedAsh)return paintedAsh;
 const size=1024,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const g=canvas.getContext('2d'),r=seeded(7321),TAU=Math.PI*2,phase=[0,1,2,3,4].map(()=>r()*TAU);
 const field=(x,y)=>{const u=x/size*TAU,v=y/size*TAU;return .5+.2*Math.sin(2*u+v+phase[0])+.16*Math.sin(3*v-u+phase[1])+.1*Math.sin(4*u+3*v+phase[2])+.07*Math.sin(5*v-4*u+phase[3])+.05*Math.sin(7*u-2*v+phase[4]);};
 const LOW=.42,HIGH=.6,DARK=50,MID=128,RUST=217,img=g.createImageData(size,size),px=img.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const f=field(x,y),i=(y*size+x)*4,a=Math.min(1,Math.max(0,(f-LOW)/.008+.5)),b=Math.min(1,Math.max(0,(f-HIGH)/.008+.5));px[i]=DARK+(MID-DARK)*a+(RUST-MID)*b;px[i+3]=255;}
 g.putImageData(img,0,0);
 const wrap=(m,x,y,draw)=>{for(const ox of [-size,0,size])for(const oy of [-size,0,size])if(x+ox>-m&&x+ox<size+m&&y+oy>-m&&y+oy<size+m)draw(x+ox,y+oy);};
 // Krümel der einen Farbe greifen an der Feldgrenze ins Nachbarfeld.
 for(let i=0,n=0;i<70000&&n<2400;i++){const x=r()*size,y=r()*size,f=field(x,y),edge=Math.abs(f-LOW)<Math.abs(f-HIGH)?LOW:HIGH;if(Math.abs(f-edge)>.02)continue;n++;const tone=f>=edge?(edge===LOW?DARK:MID):(edge===LOW?MID:RUST),rx=2+r()*5,ry=rx*(.45+r()*.4),a=r()*TAU;g.fillStyle=`rgb(${tone},0,0)`;wrap(10,x,y,(px,py)=>{g.beginPath();g.ellipse(px,py,rx,ry,a,0,TAU);g.fill();});}
 // Wenige lange, geschwungene Risse mit Abzweigen, zu den Enden hin dünner.
 g.globalCompositeOperation='lighter';g.lineCap=g.lineJoin='round';
 const crack=(x,y,dir,steps,width)=>{const pts=[[x,y]];let d=dir;for(let k=0;k<steps;k++){d+=(r()-.5)*.9;x+=Math.cos(d)*(22+r()*20);y+=Math.sin(d)*(22+r()*20);pts.push([x,y]);if(width>3&&k>1&&k<steps-2&&r()<.22)crack(x,y,d+(r()<.5?-1:1)*(.6+r()*.5),3+Math.floor(r()*4),width*.55);}
  for(const [color,scale] of [['rgb(0,70,0)',2.2],['rgb(0,185,0)',1]])for(let k=1;k<pts.length;k++){const t=(k-.5)/(pts.length-1);g.strokeStyle=color;g.lineWidth=Math.max(.8,width*scale*Math.sin(Math.PI*t)**.6);for(const ox of [-size,0,size])for(const oy of [-size,0,size]){g.beginPath();g.moveTo(pts[k-1][0]+ox,pts[k-1][1]+oy);g.lineTo(pts[k][0]+ox,pts[k][1]+oy);g.stroke();}}};
 for(let i=0;i<11;i++)crack(r()*size,r()*size,r()*TAU,9+Math.floor(r()*9),4+r()*2.5);
 const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;t.colorSpace=T.NoColorSpace;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return paintedAsh=t;
}
// Vertexfarbe: r = Nähe zum Magma (Kante bei .8), g = erstarrter Weg, b = Gras/Waldboden am Übergang.
// Aschedecke über dem Nachbarboden am Pass: läuft mit ausgefranstem Rand aus (Vertexfarbe r = Dichte).
function ashDecalMaterial(night){const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});m.onBeforeCompile=shader=>{shader.uniforms.vCells={value:paintedAshTexture()};shader.uniforms.vNight=night;shader.vertexShader='varying vec3 vP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvP=transformed;');shader.fragmentShader='uniform sampler2D vCells;uniform float vNight;varying vec3 vP;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 q=vP.xz,vPaint=texture2D(vCells,q/${PAINT_TILE}.).rg;float vFray=sin(q.x*1.7+sin(q.y*1.3)*2.)*.14+sin(q.y*2.9+q.x*.7)*.09+sin(q.x*5.3-q.y*4.1)*.05;float vA=smoothstep(.3,.5,diffuseColor.r+vFray);
 vec3 vSlab=mix(vec3(.036,.031,.03),vec3(.07,.062,.058),smoothstep(.2,.5,vPaint.r));diffuseColor.rgb=mix(vSlab,vec3(.125,.102,.09),smoothstep(.5,.85,vPaint.r))*(1.-smoothstep(.12,.34,vPaint.g)*.8);diffuseColor.a=vA;`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*(.22+.3*vNight);');};m.customProgramCacheKey=()=>'volcano-ash-decal-v2';return m;}
function groundMaterial(time,night){const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:T.DoubleSide});m.onBeforeCompile=shader=>{shader.uniforms.vTime=time;shader.uniforms.vNight=night;shader.uniforms.vCells={value:paintedAshTexture()};shader.vertexShader='varying vec3 vP;varying float vNy;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvP=transformed;vNy=objectNormal.y;');shader.fragmentShader='uniform float vTime;uniform float vNight;uniform sampler2D vCells;varying vec3 vP;varying float vNy;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float vRaw=diffuseColor.r,vLava=smoothstep(.785,.815,vRaw),vWay=diffuseColor.g,vGrass=diffuseColor.b,vInner=(vRaw-.8)/.2;vec2 q=vP.xz;
 vec2 vPaint=texture2D(vCells,q/${PAINT_TILE}.).rg;float vLine=smoothstep(.12,.34,vPaint.g);
 vec3 vSlab=mix(vec3(.036,.031,.03),vec3(.07,.062,.058),smoothstep(.2,.5,vPaint.r));
 vec3 vAsh=mix(vSlab,vec3(.125,.102,.09),smoothstep(.5,.85,vPaint.r));vAsh*=1.-vLine*.8;
 float vSeam=smoothstep(.45,.72,vPaint.g)*smoothstep(.06,.45,vRaw);
 float vLayer=vP.y*.9+sin(q.x*.35+q.y*.3)*.7,vLf=fract(vLayer);
 vec3 vRock=mix(vec3(.12,.085,.075),vec3(.24,.17,.14),fract(sin(floor(vLayer)*91.7+floor((q.x+q.y)*.32)*13.1)*4375.5));vRock*=1.-(1.-smoothstep(0.,.08,vLf))*.45;
 float vSteep=1.-smoothstep(.56,.8,vNy);
 vec3 vBasalt=vSlab*(1.-vLine*.8);
 float vBank=smoothstep(.5,.72,vRaw)*(1.-vLava);
 vec3 vCol=mix(vAsh,vRock,vSteep);vCol=mix(vCol,vBasalt,max(vWay*.85,vBank));
 vCol=mix(vCol,vP.x>-40.?vec3(.17,.3,.09):vec3(.17,.23,.16),vGrass);
 ${MAGMA_GLSL}
 diffuseColor.rgb=mix(vCol,mCol,vLava);
 float vGlow=vLava,vHalo=(1.-vLava)*smoothstep(.34,.8,vRaw);`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vGlow*.62+vec3(1.,.27,.05)*vHalo*vHalo*vHalo*(.42+.08*sin(vTime*1.3+vP.x+vP.z))+diffuseColor.rgb*(1.-vLava)*(.22+.3*vNight)+vec3(1.,.3,.08)*smoothstep(.02,.65,vRaw)*(1.-vLava)*vNight*.2+vec3(1.,.27,.03)*vSeam*(1.-vSteep)*(1.-vWay)*(1.1+.2*sin(vTime*.9+vP.x*.4+vP.z*.3))*(1.-vLava);');};m.customProgramCacheKey=()=>'volcano-ground-v16';return m;}
// Glutloch oben im Kegel.
function glowMaterial(time){const m=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});m.onBeforeCompile=shader=>{shader.uniforms.vTime=time;shader.vertexShader='varying vec3 vP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvP=transformed;');shader.fragmentShader='uniform float vTime;varying vec3 vP;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 q=vP.xz*.5;float vRaw=1.,vInner=.7;${MAGMA_GLSL}diffuseColor.rgb=mCol;`);};m.customProgramCacheKey=()=>'volcano-glow-v3';return m;}
// Felsen und Stämme: dünne glühende Risse, die stellenweise auftreten.
function crackedRock(material,time){material.emissive?.set('#231511');material.onBeforeCompile=shader=>{shader.uniforms.vTime=time;shader.vertexShader='varying vec3 vP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvP=transformed;');shader.fragmentShader='uniform float vTime;varying vec3 vP;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float rL=abs(sin(vP.x*2.1+sin(vP.y*3.+vP.z*1.7)*1.4)+.6*sin(vP.z*2.6+vP.y*1.9));float rM=smoothstep(.15,.65,sin(vP.x*.6+vP.z*.5+1.)*cos(vP.y*.8+vP.x*.2));
 totalEmissiveRadiance+=vec3(1.,.33,.05)*(1.-smoothstep(.015,.075,rL))*rM*(1.1+.25*sin(vTime*1.1+vP.x));`);};material.customProgramCacheKey=()=>'volcano-rock-v2';return material;}
function smokeTexture(){const n=32,d=new Uint8Array(n*n*4);for(let j=0;j<n;j++)for(let i=0;i<n;i++){const o=(j*n+i)*4,r=Math.hypot(i/(n-1)-.5,j/(n-1)-.5)*2,a=Math.max(0,1-r);d[o]=d[o+1]=d[o+2]=255;d[o+3]=Math.round(255*a*a*(3-2*a));}const t=new T.DataTexture(d,n,n);t.magFilter=t.minFilter=T.LinearFilter;t.needsUpdate=true;return t;}
const LIGHT_TINT={sky:new T.Color(1.05,.8,.66),ground:new T.Color(1.05,.68,.5),sun:new T.Color(1.15,.9,.72)};
export class VolcanoView{
 constructor(scene){
  this.scene=scene;this.root=new T.Group();scene.add(this.root);this.time={value:0};this.night={value:0};this.warm=0;const tint=new T.Color();
  // --- Gelände: Höhengitter für Tal, Pässe und Bergkranz ---
  const step=.5,x0=-92,x1=14,z0=14,z1=96;
  const outside=(x,z)=>{if(volcanoRegion(x,z))return 0;if(!volcanoRegion(x,z,7))return 7.5;let lo=0,hi=7;for(let k=0;k<7;k++){const m=(lo+hi)/2;if(volcanoRegion(x,z,m))hi=m;else lo=m;}return hi;};
  const peaks=(x,z)=>4.6+1.8*Math.sin(x*.29+.6)*Math.cos(z*.31-.2)+1.1*Math.sin(x*.71+z*.53)+.5*Math.sin(x*1.37-z*1.11);
  // Innerhalb der Lichtung oder des Pilzhains schließt der Rand an deren Boden an, sonst steigt er zu Felsgraten.
  const groundAt=(x,z,d=outside(x,z))=>{if(d===0)return volcanoHeight(x,z);if(sunnyInside(x,z))return sunnyHeight(x,z)-.03;const edge=Math.max(.05,volcanoHeight(x,z));/* Die Kamera schaut von Süden: Grate südlich vom Weg bleiben niedrig, damit sie die Figur nicht verdecken; ebenso zur Lichtung hin keine Sprünge */const low=volcanoRegion(x,z-3,1.2)||[[1.6,0],[-1.6,0],[0,1.6],[0,-1.6]].some(([a,b])=>sunnyInside(x+a,z+b));return edge+peaks(x,z)*(low?.28:1)*Math.pow(smooth(d/3.2),1.15)+(low?.12:.4)*Math.sin(x*1.9+z*1.3)*smooth(d/4);};
  const trailDist=(x,z)=>Math.min(...VOLCANO_TRAIL.slice(1).map((q,k)=>{const [ax,az]=VOLCANO_TRAIL[k],dx=q[0]-ax,dz=q[1]-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-ax-dx*t,z-az-dz*t);}));
  {const nx=Math.round((x1-x0)/step),nz=Math.round((z1-z0)/step),pos=[],col=[],idx=[],keep=[];
   for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+i*step,z=z0+j*step,d=outside(x,z),y=groundAt(x,z,d),inner=sunnyInside(x,z)&&d>0;pos.push(x,y+.01,z);keep.push(d<7&&!(inner&&d>3));
    let lava=0,way=0,grass=inner?1:0;if(d===0){const ld=lavaDistance(x,z),w=lavaWidth(x,z),td=volcanoTrailDistance(x,z);/* breites Feld: Kante bei .8 zieht erst der Shader, darum glatt statt treppig; darunter das Glühen des Ufers */lava=Math.max(0,Math.min(1,(w+2-ld)/2.5))*smooth((trailDist(x,z)-1.4)/.6);lava=Math.max(lava,Math.max(0,Math.min(1,(1.04-lakeRadius(x,z))*2.4+.8)));/* glühende Fugen rund um die Felsen */for(const [rx,rz,rr] of VOLCANO_ROCKS){const dr=Math.hypot(rx-x,rz-z)-rr;if(dr<1.6)lava=Math.max(lava,.6*(1-Math.max(0,dr)/1.6));}if(ld<w+.5&&td<2.2)way=smooth((2.2-td)/.6);else if(td<1.05)way=smooth((1.05-td)/.5)*.8;}
    tint.setRGB(lava,way,grass);col.push(tint.r,tint.g,tint.b);}
   for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;if(keep[a]&&keep[a+1]&&keep[b]&&keep[b+1])idx.push(a,b,a+1,a+1,b,b+1);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);faceUp(g);
   this.ground=new T.Mesh(g,groundMaterial(this.time,this.night));this.ground.receiveShadow=true;this.root.add(this.ground);}
  // Übergänge: Asche verweht über den Boden von Pilzhain und Wiese, statt an einer Kante zu enden.
  {const pos=[],col=[],idx=[];for(const [cx,cz,rx,rz] of [[-60.5,20,11,10],[-26,50.5,9,8]]){const base=pos.length/3,n=Math.ceil(rx*2/.5),m=Math.ceil(rz*2/.5),keep=[];for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){const x=cx-rx+i*.5,z=cz-rz+j*.5,w=1-Math.hypot((x-cx)/rx,(z-cz)/rz);pos.push(x,sunnyHeight(x,z)+.05,z);col.push(Math.max(0,w*1.25),0,0);keep.push(w>0&&sunnyInside(x,z));}for(let j=0;j<m;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;if(keep[a]&&keep[a+1]&&keep[b]&&keep[b+1])idx.push(base+a,base+b,base+a+1,base+a+1,base+b,base+b+1);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);faceUp(g);const decal=new T.Mesh(g,ashDecalMaterial(this.night));decal.receiveShadow=true;this.root.add(decal);}
  // Dunkler Grund unter dem Gebiet: hinter den niedrigen Südgraten schaut man nicht ins Leere.
  {const base=new T.Mesh(new T.CircleGeometry(66,32),new T.MeshBasicMaterial({color:'#231c1b'}));base.rotation.x=-Math.PI/2;base.position.set(-62,-.45,76);this.root.add(base);}
  // --- Kraterglut oben im Kegel ---
  {const glow=glowMaterial(this.time),pos=[],col=[],idx=[],ring=40,P=VOLCANO_PEAK,top=P.y+P.h*.96;pos.push(P.x,top-.5,P.z);col.push(1,1,1);for(let i=0;i<ring;i++){const a=i/ring*Math.PI*2;pos.push(P.x+Math.cos(a)*P.r*.17,top,P.z+Math.sin(a)*P.r*.17);col.push(1,1,1);}for(let i=0;i<ring;i++)idx.push(0,1+(i+1)%ring,1+i);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();this.lake=new T.Mesh(g,glow);this.root.add(this.lake);}
  // --- Statische Kulisse ---
  const art=new ScenicBatch(),flat=new ScenicBatch(),fire=new ScenicBatch(),rock=new T.IcosahedronGeometry(1,1),crag=new T.DodecahedronGeometry(1,0),limb=new T.CylinderGeometry(.5,1,1,6),cone=new T.ConeGeometry(1,1,20,6),ring=new T.CylinderGeometry(1,1,1,9),column=new T.CylinderGeometry(.82,1,1,6),tongue=new T.ConeGeometry(1,1,5),pebble=new T.IcosahedronGeometry(1,0);
  {const L=VOLCANO_LAKE;for(let i=0;i<34;i++){const a=i/34*Math.PI*2,c=1+.07*Math.sin(a*3+1)+.05*Math.sin(a*5+.4),x=L.x+Math.cos(a)*L.rx*1.09*c,z=L.z+Math.sin(a)*L.rz*1.09*c;art.add(crag,i%2?'#46392f':'#574839',x,volcanoHeight(x,z)+.1,z,.55+.35*hash(i,3),.34+.3*hash(i,6),.5+.3*hash(i,8),.1,i,.1);}
   // Dunkle Inseln im Lavasee.
   for(const [i,[dx,dz,r]] of [[.25,-.2,1.1],[-.45,.25,.6],[.55,.45,.45],[-.15,-.55,.4]].entries())art.add(rock,'#352d2c',L.x+dx*L.rx,volcanoHeight(L.x,L.z)+.1,L.z+dz*L.rz,r,r*.5,r*.85,.1,i,.1);}
  for(const [i,[x,z,r,h]] of VOLCANO_ROCKS.entries()){const y=volcanoHeight(x,z);art.add(crag,['#5f5049','#6b5a51','#524640'][i%3],x,y+h*.4,z,r,h*.75,r*.86,.12*Math.sin(i),i*1.3,.1);
   // Basaltsäulen neben jedem zweiten Felsen, an ihrem Fuß kleine Flammen.
   if(i%2===0)for(let k=0;k<5;k++){const a=k*1.26+i,d=r*(.55+.12*k),hh=(1+.42*(k%4))*(.9+.4*hash(i,k)),cx=x+Math.cos(a)*d,cz=z+Math.sin(a)*d,cy=volcanoHeight(cx,cz);art.add(column,k%2?'#54463f':'#64544b',cx,cy+hh*.5,cz,.26+.08*(k%3),hh,.26+.08*(k%3),0,a,0);if(k%2===0){fire.add(tongue,'#ff7a1e',cx+.22,cy+.2,cz+.22,.11,.45,.11);fire.add(tongue,'#ffd25a',cx+.22,cy+.14,cz+.22,.055,.24,.055);}}}
  // Verkohlte Bäume: Stamm mit wenigen kahlen Ästen, ohne Krone.
  for(const [i,[x,z,s]] of VOLCANO_TREES.entries()){const y=volcanoHeight(x,z);art.add(limb,'#3f3532',x,y+1.1*s,z,.22*s,2.2*s,.22*s,.05*Math.sin(i),i,.05*Math.cos(i));for(let k=0;k<4;k++){const a=i*1.7+k*1.6,t=.6+.3*hash(i,k),h=y+(1.1+k*.42)*s;flat.add(limb,k%2?'#352c29':'#292220',x+Math.sin(a)*.35*s,h,z+Math.cos(a)*.35*s,.07*s,1.05*s*t,.07*s,Math.cos(a)*1,a,Math.sin(a)*1);}if(i%3===0){fire.add(tongue,'#ff7a1e',x+.1,y+.2,z+.14,.09,.36,.09);}}
  // Felsgrate am Talrand.
  {let n=0;for(const zone of VOLCANO_ZONES)for(let i=0;i<58;i++){const a=i/58*Math.PI*2+zone.seed,f=1.1+.14*hash(i,zone.seed),c=volcanoContour(a,zone.seed),x=zone.x+Math.cos(a)*zone.rx*f*c,z=zone.z+Math.sin(a)*zone.rz*f*c;if(volcanoRegion(x,z,.6)||!volcanoRegion(x,z,5)||sunnyInside(x,z))continue;const y=groundAt(x,z),w=1.2+1.1*hash(i,2.2+zone.seed),hgt=(2+2.4*hash(i,7+zone.seed))*(volcanoRegion(x,z-3,1.2)?.32:1);art.add(crag,['#6a5a50','#786759','#5c4e46'][n%3],x,y+hgt*.3,z,w,hgt,w*.8,.1*Math.sin(i),a+hash(i,1)*2,.08*Math.cos(i));n++;}}
  // Der große Kegel im Süden, von Lichtung und Pilzhain aus zu sehen, dazu Ausläufer als Horizont.
  {const P=VOLCANO_PEAK;if(!P.own)art.add(cone,'#3c3435',P.x,P.y+P.h*.5,P.z,P.r,P.h,P.r,0,.4,0);for(const [i,[x,z,h,r]] of [[-94,40,10,7],[-96,60,12,8],[-86,78,14,9],[-66,92,16,10]].entries())art.add(crag,i%2?'#3c3435':'#463e3f',x,1+h*.42,z,r,h*.85,r*.9,0,i*.9,0);}
  // Lose Steine und Brocken überall auf dem Boden (nur Kulisse, ohne Kollision).
  {let placed=0;for(let i=0;i<2600&&placed<720;i++){const x=-84+hash(i,11)*62,z=24+hash(i,12)*62;if(!volcanoRegion(x,z,-.2)||lavaDistance(x,z)<lavaWidth(x,z)+.25||lakeRadius(x,z)<1.15||(volcanoTrailDistance(x,z)<.8&&hash(i,14)<.6))continue;const big=hash(i,13)>.86,sz=big?.16+.18*hash(i,15):.05+.08*hash(i,16);flat.add(pebble,['#4a3a33','#5a4840','#3a2e29','#66523f'][i%4],x,volcanoHeight(x,z)+sz*.25,z,sz*(1+.5*hash(i,17)),sz*(.5+.4*hash(i,18)),sz*(.8+.5*hash(i,19)),hash(i,20),hash(i,21)*6,hash(i,22));placed++;}}
  // Heiße Quellen: gelb verkrustete Ränder mit trübem Wasser.
  for(const [i,[x,z]] of VOLCANO_SPRINGS.entries()){const y=volcanoHeight(x,z);flat.add(ring,'#d9bd4b',x,y+.04,z,1.15,.08,.95,0,i,0);flat.add(ring,'#7fb7a6',x,y+.09,z,.8,.04,.65,0,i,0);}
  // Pilzhain-Seite des Felsrutschs: verkohlte Stümpfe und Geröll kündigen den Vulkan an; Basaltstufen hinter der Wand zur Wiese.
  for(const [i,[x,z,s]] of [[-66.5,15,1],[-54,14,.85],[-64,10.5,.7],[-55.5,18.5,.8],[-67,20,.9]].entries()){const y=sunnyHeight(x,z);art.add(limb,'#2b2320',x,y+.45*s,z,.38*s,.9*s,.38*s,.05,i,.08);art.add(limb,'#3a2c26',x+.2*s,y+.95*s,z,.14*s,.5*s,.14*s,.5,i,.4);}
  for(let i=0;i<34;i++){const a=i*2.399,r=2.4+Math.sqrt(i)*1.25,x=-60.5+Math.sin(a)*r*1.1,z=17+Math.cos(a)*r*.8,w=.1+.16*hash(i,3);if(Math.abs(x+60.3)<1.6&&z>12)continue;art.add(pebble,['#3a302c','#2c2523','#4a3d36'][i%3],x,sunnyHeight(x,z)+w*.4,z,w,w*.65,w*.85,i,i*2,i);}
  for(let i=0;i<8;i++){const t=(i+.5)/8,x=-34+t*7.5,z=52.4-t*1.7+.25*Math.sin(i*2.1);flat.add(pebble,i%2?'#3a3334':'#453d3d',x,sunnyHeight(x,z)+.02,z,.62,.07,.85,0,i,0);}
  this.static=art.finish(this.root);this.static.castShadow=true;crackedRock(this.static.material,this.time);this.detail=flat.finish(this.root);
  this.flames=fire.finish(this.root);this.flames.material.dispose();this.flames.material=new T.MeshBasicMaterial({vertexColors:true});
  // --- Vorkommen: Glutkristalle und Kupferknollen schrumpfen mit dem Bestand ---
  {const dep=new ScenicBatch();for(const d of VOLCANO_DEPOSITS){const y=volcanoHeight(d.x,d.z);dep.add(rock,'#5e5655',d.x,y+.35*d.r,d.z,1.1*d.r,.65*d.r,d.r,.1,d.x,.1);}this.depositBase=dep.finish(this.root);
   const prism=new T.CylinderGeometry(.6,1,1,6);prism.translate(0,.5,0);const list=[];for(const d of VOLCANO_DEPOSITS){const n=d.kind==='desertcrystal'?9:10,y=volcanoHeight(d.x,d.z)+.3;for(let i=0;i<n;i++){const a=i*2.399+d.x,r=(i===0?0:.25+((i*7)%5)*.13)*d.r;list.push({d,i,x:d.x+Math.cos(a)*r,z:d.z+Math.sin(a)*r,y,h:(i===0?1.7:.6+((i*5)%7)*.16)*d.r,w:(i===0?.3:.14+((i*3)%4)*.05)*d.r,dir:a,tilt:i===0?0:.35});}}
   this.pieces=new T.InstancedMesh(prism,new T.MeshStandardMaterial({color:'#ffffff',roughness:.35,metalness:.2}),list.length);this.pieces.castShadow=true;this.pieceList=list;const c=new T.Color();list.forEach((p,i)=>{c.set(p.d.kind==='desertcrystal'?(i%2?'#ff7a3c':'#ff9d4f'):(i%2?'#c9743f':'#a95d30'));this.pieces.setColorAt(i,c);});this.root.add(this.pieces);}
  // --- Sperren: Felsrutsch und Basaltwand ---
  this.gates=VOLCANO_GATES.map(gate=>{const group=new T.Group(),b=new ScenicBatch(),stone=gate.kind==='stone';for(let i=0;i<(stone?11:14);i++){const s=(i/(stone?10:13)-.5)*2*gate.gateWidth,h=stone?1.2+1.2*hash(i,5):1.5+.9*hash(i,7),w=stone?.7+.4*hash(i,9):.5+.2*hash(i,9);b.add(stone?rock:column,stone?['#3f3532','#4d413b','#352c2a'][i%3]:['#3a3334','#453d3d','#2f2a2b'][i%3],s,h*.5,.08*Math.sin(i*1.7),w*(stone?1.1:.9),h,stone?.9:.55,0,i,0);}
    b.finish(group);group.position.set(gate.gateX,sunnyHeight(gate.gateX,gate.gateZ),gate.gateZ);group.rotation.y=gate.gateRotation??0;this.root.add(group);return {gate,group};});
  for(const g of [rock,crag,limb,cone,ring,column,tongue,pebble])g.dispose();
  // --- Weicher Rauch (eine flache, zur Kamera geneigte Fläche je Wölkchen): Kegelsäule und Rauchstellen an den Säulen ---
  {const tex=smokeTexture(),plane=new T.PlaneGeometry(1,1);this.vents=VOLCANO_ROCKS.filter((_,i)=>i%4===0).map(([x,z,r],i)=>({x:x+r*.3,z,y:volcanoHeight(x,z)+.7,seed:i}));const n=24+this.vents.length*7;const mat=new T.MeshBasicMaterial({map:tex,color:'#c7b4a8',transparent:true,opacity:.42,depthWrite:false});/* je Wölkchen eigene Deckkraft: Rauch löst sich weich auf statt wegzuploppen */mat.onBeforeCompile=shader=>{shader.vertexShader='attribute float aFade;varying float vFade;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFade=aFade;');shader.fragmentShader='varying float vFade;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.a*=vFade;');};mat.customProgramCacheKey=()=>'volcano-smoke-v1';this.smokeFade=new T.InstancedBufferAttribute(new Float32Array(n),1);plane.setAttribute('aFade',this.smokeFade);this.smoke=new T.InstancedMesh(plane,mat,n);this.smoke.frustumCulled=false;this.root.add(this.smoke);}
  {const n=70;this.embers=new T.InstancedMesh(new T.OctahedronGeometry(.045,0),new T.MeshBasicMaterial({color:'#ffb04a'}),n);this.embers.frustumCulled=false;this.emberSeed=Array.from({length:n},(_,i)=>{const line=VOLCANO_LAVA[i%2],seg=i%(line.length-1),[ax,az]=line[seg],[bx,bz]=line[seg+1],t=hash(i,1);return [ax+(bx-ax)*t,az+(bz-az)*t,hash(i,3),hash(i,4)];});this.root.add(this.embers);}
  // Abbausplitter wie im Eistal.
  {const n=30;this.chips=new T.InstancedMesh(new T.OctahedronGeometry(.11,0),new T.MeshStandardMaterial({color:'#ffffff',roughness:.4}),n);this.chips.frustumCulled=false;this.chips.count=0;this.chipColor=new T.Color();this.root.add(this.chips);}
  this.dummy=new T.Object3D();this.lastUnits='';
 }
 // Warme Abendstimmung im Gebiet: die vorhandenen Lichter werden nur getönt und außerhalb wieder hergestellt.
 // Läuft nach dem Tageslicht, das Farben und Stärken jedes Bild neu setzt. Nachts (Jakob 31.10.) hellt das Gebiet zusätzlich auf.
 updateLight(s,night=0,daylight=null){const p=s.player,target=!s.testWorld.enabled&&!s.home?.interior&&!s.nursery?.interior&&volcanoRegion(p.x,p.z,8)?1:0;this.warm+=(target-this.warm)*.04;if(this.warm<.002&&!target)this.warm=0;if(!this.lights){this.lights=[];this.scene.traverse(o=>{if(o.isHemisphereLight)this.lights.push({o,key:'color',tint:LIGHT_TINT.sky},{o,key:'groundColor',tint:LIGHT_TINT.ground});else if(o.isDirectionalLight)this.lights.push({o,key:'color',tint:LIGHT_TINT.sun});});for(const l of this.lights){l.base=l.o[l.key].clone();l.applied=l.base.clone();}this.mix=new T.Color();}
  for(const l of this.lights){const c=l.o[l.key];if(!c.equals(l.applied))l.base.copy(c);this.mix.setRGB(1+(l.tint.r-1)*this.warm,1+(l.tint.g-1)*this.warm,1+(l.tint.b-1)*this.warm);c.copy(l.base).multiply(this.mix);l.applied.copy(c);}this.night.value=night*this.warm;if(daylight){daylight.ambient.intensity*=1+.4*this.night.value;daylight.sun.intensity*=1+.15*this.night.value;}}
 // Erstarrter Lavafluss (Endgame): dunkle Basaltplatten mit blauem Eisrand über dem Fluss, erst sichtbar, wenn er mit Eiswasser erstarrt ist.
 makeBridge(){const g=new T.Group(),slab=new T.MeshStandardMaterial({color:'#3b3a42',roughness:.95}),ice=new T.MeshStandardMaterial({color:'#9fdcf0',roughness:.35,emissive:'#3aa0c8',emissiveIntensity:.25}),box=new T.BoxGeometry(1,1,1),cone=new T.ConeGeometry(.2,.7,5);
  for(let i=0;i<VOLCANO_RIVER.length-1;i++){const [ax,az]=VOLCANO_RIVER[i],[bx,bz]=VOLCANO_RIVER[i+1],len=Math.hypot(bx-ax,bz-az),mx=(ax+bx)/2,mz=(az+bz)/2,y=volcanoHeight(mx,mz);if(!volcanoRegion(mx,mz,3))continue;const m=new T.Mesh(box,slab);m.position.set(mx,y+.12,mz);m.scale.set(len+.6,.32,3.1);m.rotation.y=-Math.atan2(bz-az,bx-ax);m.receiveShadow=true;g.add(m);for(let k=0;k<3;k++){const c=new T.Mesh(cone,ice);const t=(k+.5)/3;c.position.set(ax+(bx-ax)*t,y+.5,mz+(k%2?1.35:-1.35)+(bz-mz)*0);c.rotation.z=(k%2?.25:-.25);g.add(c);}}
  g.visible=false;this.root.add(g);this.bridge=g;}
 update(s){
  this.root.visible=!s.testWorld.enabled;if(!this.root.visible)return;if(VOLCANO_FLAGS.petrified&&!this.bridge)this.makeBridge();if(this.bridge)this.bridge.visible=VOLCANO_FLAGS.petrified;this.time.value=s.time;const dummy=this.dummy,p=s.player;
  // Sperren: zittern beim Bearbeiten, sinken nach dem Öffnen weg.
  for(const {gate,group} of this.gates){const o=s.obstacles?.find(o=>o.id===gate.id);if(o?.cleared){const t=Math.min(1,(s.time-(Number.isFinite(o.clearedAt)&&o.clearedAt>0?o.clearedAt:s.time-2))/1.4);group.visible=t<1;group.scale.set(1,Math.max(.02,1-t),1);}else{const q=o?.progress??0;group.visible=true;group.scale.set(1,1-q*.25,1);group.position.x=gate.gateX+(q>0?Math.sin(s.time*40)*.03*q:0);}}
  // Vorkommen
  const units=(s.iceDeposits??[]).filter(d=>d.volcano).map(d=>Math.round(d.units*4)/4).join(','),mined=s.miningDeposit??null,minedHere=mined&&VOLCANO_DEPOSITS.find(d=>d.id===mined);
  if(units!==this.lastUnits||minedHere||this.wasMining){this.lastUnits=units;this.wasMining=!!minedHere;const byId=new Map((s.iceDeposits??[]).map(d=>[d.id,d]));this.pieceList.forEach((c,i)=>{const d=byId.get(c.d.id),f=d?d.units/d.max:1,scale=.2+.8*f,shake=c.d.id===mined?.03:0;dummy.position.set(c.x+Math.sin(s.time*57+i)*shake,c.y,c.z+Math.cos(s.time*49+i)*shake);dummy.rotation.set(Math.cos(c.dir)*c.tilt,c.dir*.3,Math.sin(c.dir)*c.tilt);dummy.scale.set(c.w*(.6+.4*f),c.h*scale,c.w*(.6+.4*f));dummy.updateMatrix();this.pieces.setMatrixAt(i,dummy.matrix);});this.pieces.instanceMatrix.needsUpdate=true;}
  if(minedHere){const n=this.chips.instanceMatrix.count,nx=p.x+Math.sin(p.angle)*.75,nz=p.z+Math.cos(p.angle)*.75,ny=(p.y??0)+.55,base=volcanoHeight(minedHere.x,minedHere.z);this.chipColor.set(minedHere.kind==='desertcrystal'?'#ff8a45':'#c9743f');for(let i=0;i<n;i++){const f=(s.time*1.5+i*.137)%1,a=i*2.399,sx=minedHere.x+Math.cos(a)*minedHere.r*.7,sz=minedHere.z+Math.sin(a)*minedHere.r*.7,sy=base+.4+(i%5)*.25,e=f*f;dummy.position.set(sx+(nx-sx)*e,sy+(ny-sy)*e+Math.sin(f*Math.PI)*.45,sz+(nz-sz)*e);dummy.rotation.set(s.time*9+i,i,s.time*7);dummy.scale.setScalar(1-f*.6);dummy.updateMatrix();this.chips.setMatrixAt(i,dummy.matrix);this.chips.setColorAt(i,this.chipColor);}this.chips.count=n;this.chips.instanceMatrix.needsUpdate=true;this.chips.instanceColor.needsUpdate=true;}else this.chips.count=0;
  // Rauch: Kegelsäule weht nach Norden; kleine Wölkchen steigen an den Rauchstellen auf (nur in der Nähe).
  const near=volcanoRegion(p.x,p.z,12);{const P=VOLCANO_PEAK;let m=0;const put=(x,y,z,size,spin,f)=>{this.smokeFade.setX(m,smooth(f/.14)*(1-smooth((f-.35)/.65)));dummy.position.set(x,y,z);dummy.rotation.set(-1,0,spin);dummy.scale.set(size,size,1);dummy.updateMatrix();this.smoke.setMatrixAt(m++,dummy.matrix);};
   for(let i=0;i<24;i++){const f=(s.time*.018+i/24)%1;put(P.x+Math.sin(i*2.4+s.time*.1)*(.6+f*4)+f*5,P.y+P.h+f*20,P.z-f*12+Math.cos(i*1.7)*f*3,5+f*16,i,f);}
   for(const v of this.vents)for(let k=0;k<7;k++){const f=(s.time*.1+k/7+v.seed*.37)%1;put(v.x+Math.sin(k*2.1+s.time*.3)*f*.5+f*.5,v.y+f*3.6,v.z-f*.5,near?.5+f*2.6:0,k+s.time*.1,f);}
   this.smoke.instanceMatrix.needsUpdate=true;this.smokeFade.needsUpdate=true;}
  this.embers.visible=near;if(!near)return;
  this.emberSeed.forEach(([x,z,a,b],i)=>{const f=(s.time*(.16+.14*b)+a)%1;dummy.position.set(x+Math.sin(s.time*.8+i)*.3*f,volcanoHeight(x,z)+.1+f*3.6,z+Math.cos(s.time*.7+i)*.3*f);dummy.rotation.set(i,s.time,0);dummy.scale.setScalar(1-f*.8);dummy.updateMatrix();this.embers.setMatrixAt(i,dummy.matrix);});this.embers.instanceMatrix.needsUpdate=true;
 }
}
