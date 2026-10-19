import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {freshState,format,TOOLS} from './mondgarten/core.mjs';
import {nearLake,LAKE,OUTDOOR_TOOLS,outdoorToolPrice,equipOutdoorTool,startFishing,advanceFishing} from './mondgarten/outdoors.mjs';
import {BOUTIQUES,COSMETICS,SNAIL_HATS,cosmeticPrice,cosmeticAvailable} from './mondgarten/boutiques.mjs';
const src=readFileSync(new URL('./mondgarten/game.js',import.meta.url),'utf8');
const extract=(from,to)=>src.slice(src.indexOf(from),src.indexOf(to,src.indexOf(from)));
function fixture(){
 const state=freshState();state.journey.round=12;state.village.boutiques.built=['style'];
 const nodes=new Map(),messages=[],opens=[];const $=id=>{if(!nodes.has(id))nodes.set(id,{style:{},hidden:false,clientWidth:390,clientHeight:700,focus(){},addEventListener(){},setAttribute(){}});return nodes.get(id);};
 const modal={open:false,showModal(){this.open=true;},querySelectorAll(){return[];}};
 const c={state,player:{...LAKE.shore,moving:false},modal,modalView:'',warehouseShelf:{visible:false},controls:{stop(){}},cells:[],harvestClock:0,fishingHolding:false,nearLake,LAKE,OUTDOOR_TOOLS,outdoorToolPrice,equipOutdoorTool,startFishing,format,TOOLS,BOUTIQUES,COSMETICS,SNAIL_HATS,cosmeticPrice,cosmeticAvailable,scene:{worldToScreen(){return{x:195,y:300,visible:true};}},bedYield:()=>2,refreshWorld(){},save(){},toast:m=>messages.push(m),title:(_e,h)=>`<h2>${h}</h2>`,esc:String,dismissFeedback(){},openOutdoors(){},place(el,p){el.hidden=!p.visible;},$};
 vm.createContext(c);vm.runInContext(extract('function openModal(', 'function walkTo('),c);vm.runInContext(extract('function openFishing()', 'function updateFishingUI('),c);vm.runInContext(extract('function updateLakeAction()', 'function updateLabels('),c);
 vm.runInContext(extract('let boutiqueVisit=null', 'function updateOutdoorPlay('),c);c.openBoutiques=id=>{opens.push(id);modal.open=true;};return{c,state,$,messages,opens};
}
test('the lake interaction covers every bank and the pier, but excludes distant flower fields',()=>{
 for(const p of [LAKE.shore,LAKE.dock,{x:LAKE.x+4.4,z:LAKE.z},{x:LAKE.x-4.4,z:LAKE.z},{x:LAKE.x,z:LAKE.z+3.5},{x:LAKE.x,z:LAKE.z-3.5}])assert.ok(nearLake(p));
 for(const p of [{x:0,z:0},{x:LAKE.x+6,z:LAKE.z},{x:LAKE.x,z:LAKE.z+5}])assert.equal(nearLake(p),false);
});
test('the fishing icon appears nearby without manually equipping a tool and hides during menus, storage and sleep',()=>{
 const {c,state,$}=fixture();c.updateLakeAction();assert.equal($('outdoorAction').hidden,false);
 for(const block of ['modal','warehouseShelf']){c[block][block==='modal'?'open':'visible']=true;c.updateLakeAction();assert.ok($('outdoorAction').hidden);c[block][block==='modal'?'open':'visible']=false;}
 state.journey.asleep=true;c.updateLakeAction();assert.ok($('outdoorAction').hidden);state.journey.asleep=false;c.player.x=0;c.updateLakeAction();assert.ok($('outdoorAction').hidden);
});
test('one fishing action equips an owned rod, opens the actual minigame and catches a fish',()=>{
 const {c,state,$}=fixture();state.outdoors.owned=['rod','detector'];equipOutdoorTool(state,'detector');c.openFishing();assert.equal(state.outdoors.equipped,'rod');assert.equal(c.modalView,'fishing');assert.ok(c.modal.open);assert.equal(state.outdoors.fishing.phase,'waiting');assert.match($('modalBody').innerHTML,/fishingHold/);
 const cast=state.outdoors.fishing;c.openFishing();assert.equal(state.outdoors.fishing,cast);advanceFishing(state,6);let result;for(let i=0;i<400&&!result;i++){const f=state.outdoors.fishing;result=advanceFishing(state,.05,f.marker<f.target);}assert.equal(result.kind,'fish');assert.equal(Object.values(state.outdoors.fish).reduce((a,b)=>a+b,0),1);
});
test('missing rod, distant players, full fish bags and sleep do not start a cast or alter equipped tools',()=>{
 for(const reason of ['rod','distance','full','sleep']){const {c,state,messages}=fixture();state.outdoors.owned=['detector',...(reason==='rod'?[]:['rod'])];equipOutdoorTool(state,'detector');if(reason==='distance')c.player.x=0;if(reason==='full')state.outdoors.fish.silver=100;if(reason==='sleep')state.journey.asleep=true;c.openFishing();assert.equal(state.outdoors.fishing,null);assert.equal(state.outdoors.equipped,'detector');assert.equal(c.modal.open,false);if(reason!=='sleep')assert.equal(messages.length,1);}
});
test('entering a built accessory shop opens it while walking, and closing does not reopen until leaving',()=>{
 const {c,state,opens}=fixture(),shop=BOUTIQUES.find(s=>s.id==='style');Object.assign(c.player,{x:shop.x,z:shop.z+2.7,moving:true});c.updateBoutiqueEntry(.1);c.updateBoutiqueEntry(.1);assert.deepEqual(opens,['style']);c.modal.open=false;for(let i=0;i<30;i++)c.updateBoutiqueEntry(.1);assert.equal(opens.length,1);
 c.player.z=shop.z+5;c.updateBoutiqueEntry(.1);c.player.z=shop.z;c.updateBoutiqueEntry(.2);assert.equal(opens.length,2);
 c.modal.open=false;c.player.z=shop.z+5;c.updateBoutiqueEntry(.1);c.player.z=shop.z;state.village.boutiques.built=[];c.updateBoutiqueEntry(2);assert.equal(opens.length,2);
});
test('shop entry cannot interrupt another menu, warehouse selection, or sleep',()=>{
 for(const reason of ['modal','warehouse','sleep']){const {c,state,opens}=fixture(),shop=BOUTIQUES[0];Object.assign(c.player,{x:shop.x,z:shop.z});if(reason==='modal')c.modal.open=true;if(reason==='warehouse')c.warehouseShelf.visible=true;if(reason==='sleep')state.journey.asleep=true;c.updateBoutiqueEntry(2);assert.equal(opens.length,0);}
});
test('the accessory entrance opens its own inventory with tools first',()=>{
 const {c,$}=fixture();vm.runInContext(extract('function openBoutiques(', 'function openSnails('),c);c.openBoutiques('style');const html=$('modalBody').innerHTML;assert.match(html,/<h2>Faden & Blüte<\/h2>/);assert.ok(html.indexOf('data-outdoor-buy="rod"')<html.indexOf('data-cosmetic="flower"'));assert.doesNotMatch(html,/data-cosmetic="lanterns"/);
});
