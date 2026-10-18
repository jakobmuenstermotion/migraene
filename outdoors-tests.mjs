import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {createVillageField,harvestAt} from './mondgarten/harvest.mjs';
import {GardenAutomation} from './mondgarten/automation.mjs';
import {bedYield,getBuildPads,payBuild} from './mondgarten/village.mjs';
import {prepareDay} from './mondgarten/daily.mjs';
import {TOOLS} from './mondgarten/core.mjs';
import {BURIED_SHELLS,OUTDOOR_TOOLS,LAKE,buyOutdoorTool,equipOutdoorTool,advanceOutdoors,detectorTarget,sellOutdoorGoods,startCompost,sprayFertilizer,fertilized,fertilizerValue,startFishing,advanceFishing,setHarvestMode,collectFertilizer,COMPOST_WORKSHOP} from './mondgarten/outdoors.mjs';
function ready(){const s=freshState();s.journey.round=25;s.village.boutiques.built=['style'];s.outdoors.owned=OUTDOOR_TOOLS.map(t=>t.id);s.outdoors.composterBuilt=true;return s;}
test('tools are purchased only once in the built accessories store and persist separately from clothing',()=>{
 const s=freshState();s.coins=10000;assert.equal(buyOutdoorTool(s,'detector'),false);s.village.boutiques.built=['style'];assert.equal(buyOutdoorTool(s,'detector'),true);assert.equal(s.coins,0);assert.equal(buyOutdoorTool(s,'detector'),false);assert.equal(equipOutdoorTool(s,'rod'),false);assert.equal(equipOutdoorTool(s,'detector'),true);
 const loaded=normalize(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded.outdoors.owned,['detector']);assert.equal(loaded.outdoors.equipped,'detector');assert.deepEqual(loaded.village.boutiques.owned,[]);
 const old=structuredClone(s);delete old.outdoors;assert.deepEqual(normalize(old).outdoors.owned,[]);
});
test('each fixed buried shell is collectible once, survives reload, and never replaces a shell at full inventory',()=>{
 let s=ready();s.village.farm.built=true;equipOutdoorTool(s,'detector');
 for(const spot of BURIED_SHELLS){const p={x:spot.x,z:spot.z,moving:false};assert.equal(detectorTarget(s,p).id,spot.id);assert.equal(advanceOutdoors(s,[],p,1).length,0);assert.equal(advanceOutdoors(s,[],p,1)[0].kind,'buriedShell');assert.equal(s.village.farm.shells[spot.species],1);s=normalize(JSON.parse(JSON.stringify(s)));assert.equal(advanceOutdoors(s,[],p,2).length,0);}
 assert.equal(s.outdoors.dug.length,2);
 const full=ready();full.village.farm.built=true;full.village.farm.shells.garden=30;equipOutdoorTool(full,'detector');assert.equal(advanceOutdoors(full,[],BURIED_SHELLS[0],5).length,0);assert.deepEqual(full.outdoors.dug,[]);
});
test('detector requires standing at a find; its carried value survives reload and is sold exactly once',()=>{
 let s=ready();equipOutdoorTool(s,'detector');s.outdoors.findWait=0;const cells=createVillageField(s),c=cells[0];
 advanceOutdoors(s,cells,{...c,moving:true},.1,0,0,()=>10,()=>0);assert.ok(s.outdoors.site);assert.equal(s.outdoors.dig,0);
 const site={...s.outdoors.site,moving:false};advanceOutdoors(s,cells,site,1,0,0,()=>10,()=>0);advanceOutdoors(s,cells,{...site,moving:true},.1);assert.equal(s.outdoors.dig,0);
 assert.equal(advanceOutdoors(s,cells,site,2)[0].kind,'treasure');assert.equal(s.coins,0);s=normalize(JSON.parse(JSON.stringify(s)));assert.equal(sellOutdoorGoods(s).value,80);assert.equal(sellOutdoorGoods(s).value,0);assert.equal(s.coins,80);
});
test('compost consumes only the chosen recipe, cannot double start, pauses and delivers three saved portions',()=>{
 let s=ready();s.village.raw={moonbloom:12,lavender:3};s.village.rawValues={moonbloom:120,lavender:60};assert.equal(startCompost(s,'invalid'),false);assert.equal(startCompost(s),true);assert.equal(startCompost(s),false);assert.equal(s.village.raw.moonbloom,0);assert.equal(s.village.rawValues.moonbloom,0);assert.equal(s.village.raw.lavender,3);
 advanceOutdoors(s,[],{x:0,z:0},30);s=normalize(JSON.parse(JSON.stringify(s)));s.journey.asleep=true;advanceOutdoors(s,[],{},100);assert.equal(s.outdoors.compost.remaining,30);s.journey.asleep=false;assert.equal(advanceOutdoors(s,[],{},30)[0].kind,'compost');assert.equal(s.outdoors.fertilizer,0);assert.equal(s.outdoors.compost.ready,3);assert.equal(collectFertilizer(s,{x:0,z:0}),0);assert.equal(collectFertilizer(s,COMPOST_WORKSHOP.output),3);assert.equal(s.outdoors.fertilizer,3);assert.equal(advanceOutdoors(s,[],{},60).length,0);
 s.outdoors.fish={silver:2};s.outdoors.fishValues={silver:24};assert.equal(startCompost(s,'fish'),true);assert.equal(s.outdoors.fish.silver,0);assert.equal(s.outdoors.fishValues.silver,0);
});
test('fertilizer affects only the sprayed flower patch, adds 20 percent value without extra units and does not stack',()=>{
 const baseline=ready(),s=structuredClone(baseline),cells=createVillageField(s),c=cells[0];for(const p of cells)p.rare=false;const plain=createVillageField(baseline);for(const p of plain)p.rare=false;
 s.outdoors.fertilizer=3;setHarvestMode(s,'fertilizer');assert.equal(sprayFertilizer(s,cells,{x:0,z:30}),false);assert.equal(s.outdoors.fertilizer,3);assert.equal(sprayFertilizer(s,cells,c),true);assert.equal(sprayFertilizer(s,cells,c),true);assert.equal(fertilizerValue(s,c),1.2);assert.equal(fertilized(s,{...c,x:c.x+20}),false);
 setHarvestMode(s,'scythe');const a=harvestAt(s,cells,c.x,c.z,0),b=harvestAt(baseline,plain,c.x,c.z,0);assert.equal(s.bag,baseline.bag);assert.ok(Math.abs(s.bagValue-baseline.bagValue*1.2)<1e-8);assert.equal(a.length,b.length);
 const saved=normalize(JSON.parse(JSON.stringify(s)));assert.equal(fertilized(saved,c),true);advanceOutdoors(s,cells,c,180,0,0);assert.equal(fertilized(s,c),false);assert.equal(fertilizerValue(s,c),1);
});
test('fertilizer doubles only active regrowth and expiry is prorated without stacking or changing existing cargo',()=>{
 const s=ready(),cells=createVillageField(s),c=cells[0];s.outdoors.fertilizer=2;setHarvestMode(s,'fertilizer');sprayFertilizer(s,cells,c);sprayFertilizer(s,cells,c);c.cutAt=0;c.readyAt=40;s.bagValue=123;
 advanceOutdoors(s,cells,c,5,5,5);assert.equal(c.readyAt,35);assert.equal(s.bagValue,123);
 s.outdoors.patches.forEach(p=>p.until=s.outdoors.clock+1);advanceOutdoors(s,cells,c,2,2,7);assert.equal(c.readyAt,34);assert.equal(s.outdoors.patches.length,0);
 advanceOutdoors(s,cells,c,10,0,7);assert.equal(c.readyAt,34);
});
test('helper harvest receives the same 20 percent fertilizer premium',()=>{
 const run=boost=>{const s=ready();s.village.snails=1;s.village.snailProfiles=[{task:'warehouse',field:0}];const cells=createVillageField(s);for(const c of cells)c.rare=false;const c=cells[0],a=new GardenAutomation(s),n=a.snails[0];n.x=c.x;n.z=c.z;
  if(boost){s.outdoors.fertilizer=1;setHarvestMode(s,'fertilizer');sprayFertilizer(s,cells,c);}for(let i=0;i<20&&!n.bag;i++)a.update(s,cells,null,.1,0);assert.equal(n.bag,1);return n.values.moonbloom;};assert.ok(Math.abs(run(true)-1.2*run(false))<1e-8);
});
test('fishing requires a rod and the shore, cannot duplicate a cast, catches through the minigame and preserves fish values',()=>{
 let s=ready();assert.equal(startFishing(s,LAKE.shore),false);equipOutdoorTool(s,'rod');assert.equal(startFishing(s,{x:0,z:0}),false);assert.equal(startFishing(s,LAKE.shore,2,()=>0),true);assert.equal(startFishing(s,LAKE.shore),false);
 advanceFishing(s,2,false,()=>0);let event=null;for(let i=0;i<400&&!event;i++){const f=s.outdoors.fishing;event=advanceFishing(s,.05,f.marker<f.target,()=>0);}assert.equal(event.kind,'fish');assert.equal(s.outdoors.fish.silver,1);assert.equal(s.outdoors.fishValues.silver,24);s=normalize(JSON.parse(JSON.stringify(s)));assert.equal(s.outdoors.fishing,null);assert.equal(sellOutdoorGoods(s).value,24);assert.equal(sellOutdoorGoods(s).value,0);
 startFishing(s,LAKE.shore,1,()=>0);advanceFishing(s,2);for(let i=0;i<400&&s.outdoors.fishing;i++)advanceFishing(s,.05,false);assert.equal(s.outdoors.fish.silver,0);
});

test('fertilizer is built as an optional workshop from day 12 without an accessories shop or additional daily goals',()=>{
 const s=freshState();s.journey.round=11;s.coins=2500;let p=getBuildPads(s).find(p=>p.id==='composter');assert.equal(p.visible,false);assert.equal(payBuild(s,p,5).complete,false);
 s.journey.round=12;p=getBuildPads(s).find(p=>p.id==='composter');assert.equal(p.optional,true);assert.equal(p.cost,2000);assert.equal(p.locked,false);const before=structuredClone(s);assert.equal(payBuild(s,p,5).complete,true);assert.equal(s.outdoors.composterBuilt,true);assert.equal(s.coins,500);assert.deepEqual(s.village.boutiques.built,[]);assert.equal(payBuild(s,p,5).complete,false);
 assert.equal(normalize(JSON.parse(JSON.stringify(s))).outdoors.composterBuilt,true);assert.equal(prepareDay(s,TOOLS).target,prepareDay(before,TOOLS).target);
 assert.equal(OUTDOOR_TOOLS.some(t=>t.id==='sprayer'),false);assert.equal(buyOutdoorTool(s,'sprayer'),false);
});
test('scythe and fertilizing are mutually exclusive; empty fertilizer returns to normal harvesting',()=>{
 const s=ready(),cells=createVillageField(s),c=cells[0];assert.equal(setHarvestMode(s,'fertilizer'),false);s.outdoors.fertilizer=2;equipOutdoorTool(s,'detector');assert.equal(setHarvestMode(s,'fertilizer'),true);assert.equal(s.outdoors.equipped,null);
 const bag=s.bag;assert.deepEqual(harvestAt(s,cells,c.x,c.z,0),[]);assert.equal(s.bag,bag);assert.equal(c.readyAt,0);assert.equal(sprayFertilizer(s,cells,c),true);assert.equal(s.outdoors.harvestMode,'fertilizer');assert.equal(sprayFertilizer(s,cells,c),true);assert.equal(s.outdoors.fertilizer,0);assert.equal(s.outdoors.harvestMode,'scythe');assert.ok(harvestAt(s,cells,c.x,c.z,0).length>0);
 s.outdoors.fertilizer=1;setHarvestMode(s,'fertilizer');equipOutdoorTool(s,'rod');assert.equal(s.outdoors.harvestMode,'scythe');assert.equal(sprayFertilizer(s,cells,c),false);
});
test('old sprayer purchases migrate to a built workshop, preserving fertilizer and production without another payment',()=>{
 const s=ready();s.coins=1234;delete s.outdoors.composterBuilt;s.outdoors.owned.push('sprayer');s.outdoors.equipped='sprayer';s.outdoors.fertilizer=2;s.outdoors.compost={remaining:20,portions:3};
 const loaded=normalize(JSON.parse(JSON.stringify(s)));assert.equal(loaded.outdoors.composterBuilt,true);assert.equal(loaded.outdoors.owned.includes('sprayer'),false);assert.equal(loaded.outdoors.harvestMode,'fertilizer');assert.equal(loaded.outdoors.equipped,null);assert.equal(loaded.outdoors.fertilizer,2);assert.equal(loaded.coins,1234);
 advanceOutdoors(loaded,[],{},20);assert.equal(loaded.outdoors.compost.ready,3);assert.equal(loaded.outdoors.fertilizer,2);assert.equal(collectFertilizer(loaded,COMPOST_WORKSHOP.output),3);assert.equal(loaded.outdoors.fertilizer,5);
});
test('workshop output waits at the building and respects both storage and carried limits',()=>{
 const s=ready();s.outdoors.compost.ready=24;s.village.raw.moonbloom=12;s.village.rawValues.moonbloom=12;assert.equal(startCompost(s),false);assert.equal(s.village.raw.moonbloom,12);
 s.outdoors.compost.ready=3;s.outdoors.fertilizer=98;assert.equal(collectFertilizer(s,{x:0,z:0}),0);assert.equal(collectFertilizer(s,COMPOST_WORKSHOP.output),1);assert.equal(s.outdoors.fertilizer,99);assert.equal(s.outdoors.compost.ready,2);assert.equal(collectFertilizer(s,COMPOST_WORKSHOP.output),0);
 const loaded=normalize(JSON.parse(JSON.stringify(s)));assert.equal(loaded.outdoors.compost.ready,2);assert.equal(loaded.outdoors.fertilizer,99);
});
