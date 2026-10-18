import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from './mondgarten/vendor/three.module.js';
import {freshState,normalize,TOOLS,format} from './mondgarten/core.mjs';
import {WORKSHOPS,VILLAGE} from './mondgarten/village-content.mjs';
import {BOUTIQUES,cosmeticPrice} from './mondgarten/boutiques.mjs';
import {getBuildPads,payBuild,buildPayment,discoverSeeds,workshopNeeds} from './mondgarten/village.mjs';
import {prepareDay} from './mondgarten/daily.mjs';
import {isInsideBuildPad,buildPadDistance} from './mondgarten/field-expansion.mjs';
import {upgradeInfo} from './mondgarten/upgrade-info.mjs';
const stylePad=s=>getBuildPads(s,TOOLS).find(p=>p.id==='boutique:style');
test('accessories use a fixed-price optional build pad from round twelve, without changing daily funding',()=>{
 const s=freshState();s.coins=1e6;s.journey.round=11;let pad=stylePad(s);assert.equal(pad.visible,false);assert.equal(payBuild(s,{...pad,locked:false},10).complete,false);
 for(const round of [12,30,77]){s.journey.round=round;pad=stylePad(s);assert.equal(pad.cost,49000);assert.ok(pad.visible&&!pad.locked&&pad.optional);assert.equal(cosmeticPrice('style'),49000);}
 s.journey.round=12;const plan=prepareDay(s,TOOLS),target=plan.target,boost=plan.boost;assert.equal(plan.items.some(p=>p.id==='boutique:style'),false);
 assert.ok(payBuild(s,stylePad(s),10).complete);assert.equal(plan.target,target);assert.equal(plan.boost,boost);assert.equal(s.coins,951000);assert.ok(stylePad(s).max);assert.equal(payBuild(s,pad,10).paid,0);
});
test('construction resumes saved deposits, accepts already funded legacy saves and never removes existing shops',()=>{
 let s=freshState();s.journey.round=12;s.coins=12000;assert.equal(payBuild(s,stylePad(s),10).complete,false);assert.equal(buildPayment(s,'boutique:style'),12000);
 s=normalize(JSON.parse(JSON.stringify(s)));s.coins=37000;assert.ok(payBuild(s,stylePad(s),10).complete);assert.equal(s.coins,0);assert.equal(buildPayment(s,'boutique:style'),0);s=normalize(JSON.parse(JSON.stringify(s)));assert.ok(s.village.boutiques.built.includes('style'));
 const legacy=freshState();legacy.journey.round=12;legacy.coins=200;legacy.village.boutiques.payments.style=700000;const restored=normalize(JSON.parse(JSON.stringify(legacy)));assert.equal(buildPayment(restored,'boutique:style'),49000);assert.ok(payBuild(restored,stylePad(restored),1).complete);assert.equal(restored.coins,200);
 const sleeping=freshState();sleeping.journey.round=12;sleeping.coins=49000;const p=stylePad(sleeping);sleeping.journey.asleep=true;assert.equal(payBuild(sleeping,p,10).paid,0);
});
test('the real purchase interaction requires dwelling on the accessories pad and pauses for moving or menus',()=>{
 const state=freshState();state.journey.round=12;state.coins=50000;const nodes=new Map();let saves=0;
 const context={state,pads:getBuildPads(state,TOOLS),player:{x:0,z:0,moving:false},modal:{open:false},warehouseShelf:{visible:false},activePad:null,completedPad:'',dwellingID:'',padDwell:0,padEffectClock:0,VILLAGE,isInsideBuildPad,buildPadDistance,payBuild,buildPayment,upgradeInfo,format,discoverSeeds,
  scene:{spendMoney(){},celebrate(){}},save(){saves++;},sound(){},toast(){},refreshWorld(){context.pads=getBuildPads(state,TOOLS);},$:id=>{if(!nodes.has(id))nodes.set(id,{style:{}});return nodes.get(id);}};
 const src=readFileSync(new URL('./mondgarten/game.js',import.meta.url),'utf8');vm.createContext(context);vm.runInContext(src.slice(src.indexOf('function updatePurchase(dt)'),src.indexOf('function farmSpot(')),context);
 const tick=(n=1)=>{for(let i=0;i<n;i++)context.updatePurchase(.1);};tick(20);assert.equal(state.coins,50000);
 Object.assign(context.player,stylePad(state),{moving:true});tick(20);assert.equal(state.coins,50000);context.player.moving=false;tick(4);assert.equal(state.coins,50000);
 context.modal.open=true;tick(20);assert.equal(state.coins,50000);context.modal.open=false;tick(60);assert.ok(state.village.boutiques.built.includes('style'));assert.ok(Math.abs(state.coins-1000)<1e-7);assert.equal(saves,1);tick(40);assert.ok(Math.abs(state.coins-1000)<1e-7);
});
test('ingredient needs use local stock, show missing quantities, and follow usable alternative ingredients without changing recipes',()=>{
 const s=freshState(),bouquet=WORKSHOPS[0],gift=WORKSHOPS.find(w=>w.id==='gifts');const before=JSON.stringify(s);
 assert.deepEqual(workshopNeeds(s,bouquet).rows.map(r=>[r.id,r.have,r.need,r.missing]),[['moonbloom',0,6,6]]);assert.equal(JSON.stringify(s),before);
 s.cargo.moonbloom={count:6,value:30};s.village.raw.moonbloom=6;assert.equal(workshopNeeds(s,bouquet).rows[0].have,0);
 s.village.workshops.bouquet.inputs={sunbloom:2};let needs=workshopNeeds(s,bouquet);assert.equal(needs.rows[0].id,'sunbloom');assert.equal(needs.rows[0].missing,2);assert.match(needs.alternatives,/Mondblüten/);
 s.village.workshops.bouquet.inputs={sunbloom:4,moonbloom:6};assert.equal(workshopNeeds(s,bouquet).rows[0].id,'sunbloom');
 s.village.workshops.gifts.inputs={lavender:8,bouquet:1,lavenderHoney:1};needs=workshopNeeds(s,gift);assert.equal(needs.rows.length,3);assert.ok(needs.rows.every(r=>r.missing===0));assert.ok(needs.rows.some(r=>r.id==='lavenderHoney'));assert.match(needs.alternatives,/Jede Honigsorte/);
});
const oldDocument=globalThis.document;globalThis.document={createElement:()=>{const texts=[];return{_texts:texts,getContext:()=>({fillText:t=>texts.push(t),fillRect(){},createRadialGradient:()=>({addColorStop(){}})})};}};
const {GardenScene}=await import('./mondgarten/scene.js');test.after(()=>globalThis.document=oldDocument);
function scene(){const s=freshState();const view=Object.create(GardenScene.prototype);Object.assign(view,{construction:new T.Group(),villageState:s});return view;}
test('built accessories become an enclosed building with roof, door and windows inside its plot',()=>{
 const view=scene(),s=view.villageState;s.journey.round=12;view.makeBoutiques(s);assert.equal(view.construction.getObjectByName('accessory-shop-building'),undefined);
 s.village.boutiques.built=['style'];view.construction.clear();view.makeBoutiques(s);const house=view.construction.getObjectByName('accessory-shop-building');assert.ok(house);view.construction.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(house),shop=BOUTIQUES.find(b=>b.id==='style');assert.ok(bounds.max.y>3);assert.ok(bounds.min.x>=shop.x-1.95&&bounds.max.x<=shop.x+1.95);assert.ok(bounds.min.z>=shop.z-1.5&&bounds.max.z<=shop.z+1.5);
});
test('actual ingredient signs show missing stock nearby, clear the status sign, reuse textures and stop updating far away',()=>{
 const view=scene(),w=WORKSHOPS[0],s=view.villageState,visual={needsSign:view.makeWorkshopNeeds(w)};const player={x:w.x,z:w.z};view.updateWorkshopNeeds(visual,w,player,.3);assert.ok(visual.needsSign.visible);let map=visual.needsSign.material.map;assert.ok(map.image._texts.includes('6 Mondblüten'));assert.ok(map.image._texts.includes('0 / 6 vor Ort · fehlt 6'));assert.ok(visual.needsSign.position.y-visual.needsSign.scale.y/2>4.8);
 view.updateWorkshopNeeds(visual,w,player,.3);assert.equal(visual.needsSign.material.map,map);let disposed=false;map.addEventListener('dispose',()=>disposed=true);s.village.workshops.bouquet.inputs.moonbloom=6;view.updateWorkshopNeeds(visual,w,player,.3);assert.ok(disposed);map=visual.needsSign.material.map;assert.ok(map.image._texts.includes('6 / 6 vor Ort · bereit'));
 s.village.workshops.bouquet.running=true;view.updateWorkshopNeeds(visual,w,player,.3);assert.ok(visual.needsSign.material.map.image._texts.includes('FÜR DIE NÄCHSTE CHARGE'));map=visual.needsSign.material.map;s.village.workshops.bouquet.inputs.moonbloom=0;view.updateWorkshopNeeds(visual,w,{x:100,z:100},1);assert.equal(visual.needsSign.visible,false);assert.equal(visual.needsSign.material.map,map);
});
