import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize,TOOLS} from './mondgarten/core.mjs';
import {VILLAGE} from './mondgarten/village-content.mjs';
import {getBuildPads,payBuild,takeHomeMaterials} from './mondgarten/village.mjs';
import {prepareDay} from './mondgarten/daily.mjs';
import {advanceOutdoors,equipOutdoorTool,sellOutdoorGoods,SCRAP_PITY} from './mondgarten/outdoors.mjs';
const pad=s=>getBuildPads(s,TOOLS).find(p=>p.id==='partner');
function ready(){const s=freshState();s.journey.round=20;s.village.workshops.tea.level=1;s.coins=1e9;return s;}
function stock(s){for(const [id,n]of Object.entries(VILLAGE.partner.materials[s.village.house])){s.village.finished[id]=n;s.village.finishedValues[id]=n*30;}}
test('home stages open exactly on days 20, 25 and 30, cost real materials and only the finished roof brings Schnecki',()=>{
 let s=ready();
 for(const [stage,round]of [20,25,30].entries()){
  s.journey.round=round-1;stock(s);s.outdoors.scrap=6;
  assert.equal(pad(s).locked,true);assert.equal(payBuild(s,pad(s),10).complete,false);
  s.journey.round=round;const p=pad(s);assert.equal(p.locked,false);assert.equal(p.requiredRound,round);
  assert.ok(payBuild(s,p,10).complete);assert.equal(s.village.house,stage+1);assert.equal(s.village.partner,stage===2);
  for(const id of Object.keys(VILLAGE.partner.materials[stage])){assert.equal(s.village.finished[id],0);assert.equal(s.village.finishedValues[id],0);}
  assert.equal(s.outdoors.scrap,stage===2?0:6);s=normalize(JSON.parse(JSON.stringify(s)));
 }
 assert.equal(pad(s).max,true);
});
test('missing scrap cannot charge for or consume the roof; partial payments and stocks survive reload',()=>{
 let s=ready();s.journey.round=30;s.village.house=2;stock(s);s.outdoors.scrap=5;
 const before=structuredClone(s);assert.equal(pad(s).locked,true);assert.match(pad(s).description,/6 Schrottteile/);
 assert.equal(payBuild(s,pad(s),10).complete,false);assert.equal(takeHomeMaterials(s),false);assert.deepEqual(s,before);
 s.outdoors.scrap=7;const p=pad(s);assert.equal(payBuild(s,p,.5).complete,false);
 const partial=s.village.payments.partner;assert.ok(partial>0);assert.equal(s.village.finished.oil,15);assert.equal(s.outdoors.scrap,7);
 s=normalize(JSON.parse(JSON.stringify(s)));assert.equal(s.village.payments.partner,partial);
 assert.ok(payBuild(s,pad(s),10).complete);assert.equal(s.outdoors.scrap,1);assert.equal(s.village.partner,true);
 assert.equal(payBuild(s,p,10).complete,false);assert.equal(s.outdoors.scrap,1);
});
test('all home stages remain separate collecting goals and old completed houses remain completed',()=>{
 for(const [stage,round]of [20,25,30].entries()){
  const s=ready();s.journey.round=round;s.village.house=stage;const plan=prepareDay(s,TOOLS);
  assert.equal(pad(s).optional,true);assert.equal(plan.items.some(p=>p.id==='partner'),false);assert.equal(plan.materials.length,0);
 }
 const old=ready();old.village.house=3;old.village.partner=true;delete old.outdoors.scrap;delete old.outdoors.scrapMisses;
 const loaded=normalize(JSON.parse(JSON.stringify(old)));assert.equal(loaded.village.partner,true);assert.equal(pad(loaded).max,true);assert.equal(loaded.outdoors.scrap,0);
});
test('scrap is occasionally added to genuine detector finds, guaranteed by the fourth, retained across reload and never sold',()=>{
 let s=ready();s.outdoors.owned=['detector'];equipOutdoorTool(s,'detector');
 for(let i=0;i<SCRAP_PITY;i++){
  s.outdoors.site={id:'treasure',x:4,z:0,value:80};
  const event=advanceOutdoors(s,[],{x:4,z:0,moving:false},2,0,0,()=>1,()=>.99)[0];
  assert.equal(event.kind,'treasure');assert.equal(event.scrap,i===SCRAP_PITY-1?1:0);
  s=normalize(JSON.parse(JSON.stringify(s)));
 }
 assert.equal(s.outdoors.scrap,1);assert.equal(s.outdoors.scrapMisses,0);
 assert.equal(sellOutdoorGoods(s).value,80*SCRAP_PITY);assert.equal(s.outdoors.scrap,1);assert.equal(sellOutdoorGoods(s).value,0);
 s.outdoors.site={id:'treasure',x:4,z:0,value:10};assert.equal(advanceOutdoors(s,[],{x:4,z:0,moving:true},5).length,0);
 s.journey.asleep=true;assert.equal(advanceOutdoors(s,[],{x:4,z:0},5).length,0);assert.equal(s.outdoors.scrap,1);
});
test('new scrap counters normalize malformed data without affecting tools or other finds',()=>{
 const s=ready();s.outdoors.scrap=-1;s.outdoors.scrapMisses=NaN;
 let loaded=normalize(s);assert.equal(loaded.outdoors.scrap,0);assert.equal(loaded.outdoors.scrapMisses,0);
 s.outdoors.scrap=8.7;s.outdoors.scrapMisses=999;loaded=normalize(s);assert.equal(loaded.outdoors.scrap,8);assert.equal(loaded.outdoors.scrapMisses,SCRAP_PITY-1);
});

test('older day quotes refresh home recipes without changing paid budgets, and helpers preserve the optional roof reserve',async()=>{
 const {availableProducts}=await import('./mondgarten/village.mjs');
 const {planSupply}=await import('./mondgarten/logistics.mjs');
 const s=ready();prepareDay(s,TOOLS);const target=s.journey.plan.target;
 s.journey.plan.materials=[{level:0,items:{bouquet:4}},{level:2,items:{oil:3}}];
 s.journey.plan.spent=123;prepareDay(s,TOOLS);assert.equal(s.journey.plan.target,target);assert.equal(s.journey.plan.spent,123);
 assert.deepEqual(s.journey.plan.materials,[]);
 s.village.house=2;s.journey.round=30;s.journey.plan=null;prepareDay(s,TOOLS);
 s.village.finished.oil=15;s.village.finishedValues.oil=450;s.village.workshops.elixir.level=1;
 assert.equal(availableProducts(s,'oil',true),0);
 assert.equal(planSupply(s)?.items?.oil,undefined);
});
