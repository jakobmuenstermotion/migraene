import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize,TOOLS} from './mondgarten/core.mjs';
import {WORKSHOPS} from './mondgarten/village-content.mjs';
import {HIVES} from './mondgarten/honey-content.mjs';
import {advanceProduction,productionSeconds,processingMultiplier,workshopQuote,depositWorkshopSupplies,takeWorkshopGoods,sellCarriedProducts,getBuildPads} from './mondgarten/village.mjs';
import {planSupply,takeSupply,supplySourceSpot} from './mondgarten/logistics.mjs';
import {prepareDay} from './mondgarten/daily.mjs';
import {outdoorToolPrice,buyOutdoorTool} from './mondgarten/outdoors.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const gift=WORKSHOPS.find(w=>w.id==='gifts');
test('every new saleable workshop product doubles the actual ingredient investment, with honest upgraded quotes',()=>{
 for(const w of WORKSHOPS){
  let s=freshState();s.village.house=3;s.village.workshops[w.id].level=1;const m=s.village.workshops[w.id];let total=0;
  Object.entries(w.inputs).forEach(([id,n],i)=>{m.inputs[id]=n;m.inputValues[id]=n*(7.5+i*2.25);total+=m.inputValues[id];});
  const quote=workshopQuote(s,w);assert.ok(quote.actual);near(quote.inputValue,total);near(quote.outputValue,total*(w.valueMultiplier??2));near(quote.profit,total*((w.valueMultiplier??2)-1));near(quote.seconds,w.seconds);
  s=normalize(JSON.parse(JSON.stringify(s)));advanceProduction(s,w.seconds);assert.equal(s.village.finished[w.product],1);near(s.village.finishedValues[w.product],total*(w.valueMultiplier??2));
  s.village.workshops[w.id].level=4;assert.ok(processingMultiplier(s,w)>=2);if(w.id==='gifts')assert.equal(productionSeconds(s,w),180);else assert.ok(productionSeconds(s,w)<w.seconds);
 }
});
test('gift minimum wait survives the fastest upgrades and adaptive workshop speed',()=>{
 const s=freshState();s.village.workshops.gifts.level=1000;s.feedback.active.workshop=.5;assert.equal(productionSeconds(s,gift),180);
});
test('gift recipes accept each actual honey type, consume local supplies, survive a running save and sell one gift exactly once',()=>{
 for(const hive of HIVES){
  let s=freshState();s.village.workshops.gifts.level=1;const cargo={items:{lavender:8,bouquet:1,[hive.honey]:1},values:{lavender:20,bouquet:30,[hive.honey]:40}};
  assert.equal(depositWorkshopSupplies(s,gift,cargo),10);advanceProduction(s,10);assert.equal(s.village.workshops.gifts.outputValue,450);
  s=normalize(JSON.parse(JSON.stringify(s)));advanceProduction(s,169);assert.equal(s.village.finished.giftbox??0,0);advanceProduction(s,1);assert.equal(s.village.finished.giftbox,1);assert.equal(s.village.finishedValues.giftbox,450);
  takeWorkshopGoods(s,'giftbox',1);assert.equal(sellCarriedProducts(s).value,450);assert.equal(sellCarriedProducts(s).value,0);
 }
});
test('stored honey is physically picked up at the warehouse for gifts, while uncollected hive honey stays put',()=>{
 const s=freshState();s.village.house=3;s.village.workshops.gifts.level=1;s.village.workshops.bouquet.level=1;
 s.village.workshops.gifts.inputs={lavender:16,bouquet:2};s.village.workshops.gifts.inputValues={lavender:20,bouquet:30};
 s.village.apiary.hives[0].built=true;s.village.apiary.hives[0].count=3;assert.equal(planSupply(s),null);
 s.village.finished.moonHoney=2;s.village.finishedValues.moonHoney=70;
 const job=planSupply(s);assert.equal(job.source,'honey');assert.equal(job.items.moonHoney,2);assert.equal(typeof supplySourceSpot(job).x,'number');
 takeSupply(s,job);assert.equal(s.village.finished.moonHoney,0);assert.equal(s.village.apiary.hives[0].count,3);
 depositWorkshopSupplies(s,gift,job);advanceProduction(s,180);assert.equal(s.village.finished.giftbox,1);
});
test('gift workshop is optional from round sixteen and existing running or stored goods keep their values',()=>{
 const s=freshState();s.journey.round=16;s.village.workshops.tea.level=1;
 const p=getBuildPads(s,TOOLS).find(p=>p.id==='workshop:gifts');assert.ok(p.visible&&p.optional&&!p.locked);
 assert.equal(prepareDay(s,TOOLS).items.some(p=>p.id==='workshop:gifts'),false);
 s.village.finished.tea=3;s.village.finishedValues.tea=33;Object.assign(s.village.workshops.tea,{running:true,progress:1,outputValue:17});
 const restored=normalize(JSON.parse(JSON.stringify(s)));assert.equal(restored.village.finishedValues.tea,33);assert.equal(restored.village.workshops.tea.outputValue,17);
});
test('detector remains locked behind the finished shop, costs a substantial current upgrade and preserves existing ownership',()=>{
 let s=freshState();s.journey.round=42;s.coins=1e10;const cost=outdoorToolPrice(s,'detector');assert.ok(cost>100000);
 assert.equal(buyOutdoorTool(s,'detector'),false);s.village.boutiques.built=['style'];const coins=s.coins;assert.ok(buyOutdoorTool(s,'detector'));near(s.coins,coins-cost);
 s=normalize(JSON.parse(JSON.stringify(s)));assert.equal(outdoorToolPrice(s,'detector'),cost);assert.equal(buyOutdoorTool(s,'detector'),false);
 const early=freshState();early.journey.round=12;assert.ok(outdoorToolPrice(early,'detector')>=10000);assert.equal(outdoorToolPrice(early,'rod'),2400);
});
