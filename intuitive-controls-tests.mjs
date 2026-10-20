import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize,TOOLS} from './mondgarten/core.mjs';
import {WORKSHOPS} from './mondgarten/village-content.mjs';
import {deliverWorkshop,WORKSHOP_INPUT_CAPACITY,advanceProduction} from './mondgarten/village.mjs';
import {automaticIngredients,nearbyWorkshop,workshopDeliveryView} from './mondgarten/workshop-interaction.mjs';
import {WorkshopDelivery} from './mondgarten/workshop-ui.mjs';
import {FishingHUD} from './mondgarten/fishing-ui.mjs';
import {carriedStackEntries} from './mondgarten/cargo-stack.mjs';
import {depositWarehouse,withdrawWarehouse} from './mondgarten/warehouse.mjs';
import {sellOutdoorGoods,LAKE,startFishing,equipOutdoorTool} from './mondgarten/outdoors.mjs';
import {morningDiscoveries} from './mondgarten/morning-news.mjs';
import * as T from './mondgarten/vendor/three.module.js';
const gift=WORKSHOPS.find(w=>w.id==='gifts'),near=w=>({x:w.x,z:w.z+2.8});
function ready(){const s=freshState();for(const w of WORKSHOPS)s.village.workshops[w.id].level=1;s.village.house=3;s.cargo={lavender:{count:16,value:40}};s.bag=16;s.bagValue=40;s.productCargo={items:{bouquet:2,moonHoney:2},values:{bouquet:60,moonHoney:80}};return s;}
function element(){const nodes=new Map();return{hidden:false,style:{},dataset:{},scrollTop:0,listeners:{},classList:{add(){},remove(){},toggle(){}},addEventListener(n,f){(this.listeners[n]??=[]).push(f);},emit(n,e={}){for(const f of this.listeners[n]??[])f(e);},querySelector(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},getBoundingClientRect(){return{left:0,right:100,top:0,bottom:100};},setPointerCapture(){}};}
const event=(target,x,y)=>({target,pointerId:1,clientX:x,clientY:y,preventDefault(){}});
test('workshop front areas are easy to reach, stay local, and only single-ingredient recipes auto-deliver',()=>{
 const s=ready();for(const w of WORKSHOPS){assert.equal(nearbyWorkshop(s,near(w)).id,w.id);assert.equal(automaticIngredients(w),!['elixir','gifts'].includes(w.id));}assert.equal(nearbyWorkshop(s,{x:0,z:0}),null);
 s.village.workshops.gifts.level=0;assert.equal(nearbyWorkshop(s,near(gift)),null);
});
test('manual deliveries transfer only the selected ingredient with exact original values, keep products whole and never discard overflow',()=>{
 const s=ready();assert.deepEqual(deliverWorkshop(s,gift,Infinity,'moonHoney'),{count:2,value:80});assert.equal(s.bag,16);assert.equal(s.productCargo.items.bouquet,2);assert.equal(s.village.workshops.gifts.inputs.moonHoney,2);
 assert.equal(deliverWorkshop(s,gift,.4,'bouquet').count,0);assert.equal(s.productCargo.items.bouquet,2);
 s.village.workshops.gifts.inputs.lavender=WORKSHOP_INPUT_CAPACITY-2;s.village.workshops.gifts.inputValues.lavender=118;
 const before=structuredClone(s.productCargo);assert.equal(deliverWorkshop(s,gift,Infinity,'bouquet').count,0);assert.deepEqual(s.productCargo,before);
 assert.equal(deliverWorkshop(s,gift,Infinity,'crystal').count,0);
});
test('the ingredient view chooses carried honey alternatives and shows actual delivered quantities, never remote storage',()=>{
 const s=ready();delete s.productCargo.items.moonHoney;s.productCargo.items.lavenderHoney=2;s.productCargo.values.lavenderHoney=80;s.village.raw.lavender=999;
 const view=workshopDeliveryView(s,gift);assert.equal(view.automatic,false);assert.ok(view.rows.some(r=>r.id==='lavenderHoney'&&r.have===0&&r.missing===1));assert.equal(view.items.find(x=>x.id==='lavender').count,16);
 deliverWorkshop(s,gift,Infinity,'lavenderHoney');assert.equal(workshopDeliveryView(s,gift).rows.find(r=>r.id==='lavenderHoney').have,2);
});
test('dragging, tapping and keyboard activation deliver once; cancellation and drops outside do nothing',()=>{
 const s=ready(),root=element();let deliveries=0,dragging=false;
 const ui=new WorkshopDelivery(root,{onDrag:v=>dragging=v,onDeliver:(w,id)=>{deliveries++;deliverWorkshop(s,w,Infinity,id);}});ui.show(gift,workshopDeliveryView(s,gift));
 const button={dataset:{ingredient:'moonHoney'},setPointerCapture(){}},target={closest:()=>button};
 root.emit('pointerdown',event(target,20,180));assert.equal(dragging,true);root.emit('pointermove',event(target,30,40));root.emit('pointerup',event(target,30,40));assert.equal(deliveries,1);assert.equal(dragging,false);assert.equal(s.village.workshops.gifts.inputs.moonHoney,2);
 for(const finish of ['pointercancel','lostpointercapture']){root.emit('pointerdown',event(target,20,180));root.emit(finish,{});assert.equal(dragging,false);}assert.equal(deliveries,1);
 root.emit('pointerdown',event(target,20,180));root.emit('pointermove',event(target,180,180));root.emit('pointerup',event(target,180,180));assert.equal(deliveries,1);
 button.dataset.ingredient='bouquet';root.emit('pointerdown',event(target,20,180));root.emit('pointerup',event(target,20,180));assert.equal(deliveries,2);root.emit('click',{target,detail:1});assert.equal(deliveries,2);
 button.dataset.ingredient='lavender';root.emit('click',{target,detail:0});assert.equal(deliveries,3);advanceProduction(s,180);assert.equal(s.village.finished.giftbox,1);
});
test('the compact fishing controls release input on interruptions and hide when the cast ends',()=>{
 const root=element();let held=false,cancelled=0;const ui=new FishingHUD(root,{onHold:v=>held=v,onCancel:()=>cancelled++});assert.equal(root.hidden,true);
 ui.update({phase:'catch',target:.5,marker:.4,progress:.3},{hint:'Zieht ruhig',band:.2});assert.equal(root.hidden,false);
 const hold=root.querySelector('[data-hold]');hold.emit('pointerdown',event(hold,1,1));assert.equal(held,true);hold.emit('pointercancel');assert.equal(held,false);hold.emit('pointerdown',event(hold,1,1));ui.update(null);assert.equal(held,false);assert.equal(root.hidden,true);root.querySelector('[data-cancel]').onclick();assert.equal(cancelled,1);
});
test('fish are a real stack group and keep their count and value across storage, saving and selling',()=>{
 let s=ready();s.outdoors.fish.silver=3;s.outdoors.fishValues.silver=72;const entries=carriedStackEntries(s.cargo,s.productCargo.items,s.outdoors.fish);assert.equal(entries.at(-1).kind,'fish');assert.equal(entries.at(-1).id,'fish:silver');assert.equal(entries.at(-1).count,3);
 depositWarehouse(s);assert.equal(carriedStackEntries(s.cargo,s.productCargo.items,s.outdoors.fish).length,0);s=normalize(JSON.parse(JSON.stringify(s)));assert.equal(withdrawWarehouse(s,'fish:silver',3).value,72);assert.equal(sellOutdoorGoods(s).value,72);assert.equal(sellOutdoorGoods(s).value,0);
});
test('morning availability is announced once per day across reloads and does not change money, prices or harvest value',()=>{
 let s=freshState();s.journey.round=12;s.coins=12345;const before=structuredClone(s.village);const news=morningDiscoveries(s,TOOLS);assert.ok(news.some(n=>n.includes('Accessoiresladen')));assert.ok(news.some(n=>n.includes('Düngerwerkstatt')));assert.equal(s.coins,12345);assert.deepEqual(s.village,before);assert.equal(morningDiscoveries(s,TOOLS),null);s=normalize(JSON.parse(JSON.stringify(s)));assert.equal(morningDiscoveries(s,TOOLS),null);
 s.journey.round=20;assert.ok(morningDiscoveries(s,TOOLS).some(n=>n.includes('Gartenglück')));s.journey.round=21;s.journey.asleep=true;assert.equal(morningDiscoveries(s,TOOLS),null);assert.equal(s.journey.announcedRound,20);
});
const previousDocument=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
const {GardenScene}=await import('./mondgarten/scene.js');test.after(()=>globalThis.document=previousDocument);
test('the real scene displays a large animated fish, bobber and rod line and flies the fish model onto the stack',()=>{
 const s=ready();s.outdoors.owned=['rod'];equipOutdoorTool(s,'rod');startFishing(s,LAKE.shore,1,()=>0);
 const scene=Object.create(GardenScene.prototype);Object.assign(scene,{villageState:s,construction:new T.Group(),scene:new T.Scene(),flights:[],time:2,reducedMotion:()=>false});scene.makeOutdoorModels(s);scene.updateOutdoorVisuals(LAKE.shore);assert.equal(scene.fishingVisual.root.visible,true);assert.ok(scene.fishingVisual.fish.getObjectByName('fish:silver'));const before=scene.fishingVisual.fish.position.clone();scene.time=3;scene.updateOutdoorVisuals(LAKE.shore);assert.notDeepEqual(scene.fishingVisual.fish.position,before);assert.equal(scene.fishingVisual.line.geometry.attributes.position.count,2);
 s.outdoors.fishing.phase='catch';scene.updateFishingVisual(LAKE.shore);assert.equal(scene.fishingVisual.fish.scale.x,1.8);scene.makeTransfer({...LAKE.shore,y:.5},null,'fish:silver');assert.equal(scene.flights[0].mesh.name,'fish:silver');assert.equal(scene.flights[0].type,'pickup');s.outdoors.fishing=null;scene.updateFishingVisual(LAKE.shore);assert.equal(scene.fishingVisual.root.visible,false);
});
