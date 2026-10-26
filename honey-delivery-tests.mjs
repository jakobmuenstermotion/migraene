import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize,capacity} from './mondgarten/core.mjs';
import {WORKSHOPS} from './mondgarten/village-content.mjs';
import {HIVES} from './mondgarten/honey-content.mjs';
import {collectHoney} from './mondgarten/apiary.mjs';
import {deliverWorkshop,depositWorkshopSupplies,advanceProduction,workshopStock} from './mondgarten/village.mjs';
import {workshopDeliveryView} from './mondgarten/workshop-interaction.mjs';
import {WorkshopDelivery} from './mondgarten/workshop-ui.mjs';
const gift=WORKSHOPS.find(w=>w.id==='gifts');
function ready(){const s=freshState();s.village.workshops.gifts.level=1;return s;}
function raw(s,n){s.bag=n;s.bagValue=n*2;s.cargo={lavender:{count:n,value:n*2}};}
function full(s){const m=s.village.workshops.gifts;m.inputs={lavender:120};m.inputValues={lavender:240};}
function element(){const nodes=new Map();return{style:{},scrollTop:0,listeners:{},classList:{add(){},remove(){},toggle(){}},addEventListener(n,f){(this.listeners[n]??=[]).push(f);},emit(n,e){for(const f of this.listeners[n]??[])f(e);},querySelector(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},getBoundingClientRect(){return{left:0,right:100,top:0,bottom:100};}};}
const value=s=>s.bagValue+Object.values(s.productCargo.values).reduce((n,x)=>n+x,0)+Object.values(s.village.workshops.gifts.inputValues).reduce((n,x)=>n+x,0);
for(const [index,h]of HIVES.entries())for(const gesture of ['tap','drag'])test(`${gesture}: ${h.name} collected from its hive can be delivered to an old lavender-filled workshop and made into a gift`,()=>{
 let s=ready();full(s);Object.assign(s.village.apiary.hives[index],{built:true,count:1,value:30});assert.equal(collectHoney(s,index),1);s.productCargo.items.bouquet=1;s.productCargo.values.bouquet=10;const before=value(s);
 const root=element();const ui=new WorkshopDelivery(root,{onDeliver:(w,id)=>deliverWorkshop(s,w,Infinity,id)});ui.show(gift,workshopDeliveryView(s,gift));assert.ok(root.innerHTML.includes('data-ingredient="'+h.honey+'"'));assert.doesNotMatch(root.innerHTML,/disabled/);
 const button={dataset:{ingredient:h.honey},setPointerCapture(){}},target={closest:()=>button};if(gesture==='tap')root.emit('click',{target,detail:1});else{const e={target,pointerId:1,clientX:20,clientY:180,preventDefault(){}};root.emit('pointerdown',e);root.emit('pointermove',{...e,clientX:30,clientY:40});root.emit('pointerup',{...e,clientX:30,clientY:40});}assert.equal(s.village.workshops.gifts.inputs[h.honey],1);assert.equal(s.productCargo.items[h.honey],0);assert.equal(s.bag,2);assert.equal(s.village.workshops.gifts.inputs.lavender,118);assert.equal(value(s),before);
 assert.equal(deliverWorkshop(s,gift,Infinity,'bouquet').count,1);assert.equal(workshopStock(s.village.workshops.gifts),120);assert.equal(value(s),before);
 s=normalize(JSON.parse(JSON.stringify(s)));advanceProduction(s,180);assert.equal(s.village.finished.giftbox,1);assert.equal(s.village.finishedValues.giftbox,280);
});
test('new manual and snail deliveries reserve room for the other recipe ingredients',()=>{
 for(const helper of [false,true]){const s=ready();if(helper){const cargo={items:{lavender:120},values:{lavender:240}};assert.equal(depositWorkshopSupplies(s,gift,cargo),118);assert.equal(cargo.items.lavender,2);}else{raw(s,120);assert.equal(deliverWorkshop(s,gift,Infinity,'lavender').count,118);assert.equal(s.bag,2);}
 s.productCargo={items:{moonHoney:1,bouquet:1},values:{moonHoney:30,bouquet:10}};assert.equal(deliverWorkshop(s,gift,Infinity,'moonHoney').count,1);assert.equal(deliverWorkshop(s,gift,Infinity,'bouquet').count,1);advanceProduction(s,180);assert.equal(s.village.finished.giftbox,1);}
});
test('a full backpack or invalid requested amount cannot discard stock or change an old blocked workshop',()=>{
 const s=ready();full(s);s.productCargo={items:{moonHoney:1,bouquet:1},values:{moonHoney:30,bouquet:10}};raw(s,capacity(s)-2);const before=JSON.stringify(s);
 assert.equal(deliverWorkshop(s,gift,Infinity,'moonHoney').count,0);assert.equal(JSON.stringify(s),before);
 for(const limit of [0,-1,NaN]){assert.equal(deliverWorkshop(s,gift,limit,'moonHoney').count,0);assert.equal(JSON.stringify(s),before);}
});
test('tap plus a generated click delivers only once, and click-only input is still accepted',()=>{
 const s=ready();s.productCargo={items:{moonHoney:3},values:{moonHoney:90}};const root=element();let calls=0;const ui=new WorkshopDelivery(root,{onDeliver:(w,id)=>{calls++;deliverWorkshop(s,w,Infinity,id);}});ui.show(gift,workshopDeliveryView(s,gift));const button={dataset:{ingredient:'moonHoney'},setPointerCapture(){}},target={closest:()=>button};const e={target,pointerId:1,clientX:20,clientY:30,preventDefault(){}};
 root.emit('pointerdown',e);root.emit('pointerup',e);root.emit('click',{target,detail:0});root.emit('click',{target,detail:1});assert.equal(calls,1);assert.equal(s.village.workshops.gifts.inputs.moonHoney,3);
});
