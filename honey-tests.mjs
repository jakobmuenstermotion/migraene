import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize, TOOLS } from "./mondgarten/core.mjs";
import { BEDS, WORKSHOPS, PRODUCTS } from "./mondgarten/village-content.mjs";
import {
  HIVES,
  HIVE_CAPACITY,
  CONFECTION_ROUND,
} from "./mondgarten/honey-content.mjs";
import {
  advanceApiary,
  collectHoney,
  storeHoney,
  honeyCount,
  takeHoney,
  giveHelperSnack,
  helperBoost,
  startHoneyApples,
  advanceHoneyApples,
} from "./mondgarten/apiary.mjs";
import {
  FARM,
  moveShellToFarm,
  makeSnailFood,
  advanceFarm,
  collectSnailFood,
  feedSnail,
  selectFoodRecipe,
  supplyFoodKitchen,
  totalFarmFood,
} from "./mondgarten/snail-farm.mjs";
import {
  getBuildPads,
  payBuild,
  discoverSeeds,
  bedYield,
  sellCarriedProducts,
  offlineVillage,
  productionSeconds,
} from "./mondgarten/village.mjs";
import { createVillageField, harvestAt } from "./mondgarten/harvest.mjs";
import { GardenAutomation } from "./mondgarten/automation.mjs";
import { prepareDay } from "./mondgarten/daily.mjs";
const state = () => {
  const s = freshState();
  s.journey.round = 25;
  s.village.farm.built = true;
  s.village.house = 3;
  return s;
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test("orchard is third, cave replaces nebula with stable save slot, and each optional hive follows its flower by two levels", () => {
  assert.equal(BEDS[5].crop, "crystal");
  assert.equal(BEDS[5].id, "nebula");
  const s = state();
  s.coins = 1e12;
  s.village.beds[1] = 1;
  discoverSeeds(s);
  let p = getBuildPads(s, TOOLS).find((p) => p.id === "bed:4");
  assert.ok(p.visible && !p.locked);
  assert.ok(payBuild(s, p, 10).complete);
  assert.equal(
    getBuildPads(s, TOOLS).find((p) => p.id === "bed:2").visible,
    false,
  );
  for (const [i, h] of HIVES.entries()) {
    s.village.beds[h.bed] = 1;
    s.journey.round = h.round - 1;
    p = getBuildPads(s, TOOLS).find((p) => p.id === "hive:" + i);
    assert.equal(p.visible, false);
    s.journey.round = h.round;
    p = getBuildPads(s, TOOLS).find((p) => p.id === "hive:" + i);
    assert.ok(p.visible && p.optional && !p.locked);
    assert.ok(payBuild(s, p, 10).complete);
    assert.equal(payBuild(s, p, 10).complete, false);
  }
  assert.deepEqual(
    HIVES.map((h) => h.bed),
    [0, 1, 2, 6],
  );
  s.journey.plan = null;
  prepareDay(s, TOOLS);
  assert.ok(!s.journey.plan.items.some((p) => p.id.startsWith("hive:")));
});
test("honey needs a bought hive, an owned blooming flower field and active daylight; full stock and offline work never accumulate unlimited honey", () => {
  const s = state(),
    a = s.village.apiary,
    cells = createVillageField(s);
  advanceApiary(s, cells, 1000);
  assert.equal(a.hives[0].count, 0);
  a.hives[0].built = true;
  advanceApiary(s, [], 1000);
  assert.equal(a.hives[0].count, 0);
  advanceApiary(s, cells, 89);
  assert.equal(a.hives[0].count, 0);
  advanceApiary(s, cells, 1);
  assert.equal(a.hives[0].count, 1);
  advanceApiary(s, cells, 1e6);
  assert.equal(a.hives[0].count, HIVE_CAPACITY);
  const value = a.hives[0].value;
  advanceApiary(s, cells, 1e6);
  assert.equal(a.hives[0].value, value);
  a.hives[0].count = 0;
  a.hives[0].value = 0;
  s.journey.light = 0.8;
  advanceApiary(s, cells, 1000);
  assert.equal(a.hives[0].count, 0);
  s.journey.light = 0;
  offlineVillage(s, 86400);
  assert.equal(a.hives[0].count, 0);
});
test("physical honey pickup respects backpack room, stores actual values and sells only once", () => {
  const s = state(),
    h = s.village.apiary.hives[0];
  h.built = true;
  h.count = 3;
  h.value = 90;
  s.bag = 79;
  s.bagValue = 79;
  s.cargo = { moonbloom: { count: 79, value: 79 } };
  assert.equal(collectHoney(s, 0), 1);
  assert.equal(h.count, 2);
  assert.equal(s.productCargo.values.moonHoney, 30);
  assert.equal(collectHoney(s, 0), 0);
  storeHoney(s);
  assert.equal(honeyCount(s), 1);
  assert.equal(s.village.finishedValues.moonHoney, 30);
  s.bag = 0;
  s.bagValue = 0;
  s.cargo = {};
  collectHoney(s, 0);
  assert.equal(h.count, 0);
  assert.equal(sellCarriedProducts(s).value, 60);
  assert.equal(sellCarriedProducts(s).value, 0);
  assert.equal(s.village.finishedValues.moonHoney, 30);
});
test("three normal meals stop at 30 minutes; final growth requires a honey meal and preserves the full ingredient investment", () => {
  const s = state(),
    f = s.village.farm;
  f.shells.garden = 1;
  moveShellToFarm(s, "garden");
  const n = f.nursery[0];
  f.food = 4;
  f.foodValue = 400;
  for (let i = 0; i < 3; i++) {
    assert.ok(feedSnail(s, n.id));
    advanceFarm(s, 600);
  }
  assert.equal(n.growth, 1800);
  assert.equal(feedSnail(s, n.id), false);
  advanceFarm(s, 1000);
  assert.equal(n.growth, 1800);
  s.village.finished.lavenderHoney = 1;
  s.village.finishedValues.lavenderHoney = 25;
  assert.ok(makeSnailFood(s, "honey"));
  assert.equal(f.honeyFood, 0);
  advanceFarm(s, 45);
  assert.equal(collectSnailFood(s), 1);
  assert.equal(f.honeyFoodValue, 125);
  assert.ok(feedSnail(s, n.id));
  advanceFarm(s, 600);
  assert.equal(n.growth, FARM.growSeconds);
  assert.equal(n.investment, 425);
  assert.equal(f.food + f.honeyFood, 0);
});
test("every honey variety works for the last meal, while snack quality stays tied to its own variety", () => {
  for (const h of HIVES) {
    const s = state(),
      f = s.village.farm;
    f.food = 2;
    f.foodValue = 200;
    s.village.finished[h.honey] = 2;
    s.village.finishedValues[h.honey] = 50;
    assert.ok(makeSnailFood(s, "honey"));
    advanceFarm(s, 45);
    collectSnailFood(s);
    assert.equal(f.honeyFood, 1);
    assert.ok(makeSnailFood(s, "snack-" + h.id));
    advanceFarm(s, 45);
    collectSnailFood(s);
    assert.equal(f.snacks[h.honey].count, 1);
    assert.equal(f.snacks[h.honey].value, 125);
    const reloaded = normalize(JSON.parse(JSON.stringify(s)));
    assert.deepEqual(reloaded.village.farm, s.village.farm);
  }
});
test("old paid meals can finish beyond the new threshold without turning every twelve-minute v2 snail into an adult", () => {
  const s = state();
  s.village.farm.careVersion = 2;
  s.village.farm.nursery = [
    { id: 1, species: "garden", growth: 900, meal: 0, investment: 42 },
    { id: 2, species: "dew", growth: 1750, meal: 600, investment: 99 },
  ];
  const restored = normalize(s),
    f = restored.village.farm;
  assert.equal(f.nursery[0].growth, 900);
  assert.equal(f.nursery[0].honeyMeal, false);
  assert.equal(f.nursery[1].honeyMeal, true);
  advanceFarm(restored, 600);
  assert.equal(f.nursery[1].growth, 2350);
  assert.equal(f.nursery[1].investment, 99);
  assert.deepEqual(normalize(restored).village.farm, f);
});
test("special recipes accept partial carried or explicit stored inputs without mixing honey snack qualities or exceeding capacity", () => {
  const s = state(),
    f = s.village.farm;
  f.food = 1;
  f.foodValue = 100;
  s.village.finished.sunHoney = 1;
  s.village.finishedValues.sunHoney = 25;
  selectFoodRecipe(s, "snack-moon");
  assert.equal(supplyFoodKitchen(s, "carried"), 1);
  assert.equal(supplyFoodKitchen(s, "storage"), 0);
  assert.equal(f.kitchen.running, false);
  s.village.finished.moonHoney = 1;
  s.village.finishedValues.moonHoney = 20;
  supplyFoodKitchen(s, "storage");
  assert.equal(f.kitchen.running, true);
  advanceFarm(s, 45);
  collectSnailFood(s);
  assert.equal(f.snacks.moonHoney.value, 120);
  assert.equal(s.village.finished.sunHoney, 1);
  const bad = normalize({
    ...s,
    village: {
      ...s.village,
      farm: {
        ...f,
        food: 99,
        honeyFood: 100,
        snacks: { moonHoney: { count: 100, value: 100 } },
      },
    },
  });
  assert.ok(totalFarmFood(bad.village.farm) <= 100);
});
test("snacks require deliberate valid-helper assignment, cannot stack and affect exactly two active daylight minutes", () => {
  const s = state();
  s.village.snails = 1;
  const f = s.village.farm;
  f.snacks.moonHoney = { count: 3, value: 60 };
  assert.equal(giveHelperSnack(s, "snail:2", "moonHoney"), false);
  assert.ok(giveHelperSnack(s, "snail:0", "moonHoney"));
  assert.equal(f.snacks.moonHoney.count, 2);
  assert.equal(giveHelperSnack(s, "snail:0", "moonHoney"), false);
  near(helperBoost(s, "snail:0"), 1.2);
  advanceApiary(s, [], 60);
  near(s.village.apiary.buffs["snail:0"].remaining, 60);
  s.journey.light = 0.8;
  advanceApiary(s, [], 600);
  assert.equal(helperBoost(s, "snail:0"), 1);
  assert.equal(s.village.apiary.buffs["snail:0"].remaining, 60);
  s.journey.light = 0;
  advanceApiary(s, [], 60);
  assert.equal(helperBoost(s, "snail:0"), 1);
  assert.equal(f.snacks.moonHoney.count, 2);
});
test("snack effects apply to actual snail movement and do not inflate its cargo value", () => {
  const a = state();
  a.village.snails = 1;
  a.village.snailProfiles = [{ name: "", task: "sell" }];
  a.village.snailLoads = [
    {
      x: 0,
      z: 0,
      mode: "deliver",
      items: { moonbloom: 24 },
      values: { moonbloom: 48 },
    },
  ];
  const b = structuredClone(a);
  b.village.farm.snacks.moonHoney = { count: 1, value: 20 };
  giveHelperSnack(b, "snail:0", "moonHoney");
  const aa = new GardenAutomation(a),
    bb = new GardenAutomation(b);
  aa.update(a, [], { x: 30, z: 30 }, 1, 0);
  bb.update(b, [], { x: 30, z: 30 }, 1, 0);
  near(
    Math.hypot(bb.snails[0].x, bb.snails[0].z) /
      Math.hypot(aa.snails[0].x, aa.snails[0].z),
    1.2,
  );
  assert.equal(bb.snails[0].values.moonbloom, 48);
});
test("late honey apples use the existing tea workshop, consume real honey and fruit, stop after one batch and survive reload", () => {
  let s = state();
  s.village.workshops.tea.level = 1;
  s.village.raw.starfruit = 8;
  s.village.rawValues.starfruit = 80;
  s.village.finished.moonHoney = 4;
  s.village.finishedValues.moonHoney = 40;
  assert.equal(startHoneyApples(s), false);
  s.journey.round = CONFECTION_ROUND;
  assert.ok(startHoneyApples(s));
  assert.equal(startHoneyApples(s), false);
  assert.equal(s.village.raw.starfruit, 4);
  advanceHoneyApples(s, 5);
  s = normalize(JSON.parse(JSON.stringify(s)));
  advanceHoneyApples(s, 100);
  assert.equal(s.village.finished.honeyapple, 1);
  near(s.village.finishedValues.honeyapple, 72);
  advanceHoneyApples(s, 1000);
  assert.equal(s.village.finished.honeyapple, 1);
  assert.equal(s.village.finished.moonHoney, 2);
});
test("crystal rocks take three visible strikes, yield a bundle only on breaking, and rare rocks take five", () => {
  const s = state();
  s.journey.round = 59;
  s.village.beds[5] = 1;
  const cell = createVillageField(s).find((c) => c.bed === 5);
  cell.rare = false;
  for (let i = 0; i < 2; i++) {
    const hit = harvestAt(s, [cell], cell.x, cell.z, 0, 1, {
      dt: BEDS[5].mineSeconds,
    });
    assert.equal(hit[0].mining, true);
    assert.equal(s.bag, 0);
  }
  const result = harvestAt(s, [cell], cell.x, cell.z, 0, 1, {
    dt: BEDS[5].mineSeconds,
  });
  assert.equal(result[0].units, 48);
  assert.ok(cell.readyAt > 0);
  s.bag = 0;
  s.bagValue = 0;
  s.cargo = {};
  cell.readyAt = 0;
  cell.rare = true;
  s.tools.bag = 1;
  for (let i = 0; i < 4; i++) {
    harvestAt(s, [cell], cell.x, cell.z, 0, 1, { dt: BEDS[5].mineSeconds });
    assert.equal(s.bag, 0);
  }
  harvestAt(s, [cell], cell.x, cell.z, 0, 1, { dt: BEDS[5].mineSeconds });
  assert.equal(s.bag, 96);
});
test("legacy field ownership, nebula goods, active production values and honey defaults survive migration", () => {
  const s = state();
  s.village.beds = [5, 5, 5, 5, 5, 5, 5];
  s.village.raw.nebula = 12;
  s.village.rawValues.nebula = 120;
  delete s.village.apiary;
  const old = normalize(s);
  assert.equal(old.village.raw.nebula, 12);
  assert.equal(old.village.beds[5], 5);
  assert.equal(old.village.apiary.hives[0].built, false);
  assert.equal(
    WORKSHOPS[2].alternatives.some((r) => r.nebula === 4),
    true,
  );
  assert.equal(PRODUCTS.honeyapple.name, "Honigapfel");
});

test("stored honey stays reserved for deliberate use; transport helpers collect honey apples at the tea workshop without an undefined source", () => {
  const s = state();
  s.village.partner = true;
  s.village.house = 3;
  s.village.finished.moonHoney = 2;
  s.village.finishedValues.moonHoney = 30;
  const a = new GardenAutomation(s);
  assert.doesNotThrow(() => a.update(s, [], { x: 30, z: 30 }, 1, 0));
  assert.equal(s.village.finished.moonHoney, 2);
  s.village.workshops.tea.level = 1;
  s.village.finished.honeyapple = 1;
  s.village.finishedValues.honeyapple = 72;
  a.partner.x = WORKSHOPS[1].x + 1.8;
  a.partner.z = WORKSHOPS[1].z + 1.8;
  a.update(s, [], { x: 30, z: 30 }, 1, 0);
  assert.equal(s.village.hauler.items.honeyapple, 1);
  assert.equal(s.village.hauler.values.honeyapple, 72);
  assert.equal(s.village.finished.moonHoney, 2);
});
