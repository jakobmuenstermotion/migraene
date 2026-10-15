import * as T from './vendor/three.module.js';
import {GARDENS,WORLD,getCrop,stackLayers,COLLECTIBLES} from './content.mjs';
import {BEDS,WORKSHOPS,PRODUCTS,VILLAGE} from './village-content.mjs';
import {getBuildPads} from './village.mjs';
import {cropGrowth} from './harvest.mjs';

// Only this module knows about 3D. Collectible definitions live in content.mjs.
const geometryCache=new Map(),materialCache=new Map();
const geo=(key,create)=>{if(!geometryCache.has(key))geometryCache.set(key,create());return geometryCache.get(key);};
function material(color,options={}){const key=color+JSON.stringify(options);if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color,roughness:WORLD.materials.roughness,metalness:0,...options}));return materialCache.get(key);}
function mesh(g,color,parent,x=0,y=0,z=0,options={}){const m=new T.Mesh(g,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.castShadow=options.shadow!==false;m.receiveShadow=true;parent?.add(m);return m;}
function box(w,h,d){return geo(`box${w},${h},${d}`,()=>new T.BoxGeometry(w,h,d));}
function sphere(r=1){return geo('sphere'+r,()=>new T.SphereGeometry(r,9,6));}
function cylinder(top,bottom,height,segments=8){return geo(`cyl${top},${bottom},${height},${segments}`,()=>new T.CylinderGeometry(top,bottom,height,segments));}
function roundedSlab(w,h,d,r=.12){
  return geo(`round${w},${h},${d},${r}`,()=>{
    const shape=new T.Shape(),x=-w/2,z=-d/2;
    shape.moveTo(x+r,z);shape.lineTo(x+w-r,z);shape.quadraticCurveTo(x+w,z,x+w,z+r);shape.lineTo(x+w,z+d-r);shape.quadraticCurveTo(x+w,z+d,x+w-r,z+d);shape.lineTo(x+r,z+d);shape.quadraticCurveTo(x,z+d,x,z+d-r);shape.lineTo(x,z+r);shape.quadraticCurveTo(x,z,x+r,z);
    const g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelThickness:Math.min(.04,h/4),bevelSize:Math.min(.04,r/2),bevelSegments:2,steps:1,curveSegments:4});g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);return g;
  });
}
function mergeParts(parts){const positions=[],normals=[];for(const part of parts){const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();const matrix=new T.Matrix4().compose(new T.Vector3(...(part.position??[0,0,0])),new T.Quaternion().setFromEuler(new T.Euler(...(part.rotation??[0,0,0]))),new T.Vector3(...(part.scale??[1,1,1])));g.applyMatrix4(matrix);positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.computeBoundingSphere();return g;}
const smallSphere=()=>geo('flowerSphere',()=>new T.SphereGeometry(1,6,4));

/** Reusable crop shape factories. A new skin normally needs only content.mjs. */
export const CROP_MODELS={
  blossom(c){
    const petals=geo('blossomPetals',()=>mergeParts(Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return{geometry:smallSphere(),position:[Math.cos(a)*.18,1.02,Math.sin(a)*.18],scale:[.21,.12,.21]};})));
    const leaves=geo('bloomLeaves',()=>mergeParts([{geometry:smallSphere(),position:[-.13,.34,0],scale:[.23,.055,.09],rotation:[0,0,-.4]},{geometry:smallSphere(),position:[.13,.51,0],scale:[.23,.055,.09],rotation:[0,.5,.35]}]));
    return[{g:cylinder(.028,.04,.86,5),color:c.stem,y:.43},{g:petals,color:c.color},{g:geo('bloomHeart',()=>mergeParts([{geometry:smallSphere(),position:[0,1.08,0],scale:[.11,.09,.11]}])),color:c.accent},{g:leaves,color:c.stem}];
  },
  sprig(c){const buds=geo('sprigHeads',()=>mergeParts(Array.from({length:7},(_,i)=>({geometry:smallSphere(),position:[i%2?.10:-.10,.6+i*.085,(i%3-1)*.06],scale:[.15,.17,.14]}))));return[{g:cylinder(.027,.04,1.12,5),color:c.stem,y:.56},{g:buds,color:c.color},{g:smallSphere(),color:c.accent,y:1.19,scale:[.10,.13,.10]}];},
  crystal(c){const cluster=geo('gemCluster',()=>mergeParts([{geometry:new T.OctahedronGeometry(1),position:[0,.68,0],scale:[.28,.67,.25]},{geometry:new T.OctahedronGeometry(1),position:[-.23,.43,.12],scale:[.2,.42,.21],rotation:[0,0,.27]},{geometry:new T.OctahedronGeometry(1),position:[.22,.38,-.13],scale:[.19,.38,.19],rotation:[.2,0,-.24]}]));return[{g:cluster,color:c.color,emissive:.12},{g:new T.OctahedronGeometry(.10),color:c.accent,y:1.19}];},
  mushroom(c){const cap=geo('mushroomCap',()=>{const g=new T.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2);g.scale(.43,.31,.43);g.translate(0,.83,0);return g;});return[{g:cylinder(.09,.12,.83,7),color:c.stem,y:.415},{g:cap,color:c.color},{g:cylinder(.43,.43,.035,10),color:c.accent,y:.83},{g:geo('mushroomSpots',()=>mergeParts([{geometry:smallSphere(),position:[-.15,1.08,.1],scale:[.075,.025,.07]},{geometry:smallSphere(),position:[.17,1.04,.12],scale:[.08,.025,.065]},{geometry:smallSphere(),position:[0,1.12,-.14],scale:[.06,.02,.06]}])),color:c.accent}];},
  fruit(c){return[{g:cylinder(.03,.045,.72,5),color:c.stem,y:.36},{g:geo('starfruit',()=>new T.DodecahedronGeometry(.34,0)),color:c.color,y:.94},{g:geo('fruitCrown',()=>new T.OctahedronGeometry(.15)),color:c.accent,y:1.28,scale:[1,.6,1]}];}
};

function labelTexture(text,{background='transparent',color='#fff9e3',size=128}={}){const c=document.createElement('canvas');c.width=512;c.height=size;const x=c.getContext('2d');if(background!=='transparent'){x.fillStyle=background;x.fillRect(0,0,c.width,c.height);}x.textAlign='center';x.textBaseline='middle';x.font='700 46px system-ui';x.fillStyle=color;x.fillText(text,256,size/2);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;}
function shadowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(48,61,28,.28)');g.addColorStop(.55,'rgba(48,61,28,.15)');g.addColorStop(1,'rgba(48,61,28,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
const shadowMapTexture=shadowTexture();
function blob(parent,x,z,scale=1,opacity=.5){const mat=new T.MeshBasicMaterial({map:shadowMapTexture,transparent:true,depthWrite:false,opacity});const m=mesh(geo('blobPlane',()=>new T.PlaneGeometry(1,1)),mat,parent,x,.065,z,{shadow:false});m.rotation.x=-Math.PI/2;m.scale.set(scale,scale,scale);return m;}

function makeActor(companion=false){
  const root=new T.Group(),body=new T.Group(),stack=new T.Group();root.add(body,stack);const coat=companion?'#b7a0d2':'#eee5bf',hair=companion?'#785b6c':'#80714f';
  blob(root,0,0,1.65,.6);
  const torso=mesh(sphere(1),coat,body,0,.75,0);torso.scale.set(.37,.48,.29);
  const head=mesh(sphere(1),'#f1d1a5',body,0,1.35,.04);head.scale.set(.31,.33,.30);
  const hairTop=mesh(sphere(1),hair,body,0,1.50,-.045);hairTop.scale.set(.33,.23,.29);
  const eyeG=sphere(.035);mesh(eyeG,'#594f46',body,-.11,1.35,.308);mesh(eyeG,'#594f46',body,.11,1.35,.308);
  const blush1=mesh(sphere(.055),'#e7b9a0',body,-.19,1.26,.26);blush1.scale.y=.4;const blush2=blush1.clone();blush2.position.x=.19;body.add(blush2);
  const legs=[];for(const x of [-.15,.15]){const leg=mesh(cylinder(.105,.12,.38,7),'#6f7757',body,x,.2,0);legs.push(leg);const shoe=mesh(sphere(1),'#a39370',leg,0,-.15,.06);shoe.scale.set(.13,.12,.21);}
  for(const side of [-1,1]){const arm=mesh(sphere(1),coat,body,side*.35,.77,.02);arm.scale.set(.13,.3,.13);arm.rotation.z=side*.2;mesh(sphere(.105),'#eed0a4',body,side*.41,.51,.07);}
  if(companion){for(const x of [-.26,.26]){const hairSide=mesh(sphere(1),hair,body,x,1.26,-.04);hairSide.scale.set(.09,.3,.2);}mesh(cylinder(.33,.30,.08,14),'#bba1d4',body,0,1.61,0);}
  else{mesh(cylinder(.48,.48,.045,18),'#dcca9c',body,0,1.62,0);mesh(cylinder(.30,.35,.20,14),'#d9c597',body,0,1.73,0);mesh(cylinder(.355,.355,.055,14),'#92b4a0',body,0,1.66,0);}
  const pack=mesh(roundedSlab(.63,.65,.35,.1),companion?'#9c83b5':'#b99a69',body,0,.73,-.34);mesh(box(.1,.7,.05),'#d6bd87',pack,-.19,0,-.18);mesh(box(.1,.7,.05),'#d6bd87',pack,.19,0,-.18);
  return{root,body,stack,legs,walk:0,angle:0,layers:[]};
}
function makeSnail(index){
  const root=new T.Group(),load=new T.Group();blob(root,0,0,2.1,.4);
  const smooth=geo('snailSmooth',()=>new T.SphereGeometry(1,20,14)),cream='#ecd5af';
  const body=mesh(smooth,cream,root,0,.22,0);body.scale.set(.42,.22,.78);
  const head=mesh(smooth,cream,root,0,.51,.57);head.scale.set(.36,.4,.32);
  const shell=mesh(smooth,['#b69bda','#d9ba94','#a9c9b1'][index%3],root,0,.68,-.19);shell.scale.set(.53,.56,.46);
  const points=[];for(let i=0;i<60;i++){const t=i/59*Math.PI*4.5,r=.43*(1-i/66);points.push(new T.Vector3(Math.cos(t)*r,.68+Math.sin(t)*r,.278));}
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),65,.032,7,false),'#8e78b1',root);
  for(const x of [-.2,.2]){const stalk=mesh(cylinder(.028,.04,.34,8),cream,root,x,.94,.61);stalk.rotation.z=x*.6;mesh(sphere(.075),cream,root,x*1.18,1.11,.62);mesh(sphere(.043),'#554534',root,x*1.18,1.12,.682);mesh(sphere(.014),'#fffef2',root,x*1.18-.012,1.136,.719);const cheek=mesh(sphere(.07),'#eaa99e',root,x,.44,.845);cheek.scale.set(1,.5,.3);}
  const smile=new T.CatmullRomCurve3([new T.Vector3(-.075,.47,.87),new T.Vector3(0,.43,.89),new T.Vector3(.075,.47,.87)]);mesh(new T.TubeGeometry(smile,12,.012,5,false),'#785e4f',root);
  const leaf=new T.Group();root.add(leaf);const hat=mesh(smooth,'#98b07f',leaf,0,1.19,.54);hat.scale.set(.33,.055,.18);hat.rotation.z=.25;
  const flowers=new T.Group();root.add(flowers);for(let j=0;j<5;j++){const a=j*1.25;const f=mesh(sphere(.10),j%2?'#f4d3a1':'#e6cee9',flowers,Math.cos(a)*.33,1.17+Math.sin(a)*.08,-.19+Math.sin(a)*.21);f.scale.y=.6;mesh(sphere(.038),'#e2bd6e',flowers,f.position.x,f.position.y+.06,f.position.z);}
  const cart=new T.Group();cart.position.set(0,0,-1.18);root.add(cart);mesh(roundedSlab(.83,.27,.65,.08),'#bc996f',cart,0,.35,0);for(const x of [-.43,.43]){const wheel=mesh(cylinder(.17,.17,.07,12),'#8d765a',cart,x,.22,0);wheel.rotation.z=Math.PI/2;}mesh(box(.06,.06,.65),'#a98c65',cart,0,.25,.5);
  load.position.set(0,1.23,-.15);root.add(load);
  return{root,load,count:0,upgrade(level){leaf.visible=level>=2;flowers.visible=level>=4;cart.visible=level>=6;load.position.set(0,level>=6?.57:1.23,level>=6?-1.18:-.15);}};
}

export class GardenScene {
  constructor(canvas,{reducedMotion=()=>false}={}){
    this.canvas=canvas;this.reducedMotion=reducedMotion;this.width=1;this.height=1;this.time=0;this.focus=new T.Vector3(WORLD.spawn.x,0,WORLD.spawn.z);this.zoom=1;this.flights=[];this.dust=[];this.parts=[];this.growthClock=0;this.sweepStrength=0;this.lastStack=0;
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.91;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.scene=new T.Scene();this.scene.background=new T.Color('#c2d6aa');this.scene.fog=new T.Fog('#c2d6aa',62,100);
    this.camera=new T.OrthographicCamera(-20,20,15,-15,.1,150);
    this.hemi=new T.HemisphereLight('#fffcf0','#8f9e77',1.55);this.scene.add(this.hemi);this.night=0;
    const light=new T.DirectionalLight('#fff5e5',2.1);light.position.set(-18,32,15);light.castShadow=true;light.shadow.mapSize.set(1536,1536);light.shadow.camera.left=light.shadow.camera.bottom=-38;light.shadow.camera.right=light.shadow.camera.top=38;light.shadow.camera.near=1;light.shadow.camera.far=100;light.shadow.normalBias=.06;light.shadow.bias=-.0002;light.shadow.radius=3;this.scene.add(light);this.sun=light;
    this.world=new T.Group();this.scene.add(this.world);this.actors=[makeActor(),makeActor(true)];this.actors.forEach(a=>this.scene.add(a.root));
    this.raycaster=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);this.v3=new T.Vector3();
    this.destinationRing=mesh(new T.RingGeometry(.3,.36,36),new T.MeshBasicMaterial({color:'#fff5d8',transparent:true,opacity:.8,depthWrite:false}),this.scene,0,.085,0,{shadow:false});this.destinationRing.rotation.x=-Math.PI/2;this.destinationRing.visible=false;
    this.range=mesh(new T.RingGeometry(.99,1,64),new T.MeshBasicMaterial({color:'#ffffdf',transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide}),this.scene,0,.08,0,{shadow:false});this.range.rotation.x=-Math.PI/2;
    this.sweep=new T.Group();const sweepMesh=mesh(new T.RingGeometry(.86,1,48,1,0,Math.PI*.75),new T.MeshBasicMaterial({color:'#fff6d1',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}),this.sweep,0,.16,0,{shadow:false});sweepMesh.rotation.x=-Math.PI/2;this.sweepMaterial=sweepMesh.material;this.scene.add(this.sweep);
    this.tool=new T.Group();mesh(cylinder(.035,.04,1.2,7),'#b49767',this.tool,0,.28,0).rotation.z=Math.PI/2;const blade=mesh(new T.TorusGeometry(.49,.045,5,24,Math.PI*.95),'#edf0d6',this.tool,.58,.28,-.38);blade.rotation.x=Math.PI/2;this.scene.add(this.tool);
    this.moneyRing=new T.Group();this.scene.add(this.moneyRing);this.moneyCoins=[];for(let i=0;i<42;i++){const coin=mesh(cylinder(.14,.14,.055,18),material('#f0c66b',{metalness:.25,roughness:.4}),this.moneyRing);coin.rotation.x=0;coin.visible=false;this.moneyCoins.push(coin);}this.moneyGlow=0;
    this.helpers=Array.from({length:12},(_,i)=>{const snail=makeSnail(i);snail.root.visible=false;this.scene.add(snail.root);return snail;});
    this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
  }
  build(cells,gardenIndex=0,{state=null,toolDefs=[]}={}){
    this.villageState=state;this.toolDefs=toolDefs;
    this.cells=cells;this.gardenIndex=gardenIndex;this.crop=getCrop(gardenIndex);const garden=GARDENS[gardenIndex],p=garden.palette;this.parts=[];
    this.world.traverse(o=>{if(o.isInstancedMesh)o.dispose();});this.world.clear();
    for(const f of this.flights)this.scene.remove(f.mesh);this.flights=[];for(const d of this.dust)this.scene.remove(d.mesh);this.dust=[];
    this.scene.background.set(p.ground);this.scene.fog.color.set(p.ground);
    mesh(box(100,.4,100),p.ground,this.world,0,-.22,0,{shadow:false});
    // Soft flecks make the grass feel warm without a heavy texture dependency.
    const specks=new T.InstancedMesh(geo('speck',()=>new T.CircleGeometry(1,5)),material('#d2dda5',{transparent:true,opacity:.28,depthWrite:false}),700),dummy=new T.Object3D();
    for(let i=0;i<700;i++){const x=Math.sin(i*367.1)*44,z=Math.cos(i*217.7)*44;dummy.position.set(x,.002,z);dummy.rotation.set(-Math.PI/2,0,i);dummy.scale.setScalar(.035+(i%7)*.018);dummy.updateMatrix();specks.setMatrixAt(i,dummy.matrix);}this.world.add(specks);
    mesh(roundedSlab(3.2,.06,65,.6),p.path,this.world,-9,.005,-1,{shadow:false});mesh(roundedSlab(65,.055,3.6,.7),p.path,this.world,0,.007,16,{shadow:false});
    for(const [i,f]of (state?BEDS:WORLD.fields).entries()){const w=f.columns*f.spacing+.45,d=f.rows*f.spacing+.4,unlocked=!state||state.village.beds[i]>0;mesh(roundedSlab(w,.055,d,.45),unlocked?p.soil:'#c3cea3',this.world,f.x,.003,f.z,{shadow:false});if(!unlocked){const border=mesh(roundedSlab(w+.15,.03,d+.15,.45),'#dce2c5',this.world,f.x,-.005,f.z,{shadow:false});}}
    this.makePlants(cells,this.crop);this.makeBank();this.makeDecor();
    this.bundleTemplate=this.makeBundle(this.crop);this.actors[0].stack.clear();this.actors[0].layers=[];this.actors[1].stack.clear();this.actors[1].layers=[];this.lastStack=0;
    if(state)this.refreshConstruction(state,toolDefs);
    this.focus.set(WORLD.spawn.x,0,WORLD.spawn.z);this.updateCamera(1);this.growthClock=1;
  }
  makeBusStop(){const g=new T.Group();g.position.set(VILLAGE.bus.x,0,VILLAGE.bus.z);this.construction.add(g);mesh(roundedSlab(5.5,.12,3.7,.3),'#e4d9bf',g,0,.05,0);for(const x of [-2,2])mesh(cylinder(.07,.09,2.8,8),'#baa17f',g,x,1.4,-.9);mesh(roundedSlab(5,.25,3,.2),'#aa94c9',g,0,2.9,-.2);mesh(box(4.3,1.5,.12),'#cbd9bd',g,0,1.25,-1);mesh(roundedSlab(3.4,.15,.65,.1),'#c29870',g,0,.85,0);for(const x of [-1.3,1.3])mesh(box(.12,.8,.45),'#a18f72',g,x,.4,0);mesh(cylinder(.06,.08,3.2,8),'#b7a17c',g,2.9,1.6,.3);const sign=mesh(cylinder(.6,.6,.12,24),'#e4cf8c',g,2.9,2.8,.3);sign.rotation.x=Math.PI/2;const label=labelTexture('BUS · BALD',{color:'#766184'}),plane=mesh(new T.PlaneGeometry(2.8,.7),new T.MeshBasicMaterial({map:label,transparent:true,depthWrite:false}),g,0,2.6,.9,{shadow:false});plane.rotation.x=-.35;plane.userData.temporaryTexture=true;}
  makePlants(cells,crop){
    this.parts=[];const groups=new Map();cells.forEach((p,index)=>{const id=p.crop??'default';if(!groups.has(id))groups.set(id,[]);groups.get(id).push(index);});
    for(const [id,indices]of groups){const c=COLLECTIBLES[id]??crop,factory=CROP_MODELS[c.model];if(!factory)throw new Error('Unsupported crop model: '+c.model);const blueprints=factory(c);blueprints.forEach((b,i)=>{
      const g=geo(c.model+'part'+i+c.height+c.width,()=>{const result=b.g.clone();const s=b.scale??[1,1,1];result.scale(s[0]*(c.width/.62),s[1]*c.height/1.08,s[2]*(c.width/.62));result.translate(0,(b.y??0)*c.height/1.08,0);return result;});
      const m=new T.InstancedMesh(g,material('#ffffff',b.emissive?{emissive:b.color,emissiveIntensity:b.emissive}:{}),indices.length);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=i<3;m.receiveShadow=false;m.frustumCulled=false;const isHead=b.color===c.color||b.color===c.accent;
      indices.forEach((index,slot)=>{const p=cells[index],color=new T.Color(p.rare&&isHead?(b.color===c.accent?'#fff0b2':'#f5d078'):b.color);color.offsetHSL(0,0,(p.variation-1)*.12);m.setColorAt(slot,color);});m.instanceColor.needsUpdate=true;this.world.add(m);this.parts.push({mesh:m,indices});
    });}
    const stub=new T.InstancedMesh(cylinder(.026,.035,.13,4),material('#d8cd9c'),cells.length),dummy=new T.Object3D();for(let i=0;i<cells.length;i++){dummy.position.set(cells[i].x,.07,cells[i].z);dummy.updateMatrix();stub.setMatrixAt(i,dummy.matrix);}stub.receiveShadow=false;this.world.add(stub);
    this.updatePlants(this.villageState?.journey?.growthTime??0);
  }
  updatePlants(time){const dummy=new T.Object3D();for(const part of this.parts){part.indices.forEach((index,slot)=>{const p=this.cells[index],growth=cropGrowth(p,time)*p.variation;dummy.position.set(p.x,.06,p.z);dummy.rotation.set(0,p.id*2.399,0);dummy.scale.setScalar(growth);dummy.updateMatrix();part.mesh.setMatrixAt(slot,dummy.matrix);});part.mesh.instanceMatrix.needsUpdate=true;}}
  makeBundle(c){const g=new T.Group();if(c.bundle==='crate'){
    mesh(roundedSlab(.9,.17,.64,.06),c.wrap,g,0,0,0);for(const x of [-.43,.43])mesh(box(.055,.34,.64),c.wrap,g,x,.11,0);for(const z of [-.30,.30])mesh(box(.9,.22,.045),c.tie,g,0,.12,z);
    for(let i=0;i<3;i++){const gem=mesh(geo('crateGem',()=>new T.OctahedronGeometry(1)),i%2?c.accent:c.color,g,(i-1)*.23,.20,(i%2)*.15-.07);gem.scale.set(.18,.28,.17);}
  }else{
    mesh(roundedSlab(.94,.24,.64,.11),c.color,g);mesh(box(.085,.29,.70),c.tie,g,0,.01,0);
    for(const z of [-.19,.19])mesh(roundedSlab(.86,.055,.04,.015),c.accent,g,0,.14,z);
    mesh(roundedSlab(.96,.055,.64,.08),c.wrap,g,0,-.10,0);
  }return g;}
  makeBank(){
    const {x,z}=WORLD.bank,group=new T.Group();group.position.set(x,0,z);this.world.add(group);
    mesh(roundedSlab(6.1,.11,5.3,.5),'#e9ddc1',group,0,.05,0);mesh(roundedSlab(5.7,.05,4.9,.4),'#f5ebd2',group,0,.12,0);mesh(roundedSlab(4.8,.03,3.9,.3),'#cbbacb',group,0,.16,0);
    const map=labelTexture('VERKAUFEN',{color:'#fff8df'}),sign=mesh(new T.PlaneGeometry(3.6,.9),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false}),group,0,.20,1.0,{shadow:false});sign.rotation.x=-Math.PI/2;
    const stand=new T.Group();stand.position.z=-2.3;group.add(stand);
    mesh(roundedSlab(3.8,.9,1.4,.12),'#b28b62',stand,0,.55,0);mesh(roundedSlab(4.1,.14,1.65,.12),'#ddbf93',stand,0,1.05,0);
    for(const x of [-1.8,1.8])mesh(cylinder(.075,.08,2.9,8),'#ba9369',stand,x,1.45,-.35);
    for(let i=0;i<7;i++){const roof=mesh(box(.62,.12,2.35),i%2?'#f9efd8':'#b7a0d5',stand,(i-3)*.60,2.75,-.02);roof.rotation.x=.12;const flap=mesh(roundedSlab(.60,.33,.12,.06),i%2?'#fbefd4':'#b7a0d5',stand,(i-3)*.6,2.54,1.16);}
    mesh(box(4.5,.1,.12),'#d3b083',stand,0,2.88,-1.0);
    const bankGem=mesh(geo('bankGem',()=>new T.OctahedronGeometry(.58)),material('#c8a8ec',{emissive:'#b595d4',emissiveIntensity:.18}),group,0,1.48,-1.3);bankGem.scale.y=1.4;this.bankGem=bankGem;
    mesh(cylinder(.62,.75,.18,8),'#e7cfa4',group,0,.27,-1.3);
    const lamp=new T.Group();lamp.position.set(2.4,0,-1);group.add(lamp);mesh(cylinder(.05,.08,2.7,7),'#b79a6b',lamp,0,1.35,0);mesh(box(.75,.08,.08),'#b79a6b',lamp,-.29,2.7,0);mesh(roundedSlab(.32,.44,.32,.045),'#f5d894',lamp,-.57,2.35,0);mesh(box(.43,.08,.43),'#aa855d',lamp,-.57,2.59,0);
    for(const [px,pz]of [[-2.8,-1.8],[-3.3,-.6],[2.9,-2.5]]){mesh(roundedSlab(.95,.7,.8,.09),'#b6956d',group,px,.4,pz);for(let i=0;i<3;i++)mesh(box(1,.075,.84),'#d8b78c',group,px,.16+i*.22,pz);const bunch=mesh(sphere(.37),'#b6a0d6',group,px,.9,pz);bunch.scale.y=.65;}
  }
  refreshConstruction(state,toolDefs=this.toolDefs){
    if(this.construction){this.world.remove(this.construction);this.construction.traverse(o=>{if(o.userData.temporaryTexture)o.material.map?.dispose();});}
    this.construction=new T.Group();this.world.add(this.construction);this.padVisuals=new Map();this.workshopVisuals=new Map();const v=state.village;
    this.makeStructure('storage',VILLAGE.warehouse.x,VILLAGE.warehouse.z-1.5,v.warehouse);
    if(v.bus)this.makeBusStop();
    this.makeStructure('house',VILLAGE.partner.x,VILLAGE.partner.z,v.house);
    for(const w of WORKSHOPS)if(v.workshops[w.id].level||getBuildPads(state,toolDefs).find(p=>p.id==='workshop:'+w.id)?.visible)this.makeStructure(w.model,w.x,w.z,v.workshops[w.id].level);
    for(const w of WORKSHOPS){if(!v.workshops[w.id].level)continue;const input=new T.Group(),output=new T.Group();input.position.set(w.x-1.6,1.25,w.z+.55);output.position.set(w.x+1.45,1.25,w.z+.7);this.construction.add(input,output);for(let i=0;i<4;i++){const raw=this.bundleTemplate.clone(true);raw.scale.setScalar(.38);raw.position.set(0,i*.16,0);input.add(raw);const item=this.productBundle(w.product).clone(true);item.scale.setScalar(.65);item.position.set(0,i*.25,0);output.add(item);}this.workshopVisuals.set(w.id,{input,output});}
    if(v.sprinkler)this.makeStructure('sprinkler',VILLAGE.sprinkler.x,VILLAGE.sprinkler.z,v.sprinkler);
    for(const pad of getBuildPads(state,toolDefs)){
      if(pad.max||!pad.visible)continue;const root=new T.Group();root.position.set(pad.x,0,pad.z);this.construction.add(root);
      const edgeMat=new T.MeshBasicMaterial({color:pad.locked?'#d7d9c0':'#fff8cf',transparent:true,opacity:pad.locked?.45:.9});const edge=mesh(roundedSlab(2.65,.035,2.35,.25),edgeMat,root,0,.065,0,{shadow:false});
      mesh(roundedSlab(2.48,.04,2.18,.22),pad.locked?'#b7c09a':pad.kind==='tool'?'#c9bdd8':'#b4c5a0',root,0,.095,0,{shadow:false});
      const c=document.createElement('canvas');c.width=512;c.height=384;const x=c.getContext('2d');x.textAlign='center';x.fillStyle=pad.locked?'#e6e8d5':'#fffbea';x.font='600 30px system-ui';x.fillText(pad.label.replace('­','').slice(0,24),256,80);x.font='bold 88px system-ui';x.fillText(pad.locked?'⌑':'↑',256,195);x.font='600 43px system-ui';const cost=Math.max(0,pad.cost-pad.paid);const label=cost>=1e6?(cost/1e6).toLocaleString('de-DE',{maximumFractionDigits:1})+' Mio.':cost>=1000?(cost/1000).toLocaleString('de-DE',{maximumFractionDigits:1})+' Tsd.':String(Math.ceil(cost));x.fillText(pad.locked?'SPÄTER':label+' ✧',256,293);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const textMesh=mesh(new T.PlaneGeometry(2.3,1.95),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:pad.locked?.7:1}),root,0,.13,0,{shadow:false});textMesh.rotation.x=-Math.PI/2;textMesh.userData.temporaryTexture=true;const rail=mesh(roundedSlab(2.1,.065,.23,.06),'#e7dfc6',root,0,.18,.85,{shadow:false});const fill=mesh(box(1,.075,.15),'#d7b75f',root,-1,.21,.85,{shadow:false});fill.scale.x=.001;
      const board=document.createElement('canvas');board.width=640;board.height=256;const ctx=board.getContext('2d');ctx.fillStyle='#fff7df';ctx.beginPath();ctx.roundRect(4,4,632,248,28);ctx.fill();ctx.strokeStyle='#ccb48f';ctx.lineWidth=8;ctx.stroke();ctx.fillStyle='#675a45';ctx.textAlign='center';ctx.font='700 52px system-ui';const words=pad.label.split(' ');let lines=[''];for(const word of words){const last=lines.length-1;if(ctx.measureText(lines[last]+' '+word).width>580)lines.push(word);else lines[last]+=(lines[last]?' ':'')+word;}lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,320,55+i*40));ctx.font='26px system-ui';ctx.fillStyle='#8c7f63';const detail=pad.kind==='tool'?({ 'tool:reach':'Mehr Blüten pro Schwung','tool:bag':'Mehr Platz im Stapel','tool:value':'+12 % Ernte- und Produktwert','tool:speed':'Schneller unterwegs' })[pad.id]:pad.kind==='bed'?'+40 % Ertrag je Ausbaustufe':pad.kind==='day'?'Belohnung sichern · Feierabend':pad.kind==='partner'?'Ein Zuhause in drei Bauabschnitten':pad.kind==='seed'?'Neue Pflanzensorte entdecken':pad.kind==='snail'?'Ernten, tragen und helfen':'Verarbeiten und verbessern';ctx.fillText(detail,320,155);ctx.font='bold 43px system-ui';ctx.fillStyle=pad.locked?'#9c9688':'#a07b35';ctx.fillText(pad.locked?state.journey.closed?'Morgen weiter':pad.requiredRound>state.journey.round?'Ab Runde '+pad.requiredRound:pad.reason?.includes('Samen')?'Samen entdecken':pad.kind==='partner'?'Produkte fehlen':'Vorherigen Bau fertigstellen':label+' ✧',320,215);const signMap=new T.CanvasTexture(board);signMap.colorSpace=T.SRGBColorSpace;const sign=new T.Sprite(new T.SpriteMaterial({map:signMap,depthTest:true}));sign.position.set(0,1.8,-.7);sign.scale.set(3.9,1.56,1);sign.userData.temporaryTexture=true;root.add(sign);mesh(box(.08,1.4,.08),'#ba9c72',root,0,.7,-.7);this.padVisuals.set(pad.id,{root,edge,edgeMat,fill,cost:pad.cost});
    }
  }
  makeStructure(kind,x,z,level){
    const root=new T.Group();root.position.set(x,0,z);this.construction.add(root);
    if(!level){mesh(roundedSlab(4,.07,3,.35),'#c5ccb0',root,0,.03,0,{shadow:false});for(const [a,b]of [[-1.5,-1],[1.5,-1],[-1.5,1],[1.5,1]]){const post=mesh(box(.1,1.5,.1),material('#e6e7d7',{transparent:true,opacity:.45}),root,a,.75,b,{shadow:false});}return;}
    if(kind==='storage'){mesh(roundedSlab(2.7,1.2,1.8,.15),'#b7956b',root,0,.62,0);for(let i=0;i<4;i++)mesh(box(2.8,.09,1.85),'#d6b58a',root,0,.16+i*.3,0);for(const a of [-1,1])mesh(box(.12,1.3,1.92),'#e2c79c',root,a,.64,0);const map=labelTexture('LAGER',{color:'#fff6da'}),sign=mesh(new T.PlaneGeometry(2,.5),new T.MeshBasicMaterial({map,transparent:true}),root,0,.8,.94,{shadow:false});return;}
    if(kind==='house'){if(level<3){mesh(roundedSlab(3.8,.16,3,.18),'#d2baa0',root,0,.12,0);for(const a of [-1.7,1.7])for(const b of [-1.3,1.3])mesh(box(.12,level===1?1.25:2.3,.12),'#b69772',root,a,level===1?.7:1.25,b);if(level===2){mesh(box(3.5,1.7,.12),'#ead8b5',root,0,.95,-1.3);for(const a of [-1.7,1.7])mesh(box(.12,1.7,2.6),'#ead8b5',root,a,.95,0);}const plank=mesh(box(2.4,.1,.3),'#b6956e',root,0,.3,1.7);plank.rotation.y=.2;return;}mesh(roundedSlab(3.8,2.1,3.0,.17),'#f0dfbc',root,0,1.05,0);const roof=mesh(new T.ConeGeometry(3.1,1.6,4),'#b39acb',root,0,2.8,0);roof.rotation.y=Math.PI/4;mesh(roundedSlab(.85,1.4,.1,.09),'#aa8968',root,.5,.7,1.57);for(const a of [-1.15,1.15])mesh(box(.62,.66,.1),'#d0e4d3',root,a,1.25,1.55);mesh(cylinder(.2,.22,.7,7),'#caaf90',root,-1.0,3.05,-.3);return;}
    if(kind==='sprinkler'){mesh(cylinder(.6,.75,.3,10),'#c4c7a3',root,0,.2,0);mesh(cylinder(.1,.17,1.15,8),'#8baea3',root,0,.8,0);mesh(new T.TorusGeometry(.54,.06,6,16),'#d2e2cf',root,0,1.35,0).rotation.x=Math.PI/2;const drop=mesh(sphere(.22),'#a6dcd6',root,0,1.65,0);drop.scale.y=1.4;return;}
    mesh(roundedSlab(4.0,.12,3.3,.3),'#e2d5b7',root,0,.06,0);mesh(roundedSlab(3.2,.9,1.5,.12),'#bf9e76',root,0,.58,0);mesh(roundedSlab(3.6,.13,1.8,.1),'#e4cba4',root,0,1.1,0);
    if(kind==='bouquet'){for(const a of [-1.05,0,1.05]){mesh(cylinder(.22,.16,.4,8),'#b89bc8',root,a,1.36,0);for(let i=0;i<4;i++){const angle=i*Math.PI*.5;mesh(cylinder(.018,.02,.55,5),'#92a96f',root,a+Math.cos(angle)*.14,1.7,Math.sin(angle)*.14);const flower=mesh(sphere(.17),i%2?'#d7b9e9':'#f3d3ad',root,a+Math.cos(angle)*.17,2.0,Math.sin(angle)*.17);flower.scale.y=.65;}}}
    if(kind==='tea'){const pot=mesh(sphere(1),'#b1bfa1',root,0,1.9,0);pot.scale.set(.85,.65,.7);mesh(cylinder(.5,.6,.12,12),'#d2b6db',root,0,2.52,0);mesh(sphere(.14),'#d2b6db',root,0,2.7,0);const handle=mesh(new T.TorusGeometry(.53,.08,7,18),'#b1bfa1',root,-.82,1.92,0);const spout=mesh(cylinder(.16,.22,.8,8),'#b1bfa1',root,.95,2.0,0);spout.rotation.z=-.8;for(const a of [-.95,.95])mesh(cylinder(.18,.13,.28,8),'#e5d4b5',root,a,1.4,.57);}
    if(kind==='oil'){mesh(cylinder(.63,.7,.9,12),'#ce9d6e',root,0,1.65,0);const dome=mesh(sphere(.65),'#dcad7c',root,0,2.1,0);dome.scale.y=.65;mesh(cylinder(.11,.18,.7,9),'#d5a477',root,0,2.55,0);const pipe=mesh(new T.TorusGeometry(.65,.07,7,18,Math.PI),'#d7ae82',root,.65,2.83,0);for(const a of [-1.2,1.2]){mesh(cylinder(.20,.22,.6,8),'#c6d6a1',root,a,1.5,.35);mesh(cylinder(.12,.12,.16,8),'#a88a65',root,a,1.87,.35);}}
    if(kind==='elixir'){for(const a of [-1.7,1.7])for(const b of [-1.1,1.1])mesh(box(.1,2.7,.1),'#ddd7b6',root,a,1.45,b);mesh(roundedSlab(3.6,.12,2.5,.2),'#a2b1a1',root,0,2.8,0);const glass=material('#d2e6cf',{transparent:true,opacity:.27,roughness:.25});mesh(box(3.3,1.65,.03),glass,root,0,1.85,-1.1,{shadow:false});for(let i=0;i<5;i++){const a=(i-2)*.55;mesh(cylinder(.16,.25,.55,9),i%2?'#b69fd8':'#9bc5b4',root,a,1.55,0);mesh(cylinder(.08,.08,.2,7),'#e5d1a0',root,a,1.94,0);}}
  }
  makeDecor(){
    const trees=[[-18,9,1.0],[-19,13,1.1],[-19,17,.8],[-22,15,.9],[-5,-13,1.2],[-3,-16,.9],[19,-15,1.0],[22,-13,1.15],[25,7,.9],[24,11,1.15],[4,21,.8],[-2,23,1.1],[-25,-4,1.2],[-27,-1,.9],[29,29,1.1],[-15,31,.9],[7,-28,1.3]];
    for(const [x,z,s]of trees){if(this.villageState&&getBuildPads(this.villageState,this.toolDefs).some(p=>Math.hypot(p.x-x,p.z-z)<3))continue;const root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(s);this.world.add(root);blob(root,0,0,4,.55);mesh(cylinder(.18,.26,2.3,7),'#a98d61',root,0,1.15,0);for(const [a,b,c,r]of [[0,3,0,1.35],[-.8,2.6,.1,1],[.7,2.7,.3,1.1],[.1,3.6,-.15,.9]]){const leaf=mesh(geo('treeLeaves',()=>new T.IcosahedronGeometry(1,1)),(x+z)%3?'#88ab6c':'#a2bb7b',root,a,b,c);leaf.scale.set(r,r*.78,r);}}
    const stones=[[-4,11,.7],[20,12,.6],[22,15,.8],[-13,-4,.6],[-5,-11,.7],[21,-13,.8],[-21,5,.6],[8,27,.7],[-1,21,.4],[-25,22,.7]];for(const [x,z,s]of stones){const stone=mesh(geo('rock',()=>new T.DodecahedronGeometry(1,0)),'#c6c8ad',this.world,x,s*.3,z);stone.scale.set(s,s*.55,s*.8);stone.rotation.y=x;}
    const fence=new T.Group();this.world.add(fence);for(let i=0;i<8;i++){const x=-3+i*2.6;mesh(box(.16,1.3,.16),'#bc9b73',fence,x,.65,-11.3);if(i<7){mesh(box(2.6,.13,.12),'#d0b28a',fence,x+1.3,.46,-11.3);mesh(box(2.6,.13,.12),'#d0b28a',fence,x+1.3,.99,-11.3);}}
    // A little pond, tucked away from the harvesting lanes.
    const pond=mesh(cylinder(2.5,2.6,.08,30),'#d5d1ad',this.world,-23,.045,24);pond.scale.z=.7;const water=mesh(cylinder(2.30,2.30,.03,30),'#91c8c5',this.world,-23,.10,24);water.scale.z=.7;
    for(let i=0;i<60;i++){const x=Math.sin(i*19.7)*29,z=Math.cos(i*13.1)*30;if(this.cells.some(p=>Math.abs(p.x-x)<1&&Math.abs(p.z-z)<1)||Math.abs(x+9)<2||Math.abs(z-16)<2)continue;const flower=mesh(sphere(.095),i%3?'#f5eed4':'#e8cb8d',this.world,x,.16,z,{shadow:false});flower.scale.y=.4;}
  }
  makePickup(p,rare=false){if(this.reducedMotion()||this.flights.length>28)return;const m=this.bundleTemplate.clone(true);m.scale.setScalar(rare?.60:.43);m.position.set(p.x,.75,p.z);this.scene.add(m);this.flights.push({mesh:m,start:m.position.clone(),age:0,duration:.48+Math.random()*.12,type:'pickup'});}
  makeSale(player){if(this.reducedMotion()||this.flights.length>28)return;const m=this.bundleTemplate.clone(true);m.scale.setScalar(.7);m.position.set(player.x,1.1+this.lastStack*WORLD.stack.layerHeight,player.z-.35);this.scene.add(m);this.flights.push({mesh:m,start:m.position.clone(),age:0,duration:.52,type:'sale'});}
  harvestFlash(x,z){this.sweepStrength=1;this.sweep.rotation.y+=.7;for(let i=0;i<(this.reducedMotion()?0:5);i++){if(this.dust.length>45)break;const m=mesh(geo('sparkle',()=>new T.OctahedronGeometry(.055)),this.crop.sparkles,this.scene,x+(Math.random()-.5)*1.5,.6,z+(Math.random()-.5)*1.5,{shadow:false});this.dust.push({mesh:m,age:0,life:.4+Math.random()*.25,vx:(Math.random()-.5)*1.4,vz:(Math.random()-.5)*1.4});}}
  productBundle(id){this.productTemplates??={};if(!this.productTemplates[id]){const p=PRODUCTS[id],root=new T.Group();if(id==='bouquet'){for(let i=0;i<5;i++){const a=i*1.3;mesh(cylinder(.018,.02,.45,5),'#91a775',root,Math.cos(a)*.13,.15,Math.sin(a)*.13);mesh(sphere(.15),i%2?p.color:'#f3d3a4',root,Math.cos(a)*.2,.45,Math.sin(a)*.2);}mesh(box(.5,.08,.08),'#e4ca8c',root,0,.12,0);}else if(id==='tea'){mesh(roundedSlab(.65,.28,.46,.05),p.color,root,0,.12,0);mesh(box(.1,.32,.5),'#e4ce9e',root,0,.12,0);}else{for(const x of [-.18,.18]){mesh(cylinder(.12,.18,.32,10),p.color,root,x,.16,0);mesh(cylinder(.07,.07,.12,8),'#d8bd8b',root,x,.38,0);}}this.productTemplates[id]=root;}return this.productTemplates[id];}
  receiveMoney(player,value){if(value<=0)return;this.moneyGlow=Math.min(2,this.moneyGlow+.3);if(this.reducedMotion()||this.flights.length>35)return;const m=mesh(cylinder(.14,.14,.055,14),'#f5ce73',this.scene,WORLD.bank.x,1.5,WORLD.bank.z,{shadow:false});m.rotation.x=Math.PI/2;this.flights.push({mesh:m,start:m.position.clone(),age:0,duration:.65,type:'money'});}
  spendMoney(player,pad){if(this.reducedMotion()||this.flights.length>35)return;const m=mesh(cylinder(.12,.12,.04,12),'#f1cb73',this.scene,player.x,1,player.z,{shadow:false});m.rotation.x=Math.PI/2;this.flights.push({mesh:m,start:m.position.clone(),age:0,duration:.48,type:'pay',target:new T.Vector3(pad.x,.3,pad.z)});}
  celebrate(pad){if(this.reducedMotion())return;for(let i=0;i<24;i++){const m=mesh(geo('celebration',()=>new T.OctahedronGeometry(.09)),['#e9c871','#d7b5e7','#b6d4a2'][i%3],this.scene,pad.x,1.5,pad.z,{shadow:false});this.dust.push({mesh:m,age:0,life:1.2+Math.random()*.6,vx:(Math.random()-.5)*5,vz:(Math.random()-.5)*5});}}
  setDestination(target){this.destinationRing.visible=!!target;if(target)this.destinationRing.position.set(target.x,.09,target.z);}
  setZoom(delta){this.zoom=T.MathUtils.clamp(this.zoom+delta,.72,1.4);this.resize();}
  resize(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.width=r.width;this.height=r.height;this.renderer.setSize(r.width,r.height,false);const aspect=r.width/r.height;
    const span=(aspect<.8?WORLD.camera.view*1.17:WORLD.camera.view)/this.zoom;this.camera.left=-span*aspect/2;this.camera.right=span*aspect/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.camera.updateProjectionMatrix();
  }
  updateCamera(dt,player){if(player){const factor=1-Math.pow(1-WORLD.camera.follow,dt*60);const targetX=player.x*.9-1.0,targetZ=player.z*.9-1;this.focus.x+=(targetX-this.focus.x)*factor;this.focus.z+=(targetZ-this.focus.z)*factor;}this.camera.position.set(this.focus.x,WORLD.camera.height,this.focus.z+WORLD.camera.distance);this.camera.lookAt(this.focus.x,0,this.focus.z);this.camera.updateMatrixWorld();}
  worldToScreen(x,y,z){const p=new T.Vector3(x,y,z).project(this.camera);return{x:(p.x*.5+.5)*this.width,y:(-.5*p.y+.5)*this.height,visible:p.z>-1&&p.z<1&&Math.abs(p.x)<1.2&&Math.abs(p.y)<1.2};}
  screenToWorld(x,y){this.raycaster.setFromCamera(new T.Vector2(x/this.width*2-1,-y/this.height*2+1),this.camera);const p=this.raycaster.ray.intersectPlane(this.plane,new T.Vector3());return p?{x:p.x,z:p.z}:null;}
  update(dt,{player,partner,bag,range,time,moving,helpers=0,snails=[],payingPad=null,coins=0,growthTime=time,productID=null}){
    this.time=time;this.updateCamera(dt,player);this.growthClock+=dt;if(this.growthClock>.09){this.updatePlants(growthTime);this.growthClock=0;}
    if(this.workshopVisuals)for(const [id,visual]of this.workshopVisuals){const w=WORKSHOPS.find(w=>w.id===id),v=this.villageState.village;const raw=Object.keys(w.inputs).reduce((sum,key)=>sum+(v.raw[key]??v.finished[key]??0),0);visual.input.children.forEach((m,i)=>m.visible=i<Math.min(4,Math.ceil(raw/6)));visual.output.children.forEach((m,i)=>m.visible=i<Math.min(4,Math.ceil(v.finished[w.product]??0)));}
    const actors=this.actors;
    for(let i=0;i<2;i++){const a=actors[i],p=i?partner:player;a.root.visible=!i||p.visible!==false;if(!a.root.visible)continue;a.root.position.set(p.x,0,p.z);if(p.moving)a.walk+=dt*11;
      a.angle=T.MathUtils.lerp(a.angle,p.angle??a.angle,Math.min(1,dt*12));a.body.rotation.y=a.angle;a.body.position.y=this.reducedMotion()?0:Math.abs(Math.sin(a.walk))*.055;
      a.legs.forEach((leg,j)=>leg.rotation.x=this.reducedMotion()?0:Math.sin(a.walk+j*Math.PI)*(p.moving?.5:.05));
    }
    const actor=actors[0];if(actor.productID!==productID){actor.productID=productID;actor.stack.clear();actor.layers=[];}const template=productID?this.productBundle(productID):this.bundleTemplate;const layers=stackLayers(bag),stack=actor.stack;stack.position.set(-Math.sin(actor.angle)*.36,.84,-Math.cos(actor.angle)*.36);
    while(actor.layers.length<layers){const layer=template.clone(true);stack.add(layer);actor.layers.push(layer);layer.scale.setScalar(.2);}
    while(actor.layers.length>layers){stack.remove(actor.layers.pop());}
    actor.layers.forEach((layer,i)=>{const sway=this.reducedMotion()?0:Math.sin(time*4-i*.23)*(moving?.09:.018)*(i+1)/Math.max(1,layers);layer.position.set(sway*(i+1)*.13,i*WORLD.stack.layerHeight,.015*Math.sin(i));layer.rotation.y=Math.sin(i*2.3)*.06;layer.rotation.z=-sway*.22;layer.scale.lerp(new T.Vector3(1,1,1),Math.min(1,dt*16));});this.lastStack=layers;
    const second=actors[1];if(second.productID!==partner.productID){second.productID=partner.productID;second.stack.clear();second.layers=[];}const secondTemplate=partner.productID?this.productBundle(partner.productID):this.bundleTemplate;const secondLayers=Math.min(9,Math.ceil((partner.bag??0)/6));second.stack.position.set(0,.85,-.35);while(second.layers.length<secondLayers){const layer=secondTemplate.clone(true);second.stack.add(layer);second.layers.push(layer);}while(second.layers.length>secondLayers)second.stack.remove(second.layers.pop());second.layers.forEach((layer,i)=>layer.position.set(0,i*.31,0));
    this.range.position.set(player.x,.08,player.z);this.range.scale.set(range,range,range);
    this.sweep.position.set(player.x,0,player.z);this.sweep.scale.setScalar(range);this.sweep.rotation.y+=dt*6;this.sweepStrength=Math.max(0,this.sweepStrength-dt*3.8);this.sweepMaterial.opacity=this.reducedMotion()?0:this.sweepStrength*.65;
    this.tool.position.set(player.x,.02,player.z);this.tool.rotation.y=actor.angle+Math.sin(time*7)*.7;this.tool.visible=true;
    if(this.bankGem){this.bankGem.rotation.y=time*.6;this.bankGem.position.y=1.48+(this.reducedMotion()?0:Math.sin(time*1.9)*.1);}
    for(let i=this.flights.length-1;i>=0;i--){const f=this.flights[i];f.age+=dt;const t=Math.min(1,f.age/f.duration),ease=t*t*(3-2*t);const target=f.type==='pay'?f.target:f.type==='money'?new T.Vector3(player.x+1.05,.45,player.z-.25):f.type==='pickup'?new T.Vector3(player.x,1.1+layers*WORLD.stack.layerHeight,player.z-.35):new T.Vector3(WORLD.bank.x,1.1,WORLD.bank.z-1.3);f.mesh.position.lerpVectors(f.start,target,ease);f.mesh.position.y+=Math.sin(t*Math.PI)*(f.type==='pickup'?1.5:2);f.mesh.rotation.y+=dt*4;if(t>=1){this.scene.remove(f.mesh);this.flights.splice(i,1);}}
    for(let i=this.dust.length-1;i>=0;i--){const d=this.dust[i];d.age+=dt;d.mesh.position.y+=dt*.8;d.mesh.position.x+=dt*d.vx;d.mesh.position.z+=dt*d.vz;d.mesh.rotation.y+=dt*5;d.mesh.scale.setScalar(Math.max(0,1-d.age/d.life));if(d.age>d.life){this.scene.remove(d.mesh);this.dust.splice(i,1);}}
    for(let i=0;i<this.helpers.length;i++){const helper=this.helpers[i],snail=snails[i];helper.root.visible=!!snail;if(snail){helper.upgrade(snail.level??0);helper.root.position.set(snail.x,0,snail.z);helper.root.rotation.y=snail.angle;const count=Math.min(3,Math.ceil(snail.bag/4));while(helper.count<count){const load=this.bundleTemplate.clone(true);load.scale.setScalar(.45);load.position.y=helper.count*.14;helper.load.add(load);helper.count++;}while(helper.count>count){helper.load.remove(helper.load.children.at(-1));helper.count--;}}}
    if(this.padVisuals)for(const [id,pad]of this.padVisuals){const active=payingPad?.id===id;pad.edgeMat.opacity=active?.7+Math.sin(time*8)*.3:.55;pad.edgeMat.color.set(active?'#fff2a5':'#fff8cf');const ratio=Math.min(1,(this.villageState.village.payments[id]??0)/pad.cost);pad.fill.scale.x=Math.max(.001,ratio*2);pad.fill.position.x=-1+ratio;}
    if(this.destinationRing.visible){this.destinationRing.scale.setScalar(1+Math.sin(time*5)*.1);}
    this.moneyGlow=Math.max(0,this.moneyGlow-dt*.25);this.moneyRing.position.set(player.x,0,player.z);const coinCount=coins>0?Math.min(42,Math.max(1,Math.ceil(Math.log10(1+coins)*5))):0;this.moneyCoins.forEach((coin,i)=>{coin.visible=i<coinCount;const column=i%3,layer=Math.floor(i/3);coin.position.set(.95+column*.21,.14+layer*.064+this.moneyGlow*.035,-.25+(column%2)*.16);coin.rotation.y=column*.7+layer*.13;});
    this.night=this.villageState?.journey?.light??0;this.hemi.intensity=1.55-this.night*.72;this.hemi.color.set('#fffcf0').lerp(new T.Color('#9fa8de'),this.night);this.sun.intensity=2.1-this.night*1.6;this.sun.color.set('#fff5e5').lerp(new T.Color('#b5bce9'),this.night);const ground=new T.Color(GARDENS[this.gardenIndex].palette.ground).lerp(new T.Color('#424e72'),this.night*.8);this.scene.background.copy(ground);this.scene.fog.color.copy(ground);
    this.renderer.render(this.scene,this.camera);
  }
}
