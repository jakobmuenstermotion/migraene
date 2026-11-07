import {volcanoRegion} from './volcano-area.mjs';
import {iceRegion} from './ice-area.mjs';
import * as T from './vendor/three.module.js';
import {ScenicBatch} from './scenic-geometry.mjs';
import {SUNNY,sunnyHeight,sunnyCollision,sunnyGapAt,facilityFootprint,pathDistance,sunnyInside,PERIMETER_TREES} from './sunny-area.mjs';
import {REGION_TREES,WOODLANDS} from './woodland-regions.mjs';
import {LAKE,lakeRadius} from './lake-area.mjs';
import {meadowTexture,shadeTexture,cozyLeafGeometry,grassSprayGeometry,autumnLeafGeometry,seeded} from './cozy-assets.mjs';

export const PROTOTYPE_PATCH={x:-12,z:6,radius:37};
export function patchWeight(x,z){const d=Math.hypot(x-PROTOTYPE_PATCH.x,z-PROTOTYPE_PATCH.z)/PROTOTYPE_PATCH.radius,t=Math.max(0,Math.min(1,(1-d)/.18));return t*t*(3-2*t);}
function cloneMaterial(material){const copy=material.clone();copy.onBeforeCompile=material.onBeforeCompile;copy.customProgramCacheKey=material.customProgramCacheKey;return copy;}

// Everything created here belongs to the disposable comparison scene.
// Existing level positions, collisions and saved game data are never edited.
export class PrototypeDetails{
 constructor(scene,sunny,fishing,leafRenderer=null,world=false){this.world=world;this.leafRenderer=leafRenderer;Object.assign(this,{scene,sunny,fishing,root:null,stage:0,savedGround:null,savedMatrices:null,casters:[],leafSwaps:[],surfaceSwaps:[],water:null,waterTime:{value:0}});}
 weight(x,z){return this.world?((x<39||z>27)&&z>-85?1:0):patchWeight(x,z);}
 point(random){if(random()<.65)return {x:-49+random()*88,z:-31+random()*94};const r=WOODLANDS[Math.floor(random()*WOODLANDS.length)],a=random()*Math.PI*2,d=Math.sqrt(random())*.87;return {x:r.x+Math.sin(a)*r.rx*d,z:r.z+Math.cos(a)*r.rz*d};}
 ensure(){
  if(this.root)return;
  this.root=new T.Group();this.root.name='Cozy reference study · temporary';this.scene.add(this.root);
  this.extraGrounds=this.world?this.sunny.woodlands.parts.map(p=>p.children[0]).filter(m=>m?.geometry?.attributes.color&&!m.userData.sandSurface).map(mesh=>({mesh,material:mesh.material})):[];this.savedGround=this.sunny.ground.geometry.attributes.color.array.slice();this.savedMatrices=null;
  this.groundOriginal=this.sunny.ground.material;this.groundMaterial=cloneMaterial(this.groundOriginal);this.groundCompile=this.groundOriginal.onBeforeCompile;
  this.meadow=meadowTexture();this.shade=shadeTexture();this.ownTextures=[this.meadow,this.shade];
  this.casters=[this.sunny.forest.leaves,...this.sunny.woodlands.leaves].map(mesh=>[mesh,mesh.castShadow,mesh.receiveShadow]);
  this.leafGeometry=cozyLeafGeometry();this.autumnGeometry=autumnLeafGeometry();if(this.leafRenderer)this.looseOriginal=this.leafRenderer.geometry;
  for(const [mesh]of this.casters){const material=cloneMaterial(mesh.material),original=mesh.material,previous=original.onBeforeCompile;
   material.vertexColors=true;material.roughness=1;material.transparent=false;
   material.onBeforeCompile=shader=>{previous.call(material,shader);shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor.a*=canopyFade;','if(canopyFade<.995){float leafCoverage=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(.06711056,.00583715))));if(leafCoverage>canopyFade)discard;}');};
   material.customProgramCacheKey=()=>original.customProgramCacheKey()+'cozy-folded-leaf-v2';
   this.leafSwaps.push({mesh,geometry:mesh.geometry,material:original,temporary:material,colors:mesh.instanceColor?.array.slice()});
  }
  this.foliageTrees=[...SUNNY.trees,...REGION_TREES.map(t=>[t.x,t.z,t.size??1])];this.foliageTrees.push(...PERIMETER_TREES.map(t=>[t.x,t.z,t.size]));this.rockColors=[];this.prepareSurfaceMaterials();this.buildGardens();this.buildRocksAndShore();this.buildContactShade();this.findWater();this.oldLakesideVisible=this.fishing.lakeside?.visible;this.root.visible=false;
 }
 buildGardens(){
  const random=seeded(),flowers=new ScenicBatch(),fern=new ScenicBatch(),petal=new T.SphereGeometry(1,5,3),stem=new T.CylinderGeometry(.014,.02,1,4),leaf=cozyLeafGeometry(),cap=new T.SphereGeometry(1,9,5,0,Math.PI*2,0,Math.PI/2);
  const valid=(x,z)=>this.weight(x,z)>.08&&sunnyInside(x,z)&&!iceRegion(x,z,1)&&!volcanoRegion(x,z,1)&&lakeRadius(x,z)>1.08&&!sunnyGapAt(x,z)&&!facilityFootprint(x,z,.65)&&!sunnyCollision(x,sunnyHeight(x,z),z,.2);
  // Fern fans, broad ground leaves and small mushrooms sit near existing roots.
  for(const [x,z,size]of this.foliageTrees){if(this.weight(x,z)<.05)continue;for(let j=0;j<4;j++){const a=j*2.399,fx=x+Math.sin(a)*1.05*size,fz=z+Math.cos(a)*1.05*size;if(!valid(fx,fz))continue;const y=sunnyHeight(fx,fz);for(let k=0;k<8;k++){const q=k*Math.PI/4;for(let n=0;n<3;n++)fern.add(leaf,n%2?'#729747':'#507946',fx+Math.sin(q)*n*.13,y+.12+(2-n)*.09,fz+Math.cos(q)*n*.13,.25,.7,.48,.4,q,.25);}if(j%2===0){flowers.add(stem,'#d6c4a4',fx+.3,y+.16,fz,4,.3,4);flowers.add(cap,j%3?'#b98361':'#c95d48',fx+.3,y+.29,fz,.23,.13,.23);}}}
  this.flowers=flowers.finish(this.root);this.ferns=fern.finish(this.root);
  const grassGeometry=grassSprayGeometry(),grassMaterial=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,side:T.DoubleSide,emissive:'#536630',emissiveIntensity:.05});this.sunny.trails?.bind(grassMaterial,true);
  this.grass=new T.InstancedMesh(grassGeometry,grassMaterial,(this.world?2500:2200));const dummy=new T.Object3D(),color=new T.Color();let count=0;
  for(let i=0;i<(this.world?42000:6500)&&count<(this.world?2500:2200);i++){const point=this.world?this.point(random):null,x=point?.x??(-49+random()*74),z=point?.z??(-31+random()*74);if(!valid(x,z))continue;const field=Math.sin(x*.41+z*.23)+Math.cos(z*.56-x*.31);if(field<-.1&&random()>.18)continue;dummy.position.set(x,sunnyHeight(x,z)+.015,z);dummy.rotation.set(0,random()*Math.PI*2,0);const size=.85+random()*1.15;dummy.scale.set(size,size*(.45+random()*.3),size);dummy.updateMatrix();this.grass.setMatrixAt(count,dummy.matrix);this.grass.setColorAt(count++,color.set(['#6e9e36','#7fab3c','#8db843','#5f9131','#98bf4a'][i%5]));}
  this.grass.count=count;this.grass.instanceMatrix.needsUpdate=true;this.grass.instanceColor.needsUpdate=true;this.grass.computeBoundingSphere();this.root.add(this.grass);
  for(const m of [this.flowers,this.ferns,this.grass]){m.castShadow=false;m.receiveShadow=true;}
  for(const g of [petal,stem,leaf,cap])g.dispose();
 }
 buildRocksAndShore(){
  const batch=new ScenicBatch(),shore=new ScenicBatch(),rock=new T.DodecahedronGeometry(1,0),pebble=new T.IcosahedronGeometry(1,0),leaf=cozyLeafGeometry(),stem=new T.CylinderGeometry(.016,.023,1,5),random=seeded(19101);
  for(const c of SUNNY.cliffs){if(this.weight(c.x,c.z)<.05)continue;for(let j=0;j<18;j++){const a=j*2.399,r=c.r*(.57+random()*.25),x=c.x+Math.sin(a)*r,z=c.z+Math.cos(a)*r,y=sunnyHeight(x,z),size=.12+random()*.25;batch.add(pebble,j%2?'#a4a597':'#bcb8a4',x,y+size*.35,z,size,size*.55,size*.8,0,a,.1);if(j%3===0)for(let n=0;n<5;n++)batch.add(leaf,n%2?'#708746':'#8b9d5e',x+Math.sin(n)*.12,y+.08,z+Math.cos(n)*.12,.3,.4,.4,.15,n,.3);}}
  for(let i=0;i<62;i++){const a=i/62*Math.PI*2,r=1.02+.045*Math.sin(i*2.4),x=LAKE.x+Math.cos(a)*LAKE.rx*r,z=LAKE.z+Math.sin(a)*LAKE.rz*r,y=sunnyHeight(x,z),s=.15+(i%4)*.12;
   if(i%3!==0&&Math.sin(a*3+.5)+.5*Math.sin(a*7)>.05)shore.add(rock,['#9ca497','#b6b9a6','#8a9991'][i%3],x,y+s*.25,z,s,s*.5,s*.8,0,a,.12);
   if([3,9,11,28,39,45,53].includes(i))for(let j=0;j<5;j++){const h=.35+random()*.45;shore.add(stem,j%2?'#7b9653':'#9aaa61',x+j*.055,y+h/2,z,1,h,1,0,0,Math.sin(j)*.09);if(j%2===0)shore.add(pebble,'#8d7552',x+j*.055,y+h,z,.035,.12,.035);}
  }
  const padShape=new T.Shape();for(let i=0;i<=24;i++){const a=.22+i/24*(Math.PI*2-.44),r=.23*(1+.06*Math.sin(a*5));if(i===0)padShape.moveTo(0,0);padShape.lineTo(Math.sin(a)*r,Math.cos(a)*r);}padShape.closePath();const pad=new T.ShapeGeometry(padShape);
  for(let i=0;i<12;i++){const a=i*2.399,x=LAKE.x+Math.sin(a)*LAKE.rx*(.55+(i%3)*.07),z=LAKE.z+Math.cos(a)*LAKE.rz*.65;shore.add(pad,i%3?'#73965c':'#9eaf68',x,LAKE.water+.025,z,1,1,1,-Math.PI/2,0,i*.7);if(i%4===0){shore.add(pebble,'#e4c8d0',x,LAKE.water+.08,z,.09,.065,.09);shore.add(pebble,'#eed8a5',x,LAKE.water+.12,z,.035,.02,.035);}}
  this.rocks=batch.finish(this.root);this.shore=shore.finish(this.root);for(const mesh of [this.rocks,this.shore]){mesh.castShadow=false;mesh.receiveShadow=true;}
  for(const g of [rock,pebble,leaf,stem,pad])g.dispose();
 }
 buildContactShade(){
  const trees=[...SUNNY.trees.map(([x,z,size])=>({x,z,size})),...REGION_TREES,{x:-43,z:-8,size:3.5}],positions=[],uvs=[],indices=[];
  const stamp=(x,z,rx,rz,offset=0)=>{const start=positions.length/3,n=6;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const px=x+(i/n-.5)*rx,pz=z+(j/n-.5)*rz;positions.push(px,sunnyHeight(px,pz)+.032+offset,pz);uvs.push(i/n,j/n);}for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=start+j*(n+1)+i;indices.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}};
  for(const t of trees){if(this.weight(t.x,t.z)<.05&&Math.hypot(t.x+43,t.z+8)>1)continue;stamp(t.x+.65*t.size,t.z+.2*t.size,5.6*t.size,4.6*t.size);stamp(t.x,t.z,1.8*t.size,1.6*t.size,.002);}
  for(const b of [SUNNY.home,SUNNY.storage])stamp(b.x,b.z,b.w*1.9,b.d*1.9);
  for(const c of SUNNY.cliffs)if(this.weight(c.x,c.z)>.05)stamp(c.x,c.z,c.r*3,c.r*2.8);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  this.contactShade=new T.Mesh(g,new T.MeshBasicMaterial({map:this.shade,color:'#344c2d',transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));this.contactShade.renderOrder=1;this.root.add(this.contactShade);
 }
 shadeFoliage(swap){
  if(!swap.colors)return;const matrix=swap.mesh.instanceMatrix.array,attribute=swap.mesh.instanceColor,occupancy=new Map(),cell=.6,key=(x,y,z)=>x+','+y+','+z;for(let i=0;i<attribute.count;i++){const k=i*16,x=matrix[k+12],y=matrix[k+13],z=matrix[k+14];if(this.weight(x,z)<.05)continue;const id=key(Math.floor(x/cell),Math.floor(y/cell),Math.floor(z/cell));occupancy.set(id,(occupancy.get(id)??0)+1);}const color=new T.Color(),hsl={},dark=new T.Color('#244e35'),middle=new T.Color('#577e33'),sunlit=new T.Color('#97ad39');
  for(let i=0;i<attribute.count;i++){const k=i*16,x=matrix[k+12],y=matrix[k+13],z=matrix[k+14];if(this.weight(x,z)<.05)continue;let tree=null,best=Infinity;for(const t of this.foliageTrees){const d=Math.hypot(x-t[0],z-t[1])/t[2];if(d<best){best=d;tree=t;}}if(!tree||best>3.6)continue;color.setRGB(attribute.getX(i),attribute.getY(i),attribute.getZ(i));color.getHSL(hsl);if(hsl.h>.47)continue;const height=(y-sunnyHeight(tree[0],tree[1]))/tree[2],side=(tree[0]-x)*.1+(tree[1]-z)*.035,level=T.MathUtils.clamp((height-2.35)/2.5+side,0,1),variation=.92+(i%7)*.022;color.copy(level<.55?dark:middle).lerp(level<.55?middle:sunlit,level<.55?level/.55:(level-.55)/.45).multiplyScalar(variation);let cover=0;const vx=Math.floor(x/cell),vy=Math.floor(y/cell),vz=Math.floor(z/cell);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)cover+=occupancy.get(key(vx+dx,vy+1,vz+dz))??0;color.multiplyScalar(.64+.36*Math.exp(-cover*.035));attribute.setXYZ(i,color.r,color.g,color.b);}attribute.needsUpdate=true;
 }
 tintRockFaces(){
  const color=new T.Color(),hsl={},tint=new T.Color('#a4a396');this.sunny.root.traverse(mesh=>{const g=mesh.geometry,p=g?.attributes.position,c=g?.attributes.color,n=g?.attributes.normal;if(!mesh.isMesh||!p||!c||!n||mesh===this.sunny.ground||mesh.isInstancedMesh)return;const entries=[];for(let i=0;i<c.count;i++){if(patchWeight(p.getX(i),p.getZ(i))<.05)continue;color.setRGB(c.getX(i),c.getY(i),c.getZ(i));color.getHSL(hsl);if(hsl.s>.2||hsl.l>.8||hsl.l<.1)continue;entries.push([i,color.r,color.g,color.b]);color.lerp(tint,.15).multiplyScalar(.94+Math.max(0,n.getY(i))*.1);c.setXYZ(i,color.r,color.g,color.b);}if(entries.length){this.rockColors.push({attribute:c,entries});c.needsUpdate=true;}});
 }
 prepareSurfaceMaterials(){
  const clones=new Map(),hsl={};
  for(const mesh of this.sunny.staticRoot?.children??[]){if(!mesh.isMesh||!mesh.material.color)continue;const original=mesh.material;if(original.emissive?.getHex()>0)continue;original.color.getHSL(hsl);const roof=hsl.h>.4&&hsl.h<.51&&hsl.s>.15,wood=hsl.h>.045&&hsl.h<.15&&hsl.s>.22&&hsl.l<.88;if(!roof&&!wood)continue;
   let material=clones.get(original);if(!material){material=cloneMaterial(original);material.color.lerp(new T.Color(roof?'#4c7d83':'#a77b4b'),roof?.5:hsl.l>.65?.28:.06);const before=original.onBeforeCompile;
    material.onBeforeCompile=shader=>{before.call(material,shader);shader.vertexShader='varying vec3 cozySurfacePosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncozySurfacePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 cozySurfacePosition;\n'+shader.fragmentShader;const detail=roof?'vec2 tile=floor(vec2(cozySurfacePosition.x*2.7+mod(floor(cozySurfacePosition.z*2.1),2.0)*.5,cozySurfacePosition.z*2.1));float panel=fract(52.9829189*fract(dot(tile,vec2(.06711056,.00583715))));diffuseColor.rgb*=.87+panel*.24;':'float grain=sin(cozySurfacePosition.x*7.0+sin(cozySurfacePosition.y*1.9+cozySurfacePosition.z*4.0)*1.2);diffuseColor.rgb*=.98+grain*.02;';shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+detail);};material.customProgramCacheKey=()=>original.customProgramCacheKey()+(roof?'cozy-roof-v2':'cozy-wood-v2');material.roughness=.95;clones.set(original,material);}
   this.surfaceSwaps.push({mesh,material:original,temporary:material});
  }
 }
 findWater(){this.fishing.root.traverse(mesh=>{if(mesh.isMesh&&mesh.geometry.type==='ShapeGeometry'&&Math.hypot(mesh.position.x-LAKE.x,mesh.position.z-LAKE.z)<.1){this.water=mesh;this.waterOriginal=mesh.material;this.waterMaterial=cloneMaterial(mesh.material);}});}
 installGround(){
  const material=this.groundMaterial,before=this.groundCompile,map=this.meadow;
  material.onBeforeCompile=shader=>{before.call(material,shader);shader.uniforms.cozyMeadow={value:map};shader.vertexShader='varying vec2 cozyGround;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncozyGround=(modelMatrix*vec4(transformed,1.0)).xz;');shader.fragmentShader='varying vec2 cozyGround;uniform sampler2D cozyMeadow;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat meadowWeight='+ (this.world?'1.0':'1.0-smoothstep(30.0,37.0,length(cozyGround-vec2(-12.0,6.0)))')+';vec3 paintA=texture2D(cozyMeadow,cozyGround/16.0).rgb;vec3 meadowDetail=paintA*2.0;float grassy=smoothstep(0.0,0.07,diffuseColor.g-diffuseColor.r);diffuseColor.rgb*=mix(vec3(1.0),meadowDetail,meadowWeight*grassy*1.0);');};material.customProgramCacheKey=()=> 'cozy-meadow-painted';material.needsUpdate=true;this.sunny.ground.material=material;for(const entry of this.extraGrounds??[]){entry.temporary??=cloneMaterial(entry.material);entry.temporary.onBeforeCompile=material.onBeforeCompile;entry.temporary.customProgramCacheKey=material.customProgramCacheKey;entry.temporary.needsUpdate=true;entry.mesh.material=entry.temporary;}
 }
 paintGround(){
  const g=this.sunny.ground.geometry,p=g.attributes.position,c=g.attributes.color,color=new T.Color(),rich=new T.Color('#88a65d'),gold=new T.Color('#99b16b'),earth=new T.Color('#a58e60');
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),w=this.weight(x,z);if(!w)continue;color.setRGB(c.getX(i),c.getY(i),c.getZ(i));const field=.5+.25*Math.sin(x*.37+z*.19)+.17*Math.cos(z*.53-x*.23);color.lerp(field>.52?gold:rich,w*.3);let soil=0;for(const [tx,tz,size]of SUNNY.trees)soil=Math.max(soil,Math.exp(-((tx-x)**2+(tz-z)**2)/(size*1.45))*.6);color.lerp(earth,w*soil);c.setXYZ(i,color.r,color.g,color.b);}c.needsUpdate=true;
 }
 installWater(){
  if(!this.water)return;const material=this.waterMaterial,before=this.waterOriginal.onBeforeCompile,time=this.waterTime;material.color.set('#4b8f9b');material.metalness=.02;material.roughness=.38;material.opacity=.94;
  material.onBeforeCompile=shader=>{before.call(material,shader);shader.uniforms.cozyWaterTime=time;shader.vertexShader='varying vec2 cozyWaterPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncozyWaterPosition=position.xy;');shader.fragmentShader='varying vec2 cozyWaterPosition;uniform float cozyWaterTime;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec2 wp=cozyWaterPosition;float bank=length(wp/vec2(4.7,3.5));float ripple=sin(wp.x*4.0+sin(wp.y*3.0)+cozyWaterTime*.65)*sin(wp.y*5.0-cozyWaterTime*.4);diffuseColor.rgb*=mix(.72,1.2,smoothstep(.2,1.0,bank))+ripple*.055;diffuseColor.rgb+=vec3(.09,.12,.11)*smoothstep(.83,.97,ripple)*.45;');};material.customProgramCacheKey=()=> 'cozy-water-v2';material.needsUpdate=true;this.water.material=material;
 }
 apply(stage){
  this.ensure();this.stage=stage;this.root.visible=stage>=2;for(const m of [this.flowers,this.ferns,this.grass])m.visible=stage>=2;this.rocks.visible=stage>=3;this.shore.visible=stage>=4;if(this.fishing.lakeside)this.fishing.lakeside.visible=stage<4?this.oldLakesideVisible:false;this.contactShade.visible=stage>=4;
  if(stage>=2){this.installGround();this.paintGround();this.setLooseLeaves(true);for(const swap of this.leafSwaps){swap.mesh.geometry=this.leafGeometry;swap.mesh.material=swap.temporary;this.shadeFoliage(swap);}}
  if(stage>=3){for(const swap of this.surfaceSwaps)swap.mesh.material=swap.temporary;this.tintRockFaces();}
  if(stage>=4){for(const [mesh]of this.casters){mesh.castShadow=false;mesh.receiveShadow=false;}this.installWater();this.sunny.root.traverse(mesh=>{if(mesh.isPoints&&mesh.geometry.attributes.position?.count===52){this.motes=mesh;this.moteCount=mesh.geometry.drawRange.count;mesh.geometry.setDrawRange(0,8);}});}
 }
 setLooseLeaves(enabled){
  if(!this.leafRenderer)return;const renderer=this.leafRenderer,geometry=enabled?this.autumnGeometry:this.looseOriginal;if(renderer.setLeafStyle){renderer.setLeafStyle(geometry,enabled&&this.world);return;}renderer.geometry=geometry;for(const mesh of [...renderer.batches,renderer.flying,renderer.pack,renderer.shots,renderer.returning,renderer.wind,renderer.gold])if(mesh)mesh.geometry=geometry;
 }
 restore(){
  if(!this.root)return;this.setLooseLeaves(false);this.sunny.ground.geometry.attributes.color.array.set(this.savedGround);this.sunny.ground.geometry.attributes.color.needsUpdate=true;this.sunny.ground.material=this.groundOriginal;for(const entry of this.extraGrounds??[])entry.mesh.material=entry.material;
  for(const swap of this.leafSwaps){swap.mesh.geometry=swap.geometry;swap.mesh.material=swap.material;if(swap.colors){swap.mesh.instanceColor.array.set(swap.colors);swap.mesh.instanceColor.needsUpdate=true;}}
  for(const swap of this.surfaceSwaps)swap.mesh.material=swap.material;for(const edit of this.rockColors){for(const [i,r,g,b]of edit.entries)edit.attribute.setXYZ(i,r,g,b);edit.attribute.needsUpdate=true;}this.rockColors=[];
  for(const [mesh,cast,receive]of this.casters){mesh.castShadow=cast;mesh.receiveShadow=receive;}if(this.water)this.water.material=this.waterOriginal;if(this.fishing.lakeside)this.fishing.lakeside.visible=this.oldLakesideVisible;if(this.motes)this.motes.geometry.setDrawRange(0,this.moteCount);this.root.visible=false;this.stage=0;
 }
 update(time){this.waterTime.value=time;}
 dispose(){
  this.restore();if(!this.root)return;const materials=new Set([this.groundMaterial,this.waterMaterial,...this.leafSwaps.map(s=>s.temporary),...this.surfaceSwaps.map(s=>s.temporary)]);
  this.root.traverse(mesh=>{mesh.geometry?.dispose();if(mesh.material)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(material);});for(const m of materials)m?.dispose();for(const t of this.ownTextures)t.dispose();for(const entry of this.extraGrounds??[])entry.temporary?.dispose();this.leafGeometry.dispose();this.autumnGeometry.dispose();this.scene.remove(this.root);this.root=null;this.savedGround=this.savedMatrices=null;this.leafSwaps=[];this.surfaceSwaps=[];this.casters=[];this.motes=this.water=null;this.flowers=this.ferns=this.grass=this.rocks=this.shore=this.contactShade=null;this.leafGeometry=this.autumnGeometry=null;this.groundMaterial=this.waterMaterial=null;this.ownTextures=[];this.rockColors=[];
 }
}
