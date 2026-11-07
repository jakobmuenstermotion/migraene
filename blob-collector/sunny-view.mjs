import {createProductDisplay,setProductDisplay} from './crafting-view.mjs';
import {windVector} from './world-wind.mjs';
import {buildingBuilt} from './homebase-build.mjs';
import {readyOutputs} from './production-output.mjs';
import {terrainColor} from './terrain-color.mjs';
import {TrailView} from './trail-view.mjs';
import {ScenicBatch} from './scenic-geometry.mjs';
import {WoodlandView} from './woodland-view.mjs';
import * as T from './vendor/three.module.js';
import {SUNNY,sunnyHeight,workshopPose,pathDistance,insideBuilding,facilityFootprint} from './sunny-area.mjs';
import {pickupZone} from './sunny-area.mjs';
import {pressProgress} from './material-press.mjs';
import {addForest} from './forest-detail.mjs';
import {addInteriors} from './interior-view.mjs';
import {addBoundary} from './boundary-view.mjs';
import {productFlightPose} from './product-flight.mjs';
import {addTransitions,RouteView} from './transition-view.mjs';
import {sunnyTerrainGeometry} from './terrain-geometry.mjs';
import {addWorldVariety} from './world-variety.mjs';

// Static scenery is baked by material: hundreds of decorative pieces become
// a few dozen draw calls. Only the machine, smoke and stock levels animate.
class Builder{
 constructor(root){this.root=root;this.mats=new Map();this.sphere=new T.SphereGeometry(1,12,8);this.smallSphere=new T.SphereGeometry(1,7,5);this.unit=new T.BoxGeometry(1,1,1);this.round=new T.ExtrudeGeometry(new T.Shape().moveTo(-.46,-.46).lineTo(.46,-.46).lineTo(.46,.46).lineTo(-.46,.46).closePath(),{depth:.92,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,steps:1});this.round.translate(0,0,-.46);}
 mat(color,emissive=false){const key=color+emissive;if(!this.mats.has(key))this.mats.set(key,new T.MeshStandardMaterial({color,roughness:.88,emissive:emissive?color:'#000000',emissiveIntensity:emissive?.5:0}));return this.mats.get(key);}
 mesh(g,color,parent=this.root,x=0,y=0,z=0,emissive=false){const m=new T.Mesh(g,this.mat(color,emissive));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 box(color,p,x,y,z,w,h,d,round=false){const m=this.mesh(round?this.round:this.unit,color,p,x,y,z);m.scale.set(w,h,d);return m;}
 ball(color,p,x,y,z,sx,sy=sx,sz=sx){const small=Math.max(sx,sy,sz)<.35,m=this.mesh(small?this.smallSphere:this.sphere,color,p,x,y,z);m.scale.set(sx,sy,sz);if(small)m.castShadow=false;return m;}
 cylinder(color,p,x,y,z,r1,r2,h,n=10){return this.mesh(new T.CylinderGeometry(r1,r2,h,n),color,p,x,y,z);}
 group(x,y,z,parent=this.root){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
 beam(color,p,a,c,width=.13){const start=new T.Vector3(...a),end=new T.Vector3(...c),m=this.box(color,p,0,0,0,width,start.distanceTo(end),width,true);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return m;}
 bake(){this.root.updateMatrixWorld(true);const batches=new Map();this.root.traverse(m=>{if(!m.isMesh)return;let parent=m,zone=null;while(parent){if(parent.userData.keepVisible){zone=null;break;}zone??=parent.userData.cutaway;parent=parent.parent;}const key=m.material.uuid+String(m.castShadow)+(zone??'');let b=batches.get(key);if(!b)batches.set(key,b={mat:m.material,cast:m.castShadow,zone,p:[],n:[]});const g=m.geometry.clone().applyMatrix4(m.matrixWorld),flat=g.index?g.toNonIndexed():g;b.p.push(...flat.attributes.position.array);b.n.push(...flat.attributes.normal.array);g.dispose();if(flat!==g)flat.dispose();});this.root.clear();for(const b of batches.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.computeBoundingSphere();const m=new T.Mesh(g,b.mat);m.userData.cutaway=b.zone;m.castShadow=b.cast;m.receiveShadow=true;this.root.add(m);}}
}
function roofGeometry(width,depth,base,rise,z0,z1){const p=[],ix=[],segments=18;for(let row=0;row<2;row++)for(let i=0;i<=segments;i++){const x=(i/segments*2-1)*width/2,z=(row?z1:z0)*depth;p.push(x,base+rise*(1-(x/(width/2))**2)-Math.abs(z/depth)*.08,z);}for(let i=0;i<segments;i++){const a=i,b=i+segments+1;ix.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}
function roof(b,p,width,depth,base,rise,color='#538d78'){const roofRoot=b.group(0,0,0,p);roofRoot.userData.cutaway=p.userData.building;p=roofRoot;
 for(let i=0;i<8;i++){const z0=-.5+i/8,z1=z0+1/8+.018;const m=b.mesh(roofGeometry(width,depth,base,rise,z0,z1),i%3===0?'#639c81':color,p);m.material.side=T.DoubleSide;}
 for(const z of [-depth/2,depth/2+.05]){const curve=new T.CatmullRomCurve3(Array.from({length:19},(_,i)=>{const x=(i/18*2-1)*width/2;return new T.Vector3(x,base+rise*(1-(x/(width/2))**2),z);}));b.mesh(new T.TubeGeometry(curve,28,.095,6,false),'#d8bd83',p);}
 for(const x of [-width/2,width/2])b.beam('#407561',p,[x,base,-depth/2],[x,base,depth/2],.17);
}
function flowerPot(b,p,x,z){b.cylinder('#ba7957',p,x,.23,z,.22,.16,.44);b.cylinder('#e4ad7b',p,x,.44,z,.24,.24,.08);for(let j=0;j<4;j++){const dx=x+Math.sin(j*2.4)*.12,dz=z+Math.cos(j*2.4)*.12;b.cylinder('#4f8754',p,dx,.66,dz,.014,.014,.4,5);b.ball(j%2?'#efcc79':'#f6dcc5',p,dx,.9+(j%2)*.1,dz,.115,.07,.115);b.ball('#dfb357',p,dx,.96+(j%2)*.1,dz,.04,.03,.04);}}
function house(b){
 const {x,z}=SUNNY.home,g=b.group(x,sunnyHeight(x,z)-.3,z);g.userData.building='home';g.scale.set(1.35,1.1,1.35);
 b.box('#a29d79',g,0,.1,0,4.75,.34,4.25,true);for(const sx of [-1,1]){b.box('#e9cea0',g,sx*2.02,1.52,0,.16,2.75,3.8,true);b.box('#e9cea0',g,sx*1.45,1.52,1.83,1.25,2.75,.16,true);}b.box('#e9cea0',g,0,1.52,-1.83,4.2,2.75,.16,true);
 for(const px of [-2,2])for(const pz of [-1.82,1.82])b.box('#9b714c',g,px,1.55,pz,.17,2.9,.17,true);
 for(let i=0;i<7;i++)for(const sx of [-1,1])b.box('#d7b17d',g,sx*1.45,.47+i*.35,1.916,1.22,.025,.025);
 b.box('#ad8358',g,0,.36,2.3,4.5,.24,1,true);for(let i=0;i<7;i++)b.box('#d5b384',g,-1.98+i*.66,.49,2.35,.59,.035,.95,true);
 for(let i=0;i<3;i++)b.box('#c0a078',g,0,.08+i*.1,3.05-i*.22,1.5,.16,.32,true);
 b.box('#a98254',g,0,2.15,2.01,1.23,.18,.16,true);for(const px of [-.82,.82])b.box('#aa8155',g,px,1.25,2,.16,1.95,.16,true);
 
 for(const px of [-1.38,1.38]){b.box('#876949',g,px,1.65,1.97,.87,.98,.15,true);const window=b.box('#ffe1a1',g,px,1.65,2.06,.65,.74,.04,true);window.material=b.mat('#ffd58c',true);b.box('#c59b66',g,px,1.65,2.1,.065,.78,.04);b.box('#c59b66',g,px,1.65,2.1,.7,.06,.04);b.box('#b58b58',g,px,1.09,2.16,1,.16,.4,true);for(let j=0;j<4;j++)b.ball(j%2?'#f2b5a2':'#f3d27f',g,px-.3+j*.2,1.24,2.22,.12,.1,.12);}
 const gable=new T.Shape();gable.moveTo(-2.1,2.7);gable.lineTo(2.1,2.7);gable.lineTo(2.1,3);gable.quadraticCurveTo(0,5.3,-2.1,3);gable.closePath();const face=new T.ExtrudeGeometry(gable,{depth:3.7,bevelEnabled:false,curveSegments:16});b.mesh(face,'#dfc091',g,0,0,-1.85);
 roof(b,g,5.05,4.7,2.94,1.4);
 const round=b.cylinder('#947447',g,0,3.43,1.94,.44,.44,.13,24);round.rotation.x=Math.PI/2;const glass=b.cylinder('#ffe2a2',g,0,3.43,2.02,.32,.32,.06,24);glass.rotation.x=Math.PI/2;glass.material=b.mat('#ffcf89',true);b.box('#c39b62',g,0,3.43,2.09,.065,.65,.04);b.box('#c39b62',g,0,3.43,2.09,.65,.065,.04);
 b.box('#b4977d',g,1.3,4.08,-.7,.56,1.5,.6,true);b.box('#dbbea0',g,1.3,4.86,-.7,.78,.17,.79,true);for(let i=0;i<3;i++)b.box('#927e68',g,1.3,3.85+i*.31,-.38,.56,.025,.025);
 flowerPot(b,g,-2.1,2.6);flowerPot(b,g,2.1,2.6);
 // Space beside the porch stays available for later home additions.
 const bench=b.group(-3.7,0,.9,g);b.box('#af8855',bench,0,.5,0,1.5,.17,.55,true);for(const px of [-.55,.55])b.box('#826b49',bench,px,.24,0,.13,.55,.38,true);b.box('#bf9967',bench,0,.9,-.23,1.5,.56,.1,true);
 return {x:x+1.3,y:sunnyHeight(x,z)+4.9,z:z-.7};
}
function storage(b){
 const {x,z}=SUNNY.storage,g=b.group(x,sunnyHeight(x,z)-.3,z);g.userData.building='storage';g.scale.set(.84,.82,.89);
 b.box('#b9a079',g,0,.13,0,4.3,.3,3.6,true);for(const px of [-1.85,1.85])for(const pz of [-1.4,1.4])b.box('#9b714c',g,px,1.55,pz,.2,3,.2,true);
 // Jakob 1.11.: kleiner Anbau direkt am Haus, gleiche Wände, gleiches Dach. Vorn offen wie bisher.
 b.box('#e9cea0',g,0,1.5,-1.55,3.9,2.7,.14,true);for(const sx of [-1,1])b.box('#e9cea0',g,sx*1.95,1.5,-.45,.14,2.7,2.1,true);
 for(const y of [.5,1.4])b.box('#99764d',g,0,y,-.85,3.6,.13,1,true).userData.keepVisible=true;
 roof(b,g,4.7,3.9,2.96,.9);
 for(let i=0;i<3;i++){const c=b.group(-1.1+i*1.05,.22,-.45,g);c.userData.keepVisible=true;b.box('#b48b58',c,0,.37,0,.84,.7,.7,true);for(const sy of [.16,.4,.64])b.box('#cda56d',c,0,sy,.37,.8,.09,.05);for(const px of [-.31,.31])b.box('#856743',c,px,.38,.4,.08,.75,.08);}
 b.box('#d2b779',g,0,2.8,1.57,.9,.56,.13,true);const symbol=b.ball('#6f9362',g,0,2.81,1.66,.16,.23,.035);symbol.rotation.z=-.5;

 // Painted slats make the unloading mouth legible without a floating label.

 return g;
}
function terrain(scene){
 const g=sunnyTerrainGeometry();const p=g.attributes.position,colors=[];const grass=new T.Color('#65a85f'),light=new T.Color('#91bc6e'),path=new T.Color('#d7c29a'),c=new T.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);terrainColor(x,z,c);colors.push(c.r,c.g,c.b);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));m.receiveShadow=true;scene.add(m);return m;
}
function plants(b){
 let seed=287;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 // Fern fronds, in clusters outside the open vacuum lanes.
 for(let i=0;i<26;i++){const t=SUNNY.trees[i%SUNNY.trees.length],x=t[0]+(r()-.5)*4,z=t[1]+(r()-.5)*4,h=sunnyHeight(x,z);if(facilityFootprint(x,z,1))continue;for(let j=0;j<5;j++){const a=j*1.25;for(let k=1;k<5;k++){const m=b.ball(k%2?'#6e9d63':'#87af70',b.root,x+Math.sin(a)*k*.12,h+.12+k*.07,z+Math.cos(a)*k*.12,.08,.035,.16);m.rotation.set(.3,a,.15);}}}
}
function pressMachine(b,root){
 const {x,z}=SUNNY.press,g=b.group(x,sunnyHeight(x,z),z);
 b.box('#a3a18a',g,0,.16,0,3.1,.34,3.1,true);b.box('#567a69',g,0,.46,0,2.25,.46,2.2,true);
 for(const px of [-1.08,1.08])for(const pz of [-.8,.8]){b.box('#a27b4e',g,px,1.65,pz,.25,2.5,.25,true);for(const y of [.8,2.5])b.ball('#dfba79',g,px,y,pz+.14,.07,.07,.03);}
 b.box('#567e6d',g,0,2.9,0,2.7,.35,2.2,true);b.cylinder('#b3b7a2',g,0,2.25,0,.16,.16,1.2,12);
 const hopper=b.cylinder('#e1bd79',g,0,3.46,0,.84,.4,.8,4);hopper.rotation.y=Math.PI/4;b.cylinder('#705f49',g,0,3.88,0,.74,.74,.025,4).rotation.y=Math.PI/4;
 b.box('#b3a684',g,0,.55,1.65,1.65,.13,1.15,true);for(const px of [-.8,.8])b.box('#7a8a72',g,px,.69,1.65,.1,.23,1.15,true);
 b.box('#344e48',g,0,2.92,1.16,1.14,.27,.08,true);
 const moving=b.group(x,sunnyHeight(x,z),z,root),plate=b.group(0,1.65,0,moving);b.box('#749487',plate,0,0,0,1.92,.29,1.75,true);b.box('#d8b77b',plate,0,-.18,0,1.75,.09,1.61,true);
 const screw=b.cylinder('#c6c4a4',moving,0,2.4,0,.12,.12,.9,10);
 const wheel=b.group(1.55,1.85,.25,moving);const torus=b.mesh(new T.TorusGeometry(.56,.085,6,24),'#d6b16e',wheel);for(let i=0;i<6;i++){const a=i*Math.PI/3;b.beam('#a7b49c',wheel,[0,0,0],[Math.sin(a)*.49,Math.cos(a)*.49,0],.08);}b.cylinder('#6b8372',wheel,0,0,0,.14,.14,.22,10).rotation.x=Math.PI/2;b.ball('#af7d4e',wheel,.45,.2,.17,.11,.11,.16);
 const fill=b.group(0,3.75,0,moving);for(let i=0;i<6;i++){const f=b.ball(i%2?'#bd9d57':'#cea95f',fill,Math.sin(i*2.4)*.3,0,Math.cos(i*2.4)*.3,.14,.04,.22);f.rotation.z=i;}
 const bar=b.box('#c1d99b',moving,0,2.92,1.215,1,.12,.015,true);
 const output=b.group(0,.9,1,moving);b.box('#f0e5bd',output,0,.04,0,.65,.13,.46,true);b.box('#ddd0a7',output,0,-.03,0,.68,.08,.46,true);const brick=b.box('#a3794d',output,0,0,0,.72,.29,.46,true);brick.visible=false;
 return {moving,plate,screw,wheel,fill,bar,output,brick,paper:output.children.filter(c=>c!==brick)};
}
export class SunnyView{
 constructor(scene){
  this.root=new T.Group();this.staticRoot=new T.Group();this.dynamic=new T.Group();scene.add(this.root);this.root.add(this.staticRoot,this.dynamic);this.ground=terrain(this.root);const b=new Builder(this.staticRoot);this.smokeOrigin=house(b);storage(b);this.pressRoot=new T.Group();this.root.add(this.pressRoot);const pressParts=new T.Group();pressParts.position.set(-SUNNY.press.x,-sunnyHeight(SUNNY.press.x,SUNNY.press.z),-SUNNY.press.z);this.pressRoot.add(pressParts);const pressFixed=new T.Group(),pressMoving=new T.Group();const pb=new Builder(pressFixed);this.machine=pressMachine(pb,pressMoving);this.machine.product=createProductDisplay();this.machine.output.add(this.machine.product);pb.bake();const pressBatch=new ScenicBatch();for(const m of pressFixed.children)pressBatch.add(m.geometry,m.material.color);pressFixed.clear();pressBatch.finish(pressFixed);pressParts.add(pressFixed,pressMoving);
  this.forest=addForest(b,this.root);this.trails=new TrailView(this.ground,this.forest.grass);
  this.boundary=addBoundary(this.root);
  this.transitions=addTransitions(this.root);
  this.routes=new RouteView(this.root);
  this.variety=addWorldVariety(this.root);this.woodlands=new WoodlandView(this.root);
  plants(b);this.interiors=addInteriors(b,this.dynamic);b.bake();this.staticBatches=this.staticRoot.children.length;for(const mesh of this.staticRoot.children)if(mesh.userData.cutaway)mesh.material=mesh.material.clone();
  // Visible stock levels are a fixed-size pool, never one mesh per item.
  this.stock=[];const stockB=new Builder(this.dynamic),sx=SUNNY.storage.x,sz=SUNNY.storage.z,sy=sunnyHeight(sx,sz);
  for(let i=0;i<8;i++){const g=stockB.group(sx-.95+(i%4)*.62,sy+.5+Math.floor(i/4)*.62,sz-.5);stockB.ball('#c2ba73',g,0,0,0,.23,.23,.21);stockB.cylinder('#8b8855',g,0,.22,0,.05,.08,.07,8);this.stock.push(g);}
  this.logs=[];for(let i=0;i<12;i++){const log=stockB.cylinder('#9c7048',this.dynamic,sx+1.25+(i%2)*.16,sy+.32+Math.floor(i/4)*.22,sz+.3+(i%4)*.17,.1,.12,.78,8);log.rotation.z=Math.PI/2;this.logs.push(log);}
  this.smoke=new T.InstancedMesh(new T.SphereGeometry(1,8,6),new T.MeshBasicMaterial({color:'#fff2db',transparent:true,opacity:.18,depthWrite:false}),8);this.smoke.frustumCulled=false;this.dynamic.add(this.smoke);this.dummy=new T.Object3D();
  this.zones=new Map();for(const [id,p]of Object.entries(SUNNY.interactions)){const ring=new T.Mesh(new T.RingGeometry(.72,.77,48),new T.MeshBasicMaterial({color:'#fff0b2',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(p.x,sunnyHeight(p.x,p.z)+.035,p.z);this.dynamic.add(ring);this.zones.set(id,ring);}
 }
 update(s,near,reduced,now=Date.now()){
  this.pressRoot.visible=buildingBuilt(s,'press')||s.placementPreview?.id==='press';const pp=s.placementPreview?.id==='press'?s.placementPreview:workshopPose(s);this.pressRoot.position.set(pp.x,sunnyHeight(pp.x,pp.z),pp.z);this.pressRoot.rotation.y=pp.rotation??0;
  this.transitions.gorge.update(reduced?0:s.time);this.routes.update(s);this.woodlands.update(s);this.trails.update(s);
  this.root.visible=!s.testWorld.enabled;const inside=insideBuilding(s);for(const mesh of this.staticRoot.children)if(mesh.userData.cutaway) {const cut=mesh.userData.cutaway===inside;mesh.visible=true;mesh.material.transparent=cut;mesh.material.opacity=cut?.1:1;mesh.material.depthWrite=!cut;}this.interiors.update(s);this.forest.update(reduced?0:s.time,reduced?0:windVector(s).strength);const stock=s.inventory.storage;this.stock.forEach((o,i)=>o.visible=(stock.leaf??0)>i*125);this.logs.forEach((o,i)=>o.visible=(stock.wood??0)>i*15);
  const m=this.machine,j=s.press.job,t=pressProgress(s,now),down=j?Math.sin(Math.min(1,t/.78)*Math.PI)**2:0;
  m.plate.position.y=1.65-down*.83;m.screw.position.y=2.4-down*.35;m.wheel.rotation.z=j?-t*Math.PI*6:0;m.moving.rotation.z=j&&!reduced?Math.sin(t*60)*.008:0;m.fill.visible=Boolean(j&&t<.24);m.fill.position.y=3.75-Math.min(1,t/.24)*.7;m.bar.scale.x=j?Math.max(.015,t):1;m.bar.material.color.set(j?'#e6bd75':'#a6c898');
  const ready=readyOutputs(s.press),waiting=ready.length>0,out=waiting?{recipe:ready[0][0],quantity:ready[0][1]}:s.press.lastOutput,age=waiting?0:out?(now-out.at)/1000:Infinity,flight=productFlightPose(age,reduced,s.player,workshopPose(s));m.output.visible=Boolean(waiting);if(out){m.output.position.set(1.2,.85,3.45);m.output.scale.setScalar(flight.scale);m.output.rotation.y=reduced?0:Math.sin(Math.min(1,age/1.3)*Math.PI)*.25;m.brick.visible=out.recipe!=='paper';m.brick.material.color.set(out.recipe==='sandstone'?'#d4b78a':out.recipe==='shelllime'?'#ebe0c3':'#a3794d');for(const paper of m.paper)paper.visible=out.recipe==='paper';setProductDisplay(m.product,out.recipe);if(typeof document!=='undefined'){m.brick.visible=false;for(const paper of m.paper)paper.visible=false;}}
  for(let i=0;i<8;i++){const q=(s.time*.12+i/8)%1,o=this.smokeOrigin;this.dummy.position.set(o.x+Math.sin(q*4+i)*.15,o.y+q*2.5,o.z+q*.35);this.dummy.scale.setScalar(Math.sin(q*Math.PI)*.2);this.dummy.updateMatrix();this.smoke.setMatrixAt(i,this.dummy.matrix);}this.smoke.count=reduced?0:8;this.smoke.instanceMatrix.needsUpdate=true;
  for(const [id,ring]of this.zones){if(id==='press'){const p=workshopPose(s);ring.position.set(p.x+Math.sin(p.rotation)*3.2,sunnyHeight(p.x,p.z)+.035,p.z+Math.cos(p.rotation)*3.2);}ring.material.opacity=near===id?.55:0;}
 }
}

