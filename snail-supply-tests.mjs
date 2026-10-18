import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {GardenAutomation} from './mondgarten/automation.mjs';
import {WORKSHOPS,VILLAGE} from './mondgarten/village-content.mjs';
import {setSnailProfile,snailProfile} from './mondgarten/snail-care.mjs';
import {planWarehouseSupply,takeWarehouseSupply,planSupply} from './mondgarten/logistics.mjs';
import {workshopSpot,advanceProduction,WORKSHOP_INPUT_CAPACITY} from './mondgarten/village.mjs';
import {createVillageField} from './mondgarten/harvest.mjs';
import {carriedStackEntries} from './mondgarten/cargo-stack.mjs';
const gift=WORKSHOPS.find(w=>w.id==='gifts');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function ready(n=1){const s=freshState();s.village.house=3;s.village.snails=n;for(let i=0;i<n;i++)setSnailProfile(s,i,{task:'supply',name:'Versorger '+i});return s;}
function giftStock(s){s.village.workshops.gifts.level=1;s.village.raw.lavender=16;s.village.rawValues.lavender=40;s.village.storedGoods={bouquet:{count:2,value:60},moonHoney:{count:2,value:80}};for(let i=0;i<s.village.snails;i++)setSnailProfile(s,i,{...snailProfile(s,i),workshop:'gifts'});}
function atWarehouse(a){for(const snail of a.snails)Object.assign(snail,VILLAGE.warehouse);}
function until(a,s,check){for(let i=0;i<3000&&!check();i++)a.update(s,[],null,.1,0);assert.ok(check(),'courier did not finish');}
test('supply snails physically collect complete mixed recipes at the warehouse and deliver actual values at the workshop',()=>{
 const s=ready();giftStock(s);const a=new GardenAutomation(s);a.update(s,[],null,.1,0);assert.equal(s.village.raw.lavender,16);assert.equal(a.snails[0].bag,0);atWarehouse(a);const events=a.update(s,[],null,.1,0);const snail=a.snails[0];assert.equal(snail.bag,20);assert.deepEqual(snail.items,{lavender:16,bouquet:2,moonHoney:2});assert.equal(events[0].kind,'snailSupplyPickup');assert.equal(s.village.workshops.gifts.inputs.lavender??0,0);assert.equal(s.village.finished.bouquet??0,0);assert.equal(s.village.raw.lavender,0);
 a.update(s,[],null,.1,0);assert.equal(s.village.workshops.gifts.inputs.lavender??0,0);until(a,s,()=>snail.bag===0);assert.deepEqual(s.village.workshops.gifts.inputs,{lavender:16,bouquet:2,moonHoney:2});near(s.village.workshops.gifts.inputValues.lavender,40);near(s.village.workshops.gifts.inputValues.bouquet,60);near(s.village.workshops.gifts.inputValues.moonHoney,80);assert.equal(s.coins,0);assert.equal(s.stats.harvested,0);
 advanceProduction(s,180);assert.equal(s.village.finished.giftbox,1);near(s.village.finishedValues.giftbox,450);
});
test('a loaded courier survives saving with products and destination intact and cannot deliver or sell its load twice',()=>{
 let s=ready();giftStock(s);let a=new GardenAutomation(s);atWarehouse(a);a.update(s,[],null,.1,0);a.snapshot(s);s=normalize(JSON.parse(JSON.stringify(s)));assert.equal(snailProfile(s,0).task,'supply');assert.equal(snailProfile(s,0).workshop,'gifts');assert.equal(s.village.snailLoads[0].supplyWorkshop,'gifts');assert.equal(s.village.snailLoads[0].items.moonHoney,2);a=new GardenAutomation(s);until(a,s,()=>a.snails[0].bag===0);for(let i=0;i<500;i++)a.update(s,[],null,.1,0);assert.equal(s.village.workshops.gifts.inputs.bouquet,2);assert.equal(s.village.workshops.gifts.inputs.moonHoney,2);assert.equal(s.coins,0);assert.equal(s.village.storedGoods.bouquet,undefined);
});
test('several couriers account for incoming deliveries, so each remaining workshop receives only its pending ingredients',()=>{
 const s=ready(3);s.village.workshops.bouquet.level=1;setSnailProfile(s,0,{...snailProfile(s,0),workshop:'bouquet'});s.village.workshops.tea.level=1;setSnailProfile(s,1,{task:'supply',workshop:'tea'});setSnailProfile(s,2,{task:'supply',workshop:'bouquet'});s.village.raw={moonbloom:120,lavender:120};s.village.rawValues={moonbloom:240,lavender:360};const a=new GardenAutomation(s);atWarehouse(a);a.update(s,[],null,.1,0);assert.equal(a.snails.filter(n=>n.supplyWorkshop==='bouquet').length,1);assert.equal(a.snails.filter(n=>n.supplyWorkshop==='tea').length,1);assert.equal(a.snails.filter(n=>n.bag===0).length,1);assert.equal(s.village.raw.moonbloom,108);assert.equal(s.village.raw.lavender,104);assert.equal(planSupply(s),null);until(a,s,()=>a.snails.every(n=>n.bag===0));assert.equal(s.village.workshops.bouquet.inputs.moonbloom,12);assert.equal(s.village.workshops.tea.inputs.lavender,16);
});
test('full or unbuilt workshops do not request goods; an already loaded courier keeps overflow and resumes when there is room',()=>{
 const s=ready();s.village.raw.moonbloom=60;s.village.rawValues.moonbloom=120;assert.equal(planWarehouseSupply(s,24,[],'bouquet'),null);s.village.workshops.bouquet.level=1;setSnailProfile(s,0,{...snailProfile(s,0),workshop:'bouquet'});s.village.finished.bouquet=24;assert.equal(planWarehouseSupply(s,24,[],'bouquet'),null);s.village.finished.bouquet=0;const a=new GardenAutomation(s);atWarehouse(a);a.update(s,[],null,.1,0);const snail=a.snails[0];s.village.workshops.bouquet.inputs.moonbloom=WORKSHOP_INPUT_CAPACITY;s.village.workshops.bouquet.inputValues.moonbloom=240;Object.assign(snail,workshopSpot(WORKSHOPS[0],'input'));for(let i=0;i<20;i++)a.update(s,[],null,.1,0);assert.equal(snail.bag,12);assert.equal(s.coins,0);s.village.workshops.bouquet.inputs.moonbloom-=12;s.village.workshops.bouquet.inputValues.moonbloom-=24;a.update(s,[],null,.1,0);assert.equal(snail.bag,0);assert.equal(s.village.workshops.bouquet.inputs.moonbloom,120);
});
test('switching a mixed supplier to warehouse duty returns all raw and finished cargo with no value loss',()=>{
 const s=ready();giftStock(s);const a=new GardenAutomation(s);atWarehouse(a);a.update(s,[],null,.1,0);setSnailProfile(s,0,{task:'warehouse'});atWarehouse(a);a.update(s,[],null,.1,0);assert.equal(a.snails[0].bag,0);assert.equal(s.village.raw.lavender,16);assert.equal(s.village.storedGoods.bouquet.count,2);assert.equal(s.village.storedGoods.moonHoney.count,2);near(s.village.storedGoods.bouquet.value,60);near(s.village.storedGoods.moonHoney.value,80);assert.equal(s.coins,0);assert.equal(s.village.raw.bouquet,undefined);
});
test('warehouse supply preserves home reserves and uncollected output, respects carrying limits and never invents stock',()=>{
 const s=ready();giftStock(s);s.village.house=0;s.village.storedGoods.bouquet.count=26;s.village.storedGoods.bouquet.value=260;s.village.finished.bouquet=50;s.village.finishedValues.bouquet=1000;const job=planWarehouseSupply(s,10,[],'gifts');assert.ok(Object.values(job.items).reduce((n,x)=>n+x,0)<=10);const full=planWarehouseSupply(s,24,[],'gifts');assert.equal(full.items.bouquet,2);takeWarehouseSupply(s,full);assert.equal(s.village.storedGoods.bouquet.count,24);assert.equal(s.village.finished.bouquet,50);const repeated=takeWarehouseSupply(s,{...full,items:{...full.items},values:{...full.values}});assert.deepEqual(repeated.items,{});assert.equal(s.village.storedGoods.bouquet.count,24);
});
test('suppliers wait at an empty warehouse, rest at night and resume transport in the morning without harvesting nearby plants',()=>{
 const s=ready();s.village.workshops.bouquet.level=1;setSnailProfile(s,0,{...snailProfile(s,0),workshop:'bouquet'});const a=new GardenAutomation(s);atWarehouse(a);const cells=createVillageField(s);for(let i=0;i<10;i++)a.update(s,cells,null,.1,0);assert.equal(s.stats.harvested,0);assert.equal(a.snails[0].bag,0);s.village.raw.moonbloom=12;s.village.rawValues.moonbloom=24;until(a,s,()=>a.snails[0].bag===12);s.journey.light=.9;const before={x:a.snails[0].x,z:a.snails[0].z};a.update(s,cells,null,10,0);assert.equal(a.snails[0].x,before.x);assert.equal(a.snails[0].z,before.z);assert.equal(a.snails[0].bag,12);s.journey.light=0;until(a,s,()=>a.snails[0].bag===0);assert.equal(s.stats.harvested,0);
});
test('visible supply loads include both raw materials and product models',()=>{const entries=carriedStackEntries({lavender:16,bouquet:2,moonHoney:2},{lavender:16,bouquet:2,moonHoney:2});assert.deepEqual(entries.map(e=>[e.id,e.kind]),[['lavender','raw'],['moonHoney','product'],['bouquet','product']]);});

test('a supplier without a selected target waits, and a blocked selected target never redirects to another workshop',()=>{
 const s=ready();s.village.workshops.bouquet.level=1;s.village.workshops.tea.level=1;s.village.raw={moonbloom:60,lavender:60};s.village.rawValues={moonbloom:120,lavender:180};const a=new GardenAutomation(s);atWarehouse(a);
 for(let i=0;i<20;i++)a.update(s,[],null,.1,0);assert.equal(a.snails[0].bag,0);assert.equal(planWarehouseSupply(s),null);
 setSnailProfile(s,0,{task:'supply',workshop:'tea'});s.village.finished.tea=24;
 for(let i=0;i<20;i++)a.update(s,[],null,.1,0);assert.equal(a.snails[0].bag,0);assert.equal(s.village.raw.moonbloom,60);
 s.village.finished.tea=0;until(a,s,()=>a.snails[0].bag>0);assert.equal(a.snails[0].supplyWorkshop,'tea');assert.deepEqual(a.snails[0].items,{lavender:16});
});
test('retargeting a loaded supplier returns the old mixed cargo before supplying only the newly selected workshop, including after reload',()=>{
 let s=ready();giftStock(s);s.village.workshops.tea.level=1;let a=new GardenAutomation(s);atWarehouse(a);a.update(s,[],null,.1,0);assert.equal(a.snails[0].bag,20);
 setSnailProfile(s,0,{task:'supply',workshop:'tea'});a.sync(s);a.snapshot(s);s=normalize(JSON.parse(JSON.stringify(s)));a=new GardenAutomation(s);
 until(a,s,()=>a.snails[0].bag===0);assert.equal(s.village.workshops.gifts.inputs.lavender??0,0);assert.equal(s.village.raw.lavender,16);assert.equal(s.village.storedGoods.bouquet.value,60);assert.equal(s.village.storedGoods.moonHoney.value,80);
 until(a,s,()=>a.snails[0].bag>0);assert.equal(a.snails[0].supplyWorkshop,'tea');assert.deepEqual(a.snails[0].items,{lavender:16});until(a,s,()=>a.snails[0].bag===0);assert.equal(s.village.workshops.tea.inputs.lavender,16);assert.equal(s.village.workshops.gifts.inputs.bouquet??0,0);
 assert.equal(setSnailProfile(s,0,{task:'supply',workshop:'oil'}),false);assert.equal(snailProfile(s,0).workshop,'tea');
});
