import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {createVillageField} from './mondgarten/harvest.mjs';
import {BUTTERFLIES,recordManualHarvest,recordHarvestFlow} from './mondgarten/harvest-moments.mjs';
import {FISH,FISH_MOTIONS,FINDS,LAKE,startFishing,advanceFishing,advanceOutdoors,equipOutdoorTool,sellOutdoorGoods} from './mondgarten/outdoors.mjs';
test('rare butterfly intervals remain long, but repeated duplicates eventually yield a missing species without duplicating the wings',()=>{
 let s=freshState();const cell=createVillageField(s)[0];let rewards=0;
 for(let i=0;i<13;i++){
  s.harvestMoments.butterflyWait=0;s.harvestMoments.flowerPicks=119;
  const event=recordManualHarvest(s,[{cell,units:1,value:5}],()=>0)[0];assert.equal(event.kind,'butterfly');assert.equal(s.harvestMoments.butterflyWait,600);if(event.reward)rewards++;
  s=normalize(JSON.parse(JSON.stringify(s)));
 }
 assert.equal(s.harvestMoments.found.length,5);assert.equal(rewards,1);
 s.harvestMoments.butterflyWait=0;s.harvestMoments.flowerPicks=119;assert.equal(recordManualHarvest(s,[{cell,units:1,value:5}],()=>0)[0].reward,false);
});
test('connected harvest runs create feedback milestones, reset on a break and never mint money or bonus cargo',()=>{
 const s=freshState();let events=0;
 for(let i=0;i<30;i++)if(recordHarvestFlow(s,[{cell:{crop:'lavender',x:i*.1,z:0},units:1}],i*.1))events++;
 assert.equal(events,3);assert.equal(s.coins,0);assert.equal(s.bag,0);
 assert.equal(recordHarvestFlow(s,[{cell:{crop:'lavender',x:3,z:0},units:1}],10),null);assert.equal(s.harvestMoments.flow.count,1);
 assert.equal(recordHarvestFlow(s,[{cell:{crop:'coral',x:3,z:0},units:1}],10.1),null);assert.equal(s.harvestMoments.flow.count,1);
});
test('all four fish have different movement patterns, can be caught through the real controls and remain in the collection after sale',()=>{
 const patterns=[];
 for(const [i,fish]of FISH.entries()){
  let s=freshState();s.outdoors.owned=['rod'];equipOutdoorTool(s,'rod');assert.ok(startFishing(s,LAKE.shore,1,()=>i/4+.01));advanceFishing(s,5);
  assert.equal(s.outdoors.fishing.fishId,fish.id);const points=[];let event=null;
  for(let n=0;n<400&&!event;n++){const f=s.outdoors.fishing;event=advanceFishing(s,.05,f.marker<f.target);if(n<20)points.push(Math.round(f.target*10000));}
  patterns.push(points.join(','));assert.equal(event?.fish?.id,fish.id);assert.equal(s.outdoors.fish[fish.id],1);assert.equal(s.outdoors.fishValues[fish.id],fish.value);
  sellOutdoorGoods(s);s=normalize(JSON.parse(JSON.stringify(s)));assert.ok(s.outdoors.fishFound.includes(fish.id));assert.equal(s.outdoors.fish[fish.id],0);assert.ok(FISH_MOTIONS[fish.id].hint.length>0);
 }
 assert.equal(new Set(patterns).size,4);
});
test('detector site identity survives saving, all find types enter the book and the old monetary reward stays unchanged',()=>{
 let s=freshState();s.outdoors.owned=['detector'];equipOutdoorTool(s,'detector');const cell=createVillageField(s)[0];
 for(const [i,find]of FINDS.entries()){
  s.outdoors.findWait=0;let n=0;advanceOutdoors(s,[cell],{...cell,moving:true},.1,0,0,()=>3,()=>n++===0?0:i/FINDS.length+.01);
  assert.equal(s.outdoors.site.findKind,find.id);s=normalize(JSON.parse(JSON.stringify(s)));const event=advanceOutdoors(s,[],{...s.outdoors.site,moving:false},2,0,0,()=>3,()=>.99)[0];assert.equal(event.find.id,find.id);assert.ok(s.outdoors.findsFound.includes(find.id));
 }
 assert.equal(sellOutdoorGoods(s).value,96);assert.equal(sellOutdoorGoods(s).value,0);assert.equal(s.outdoors.findsFound.length,4);
});
