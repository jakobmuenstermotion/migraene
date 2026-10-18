import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize, capacity, TOOLS } from "./mondgarten/core.mjs";
import { prepareDay } from "./mondgarten/daily.mjs";
import {
  createVillageField,
  harvestAt,
  unload,
} from "./mondgarten/harvest.mjs";
import { completeBuild, bedYield } from "./mondgarten/village.mjs";
import { ECONOMY } from "./mondgarten/economy.mjs";

function daySeven(bag = 3) {
  const s = freshState();
  s.journey.round = 7;
  s.journey.goalCost = null;
  s.tools = { reach: 2, bag, speed: 2, value: 2 };
  s.village.beds[0] = 3;
  s.village.workshops.bouquet.level = 1;
  return s;
}
function sellFullBag(s, rare = false) {
  const cells = createVillageField(s).map((c) => ({ ...c, rare }));
  for (const c of cells) {
    harvestAt(s, cells, c.x, c.z, s.journey.growthTime);
    if (s.bag === capacity(s)) break;
  }
  assert.equal(s.bag, capacity(s));
  const value = s.bagValue,
    coins = s.coins;
  assert.equal(unload(s, Infinity).value, value);
  assert.equal(s.coins, coins + value);
  assert.equal(s.bag, 0);
  return value;
}

test("day seven: a 272-unit raw backpack pays about 1500 instead of the reproduced 11400", () => {
  const s = daySeven(),
    plan = prepareDay(s, TOOLS);
  const value = sellFullBag(s);
  assert.ok(value > 1450 && value < 1600, `unexpected full bag: ${value}`);
  assert.ok(
    value / plan.target < 0.2,
    "one ordinary backpack must not buy the day",
  );
  assert.equal(s.journey.closed, false);
});

test("smaller bags, rare crops and a mid-day value upgrade cannot recreate the day-seven windfall", () => {
  for (const bag of [1, 2, 3])
    for (const rare of [false, true]) {
      const s = daySeven(bag),
        plan = prepareDay(s, TOOLS);
      assert.ok(sellFullBag(s, rare) / plan.target < 0.32);
      // A normal increase in crop value still benefits this day, including after reload.
      const boost = plan.boost,
        before = bedYield(s, 0);
      completeBuild(s, "tool:value");
      assert.ok(bedYield(s, 0) > before);
      const loaded = normalize(JSON.parse(JSON.stringify(s)));
      prepareDay(loaded, TOOLS);
      assert.equal(loaded.journey.plan.boost, boost);
      assert.ok(sellFullBag(loaded, rare) / plan.target < 0.36);
    }
});

test("existing inflated plans migrate once, preserving budget, spending, saved coins, goods and instalments", () => {
  for (const version of [5, 6])
    for (const closed of [false, true]) {
      const s = daySeven();
      const plan = prepareDay(s, TOOLS),
        correctedBoost = plan.boost;
      plan.balanceVersion = version;
      plan.boost = 9.8839;
      plan.spent = 77;
      s.journey.closed = closed;
      s.coins = 12345;
      s.bag = 12;
      s.bagValue = 500;
      s.cargo = { moonbloom: { count: 12, value: 500 } };
      s.village.raw = { moonbloom: 10 };
      s.village.rawValues = { moonbloom: 250 };
      s.village.finished = { bouquet: 2 };
      s.village.finishedValues = { bouquet: 900 };
      s.village.payments = { "bed:0": 333 };
      const before = structuredClone(s);
      let restored = normalize(JSON.parse(JSON.stringify(s)));
      prepareDay(restored, TOOLS);
      assert.ok(Math.abs(restored.journey.plan.boost - correctedBoost) < 1e-12);
      assert.equal(restored.journey.plan.balanceVersion, ECONOMY.version);
      assert.equal(restored.journey.plan.target, before.journey.plan.target);
      assert.equal(restored.journey.plan.spent, 77);
      assert.deepEqual(restored.journey.plan.items, before.journey.plan.items);
      assert.equal(restored.coins, 12345);
      assert.equal(restored.bagValue, 500);
      assert.deepEqual(restored.cargo, before.cargo);
      assert.deepEqual(restored.village.rawValues, before.village.rawValues);
      assert.deepEqual(
        restored.village.finishedValues,
        before.village.finishedValues,
      );
      assert.deepEqual(restored.village.payments, before.village.payments);
      assert.equal(restored.journey.closed, closed);
      restored = normalize(JSON.parse(JSON.stringify(restored)));
      prepareDay(restored, TOOLS);
      assert.ok(Math.abs(restored.journey.plan.boost - correctedBoost) < 1e-12);
    }
});

test("income quotes ignore the wallet and normalize valuable owned crops without a one-times minimum", () => {
  const poor = daySeven(),
    rich = daySeven();
  rich.coins = 1e9;
  assert.deepEqual(prepareDay(poor, TOOLS), prepareDay(rich, TOOLS));
  const veteran = daySeven();
  veteran.totalStars = 100000;
  prepareDay(veteran, TOOLS);
  assert.ok(veteran.journey.plan.boost > 0 && veteran.journey.plan.boost < 1);
  const loaded = normalize(JSON.parse(JSON.stringify(veteran)));
  prepareDay(loaded, TOOLS);
  assert.equal(loaded.journey.plan.boost, veteran.journey.plan.boost);
  assert.ok(sellFullBag(loaded) < 1600);
});

test("new harvest remains open after repeated sales and after buying the daily reward", () => {
  const s = daySeven(),
    plan = prepareDay(s, TOOLS);
  for (let i = 0; i < 12; i++) sellFullBag(s);
  assert.ok(s.coins > plan.target);
  assert.equal(completeBuild(s, "endDay").structural, true);
  const before = s.coins;
  assert.ok(sellFullBag(s) > 0);
  assert.ok(s.coins > before);
});

test('manual and helper harvests have the same 25 percent unit bonus across crops and fertilizer', async () => {
  const {GardenAutomation}=await import('./mondgarten/automation.mjs');
  const {setHarvestMode,sprayFertilizer}=await import('./mondgarten/outdoors.mjs');
  const {BEDS,VILLAGE}=await import('./mondgarten/village-content.mjs');
  for(const index of BEDS.keys())for(const fertilized of index===0?[false,true]:[false]){
    const manual=freshState();manual.journey.round=70;manual.village.snails=1;manual.village.beds[index]=1;manual.village.snailProfiles=[{task:'warehouse',field:index}];
    const cells=createVillageField(manual).filter(c=>c.bed===index);for(const c of cells)c.rare=false;const cell=cells[0];
    if(fertilized){manual.outdoors.fertilizer=1;setHarvestMode(manual,'fertilizer');assert.equal(sprayFertilizer(manual,cells,cell),true);}
    const helper=structuredClone(manual),helperCells=structuredClone(cells),automation=new GardenAutomation(helper),snail=automation.snails[0];snail.x=cell.x;snail.z=cell.z;
    for(let i=0;i<60&&!manual.bag;i++)harvestAt(manual,[cell],cell.x,cell.z,0,1,{moving:false,dt:.5});
    for(let i=0;i<100&&!snail.bag;i++)automation.update(helper,helperCells,null,.1,0);
    assert.ok(manual.bag>0);assert.ok(snail.bag>0);
    const expected=bedYield(manual,index)*VILLAGE.manualBonus*(fertilized?1.2:1);
    assert.ok(Math.abs(manual.bagValue/manual.bag-expected)<1e-8);
    assert.ok(Math.abs(snail.values[cell.crop]/snail.items[cell.crop]-expected)<1e-8);
  }
});

test('bouquets take 15 base seconds and sell for double their real input value, with matching estimates', async () => {
  const {WORKSHOPS}=await import('./mondgarten/village-content.mjs');
  const {deliverWorkshop,advanceProduction,takeWorkshopGoods,sellCarriedProducts,productValue,productionSeconds,processingMultiplier}=await import('./mondgarten/village.mjs');
  const w=WORKSHOPS.find(w=>w.id==='bouquet'),s=freshState();s.village.workshops.bouquet.level=1;
  const cells=createVillageField(s).slice(0,6);for(const c of cells){c.rare=false;harvestAt(s,[c],c.x,c.z,0);}const rawValue=s.bagValue;
  assert.equal(productionSeconds(s,w),15);assert.ok(Math.abs(productValue(s,w)-rawValue*2)<1e-8);
  deliverWorkshop(s,w);advanceProduction(s,14.99);assert.equal(s.village.finished.bouquet??0,0);
  const loaded=normalize(JSON.parse(JSON.stringify(s)));advanceProduction(loaded,.01);assert.equal(loaded.village.finished.bouquet,1);takeWorkshopGoods(loaded,'bouquet',1);assert.ok(Math.abs(sellCarriedProducts(loaded).value-rawValue*2)<1e-8);
  for(const other of WORKSHOPS.filter(x=>x!==w)){s.village.workshops[other.id].level=1;assert.equal(processingMultiplier(s,other),other.valueMultiplier??2);}
  s.village.workshops.bouquet.level=7;assert.ok(processingMultiplier(s,w)>2);assert.ok(productionSeconds(s,w)<15);
});
