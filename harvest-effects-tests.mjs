import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './mondgarten/vendor/three.module.js';
import {HARVEST_EFFECTS} from './mondgarten/harvest-effects.mjs';
import {freshState} from './mondgarten/core.mjs';
import {createVillageField} from './mondgarten/harvest.mjs';
const oldDocument=globalThis.document;
globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
const {GardenScene}=await import('./mondgarten/scene.js');
test.after(()=>globalThis.document=oldDocument);
function view(reduced=false){const v=Object.create(GardenScene.prototype);Object.assign(v,{scene:new T.Group(),world:new T.Group(),sweep:new T.Group(),harvestWaves:[],dust:[],time:0,reducedMotion:()=>reduced});return v;}
test('each crop has a distinct, larger rendered effect with the correct shape and bounded particles',()=>{
 assert.equal(new Set(Object.values(HARVEST_EFFECTS).map(e=>e.shape)).size,7);
 for(const [id,e] of Object.entries(HARVEST_EFFECTS)){
  const v=view();v.harvestFlash(3,4,id);assert.equal(v.dust.length,e.count);
  for(const d of v.dust){assert.equal(d.mesh.name,`harvest-effect:${id}:${e.shape}`);assert.equal(d.life,e.life);assert.equal(d.rise,e.rise);assert.ok(new T.Box3().setFromObject(d.mesh).getSize(new T.Vector3()).length()>.25);}
  if(id==='lavender')assert.ok(v.dust.every(d=>d.swirl>0));
  for(let i=0;i<20;i++)v.harvestFlash(3,4,id);assert.equal(v.dust.length,48);
 }
 const v=view(true);v.harvestFlash(0,0,'lavender');assert.equal(v.dust.length,0);assert.equal(v.harvestWaves.length,0);
});
test('unchanged plant transforms do not upload matrices again; harvesting, waves and regrowth still update them',()=>{
 const s=freshState(),v=view();v.villageState=s;v.cells=createVillageField(s);v.makePlants(v.cells);
 const part=v.parts[0],version=part.mesh.instanceMatrix.version;
 v.updatePlants(0);assert.equal(part.mesh.instanceMatrix.version,version);
 const before=part.mesh.instanceMatrix.array.slice();v.cells[0].cutAt=0;v.cells[0].readyAt=38;v.updatePlants(1);
 assert.ok(part.mesh.instanceMatrix.version>version);assert.notDeepEqual(part.mesh.instanceMatrix.array,before);
 v.updatePlants(38);assert.ok(part.mesh.instanceMatrix.array.every((n,i)=>Math.abs(n-before[i])<1e-7));
 v.harvestFlash(v.cells[0].x,v.cells[0].z,'moonbloom');v.time=.2;v.updatePlants(38);assert.notDeepEqual(part.mesh.instanceMatrix.array,before);
 v.harvestWaves=[];v.updatePlants(38);assert.ok(part.mesh.instanceMatrix.array.every((n,i)=>Math.abs(n-before[i])<1e-7));
});
