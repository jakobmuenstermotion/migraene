import {VILLAGE} from './mondgarten/village-content.mjs';
import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize } from "./mondgarten/core.mjs";
import {
  freshFarm,
  FARM,
  SNAILS,
  discoverShell,
  moveShellToFarm,
  makeSnailFood,
  collectSnailFood,
  supplyFoodKitchen,
  selectFoodRecipe,
  storeSnailFood,
  withdrawSnailFood,
  feedNearbySnail,
  feedSnail,
  advanceFarm,
  releaseSnail,
  farmHelperLimit,
  farmFoodReserve,
} from "./mondgarten/snail-farm.mjs";
import {
  getBuildPads,
  payBuild,
  offlineVillage,
  availableProducts,
} from "./mondgarten/village.mjs";
const state = () => {
  const s = freshState();
  s.journey.round = 18;
  s.village.farm.built = true;
  s.village.house = 3;
  return s;
};
function raw(s, count = 120) {
  s.village.raw.moonbloom = count;
  s.village.rawValues.moonbloom = count * 2;
  s.village.finished.bouquet = 6;
  s.village.finishedValues.bouquet = 180;
}
function cookFood(s, recipe = "flowers") {
  if (!makeSnailFood(s, recipe)) return false;
  advanceFarm(s, FARM.cookSeconds);
  collectSnailFood(s);
  return true;
}
test("farm is a purchased mid-game upgrade, and old saves get empty safe defaults", () => {
  const s = freshState();
  s.coins = 1e9;
  s.journey.round = 17;
  let p = getBuildPads(s).find((p) => p.id === "farm");
  assert.equal(p.visible, false);
  assert.equal(payBuild(s, p, 10).complete, false);
  s.journey.round = 18;
  p = getBuildPads(s).find((p) => p.id === "farm");
  assert.equal(payBuild(s, p, 10).complete, true);
  delete s.village.farm;
  assert.deepEqual(normalize(s).village.farm, freshFarm());
});
test("shells require real harvest and active time; rarity gates and per-day cap persist", () => {
  const s = state();
  assert.equal(discoverShell(s, 240, 179), null);
  let found = discoverShell(s, 0, 1);
  assert.ok(found.round <= 18);
  assert.equal(s.village.farm.shells[found.id], 1);
  assert.ok(discoverShell(s, 240, 180));
  assert.equal(discoverShell(s, 10000, 10000), null);
  const restored = normalize(s);
  assert.equal(discoverShell(restored, 240, 180), null);
  restored.journey.round = 19;
  assert.ok(discoverShell(restored, 240, 180));
  assert.equal(SNAILS.length, 10);
});
test("four ten-minute meals grow a snail; hunger pauses without loss and a mature snail is consumed once", () => {
  const s = state(),
    f = s.village.farm;
  raw(s);
  f.shells.garden = 1;
  assert.ok(moveShellToFarm(s, "garden"));
  assert.equal(moveShellToFarm(s, "garden"), false);
  const n = f.nursery[0];
  f.honeyFood = 1;
  f.honeyFoodValue = 105;
  assert.ok(cookFood(s));
  advanceFarm(s, 10000);
  assert.equal(n.growth, 0);
  for (let meal = 0; meal < 4; meal++) {
    if (!f.food) cookFood(s);
    assert.ok(feedSnail(s, n.id));
    assert.equal(feedSnail(s, n.id), false);
    advanceFarm(s, FARM.mealSeconds);
  }
  assert.equal(n.growth, FARM.growSeconds);
  assert.ok(releaseSnail(s, n.id, "helper"));
  assert.equal(s.village.snails, 1);
  assert.equal(f.helpers[0], "garden");
  assert.equal(releaseSnail(s, n.id, "helper"), false);
});
test("food consumes real raw and crafted ingredients from carried goods, storage and workshop outputs without losing values", () => {
  const s = state();
  s.bag = 30;
  s.bagValue = 60;
  s.cargo = { moonbloom: { count: 30, value: 60 } };
  s.village.raw = { moonbloom: 30 };
  s.village.rawValues = { moonbloom: 60 };
  s.productCargo = { items: { bouquet: 1 }, values: { bouquet: 30 } };
  s.village.finished = { bouquet: 2 };
  s.village.finishedValues = { bouquet: 60 };
  assert.equal(cookFood(s), true);
  assert.equal(s.bag, 0);
  assert.equal(s.village.raw.moonbloom, 0);
  assert.equal(s.productCargo.items.bouquet, 0);
  assert.equal(s.village.finished.bouquet, 0);
  assert.equal(s.village.farm.food, 2);
  assert.equal(s.village.farm.foodValue, 210);
  const before = structuredClone(s);
  for (const recipe of ["fruit", "missing", "toString", "__proto__", null]) {
    assert.equal(cookFood(s, recipe), false);
    assert.deepEqual(s, before);
  }
  s.village.raw = { moonbloom: 30, starfruit: 8 };
  s.village.rawValues = { moonbloom: 60, starfruit: 80 };
  s.village.finished = { tea: 1 };
  s.village.finishedValues = { tea: 20 };
  assert.equal(cookFood(s, "fruit"), true);
  assert.equal(s.village.farm.food, 5);
  assert.equal(s.village.farm.foodValue, 370);
});
test("nursery and helper caps cannot be bypassed; selling preserves ingredient investment with bounded profit", () => {
  const s = state(),
    f = s.village.farm;
  f.shells.garden = 7;
  for (let i = 0; i < 6; i++) assert.ok(moveShellToFarm(s, "garden"));
  assert.equal(moveShellToFarm(s, "garden"), false);
  const n = f.nursery[0];
  n.growth = FARM.growSeconds;
  n.investment = 10000;
  s.village.snails = farmHelperLimit(s);
  assert.equal(releaseSnail(s, n.id, "helper"), false);
  assert.equal(f.nursery.length, 6);
  assert.ok(releaseSnail(s, n.id, "sell"));
  assert.ok(s.coins >= 10000 && s.coins < 11000);
  s.journey.round = 10000;
  assert.equal(farmHelperLimit(s), 12);
});
test("farm food, care, species and shipment compatibility survive save/load and small offline progress", () => {
  const s = state();
  s.village.farm.shells.garden = 1;
  moveShellToFarm(s, "garden");
  raw(s);
  cookFood(s);
  feedSnail(s, 1);
  advanceFarm(s, 100);
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.village.farm, s.village.farm);
  offlineVillage(restored, 8 * 3600);
  assert.equal(restored.village.farm.nursery[0].growth, 190);
  assert.equal(restored.village.farm.nursery[0].meal, 410);
  assert.equal(restored.village.farm.findsToday, s.village.farm.findsToday);
});

test("a raised helper keeps its own species after previously purchased helpers and save/load", () => {
  const s = state();
  s.journey.round = 25;
  s.village.snails = 2;
  s.village.farm.shells.apple = 1;
  moveShellToFarm(s, "apple");
  const n = s.village.farm.nursery[0];
  n.growth = FARM.growSeconds;
  assert.ok(releaseSnail(s, n.id, "helper"));
  assert.deepEqual(s.village.farm.helpers, [null, null, "apple"]);
  assert.deepEqual(normalize(s).village.farm.helpers, [null, null, "apple"]);
});

test("feed cannot be made from flowers alone; hungry babies reserve crafted feed ingredients without consuming house materials", () => {
  const s = state();
  s.village.house = 0;
  const reserve=VILLAGE.partner.materials[0].bouquet;
  raw(s);
  s.village.farm.shells.garden = 1;
  moveShellToFarm(s, "garden");
  s.village.finished.bouquet = reserve;
  s.village.finishedValues.bouquet = reserve*30;
  const before = structuredClone(s);
  assert.equal(cookFood(s), false);
  assert.deepEqual(s, before);
  assert.equal(farmFoodReserve(s, "bouquet"), 3);
  assert.equal(availableProducts(s, "bouquet", true), 0);
  s.village.finished.bouquet = reserve+3;
  s.village.finishedValues.bouquet = (reserve+3)*30;
  assert.equal(
    availableProducts(s, "bouquet", true),
    0,
    "automatic sellers must leave food and home ingredients",
  );
  assert.equal(cookFood(s), true);
  assert.equal(s.village.finished.bouquet, reserve);
  assert.equal(s.village.finishedValues.bouquet, reserve*30);
  assert.equal(farmFoodReserve(s, "bouquet"), 0);
});

test("old food, invested value and elapsed growth survive migration, and already adult snails stay adult", () => {
  const s = state(),
    f = s.village.farm;
  delete f.careVersion;
  f.food = 9;
  f.foodValue = 123;
  f.nursery = [
    { id: 1, species: "garden", growth: 360, meal: 120, investment: 42 },
    { id: 2, species: "apple", growth: 720, meal: 0, investment: 99 },
  ];
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.village.farm.food, 9);
  assert.equal(restored.village.farm.foodValue, 123);
  assert.deepEqual(restored.village.farm.nursery[0], {
    ...f.nursery[0],
    honeyMeal: false,
  });
  assert.equal(restored.village.farm.nursery[1].growth, FARM.growSeconds);
  assert.equal(restored.village.farm.nursery[1].investment, 99);
  assert.deepEqual(normalize(restored).village.farm, restored.village.farm);
});

test("forty minutes of fed growth spans seven five-minute visits with bounded overnight care rather than one short session", () => {
  let s = state();
  s.village.farm.shells.garden = 1;
  moveShellToFarm(s, "garden");
  s.village.farm.food = 3;
  s.village.farm.foodValue = 315;
  s.village.farm.honeyFood = 1;
  s.village.farm.honeyFoodValue = 105;
  for (let visit = 1; visit <= 7; visit++) {
    for (let sec = 0; sec < 300; sec++) {
      if (s.village.farm.nursery[0].meal === 0) feedSnail(s, 1);
      advanceFarm(s, 1);
    }
    offlineVillage(s, 8 * 3600);
    s = normalize(JSON.parse(JSON.stringify(s)));
    if (visit < 7)
      assert.ok(s.village.farm.nursery[0].growth < FARM.growSeconds);
  }
  assert.equal(s.village.farm.nursery[0].growth, 2400);
  assert.equal(s.village.farm.food, 0);
  assert.equal(s.village.farm.nursery[0].investment, 420);
});

test("kitchen takes 45 seconds, stops for collection and survives saving during cooking and waiting", () => {
  let s = state();
  raw(s);
  assert.ok(makeSnailFood(s));
  assert.equal(s.village.farm.food, 0);
  assert.equal(s.village.farm.kitchen.running, true);
  assert.equal(makeSnailFood(s), false);
  advanceFarm(s, 20);
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(s.village.farm.kitchen.progress, 20);
  advanceFarm(s, 24.9);
  assert.equal(collectSnailFood(s), 0);
  advanceFarm(s, 0.1);
  assert.equal(s.village.farm.kitchen.ready, 2);
  advanceFarm(s, 900);
  assert.equal(s.village.farm.kitchen.ready, 2);
  assert.equal(s.village.raw.moonbloom, 60);
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(collectSnailFood(s), 2);
  assert.equal(collectSnailFood(s), 0);
  assert.equal(s.village.farm.food, 2);
  assert.equal(s.village.farm.foodValue, 210);
  assert.equal(s.village.farm.kitchen.running, false);
});
test("walking past kitchen deposits only carried ingredients, supports several trips and does not draw from storage", () => {
  let s = state();
  raw(s);
  const f = s.village.farm;
  s.bag = 20;
  s.bagValue = 40;
  s.cargo = { moonbloom: { count: 20, value: 40 } };
  s.productCargo = { items: { bouquet: 2 }, values: { bouquet: 60 } };
  assert.equal(supplyFoodKitchen(s), 22);
  assert.equal(s.village.raw.moonbloom, 120);
  assert.equal(s.village.finished.bouquet, 6);
  assert.equal(f.kitchen.running, false);
  assert.equal(selectFoodRecipe(s, "fruit"), false);
  s = normalize(JSON.parse(JSON.stringify(s)));
  s.bag = 40;
  s.bagValue = 80;
  s.cargo = { moonbloom: { count: 40, value: 80 } };
  s.productCargo = { items: { bouquet: 1 }, values: { bouquet: 30 } };
  supplyFoodKitchen(s);
  assert.equal(s.village.farm.kitchen.running, true);
  advanceFarm(s, 45);
  collectSnailFood(s);
  assert.equal(s.village.farm.foodValue, 210);
  assert.equal(s.bag, 0);
  assert.equal(s.bagValue, 0);
});
test("explicit storage fill preserves carried goods and house reservations, and only accepts missing ingredients", () => {
  const s = state();
  s.village.house = 0;
  const reserve=VILLAGE.partner.materials[0].bouquet;
  raw(s);
  s.village.finished.bouquet = reserve+1;
  s.village.finishedValues.bouquet = (reserve+1)*30;
  s.bag = 10;
  s.bagValue = 20;
  s.cargo = { moonbloom: { count: 10, value: 20 } };
  supplyFoodKitchen(s, "storage");
  assert.equal(s.village.farm.kitchen.inputs.moonbloom, 60);
  assert.equal(s.village.farm.kitchen.inputs.bouquet, 1);
  assert.equal(s.village.finished.bouquet, reserve);
  assert.equal(s.village.farm.kitchen.running, false);
  assert.equal(s.bag, 10);
  s.village.finished.bouquet = reserve+2;
  s.village.finishedValues.bouquet = (reserve+2)*30;
  supplyFoodKitchen(s, "storage");
  assert.equal(s.village.farm.kitchen.running, true);
  assert.equal(s.village.raw.moonbloom, 60);
  assert.equal(s.village.finished.bouquet, reserve);
  assert.equal(supplyFoodKitchen(s, "storage"), 0);
});
test("food remains at its physical location, storage cannot feed remotely and transfers preserve value exactly", () => {
  let s = state();
  const f = s.village.farm;
  f.food = 4;
  f.foodValue = 420;
  f.shells.garden = 2;
  moveShellToFarm(s, "garden");
  moveShellToFarm(s, "garden");
  assert.equal(storeSnailFood(s), 4);
  assert.equal(storeSnailFood(s), 0);
  assert.equal(feedSnail(s, 1), false);
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(s.village.farm.storedFood, 4);
  assert.equal(s.village.farm.storedFoodValue, 420);
  assert.equal(withdrawSnailFood(s), 4);
  assert.equal(withdrawSnailFood(s), 0);
  const targets = [
    { id: 1, x: 1, z: 0 },
    { id: 2, x: 2, z: 0 },
  ];
  assert.equal(feedNearbySnail(s, { x: 8, z: 8 }, targets), null);
  assert.equal(feedNearbySnail(s, { x: 0, z: 0 }, targets).id, 1);
  assert.equal(s.village.farm.food, 3);
  assert.equal(s.village.farm.nursery[0].investment, 105);
  s.journey.light = 0.8;
  assert.equal(feedNearbySnail(s, { x: 0, z: 0 }, targets), null);
  s.journey.light = 0;
  assert.equal(feedNearbySnail(s, { x: 0, z: 0 }, targets).id, 2);
  assert.equal(feedNearbySnail(s, { x: 0, z: 0 }, targets), null);
  assert.equal(s.village.farm.foodValue, 210);
});
test("old food migrates to carried pouch and normalization is stable without duplicating kitchen or stored stock", () => {
  const s = state();
  s.village.farm.food = 9;
  s.village.farm.foodValue = 99;
  delete s.village.farm.kitchen;
  delete s.village.farm.storedFood;
  delete s.village.farm.storedFoodValue;
  let restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.village.farm.food, 9);
  assert.equal(restored.village.farm.foodValue, 99);
  assert.equal(restored.village.farm.storedFood, 0);
  assert.deepEqual(normalize(restored).village.farm, restored.village.farm);
});
test("recipe choice locks when filled and total food cap includes storage and the next batch", () => {
  const s = state();
  s.village.beds[4] = 1;
  assert.equal(selectFoodRecipe(s, "fruit"), true);
  assert.equal(selectFoodRecipe(s, "toString"), false);
  s.village.farm.food = 50;
  s.village.farm.storedFood = 49;
  raw(s);
  assert.equal(makeSnailFood(s), false);
  assert.equal(supplyFoodKitchen(s, "storage"), 0);
  s.village.farm.storedFood = 48;
  selectFoodRecipe(s, "flowers");
  assert.ok(makeSnailFood(s));
  advanceFarm(s, 45);
  collectSnailFood(s);
  assert.equal(s.village.farm.food + s.village.farm.storedFood, 100);
});
