import {PATHS,sceneryClear,COSMETIC_PLACES} from './layout.mjs';
import {HARVEST_EFFECTS} from './harvest-effects.mjs';
import {carriedStackEntries,cargoStackLayout} from './cargo-stack.mjs';
import {fertilized,detectorTarget,FERTILIZER_RADIUS,FISH,LAKE,COMPOST_WORKSHOP} from './outdoors.mjs';
import {FLOWER_CROPS} from './harvest-moments.mjs';
import {HIVES,HONEY_SECONDS,HIVE_CAPACITY} from './honey-content.mjs';
import {SNAIL_LOOKS,nurseryPose,FARM_PLACES} from './snail-appearance.mjs';
import {snailsResting} from './snail-care.mjs';
import {padIcon,drawPadIcon} from './pad-design.mjs';
import {BOUTIQUES} from './boutiques.mjs';
import {SNAILS,FARM} from './snail-farm.mjs';
import {upgradeInfo} from './upgrade-info.mjs';
import * as T from './vendor/three.module.js';
import {GARDENS,WORLD,getCrop,stackLevels,COLLECTIBLES} from './content.mjs';
import {BEDS,WORKSHOPS,PRODUCTS,VILLAGE} from './village-content.mjs';
import {getBuildPads,productionSeconds,workshopStatus,workshopNeeds,buildPayment} from './village.mjs';
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

// Normalize each raw/product bundle to one layer, so its actual top follows
// the fill ratio even between whole layers. Keep the mesh count bounded.
const stackTemplates=new WeakMap();
function stackBundle(template,height){
  let variants=stackTemplates.get(template);if(!variants){variants=new Map();stackTemplates.set(template,variants);}
  if(!variants.has(height)){
    const root=new T.Group(),scaled=new T.Group(),content=template.clone(true),bounds=new T.Box3().setFromObject(content);
    content.position.y-=bounds.min.y;scaled.scale.y=height/Math.max(.001,bounds.max.y-bounds.min.y);scaled.add(content);root.add(scaled);variants.set(height,root);
  }
  return variants.get(height);
}
export function updateStack(actor,template,amount,bagCapacity,{dt=1/60,time=0,moving=false,reducedMotion=false,config=WORLD.stack}={}){
  if(actor.stackTemplate!==template){actor.stackTemplate=template;actor.stack.clear();actor.layers=[];}
  const levels=stackLevels(amount,bagCapacity,config),count=Math.ceil(levels);
  while(actor.layers.length<count){const layer=stackBundle(template,config.layerHeight).clone(true);layer.scale.set(.2,1,.2);actor.stack.add(layer);actor.layers.push(layer);}
  while(actor.layers.length>count)actor.stack.remove(actor.layers.pop());
  actor.layers.forEach((layer,i)=>{
    const sway=reducedMotion?0:Math.sin(time*4-i*.23)*(moving?.09:.018)*(i+1)/Math.max(1,count);
    layer.position.set(sway*(i+1)*.13,i*config.layerHeight,.015*Math.sin(i));layer.rotation.y=Math.sin(i*2.3)*.06;layer.rotation.z=-sway*.22;
    const width=T.MathUtils.lerp(layer.scale.x,1,Math.min(1,dt*16));layer.scale.set(width,Math.min(1,levels-i),width);
  });
  return levels;
}

// Reuse layers by item type, so collecting one product never replaces the
// entire stack. Counts are grouped visually; actual inventories stay untouched.
export function updateCargoStack(actor,entries,capacity,templateFor,{dt=1/60,time=0,moving=false,reducedMotion=false,config=WORLD.stack}={}){
 const layout=cargoStackLayout(entries,capacity,config),available=new Map();
 for(const layer of actor.layers??[]){const key=layer.userData.cargoKey;if(!available.has(key))available.set(key,[]);available.get(key).push(layer);}
 const layers=layout.layers.map(entry=>{
  const key=entry.kind+':'+entry.id;let layer=available.get(key)?.shift();
  if(!layer){layer=stackBundle(templateFor(entry),config.layerHeight).clone(true);layer.scale.set(.2,1,.2);actor.stack.add(layer);}
  layer.userData.cargoKey=key;layer.userData.itemId=entry.id;layer.userData.kind=entry.kind;layer.userData.representedCount=entry.count;return layer;
 });
 for(const queue of available.values())for(const layer of queue)actor.stack.remove(layer);
 actor.layers=layers;actor.stackTemplate=null;
 let bottom=0;layers.forEach((layer,i)=>{
  const entry=layout.layers[i],sway=reducedMotion?0:Math.sin(time*4-i*.23)*(moving?.09:.018)*(i+1)/Math.max(1,layers.length);
  layer.position.set(sway*(i+1)*.13,bottom,.015*Math.sin(i));layer.rotation.y=Math.sin(i*2.3)*.06;layer.rotation.z=-sway*.22;
  const width=T.MathUtils.lerp(layer.scale.x,1,Math.min(1,dt*16));layer.scale.set(width,entry.height,width);bottom+=entry.height*config.layerHeight;
 });return layout.levels;
}

/** Reusable crop shape factories. A new skin normally needs only content.mjs. */
export const CROP_MODELS={
  blossom(c){
    const petals=geo('blossomPetals',()=>mergeParts(Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return{geometry:smallSphere(),position:[Math.cos(a)*.18,1.02,Math.sin(a)*.18],scale:[.21,.12,.21]};})));
    const leaves=geo('bloomLeaves',()=>mergeParts([{geometry:smallSphere(),position:[-.13,.34,0],scale:[.23,.055,.09],rotation:[0,0,-.4]},{geometry:smallSphere(),position:[.13,.51,0],scale:[.23,.055,.09],rotation:[0,.5,.35]}]));
    return[{g:cylinder(.028,.04,.86,5),color:c.stem,y:.43},{g:petals,color:c.color},{g:geo('bloomHeart',()=>mergeParts([{geometry:smallSphere(),position:[0,1.08,0],scale:[.11,.09,.11]}])),color:c.accent},{g:leaves,color:c.stem}];
  },
  sprig(c){const buds=geo('sprigHeads',()=>mergeParts(Array.from({length:7},(_,i)=>({geometry:smallSphere(),position:[i%2?.10:-.10,.6+i*.085,(i%3-1)*.06],scale:[.15,.17,.14]}))));return[{g:cylinder(.027,.04,1.12,5),color:c.stem,y:.56},{g:buds,color:c.color},{g:smallSphere(),color:c.accent,y:1.19,scale:[.10,.13,.10]}];},
  crystal(c){const cluster=geo('gemCluster',()=>mergeParts([{geometry:new T.OctahedronGeometry(1),position:[0,.68,0],scale:[.28,.67,.25]},{geometry:new T.OctahedronGeometry(1),position:[-.23,.43,.12],scale:[.2,.42,.21],rotation:[0,0,.27]},{geometry:new T.OctahedronGeometry(1),position:[.22,.38,-.13],scale:[.19,.38,.19],rotation:[.2,0,-.24]}]));return[{g:new T.DodecahedronGeometry(.4,0),color:'#8c9d94',y:.2,scale:[1.2,.65,1.1]},{g:cluster,color:c.color,emissive:.12},{g:new T.OctahedronGeometry(.10),color:c.accent,y:1.19}];},
  mushroom(c){const cap=geo('mushroomCap',()=>{const g=new T.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2);g.scale(.43,.31,.43);g.translate(0,.83,0);return g;});return[{g:cylinder(.09,.12,.83,7),color:c.stem,y:.415},{g:cap,color:c.color},{g:cylinder(.43,.43,.035,10),color:c.accent,y:.83},{g:geo('mushroomSpots',()=>mergeParts([{geometry:smallSphere(),position:[-.15,1.08,.1],scale:[.075,.025,.07]},{geometry:smallSphere(),position:[.17,1.04,.12],scale:[.08,.025,.065]},{geometry:smallSphere(),position:[0,1.12,-.14],scale:[.06,.02,.06]}])),color:c.accent}];},
  orchard(c){return[
    {g:cylinder(.13,.2,1.9,7),color:'#9e7d58',y:.95,permanent:true},
    {g:smallSphere(),color:'#8baa6a',y:2.1,scale:[.95,.75,.85],permanent:true},
    {g:geo('orchardFruit',()=>mergeParts(Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return{geometry:smallSphere(),position:[Math.cos(a)*.72,1.7+(i%2)*.35,Math.sin(a)*.72],scale:[.19,.2,.19]};}))),color:c.color}
  ];},
  fruit(c){return[{g:cylinder(.03,.045,.72,5),color:c.stem,y:.36},{g:geo('starfruit',()=>new T.DodecahedronGeometry(.34,0)),color:c.color,y:.94},{g:geo('fruitCrown',()=>new T.OctahedronGeometry(.15)),color:c.accent,y:1.28,scale:[1,.6,1]}];}
};

function labelTexture(text,{background='transparent',color='#fff9e3',size=128}={}){const c=document.createElement('canvas');c.width=512;c.height=size;const x=c.getContext('2d');if(background!=='transparent'){x.fillStyle=background;x.fillRect(0,0,c.width,c.height);}x.textAlign='center';x.textBaseline='middle';x.font='700 46px system-ui';x.fillStyle=color;x.fillText(text,256,size/2);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;}
function shadowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(48,61,28,.28)');g.addColorStop(.55,'rgba(48,61,28,.15)');g.addColorStop(1,'rgba(48,61,28,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
const shadowMapTexture=shadowTexture();
function blob(parent,x,z,scale=1,opacity=.5){const mat=new T.MeshBasicMaterial({map:shadowMapTexture,transparent:true,depthWrite:false,opacity});const m=mesh(geo('blobPlane',()=>new T.PlaneGeometry(1,1)),mat,parent,x,.065,z,{shadow:false});m.rotation.x=-Math.PI/2;m.scale.set(scale,scale,scale);return m;}

function makeWoodcock(){const root=new T.Group(),body=new T.Group();root.add(body);blob(root,0,0,1.2,.45);const belly=mesh(sphere(1),'#ac8965',body,0,.52,0);belly.scale.set(.38,.4,.55);const head=mesh(sphere(.24),'#967658',body,0,.95,.3);for(const x of [-.13,.13])mesh(sphere(.035),'#3f352f',body,x,1,.47);const beak=mesh(new T.ConeGeometry(.045,.65,6),'#b4926c',body,0,.91,.82);beak.rotation.x=Math.PI/2;for(const side of [-1,1]){const wing=mesh(sphere(1),'#735c49',body,side*.28,.65,-.08);wing.scale.set(.13,.26,.4);for(let i=0;i<3;i++){const stripe=mesh(box(.035,.035,.4),'#d0ae84',body,side*.37,.53+i*.1,-.08);stripe.rotation.x=-.25;}mesh(cylinder(.025,.035,.3,5),'#ae9473',body,side*.13,.15,.05);}const load=new T.Group();load.position.set(0,1.02,-.12);root.add(load);return{root,body,load};}

function makeHatModels(){
  const accessories={hat:new T.Group(),mushroomHat:new T.Group(),moonCrown:new T.Group()},smooth=geo('actorSmooth',()=>new T.SphereGeometry(1,18,12));
  mesh(cylinder(.48,.48,.045,18),'#dcca9c',accessories.hat,0,1.73,0);mesh(cylinder(.30,.35,.20,14),'#d9c597',accessories.hat,0,1.84,0);mesh(cylinder(.355,.355,.055,14),'#92b4a0',accessories.hat,0,1.77,0);
  const mushroomCap=mesh(geo('actorMushroomCap',()=>new T.SphereGeometry(1,18,10,0,Math.PI*2,0,Math.PI/2)),material('#9270b6',{emissive:'#71518e',emissiveIntensity:.18}),accessories.mushroomHat,0,1.8,0);mushroomCap.scale.set(.55,.34,.55);
  mesh(cylinder(.53,.53,.035,18),'#eddfc1',accessories.mushroomHat,0,1.79,0);
  for(const [x,y,z] of [[-.25,2.06,.14],[.20,2.08,.18],[.02,2.12,-.05],[-.12,1.98,.40],[.37,1.98,-.13]]){const spot=mesh(smooth,'#e8e9c5',accessories.mushroomHat,x,y,z);spot.scale.set(.075,.028,.065);}
  const crownGold=material('#e2be65',{metalness:.4,roughness:.35}),crownBand=mesh(geo('actorCrownBand',()=>new T.TorusGeometry(.31,.042,6,18)),crownGold,accessories.moonCrown,0,1.72,.02);crownBand.rotation.x=Math.PI/2;
  for(const x of [-.23,0,.23])mesh(cylinder(0,.065,.22,6),crownGold,accessories.moonCrown,x,1.85,.16);
  const crescent=mesh(geo('actorCrescent',()=>new T.TorusGeometry(.15,.038,6,24,Math.PI*1.45)),crownGold,accessories.moonCrown,0,2.09,.09);crescent.rotation.z=-Math.PI*.725;
  mesh(geo('actorCrownGem',()=>new T.OctahedronGeometry(.075)),'#ad9dd4',accessories.moonCrown,0,1.76,.30);
  return accessories;
}

export function makeActor(companion=false){
  const root=new T.Group(),body=new T.Group(),stack=new T.Group();root.add(body,stack);
  root.userData.character=companion?'Schnecki':'Hauptfigur';
  const coat=companion?'#4b5746':'#4b5142',hair=companion?'#493b2c':'#c5a064',skin=companion?'#e1b69a':'#edc1a7';
  const smooth=geo('actorSmooth',()=>new T.SphereGeometry(1,18,12));
  const oval=(color,x,y,z,sx,sy,sz)=>{const m=mesh(smooth,color,body,x,y,z);m.scale.set(sx,sy,sz);return m;};
  blob(root,0,0,1.65,.6);
  oval(coat,0,.75,0,.37,.48,.29);
  mesh(box(.22,.57,.035),companion?'#292d29':'#dfd0a9',body,0,.77,.275);
  for(const side of [-1,1]){
    const lapel=mesh(box(.1,.52,.045),coat,body,side*.16,.82,.29);lapel.rotation.z=side*-.13;
    if(companion){for(let i=0;i<4;i++)mesh(box(.20,.018,.035),'#899071',body,side*.26,.57+i*.14,.24);mesh(box(.018,.59,.035),'#899071',body,side*.28,.78,.25);}
    else for(let i=0;i<4;i++){const leaf=oval('#797a58',side*.055,.6+i*.11,.305,.035,.018,.012);leaf.rotation.z=side*.55;}
  }
  oval(skin,0,1.35,.04,.30,.34,.285);
  oval(hair,0,1.55,-.07,.32,companion?.21:.25,.29);
  if(companion){
    // Short dark hair with a loose, uneven fringe.
    for(let i=0;i<7;i++){const fringe=oval(i%2?hair:'#534331',-.25+i*.078,1.52+(i%3)*.025,.22,.075,.14,.08);fringe.rotation.z=-.35+i*.08;}
    for(const side of [-1,1])oval(hair,side*.278,1.4,-.015,.055,.13,.17);
    for(const side of [-1,1]){const brow=oval('#4a382a',side*.11,1.415,.291,.09,.018,.018);brow.rotation.z=side*-.08;const moustache=oval('#59402d',side*.068,1.245,.315,.095,.033,.026);moustache.rotation.z=side*.15;}
    oval('#93735d',0,1.10,.19,.14,.035,.06);
  }else{
    // Long golden hair, a centre part and face-framing strands.
    for(const side of [-1,1]){
      for(let i=0;i<5;i++){const lock=oval(i%2?'#d6b47b':hair,side*(.25+.025*Math.sin(i*1.7)),1.38-i*.115,-.11+i*.015,.11,.16,.15);lock.rotation.z=side*(.14+Math.sin(i)*.1);}
      const front=oval('#d4b075',side*.22,1.5,.17,.11,.20,.105);front.rotation.z=side*-.4;
      const earring=mesh(geo('actorEarring',()=>new T.TorusGeometry(.037,.009,5,12)),'#d6b76a',body,side*.30,1.255,.105);earring.rotation.y=side*.3;
      const brow=oval('#99764e',side*.11,1.41,.292,.075,.012,.015);brow.rotation.z=side*-.08;
    }
  }
  for(const side of [-1,1]){
    oval('#fff7e9',side*.105,1.35,.306,.048,.025,.014);
    oval(companion?'#655c42':'#759b9e',side*.105,1.35,.319,.022,.023,.012);
    oval('#302f29',side*.105,1.35,.327,.010,.015,.006);
    oval('#fffdf2',side*.11,1.36,.333,.006,.007,.004);
    oval('#e3a492',side*.19,1.265,.26,.061,.023,.025);
  }
  oval(skin,0,1.285,.325,.036,.05,.032);
  const smile=geo('actorSmile',()=>new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.075,1.20,.312),new T.Vector3(0,1.18,.325),new T.Vector3(.075,1.20,.312)]),14,.009,5,false));mesh(smile,'#a66c59',body);
  const legs=[];for(const x of [-.15,.15]){const leg=mesh(cylinder(.105,.12,.38,7),companion?'#46514a':'#636d56',body,x,.2,0);legs.push(leg);const shoe=mesh(smooth,'#9e8465',leg,0,-.15,.06);shoe.scale.set(.13,.12,.21);}
  for(const side of [-1,1]){const arm=oval(coat,side*.35,.77,.02,.13,.3,.13);arm.rotation.z=side*.2;oval(skin,side*.41,.51,.07,.105,.105,.105);}
  const accessories={...makeHatModels(),flower:new T.Group(),scarf:new T.Group(),snailEyes:new T.Group()};for(const [id,g] of Object.entries(accessories)){g.name='accessory:'+id;body.add(g);g.visible=false;}

  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,m=mesh(smooth,'#dfa397',accessories.flower,-.29+Math.cos(a)*.055,1.49+Math.sin(a)*.055,.19);m.scale.set(.045,.045,.025);}mesh(sphere(.032),'#e7c67a',accessories.flower,-.29,1.49,.22);
  mesh(cylinder(.21,.23,.12,12),'#b59acb',accessories.scarf,0,1.075,.02);const scarfEnd=mesh(box(.13,.32,.06),'#b59acb',accessories.scarf,.13,.91,.29);scarfEnd.rotation.z=.18;
  const eyeBand=mesh(geo('snailEyeBand',()=>new T.TorusGeometry(.30,.035,6,18)),'#8faa73',accessories.snailEyes,0,1.70,.02);eyeBand.rotation.x=Math.PI/2;
  for(const side of [-1,1]){
    const stalk=new T.Group();stalk.position.set(side*.21,1.70,.03);stalk.rotation.z=-side*.26;accessories.snailEyes.add(stalk);
    mesh(cylinder(.035,.045,.52,8),'#9fb97d',stalk,0,.25,0);
    mesh(sphere(.13),'#bfd393',stalk,0,.56,0);
    mesh(sphere(.085),'#fff8e5',stalk,0,.57,.075);
    mesh(sphere(.042),'#343b36',stalk,0,.57,.145);
    mesh(sphere(.014),'#ffffff',stalk,-.012,.59,.179);
  }
  const pack=mesh(roundedSlab(.63,.65,.35,.1),companion?'#8c8968':'#b99a69',body,0,.73,-.34);mesh(box(.1,.7,.05),'#d6bd87',pack,-.19,0,-.18);mesh(box(.1,.7,.05),'#d6bd87',pack,.19,0,-.18);
  return{root,body,stack,legs,walk:0,angle:0,layers:[],setAccessory(id){for(const [key,g]of Object.entries(accessories))g.visible=key===id;}};
}
const snailShellMaps=new Map();
function snailShellTexture(species){
 if(snailShellMaps.has(species.id))return snailShellMaps.get(species.id);
 const look=SNAIL_LOOKS[species.id],c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');
 x.fillStyle=species.color;x.fillRect(0,0,256,128);x.fillStyle=look.ink;x.strokeStyle=look.ink;x.lineWidth=4;x.lineCap='round';
 const dot=(a,b,r)=>{x.beginPath();x.arc(a,b,r,0,Math.PI*2);x.fill();};
 for(let row=0;row<3;row++)for(let col=0;col<6;col++){
  const a=col*46+(row%2)*19,b=row*44+17;
  x.save();x.translate(a,b);
  switch(look.pattern){
   case 'freckles':dot(0,0,4+(col%3));break;
   case 'drops':x.beginPath();x.moveTo(0,-10);x.bezierCurveTo(16,5,7,15,0,15);x.bezierCurveTo(-9,15,-14,5,0,-10);x.fill();break;
   case 'stripes':x.rotate(-.45);x.fillRect(-4,-20,8,40);break;
   case 'bands':x.fillRect(-24,-4,48,8);break;
   case 'leaves':x.rotate((row+col)*.7);x.beginPath();x.ellipse(0,0,6,14,.3,0,Math.PI*2);x.fill();break;
   case 'waves':x.beginPath();x.moveTo(-20,0);x.bezierCurveTo(-8,-17,8,17,23,0);x.stroke();break;
   case 'moons':x.beginPath();x.arc(0,0,13,.65,Math.PI*1.85);x.quadraticCurveTo(-5,1,10,8);x.fill();break;
   case 'apples':dot(-4,0,7);dot(4,0,7);x.fillStyle='#527442';x.fillRect(-1,-15,3,7);x.fillStyle=look.ink;break;
   case 'diamonds':x.beginPath();x.moveTo(0,-14);x.lineTo(8,0);x.lineTo(0,14);x.lineTo(-8,0);x.closePath();x.fill();break;
   case 'stars':x.beginPath();for(let i=0;i<10;i++){const angle=i*Math.PI/5-Math.PI/2,r=i%2?5:13;x.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);}x.closePath();x.fill();break;
  }
  x.restore();
 }
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;snailShellMaps.set(species.id,map);return map;
}

function makeButterfly(color){
 const root=new T.Group(),wings=[];
 mesh(cylinder(.045,.06,.48,7),'#766252',root,0,0,0).rotation.x=Math.PI/2;
 for(const side of [-1,1]){const wing=new T.Group();root.add(wing);wings.push(wing);for(const [z,size]of [[.12,.36],[-.18,.25]]){const lobe=mesh(sphere(size),color,wing,side*size*.8,0,z);lobe.scale.set(1,.09,1.12);const spot=mesh(sphere(size*.37),'#fff1ce',wing,side*size, .03,z);spot.scale.y=.12;}}
 return{root,wings};
}
export function makeSnail(index){
  const root=new T.Group(),load=new T.Group();blob(root,0,0,2.1,.4);
  const smooth=geo('snailSmooth',()=>new T.SphereGeometry(1,20,14)),cream='#ecd5af';
  const body=mesh(smooth,cream,root,0,.22,0);body.scale.set(.42,.22,.78);
  const face=new T.Group();face.name='snail-face';root.add(face);
  const head=mesh(smooth,cream,face,0,.51,.57);head.scale.set(.36,.4,.32);
  let currentSpecies=null;
  const shell=mesh(smooth,new T.MeshStandardMaterial({color:['#b69bda','#d9ba94','#a9c9b1'][index%3],roughness:.9}),root,0,.68,-.19);shell.name='snail-shell';shell.scale.set(.53,.56,.46);shell.userData.ownedMaterial=true;
  const points=[];for(let i=0;i<60;i++){const t=i/59*Math.PI*4.5,r=.43*(1-i/66);points.push(new T.Vector3(Math.cos(t)*r,Math.sin(t)*r,0));}
  const spiral=mesh(geo('snailSpiral',()=>new T.TubeGeometry(new T.CatmullRomCurve3(points),65,.032,7,false)),'#8e78b1',root,0,.68,.278);
  for(const x of [-.2,.2]){const stalk=mesh(cylinder(.028,.04,.34,8),cream,face,x,.94,.61);stalk.rotation.z=x*.6;mesh(sphere(.075),cream,face,x*1.18,1.11,.62);mesh(sphere(.043),'#554534',face,x*1.18,1.12,.682);mesh(sphere(.014),'#fffef2',face,x*1.18-.012,1.136,.719);const cheek=mesh(sphere(.07),'#eaa99e',face,x,.44,.845);cheek.scale.set(1,.5,.3);}
  const smile=new T.CatmullRomCurve3([new T.Vector3(-.075,.47,.87),new T.Vector3(0,.43,.89),new T.Vector3(.075,.47,.87)]);mesh(geo('snailSmile',()=>new T.TubeGeometry(smile,12,.012,5,false)),'#785e4f',face);
  const leaf=new T.Group();leaf.name='snail-default-leaf';root.add(leaf);const hat=mesh(smooth,'#98b07f',leaf,0,1.19,.54);hat.scale.set(.33,.055,.18);hat.rotation.z=.25;
  const flowers=new T.Group();root.add(flowers);for(let j=0;j<5;j++){const a=j*1.25;const f=mesh(sphere(.10),j%2?'#f4d3a1':'#e6cee9',flowers,Math.cos(a)*.33,1.17+Math.sin(a)*.08,-.19+Math.sin(a)*.21);f.scale.y=.6;mesh(sphere(.038),'#e2bd6e',flowers,f.position.x,f.position.y+.06,f.position.z);}
  const hats=makeHatModels(),hatRoot=new T.Group();hatRoot.position.set(0,.10,.55);hatRoot.scale.setScalar(.65);root.add(hatRoot);let currentHat=null,upgradeLevel=0;
  for(const [id,model]of Object.entries(hats)){model.name='snail-hat:'+id;model.visible=false;hatRoot.add(model);}
  const cart=new T.Group();cart.position.set(0,0,-1.18);root.add(cart);mesh(roundedSlab(.83,.27,.65,.08),'#bc996f',cart,0,.35,0);for(const x of [-.43,.43]){const wheel=mesh(cylinder(.17,.17,.07,12),'#8d765a',cart,x,.22,0);wheel.rotation.z=Math.PI/2;}mesh(box(.06,.06,.65),'#a98c65',cart,0,.25,.5);
  load.position.set(0,1.23,-.15);root.add(load);
  const sleepMap=labelTexture('z Z',{color:'#fff3ce'}),sleepSign=new T.Sprite(new T.SpriteMaterial({map:sleepMap,depthTest:true}));sleepSign.name='snail-sleep';sleepSign.position.set(.1,1.65,-.25);sleepSign.scale.set(1.0,.35,1);sleepSign.visible=false;sleepSign.userData.temporaryTexture=true;root.add(sleepSign);
  const butterfly=makeButterfly('#bb91e4');butterfly.root.name='snail-butterfly-wings';butterfly.root.position.set(0,1,-.2);butterfly.root.scale.setScalar(1.8);butterfly.root.visible=false;root.add(butterfly.root);
  return{root,load,stack:load,layers:[],count:0,setFlying(flying,time,reduced){butterfly.root.visible=flying;butterfly.wings.forEach((wing,i)=>wing.rotation.z=(i?1:-1)*(reduced?.35:.35+Math.sin(time*16)*.55));},setSleeping(sleeping,time=0){face.rotation.z=0;face.visible=!sleeping;body.scale.set(sleeping?.26:.42,sleeping?.12:.22,sleeping?.32:.78);if(sleeping)body.scale.y*=1+Math.sin(time*1.4)*.035;body.position.z=sleeping?-.18:0;hatRoot.visible=!sleeping;leaf.visible=!sleeping&&upgradeLevel>=2&&!currentHat;sleepSign.visible=sleeping;root.rotation.z=sleeping?.08:0;},setHat(id){currentHat=Object.hasOwn(hats,id)?id:null;for(const [key,model]of Object.entries(hats))model.visible=key===currentHat;leaf.visible=upgradeLevel>=2&&!currentHat;},setSpecies(id){const species=SNAILS.find(n=>n.id===id)??SNAILS[[0,2,1][index%3]];if(currentSpecies===species.id)return;currentSpecies=species.id;const look=SNAIL_LOOKS[species.id];shell.scale.set(...look.shape);shell.position.y=.12+look.shape[1];spiral.scale.set(look.shape[0]/.53,look.shape[1]/.56,1);spiral.position.set(0,shell.position.y,-.19+look.shape[2]+.008);shell.material.color.set('#ffffff');shell.material.map=snailShellTexture(species);shell.material.needsUpdate=true;root.userData.species=species.id;root.userData.shellPattern=look.pattern;},crawl(time,moving){if(!moving)return;const wave=Math.sin(time*3.4+index);body.scale.z*=1+wave*.035;face.rotation.z=wave*.025;},upgrade(level){upgradeLevel=level;leaf.visible=level>=2&&!currentHat;flowers.visible=level>=4;cart.visible=level>=6;load.position.set(0,level>=6?.57:1.23,level>=6?-1.18:-.15);}};
}

export class GardenScene {
  constructor(canvas,{reducedMotion=()=>false}={}){
    this.canvas=canvas;this.reducedMotion=reducedMotion;this.width=1;this.height=1;this.time=0;this.focus=new T.Vector3(WORLD.spawn.x,0,WORLD.spawn.z);this.zoom=1;this.flights=[];this.dust=[];this.harvestWaves=[];this.butterflies=[];this.parts=[];this.growthClock=0;this.sweepStrength=0;this.lastStack=0;
    this.touchRendering=globalThis.matchMedia?.('(pointer: coarse)').matches??false;
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.touchRendering?1.35:1.65));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.91;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.scene=new T.Scene();this.scene.background=new T.Color('#c2d6aa');this.scene.fog=new T.Fog('#c2d6aa',62,100);
    this.camera=new T.OrthographicCamera(-20,20,15,-15,.1,150);
    this.hemi=new T.HemisphereLight('#fffcf0','#8f9e77',1.55);this.scene.add(this.hemi);this.night=0;
    const light=new T.DirectionalLight('#fff5e5',2.1);light.position.set(-18,32,15);light.castShadow=true;light.shadow.mapSize.set(this.touchRendering?1024:1536,this.touchRendering?1024:1536);light.shadow.camera.left=light.shadow.camera.bottom=-38;light.shadow.camera.right=light.shadow.camera.top=38;light.shadow.camera.near=1;light.shadow.camera.far=100;light.shadow.normalBias=.06;light.shadow.bias=-.0002;light.shadow.radius=3;this.scene.add(light);this.sun=light;
    this.world=new T.Group();this.scene.add(this.world);this.actors=[makeActor(),makeActor(true)];this.actors.forEach(a=>this.scene.add(a.root));this.actors[1].root.userData.helperTarget="partner";
    this.woodcock=makeWoodcock();this.woodcock.root.userData.helperTarget="woodcock";this.woodcock.root.visible=false;this.scene.add(this.woodcock.root);this.raycaster=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);this.v3=new T.Vector3();
    this.destinationRing=mesh(new T.RingGeometry(.3,.36,36),new T.MeshBasicMaterial({color:'#fff5d8',transparent:true,opacity:.8,depthWrite:false}),this.scene,0,.085,0,{shadow:false});this.destinationRing.rotation.x=-Math.PI/2;this.destinationRing.visible=false;
    this.range=mesh(new T.RingGeometry(.99,1,64),new T.MeshBasicMaterial({color:'#ffffdf',transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide}),this.scene,0,.08,0,{shadow:false});this.range.rotation.x=-Math.PI/2;
    this.sweep=new T.Group();const sweepMesh=mesh(new T.RingGeometry(.86,1,48,1,0,Math.PI*.75),new T.MeshBasicMaterial({color:'#fff6d1',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}),this.sweep,0,.16,0,{shadow:false});sweepMesh.rotation.x=-Math.PI/2;this.sweepMaterial=sweepMesh.material;this.scene.add(this.sweep);
    this.tool=new T.Group();mesh(cylinder(.035,.04,1.2,7),'#b49767',this.tool,0,.28,0).rotation.z=Math.PI/2;const blade=mesh(new T.TorusGeometry(.49,.045,5,24,Math.PI*.95),'#edf0d6',this.tool,.58,.28,-.38);blade.rotation.x=Math.PI/2;this.scene.add(this.tool);this.pickaxe=new T.Group();mesh(cylinder(.035,.035,1.15,7),'#ac8a62',this.pickaxe,0,.35,0).rotation.z=.3;const pickHead=mesh(box(.72,.12,.14),'#b3c1b5',this.pickaxe,.12,.88,0);pickHead.rotation.z=.15;this.scene.add(this.pickaxe);
    this.moneyRing=new T.Group();this.scene.add(this.moneyRing);this.moneyCoins=[];for(let i=0;i<42;i++){const coin=mesh(cylinder(.14,.14,.055,18),material('#f0c66b',{metalness:.25,roughness:.4}),this.moneyRing);coin.rotation.x=0;coin.visible=false;this.moneyCoins.push(coin);}this.moneyGlow=0;
    this.helpers=Array.from({length:12},(_,i)=>{const snail=makeSnail(i);snail.root.userData.helperTarget="snail:"+i;snail.root.visible=false;this.scene.add(snail.root);return snail;});
    this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
  }
  build(cells,gardenIndex=0,{state=null,toolDefs=[]}={}){
    this.villageState=state;this.toolDefs=toolDefs;

    this.cells=cells;this.gardenIndex=gardenIndex;this.crop=getCrop(gardenIndex);const garden=GARDENS[gardenIndex],p=garden.palette;this.parts=[];
    this.world.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.temporaryTexture){o.material.map?.dispose();o.material.dispose();}if(o.userData.ownedMaterial)o.material.dispose();if(o.userData.ownedGeometry)o.geometry?.dispose();});this.world.clear();
    this.harvestWaves=[];this.glowMarker=new T.Group();this.glowMarker.name='glowing-flower';this.world.add(this.glowMarker);const ring=mesh(geo('glowFlowerRing',()=>new T.TorusGeometry(.5,.045,6,24)),'#ffe28c',this.glowMarker,0,.12,0);ring.rotation.x=Math.PI/2;for(let i=0;i<3;i++)mesh(geo('glowFlowerStar',()=>new T.OctahedronGeometry(.10)),'#fff1a9',this.glowMarker,Math.cos(i*2.1)*.4,1+i*.2,Math.sin(i*2.1)*.4);this.glowMarker.visible=false;
    for(const b of this.butterflies)this.scene.remove(b.root);this.butterflies=[];this.harvestBundles={};
    for(const f of this.flights)this.scene.remove(f.mesh);this.flights=[];for(const d of this.dust)this.scene.remove(d.mesh);this.dust=[];
    this.scene.background.set(p.ground);this.scene.fog.color.set(p.ground);
    mesh(box(100,.4,100),p.ground,this.world,0,-.22,0,{shadow:false});
    // Soft flecks make the grass feel warm without a heavy texture dependency.
    const specks=new T.InstancedMesh(geo('speck',()=>new T.CircleGeometry(1,5)),material('#d2dda5',{transparent:true,opacity:.28,depthWrite:false}),700),dummy=new T.Object3D();
    for(let i=0;i<700;i++){const x=Math.sin(i*367.1)*44,z=Math.cos(i*217.7)*44;dummy.position.set(x,.002,z);dummy.rotation.set(-Math.PI/2,0,i);dummy.scale.setScalar(.035+(i%7)*.018);dummy.updateMatrix();specks.setMatrixAt(i,dummy.matrix);}this.world.add(specks);
    for(const path of PATHS){const m=mesh(roundedSlab(path.width,.055,path.depth,.6),p.path,this.world,path.x,.005,path.z,{shadow:false});m.name='path:'+path.id;}
    for(const [i,f]of (state?BEDS:WORLD.fields).entries()){const fieldCells=state?this.cells.filter(c=>c.bed===i):[],w=fieldCells.length?Math.max(...fieldCells.map(c=>c.x))-Math.min(...fieldCells.map(c=>c.x))+f.spacing+.45:f.columns*f.spacing+.45,d=fieldCells.length?Math.max(...fieldCells.map(c=>c.z))-Math.min(...fieldCells.map(c=>c.z))+f.spacing+.4:f.rows*f.spacing+.4,unlocked=!state||state.village.beds[i]>0;mesh(roundedSlab(w,.055,d,.45),unlocked?(i===5?'#a8b3ad':p.soil):'#c3cea3',this.world,fieldCells.length?(Math.max(...fieldCells.map(c=>c.x))+Math.min(...fieldCells.map(c=>c.x)))/2:f.x,.003,fieldCells.length?(Math.max(...fieldCells.map(c=>c.z))+Math.min(...fieldCells.map(c=>c.z)))/2:f.z,{shadow:false});if(!unlocked){const border=mesh(roundedSlab(w+.15,.03,d+.15,.45),'#dce2c5',this.world,f.x,-.005,f.z,{shadow:false});}}
    this.makePlants(cells,this.crop);this.makeBank();this.makeDecor();if(state?.village.beds[5])this.makeCave();
    this.bundleTemplate=this.makeBundle(this.crop);this.actors[0].stack.clear();this.actors[0].layers=[];this.actors[1].stack.clear();this.actors[1].layers=[];this.lastStack=0;
    this.makeLanterns();this.makeEveningLife();if(state)this.refreshConstruction(state,toolDefs);
    this.focus.set(WORLD.spawn.x,0,WORLD.spawn.z);this.updateCamera(1);this.growthClock=1;
  }
  makeBusStop(){const g=new T.Group();g.position.set(VILLAGE.bus.x,0,VILLAGE.bus.z);this.construction.add(g);mesh(roundedSlab(5.5,.12,3.7,.3),'#e4d9bf',g,0,.05,0);for(const x of [-2,2])mesh(cylinder(.07,.09,2.8,8),'#baa17f',g,x,1.4,-.9);mesh(roundedSlab(5,.25,3,.2),'#aa94c9',g,0,2.9,-.2);mesh(box(4.3,1.5,.12),'#cbd9bd',g,0,1.25,-1);mesh(roundedSlab(3.4,.15,.65,.1),'#c29870',g,0,.85,0);for(const x of [-1.3,1.3])mesh(box(.12,.8,.45),'#a18f72',g,x,.4,0);mesh(cylinder(.06,.08,3.2,8),'#b7a17c',g,2.9,1.6,.3);const sign=mesh(cylinder(.6,.6,.12,24),'#e4cf8c',g,2.9,2.8,.3);sign.rotation.x=Math.PI/2;const label=labelTexture('BUS · BALD',{color:'#766184'}),plane=mesh(new T.PlaneGeometry(2.8,.7),new T.MeshBasicMaterial({map:label,transparent:true,depthWrite:false}),g,0,2.6,.9,{shadow:false});plane.rotation.x=-.35;plane.userData.temporaryTexture=true;}
  makePlants(cells,crop){
    this.parts=[];this.plantTransforms=null;const groups=new Map();cells.forEach((p,index)=>{const id=p.crop??'default';if(!groups.has(id))groups.set(id,[]);groups.get(id).push(index);});
    for(const [id,indices]of groups){const c=COLLECTIBLES[id]??crop,factory=CROP_MODELS[c.model];if(!factory)throw new Error('Unsupported crop model: '+c.model);const blueprints=factory(c);blueprints.forEach((b,i)=>{
      const g=geo(c.model+'part'+i+c.height+c.width,()=>{const result=b.g.clone();const s=b.scale??[1,1,1];result.scale(s[0]*(c.width/.62),s[1]*c.height/1.08,s[2]*(c.width/.62));result.translate(0,(b.y??0)*c.height/1.08,0);return result;});
      const m=new T.InstancedMesh(g,material('#ffffff',b.emissive?{emissive:b.color,emissiveIntensity:b.emissive}:{}),indices.length);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=i<3;m.receiveShadow=false;m.frustumCulled=false;const isHead=b.color===c.color||b.color===c.accent;
      indices.forEach((index,slot)=>{const p=cells[index],color=new T.Color(p.rare&&isHead?(b.color===c.accent?'#fff0b2':'#f5d078'):b.color);color.offsetHSL(0,0,(p.variation-1)*.12);m.setColorAt(slot,color);});m.instanceColor.needsUpdate=true;this.world.add(m);this.parts.push({mesh:m,indices,permanent:b.permanent===true});
    });}
    const stub=new T.InstancedMesh(cylinder(.026,.035,.13,4),material('#d8cd9c'),cells.length),dummy=new T.Object3D();for(let i=0;i<cells.length;i++){dummy.position.set(cells[i].x,.07,cells[i].z);dummy.updateMatrix();stub.setMatrixAt(i,dummy.matrix);}stub.receiveShadow=false;this.world.add(stub);
    this.updatePlants(this.villageState?.journey?.growthTime??0);
  }
  updatePlants(time){
    const count=this.cells.length,reduced=this.reducedMotion(),waves=this.harvestWaves??[];
    if(this.plantTransforms?.length!==count*16){this.plantTransforms=new Float32Array(count*16);this.permanentTransforms=new Float32Array(count*16);this.plantDummy=new T.Object3D();this.permanentPlantsReady=false;}
    const dummy=this.plantDummy;
    for(let index=0;index<count;index++){
      const p=this.cells[index],angle=p.id*2.399,growth=cropGrowth(p,time)*p.variation;let bend=0;
      if(!reduced&&FLOWER_CROPS.includes(p.crop))for(const wave of waves){
        const dx=p.x-wave.x,dz=p.z-wave.z;if(Math.abs(dx)>=4||Math.abs(dz)>=4)continue;
        const d=Math.hypot(dx,dz),phase=(this.time-wave.time)*5-d;
        if(d<4&&phase>0&&phase<2)bend+=Math.sin(phase*Math.PI)*.28*(1-d/4);
      }
      dummy.position.set(p.x,.06,p.z);dummy.rotation.set(Math.cos(angle)*bend,angle,Math.sin(angle)*bend);
      dummy.scale.set(growth,growth*(this.villageState&&fertilized(this.villageState,p)?2:1),growth);dummy.updateMatrix();dummy.matrix.toArray(this.plantTransforms,index*16);
      if(!this.permanentPlantsReady){dummy.rotation.set(0,angle,0);dummy.scale.setScalar(p.variation);dummy.updateMatrix();dummy.matrix.toArray(this.permanentTransforms,index*16);}
    }
    for(const part of this.parts){
      if(part.permanent&&part.transformsReady)continue;
      const source=part.permanent?this.permanentTransforms:this.plantTransforms,target=part.mesh.instanceMatrix.array;let dirty=false;
      part.indices.forEach((index,slot)=>{const from=index*16,to=slot*16;for(let j=0;j<16;j++)if(target[to+j]!==source[from+j]){target[to+j]=source[from+j];dirty=true;}});
      if(dirty)part.mesh.instanceMatrix.needsUpdate=true;part.transformsReady=true;
    }
    this.permanentPlantsReady=true;
  }

  cargoTemplate(entry){if(entry.kind==='fish')return this.fishBundle(entry.id.slice(5));return entry.kind==='product'?this.productBundle(entry.id):(this.harvestBundles[entry.id]??=this.makeBundle(COLLECTIBLES[entry.id]));}
  makeBundle(c){const g=new T.Group();if(c.bundle==='crate'){
    mesh(roundedSlab(.9,.17,.64,.06),c.wrap,g,0,0,0);for(const x of [-.43,.43])mesh(box(.055,.34,.64),c.wrap,g,x,.11,0);for(const z of [-.30,.30])mesh(box(.9,.22,.045),c.tie,g,0,.12,z);
    for(let i=0;i<3;i++){const x=(i-1)*.25,z=(i%2)*.15-.07;if(c.model==='orchard'||c.model==='fruit'){mesh(sphere(.17),c.color,g,x,.25,z);const leaf=mesh(sphere(.065),c.stem,g,x+.06,.4,z);leaf.scale.set(1.2,.25,.6);}else if(c.model==='mushroom'){mesh(cylinder(.045,.06,.2,6),c.stem,g,x,.23,z);const cap=mesh(sphere(.15),c.color,g,x,.36,z);cap.scale.y=.55;mesh(sphere(.035),c.accent,g,x-.04,.44,z);}else{const gem=mesh(geo('crateGem',()=>new T.OctahedronGeometry(1)),i%2?c.accent:c.color,g,x,.20,z);gem.scale.set(.18,.28,.17);}}
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
    if(this.construction){this.world.remove(this.construction);this.construction.traverse(o=>{if(o.userData.temporaryTexture){o.material.map?.dispose();o.material.dispose();}if(o.userData.ownedMaterial)o.material.dispose();if(o.userData.ownedGeometry)o.geometry?.dispose();});}
    this.construction=new T.Group();this.world.add(this.construction);this.padVisuals=new Map();this.workshopVisuals=new Map();this.farmVisuals=[];this.hiveVisuals=[];this.kitchenVisual=null;const v=state.village;this.makeHives();
    this.makeOutdoorModels(state);this.makeBoutiques(state);this.makeStructure('storage',VILLAGE.warehouse.x,VILLAGE.warehouse.z-1.5,v.warehouse);
    if(v.bus)this.makeBusStop();if(v.farm.built)this.makeStructure('farm',VILLAGE.farm.x,VILLAGE.farm.z,1);
    this.makeStructure('house',VILLAGE.partner.x,VILLAGE.partner.z,v.house);
    for(const w of WORKSHOPS)if(v.workshops[w.id].level||getBuildPads(state,toolDefs).find(p=>p.id==='workshop:'+w.id)?.visible)this.makeStructure(w.model,w.x,w.z,v.workshops[w.id].level);
    for(const w of WORKSHOPS){if(!v.workshops[w.id].level)continue;const input=new T.Group(),output=new T.Group();input.position.set(w.x-1.6,1.25,w.z+.55);output.position.set(w.x+1.8,1.8,w.z+1.8);this.construction.add(input,output);for(let i=0;i<4;i++){const raw=this.bundleTemplate.clone(true);raw.scale.setScalar(.38);raw.position.set(0,i*.16,0);input.add(raw);const item=this.productBundle(w.product).clone(true);item.scale.setScalar(1.15);item.position.set(0,i*.5,0);output.add(item);}for(const [text,x]of [['ZUTATEN ↓',-1.8],['ABHOLEN ↑',1.8]]){const map=labelTexture(text),sign=new T.Sprite(new T.SpriteMaterial({map,depthTest:true}));sign.position.set(w.x+x,.75,w.z+2.1);sign.scale.set(2.1,.52,1);sign.userData.temporaryTexture=true;this.construction.add(sign);}const bars=[];for(const [id,y]of [[w.product,3.7],...(w.id==='tea'?[['honeyapple',4.05]]:[])]){mesh(box(2.5,.15,.12),'#eee3c9',this.construction,w.x,y,w.z);const bar=mesh(box(1,.12,.15),PRODUCTS[id].color,this.construction,w.x-1.2,y,w.z+.02);bars.push({id,bar});}const apples=w.id==='tea'?new T.Group():null;if(apples){apples.position.set(w.x+2.6,1.8,w.z+1.8);for(let i=0;i<4;i++){const item=this.productBundle('honeyapple').clone(true);item.scale.setScalar(1.15);item.position.y=i*.5;apples.add(item);}this.construction.add(apples);}const activity=this.makeWorkshopActivity(w),statusSign=new T.Sprite(new T.SpriteMaterial({map:labelTexture('WARTET AUF ZUTATEN'),depthTest:true}));statusSign.userData.temporaryTexture=true;statusSign.position.set(w.x,4.5,w.z);statusSign.scale.set(3.4,.55,1);this.construction.add(statusSign);const needsSign=this.makeWorkshopNeeds(w);this.workshopVisuals.set(w.id,{input,output,bars,apples,activity,statusSign,status:null,needsSign,needsKey:'',needsClock:0});}
    if(v.sprinkler)this.makeStructure('sprinkler',VILLAGE.sprinkler.x,VILLAGE.sprinkler.z,v.sprinkler);
    for(const pad of getBuildPads(state,toolDefs)){
      if(pad.max||!pad.visible)continue;if(pad.kind==='expansion'){this.makeExpansionArea(pad);continue;}const root=new T.Group();root.position.set(pad.x,0,pad.z);this.construction.add(root);
      const edgeMat=new T.MeshBasicMaterial({color:pad.locked?'#d7d9c0':'#fff8cf',transparent:true,opacity:pad.locked?.45:.9});const edge=mesh(roundedSlab(2.65,.035,2.35,.25),edgeMat,root,0,.065,0,{shadow:false});
      mesh(roundedSlab(2.48,.04,2.18,.22),pad.locked?'#b7c09a':pad.kind==='tool'?'#c9bdd8':'#b4c5a0',root,0,.095,0,{shadow:false});
      const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');drawPadIcon(x,padIcon(pad),pad.locked?'#647055':'#405332');const cost=Math.max(0,pad.cost-pad.paid);const label=cost>=1e6?(cost/1e6).toLocaleString('de-DE',{maximumFractionDigits:1})+' Mio.':cost>=1000?(cost/1000).toLocaleString('de-DE',{maximumFractionDigits:1})+' Tsd.':String(Math.ceil(cost));const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const textMesh=mesh(new T.PlaneGeometry(2.25,2.15),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:pad.locked?.7:1}),root,0,.13,0,{shadow:false});textMesh.rotation.x=-Math.PI/2;textMesh.userData.temporaryTexture=true;const rail=mesh(roundedSlab(2.1,.065,.23,.06),'#e7dfc6',root,0,.18,.85,{shadow:false});const fill=mesh(box(1,.075,.15),'#d7b75f',root,-1,.21,.85,{shadow:false});fill.scale.x=.001;
      const board=document.createElement('canvas');board.width=640;board.height=256;const ctx=board.getContext('2d');ctx.fillStyle='#fff7df';ctx.beginPath();ctx.roundRect(4,4,632,248,28);ctx.fill();ctx.strokeStyle='#ccb48f';ctx.lineWidth=8;ctx.stroke();ctx.fillStyle='#675a45';ctx.textAlign='center';ctx.font='700 64px system-ui';const words=pad.label.split(' ');let lines=[''];for(const word of words){const last=lines.length-1;if(ctx.measureText(lines[last]+' '+word).width>580)lines.push(word);else lines[last]+=(lines[last]?' ':'')+word;}lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,320,62+i*64,580));ctx.font='bold 58px system-ui';ctx.fillStyle=pad.locked?'#746f63':'#78591e';ctx.fillText(pad.locked?pad.requiredRound>state.journey.round?'Ab Runde '+pad.requiredRound:pad.reason?.includes('Samen')?'Samen entdecken':'Voraussetzung fehlt':label+' ✧',320,193);const signMap=new T.CanvasTexture(board);signMap.colorSpace=T.SRGBColorSpace;const sign=new T.Sprite(new T.SpriteMaterial({map:signMap,depthTest:true}));sign.position.set(0,3,-.9);sign.scale.set(5.5,2.2,1);sign.visible=false;sign.userData.temporaryTexture=true;root.add(sign);mesh(box(.08,2.2,.08),'#ba9c72',root,0,1.1,-.7);this.padVisuals.set(pad.id,{root,edge,edgeMat,fill,sign,icon:textMesh,iconKind:padIcon(pad),cost:pad.cost});
    }
  }
  makeExpansionArea(pad){
   const a=pad.area;if(!a)return;const root=new T.Group();root.name='field-expansion-preview:'+pad.id;root.position.set(a.x,0,a.z);this.construction.add(root);
   const areaMat=new T.MeshBasicMaterial({color:pad.locked?'#b6bea4':'#d4e6a4',transparent:true,opacity:.25,depthWrite:false});
   const area=mesh(box(a.width,.025,a.depth),areaMat,root,0,.11,0,{shadow:false});area.userData.ownedMaterial=true;
   const points=[[-a.width/2,-a.depth/2],[a.width/2,-a.depth/2],[a.width/2,a.depth/2],[-a.width/2,a.depth/2],[-a.width/2,-a.depth/2]].map(([x,z])=>new T.Vector3(x,.15,z));
   const edgeMat=new T.LineDashedMaterial({color:'#fff8cf',dashSize:.32,gapSize:.2,transparent:true,opacity:.9,depthWrite:false});const edge=new T.Line(new T.BufferGeometry().setFromPoints(points),edgeMat);edge.computeLineDistances();edge.userData.ownedMaterial=true;edge.userData.ownedGeometry=true;root.add(edge);
   const remaining=Math.ceil(Math.max(0,pad.cost-pad.paid)),map=labelTexture('FLÄCHE + · '+remaining+' ✧',{color:'#fff9df'}),sign=new T.Sprite(new T.SpriteMaterial({map,depthTest:true}));sign.position.set(0,1.6,0);sign.scale.set(3.4,.65,1);sign.userData.temporaryTexture=true;root.add(sign);
   mesh(roundedSlab(2.1,.06,.23,.06),'#e7dfc6',root,0,.26,0,{shadow:false});const fill=mesh(box(1,.075,.15),'#d7b75f',root,-1,.3,0,{shadow:false});fill.scale.x=.001;
   this.padVisuals.set(pad.id,{root,edge,edgeMat,areaMat,fill,sign,cost:pad.cost});
  }
  fishBundle(id){
   this.fishTemplates??={};if(this.fishTemplates[id])return this.fishTemplates[id];
   const fish=FISH.find(f=>f.id===id)??FISH[0],root=new T.Group();root.name='fish:'+fish.id;
   mesh(sphere(.38),fish.color,root,0,.2,0).scale.set(1.65,.65,.6);
   const tail=mesh(new T.ConeGeometry(.26,.42,3),fish.color,root,-.68,.2,0);tail.rotation.z=-Math.PI/2;tail.scale.z=.4;
   const fin=mesh(new T.ConeGeometry(.18,.24,3),fish.color,root,-.1,.47,0);fin.scale.z=.25;
   for(const side of [-1,1]){mesh(sphere(.07),'#fff8e8',root,.4,.27,side*.16);mesh(sphere(.035),'#304c50',root,.43,.28,side*.215);}
   this.fishTemplates[id]=root;return root;
  }
  updateFishingVisual(player){
   const f=this.villageState?.outdoors?.fishing,visual=this.fishingVisual;if(!visual)return;visual.root.visible=!!f;if(!f)return;
   if(visual.id!==f.fishId){visual.fish.clear();visual.fish.add(this.fishBundle(f.fishId).clone(true));visual.id=f.fishId;}
   const t=this.reducedMotion()?0:this.time;
   const x=LAKE.x+Math.sin(t*1.8)*.7,z=LAKE.z+Math.cos(t*1.3)*.45;
   visual.fish.position.set(x,f.phase==='catch'?.22+Math.abs(Math.sin(t*4))*.2:.10,z);visual.fish.scale.setScalar(f.phase==='catch'?1.8:1.2);visual.fish.rotation.y=Math.cos(t*1.8)*.65;
   visual.bobber.position.set(x,.32+Math.sin(t*5)*.06,z+.35);
   const p=visual.line.geometry.attributes.position;p.setXYZ(0,player.x+.4,1.7,player.z);p.setXYZ(1,x,visual.bobber.position.y,z+.35);p.needsUpdate=true;visual.line.geometry.computeBoundingSphere();
  }
  makeOutdoorModels(state){
   const fishingRoot=new T.Group();fishingRoot.name='lake-fishing';fishingRoot.visible=false;this.construction.add(fishingRoot);const fish=new T.Group();fishingRoot.add(fish);const bobber=mesh(sphere(.14),'#df886c',fishingRoot);const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#f6eed3',transparent:true,opacity:.8}));line.userData.ownedGeometry=true;line.userData.ownedMaterial=true;fishingRoot.add(line);this.fishingVisual={root:fishingRoot,fish,bobber,line,id:null};
   this.detectorMarker=new T.Group();this.detectorMarker.name='detector-signal';this.construction.add(this.detectorMarker);const ring=mesh(geo('digRing',()=>new T.TorusGeometry(.65,.055,6,32)),'#f0ce78',this.detectorMarker,0,.17,0);ring.rotation.x=Math.PI/2;mesh(box(.5,.06,.09),'#f0ce78',this.detectorMarker,0,.18,0);mesh(box(.09,.06,.5),'#f0ce78',this.detectorMarker,0,.18,0);this.detectorMarker.visible=false;
   this.fertilizerVisuals=[];for(let i=0;i<20;i++){const patch=mesh(cylinder(FERTILIZER_RADIUS,FERTILIZER_RADIUS,.025,40),material('#a8c76e',{transparent:true,opacity:.25,depthWrite:false}),this.construction,0,.10,0,{shadow:false});patch.name='fertilized-soil';patch.visible=false;this.fertilizerVisuals.push(patch);}
   const d=LAKE.dock,dock=new T.Group();dock.name='fishing-shore';dock.position.set(d.x,0,d.z);this.construction.add(dock);
   for(let i=0;i<10;i++)mesh(box(d.width,.12,d.depth/10-.025),i%2?'#b89970':'#c9aa80',dock,0,.22,-d.depth/2+(i+.5)*d.depth/10);
   for(const x of [-d.width/2+.12,d.width/2-.12]){mesh(box(.12,.15,d.depth),'#8b7357',dock,x,.10,0);for(const z of [-d.depth/2+.12,d.depth/2-.12]){mesh(cylinder(.075,.09,.8,8),'#957957',dock,x,.35,z);mesh(sphere(.095),'#c6aa7e',dock,x,.77,z);}}
   for(const x of [-d.width/2+.12,d.width/2-.12])mesh(box(.05,.05,d.depth-.22),'#d6c6a0',dock,x,.64,0);
   const map=labelTexture('ANGELSTEG');const sign=new T.Sprite(new T.SpriteMaterial({map,depthTest:true}));sign.userData.temporaryTexture=true;sign.position.set(0,1.15,-d.depth/2-.15);sign.scale.set(2,.5,1);dock.add(sign);
   this.composterVisual=null;this.fertilizerTemplate=new T.Group();const bag=mesh(sphere(.27),'#bdc793',this.fertilizerTemplate,0,.3,0);bag.scale.set(.85,1.15,.65);mesh(cylinder(.10,.14,.09,8),'#8fa271',this.fertilizerTemplate,0,.61,0);const leaf=mesh(sphere(.09),'#648855',this.fertilizerTemplate,0,.32,.18);leaf.scale.set(1,.6,.15);
   if(state.outdoors?.composterBuilt){const w=COMPOST_WORKSHOP,root=new T.Group();root.name='garden-composter';root.position.set(w.x,0,w.z);this.construction.add(root);mesh(roundedSlab(3,.15,2.6,.2),'#c6bb95',root,0,.1,0);mesh(box(2.1,1.5,1.8),'#b69a70',root,0,.9,0);for(const x of [-1,1])mesh(box(.1,1.6,1.9),'#d3bd8b',root,x,.9,0);const roof=mesh(cylinder(0,1.9,.8,4),'#8ea472',root,0,2,0);roof.rotation.y=Math.PI/4;mesh(box(.8,.65,.06),'#766d50',root,0,.75,.93);mesh(sphere(.28),'#a9bf7f',root,0,1.1,.95).scale.set(1,.7,.25);
    const signMap=labelTexture(w.name),sign=new T.Sprite(new T.SpriteMaterial({map:signMap,depthTest:true}));sign.userData.temporaryTexture=true;sign.position.set(0,3.05,0);sign.scale.set(3.5,.7,1);root.add(sign);
    mesh(box(2.5,.13,.12),'#eee3c9',root,0,2.6,.4);const bar=mesh(box(1,.1,.15),'#a1bd78',root,-1.2,2.6,.43);
    const output=new T.Group();output.position.set(w.output.x-w.x,1.1,w.output.z-w.z);root.add(output);for(let i=0;i<4;i++){const item=this.fertilizerTemplate.clone(true);item.position.y=i*.45;output.add(item);}
    const outputMap=labelTexture('DÜNGER ABHOLEN'),outputSign=new T.Sprite(new T.SpriteMaterial({map:outputMap,depthTest:true}));outputSign.userData.temporaryTexture=true;outputSign.position.set(w.output.x-w.x,.6,w.output.z-w.z+.8);outputSign.scale.set(2.2,.5,1);root.add(outputSign);this.composterVisual={root,bar,output};
   }
   this.sprayerVisual=new T.Group();this.sprayerVisual.name='fertilizer-sprayer';this.construction.add(this.sprayerVisual);mesh(cylinder(.22,.25,.55,10),'#b8c98b',this.sprayerVisual,0,.45,0);const pipe=mesh(box(.6,.05,.05),'#9caa80',this.sprayerVisual,.35,.65,0);pipe.rotation.z=.2;
   this.outdoorTool=new T.Group();this.outdoorTool.name='equipped-garden-tool';this.construction.add(this.outdoorTool);
   const id=state.outdoors?.equipped;
   if(id==='detector'){const pole=mesh(cylinder(.035,.035,1.1,8),'#6b7b72',this.outdoorTool,0,.7,0);pole.rotation.z=.35;const head=mesh(geo('detectorHead',()=>new T.TorusGeometry(.3,.045,6,20)),'#747b68',this.outdoorTool,.2,.2,0);head.rotation.x=Math.PI/2;mesh(box(.22,.15,.15),'#c7b67b',this.outdoorTool,-.16,1.1,0);}
   else if(id==='rod'){const rod=mesh(cylinder(.018,.045,1.8,7),'#a48456',this.outdoorTool,0,1,0);rod.rotation.z=-.3;mesh(cylinder(.07,.07,.12,8),'#98a7a4',this.outdoorTool,0,.65,0);}

  }
  makeFertilizerPickup(source,count){if(this.reducedMotion()||!this.fertilizerTemplate)return;for(let i=0;i<Math.min(4,count);i++){if(this.flights.length>28)break;const mesh=this.fertilizerTemplate.clone(true);mesh.position.set(source.x,1.1+i*.45,source.z);this.scene.add(mesh);this.flights.push({mesh,start:mesh.position.clone(),age:0,duration:.6,type:'pickup'});}}
  updateOutdoorVisuals(player){this.updateFishingVisual(player);const outdoor=this.villageState?.outdoors;const fertilizing=outdoor?.harvestMode==='fertilizer';if(this.sprayerVisual){this.sprayerVisual.visible=fertilizing&&!this.villageState.journey.asleep;this.sprayerVisual.position.set(player.x+.55,0,player.z+.25);this.sprayerVisual.rotation.y=player.angle??0;}if(this.composterVisual){const {bar,output}=this.composterVisual,c=outdoor.compost,ratio=c.remaining?1-c.remaining/60:c.ready?1:0;bar.scale.x=Math.max(.001,ratio*2.4);bar.position.x=-1.2+ratio*1.2;output.children.forEach((m,i)=>m.visible=i<Math.min(4,c.ready));output.position.y=1.1+(this.reducedMotion()?0:Math.sin(this.time*2)*.12);}if(this.detectorMarker){const target=outdoor?detectorTarget(this.villageState,player):null;this.detectorMarker.visible=!!target;if(target)this.detectorMarker.position.set(target.x,0,target.z);}if(this.fertilizerVisuals)for(const [i,patch]of this.fertilizerVisuals.entries()){const p=outdoor?.patches[i];patch.visible=!!p;if(p)patch.position.set(p.x,.10,p.z);}if(this.outdoorTool){this.outdoorTool.visible=!!outdoor?.equipped&&!fertilizing&&!this.villageState.journey.asleep;this.outdoorTool.position.set(player.x+.55,0,player.z+.25);this.outdoorTool.rotation.y=player.angle??0;}}
  makeBoutiques(state){
    const b=state.village.boutiques;
    for(const shop of BOUTIQUES){if(state.journey.round<shop.round)continue;const root=new T.Group();root.name='boutique:'+shop.id;root.position.set(shop.x,0,shop.z);this.construction.add(root);const built=b.built.includes(shop.id);
      mesh(roundedSlab(3.7,.15,3,.2),'#d8c5a3',root,0,.1,0);
      if(built&&shop.id==='style')this.makeAccessoryBuilding(root,shop);
      else if(built){mesh(roundedSlab(3.1,1.2,1.5,.12),'#b99268',root,0,.7,0);for(const side of [-1,1])mesh(cylinder(.065,.065,2.7,7),'#b99268',root,side*1.5,1.4,-.6);const awning=mesh(box(3.9,.14,2.6),shop.color,root,0,2.6,0);awning.rotation.x=.1;for(let i=0;i<6;i++)mesh(box(.32,.15,2.6),'#f0dfbb',root,-1.6+i*.64,2.69,0);for(let i=0;i<3;i++)mesh(sphere(.19),shop.color,root,-.7+i*.7,1.5,.2);}
      const map=labelTexture(shop.name),sign=new T.Sprite(new T.SpriteMaterial({map,depthTest:true}));sign.position.set(0,built?(shop.id==='style'?3.65:3.1):2.2,.5);sign.scale.set(3.5,.8,1);sign.userData.temporaryTexture=true;root.add(sign);
      if(!built){for(const x of [-1.4,1.4])mesh(cylinder(.055,.055,1.8,7),'#b99268',root,x,1,-.5);mesh(box(3.2,.55,.12),shop.color,root,0,1.75,-.5);}
      const detailMap=labelTexture(shop.id==='style'?'ACCESSOIRES & WERKZEUGE':'DEKORATIONEN'),detail=new T.Sprite(new T.SpriteMaterial({map:detailMap,depthTest:true}));detail.userData.temporaryTexture=true;detail.position.set(0,built?(shop.id==='style'?4.3:3.75):2.85,.5);detail.scale.set(3.6,.55,1);root.add(detail);
    }
    if(b.owned.includes('bench')){const g=new T.Group();g.name='cosmetic:bench';g.position.set(COSMETIC_PLACES.bench.x,0,COSMETIC_PLACES.bench.z);this.construction.add(g);mesh(box(2.7,.16,.85),'#bc9c70',g,0,.62,0);mesh(box(2.7,.65,.13),'#bc9c70',g,0,1.02,-.4);for(const x of [-1,1])mesh(box(.16,.65,.7),'#7b8666',g,x,.30,0);}
    if(b.owned.includes('arch')){const g=new T.Group();g.name='cosmetic:arch';g.position.set(COSMETIC_PLACES.arch.x,0,COSMETIC_PLACES.arch.z);this.construction.add(g);for(const side of [-1,1]){mesh(cylinder(.1,.13,2.9,7),'#c1a276',g,side*1.5,1.45,0);for(let i=0;i<5;i++){mesh(sphere(.18),i%2?'#b6c38a':'#d6afd0',g,side*(1.5-i*.1),1+i*.46,0);}}mesh(box(3.2,.12,.13),'#c1a276',g,0,2.9,0);for(let i=0;i<7;i++)mesh(sphere(.17),i%2?'#f1d3aa':'#d6afd0',g,-1.2+i*.4,2.9,0);}
    if(b.owned.includes('lanterns'))for(const p of COSMETIC_PLACES.lanterns){const g=new T.Group();g.name='cosmetic:lantern';g.position.set(p.x,0,p.z);this.construction.add(g);mesh(cylinder(.06,.10,1.4,7),'#96795b',g,0,.7,0);mesh(sphere(.27),this.lampBulb??material('#ffe3a2'),g,0,1.5,0);mesh(geo('boutiqueLanternRoof',()=>new T.ConeGeometry(.38,.3,6)),'#96795b',g,0,1.87,0);}
  }
  makeWorkshopNeeds(w){
   const sign=new T.Sprite(new T.SpriteMaterial({transparent:true,depthTest:true}));sign.name='workshop-needs:'+w.id;sign.userData.temporaryTexture=true;sign.position.set(w.x,5.9,w.z+.2);sign.visible=false;this.construction.add(sign);return sign;
  }
  updateWorkshopNeeds(visual,w,player,dt){
   const sign=visual.needsSign;if(!sign)return;sign.visible=Math.hypot(player.x-w.x,player.z-w.z)<10&&!this.villageState.journey.asleep;if(!sign.visible)return;
   visual.needsClock=Math.max(0,(visual.needsClock??0)-dt);if(visual.needsClock>0)return;visual.needsClock=.25;
   const needs=workshopNeeds(this.villageState,w),number=n=>(Math.round(n*10)/10).toLocaleString('de-DE'),running=this.villageState.village.workshops[w.id].running;
   const lines=needs.rows.map(row=>({label:row.need+' '+row.name,stock:number(Math.floor((row.have+1e-8)*10)/10)+' / '+row.need+' vor Ort'+(row.missing>1e-8?' · fehlt '+number(Math.ceil((row.missing-1e-8)*10)/10):' · bereit'),color:row.color,ready:row.missing<=1e-8}));
   const key=JSON.stringify([lines,needs.alternatives,running]);if(visual.needsKey===key)return;visual.needsKey=key;
   const canvas=document.createElement('canvas');canvas.width=768;canvas.height=90+lines.length*92+(needs.alternatives?62:0);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff8e9';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#b79ac9';ctx.fillRect(0,0,768,7);ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#6c587b';ctx.font='700 30px system-ui';ctx.fillText(running?'FÜR DIE NÄCHSTE CHARGE':'ZUTATEN HIER ABLIEFERN',28,42,712);
   lines.forEach((line,i)=>{const y=100+i*92;ctx.fillStyle=line.color;ctx.fillRect(28,y-19,24,48);ctx.fillStyle='#4d5a45';ctx.font='700 34px system-ui';ctx.fillText(line.label,72,y,665);ctx.fillStyle=line.ready?'#4b7950':'#a35f30';ctx.font='600 29px system-ui';ctx.fillText(line.stock,72,y+37,665);});
   if(needs.alternatives){ctx.fillStyle='#786a83';ctx.font='26px system-ui';ctx.fillText(w.id==='gifts'?needs.alternatives:'Oder: '+needs.alternatives,28,canvas.height-30,712);}
   const old=sign.material.map,map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;sign.material.map=map;sign.material.needsUpdate=true;const height=5.2*canvas.height/canvas.width;sign.scale.set(5.2,height,1);sign.position.y=4.95+height/2;old?.dispose();
  }
  makeAccessoryBuilding(root,shop){
   const house=new T.Group();house.name='accessory-shop-building';root.add(house);
   mesh(roundedSlab(3.2,2.4,2.15,.1),'#f0dfc3',house,0,1.3,0);
   const gable=geo('accessory-shop-gable',()=>{const shape=new T.Shape();shape.moveTo(-1.075,0);shape.lineTo(0,.44);shape.lineTo(1.075,0);shape.closePath();return new T.ShapeGeometry(shape);});for(const x of [-1.6,1.6])mesh(gable,material('#f0dfc3',{side:T.DoubleSide}),house,x,2.5,0).rotation.y=Math.PI/2;
   for(const z of [-.64,.64]){const roof=mesh(box(3.85,.15,1.5),shop.color,house,0,2.65,z);roof.rotation.x=z<0?-.36:.36;}
   mesh(box(3.85,.13,.12),'#9072aa',house,0,2.95,0);
   mesh(roundedSlab(.78,1.55,.08,.06),'#a78ab5',house,-.78,.96,1.13);mesh(sphere(.055),'#e6c37b',house,-.52,.94,1.19);
   mesh(box(1.05,.85,.09),'#bfa681',house,.65,1.36,1.13);mesh(box(.88,.68,.025),'#c1d8d1',house,.65,1.36,1.19);mesh(box(.055,.72,.04),'#f2e6d0',house,.65,1.36,1.22);
   const awning=mesh(box(1.17,.12,.42),shop.color,house,-.78,1.94,1.25);awning.rotation.x=.12;
   mesh(cylinder(.23,.34,.09,12),'#dcc393',house,.65,1.31,1.23).rotation.x=Math.PI/2;
  }
  makeWorkshopActivity(w){
   const root=new T.Group();root.name='workshop-activity:'+w.id;root.position.set(w.x,2.8,w.z);this.construction.add(root);
   const pieces=[];for(let i=0;i<3;i++){const p=mesh(w.id==='bouquet'?box(.32,.05,.08):w.id==='gifts'?geo('gift-bow-motion',()=>new T.TorusGeometry(.11,.025,5,12)):sphere(w.id==='tea'?.07:.085),PRODUCTS[w.product].color,root,(i-1)*.27,i*.1,0,{shadow:false});pieces.push(p);}return{root,pieces,id:w.id};
  }
  updateWorkshopActivity(visual,status,time){
   const labels={waiting:'WARTET AUF ZUTATEN',working:'PRODUZIERT',ready:'WAREN ABHOLEN',full:'ABHOLSTAPEL VOLL',resting:'RUHT BIS MORGEN'};
   if(visual.statusSign&&visual.status!==status){const old=visual.statusSign.material.map;visual.statusSign.material.map=labelTexture(labels[status]);visual.statusSign.material.needsUpdate=true;old?.dispose();visual.status=status;}
   const a=visual.activity;if(!a)return;a.root.visible=status==='working';if(!a.root.visible)return;
   a.pieces.forEach((p,i)=>{const phase=this.reducedMotion()?0:(time*.8+i*.25)%1;p.position.y=a.id==='oil'?.4-phase*.55:a.id==='bouquet'?0:phase*.5;p.rotation.z=a.id==='bouquet'?Math.sin(phase*Math.PI*2)*.5:0;p.rotation.y=a.id==='gifts'?phase*Math.PI*2:0;p.scale.setScalar(a.id==='tea'?1+phase:.9);});
  }
  makeEveningLife(){this.fireflies=new T.Group();this.fireflies.name='evening-fireflies';this.world.add(this.fireflies);const m=this.fireflyMaterial??=new T.MeshBasicMaterial({color:'#f2e49a'});for(let i=0;i<8;i++)mesh(sphere(.045),m,this.fireflies,0,0,0,{shadow:false});this.fireflies.visible=false;}
  makeStructure(kind,x,z,level){
    const root=new T.Group();root.position.set(x,0,z);this.construction.add(root);
    if(!level){mesh(roundedSlab(4,.07,3,.35),'#c5ccb0',root,0,.03,0,{shadow:false});for(const [a,b]of [[-1.5,-1],[1.5,-1],[-1.5,1],[1.5,1]]){const post=mesh(box(.1,1.5,.1),material('#e6e7d7',{transparent:true,opacity:.45}),root,a,.75,b,{shadow:false});}return;}
    if(kind==='farm'){this.makeFarmHabitat(root);return;}
    if(kind==='storage'){mesh(roundedSlab(2.7,1.2,1.8,.15),'#b7956b',root,0,.62,0);for(let i=0;i<4;i++)mesh(box(2.8,.09,1.85),'#d6b58a',root,0,.16+i*.3,0);for(const a of [-1,1])mesh(box(.12,1.3,1.92),'#e2c79c',root,a,.64,0);const map=labelTexture('LAGER',{color:'#fff6da'}),sign=mesh(new T.PlaneGeometry(2,.5),new T.MeshBasicMaterial({map,transparent:true}),root,0,.8,.94,{shadow:false});return;}
    if(kind==='house'){if(level<3){mesh(roundedSlab(3.8,.16,3,.18),'#d2baa0',root,0,.12,0);for(const a of [-1.7,1.7])for(const b of [-1.3,1.3])mesh(box(.12,level===1?1.25:2.3,.12),'#b69772',root,a,level===1?.7:1.25,b);if(level===2){mesh(box(3.5,1.7,.12),'#ead8b5',root,0,.95,-1.3);for(const a of [-1.7,1.7])mesh(box(.12,1.7,2.6),'#ead8b5',root,a,.95,0);}const plank=mesh(box(2.4,.1,.3),'#b6956e',root,0,.3,1.7);plank.rotation.y=.2;return;}mesh(roundedSlab(3.8,2.1,3.0,.17),'#f0dfbc',root,0,1.05,0);const roof=mesh(new T.ConeGeometry(3.1,1.6,4),'#b39acb',root,0,2.8,0);roof.rotation.y=Math.PI/4;mesh(roundedSlab(.85,1.4,.1,.09),'#aa8968',root,.5,.7,1.57);for(const a of [-1.15,1.15]){mesh(box(.62,.66,.1),'#d0e4d3',root,a,1.25,1.55);this.windowGlow??=new T.MeshBasicMaterial({color:'#ffe0a5',transparent:true,opacity:0});mesh(box(.56,.60,.02),this.windowGlow,root,a,1.25,1.61,{shadow:false});}mesh(cylinder(.2,.22,.7,7),'#caaf90',root,-1.0,3.05,-.3);return;}
    if(kind==='sprinkler'){mesh(cylinder(.6,.75,.3,10),'#c4c7a3',root,0,.2,0);mesh(cylinder(.1,.17,1.15,8),'#8baea3',root,0,.8,0);mesh(new T.TorusGeometry(.54,.06,6,16),'#d2e2cf',root,0,1.35,0).rotation.x=Math.PI/2;const drop=mesh(sphere(.22),'#a6dcd6',root,0,1.65,0);drop.scale.y=1.4;return;}
    mesh(roundedSlab(4.0,.12,3.3,.3),'#e2d5b7',root,0,.06,0);mesh(roundedSlab(3.2,.9,1.5,.12),'#bf9e76',root,0,.58,0);mesh(roundedSlab(3.6,.13,1.8,.1),'#e4cba4',root,0,1.1,0);
    if(kind==='gifts'){root.name='gift-workshop';for(const x of [-1.05,.85]){const gift=this.productBundle('giftbox').clone(true);gift.position.set(x,1.2,0);gift.scale.setScalar(1.15);root.add(gift);}mesh(box(2.9,.12,.2),'#b696c6',root,0,2.4,0);for(const x of [-1.35,1.35])mesh(box(.1,1.3,.1),'#bb9e78',root,x,1.75,0);}
    if(kind==='bouquet'){for(const a of [-1.05,0,1.05]){mesh(cylinder(.22,.16,.4,8),'#b89bc8',root,a,1.36,0);for(let i=0;i<4;i++){const angle=i*Math.PI*.5;mesh(cylinder(.018,.02,.55,5),'#92a96f',root,a+Math.cos(angle)*.14,1.7,Math.sin(angle)*.14);const flower=mesh(sphere(.17),i%2?'#d7b9e9':'#f3d3ad',root,a+Math.cos(angle)*.17,2.0,Math.sin(angle)*.17);flower.scale.y=.65;}}}
    if(kind==='tea'){const pot=mesh(sphere(1),'#b1bfa1',root,0,1.9,0);pot.scale.set(.85,.65,.7);mesh(cylinder(.5,.6,.12,12),'#d2b6db',root,0,2.52,0);mesh(sphere(.14),'#d2b6db',root,0,2.7,0);const handle=mesh(new T.TorusGeometry(.53,.08,7,18),'#b1bfa1',root,-.82,1.92,0);const spout=mesh(cylinder(.16,.22,.8,8),'#b1bfa1',root,.95,2.0,0);spout.rotation.z=-.8;for(const a of [-.95,.95])mesh(cylinder(.18,.13,.28,8),'#e5d4b5',root,a,1.4,.57);}
    if(kind==='oil'){mesh(cylinder(.63,.7,.9,12),'#ce9d6e',root,0,1.65,0);const dome=mesh(sphere(.65),'#dcad7c',root,0,2.1,0);dome.scale.y=.65;mesh(cylinder(.11,.18,.7,9),'#d5a477',root,0,2.55,0);const pipe=mesh(new T.TorusGeometry(.65,.07,7,18,Math.PI),'#d7ae82',root,.65,2.83,0);for(const a of [-1.2,1.2]){mesh(cylinder(.20,.22,.6,8),'#c6d6a1',root,a,1.5,.35);mesh(cylinder(.12,.12,.16,8),'#a88a65',root,a,1.87,.35);}}
    if(kind==='elixir'){for(const a of [-1.7,1.7])for(const b of [-1.1,1.1])mesh(box(.1,2.7,.1),'#ddd7b6',root,a,1.45,b);mesh(roundedSlab(3.6,.12,2.5,.2),'#a2b1a1',root,0,2.8,0);const glass=material('#d2e6cf',{transparent:true,opacity:.27,roughness:.25});mesh(box(3.3,1.65,.03),glass,root,0,1.85,-1.1,{shadow:false});for(let i=0;i<5;i++){const a=(i-2)*.55;mesh(cylinder(.16,.25,.55,9),i%2?'#b69fd8':'#9bc5b4',root,a,1.55,0);mesh(cylinder(.08,.08,.2,7),'#e5d1a0',root,a,1.94,0);}}
  }
  makeHives(){
   for(const [i,h]of HIVES.entries()){if(!this.villageState.village.apiary.hives[i].built)continue;const root=new T.Group();root.name='beehive-'+h.id;root.position.set(h.x,0,h.z);this.construction.add(root);
    for(const x of [-.4,.4])for(const z of [-.3,.3])mesh(cylinder(.055,.07,.55,7),'#aa8966',root,x,.28,z);
    for(let n=0;n<3;n++)mesh(roundedSlab(1.05,.27,.86,.1),n%2?'#ddbe86':'#e8cf9b',root,0,.65+n*.27,0);
    mesh(roundedSlab(1.35,.15,1.1,.12),'#b69c7a',root,0,1.43,0);const entrance=mesh(cylinder(.11,.11,.025,14),'#6e624b',root,0,.65,.45);entrance.rotation.x=Math.PI/2;
    const jars=[];for(let n=0;n<3;n++){const jar=this.productBundle(h.honey).clone(true);jar.scale.setScalar(1.25);jar.position.set(1.25,1.3+n*.6,.3);root.add(jar);jars.push(jar);}
    mesh(box(1.2,.1,.08),'#f1e4bb',root,0,1.7,0);const bar=mesh(box(1,.075,.1),'#c5a15c',root,-.55,1.7,.06);bar.scale.x=.001;
    const bees=[];for(let n=0;n<3;n++){const bee=new T.Group();bee.name='bee';bee.scale.setScalar(1.25);this.construction.add(bee);const body=mesh(sphere(.12),'#e8bf6e',bee);body.scale.z=1.35;for(const z of [-.055,.055]){const band=mesh(new T.TorusGeometry(.115,.022,5,10),'#716344',bee,0,0,z);}
     for(const x of [-.12,.12]){const wing=mesh(sphere(.14),material('#f4f1d9',{transparent:true,opacity:.7}),bee,x,.1,0);wing.scale.set(.9,.14,1.3);}mesh(sphere(.035),'#554c3a',bee,0,.04,.15);bees.push(bee);}
    this.hiveVisuals.push({index:i,root,bar,jars,bees,cells:this.cells.filter(c=>c.bed===h.bed)});
   }
  }
  makeCave(){const b=BEDS[5],root=new T.Group();root.name='crystal-cave';root.position.set(b.x,0,b.z);this.world.add(root);
   for(const x of [-10.6,10.6])for(const z of [-3.9,-1.7,.7]){const rock=mesh(new T.DodecahedronGeometry(1,0),'#87968e',root,x,1.1,z);rock.scale.set(1.05,1.4,1.3);}
   for(let i=0;i<8;i++){const rock=mesh(new T.DodecahedronGeometry(1,0),'#82928b',root,(i-3.5)*2.6,2.5,-7.2);rock.scale.set(1.5,1.15,1.2);}
   const mouth=mesh(sphere(1),'#4d6461',root,0,1.25,-6.1);mouth.scale.set(1.3,1.1,.1);mesh(new T.TorusGeometry(1.4,.2,7,20,Math.PI),'#91a198',root,0,1.2,-6.15);
   for(let i=0;i<6;i++){const gem=mesh(new T.OctahedronGeometry(.3),material(i%2?'#a8d6e5':'#b8a9df',{emissive:'#8ab8cd',emissiveIntensity:.25}),root,(i-2.5)*1.9,.35,-6.3);gem.scale.y=1.7;}
  }
  pickHelper(x,y){this.raycaster.setFromCamera(new T.Vector2(x/this.width*2-1,-y/this.height*2+1),this.camera);const roots=[...this.helpers.map(h=>h.root),this.actors[1].root,this.woodcock.root].filter(r=>r.visible);for(const hit of this.raycaster.intersectObjects(roots,true)){let o=hit.object,visible=true;while(o){if(!o.visible)visible=false;if(o.userData.helperTarget&&visible)return o.userData.helperTarget;o=o.parent;}}return null;}
  makeMiningHit(cell){if(this.reducedMotion())return;for(let i=0;i<4;i++){const m=mesh(geo('crystalChip',()=>new T.OctahedronGeometry(.075)),i%2?'#a7dbd4':'#d8c4ed',this.scene,cell.x,.45,cell.z);this.dust.push({mesh:m,age:0,life:.4,vx:(Math.random()-.5)*2,vz:(Math.random()-.5)*2});}}
  makeFarmHabitat(root){
    root.name='snail-nursery';
    mesh(roundedSlab(8,.24,5.4,.65),'#c6ad7e',root,0,.17,0);
    mesh(roundedSlab(7.7,.1,5.1,.6),'#a6bd83',root,0,.33,0);
    // Low rounded posts keep the view into the little habitat open.
    for(const x of [-3.65,3.65])for(const z of [-2.25,-.9,.5,2.25]){mesh(cylinder(.09,.12,.42,7),'#c7aa7a',root,x,.54,z);mesh(sphere(.11),'#e8cf9f',root,x,.77,z);}
    for(const z of [-2.35,2.35])mesh(box(7.3,.08,.08),'#d9c094',root,0,.52,z);
    // A tiny cream cottage with a curved, mossy roof and round front door.
    const home=new T.Group();home.position.set(-2.45,0,-2.65);home.name='snail-cottage';root.add(home);
    mesh(roundedSlab(2.45,1.45,1.65,.25),'#f2dfb4',home,0,.85,0);
    const roof=mesh(sphere(1),'#97ae7d',home,0,1.65,0);roof.scale.set(1.55,.68,1.12);
    mesh(roundedSlab(.85,1.05,.08,.3),'#937453',home,0,.66,.87);
    mesh(sphere(.055),'#e7ce83',home,.24,.65,.94);
    for(const x of [-.78,.78]){const frame=mesh(cylinder(.24,.24,.08,24),'#c19e6b',home,x,1.12,.87);frame.rotation.x=Math.PI/2;const window=mesh(cylinder(.17,.17,.09,24),'#e8edc5',home,x,1.12,.92);window.rotation.x=Math.PI/2;}
    for(let i=0;i<3;i++)mesh(roundedSlab(.85,.06,.4,.1),'#dcd6b3',root,-2.5,.4,-1.75+i*.4);
    // A smooth hill and a hollow terracotta hideaway.
    const hill=mesh(sphere(1),'#8fae74',root,1.05,.29,-.2);hill.scale.set(1.0,.43,.8);
    const cave=mesh(sphere(1),'#b7ad8c',root,-2.35,.58,.05);cave.scale.set(.85,.6,.65);cave.name='snail-cave';
    const opening=mesh(sphere(1),'#6c7058',root,-2.35,.48,.59);opening.scale.set(.48,.35,.08);
    const moss=mesh(sphere(.4),'#8ba779',root,-2.55,.99,-.02);moss.scale.set(1.3,.3,.8);
    // Small fallen branches and a leaf to perch on.
    const branch=mesh(cylinder(.15,.18,1.8,9),'#aa8159',root,-.7,.48,-.7);branch.rotation.z=Math.PI/2;branch.rotation.y=-.22;branch.name='snail-climbing-branch';
    const twig=mesh(cylinder(.07,.1,.8,7),'#b79467',root,-.3,.59,-.95);twig.rotation.z=.9;twig.rotation.x=.5;
    const leaf=mesh(sphere(.36),'#bfd093',root,-1.1,.65,-.7);leaf.scale.set(1.6,.14,.6);
    // A shallow pebble bath, without a high rim in front of the snails.
    const pond=mesh(cylinder(.98,1.06,.1,32),'#d5ccb0',root,2.65,.4,1.1);pond.scale.z=.7;pond.name='snail-bath';
    const water=mesh(cylinder(.87,.87,.035,32),material('#a4d9d2',{roughness:.3}),root,2.65,.46,1.1);water.scale.z=.68;
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2,stone=mesh(sphere(.13),'#e3dbbf',root,2.65+Math.cos(a),.45,1.1+Math.sin(a)*.72);stone.scale.y=.45;}
    for(const [x,z]of [[-3.3,1.4],[-.8,1.8],[.1,1.8],[1.85,-1.7]]){const l=mesh(sphere(.18),'#b5c68b',root,x,.42,z);l.scale.y=.4;for(let i=0;i<3;i++)mesh(sphere(.065),i%2?'#ebd0cd':'#f5e6ad',root,x+(i-1)*.1,.54,z);}
    // The feed kitchen is a separate, smaller building alongside the cottage.
    const kitchen=new T.Group();kitchen.name='snail-feed-kitchen';kitchen.position.set(FARM_PLACES.kitchen[0],0,FARM_PLACES.kitchen[1]);root.add(kitchen);
    mesh(roundedSlab(2.7,1.15,1.8,.2),'#efdbb6',kitchen,0,.7,0);
    const kitchenRoof=mesh(new T.ConeGeometry(2.0,.9,4),'#ba9dbd',kitchen,0,1.65,0);kitchenRoof.rotation.y=Math.PI/4;kitchenRoof.scale.z=.82;
    mesh(roundedSlab(2.3,.1,1.05,.14),'#bd9b71',kitchen,0,.65,1.0);
    const pot=mesh(sphere(.4),'#96ac7d',kitchen,0,.97,.75);pot.scale.y=.7;
    mesh(cylinder(.3,.35,.07,16),'#d7deb1',kitchen,0,1.24,.75);
    mesh(cylinder(.09,.13,.7,9),'#c3ad91',kitchen,-.65,1.94,-.18);
    const barBack=mesh(box(2.25,.15,.08),'#e7dfc5',kitchen,0,2.2,.7);
    const bar=mesh(box(1,.11,.1),'#89ac72',kitchen,-1.08,2.2,.77);bar.scale.x=.001;
    const portions=new T.Group();portions.position.set(1.2,.9,1);kitchen.add(portions);
    for(let i=0;i<3;i++){const food=mesh(sphere(.16),'#9eaf70',portions,0,i*.17,0);food.scale.set(1.2,.65,1);}
    for(const [key,text]of [['input','ZUTATEN ↓'],['output','FUTTER ↑']]){const spot=FARM_PLACES[key],mat=key==='input'?'#c6cda9':'#d2bdcf';mesh(roundedSlab(1.6,.06,1.15,.2),mat,root,spot[0],.05,spot[1]);const map=labelTexture(text,{color:'#5a6049'}),sign=new T.Sprite(new T.SpriteMaterial({map,depthTest:true}));sign.userData.temporaryTexture=true;sign.scale.set(2.0,.48,1);sign.position.set(spot[0],.5,spot[1]+.7);root.add(sign);}
    this.kitchenVisual={root:kitchen,bar,portions};
    this.farmVisuals=[];
    for(let i=0;i<FARM.slots;i++){const snail=makeSnail(i);snail.upgrade(0);snail.crawlClock=0;snail.snackTime=0;const markerMap=labelTexture('♡',{color:'#b57e8a'}),marker=new T.Sprite(new T.SpriteMaterial({map:markerMap,depthTest:false}));marker.name='snail-food-heart';marker.position.set(0,1.9,0);marker.scale.set(1,.65,1);marker.userData.temporaryTexture=true;marker.visible=false;snail.root.add(marker);snail.foodMarker=marker;root.add(snail.root);this.farmVisuals.push(snail);}
  }
  nurseryTargets(){return(this.farmVisuals??[]).filter(v=>v.root.visible&&v.nurseryID).map(v=>({id:v.nurseryID,x:VILLAGE.farm.x+v.root.position.x,z:VILLAGE.farm.z+v.root.position.z,y:v.root.position.y}));}
  makeFoodFlight(source,target){if(this.reducedMotion()||this.flights.length>28)return;const food=new T.Group();const bite=mesh(sphere(.16),'#9db477',food);bite.scale.set(1.3,.65,1);mesh(sphere(.06),'#d6b68b',food,.04,.04,.08);food.position.set(source.x,1.1,source.z);this.scene.add(food);this.flights.push({mesh:food,start:food.position.clone(),target:new T.Vector3(target.x,target.y??.65,target.z),age:0,duration:.75,type:'food'});}
  feedNursery(source,target){this.makeFoodFlight(source,target);const v=this.farmVisuals.find(v=>v.nurseryID===target.id);if(v)v.snackTime=2.5;}
  makeDecor(){
    const trees=[[-18,9,1.0],[-19,13,1.1],[-19,17,.8],[-22,15,.9],[-5,-13,1.2],[-3,-16,.9],[19,-15,1.0],[22,-13,1.15],[25,7,.9],[24,11,1.15],[4,21,.8],[-2,23,1.1],[-24,-13,1.2],[-31,-14,.9],[29,29,1.1],[-15,31,.9],[12,-29,1.3]];
    const pads=this.villageState?getBuildPads(this.villageState,this.toolDefs):[];
    for(const [x,z,s]of trees){if(!sceneryClear({x,z,width:3.6*s,depth:3.6*s},pads))continue;const root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(s);this.world.add(root);blob(root,0,0,4,.55);mesh(cylinder(.18,.26,2.3,7),'#a98d61',root,0,1.15,0);for(const [a,b,c,r]of [[0,3,0,1.35],[-.8,2.6,.1,1],[.7,2.7,.3,1.1],[.1,3.6,-.15,.9]]){const leaf=mesh(geo('treeLeaves',()=>new T.IcosahedronGeometry(1,1)),(x+z)%3?'#88ab6c':'#a2bb7b',root,a,b,c);leaf.scale.set(r,r*.78,r);}}
    const stones=[[-4,11,.7],[20,12,.6],[22,15,.8],[-13,-4,.6],[-5,-11,.7],[21,-13,.8],[-21,5,.6],[8,27,.7],[-1,21,.4],[-25,22,.7]];for(const [x,z,s]of stones){if(!sceneryClear({x,z,width:s*2,depth:s*1.6},pads))continue;const stone=mesh(geo('rock',()=>new T.DodecahedronGeometry(1,0)),'#c6c8ad',this.world,x,s*.3,z);stone.scale.set(s,s*.55,s*.8);stone.rotation.y=x;}
    const fence=new T.Group();this.world.add(fence);for(let i=0;i<8;i++){const x=-3+i*2.6;if(!sceneryClear({x:x+1.3,z:-11.3,width:2.9,depth:.2},pads))continue;mesh(box(.16,1.3,.16),'#bc9b73',fence,x,.65,-11.3);if(i<7){mesh(box(2.6,.13,.12),'#d0b28a',fence,x+1.3,.46,-11.3);mesh(box(2.6,.13,.12),'#d0b28a',fence,x+1.3,.99,-11.3);}}
    // A little pond, tucked away from the harvesting lanes.
    const pond=mesh(cylinder(1,1,.08,40),'#d5d1ad',this.world,LAKE.x,.045,LAKE.z);pond.name='garden-lake-shore';pond.scale.set(LAKE.width/2,1,LAKE.depth/2);const water=mesh(cylinder(1,1,.03,40),'#91c8c5',this.world,LAKE.x,.10,LAKE.z);water.name='garden-lake-water';water.scale.set((LAKE.width-.5)/2,1,(LAKE.depth-.5)/2);
    for(let i=0;i<60;i++){const x=Math.sin(i*19.7)*29,z=Math.cos(i*13.1)*30;if(!sceneryClear({x,z,width:.3,depth:.3},pads))continue;const flower=mesh(sphere(.095),i%3?'#f5eed4':'#e8cb8d',this.world,x,.16,z,{shadow:false});flower.scale.y=.4;}
  }
  makePickup(p,rare=false){if(this.reducedMotion()||this.flights.length>28)return;const template=p.crop?(this.harvestBundles[p.crop]??=this.makeBundle(COLLECTIBLES[p.crop])):this.bundleTemplate;const m=template.clone(true);m.scale.setScalar(rare?.60:.43);m.position.set(p.x,.75,p.z);this.scene.add(m);this.flights.push({mesh:m,start:m.position.clone(),age:0,duration:.48+Math.random()*.12,type:'pickup'});}
  makeTransfer(source,target,productID=null){if(this.reducedMotion()||this.flights.length>28)return;const template=productID?(productID.startsWith('fish:')?this.fishBundle(productID.slice(5)):PRODUCTS[productID]?this.productBundle(productID):((this.harvestBundles??={})[productID]??=this.makeBundle(COLLECTIBLES[productID]))):this.bundleTemplate,m=template.clone(true);m.scale.setScalar(PRODUCTS[productID]?1.15:.65);m.position.set(source.x,source.y??1.5,source.z);this.scene.add(m);this.flights.push({mesh:m,start:m.position.clone(),age:0,duration:.6,type:target?'transfer':'pickup',target:target?new T.Vector3(target.x,.9,target.z):null});}
  makeLanterns(){
    this.lampBulb?.dispose();this.lampGlow?.dispose();this.lampBulb=new T.MeshBasicMaterial({color:'#bfa87d'});this.lampGlow=new T.MeshBasicMaterial({color:'#ffd27d',transparent:true,opacity:0,depthWrite:false});
    const spots=[{x:-5.3,z:9.3},{x:VILLAGE.warehouse.x-2.2,z:VILLAGE.warehouse.z-1},...WORKSHOPS.map(w=>({x:w.x+2.9,z:w.z-1.3})),{x:-9.3,z:-16},{x:-9.3,z:22}];
    for(const p of spots){if(!sceneryClear({x:p.x,z:p.z,width:.5,depth:.5}))continue;const lamp=new T.Group();lamp.position.set(p.x,0,p.z);this.world.add(lamp);mesh(cylinder(.055,.09,2.2,6),'#977e62',lamp,0,1.1,0);mesh(box(.42,.5,.42),'#755e52',lamp,0,2.3,0);mesh(sphere(.21),this.lampBulb,lamp,0,2.32,.17,{shadow:false});mesh(new T.ConeGeometry(.4,.25,4),'#796450',lamp,0,2.65,0);const halo=mesh(new T.CircleGeometry(2,24),this.lampGlow,lamp,0,.07,0,{shadow:false});halo.rotation.x=-Math.PI/2;}
  }
  makeSale(player){if(this.reducedMotion()||this.flights.length>28)return;const m=this.bundleTemplate.clone(true);m.scale.setScalar(.7);m.position.set(player.x,1.1+this.lastStack*WORLD.stack.layerHeight,player.z-.35);this.scene.add(m);this.flights.push({mesh:m,start:m.position.clone(),age:0,duration:.52,type:'sale'});}
  releaseButterfly(cell,species){const visual=makeButterfly(species.color);visual.root.name='found-butterfly:'+species.id;visual.root.position.set(cell.x,1.2,cell.z);this.scene.add(visual.root);if(this.butterflies.length>=3)this.scene.remove(this.butterflies.shift().root);this.butterflies.push({...visual,x:cell.x,z:cell.z,age:0,collected:true});}
  harvestFlash(x,z,cropID=null){
   this.sweepStrength=1;this.sweep.rotation.y+=.7;const crop=COLLECTIBLES[cropID]??this.crop;
   if(FLOWER_CROPS.includes(cropID)&&!this.reducedMotion()){this.harvestWaves.push({x,z,time:this.time});if(this.harvestWaves.length>6)this.harvestWaves.shift();}
   const effect=HARVEST_EFFECTS[cropID]??HARVEST_EFFECTS.moonbloom;
   for(let i=0;i<(this.reducedMotion()?0:effect.count);i++){if(this.dust.length>=48)break;
    const angle=i/effect.count*Math.PI*2,shape=effect.shape;
    const g=shape==='ray'||shape==='shard'||shape==='fruit'?geo('harvest-'+shape,()=>new T.OctahedronGeometry(effect.size)):sphere(effect.size);
    const m=mesh(g,crop.sparkles,this.scene,x+Math.cos(angle)*.35,.7,z+Math.sin(angle)*.35,{shadow:false});
    m.name='harvest-effect:'+cropID+':'+shape;
    if(shape==='petal')m.scale.set(1.4,.35,1);
    if(shape==='sprig')m.scale.set(.65,2.5,.65);
    if(shape==='coral')m.scale.set(1.6,.5,.8);
    if(shape==='ray')m.scale.set(.65,.45,2.2);
    if(shape==='spore')m.scale.set(1.5,.65,1.5);
    if(shape==='shard')m.scale.set(.6,1.8,.6);
    m.rotation.y=angle;
    this.dust.push({mesh:m,baseScale:m.scale.clone(),age:0,life:effect.life,vx:Math.cos(angle)*effect.spread,vz:Math.sin(angle)*effect.spread,rise:effect.rise,swirl:effect.swirl??0,angle});
   }
  }

  productBundle(id){this.productTemplates??={};if(!this.productTemplates[id]){const p=PRODUCTS[id],root=new T.Group();if(id==='giftbox'){mesh(roundedSlab(.68,.42,.52,.06),p.color,root,0,.23,0);mesh(box(.72,.06,.56),'#dcc89e',root,0,.47,0);mesh(box(.09,.49,.57),'#f3dfaf',root,0,.25,0);mesh(box(.73,.08,.09),'#f3dfaf',root,0,.48,0);for(const x of [-.11,.11]){const bow=mesh(new T.TorusGeometry(.11,.025,5,12),'#f3dfaf',root,x,.57,0);bow.rotation.y=x>0?.45:-.45;}for(let i=0;i<3;i++)mesh(sphere(.065),'#a787c4',root,.22,.56+i*.1,(i-1)*.07);}else if(id==='bouquet'){for(let i=0;i<5;i++){const a=i*1.3;mesh(cylinder(.018,.02,.45,5),'#91a775',root,Math.cos(a)*.13,.15,Math.sin(a)*.13);mesh(sphere(.15),i%2?p.color:'#f3d3a4',root,Math.cos(a)*.2,.45,Math.sin(a)*.2);}mesh(box(.5,.08,.08),'#e4ca8c',root,0,.12,0);}else if(id==='honeyapple'){for(const x of [-.2,.2]){mesh(sphere(.21),'#dfad65',root,x,.19,0);mesh(sphere(.09),'#8da369',root,x+.03,.4,0).scale.set(1,.3,.6);}}else if(id.endsWith('Honey')){mesh(cylinder(.2,.22,.4,12),p.color,root,0,.22,0);mesh(cylinder(.24,.24,.07,12),'#bd9770',root,0,.46,0);mesh(box(.23,.16,.025),'#fff0c5',root,0,.24,.218);}else if(id==='tea'){mesh(roundedSlab(.65,.28,.46,.05),p.color,root,0,.12,0);mesh(box(.1,.32,.5),'#e4ce9e',root,0,.12,0);}else{for(const x of [-.18,.18]){mesh(cylinder(.12,.18,.32,10),p.color,root,x,.16,0);mesh(cylinder(.07,.07,.12,8),'#d8bd8b',root,x,.38,0);}}this.productTemplates[id]=root;}return this.productTemplates[id];}
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
  update(dt,{player,partner,bag,bagCapacity,range,time,moving,helpers=0,snails=[],payingPad=null,coins=0,growthTime=time,productID=null,cargo=null,productCargo=null}){
    this.time=time;this.updateOutdoorVisuals(player);this.harvestWaves=this.harvestWaves.filter(w=>time-w.time<1.3);const glow=this.villageState?.harvestMoments?.glow,glowCell=glow?this.cells.find(c=>c.key===glow.key):null;if(this.glowMarker){this.glowMarker.visible=!!glowCell;if(glowCell){this.glowMarker.position.set(glowCell.x,0,glowCell.z);this.glowMarker.scale.setScalar(this.reducedMotion()?1:1+Math.sin(time*8)*.08);}}for(let i=this.butterflies.length-1;i>=0;i--){const b=this.butterflies[i];b.age+=dt;const capture=Math.max(0,Math.min(1,(b.age-.4)/1.4));b.root.position.set(b.x+(player.x-b.x)*capture+(this.reducedMotion()?0:Math.sin(b.age*8)*.35*(1-capture)),1.2+capture*1.7,b.z+(player.z-b.z)*capture);b.wings.forEach((wing,j)=>wing.rotation.z=(j?1:-1)*(this.reducedMotion()?.35:Math.sin(time*16)*.65));if(b.age>1.8){this.scene.remove(b.root);this.butterflies.splice(i,1);}}this.updateCamera(dt,player);this.growthClock+=dt;if(this.growthClock>.09){this.updatePlants(growthTime);this.growthClock=0;}
    if(this.workshopVisuals)for(const [id,visual]of this.workshopVisuals){const w=WORKSHOPS.find(w=>w.id===id),v=this.villageState.village;this.updateWorkshopActivity(visual,workshopStatus(this.villageState,w),time);this.updateWorkshopNeeds(visual,w,player,dt);const raw=Object.values(v.workshops[id].inputs??{}).reduce((sum,n)=>sum+n,0);visual.input.children.forEach((m,i)=>m.visible=i<Math.min(4,Math.ceil(raw/6)));visual.output.position.y=1.8+(this.reducedMotion()?0:Math.sin(time*2)*.15);visual.output.children.forEach((m,i)=>m.visible=i<Math.min(4,Math.ceil(v.finished[w.product]??0)));if(visual.apples){visual.apples.position.y=visual.output.position.y;visual.apples.children.forEach((m,i)=>m.visible=i<(v.finished.honeyapple??0));}for(const {id:product,bar}of visual.bars){const machine=v.workshops[id],confection=v.apiary.confection,running=product==='honeyapple'?confection.running:machine.running,progress=product==='honeyapple'?confection.progress:machine.progress,seconds=productionSeconds(this.villageState,w)*(product==='honeyapple'?2:1),ratio=running?Math.min(1,progress/seconds):0;bar.scale.x=Math.max(.001,2.4*ratio);bar.position.x=w.x-1.2+1.2*ratio;}}
    for(const v of this.hiveVisuals??[]){const h=HIVES[v.index],stock=this.villageState.village.apiary.hives[v.index],flower=v.cells.find(c=>c.readyAt<=growthTime),awake=!this.villageState.journey.asleep&&(this.villageState.journey.light??0)<.68&&stock.count<HIVE_CAPACITY&&!!flower;v.jars.forEach((jar,i)=>{jar.visible=i<stock.count;jar.position.y=1.3+i*.6+(this.reducedMotion()?0:Math.sin(time*2+i*.3)*.12);});v.bar.scale.x=Math.max(.001,stock.progress/HONEY_SECONDS*1.1);v.bar.position.x=-.55+v.bar.scale.x/2;
     v.bees.forEach((bee,i)=>{bee.visible=awake;if(!awake)return;const p=v.cells[(i*37+Math.floor(time/18))%v.cells.length],target=p?.readyAt<=growthTime?p:flower,t=this.reducedMotion()?0:(time*.08+i/3)%1,u=.5-.5*Math.cos(t*Math.PI*2);bee.position.set(h.x+(target.x-h.x)*u,1.0+Math.sin(t*Math.PI)*.65,h.z+(target.z-h.z)*u);bee.rotation.y=Math.atan2(target.x-h.x,target.z-h.z)+(t>.5?Math.PI:0);});
    }
    const bird=this.villageState?.village?.woodcock;if(bird){const visual=this.woodcock;visual.root.visible=bird.unlocked;visual.root.position.set(bird.x,0,bird.z);visual.root.rotation.y=bird.angle??0;visual.body.position.y=this.reducedMotion()?0:bird.moving?Math.abs(Math.sin(time*12))*.07:0;const carried=Object.values(bird.cargo.items).reduce((sum,n)=>sum+n,0)>0;if(carried&&!visual.load.children.length){const bundle=this.bundleTemplate.clone(true);bundle.scale.setScalar(.38);visual.load.add(bundle);}if(!carried)visual.load.clear();}
    if(this.farmVisuals)for(const [i,visual]of this.farmVisuals.entries()){const n=this.villageState.village.farm.nursery[i];visual.root.visible=!!n;if(n){if(visual.nurseryID!==n.id){visual.nurseryID=n.id;visual.crawlClock=0;}const asleep=snailsResting(this.villageState),crawling=!asleep&&!this.reducedMotion()&&(n.meal>0||n.growth>=FARM.growSeconds);if(crawling)visual.crawlClock+=Math.max(0,dt);const pose=nurseryPose(i,n.id,visual.crawlClock,n.growth/FARM.growSeconds);visual.setSpecies(n.species);visual.setSleeping(asleep);visual.crawl(visual.crawlClock,crawling);visual.activity=pose.activity;visual.snackTime=Math.max(0,visual.snackTime-dt);visual.foodMarker.visible=!asleep&&visual.snackTime>0;visual.root.position.set(pose.x,.39+pose.y,pose.z);if(visual.snackTime>0&&!asleep&&!this.reducedMotion())visual.root.position.y+=Math.abs(Math.sin(time*14))*.025;visual.root.rotation.y=pose.angle;visual.root.scale.setScalar(pose.scale);}}
    if(this.kitchenVisual){const k=this.villageState.village.farm.kitchen,v=this.kitchenVisual;v.bar.scale.x=Math.max(.001,2.16*(k.ready?1:k.progress/FARM.cookSeconds));v.bar.position.x=-1.08+v.bar.scale.x/2;v.portions.children.forEach((m,i)=>m.visible=i<k.ready);}
    const actors=this.actors;
    for(let i=0;i<2;i++){const a=actors[i],p=i?partner:player;a.setAccessory(this.villageState?.village?.boutiques?.equipped?.[i]);a.root.visible=!i||p.visible!==false;if(!a.root.visible)continue;a.root.position.set(p.x,0,p.z);if(p.moving)a.walk+=dt*11;
      a.angle=T.MathUtils.lerp(a.angle,p.angle??a.angle,Math.min(1,dt*12));a.body.rotation.y=a.angle;a.body.position.y=this.reducedMotion()?0:Math.abs(Math.sin(a.walk))*.055;const sleeping=!i&&this.villageState?.journey?.asleep;a.body.rotation.z=sleeping?Math.PI*.43:0;if(sleeping)a.body.position.y=.05;
      a.legs.forEach((leg,j)=>leg.rotation.x=this.reducedMotion()?0:Math.sin(a.walk+j*Math.PI)*(p.moving?.5:.05));
    }
    if(!this.foodPouch){this.foodPouch=new T.Group();this.scene.add(this.foodPouch);const pouch=mesh(sphere(.23),'#bfa074',this.foodPouch);pouch.scale.set(1,.9,.65);mesh(roundedSlab(.22,.035,.14,.03),'#9cb17b',this.foodPouch,0,.18,0);}
    this.foodPouch.visible=!!this.villageState&&(this.villageState.village.farm.food+this.villageState.village.farm.honeyFood+Object.values(this.villageState.village.farm.snacks).reduce((n,s)=>n+s.count,0))>0;this.foodPouch.position.set(player.x+Math.cos(actors[0].angle)*.43,.75,player.z-Math.sin(actors[0].angle)*.43);this.foodPouch.rotation.y=actors[0].angle;
    const actor=actors[0];actor.stack.position.set(-Math.sin(actor.angle)*.36,.84,-Math.cos(actor.angle)*.36);
    const rawCargo=cargo??this.villageState?.cargo,products=productCargo??this.villageState?.productCargo?.items;
    const levels=rawCargo||products?updateCargoStack(actor,carriedStackEntries(rawCargo,products,this.villageState?.outdoors?.fish),bagCapacity,e=>this.cargoTemplate(e),{dt,time,moving,reducedMotion:this.reducedMotion()}):updateStack(actor,productID?this.productBundle(productID):this.bundleTemplate,bag,bagCapacity,{dt,time,moving,reducedMotion:this.reducedMotion()});this.lastStack=levels;
    const second=actors[1];second.stack.position.set(0,.85,-.35);
    const haul=this.villageState?.village.hauler?.items;
    if(haul)updateCargoStack(second,carriedStackEntries(haul,haul),VILLAGE.partner.capacity,e=>this.cargoTemplate(e),{dt,time,moving:partner.moving,reducedMotion:this.reducedMotion(),config:{...WORLD.stack,maxVisible:9}});
    else updateStack(second,partner.productID?this.productBundle(partner.productID):this.bundleTemplate,partner.bag??0,VILLAGE.partner.capacity,{dt,time,moving:partner.moving,reducedMotion:this.reducedMotion(),config:{...WORLD.stack,maxVisible:9}});
    this.range.position.set(player.x,.08,player.z);this.range.scale.set(range,range,range);
    this.sweep.position.set(player.x,0,player.z);this.sweep.scale.setScalar(range);this.sweep.rotation.y+=dt*6;this.sweepStrength=Math.max(0,this.sweepStrength-dt*3.8);this.sweepMaterial.opacity=this.reducedMotion()?0:this.sweepStrength*.65;
    this.tool.position.set(player.x,.02,player.z);this.tool.rotation.y=actor.angle+Math.sin(time*7)*.7;const mining=!!this.villageState?.village.beds[5]&&Math.abs(player.x-BEDS[5].x)<7&&Math.abs(player.z-BEDS[5].z)<5;const fertilizing=this.villageState?.outdoors?.harvestMode==='fertilizer';this.tool.visible=!this.villageState?.outdoors?.equipped&&!fertilizing&&!mining&&!this.villageState?.journey?.asleep;this.pickaxe.visible=!fertilizing&&mining&&!this.villageState?.journey?.asleep;this.pickaxe.position.set(player.x,.1,player.z);this.pickaxe.rotation.set(0,actor.angle,this.reducedMotion()?0:Math.sin(time*8)*.45);
    if(this.bankGem){this.bankGem.rotation.y=time*.6;this.bankGem.position.y=1.48+(this.reducedMotion()?0:Math.sin(time*1.9)*.1);}
    for(let i=this.flights.length-1;i>=0;i--){const f=this.flights[i];f.age+=dt;const t=Math.min(1,f.age/f.duration),ease=t*t*(3-2*t);const target=f.target??(f.type==='money'?new T.Vector3(player.x+1.05,.45,player.z-.25):f.type==='pickup'?new T.Vector3(player.x,1.1+levels*WORLD.stack.layerHeight,player.z-.35):new T.Vector3(WORLD.bank.x,1.1,WORLD.bank.z-1.3));f.mesh.position.lerpVectors(f.start,target,ease);f.mesh.position.y+=Math.sin(t*Math.PI)*(f.type==='pickup'?1.5:2);f.mesh.rotation.y+=dt*4;if(t>=1){this.scene.remove(f.mesh);this.flights.splice(i,1);}}
    for(let i=this.dust.length-1;i>=0;i--){const d=this.dust[i];d.age+=dt;d.mesh.position.y+=dt*(d.rise??.8);d.mesh.position.x+=dt*(d.vx+(d.swirl?Math.cos(d.age*7+d.angle)*d.swirl:0));d.mesh.position.z+=dt*(d.vz+(d.swirl?Math.sin(d.age*7+d.angle)*d.swirl:0));d.mesh.rotation.y+=dt*5;if(d.baseScale)d.mesh.scale.copy(d.baseScale).multiplyScalar(Math.max(0,1-d.age/d.life));else d.mesh.scale.setScalar(Math.max(0,1-d.age/d.life));if(d.age>d.life){this.scene.remove(d.mesh);this.dust.splice(i,1);}}
    for(let i=0;i<this.helpers.length;i++){const helper=this.helpers[i],snail=snails[i];helper.root.visible=!!snail;if(snail){helper.setHat(snail.hat);helper.upgrade(snail.level??0);helper.setSpecies(snail.species);helper.setSleeping(!!snail.sleeping,this.reducedMotion()?0:time);helper.crawl(time,!!snail.moving&&!snail.sleeping&&!this.reducedMotion());helper.setFlying(!!snail.flying&&!snail.sleeping,time,this.reducedMotion());helper.root.position.set(snail.x,snail.flying&&!snail.sleeping?.65+(this.reducedMotion()?0:Math.sin(time*4+i)*.08):0,snail.z);helper.root.rotation.y=snail.angle;if(!this.reducedMotion()&&!snail.sleeping){if(snail.mode==='graze'&&!snail.moving)helper.root.position.y+=Math.sin(time*7+i)*.025;else if(snail.mode==='deliver'&&snail.moving)helper.root.position.y+=Math.abs(Math.sin(time*5+i))*.035;}helper.load.scale.set(.45,1,.45);updateCargoStack(helper,carriedStackEntries(snail.items,snail.items),VILLAGE.snail.capacity+4*(snail.level??0),e=>this.cargoTemplate(e),{dt,time,moving:snail.moving,reducedMotion:this.reducedMotion(),config:{...WORLD.stack,maxVisible:3,layerHeight:.16}});}}
    let nearbyPad=payingPad?.id??null,nearbyDistance=6;
    if(!nearbyPad&&this.padVisuals)for(const [id,pad]of this.padVisuals){const d=Math.hypot(player.x-pad.root.position.x,player.z-pad.root.position.z);if(d<nearbyDistance){nearbyDistance=d;nearbyPad=id;}}
    if(this.padVisuals)for(const [id,pad]of this.padVisuals){const active=payingPad?.id===id;pad.sign.visible=id===nearbyPad;pad.edgeMat.opacity=active?.7+Math.sin(time*8)*.3:.75;if(pad.areaMat)pad.areaMat.opacity=active?.38:.25;pad.edgeMat.color.set(active?'#fff2a5':'#fff8cf');const ratio=Math.min(1,buildPayment(this.villageState,id)/pad.cost);pad.fill.scale.x=Math.max(.001,ratio*2);pad.fill.position.x=-1+ratio;}
    if(this.destinationRing.visible){this.destinationRing.scale.setScalar(1+Math.sin(time*5)*.1);}
    this.moneyGlow=Math.max(0,this.moneyGlow-dt*.25);this.moneyRing.position.set(player.x,0,player.z);const coinCount=coins>0?Math.min(42,Math.max(1,Math.ceil(Math.log10(1+coins)*5))):0;this.moneyCoins.forEach((coin,i)=>{coin.visible=i<coinCount;const column=i%3,layer=Math.floor(i/3);coin.position.set(.95+column*.21,.14+layer*.064+this.moneyGlow*.035,-.25+(column%2)*.16);coin.rotation.y=column*.7+layer*.13;});
    this.night=this.villageState?.journey?.light??0;
    const night=Math.max(0,(this.night-.6)/.4),sunset=Math.sin(Math.min(1,this.night/.8)*Math.PI);
    this.hemi.intensity=1.55-night*1.33;this.hemi.color.set('#fffcf0').lerp(new T.Color('#ffd1a0'),sunset*.45).lerp(new T.Color('#9fa8de'),night);
    this.sun.intensity=Math.max(.06,2.1-sunset*.35-night*2.04);this.sun.color.set('#fff5e5').lerp(new T.Color('#ffa35d'),sunset*.85).lerp(new T.Color('#b5bce9'),night);
    const ground=new T.Color(GARDENS[this.gardenIndex].palette.ground).lerp(new T.Color('#d6b07b'),sunset*.3).lerp(new T.Color('#18243b'),night*.8);this.scene.background.copy(ground);this.scene.fog.color.copy(ground);
    if(this.lampBulb){const glow=Math.max(0,Math.min(1,(this.night-.48)/.32));this.lampBulb.color.set('#bfa87d').lerp(new T.Color('#ffe9a6'),glow);this.lampGlow.opacity=glow*.24;}
    if(this.windowGlow)this.windowGlow.opacity=night*.9;if(this.fireflies){this.fireflies.visible=night>.05&&!this.villageState?.journey?.asleep;this.fireflies.children.forEach((f,i)=>{const t=this.reducedMotion()?i:time*.4+i;f.position.set(player.x+Math.sin(i*2.4)*4+Math.sin(t)*.5,1+Math.sin(t*1.7)*.2,player.z+Math.cos(i*2.4)*4+Math.cos(t)*.5);});}
    this.renderer.render(this.scene,this.camera);
  }
}
