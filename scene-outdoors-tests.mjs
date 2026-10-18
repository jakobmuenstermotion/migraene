import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './mondgarten/vendor/three.module.js';
import {freshState} from './mondgarten/core.mjs';
import {createVillageField} from './mondgarten/harvest.mjs';
import {COLLECTIBLES} from './mondgarten/content.mjs';
import {sprayFertilizer,equipOutdoorTool,BURIED_SHELLS,LAKE,advanceOutdoors,setHarvestMode} from './mondgarten/outdoors.mjs';
// Exercise the real geometry and instance transforms without a WebGL context.
const documentBefore=globalThis.document;
globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
const {GardenScene}=await import('./mondgarten/scene.js');
function ready(){const s=freshState();s.outdoors.owned=['detector','rod'];s.outdoors.composterBuilt=true;s.village.farm.built=true;const scene=Object.create(GardenScene.prototype);Object.assign(scene,{villageState:s,construction:new T.Group(),world:new T.Group(),harvestWaves:[],time:0,reducedMotion:()=>true,cells:createVillageField(s)});return scene;}
test('fertilizer doubles rendered plant height without changing width and expires visually',()=>{
 const scene=ready(),s=scene.villageState;scene.makePlants(scene.cells,COLLECTIBLES.moonbloom);const part=scene.parts[0],before=new T.Matrix4();part.mesh.getMatrixAt(0,before);const scale=m=>new T.Vector3().setFromMatrixScale(m);const base=scale(before);
 s.outdoors.fertilizer=1;setHarvestMode(s,'fertilizer');sprayFertilizer(s,scene.cells,scene.cells[0]);scene.updatePlants(0);const after=new T.Matrix4();part.mesh.getMatrixAt(0,after);assert.ok(Math.abs(scale(after).y/base.y-2)<1e-6);assert.equal(scale(after).x,base.x);
 advanceOutdoors(s,scene.cells,scene.cells[0],180);scene.updatePlants(0);part.mesh.getMatrixAt(0,after);assert.ok(Math.abs(scale(after).y/base.y-1)<1e-6);
});
test('real scene shows detector targets only with the detector and preserves sprayed patch locations',()=>{
 const scene=ready(),s=scene.villageState;equipOutdoorTool(s,'detector');scene.makeOutdoorModels(s);scene.updateOutdoorVisuals(BURIED_SHELLS[0]);assert.equal(scene.detectorMarker.visible,true);assert.equal(scene.detectorMarker.position.x,BURIED_SHELLS[0].x);assert.equal(scene.outdoorTool.visible,true);
 s.outdoors.fertilizer=1;setHarvestMode(s,'fertilizer');sprayFertilizer(s,scene.cells,scene.cells[0]);scene.updateOutdoorVisuals(scene.cells[0]);assert.equal(scene.detectorMarker.visible,false);assert.equal(scene.fertilizerVisuals[0].visible,true);assert.equal(scene.fertilizerVisuals[0].position.x,scene.cells[0].x);
 s.journey.asleep=true;scene.updateOutdoorVisuals(scene.cells[0]);assert.equal(scene.outdoorTool.visible,false);
});

test('fertilizer workshop has its own building, production bar and floating output; sprayer follows the selected mode',()=>{
 const scene=ready(),s=scene.villageState;scene.makeOutdoorModels(s);assert.ok(scene.construction.getObjectByName('garden-composter'));s.outdoors.compost.remaining=30;s.outdoors.compost.ready=3;s.outdoors.fertilizer=2;setHarvestMode(s,'fertilizer');scene.updateOutdoorVisuals({x:4,z:0,angle:0});assert.ok(Math.abs(scene.composterVisual.bar.scale.x-1.2)<1e-8);assert.equal(scene.composterVisual.output.children.filter(m=>m.visible).length,3);assert.equal(scene.sprayerVisual.visible,true);assert.equal(scene.outdoorTool.visible,false);
 setHarvestMode(s,'scythe');scene.updateOutdoorVisuals({x:4,z:0,angle:0});assert.equal(scene.sprayerVisual.visible,false);
 s.outdoors.composterBuilt=false;scene.construction.clear();scene.makeOutdoorModels(s);assert.equal(scene.composterVisual,null);assert.equal(scene.construction.getObjectByName('garden-composter'),undefined);
});

test('larger lake has a connected wooden pier with its fishing destination on the boards',()=>{
 const scene=ready();scene.makeOutdoorModels(scene.villageState);const pier=scene.construction.getObjectByName('fishing-shore');assert.ok(pier);
 assert.ok(LAKE.width>5.2&&LAKE.depth>3.64);assert.ok(LAKE.dock.z-LAKE.dock.depth/2<LAKE.z-LAKE.depth/2);assert.ok(LAKE.dock.z+LAKE.dock.depth/2>LAKE.z-LAKE.depth/2);
 assert.ok(Math.abs(LAKE.shore.x-LAKE.dock.x)<LAKE.dock.width/2);assert.ok(Math.abs(LAKE.shore.z-LAKE.dock.z)<LAKE.dock.depth/2);
 const bounds=new T.Box3();pier.updateMatrixWorld(true);pier.traverse(o=>{if(o.isMesh)bounds.union(new T.Box3().setFromObject(o));});assert.ok(bounds.min.z<=7.96&&bounds.max.z>=10.84);assert.ok(bounds.max.x-bounds.min.x<=LAKE.dock.width+.01);
});
test('shop construction and clear shop labels appear at their actual unlock rounds',()=>{
 const scene=ready(),s=scene.villageState;for(const round of [11,12,19,20]){s.journey.round=round;scene.construction.clear();scene.makeBoutiques(s);assert.equal(!!scene.construction.getObjectByName('boutique:style'),round>=12);assert.equal(!!scene.construction.getObjectByName('boutique:decor'),round>=20);}
 const shop=scene.construction.getObjectByName('boutique:style');assert.equal(shop.children.filter(o=>o.isSprite).length,2);assert.ok(shop.children.filter(o=>o.isSprite).every(o=>o.position.y>=2.2));
});
test.after(()=>{globalThis.document=documentBefore;});
