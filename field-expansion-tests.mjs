import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {BEDS} from './mondgarten/village-content.mjs';
import {createVillageField} from './mondgarten/harvest.mjs';
import {expandedFieldCells} from './mondgarten/field-expansion.mjs';
import {getBuildPads,payBuild,bedYield} from './mondgarten/village.mjs';
import {advanceApiary} from './mondgarten/apiary.mjs';
import {HONEY_SECONDS,HONEY_VALUE_MULTIPLIER} from './mondgarten/honey-content.mjs';

test('eight small strips grow every bed without duplicate or moving plants',()=>{
 for(const b of BEDS){let previous=expandedFieldCells(b);for(let level=1;level<=8;level++){
  const cells=expandedFieldCells(b,level);assert.ok(cells.length>previous.length);
  assert.deepEqual(cells.slice(0,previous.length),previous);
  assert.equal(new Set(cells.map(c=>c.x+':'+c.z)).size,cells.length);previous=cells;
 }}
});
test('expansion purchase preserves yields, other prices and cut times across reload',()=>{
 const s=freshState();s.journey.round=1;s.coins=10000;
 const before=getBuildPads(s),yieldBefore=bedYield(s,0),cells=createVillageField(s);
 cells[0].cutAt=10;cells[0].readyAt=50;
 const pad=before.find(p=>p.id==='expand:0');assert.equal(pad.cost,200);
 assert.ok(payBuild(s,pad,10).complete);assert.equal(s.village.expansions[0],1);
 assert.equal(bedYield(s,0),yieldBefore);
 assert.deepEqual(getBuildPads(s).filter(p=>p.kind!=='expansion').map(p=>p.cost),before.filter(p=>p.kind!=='expansion').map(p=>p.cost));
 const grown=createVillageField(s,cells);assert.ok(grown.length>cells.length);assert.equal(grown[0].readyAt,50);
 s.village.fieldCuts={[cells[0].key]:{cutAt:10,readyAt:50}};
 const loaded=normalize(JSON.parse(JSON.stringify(s)));assert.equal(loaded.village.expansions[0],1);assert.equal(createVillageField(loaded)[0].readyAt,50);
 for(let i=1;i<8;i++)assert.ok(payBuild(s,getBuildPads(s).find(p=>p.id==='expand:0'),10).complete);
 assert.ok(getBuildPads(s).find(p=>p.id==='expand:0').max);assert.equal(payBuild(s,pad,10).complete,false);
});
test('new honey is six times as valuable, with unchanged production time and count',()=>{
 const s=freshState();s.journey.round=3;s.village.apiary.hives[0].built=true;
 advanceApiary(s,createVillageField(s),HONEY_SECONDS);
 assert.equal(s.village.apiary.hives[0].count,1);
 assert.equal(s.village.apiary.hives[0].value,bedYield(s,0)*HONEY_VALUE_MULTIPLIER);
 assert.equal(HONEY_VALUE_MULTIPLIER,4*6);
});

test('preview covers exactly the next strip and its purchase area stays reachable',async()=>{
 const {fieldExpansionPreview,isInsideBuildPad,buildPadDistance}=await import('./mondgarten/field-expansion.mjs');
 for(const b of BEDS)for(let level=0;level<8;level++){
  const p=fieldExpansionPreview(b,level),added=expandedFieldCells(b,level+1).slice(expandedFieldCells(b,level).length);
  assert.equal(p.added,added.length);for(const c of added)assert.ok(isInsideBuildPad(p,c));
  assert.ok(Math.abs(p.x)<=34&&Math.abs(p.z)<=34);assert.ok(isInsideBuildPad(p,p));assert.equal(buildPadDistance(p,p),0);
  assert.equal(isInsideBuildPad(p,{x:p.area.x+p.area.width/2+.01,z:p.area.z}),false);
 }
 assert.equal(fieldExpansionPreview(BEDS[0],8),null);
});
test('relocated warehouse and deposit point stay clear of every fully expanded crop',async()=>{
 const {VILLAGE}=await import('./mondgarten/village-content.mjs'),w=VILLAGE.warehouse;
 for(const b of BEDS)for(const c of expandedFieldCells(b,8)){
  assert.ok(Math.abs(c.x-w.x)>1.4+b.spacing/2||Math.abs(c.z-(w.z-1.5))>.96+b.spacing/2,b.id+' building overlap');
  assert.ok(Math.hypot(c.x-w.x,c.z-w.z)>b.spacing/2,b.id+' deposit overlap');
 }
});
test('actual expansion mesh uses a transparent strip and dashed closed boundary',async()=>{
 const T=await import('./mondgarten/vendor/three.module.js');
 globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
 const {GardenScene}=await import('./mondgarten/scene.js');
 const view=Object.create(GardenScene.prototype);view.construction=new T.Group();view.padVisuals=new Map();
 const s=freshState(),p=getBuildPads(s).find(p=>p.id==='expand:0');view.makeExpansionArea(p);
 const v=view.padVisuals.get(p.id);assert.equal(v.root.position.x,p.area.x);assert.equal(v.root.position.z,p.area.z);
 assert.ok(v.areaMat.transparent&&v.areaMat.opacity>0&&v.areaMat.opacity<.5);
 assert.ok(v.edge.material.isLineDashedMaterial);assert.equal(v.edge.geometry.attributes.position.count,5);assert.ok(v.edge.geometry.attributes.lineDistance);
 assert.equal(v.root.children[0].geometry.parameters.width,p.area.width);assert.equal(v.root.children[0].geometry.parameters.depth,p.area.depth);
});

test('unchanged expansion previews reuse immutable geometry bounds instead of regenerating plants',async()=>{
 const {fieldExpansionPreview}=await import('./mondgarten/field-expansion.mjs');
 const first=fieldExpansionPreview(BEDS[0],0);assert.equal(fieldExpansionPreview(BEDS[0],0),first);
 assert.ok(Object.isFrozen(first)&&Object.isFrozen(first.area));assert.notEqual(fieldExpansionPreview(BEDS[0],1),first);
});
