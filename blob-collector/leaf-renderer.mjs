import {specialMaterialGeometry,ICE_KINDS} from './special-material-geometry.mjs';
import {iceRegion} from './ice-area.mjs';
import {volcanoRegion} from './volcano-area.mjs';
import {stackSample} from './stack-order.mjs';
import {FLOWER_ITEMS as FLOWERS} from './flower-config.mjs';
import {flowerStackGeometry} from './forest-material-geometry.mjs';
import {REGION_TREES} from './woodland-regions.mjs';
import {SUNNY,PERIMETER_TREES} from './sunny-area.mjs';
import {suctionCount,suctionAmount} from './inventory.mjs';
import {coastMaterialGeometry} from './coast-geometry.mjs';
import * as T from './vendor/three.module.js';
import {CONFIG,stackLayerCount} from './simulation.mjs';
import {woodGeometry} from './wood-geometry.mjs';
import {sunnyHeight} from './sunny-area.mjs';
import {capacityFor} from './inventory.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import {deliveryPosition,returningLeafPose,createWindLeaves,windLeafPose} from './effects.mjs';

// Neugestaltung: kräftigere Herbstfarben wie in den Referenzbildern.
const PALETTE=['#e08a2e','#c4552b','#e8b23a','#a7a83e','#d4682c'];
// One folded blade and its stem: 19 vertices / 18 triangles per leaf.
function geometry(){
  const positions=[],colors=[],indices=[],zs=[-.23,-.12,.05,.2,.31],widths=[0,.12,.17,.1,0];
  for(let row=0;row<5;row++)for(let column=0;column<3;column++){positions.push((column-1)*widths[row],column===1?.035:0,zs[row]);colors.push(1,1,1);}
  for(let row=0;row<4;row++)for(let column=0;column<2;column++){const k=row*3+column;indices.push(k,k+3,k+1,k+1,k+3,k+4);}
  const first=positions.length/3;positions.push(-.012,.004,-.34,.012,.004,-.34,-.012,.004,-.2,.012,.004,-.2);for(let i=0;i<4;i++)colors.push(.55,.48,.33);indices.push(first,first+2,first+1,first+1,first+2,first+3);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export class LeafRenderer{
  constructor(scene,stack,layers,state){
    this.scene=scene;this.stack=stack;this.layers=layers;this.geometry=geometry();this.originalGeometry=this.geometry;this.material=new T.MeshLambertMaterial({color:'#ffffff',vertexColors:true,side:T.DoubleSide});
    this.object=new T.Object3D();this.matrix=new T.Matrix4();this.zero=new T.Matrix4().makeScale(0,0,0);this.color=new T.Color();this.batches=[];this.slots=[];this.source=null;this.stackCount=-1;this.gold=new T.Mesh(this.geometry,new T.MeshStandardMaterial({color:'#ffe174',emissive:'#ffc52f',emissiveIntensity:1.1,vertexColors:true,side:T.DoubleSide,roughness:.35}));const pixels=new Uint8Array(16*16*4);for(let y=0;y<16;y++)for(let x=0;x<16;x++)pixels.set([255,215,95,Math.round(Math.max(0,1-Math.hypot(x-7.5,y-7.5)/7.5)**2*180)],(y*16+x)*4);const glow=new T.DataTexture(pixels,16,16);glow.needsUpdate=true;this.goldHalo=new T.Sprite(new T.SpriteMaterial({map:glow,color:'#ffdf69',transparent:true,blending:T.AdditiveBlending,depthWrite:false}));this.goldHalo.scale.set(1.7,1.7,1);this.goldHalo.visible=false;scene.add(this.goldHalo);this.gold.visible=false;this.gold.frustumCulled=false;scene.add(this.gold);
    this.flying=this.batch(CONFIG.capacity,scene);this.flying.frustumCulled=false;
    this.pack=this.batch(CONFIG.stackLayers*3,stack);this.pack.frustumCulled=false;
    /* Neugestaltung: Sonderfunde und Eistal-Materialien liegen mit eigenem Modell im Stapel statt als Blatt. */this.extraPacks={};for(const kind of ['rarestone','beachglass','resinlump',...ICE_KINDS]){const mesh=new T.InstancedMesh(specialMaterialGeometry(kind,{ground:false}),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),90);mesh.count=0;mesh.frustumCulled=false;stack.add(mesh);this.extraPacks[kind]=mesh;}this.extraScale=new T.Matrix4().makeScale(1.9,1.9,1.9);/* Jakob: Schnee und Frostholz im Stapel waren viel zu groß */this.extraScales=Object.fromEntries([['desertsand',1],['clay',1.1],['coloredearth',1.1],['cactusfibre',1.05],['desertflower',1.15],['cactusfruit',1.1],['suncapsule',1.15],['paintedstone',1.2],['fossilshell',1.2],['sunshard',1.2],['desertcrystal',1.2],['copperore',1.15],['snow',.85],['frostwood',1.05],['frostmoss',1.35],['frostflower',1.4],['ice',1.1],['ironore',1.15],['icecrystal',1.3]].map(([k,s])=>[k,new T.Matrix4().makeScale(s,s,s)]));/* Jakob 4.11.: Harzklumpen und andere Funde waren im Stapel riesig. Jedes Modell wird höchstens 0,44 m groß gezeigt. */for(const [kind,mesh]of Object.entries(this.extraPacks)){mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox,size=Math.max(b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z)||1,s=this.extraScales[kind]?.elements[0]??1.9;if(size*s>STACK_MAX)this.extraScales[kind]=new T.Matrix4().makeScale(STACK_MAX/size,STACK_MAX/size,STACK_MAX/size);}
    this.coastPacks={};for(const kind of ['sand','shell','seagrass']){const mesh=new T.InstancedMesh(coastMaterialGeometry(kind),new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),90);mesh.count=0;mesh.frustumCulled=false;stack.add(mesh);this.coastPacks[kind]=mesh;}
    this.productPacks={};for(const [kind,color,height] of [['paper','#f3e7c1',.065],['briquette','#ac7d4e',.16]]){const mesh=new T.InstancedMesh(new T.BoxGeometry(.38,height,.46),new T.MeshLambertMaterial({color}),90);mesh.count=0;mesh.frustumCulled=false;stack.add(mesh);this.productPacks[kind]=mesh;}
    this.flowerPacks={};this.flowerShots={};for(const kind of Object.keys(FLOWERS)){const geometry=flowerStackGeometry(kind),material=new T.MeshLambertMaterial({color:'#ffffff',vertexColors:true,side:T.DoubleSide});for(const [target,parent,capacity]of [[this.flowerPacks,stack,90],[this.flowerShots,scene,96]]){const mesh=new T.InstancedMesh(geometry,material,capacity);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;parent.add(mesh);target[kind]=mesh;}}
    // At most six packets are in flight; leave room for slow frames / future rates.
    this.woodMaterial=new T.MeshLambertMaterial({color:'#ffffff',vertexColors:true});this.woodGeometry=woodGeometry();this.woodPack=new T.InstancedMesh(this.woodGeometry,this.woodMaterial,90);this.woodPack.frustumCulled=false;this.woodPack.count=0;stack.add(this.woodPack);this.woodShots=new T.InstancedMesh(this.woodGeometry,this.woodMaterial,96);this.woodShots.frustumCulled=false;this.woodShots.count=0;scene.add(this.woodShots);
    this.shots=this.batch(96,scene);this.shots.frustumCulled=false;
    this.returning=this.batch(CONFIG.maxReturningLeaves,scene);this.returning.frustumCulled=false;this.returning.receiveShadow=false;
    this.windLeaves=createWindLeaves(state.area==='sunny'?112:CONFIG.windLeaves);this.wind=this.batch(this.windLeaves.length,scene);this.wind.frustumCulled=false;this.wind.receiveShadow=false;this.motion={};
    this.windLeaves.forEach((leaf,index)=>this.wind.setColorAt(index,this.color.set(PALETTE[leaf.color])));this.wind.instanceColor.needsUpdate=true;
    for(let i=0;i<this.pack.instanceColor.count;i++)this.pack.setColorAt(i,this.color.set(PALETTE[i%5]));
    this.reset(state);
  }
  // Ruhiger Stapel (Jakob: alles dreht sich beim Einsaugen): Plätze behalten ihre Sorte. Nur überzählige Sorten werden
  // von oben her frei, fehlende Sorten füllen freie Plätze von unten nach oben; die neuesten landen ganz oben und
  // fallen mit kurzer Landebewegung auf den Stapel. Die gezeigte Mischung entspricht weiter stackSample.
  stableStack(state,want,time){const target=stackSample(state,want),slots=this.stackSlots??=[],start=slots.length?time:-9;if(slots.length>want)slots.length=want;
    const goal={},have={};for(const k of target)goal[k]=(goal[k]??0)+1;for(const s of slots)if(s.kind)have[s.kind]=(have[s.kind]??0)+1;
    for(let i=slots.length-1;i>=0;i--){const k=slots[i].kind;if(k&&have[k]>(goal[k]??0)){have[k]--;slots[i].kind=null;}}
    const need=[];for(const k of target)if((have[k]??0)<goal[k]){have[k]=(have[k]??0)+1;need.push(k);}
    let n=0;for(const s of slots)if(!s.kind&&n<need.length){s.kind=need[n++];s.born=time;}while(slots.length<want)slots.push({kind:need[n++]??target[slots.length]??'leaf',born:start});
    return slots.map(s=>s.kind);}
  batch(capacity,parent){const m=new T.InstancedMesh(this.geometry,this.material,capacity);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(capacity*3),3);m.count=0;m.castShadow=false;m.receiveShadow=true;parent.add(m);return m;}
  pose(x,y,z,angle,size=1,roll=0,pitch=0){const o=this.object;o.position.set(x,y,z);o.rotation.set(pitch,angle,roll);o.scale.setScalar(size);o.updateMatrix();return o.matrix;}
  setLeafStyle(geometry,mixed=false){this.geometry=geometry;this.mixed=mixed;for(const mesh of [this.flying,this.pack,this.shots,this.returning,this.wind,this.gold])mesh.geometry=mixed?this.originalGeometry:geometry;if(this.state)this.reset(this.state);}
  reset(state){this.state=state;
    for(const m of this.batches){this.scene.remove(m);m.dispose();}this.batches=[];this.slots=[];const chunks=new Map();
    for(const l of state.leaves){let old=false;if(this.mixed){let nearest=Infinity,index=0;const trees=this.shapeTrees??= [...SUNNY.trees,...PERIMETER_TREES.map(t=>[t.x,t.z,t.size]),...REGION_TREES.map(t=>[t.x,t.z,t.size??1])];for(let i=0;i<trees.length;i++){const t=trees[i],d=(l.homeX-t[0])**2+(l.homeZ-t[1])**2;if(d<nearest){nearest=d;index=i;}}old=index%5!==0;}const key=Math.floor(l.homeX/5)+','+Math.floor(l.homeZ/5)+','+old;l.oldShape=old;let chunk=chunks.get(key);if(!chunk)chunks.set(key,chunk=[]);chunk.push(l);}
    for(const chunk of chunks.values()){
      const m=this.batch(chunk.length,this.scene);if(chunk[0].oldShape)m.geometry=this.originalGeometry;m.count=chunk.length;
      chunk.forEach((l,index)=>{m.setMatrixAt(index,this.pose(l.homeX,l.y,l.homeZ,l.angle,l.size));m.setColorAt(index,this.color.set(PALETTE[l.color]));this.slots[l.id]={mesh:m,index,visible:true};});
      m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.boundingSphere.radius+=2.2;this.batches.push(m);
    }
    this.source=state.leaves;
  }
  update(state,time,reduced){
    if(this.source!==state.leaves)this.reset(state);
    const dirty=new Set();
    for(const l of state.leafChanges){const slot=this.slots[l.id],visible=l.status==='ground'&&!l.gold;if(!slot || slot.visible===visible&&!(visible&&l.windMoved))continue;slot.mesh.setMatrixAt(slot.index,visible?this.pose(l.x,l.y,l.z,l.angle,l.size,l.windTilt??0,(l.windTilt??0)*.6):this.zero);slot.mesh.instanceMatrix.addUpdateRange(slot.index*16,16);slot.visible=visible;l.windMoved=false;dirty.add(slot.mesh);}
    if(state.leafMoves?.length){for(const l of state.leafMoves){const slot=this.slots[l.id];if(!slot||l.status!=='ground'||l.gold)continue;slot.mesh.setMatrixAt(slot.index,this.pose(l.x,l.y,l.z,l.angle,l.size,l.windTilt??0,(l.windTilt??0)*.6));slot.mesh.instanceMatrix.addUpdateRange(slot.index*16,16);slot.visible=true;l.windMoved=false;dirty.add(slot.mesh);}state.leafMoves.length=0;}for(const m of dirty)m.instanceMatrix.needsUpdate=true;
    const gl=state.golden?.active&&state.leaves[state.golden.active.id];this.gold.visible=!!(gl?.gold&&['goldair','ground'].includes(gl.status));if(this.gold.visible){this.gold.matrix.copy(this.pose(gl.x,gl.y,gl.z,gl.angle,gl.size*1.15,Math.sin(time*3)*.4));this.gold.matrixAutoUpdate=false;this.goldHalo.position.set(gl.x,gl.y,gl.z);this.goldHalo.material.opacity=gl.gold*.8;this.gold.material.emissiveIntensity=gl.gold*(1.3+Math.sin(time*5)*.25);this.gold.material.color.set('#d7a74d').lerp(this.color.set('#fff1a0'),gl.gold);}
    this.goldHalo.visible=this.gold.visible;
    let back=0;for(const leaf of state.returningLeaves){const p=returningLeafPose(leaf,reduced,this.motion);this.returning.setMatrixAt(back,this.pose(p.x,p.y,p.z,p.angle,p.size,p.roll,p.pitch));this.returning.setColorAt(back++,this.color.set(PALETTE[leaf.color]));}
    this.returning.count=back;if(back){this.returning.instanceMatrix.needsUpdate=true;this.returning.instanceColor.needsUpdate=true;}
    this.wind.count=reduced?0:this.windLeaves.length;
    for(let i=0;i<this.wind.count;i++){const p=windLeafPose(this.windLeaves[i],time,this.motion);if(state.area==='sunny'){const leaf=this.windLeaves[i],cycle=Math.floor(time/leaf.duration+leaf.phase);if(leaf.cycle!==cycle){leaf.cycle=cycle;leaf.originX=state.player.x;leaf.originZ=state.player.z;}p.x+=leaf.originX;p.z+=leaf.originZ;p.y+=sunnyHeight(p.x,p.z);p.size*=1.2*Math.max(0,Math.min(1,(50-p.x)/9))*(iceRegion(p.x,p.z,3)||volcanoRegion(p.x,p.z,3)?0:1);}this.wind.setMatrixAt(i,this.pose(p.x,p.y,p.z,p.angle,p.size,p.roll,p.pitch));}
    if(this.wind.count)this.wind.instanceMatrix.needsUpdate=true;
    let fly=0;for(const l of state.pullingLeaves){const size=(l.size??.85)*Math.max(.18,1-l.progress*.7);this.flying.setMatrixAt(fly,this.pose(l.x,l.y,l.z,l.angle,size,Math.sin(l.progress*10)*.7));this.flying.setColorAt(fly++,this.color.set(l.reward?.kind==='goldleaf'?'#ffdf65':PALETTE[l.color]));}
    this.flying.count=fly;if(fly){this.flying.instanceMatrix.needsUpdate=true;this.flying.instanceColor.needsUpdate=true;}
    const count=stackLayerCount(suctionCount(state),capacityFor(effectiveVacuum(state))),total=Math.max(1,suctionCount(state)),woodFraction=(suctionAmount(state,'wood')+suctionAmount(state,'driftwood'))/total,paperFraction=suctionAmount(state,'paper')/total,brickFraction=suctionAmount(state,'briquette')/total;let leafSlot=0,woodSlot=0;const flowerCounts=Object.fromEntries(Object.keys(FLOWERS).map(k=>[k,0])),flowerFraction=Object.keys(FLOWERS).map(kind=>[kind,suctionAmount(state,kind)/total]);const products={paper:0,briquette:0},coastCounts={sand:0,shell:0,seagrass:0},coastFraction=Object.values(coastCounts).map((_,i)=>['sand','shell','seagrass'][i]).map(kind=>[kind,suctionAmount(state,kind)/total]);
    const extraCounts={};const ordered=this.stableStack(state,count*3,time);for(let i=0;i<count;i++){const layer=this.layers[i];layer.updateMatrix();for(let j=0;j<3;j++){const slot=this.stackSlots[i*3+j],age=reduced?1:Math.min(1,(time-(slot?.born??-9))/.32),ease=1-(1-age)**3;this.matrix.multiplyMatrices(layer.matrix,this.pose((j-1)*.19,(1-ease)*.35,Math.sin(i+j)*.08,i*2.4+j,.9*(.55+.45*ease)));const kind=ordered[i*3+j],coastKind=Object.hasOwn(coastCounts,kind)?kind:null,flowerKind=Object.hasOwn(flowerCounts,kind)?kind:null;if(flowerKind)this.flowerPacks[flowerKind].setMatrixAt(flowerCounts[flowerKind]++,this.matrix);else if(coastKind)this.coastPacks[coastKind].setMatrixAt(coastCounts[coastKind]++,this.matrix);else if(kind==='wood'||kind==='driftwood')this.woodPack.setMatrixAt(woodSlot++,this.matrix);else if(kind==='paper')this.productPacks.paper.setMatrixAt(products.paper++,this.matrix);else if(kind==='briquette')this.productPacks.briquette.setMatrixAt(products.briquette++,this.matrix);else if(this.extraPacks[kind]){const mesh=this.extraPacks[kind];this.matrix.multiply(this.extraScales[kind]??this.extraScale);mesh.setMatrixAt(extraCounts[kind]=(extraCounts[kind]??0),this.matrix);extraCounts[kind]++;}else this.pack.setMatrixAt(leafSlot++,this.matrix);}}
    // Preserve the usual representative stack while keeping even one rare bloom visible.
    let accent=0;for(const [kind,mesh]of Object.entries(this.flowerPacks)){if(count&&suctionAmount(state,kind)>0&&!flowerCounts[kind]){this.matrix.multiplyMatrices(this.layers[Math.max(0,count-3)].matrix,this.pose(Math.sin(accent*2.4)*.24,.08,Math.cos(accent*2.4)*.17,accent*2.4,.9));mesh.setMatrixAt(flowerCounts[kind]++,this.matrix);accent++;}mesh.count=flowerCounts[kind];if(mesh.count)mesh.instanceMatrix.needsUpdate=true;}
    for(const [kind,mesh]of Object.entries(this.productPacks)){mesh.count=products[kind];if(mesh.count)mesh.instanceMatrix.needsUpdate=true;}
    for(const [kind,mesh]of Object.entries(this.extraPacks)){mesh.count=Math.min(90,extraCounts[kind]??0);if(mesh.count)mesh.instanceMatrix.needsUpdate=true;}for(const [kind,mesh]of Object.entries(this.coastPacks)){mesh.count=coastCounts[kind];if(mesh.count)mesh.instanceMatrix.needsUpdate=true;}this.pack.count=leafSlot;this.woodPack.count=woodSlot;if(count){this.pack.instanceMatrix.needsUpdate=true;this.woodPack.instanceMatrix.needsUpdate=true;}
    let shotCount=0,woodShots=0,flowerShots=0;const flowerShotCounts=Object.fromEntries(Object.keys(FLOWERS).map(k=>[k,0]));
    for(const d of state.deliveries){const point=deliveryPosition(d),samples=Math.min(3,d.amount);for(let j=0;j<samples&&shotCount+woodShots+flowerShots<96;j++){
      let target=(j+.5)/samples*d.amount,kind='leaf';for(const [k,n]of Object.entries(d.items??{leaf:d.amount})){target-=n;if(target<0){kind=k;break;}}
      const flower=FLOWERS[kind],woody=['wood','driftwood'].includes(kind),batch=flower?this.flowerShots[kind]:woody?this.woodShots:this.shots,index=flower?flowerShotCounts[kind]++:woody?woodShots++:shotCount++;
      batch.setMatrixAt(index,this.pose(point.x+(j-1)*.09,point.y,point.z,time*7+d.id+j,.85*(1-Math.max(0,(d.progress-.83)/.17)*.55),Math.sin(d.progress*9)*.5));if(flower)flowerShots++;else if(!woody)this.shots.setColorAt(index,this.color.set(PALETTE[(d.id+j)%5]));
    }}for(const [kind,mesh]of Object.entries(this.flowerShots)){mesh.count=flowerShotCounts[kind];if(mesh.count)mesh.instanceMatrix.needsUpdate=true;}this.woodShots.count=woodShots;if(woodShots)this.woodShots.instanceMatrix.needsUpdate=true;this.shots.count=shotCount;if(shotCount){this.shots.instanceMatrix.needsUpdate=true;this.shots.instanceColor.needsUpdate=true;}
  }
}

const STACK_MAX=.44;
