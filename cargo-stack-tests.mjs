import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './mondgarten/vendor/three.module.js';
import {WORLD,COLLECTIBLES,stackLevels} from './mondgarten/content.mjs';
import {PRODUCTS,WORKSHOPS} from './mondgarten/village-content.mjs';
import {freshState,normalize} from './mondgarten/core.mjs';
import {depositBag,deliverWorkshop,takeWorkshopGoods,sellCarriedProducts} from './mondgarten/village.mjs';
import {carriedStackEntries,cargoStackLayout} from './mondgarten/cargo-stack.mjs';
const originalDocument=globalThis.document;
globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
const {GardenScene,updateCargoStack}=await import('./mondgarten/scene.js');
const view=()=>{const scene=Object.create(GardenScene.prototype);scene.harvestBundles={};return scene;};
const actor=()=>({stack:new T.Group(),layers:[]});
const options={dt:1,reducedMotion:true};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function contents(){const s=freshState();s.bag=10;s.bagValue=16.5;s.cargo={lavender:{count:4,value:9},moonbloom:{count:6,value:7.5}};s.productCargo={items:{bouquet:2,moonHoney:1},values:{bouquet:30,moonHoney:24}};return s;}

test('all carried raw types appear below actual products, in stable order independent of insertion order',()=>{
 const s=contents(),before=JSON.stringify(s),entries=carriedStackEntries(s.cargo,s.productCargo.items);
 assert.deepEqual(entries.map(e=>[e.kind,e.id,e.count]),[['raw','moonbloom',6],['raw','lavender',4],['product','moonHoney',1],['product','bouquet',2]]);
 assert.equal(JSON.stringify(s),before);assert.deepEqual(carriedStackEntries({moonbloom:{count:NaN},lavender:-2},{bouquet:0,unknown:9}),[]);
 assert.deepEqual(carriedStackEntries({moonbloom:3,bouquet:2},{moonbloom:3,bouquet:2}).map(e=>e.id),['moonbloom','bouquet']);
});
test('a single product among many flowers stays visible while the exact fill-ratio height and layer bound are preserved',()=>{
 const entries=carriedStackEntries({moonbloom:999},{bouquet:1}),layout=cargoStackLayout(entries,1000);
 assert.equal(layout.layers.length,WORLD.stack.maxVisible);assert.equal(layout.layers.at(-1).id,'bouquet');assert.equal(layout.layers.at(-1).count,1);near(layout.layers.reduce((n,e)=>n+e.height,0),26);
 const scene=view(),a=actor();updateCargoStack(a,entries,1000,e=>scene.cargoTemplate(e),options);near(new T.Box3().setFromObject(a.stack).max.y,26*WORLD.stack.layerHeight);
 const raw=Object.fromEntries(Object.keys(COLLECTIBLES).map(id=>[id,1])),products=Object.fromEntries(Object.keys(PRODUCTS).map(id=>[id,1])),all=carriedStackEntries(raw,products),sparse=cargoStackLayout(all,272);
 assert.deepEqual(new Set(sparse.layers.map(e=>e.kind+':'+e.id)),new Set(all.map(e=>e.kind+':'+e.id)));assert.ok(sparse.layers.length<=WORLD.stack.maxVisible);near(sparse.layers.reduce((n,e)=>n+e.height,0),stackLevels(all.length,272));
});
test('pickup adds products above existing flower models; removing cargo clears only absent types and leaves no phantom layers',()=>{
 const scene=view(),a=actor(),render=(raw,products)=>updateCargoStack(a,carriedStackEntries(raw,products),80,e=>scene.cargoTemplate(e),options);
 render({moonbloom:40},{});const flowers=[...a.layers];render({moonbloom:40},{bouquet:2,tea:1});assert.ok(a.layers.some(l=>flowers.includes(l)));assert.equal(a.layers.at(-1).userData.itemId,'tea');
 const bouquets=a.layers.filter(l=>l.userData.itemId==='bouquet');render({}, {bouquet:2,tea:1});assert.ok(a.layers.some(l=>bouquets.includes(l)));assert.equal(a.layers.some(l=>l.userData.kind==='raw'),false);
 render({},{});assert.equal(a.layers.length,0);assert.equal(a.stack.children.length,0);
});
test('save/load, raw delivery and finished-goods sale update the stack from real inventory without changing values',()=>{
 let s=contents();const initial=carriedStackEntries(s.cargo,s.productCargo.items);s=normalize(JSON.parse(JSON.stringify(s)));assert.deepEqual(carriedStackEntries(s.cargo,s.productCargo.items),initial);
 s.village.workshops.bouquet.level=1;deliverWorkshop(s,WORKSHOPS[0]);assert.deepEqual(carriedStackEntries(s.cargo,s.productCargo.items).map(e=>e.id),['lavender','moonHoney','bouquet']);
 depositBag(s);assert.deepEqual(carriedStackEntries(s.cargo,s.productCargo.items).map(e=>e.id),['moonHoney','bouquet']);s.village.finished.tea=1;s.village.finishedValues.tea=17;takeWorkshopGoods(s,'tea',1);assert.equal(carriedStackEntries(s.cargo,s.productCargo.items).at(-1).id,'tea');
 assert.equal(sellCarriedProducts(s).value,71);assert.deepEqual(carriedStackEntries(s.cargo,s.productCargo.items),[]);
});
test('rendered type counts match carried counts and stack height grows continuously with each added item',()=>{
 const scene=view(),a=actor();let previous=0;
 for(let count=1;count<=78;count++){const entries=carriedStackEntries({moonbloom:count},{bouquet:2}),levels=updateCargoStack(a,entries,80,e=>scene.cargoTemplate(e),options);assert.ok(levels>previous);previous=levels;
  near(a.layers.filter(l=>l.userData.itemId==='moonbloom').reduce((n,l)=>n+l.userData.representedCount,0),count);near(a.layers.filter(l=>l.userData.itemId==='bouquet').reduce((n,l)=>n+l.userData.representedCount,0),2);near(new T.Box3().setFromObject(a.stack).max.y,levels*WORLD.stack.layerHeight);
 }assert.equal(previous,WORLD.stack.maxVisible);
});
test.after(()=>{globalThis.document=originalDocument;});
