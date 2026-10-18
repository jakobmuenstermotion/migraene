import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize,capacity} from './mondgarten/core.mjs';
import {warehouseEntries,carriedWarehouseCount,depositWarehouse,withdrawWarehouse,warehouseCarryRoom,WarehouseVisit} from './mondgarten/warehouse.mjs';
import {stockCount,storageCapacity,takeWorkshopGoods,sellCarriedProducts,getBuildPads,payBuild,deliverWorkshop,advanceProduction} from './mondgarten/village.mjs';
import {WORKSHOPS} from './mondgarten/village-content.mjs';
import {honeyCount,takeHoney} from './mondgarten/apiary.mjs';
import {planSupply,takeSupply,supplySourceSpot} from './mondgarten/logistics.mjs';
import {kitchenIngredientCount,supplyFoodKitchen} from './mondgarten/snail-farm.mjs';
import {liquidFunds} from './mondgarten/funding.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const entry=(s,id)=>warehouseEntries(s).find(e=>e.id===id);
function mixed(){const s=freshState();s.village.house=3;s.village.farm.built=true;s.cargo={moonbloom:{count:12,value:30},lavender:{count:10,value:75}};s.bag=22;s.bagValue=105;s.productCargo={items:{bouquet:4,moonHoney:2,giftbox:1},values:{bouquet:44,moonHoney:70,giftbox:450}};Object.assign(s.outdoors,{fertilizer:3,scrap:5,treasures:2,treasureValue:18,fish:{silver:3},fishValues:{silver:36}});Object.assign(s.village.farm,{food:2,foodValue:16,honeyFood:1,honeyFoodValue:24,snacks:{moonHoney:{count:1,value:40}},shells:{garden:2}});return s;}
test('all goods round-trip through one warehouse with their quantities and original values, without creating workshop pickups',()=>{
 let s=mixed();const expected=carriedWarehouseCount(s),coins=s.coins;const batch=depositWarehouse(s);near(batch.count,expected);near(carriedWarehouseCount(s),0);near(stockCount(s.village),expected);assert.equal(s.village.finished.bouquet??0,0);assert.equal(takeWorkshopGoods(s,'bouquet',100).count,0);assert.equal(entry(s,'bouquet').value,44);
 s=normalize(JSON.parse(JSON.stringify(s)));near(stockCount(s.village),expected);const items=warehouseEntries(s).map(e=>({...e}));for(const e of items){const out=withdrawWarehouse(s,e.id,e.count);near(out.count,e.count);near(out.value,e.value);}near(carriedWarehouseCount(s),expected);near(stockCount(s.village),0);near(s.bagValue,105);near(s.productCargo.values.giftbox,450);near(s.outdoors.fishValues.silver,36);near(s.village.farm.snacks.moonHoney.value,40);assert.equal(s.coins,coins);
});
test('targeted withdrawal respects the bag and separate pouch limits, leaves every other item alone and sells only once',()=>{
 const s=freshState();s.village.storedGoods={bouquet:{count:200,value:1000},fertilizer:{count:120,value:0}};s.village.raw={lavender:10};s.village.rawValues={lavender:70};const max=capacity(s);assert.equal(withdrawWarehouse(s,'bouquet',200).count,max);assert.equal(entry(s,'bouquet').count,200-max);assert.equal(entry(s,'lavender').count,10);assert.equal(withdrawWarehouse(s,'lavender',10).count,0);assert.equal(withdrawWarehouse(s,'fertilizer',120).count,99);near(sellCarriedProducts(s).value,max*5);near(sellCarriedProducts(s).value,0);assert.equal(withdrawWarehouse(s,'no-such-item',9).count,0);for(const n of [NaN,Infinity,-1,0])assert.equal(withdrawWarehouse(s,'bouquet',n).count,0);
});
test('warehouse capacity includes products, food, finds and legacy honey; full warehouses leave carried goods intact',()=>{
 const s=freshState();s.village.raw.moonbloom=storageCapacity(s)-5;s.village.rawValues.moonbloom=100;s.productCargo={items:{bouquet:8},values:{bouquet:80}};s.outdoors.fertilizer=3;const batch=depositWarehouse(s);assert.equal(batch.count,5);near(s.productCargo.items.bouquet,3);near(s.productCargo.values.bouquet,30);assert.equal(s.outdoors.fertilizer,3);assert.equal(depositWarehouse(s).count,0);assert.equal(stockCount(s.village),storageCapacity(s));
 const old=freshState();old.village.finished.moonHoney=2;old.village.finishedValues.moonHoney=70;old.village.farm.storedFood=4;old.village.farm.storedFoodValue=20;assert.equal(stockCount(old.village),6);assert.equal(entry(old,'moonHoney').count,2);assert.equal(withdrawWarehouse(old,'moonHoney',2).value,70);assert.equal(withdrawWarehouse(old,'food',2).value,10);
});
test('stored products retain funding value and can be physically supplied to recipes without consuming uncollected honey remotely',()=>{
 const s=freshState();s.village.house=3;s.village.workshops.gifts.level=1;s.village.workshops.bouquet.level=1;s.village.workshops.tea.level=1;s.productCargo={items:{bouquet:2,moonHoney:2},values:{bouquet:50,moonHoney:70}};const funds=liquidFunds(s);depositWarehouse(s);near(liquidFunds(s),funds);assert.equal(honeyCount(s,null,'storage'),2);near(takeHoney(s,1),35);assert.equal(entry(s,'moonHoney').count,1);
 const job=planSupply(s,24,{productsOnly:true});assert.equal(job.source,'stockroom');assert.equal(supplySourceSpot(job).x,-11);takeSupply(s,job);assert.equal(job.items.bouquet,2);assert.equal(entry(s,'bouquet'),undefined);assert.equal(s.village.finished.bouquet??0,0);
});
test('house construction accepts deposited materials and scrap, with no duplication or extra money',()=>{
 const s=freshState();s.journey.round=30;s.village.house=2;s.village.workshops.tea.level=1;s.productCargo={items:{oil:15},values:{oil:150}};s.outdoors.scrap=6;depositWarehouse(s);const pad=getBuildPads(s).find(p=>p.id==='partner');assert.equal(pad.locked,false);s.coins=pad.cost;assert.ok(payBuild(s,pad,10).complete);assert.ok(s.village.partner);assert.equal(entry(s,'oil'),undefined);assert.equal(entry(s,'scrap'),undefined);assert.equal(s.outdoors.scrap,0);assert.equal(s.productCargo.items.oil,0);
});
test('saved deposits normalize safely and food recipes can access stored bouquets without touching house reserves',()=>{
 const s=freshState();s.village.house=3;s.village.farm.built=true;s.village.storedGoods={bouquet:{count:3,value:30},scrap:{count:6,value:0},unknown:{count:99,value:999},oil:{count:-1,value:100}};s.village.raw.moonbloom=60;s.village.rawValues.moonbloom=75;const restored=normalize(JSON.parse(JSON.stringify(s)));assert.equal(restored.village.storedGoods.unknown,undefined);assert.equal(restored.village.storedGoods.oil,undefined);assert.equal(kitchenIngredientCount(restored,'bouquet','storage'),3);assert.ok(supplyFoodKitchen(restored,'storage'));assert.equal(entry(restored,'bouquet'),undefined);assert.equal(restored.village.farm.kitchen.inputs.bouquet,3);
});
test('empty-handed dwelling opens the shelf; quantity picking protects withdrawals until actually leaving',()=>{
 const v=new WarehouseVisit(),frame={near:true,moving:false,blocked:false,carrying:0,dt:.4};assert.equal(v.tick({...frame,moving:true}),null);assert.equal(v.tick(frame),null);assert.equal(v.tick(frame),'open');v.withdrawn();for(let i=0;i<20;i++)assert.equal(v.tick({...frame,carrying:12}),null);v.tick({...frame,near:false});assert.equal(v.tick({...frame,carrying:12}),'deposit');v.dismiss();assert.equal(v.tick(frame),null);v.tick({...frame,near:false});assert.equal(v.tick({...frame,blocked:true,dt:1}),null);assert.equal(v.tick(frame),null);assert.equal(v.tick(frame),'open');
});

test('fractional raw leftovers can be completely withdrawn and malformed deposit limits do not damage inventory',()=>{
 const s=freshState();s.village.raw.lavender=2.75;s.village.rawValues.lavender=11;assert.equal(withdrawWarehouse(s,'lavender',2.75).count,2.75);near(s.bagValue,11);assert.equal(entry(s,'lavender'),undefined);for(const n of [NaN,-1,0])assert.equal(depositWarehouse(s,n).count,0);near(s.bag,2.75);depositWarehouse(s);near(entry(s,'lavender').count,2.75);
});
test('stored honeyapples keep their funding value and food cooking preserves home materials at other sources',()=>{
 const s=freshState();s.village.farm.built=true;s.productCargo={items:{honeyapple:2},values:{honeyapple:300}};const before=liquidFunds(s);depositWarehouse(s);near(liquidFunds(s),before);s.village.finished.bouquet=24;s.village.finishedValues.bouquet=240;s.village.storedGoods.bouquet={count:27,value:270};s.village.raw.moonbloom=60;s.village.rawValues.moonbloom=75;assert.ok(supplyFoodKitchen(s,'all'));assert.equal(s.village.finished.bouquet,24);assert.equal(s.village.storedGoods.bouquet.count,24);
});
