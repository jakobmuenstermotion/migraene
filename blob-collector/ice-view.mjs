import * as T from './vendor/three.module.js';
import {ScenicBatch} from './scenic-geometry.mjs';
import {coastCaustics} from './coast-reference-assets.mjs';
import {coastBase,coastRegion,windUpper} from './coast-area.mjs';
import {gorgeBanks} from './gorge-shape.mjs';
import {sunnyHeight} from './sunny-area.mjs';
import {woodlandAt} from './woodland-regions.mjs';
import {canopyMaterial} from './canopy-visibility.mjs';
import {ICE_WEST_PASS,ICE,ICE_ZONES,ICE_PASS,ICE_POND,ICE_STREAM,ICE_INFLOW,ICE_TREES,ICE_ROCKS,ICE_SLABS,ICE_DEPOSITS,ICE_GATES,ICE_SNOW_LAYER,iceContour,iceHeight,iceValleyRadius,iceRegion,iceTrailDistance,icePondRadius,streamDistance,createIceMaterials} from './ice-area.mjs';
// Neugestaltung Eistal (zweiter Durchgang nach Jakobs Bildvorlage): heller Schnee mit kühlen Schatten, kantige
// blaugraue Felswände mit Schneekappen, verschneite Stufentannen, gefrorener See mit großen Eisschollen, kahle
// rotbraune Sträucher, Kristalle auf Steinplatten. Kein Gras mehr – sammelbare Dinge heben sich klar ab.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Dreiecke so drehen, dass die Oberseite nach oben zeigt (für Licht und Schnee/Fels-Erkennung).
function faceUp(g){g.computeVertexNormals();const n=g.attributes.normal;let sum=0;for(let i=0;i<n.count;i++)sum+=n.getY(i);if(sum<0){const idx=g.index.array;for(let i=0;i<idx.length;i+=3){const a=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=a;}g.index.needsUpdate=true;g.computeVertexNormals();}return g;}
const hash=(a,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
// Gemalter Schnee: große ruhige Felder in Weiß, Flieder und Pfirsich, Windriffel, Glitzern, kühle Hangschatten;
// steile Flächen werden kantiger blaugrauer Fels mit Schnee auf den Absätzen.
const SNOW_GLSL=`
 float iceSteep=1.-smoothstep(.56,.8,iceNy);
 vec2 iq=iceP.xz;
 float icePatch=sin(iq.x*.19+sin(iq.y*.15)*1.6)*sin(iq.y*.23-sin(iq.x*.11)*1.2);
 vec3 iceSnow=mix(vec3(.80,.84,.95),vec3(.95,.965,1.),smoothstep(-.4,.4,icePatch));
 iceSnow=mix(iceSnow,vec3(1.,.94,.92),smoothstep(.45,.95,sin(iq.x*.085+iq.y*.12+1.)*sin(iq.y*.07-iq.x*.03-.4))*.4);
 float iceRipple=sin(dot(iq,vec2(.7,.45))*5.5+sin(iq.y*.8+iq.x*.3)*2.+icePatch*2.);
 iceSnow*=1.+smoothstep(.8,1.,iceRipple)*.035-smoothstep(-1.,-.86,-iceRipple)*.03;
 iceSnow=mix(iceSnow,vec3(.6,.68,.88),smoothstep(.03,.42,1.-iceNy)*.6);
 vec2 iceCell=floor(iq*6.);float iceHash=fract(sin(dot(iceCell,vec2(12.9898,78.233)))*43758.5453);vec2 iceF=fract(iq*6.)-.5;
 iceSnow+=step(.985,iceHash)*(1.-smoothstep(.02,.07,length(iceF)))*.35;
 float iceLayer=iceP.y*.9+sin(iq.x*.35+iq.y*.3)*.7,iceLf=fract(iceLayer);
 vec3 iceRock=mix(vec3(.24,.27,.34),vec3(.37,.41,.5),fract(sin(floor(iceLayer)*91.7+floor((iq.x+iq.y)*.32)*13.1)*4375.5));
 iceRock*=1.-(1.-smoothstep(0.,.08,iceLf))*.3;
 float iceFacet=sin(iq.x*.9+iceP.y*1.4)*sin(iq.y*.8-iceP.y*1.1);
 iceRock*=.9+.18*smoothstep(-.6,.6,iceFacet);
 iceRock=mix(iceRock,vec3(.86,.9,.97),smoothstep(.06,0.,iceLf)*.55*smoothstep(.15,.45,iceNy));
 // Schneedecke (wie die Sandschicht): wo gesaugt wurde, liegt brüchiger gefrorener Erdboden frei; beim Nachrieseln
 // wird er erst bereift, dann wieder weiß. Weicher, leicht ausgefranster Rand; am Schneerand etwas dunkler.
 vec2 iceMaskUv=(iq-iceSnowBox.xy)/iceSnowBox.zw;
 float iceCover=(iceMaskUv.x>0.&&iceMaskUv.x<1.&&iceMaskUv.y>0.&&iceMaskUv.y<1.)?texture2D(iceSnowMask,iceMaskUv).r:1.;
 float iceEdgeN=sin(iq.x*9.3+sin(iq.y*7.1)*1.3)*.07+sin(iq.y*11.7-iq.x*4.3)*.05;
 float iceBare=(1.-smoothstep(.36,.6,iceCover+iceEdgeN))*(1.-iceSteep);
 vec2 iceEc=floor(iq*5.);float iceEh=fract(sin(dot(iceEc,vec2(27.1,61.7)))*43758.5453);
 vec3 iceEarth=mix(vec3(.33,.27,.22),vec3(.46,.38,.3),iceEh*.55+.25+.2*sin(iq.x*2.1+iq.y*1.7));
 float iceCrackE=(1.-smoothstep(0.,.07,abs(sin(iq.x*2.6+sin(iq.y*3.3)*1.4))))+(1.-smoothstep(0.,.06,abs(sin(iq.y*2.9+sin(iq.x*2.7)*1.2))));
 iceEarth*=1.-clamp(iceCrackE,0.,1.)*.42;
 iceEarth=mix(iceEarth,vec3(.56,.52,.46),step(.94,iceEh)*(1.-smoothstep(.05,.12,length(fract(iq*5.)-.5)))*.9);
 iceEarth*=1.-.2*smoothstep(.04,.32,iceCover)*(1.-smoothstep(.32,.5,iceCover));
 iceEarth=mix(iceEarth,vec3(.84,.88,.96),smoothstep(.12,.45,iceCover)*.6);
 iceSnow=mix(iceSnow,iceEarth,iceBare);
 diffuseColor.rgb=mix(iceSnow,iceRock,iceSteep)*diffuseColor.rgb;
 float iceGlow=(1.-iceSteep)*(1.-iceBare);
`;
function snowMaterial(key,mask){const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.9,side:T.DoubleSide});m.onBeforeCompile=shader=>{shader.uniforms.iceSnowMask={value:mask.texture};shader.uniforms.iceSnowBox={value:mask.box};shader.vertexShader='varying vec3 iceP;varying float iceNy;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\niceP=transformed;iceNy=objectNormal.y;');shader.fragmentShader='uniform sampler2D iceSnowMask;uniform vec4 iceSnowBox;varying vec3 iceP;varying float iceNy;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+SNOW_GLSL).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(.13,.15,.21)*iceGlow;');};m.customProgramCacheKey=()=>key;return m;}
// Gefrorenes Wasser: türkis, in der Mitte tiefer; große Eisschollen mit hellen Bruchkanten, bereifter Rand.
function frozenMaterial(time){const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.12,metalness:.04,side:T.DoubleSide});m.onBeforeCompile=shader=>{shader.uniforms.iceCells={value:coastCaustics()};shader.uniforms.iceTime=time;shader.vertexShader='varying vec3 iceP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\niceP=transformed;');shader.fragmentShader='uniform sampler2D iceCells;uniform float iceTime;varying vec3 iceP;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float depthT=diffuseColor.r;vec2 q=iceP.xz;
 vec3 iceCol=mix(vec3(.5,.82,.97),vec3(.1,.42,.72),smoothstep(.1,.95,depthT));
 float plate=texture2D(iceCells,q/24.+vec2(.13,.71)).r,fine=texture2D(iceCells,q/9.+.37).r;
 float cracks=smoothstep(.86,.98,plate)*.95+smoothstep(.93,.995,fine)*.3;
 iceCol*=.94+.1*smoothstep(.2,.7,plate);
 iceCol=mix(iceCol,vec3(.9,.97,1.),cracks*(.5+.5*depthT));
 float frost=smoothstep(.42,.0,depthT)*(.6+.4*sin(q.x*6.+sin(q.y*4.5)*2.));
 iceCol=mix(iceCol,vec3(.88,.93,.98),clamp(frost,0.,1.)*.85);
 float sweep=smoothstep(.94,1.,sin(q.x*.45+q.y*.3-iceTime*.15))*.1;
 diffuseColor.rgb=iceCol+sweep;`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(.1,.16,.24);');};m.customProgramCacheKey=()=>'ice-frozen-water-v2';return m;}
function crystalMaterial(key,opacity=.86,vertexColors=false){const m=new T.MeshStandardMaterial({color:'#ffffff',vertexColors,transparent:true,opacity,roughness:.08,metalness:.05,emissive:'#3f93b5',emissiveIntensity:.25});m.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 crN;varying vec3 crV;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncrN=normalize(normalMatrix*objectNormal);crV=normalize(-(modelViewMatrix*vec4(transformed,1.)).xyz);');shader.fragmentShader='varying vec3 crN;varying vec3 crV;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat crRim=pow(1.-abs(dot(normalize(crN),normalize(crV))),2.2);totalEmissiveRadiance+=vec3(.5,.8,.95)*crRim*.42;diffuseColor.a=min(1.,diffuseColor.a+crRim*.25);');};m.customProgramCacheKey=()=>key;return m;}
// Stufentanne (Jakob: hübscher): breite, dicht gestaffelte Stufen; jede trägt eine Schneekuppe, deren Rand in
// kleinen Schneebatzen über den grünen Saum hängt; weiße Spitze, kurzer warmer Stamm.
function addFir(b,cone,trunk,x,y,z,s,seed,lump){b.add(trunk,'#6a4a33',x,y+.4*s,z,.22*s,.8*s,.22*s);
 const tiers=5+(seed>.6?1:0),greens=['#285445','#2f6250','#2a5a49'];
 for(let k=0;k<tiers;k++){const t=k/(tiers-1),r=(1.5-t*1.1)*s*(.94+.12*Math.sin(seed*13+k)),h=(.95-t*.3)*s,ty=y+(.95+k*.66)*s,lean=.03*Math.sin(seed*9+k),ry=seed*7+k*.9;
  b.add(cone,greens[k%3],x,ty,z,r,h,r,lean,ry,lean*.6);
  b.add(cone,k%2?'#f3f7fd':'#f8fafe',x,ty+h*.17,z,r*.82,h*.52,r*.82,lean,ry+.35,lean*.6);
  if(k<tiers-1)for(let m=0;m<4;m++){const a=ry+m*Math.PI/2+.4,rr=r*.7;b.add(lump,'#f6f9fe',x+Math.sin(a)*rr,ty-h*.08,z+Math.cos(a)*rr,r*.2,h*.11,r*.16,0,a,0);}}
 b.add(cone,'#fbfcff',x,y+(1.05+tiers*.8)*s-.05*s,z,.2*s,.42*s,.2*s);}
export class IceView{
 constructor(scene){
  this.root=new T.Group();scene.add(this.root);this.time={value:0};
  const tint=new T.Color(),trailTint=new T.Color(.88,.91,1),bankTint=new T.Color(.84,.92,1);
  // --- Gelände: ein gleichmäßiges Höhengitter für Tal, Pass, Gipfelhang und Bergkranz ---
  // Außerhalb des begehbaren Bereichs ein weiches Abstandsfeld: zur Schlucht und zum Steinbach hin abfallend,
  // zur Terrasse hin anschließend, sonst zu verschneiten Graten ansteigend. Keine Nähte zwischen Tal und Pass.
  const step=.5,x0=11,x1=67,z0=-105,z1=-33.4;
  const outside=(x,z)=>{if(iceRegion(x,z))return 0;if(!iceRegion(x,z,6.5))return 7;let lo=0,hi=6.5;for(let k=0;k<7;k++){const m=(lo+hi)/2;if(iceRegion(x,z,m))hi=m;else lo=m;}return hi;};
  const peaks=(x,z)=>4.4+1.9*Math.sin(x*.31+1.1)*Math.cos(z*.27-.4)+1.2*Math.sin(x*.71+z*.53)+.6*Math.sin(x*1.37-z*1.11);
  const blocked=(x,z)=>!iceRegion(x,z)&&(coastRegion(x,z,.2)||windUpper(x,z,.3)||(x<56&&z>gorgeBanks(x).far-.15));
  const groundAt=(x,z,d=outside(x,z))=>{const edge=Math.min(9,Math.max(0,iceHeight(x,z)));if(d===0)return iceHeight(x,z);const t=smooth(d/3.2);
   if(x>44.2&&z< -39.2&&z> -57.5)return edge+(5.3-edge)*smooth(d/2.2);
   if(x>46.3&&z> -38)return edge+(Math.max(coastBase(x,Math.max(z,-33.6)),edge)-edge)*smooth(d/1.8);
   if(z> -38.8)return edge+(sunnyHeight(x,z)-.05-edge)*smooth(d/2.6)+.35*Math.sin(d/2.6*Math.PI)*smooth(1-d/2.6)*(.6+.4*Math.sin(x*1.3));
   // Zum Steinbach: verschneiter Grat, der auf der Waldseite wieder auf den Waldboden ausläuft.
   if(woodlandAt(x,z,3.5)){const u=smooth(d/5.2);return edge*(1-u)+(sunnyHeight(x,z)-.05)*u+2.6*Math.sin(Math.PI*Math.min(1,d/5.2))*(.8+.2*Math.sin(z*.7));}
   return edge+peaks(x,z)*Math.pow(t,1.15)+.4*Math.sin(x*1.9+z*1.3)*smooth(d/4);};
  this.groundAt=groundAt;
  {const nx=Math.round((x1-x0)/step),nz=Math.round((z1-z0)/step),pos=[],col=[],idx=[],keep=[];
   for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const x=x0+i*step,z=z0+j*step,d=outside(x,z),y=groundAt(x,z,d);
    pos.push(x,y+.02,z);keep.push(d<6.8&&!blocked(x,z)&&!(d===0&&x<19.6));
    tint.setRGB(1,1,1);if(d===0){const sd=streamDistance(x,z);if(sd<1.4)tint.lerp(bankTint,smooth((1.4-sd)/1.4));const td=iceTrailDistance(x,z);if(td<1.1)tint.lerp(trailTint,smooth((1.1-td)/1.1)*.8);}
    col.push(tint.r,tint.g,tint.b);}
   for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;if(keep[a]&&keep[a+1]&&keep[b]&&keep[b+1])idx.push(a,b,a+1,a+1,b,b+1);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);faceUp(g);
   // Masken-Textur der Schneedecke: je Zelle 4×5 Teilflächen, 255 = voller Schnee, 0 = offener Erdboden.
   const L=ICE_SNOW_LAYER,W=L.width*4,H=L.height*5;this.snowData=new Uint8Array(W*H*4).fill(255);this.snowTexture=new T.DataTexture(this.snowData,W,H);this.snowTexture.magFilter=this.snowTexture.minFilter=T.LinearFilter;this.snowTexture.needsUpdate=true;this.snowSize=[W,H];
   this.valley=new T.Mesh(g,snowMaterial('ice-snow-terrain-v3',{texture:this.snowTexture,box:new T.Vector4(L.minX,L.minZ,L.width*L.cell,L.height*L.cell)}));this.valley.receiveShadow=true;this.root.add(this.valley);}
  // --- Gefrorener See und beide Bäche (ein Mesh) ---
  {const pos=[],col=[],idx=[],frozen=frozenMaterial(this.time);
   const pc=pos.length/3;pos.push(ICE_POND.x,iceHeight(ICE_POND.x,ICE_POND.z)+.05,ICE_POND.z);col.push(1,1,1);const ring=72,rings=[[.4,.95],[.72,.7],[.92,.35],[1.04,.08],[1.13,0]];
   for(const [f,depth] of rings)for(let i=0;i<ring;i++){const a=i/ring*Math.PI*2,c=1+.07*Math.sin(a*3+1)+.05*Math.sin(a*5+.4),x=ICE_POND.x+Math.cos(a)*ICE_POND.rx*f*c,z=ICE_POND.z+Math.sin(a)*ICE_POND.rz*f*c;pos.push(x,iceHeight(x,z)+.05,z);col.push(depth,depth,depth);}
   for(let i=0;i<ring;i++){const n=(i+1)%ring;idx.push(pc,pc+1+n,pc+1+i);for(let k=0;k<rings.length-1;k++){const a=pc+1+k*ring+i,b=pc+1+k*ring+n,c=pc+1+(k+1)*ring+i,d=pc+1+(k+1)*ring+n;idx.push(a,b,c,b,d,c);}}
   for(const line of [ICE_STREAM,ICE_INFLOW]){const samples=[];for(let i=0;i<line.length-1;i++){const [ax,az]=line[i],[bx,bz]=line[i+1],n=Math.ceil(Math.hypot(bx-ax,bz-az)/.4);for(let k=0;k<n;k++)samples.push([ax+(bx-ax)*k/n,az+(bz-az)*k/n]);}samples.push(line[line.length-1]);
    const base=pos.length/3;for(const [i,[x,z]]of samples.entries()){const [px,pz]=samples[Math.max(0,i-1)],[qx,qz]=samples[Math.min(samples.length-1,i+1)],l=Math.hypot(qx-px,qz-pz)||1,ox=-(qz-pz)/l,oz=(qx-px)/l,w=.5+.18*Math.sin(i*.37)+.1*Math.sin(i*.91);for(const s of [-1,-.45,0,.45,1]){const sx=x+ox*w*s,sz=z+oz*w*s;pos.push(sx,iceHeight(sx,sz)+.06,sz);const d=s===0?.75:Math.abs(s)<.5?.45:0;col.push(d,d,d);}}
    for(let i=0;i<samples.length-1;i++)for(let k=0;k<4;k++){const a=base+i*5+k,b=a+5;idx.push(a,b,a+1,a+1,b,b+1);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);faceUp(g);
   this.ice=new T.Mesh(g,frozen);this.ice.receiveShadow=true;this.root.add(this.ice);}
  // --- Statische Kulisse (kantig): Tannen, Felsen, Steinplatten, Felswände am Rand, Gipfel, Grotteneingang ---
  const art=new ScenicBatch(),flat=new ScenicBatch(),cone=new T.ConeGeometry(1,1,8),rock=new T.IcosahedronGeometry(1,1),crag=new T.DodecahedronGeometry(1,0),slab=new T.CylinderGeometry(1,1,1,7),trunk=new T.CylinderGeometry(.55,.75,1,6),icicle=new T.ConeGeometry(1,1,5),twig=new T.ConeGeometry(1,1,3);
  // Tannen als eigenes Mesh: werden wie die Waldkronen durchsichtig, wenn sie die Figur verdecken.
  {const firs=new ScenicBatch(),lump=new T.IcosahedronGeometry(1,0);for(const [i,[x,z,s]] of ICE_TREES.entries())addFir(firs,cone,trunk,x,iceHeight(x,z),z,s,hash(i,5),lump);lump.dispose();this.firs=firs.finish(this.root);this.firs.material=canopyMaterial(this.firs.material);this.firs.castShadow=true;}
  // Felsbrocken: dunkler Schiefer, dicke Schneekappe; ein Teil mit kleinen Eiszapfen.
  for(const [i,[x,z,r,h]] of ICE_ROCKS.entries()){const y=iceHeight(x,z);art.add(rock,['#646d80','#6e788b','#5c6577'][i%3],x,y+h*.4,z,r,h*.72,r*.86,.12*Math.sin(i),i*1.3,.1);
   art.add(rock,'#f4f7fc',x-.04,y+h*.8,z+.03,r*.84,h*.26,r*.72,.06,i,.04);
   if(i%3===0)for(let k=0;k<4;k++){const a=k/4*Math.PI*1.1+.5+i;flat.add(icicle,'#d5eef6',x+Math.cos(a)*r*.8,y+h*.5,z+Math.sin(a)*r*.65+.2,.05,.3+(k%3)*.12,.05,Math.PI,0,0);}}
  // Kristallvorkommen wachsen aus einem kleinen verschneiten Felssockel (Jakob: keine Teller/Platten mehr).
  this.slabTop=new Map();for(const d of ICE_DEPOSITS){if(d.kind!=='icecrystal')continue;const y=iceHeight(d.x,d.z);for(let k=0;k<4;k++){const a=k*1.7+d.x,rr=k?d.r*.75:0;art.add(crag,['#5f6982','#68728a'][k%2],d.x+Math.sin(a)*rr,y+.18,d.z+Math.cos(a)*rr,d.r*(k?.55:.8),.45,d.r*(k?.5:.75),.1,a,.1);}art.add(crag,'#f5f8fc',d.x,y+.42,d.z,d.r*.6,.1,d.r*.55,0,d.x,0);this.slabTop.set(d.id,.32);}
  // Kantige Felswände entlang des Talrands (nicht an Pass, Schlucht und Terrasse), oben verschneit.
  {let n=0;for(const zone of ICE_ZONES)for(let i=0;i<64;i++){const a=i/64*Math.PI*2+zone.seed,f=1.1+.14*hash(i,zone.seed),c=iceContour(a,zone.seed),x=zone.x+Math.cos(a)*zone.rx*f*c,z=zone.z+Math.sin(a)*zone.rz*f*c;
    if(iceRegion(x,z,.6)||!iceRegion(x,z,5)||blocked(x,z)||z> -39||(x>43&&z> -58)||woodlandAt(x,z,1.5))continue;const y=groundAt(x,z),w=1.2+1.1*hash(i,2.2+zone.seed),hgt=1.9+2.2*hash(i,7+zone.seed),ry=a+hash(i,1)*2;
    art.add(crag,['#8590a6','#929cb1','#7c879e'][n%3],x,y+hgt*.3,z,w,hgt,w*.78,.1*Math.sin(i),ry,.08*Math.cos(i));
    art.add(crag,'#f5f8fc',x+.04,y+hgt*.74,z,w*.86,hgt*.24,w*.7,.05,ry+.3,.04);n++;}}
  // Ferne Schneegipfel rund um das Tal schließen den Horizont (verdecken auch das Meer).
  for(const [i,[x,z,h,r]] of [[11,-72,14,6.5],[13,-86,16,7],[17,-100,18,8],[27,-109,17,8],[39,-111,20,9],[51,-108,16,7.5],[62,-101,15,7],[69,-89,13,6.5],[70,-76,12,6],[66,-64,9,5]].entries()){const y=1.5;art.add(crag,i%2?'#5f6a7d':'#566175',x,y+h*.42,z,r,h*.85,r*.9,0,i*.9,0);art.add(cone,'#f0f4fa',x,y+h*.78,z,r*.5,h*.4,r*.46,0,i*.9+.2,0);art.add(crag,'#e2e9f2',x+r*.25,y+h*.55,z+r*.2,r*.42,h*.18,r*.36,.1,i,.1);}
  // Kahle rotbraune Sträucher mit etwas Schnee (Kulisse, nicht sammelbar; fern von sammelbaren Dingen).
  {const items=createIceMaterials(iceHeight).filter(m=>!m.sandCell);let placed=0;for(let i=0;i<260&&placed<64;i++){const zone=ICE_ZONES[i%3],a=i*2.399,r=Math.sqrt(hash(i,9))*.95,x=zone.x+Math.cos(a)*zone.rx*r,z=zone.z+Math.sin(a)*zone.rz*r;
    if(!iceRegion(x,z,-.4)||icePondRadius(x,z)<1.25||streamDistance(x,z)<1||iceTrailDistance(x,z)<1.1||ICE_TREES.some(([tx,tz])=>Math.hypot(tx-x,tz-z)<1.1)||ICE_ROCKS.some(([rx,rz,rr])=>Math.hypot(rx-x,rz-z)<rr+.3)||ICE_DEPOSITS.some(d=>Math.hypot(d.x-x,d.z-z)<d.r+.8)||items.some(m=>Math.hypot(m.x-x,m.z-z)<1.1))continue;
    const y=iceHeight(x,z),s=.7+.6*hash(i,4);for(let k=0;k<7;k++){const b=k*2.399+i,tilt=.35+.45*hash(i,k);flat.add(twig,k%2?'#8a4a3a':'#9c5a42',x+Math.sin(b)*.06,y+.28*s,z+Math.cos(b)*.06,.035*s,.62*s*(.7+.5*hash(k,i)),.035*s,Math.cos(b)*tilt,b,Math.sin(b)*tilt);}
    placed++;}}
  // Vereister Fall: Eiszapfenvorhang über die Südkante, sichtbar von der Schlucht und der Lichtung aus.
  {const [ex,ez]=ICE_STREAM[ICE_STREAM.length-1];for(let i=0;i<22;i++){const s=(i/21-.5)*1.8,x=ex+s,z=ez+.55+.12*Math.sin(i),top=iceHeight(x,ez-.3),len=1.4+1.9*hash(i,3);art.add(icicle,i%3?'#a8d7e8':'#d2eef6',x,top-len*.5,z,.12+.07*hash(i),len,.1,Math.PI,0,0);}
   for(let k=0;k<5;k++)art.add(icicle,'#bfe3ef',ex+(k-2)*.38,iceHeight(ex,ez-.3)-1.1-k%2*.4,ez+.75,.32,2.4+(k%3)*.5,.18,Math.PI,0,0);}
  // Eisfall am Gipfelhang: Zapfen an der steilsten Stelle des Zuflusses.
  {for(let i=0;i<9;i++){const t=i/8,x=31.3+t*.9,z=-80.6+t*2.6,y=iceHeight(x,z-.8);flat.add(icicle,i%2?'#bfe3ef':'#e1f4fa',x-.7,y-.4,z,.1+.05*hash(i,8),.9+.7*hash(i,2),.08,Math.PI,0,0);flat.add(icicle,'#d5eef6',x+.7,y-.4,z,.08,.7+.6*hash(i,6),.07,Math.PI,0,0);}}
  // Versiegelter Eingang zur späteren Eisgrotte in der Gipfelwand (nur Kulisse).
  /* Jakob 7.11.: Eingang 3 m höher in der Wand, Felsvorsprung davor; hinauf nur mit Anker IV (relics.mjs GROTTO) */{const gx=39.6,gz=-96.9,gy=iceHeight(39.6,-95.8)+3;art.add(rock,'#5d6677',gx,gy-.2,gz+.55,1.9,.5,1.0);art.add(rock,'#c9e6ef',gx,gy+.05,gz+.6,1.7,.12,.9);art.add(rock,'#1a2c3a',gx,gy+.9,gz,1.05,1.15,.25);for(let i=0;i<9;i++){const a=Math.PI*(i/8),x=gx+Math.cos(a)*1.35,y=gy+.2+Math.sin(a)*1.55;art.add(crag,['#4c5566','#5d6677'][i%2],x,y,gz+.15,.48,.44,.44,.2*i,i,0);}
   for(let i=0;i<8;i++){const x=gx-.9+i*.26;flat.add(icicle,'#d9f0f7',x,gy+1.6-(i%3)*.12,gz+.32,.06,.5+(i%3)*.25,.06,Math.PI,0,0);}
   art.add(rock,'#c9e6ef',gx,gy+.95,gz+.1,1.0,1.05,.08);}
  this.static=art.finish(this.root);this.static.castShadow=true;this.detail=flat.finish(this.root);this.detail.castShadow=false;
  for(const g of [cone,rock,crag,slab,trunk,icicle,twig])g.dispose();
  // --- Vorkommen: Eis-/Kristallprismen und Erzknollen schrumpfen mit dem Bestand ---
  this.depositParts=[];{const prism=new T.CylinderGeometry(1,1,1,6);prism.translate(0,.5,0);const tipped=new T.ConeGeometry(1,.5,6);tipped.translate(0,1.25,0);const pr=new T.BufferGeometry();
   {const a=prism.toNonIndexed(),b=tipped.toNonIndexed(),p=[...a.attributes.position.array,...b.attributes.position.array];pr.setAttribute('position',new T.Float32BufferAttribute(p,3));pr.computeVertexNormals();a.dispose();b.dispose();}prism.dispose();tipped.dispose();
   const crystals=[];for(const d of ICE_DEPOSITS)if(d.kind!=='ironore'){const n=d.kind==='icecrystal'?9:11,base=iceHeight(d.x,d.z)-.05+(this.slabTop.get(d.id)??0);for(let i=0;i<n;i++){const a=i*2.399+d.x,r=(i===0?0:.25+((i*7)%5)*.13)*d.r,h=(i===0?1.9:.7+((i*5)%7)*.17)*d.r*(d.kind==='icecrystal'?1.15:1),w=(i===0?.36:.16+((i*3)%4)*.05)*d.r;crystals.push({d,x:d.x+Math.cos(a)*r,z:d.z+Math.sin(a)*r,base,h,w,tilt:i===0?0:.35*Math.min(1,r/d.r+.2),dir:a});}}
   this.crystals=new T.InstancedMesh(pr,crystalMaterial('ice-crystal-deposit'),crystals.length);this.crystals.castShadow=true;this.crystalList=crystals;const color=new T.Color();
   crystals.forEach((c,i)=>{color.set(c.d.kind==='icecrystal'?'#9be6f0':i%3?'#c3e4ee':'#d9f1f6');this.crystals.setColorAt(i,color);});this.root.add(this.crystals);
   const ore=new ScenicBatch(),nug=new T.DodecahedronGeometry(1,0),oreRock=new T.DodecahedronGeometry(1,1),oreLump=new T.IcosahedronGeometry(1,1);for(const d of ICE_DEPOSITS){const y=iceHeight(d.x,d.z);if(d.kind==='ironore'){ore.add(oreRock,'#4f5458',d.x,y+.45*d.r,d.z,1.15*d.r,.8*d.r,d.r,.1,d.x,.1);ore.add(oreLump,'#f2f6fb',d.x,y+.98*d.r,d.z,.85*d.r,.18,.7*d.r);}}
   this.depositBase=ore.finish(this.root);oreRock.dispose();oreLump.dispose();this.depositBase.castShadow=true;
   const nuggets=[];for(const d of ICE_DEPOSITS)if(d.kind==='ironore')for(let i=0;i<10;i++){const a=i*2.399,y=iceHeight(d.x,d.z);nuggets.push({d,x:d.x+Math.cos(a)*d.r*.85,z:d.z+Math.sin(a)*d.r*.75,y:y+.35+.45*hash(i,d.x),s:.12+.06*hash(i,2)});}
   this.nuggets=new T.InstancedMesh(nug,new T.MeshStandardMaterial({color:'#b5622f',roughness:.55,metalness:.35,emissive:'#3a1a08',emissiveIntensity:.2}),nuggets.length);this.nuggetList=nuggets;this.root.add(this.nuggets);}
  // --- Eiswand im Frostpass ---
  {const gate=ICE_GATES[0],group=new T.Group(),mat=crystalMaterial('ice-wall',.8,true),blocks=new ScenicBatch({smooth:true}),box=new T.IcosahedronGeometry(.6,0),y=sunnyHeight(gate.gateX,gate.gateZ);
   for(let i=0;i<14;i++){const s=(i/13-.5)*2*gate.gateWidth,h=2.2+1.3*hash(i,7)+(Math.abs(s)>1.8?.9:0),w=.75+.35*hash(i,9);blocks.add(box,['#6fb2d2','#8cc5de','#5fa4c8'][i%3],.08*Math.sin(i*1.7),h*.5,s,1.05+.25*hash(i),h,w,.06*Math.sin(i),.12*Math.sin(i*2.1),.08*Math.cos(i*1.3));}
   for(let i=0;i<7;i++){const s=(i/6-.5)*2*gate.gateWidth*.8;blocks.add(box,'#c9e8f2',.35,3.1+.6*hash(i,4),s,.55,.9,.7,.3,.4*i,.25);}
   const wall=blocks.finish(group);wall.material.dispose();wall.material=mat;wall.castShadow=true;
   const snow=new ScenicBatch({smooth:true}),lump=new T.SphereGeometry(1,10,6);for(let i=0;i<6;i++){const s=(i/5-.5)*2*gate.gateWidth;snow.add(lump,'#f1f8fb',.7,.1,s,.7,.32,.9);}snow.finish(group);lump.dispose();box.dispose();
   group.position.set(gate.gateX,y,gate.gateZ);group.rotation.y=Math.atan2(-(ICE_PASS[2][1]-ICE_PASS[1][1]),ICE_PASS[2][0]-ICE_PASS[1][0]);this.root.add(group);this.wall={group,mat,gate};}
  // --- Westtreppe zum Steinbach: erst nur die Steilwand, nach dem Bau eine Holztreppe mit Seilgeländer die Wand hinauf ---
  {const stairs=new T.Group(),wood=new ScenicBatch(),step=new T.BoxGeometry(1,1,1),post=new T.CylinderGeometry(.06,.08,1,6),z0=-50.25,z1=-49.25,x0=19.7,x1=24.8,n=11,a=Math.atan2(x1-x0,z1-z0),sx=(z1-z0)/Math.hypot(x1-x0,z1-z0),sz=-(x1-x0)/Math.hypot(x1-x0,z1-z0);
   for(let i=0;i<n;i++){const t=(i+.5)/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t,y=sunnyHeight(x,z),d=(x1-x0)/n*1.08;wood.add(step,i%2?'#8a6543':'#7a583a',x,y-.36,z,3,.92,d,0,a,0);wood.add(step,'#a07a54',x,y+.105,z,3.06,.05,d*.96,0,a,0);if(i%2===0)for(const e of [-1,1]){const hx=x+sx*1.42*e,hz=z+sz*1.42*e;wood.add(post,'#5d412c',hx,y+.45,hz,1,1,1);wood.add(post,'#c9b184',hx,y+.92,hz,.28,(x1-x0)/n*2.3,.28,Math.PI/2-.42,a,0);}}
   wood.finish(stairs);this.root.add(stairs);this.westStairs=stairs;
   // Vor dem Bau: eine kahle Felswand quer über dem Hang, oben verschneit.
   const wall=new T.Group(),rocks=new ScenicBatch();for(let i=0;i<7;i++){const q=(i/6-.5)*5.4,zq=-50.1+q,x=21.6+.25*Math.sin(i*2.3),y=sunnyHeight(21.8,-50),h=2.7+.5*Math.sin(i*1.7);rocks.add(crag,['#7c879e','#8590a6','#6f7a91'][i%3],x,y+h*.34,zq,1.45,h*.72,1.05,.06*Math.sin(i),i*.8,.05);rocks.add(crag,'#f5f8fc',x+.15,y+h*.72,zq,1.15,.26,.85,.04,i*.8,.03);}rocks.finish(wall);this.root.add(wall);this.westWall=wall;
   // Felsen säumen den Hohlweg vom Waldboden zur Wand und verdecken die Kante zum Schneehang.
   const edge=new ScenicBatch();for(const side of [-1,1])for(let i=0;i<6;i++){const x=15.2+i*1.1,z=-52+(x-15.5)*.42+side*(2.05+.2*Math.sin(i*1.9)),y=sunnyHeight(x,z),h=.9+.5*Math.sin(i*2.7+side);edge.add(crag,['#7c879e','#8590a6','#6f7a91'][i%3],x,y+h*.3,z,.85,h,.7,.05,i*1.3+side,.04);edge.add(crag,'#f5f8fc',x,y+h*.72,z,.62,.14,.5,.03,i*1.3+side,.02);}edge.finish(this.root);step.dispose();post.dispose();}
  // --- Fallender Schnee nahe der Figur, nur im Eistal ---
  {const n=420;this.flakes=new T.InstancedMesh(new T.OctahedronGeometry(.055,0),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.9,depthWrite:false}),n);this.flakes.frustumCulled=false;this.flakeSeed=Array.from({length:n},(_,i)=>[hash(i,1),hash(i,2),hash(i,3),hash(i,4)]);this.root.add(this.flakes);}
  // Abbausplitter: fliegen beim Kraftsaugen in der Farbe des Materials vom Vorkommen zur Düse.
  {const n=40;this.chips=new T.InstancedMesh(new T.OctahedronGeometry(.12,0),new T.MeshStandardMaterial({color:'#ffffff',roughness:.3,emissive:'#1d4a66',emissiveIntensity:.35}),n);this.chips.frustumCulled=false;this.chips.count=0;this.chipColor=new T.Color();this.root.add(this.chips);}
  // Schneestaub beim Saugen der Schneedecke: kleine weiße Wölkchen fliegen von der Schneise zur Düse (nur Darstellung).
  {const n=36;this.puffs=new T.InstancedMesh(new T.IcosahedronGeometry(.07,0),new T.MeshStandardMaterial({color:'#ffffff',roughness:.8,emissive:'#d9e4f5',emissiveIntensity:.35,transparent:true,opacity:.85,depthWrite:false}),n);this.puffs.frustumCulled=false;this.puffs.count=0;this.root.add(this.puffs);}
  this.dummy=new T.Object3D();this.lastUnits='';this.snowRev=-1;this.snowAt=-9;
 }
 update(s){
  this.root.visible=!s.testWorld.enabled;if(!this.root.visible)return;this.time.value=s.time;const dummy=this.dummy;
  this.updateSnowCover(s);this.updatePuffs(s);
  // Vorkommen
  const units=(s.iceDeposits??[]).filter(d=>!d.scenery).map(d=>Math.round(d.units*4)/4).join(',');
  const mined=s.miningDeposit??null;if(units!==this.lastUnits||mined||this.wasMining){this.lastUnits=units;this.wasMining=!!mined;const byId=new Map((s.iceDeposits??[]).map(d=>[d.id,d]));
   this.crystalList.forEach((c,i)=>{const d=byId.get(c.d.id),f=d?d.units/d.max:1,scale=.25+.75*f;const shake=c.d.id===mined?.035:0;dummy.position.set(c.x+Math.sin(s.time*57+i)*shake,c.base,c.z+Math.cos(s.time*49+i)*shake);dummy.rotation.set(Math.cos(c.dir)*c.tilt,c.dir*.3,Math.sin(c.dir)*c.tilt);dummy.scale.set(c.w*(.6+.4*f),c.h*scale,c.w*(.6+.4*f));dummy.updateMatrix();this.crystals.setMatrixAt(i,dummy.matrix);});this.crystals.instanceMatrix.needsUpdate=true;
   this.nuggetList.forEach((c,i)=>{const d=byId.get(c.d.id),f=d?d.units/d.max:1,show=f*10>i%10;dummy.position.set(c.x,c.y,c.z);dummy.rotation.set(i,i*2,0);dummy.scale.setScalar(show?c.s:0);dummy.updateMatrix();this.nuggets.setMatrixAt(i,dummy.matrix);});this.nuggets.instanceMatrix.needsUpdate=true;}
  {const d=mined?ICE_DEPOSITS.find(x=>x.id===mined):null,n=this.chips.instanceMatrix.count;if(d){const p=s.player,nx=p.x+Math.sin(p.angle)*.75,nz=p.z+Math.cos(p.angle)*.75,ny=(p.y??0)+.55,base=iceHeight(d.x,d.z)+(this.slabTop.get(d.id)??0);this.chipColor.set(d.kind==='ironore'?'#b5582a':d.kind==='icecrystal'?'#55d0e6':'#7fc4e2');for(let i=0;i<n;i++){const f=(s.time*1.5+i*.137)%1,a=i*2.399,sx=d.x+Math.cos(a)*d.r*.7,sz=d.z+Math.sin(a)*d.r*.7,sy=base+.3+(i%5)*.25,e=f*f;dummy.position.set(sx+(nx-sx)*e,sy+(ny-sy)*e+Math.sin(f*Math.PI)*.45,sz+(nz-sz)*e);dummy.rotation.set(s.time*9+i,i,s.time*7);dummy.scale.setScalar((1-f*.6)*(i%3?1:1.5));dummy.updateMatrix();this.chips.setMatrixAt(i,dummy.matrix);this.chips.setColorAt(i,this.chipColor);}this.chips.count=n;this.chips.instanceMatrix.needsUpdate=true;this.chips.instanceColor.needsUpdate=true;}else this.chips.count=0;}
  {const built=!!s.obstacles?.find(o=>o.id==='routeIceStairs')?.cleared;this.westStairs.visible=built;this.westWall.visible=!built;}
  // Eiswand: zittert beim Saugen, schmilzt nach dem Öffnen weg.
  {const o=s.obstacles?.find(o=>o.id===this.wall.gate.id),w=this.wall;if(o?.cleared){const t=Math.min(1,(s.time-(Number.isFinite(o.clearedAt)&&o.clearedAt>0?o.clearedAt:s.time-2))/1.4);w.group.visible=t<1;w.group.scale.set(1,1-t*.9,1);w.mat.opacity=.9*(1-t);}else{const p=o?.progress??0;w.group.visible=true;w.group.scale.set(1,1-p*.25,1);w.group.position.x=w.gate.gateX+(p>0?Math.sin(s.time*40)*.03*p:0);w.mat.opacity=.9-p*.25;}}
  // Schneeflocken rieseln wie das Luftlaub in der Welt (Jakob: kein Overlay vor der Kamera): jede Flocke fällt an
  // einem festen Weltort, pendelt sanft, landet auf dem Schnee und schmilzt dort kurz weg. Nur der Ausschnitt um
  // die Figur wird umgebrochen, die Flocken selbst laufen nicht mit.
  const p=s.player,near=iceRegion(p.x,p.z,6);this.flakes.visible=near;if(near){const n=this.flakeSeed.length,B=26,top=8.5,wrap=(v,c)=>c-B/2+(((v-(c-B/2))%B)+B)%B;
   for(let i=0;i<n;i++){const [a,b,c,d]=this.flakeSeed[i],speed=.075+.05*d,phase=s.time*speed+c,cycle=Math.floor(phase),f=phase-cycle,falling=Math.min(1,f/.86);
    const x=wrap(a*B+cycle*7.31+Math.sin(cycle*2.3+i)*3+Math.sin(s.time*.9+i)*.35+f*1.4,p.x),z=wrap(b*B+cycle*5.17+Math.cos(cycle*1.7+i)*3+Math.cos(s.time*.7+i*1.3)*.3+f*.6,p.z),ground=iceRegion(x,z,1)?iceHeight(x,z):-50;
    dummy.position.set(x,ground+.03+top*(1-falling),z);dummy.rotation.set(s.time*1.7+i,i,s.time*1.3+i*.5);const melt=f<.86?1:1-(f-.86)/.14;dummy.scale.set(melt,melt*.4,melt);if(ground<-40)dummy.scale.setScalar(0);dummy.updateMatrix();this.flakes.setMatrixAt(i,dummy.matrix);}this.flakes.instanceMatrix.needsUpdate=true;}
 }
 // Maske der Schneedecke neu schreiben, wenn gesaugt wurde oder Schneisen nachrieseln (höchstens etwa 7× pro Sekunde).
 updateSnowCover(s){if(this.snowCells?.source!==s.resources)this.snowCells={source:s.resources,list:s.resources.filter(r=>r.snowLayer)};const cells=this.snowCells.list;
  const rev=s.sandRevision??0,regrowing=cells.some(r=>r.sandMask&&s.time<r.respawnAt);if(rev===this.snowRev&&(!regrowing||s.time-this.snowAt<.15))return;this.snowRev=rev;this.snowAt=s.time;
  const [W]=this.snowSize,d=this.snowData;for(const r of cells){const mask=r.status==='returning'?0:(r.sandMask??0),span=Math.max(1,(r.respawnAt??0)-(r.harvestAt??0)),t=Math.max(0,Math.min(1,(s.time-(r.harvestAt??0))/span)),cover=Math.round(255*Math.pow(t,1.4)*.92);
   for(let i=0;i<20;i++){const px=r.snowI*4+(i%4),py=r.snowJ*5+Math.floor(i/4),o=(py*W+px)*4,v=mask&(1<<i)?cover:255;d[o]=d[o+1]=d[o+2]=v;}}
  this.snowTexture.needsUpdate=true;}
 // Schneestaub: je frischer Aufnahme drei Wölkchen von der Schneise zur Düse (nur Darstellung).
 updatePuffs(s){const list=(s.snowBursts??[]).filter(b=>s.time-b.at<.7),p=s.player,nx=p.x+Math.sin(p.angle)*.75,nz=p.z+Math.cos(p.angle)*.75,ny=(p.y??0)+.5;let n=0;
  for(const b of list)for(let k=0;k<3&&n<this.puffs.instanceMatrix.count;k++){const f=Math.min(1,(s.time-b.at)/.7+k*.12),e=f*f,a=b.seed*1.7+k*2.1,sx=b.x+Math.sin(a)*.25,sz=b.z+Math.cos(a)*.25;this.dummy.position.set(sx+(nx-sx)*e,b.y+.08+(ny-b.y)*e+Math.sin(f*Math.PI)*.25,sz+(nz-sz)*e);this.dummy.scale.setScalar((1-f*.7)*(1+k*.3));this.dummy.rotation.set(f*3,k,0);this.dummy.updateMatrix();this.puffs.setMatrixAt(n++,this.dummy.matrix);}
  this.puffs.count=n;if(n)this.puffs.instanceMatrix.needsUpdate=true;}
}