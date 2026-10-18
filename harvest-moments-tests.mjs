import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {createVillageField,harvestAt} from './mondgarten/harvest.mjs';
import {GardenAutomation} from './mondgarten/automation.mjs';
import {BUTTERFLIES,advanceHarvestMoments,recordManualHarvest,equipButterflyWings,normalizeHarvestMoments} from './mondgarten/harvest-moments.mjs';
const pick=(cell,value=10)=>({cell,units:1,value});
test('glow lasts six active seconds, pays once without changing crop cargo and pauses with the game',()=>{
 const s=freshState(),cells=createVillageField(s),m=s.harvestMoments;m.glowWait=0;
 const c=advanceHarvestMoments(s,cells,{x:4,z:0},.1,0,()=>0);assert.ok(c);
 advanceHarvestMoments(s,cells,{x:4,z:0},0,0);assert.equal(m.glow.remaining,6);
 const picks=harvestAt(s,cells,c.x,c.z,0);const bag=s.bag,value=s.bagValue;
 assert.equal(recordManualHarvest(s,picks).filter(e=>e.kind==='glow').length,1);
 assert.equal(s.coins,picks.find(p=>p.cell===c).value*19);assert.equal(s.bag,bag);assert.equal(s.bagValue,value);
 assert.equal(recordManualHarvest(s,picks).length,0);
 m.glow={key:c.key,remaining:1};advanceHarvestMoments(s,cells,{x:4,z:0},1.1,0);assert.equal(m.glow,null);
 const coins=s.coins;recordManualHarvest(s,[pick(c)]);assert.equal(s.coins,coins);
});
test('butterflies need active time and manual flower harvest, duplicates never duplicate the reward',()=>{
 const s=freshState(),c=createVillageField(s)[0],m=s.harvestMoments;
 assert.deepEqual(recordManualHarvest(s,[pick(c)]),[]);
 m.butterflyWait=0;m.flowerPicks=119;
 let events=recordManualHarvest(s,[pick(c)],()=>0);assert.equal(events[0].isNew,true);assert.equal(m.butterflyWait,600);
 m.butterflyWait=0;m.flowerPicks=119;events=recordManualHarvest(s,[pick(c)],()=>0);assert.equal(events[0].isNew,false);assert.equal(m.found.length,1);
 for(let i=1;i<5;i++){m.butterflyWait=0;m.flowerPicks=119;events=recordManualHarvest(s,[pick(c)],()=>i/5+.01);assert.equal(events[0].reward,i===4);}
 assert.equal(m.wingsUnlocked,true);m.butterflyWait=0;m.flowerPicks=119;assert.equal(recordManualHarvest(s,[pick(c)],()=>0)[0].reward,false);
 m.butterflyWait=0;m.flowerPicks=119;assert.deepEqual(recordManualHarvest(s,[pick({...c,crop:'crystal'})]),[]);
});
test('one wing pair transfers between helpers, persists and rejects incomplete or malformed collections',()=>{
 const s=freshState();s.village.snails=2;assert.equal(equipButterflyWings(s,0),false);
 s.harvestMoments.found=BUTTERFLIES.map(b=>b.id);s.harvestMoments.wingsUnlocked=true;
 assert.equal(equipButterflyWings(s,0),true);assert.equal(equipButterflyWings(s,1),true);assert.equal(s.harvestMoments.wearer,1);
 assert.equal(equipButterflyWings(s,2),false);
 const loaded=normalize(JSON.parse(JSON.stringify(s)));assert.equal(loaded.harvestMoments.wearer,1);assert.equal(loaded.harvestMoments.wingsUnlocked,true);
 assert.equal(normalizeHarvestMoments({found:['moon','moon','unknown'],wingsUnlocked:true,wearer:0},2).wingsUnlocked,false);
 assert.equal(normalizeHarvestMoments({...s.harvestMoments,wearer:8},2).wearer,null);
 const old=JSON.parse(JSON.stringify(s));delete old.harvestMoments;assert.equal(normalize(old).harvestMoments.wingsUnlocked,false);
});
test('equipped helper travels exactly twice as far, including at the normal speed cap; sleep still stops work',()=>{
 for(const level of [0,10]){
  const distance=flying=>{const s=freshState();s.village.snails=1;s.village.snailLevel=level;s.harvestMoments.found=BUTTERFLIES.map(b=>b.id);s.harvestMoments.wingsUnlocked=true;if(flying)equipButterflyWings(s,0);
   const a=new GardenAutomation(s),n=a.snails[0];n.x=0;n.z=0;n.mode='deliver';n.items={moonbloom:2};n.values={moonbloom:2};n.task='sell';s.village.snailProfiles=[{task:'sell'}];
   a.update(s,createVillageField(s),null,.1,0);const d=Math.hypot(n.x,n.z);
   s.journey.asleep=true;const x=n.x,z=n.z;a.update(s,[],null,.1,0);assert.equal(n.x,x);assert.equal(n.z,z);return d;};
  assert.ok(Math.abs(distance(true)-2*distance(false))<1e-8);
 }
});
