import test from 'node:test';
import assert from 'node:assert/strict';
import {FULL_FIELDS,PATHS,BUILDING_FOOTPRINTS,rectOverlaps,sceneryClear} from './mondgarten/layout.mjs';
import {BEDS} from './mondgarten/village-content.mjs';
import {freshState,TOOLS,normalize} from './mondgarten/core.mjs';
import {getBuildPads} from './mondgarten/village.mjs';
import {createVillageField} from './mondgarten/harvest.mjs';
import {nightTarget,advanceLighting} from './mondgarten/lighting.mjs';
import {tickJourney,startRound} from './mondgarten/journey.mjs';
import {advanceDayRhythm} from './mondgarten/day-rhythm.mjs';
test('fully expanded beds keep clearance from every other bed, road and building',()=>{
 for(const [i,f]of FULL_FIELDS.entries()){
  for(const r of [...FULL_FIELDS.slice(i+1),...PATHS,...BUILDING_FOOTPRINTS])assert.equal(rectOverlaps(f,r,.25),false,f.id+' overlaps '+r.id);
  assert.ok(Math.abs(f.x)+f.width/2<35&&Math.abs(f.z)+f.depth/2<35,f.id+' outside farm');
 }
 for(const [i,a]of BUILDING_FOOTPRINTS.entries())for(const b of BUILDING_FOOTPRINTS.slice(i+1)){
  if(a.id==='lake'&&b.id==='fishing-pier')continue; // pier intentionally extends over the water
  if(a.id==='nursery'&&b.id==='cottage')continue; // cottage is part of its own enclosure
  assert.equal(rectOverlaps(a,b,.15),false,a.id+' overlaps '+b.id);
 }
});
test('purchase pads remain clear of plants, buildings and other purchase pads',()=>{
 const s=freshState();s.journey.round=77;s.village.beds.fill(1);
 const pads=getBuildPads(s,TOOLS).filter(p=>p.kind!=='expansion'&&p.visible&&!p.max);
 const rect=p=>({x:p.x,z:p.z,width:2.5,depth:2.2});
 for(const [i,p]of pads.entries()){
  for(const f of [...FULL_FIELDS,...BUILDING_FOOTPRINTS])assert.equal(rectOverlaps(rect(p),f,.1),false,p.id+' overlaps '+f.id);
  for(const other of pads.slice(i+1))assert.equal(rectOverlaps(rect(p),rect(other),.1),false,p.id+' overlaps '+other.id);
 }
});
test('decorations reserve future expansion space and moved beds keep saved plant keys and cuts',()=>{
 const s=freshState();s.village.beds.fill(1);s.village.expansions.fill(8);const cells=createVillageField(s);
 for(const b of BEDS)assert.ok(cells.filter(c=>c.bed===BEDS.indexOf(b)).length>=b.columns*b.rows);
 s.village.fieldCuts={'lavender:0':{cutAt:12,readyAt:55}};
 const c=createVillageField(normalize(JSON.parse(JSON.stringify(s)))).find(c=>c.key==='lavender:0');assert.equal(c.readyAt,55);
 for(const r of FULL_FIELDS)assert.equal(sceneryClear({x:r.x,z:r.z,width:.4,depth:.4}),false);
});
test('sunset follows a smooth monotonic four-to-ten-minute active-time curve regardless of reward purchase',()=>{
 for(const closed of [false,true]){
  const s=freshState();s.journey.closed=closed;let previous=0;
  for(let t=0;t<=600;t++){s.journey.elapsed=t;const n=nightTarget(s);assert.ok(n>=previous&&n<=1);if(t<=240)assert.equal(n,0);previous=n;}
  s.journey.elapsed=420;advanceLighting(s,0);assert.equal(s.journey.light,.5);
  const paused=s.journey.light;for(let i=0;i<100;i++)advanceLighting(s,1);assert.equal(s.journey.light,paused);
 }
 const s=freshState();for(let i=0;i<600;i++){tickJourney(s,1);advanceLighting(s,1);advanceDayRhythm(s);}
 assert.equal(s.journey.asleep,true);assert.equal(s.journey.light,1);
 const loaded=normalize(JSON.parse(JSON.stringify(s)));advanceLighting(loaded,0);assert.equal(loaded.journey.light,1);
 s.journey.pending=1;assert.ok(startRound(s));advanceLighting(s,0);assert.equal(s.journey.light,0);
});

test('actual rendered plant models and cave walls stay outside roads and structures at maximum expansion',async()=>{
 const T=await import('./mondgarten/vendor/three.module.js');const old=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
 try{
  const {GardenScene}=await import('./mondgarten/scene.js');const s=freshState();s.village.beds.fill(1);s.village.expansions.fill(8);
  const v=Object.create(GardenScene.prototype);Object.assign(v,{world:new T.Group(),villageState:s,cells:createVillageField(s),harvestWaves:[],time:0,reducedMotion:()=>false});v.makePlants(v.cells);
  for(const part of v.parts){const b=new T.Box3().setFromObject(part.mesh),r={x:(b.min.x+b.max.x)/2,z:(b.min.z+b.max.z)/2,width:b.max.x-b.min.x,depth:b.max.z-b.min.z};
   for(const other of [...PATHS,...BUILDING_FOOTPRINTS])assert.equal(rectOverlaps(r,other),false,'rendered plant overlaps '+other.id);
  }
  v.makeCave();const field=FULL_FIELDS.find(f=>f.id==='nebula');
  v.world.getObjectByName('crystal-cave').traverse(o=>{if(!o.isMesh)return;const b=new T.Box3().setFromObject(o),r={x:(b.min.x+b.max.x)/2,z:(b.min.z+b.max.z)/2,width:b.max.x-b.min.x,depth:b.max.z-b.min.z};assert.equal(rectOverlaps(r,field),false,'cave decoration overlaps mining cells');});
 }finally{globalThis.document=old;}
});
