import {takeStoredGood} from './warehouse-stock.mjs';
import { HIVES } from "./honey-content.mjs";
import { honeyCount, takeHoney } from "./apiary.mjs";
import { availableProducts,availableStoredProducts } from "./village.mjs";
import { credit } from "./money.mjs";
export const SNAILS = [
  { id: "garden", name: "Gartenschnecke", color: "#d4b38b", round: 18 },
  { id: "dew", name: "Tauschnecke", color: "#a4c9bc", round: 18 },
  { id: "lavender", name: "Lavendelschnecke", color: "#b6a0d4", round: 25 },
  { id: "honey", name: "Honigschnecke", color: "#e1bf76", round: 25 },
  { id: "moss", name: "Moosschnecke", color: "#91b17c", round: 32 },
  { id: "coral", name: "Korallenschnecke", color: "#dca19a", round: 36 },
  { id: "moon", name: "Mondschnecke", color: "#c4cadf", round: 43 },
  { id: "apple", name: "Apfelschnecke", color: "#c3cc7e", round: 47 },
  { id: "amber", name: "Bernsteinschnecke", color: "#cd9d65", round: 59 },
  { id: "star", name: "Sternenschnecke", color: "#8ea9d0", round: 68 },
];
export const FARM = {
  slots: 6,
  cookSeconds: 45,
  foodMax: 100,
  maxShells: 30,
  careVersion: 3,
  growSeconds: 40 * 60,
  mealSeconds: 10 * 60,
  helperMax: 12,
  findEvery: 240,
  findCooldown: 180,
  maxFindsPerDay: 2,
};
const num = (x, max = 1e9) =>
  Number.isFinite(x) && x >= 0 ? Math.min(x, max) : 0;
const species = (id) => SNAILS.some((s) => s.id === id);
export function freshKitchen() {
  return {
    recipe: "flowers",
    inputs: {},
    values: {},
    running: false,
    progress: 0,
    ready: 0,
    readyValue: 0,
  };
}
export function freshFarm() {
  return {
    careVersion: FARM.careVersion,
    built: false,
    shells: {},
    nursery: [],
    helpers: [],
    discovered: [],
    food: 0,
    foodValue: 0,
    storedFood: 0,
    storedFoodValue: 0,
    honeyFood: 0,
    honeyFoodValue: 0,
    storedHoneyFood: 0,
    storedHoneyFoodValue: 0,
    snacks: {},
    storedSnacks: {},
    kitchen: freshKitchen(),
    nextID: 1,
    findProgress: 0,
    findClock: 0,
    findRound: 0,
    findsToday: 0,
    rng: 2463534242,
    sold: 0,
  };
}
export function normalizeFarm(raw) {
  const f = freshFarm();
  if (!raw) return f;
  f.built = raw.built === true;
  for (const key of ["food", "nextID", "findRound", "findsToday", "sold"])
    f[key] = Math.floor(num(raw[key]));
  f.nextID = Math.max(1, f.nextID);
  f.food = Math.min(FARM.foodMax, f.food);
  f.foodValue = f.food ? num(raw.foodValue) : 0;
  f.storedFood = Math.floor(num(raw.storedFood, FARM.foodMax - f.food));
  f.storedFoodValue = f.storedFood ? num(raw.storedFoodValue) : 0;
  f.honeyFood = Math.floor(num(raw.honeyFood, 100));
  f.honeyFoodValue = f.honeyFood ? num(raw.honeyFoodValue) : 0;
  f.storedHoneyFood = Math.floor(num(raw.storedHoneyFood, 100));
  f.storedHoneyFoodValue = f.storedHoneyFood
    ? num(raw.storedHoneyFoodValue)
    : 0;
  for (const group of ["snacks", "storedSnacks"])
    for (const h of HIVES) {
      const n = Math.floor(num(raw[group]?.[h.honey]?.count, 100));
      if (n)
        f[group][h.honey] = { count: n, value: num(raw[group][h.honey].value) };
    }
  let foodRoom = FARM.foodMax - f.food - f.storedFood;
  for (const key of ["honeyFood", "storedHoneyFood"]) {
    const old = f[key];
    f[key] = Math.min(old, foodRoom);
    if (old) f[key + "Value"] *= f[key] / old;
    foodRoom -= f[key];
  }
  for (const group of ["snacks", "storedSnacks"])
    for (const snack of Object.values(f[group])) {
      const old = snack.count;
      snack.count = Math.min(old, foodRoom);
      if (old) snack.value *= snack.count / old;
      foodRoom -= snack.count;
    }
  const k = raw.kitchen;
  if (k && Object.hasOwn(FOOD_RECIPES, k.recipe)) {
    f.kitchen.recipe = k.recipe;
    const recipe = FOOD_RECIPES[k.recipe];
    f.kitchen.ready = Math.floor(
      num(
        k.ready,
        Math.min(recipe.portions, Math.max(0, FARM.foodMax - totalFarmFood(f))),
      ),
    );
    f.kitchen.readyValue = f.kitchen.ready ? num(k.readyValue) : 0;
    if (!f.kitchen.ready) {
      for (const [id, count] of Object.entries(recipe.inputs)) {
        const amount = num(k.inputs?.[id], count);
        if (amount) {
          f.kitchen.inputs[id] = amount;
          f.kitchen.values[id] = num(k.values?.[id]);
        }
      }
      f.kitchen.running =
        k.running === true &&
        Object.entries(recipe.inputs).every(
          ([id, n]) => f.kitchen.inputs[id] === n,
        );
      f.kitchen.progress = f.kitchen.running
        ? num(k.progress, FARM.cookSeconds)
        : 0;
    }
  }
  f.findProgress = num(raw.findProgress, FARM.findEvery);
  f.findClock = num(raw.findClock, FARM.findCooldown);
  f.rng = Math.floor(num(raw.rng, 0xffffffff)) || 2463534242;
  let room = FARM.maxShells;
  for (const s of SNAILS) {
    const count = Math.min(
      room,
      Math.floor(num(raw.shells?.[s.id], FARM.maxShells)),
    );
    if (count) {
      f.shells[s.id] = count;
      room -= count;
    }
  }
  const ids = new Set();
  f.nursery = (raw.nursery ?? [])
    .slice(0, FARM.slots)
    .filter(
      (n) =>
        n &&
        Number.isSafeInteger(n.id) &&
        n.id > 0 &&
        !ids.has(n.id) &&
        ids.add(n.id) &&
        species(n.species),
    )
    .map((n) => ({
      id: n.id,
      species: n.species,
      growth:
        (raw.careVersion ?? 1) < 2 && n.growth >= 720
          ? FARM.growSeconds
          : num(n.growth, FARM.growSeconds),
      meal: num(n.meal, FARM.mealSeconds),
      investment: num(n.investment),
      honeyMeal:
        n.honeyMeal === true ||
        (((raw.careVersion ?? 1) < 3 || n.honeyMeal === undefined) &&
          n.meal > 0 &&
          n.growth + n.meal > 1800),
    }));
  f.nextID = Math.max(f.nextID, ...f.nursery.map((n) => n.id + 1));
  f.helpers = Array.isArray(raw.helpers)
    ? raw.helpers
        .slice(0, FARM.helperMax)
        .map((id) => (species(id) ? id : null))
    : [];
  f.discovered = Array.isArray(raw.discovered)
    ? [...new Set(raw.discovered.filter(species))]
    : [];
  return f;
}
export function farmHelperLimit(s) {
  return Math.min(
    FARM.helperMax,
    Math.max(0, 1 + Math.floor((s.journey.round - 7) / 6)),
  );
}
function random(f) {
  let x = f.rng;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  f.rng = x >>> 0;
  return f.rng / 4294967296;
}
export function discoverShell(s, harvested, dt) {
  const f = s.village.farm;
  if (!f?.built) return null;
  if (f.findRound !== s.journey.round) {
    f.findRound = s.journey.round;
    f.findsToday = 0;
  }
  f.findProgress = Math.min(
    FARM.findEvery,
    f.findProgress + Math.max(0, harvested),
  );
  f.findClock = Math.min(FARM.findCooldown, f.findClock + Math.max(0, dt));
  if (
    f.findsToday >= FARM.maxFindsPerDay ||
    f.findClock < FARM.findCooldown ||
    f.findProgress < FARM.findEvery ||
    Object.values(f.shells).reduce((a, b) => a + b, 0) >= FARM.maxShells
  )
    return null;
  const choices = SNAILS.filter((n) => n.round <= s.journey.round);
  const found = choices[Math.floor(Math.pow(random(f), 1.8) * choices.length)];
  if (!found) return null;
  f.shells[found.id] = (f.shells[found.id] ?? 0) + 1;
  if (!f.discovered.includes(found.id)) f.discovered.push(found.id);
  f.findProgress = 0;
  f.findClock = 0;
  f.findsToday++;
  return found;
}
export function moveShellToFarm(s, id) {
  const f = s.village.farm;
  if (
    !f.built ||
    !species(id) ||
    !(f.shells[id] > 0) ||
    f.nursery.length >= FARM.slots
  )
    return false;
  f.shells[id]--;
  if (!f.shells[id]) delete f.shells[id];
  f.nursery.push({
    id: f.nextID++,
    species: id,
    growth: 0,
    meal: 0,
    investment: 0,
    honeyMeal: false,
  });
  return true;
}
function rawCount(s, id) {
  return (s.cargo?.[id]?.count ?? 0) + (s.village.raw[id] ?? 0);
}
function takeRaw(s, id, count) {
  let value = 0;
  const carried = s.cargo?.[id],
    amount = Math.min(count, carried?.count ?? 0);
  if (amount) {
    const cost = (carried.value * amount) / carried.count;
    carried.count -= amount;
    carried.value -= cost;
    s.bag -= amount;
    s.bagValue -= cost;
    value += cost;
    count -= amount;
    if (carried.count < 1e-8) delete s.cargo[id];
  }
  if (count) {
    const v = s.village,
      cost = ((v.rawValues[id] ?? 0) * count) / v.raw[id];
    v.raw[id] -= count;
    v.rawValues[id] -= cost;
    value += cost;
  }
  if (s.bag < 1e-8) {
    s.bag = 0;
    s.bagValue = 0;
  }
  return value;
}
export const FOOD_RECIPES = {
  flowers: { inputs: { moonbloom: 60, bouquet: 3 }, portions: 2 },
  fruit: { inputs: { moonbloom: 30, starfruit: 8, tea: 1 }, portions: 3 },
  honey: { inputs: { feed: 1, honey: 1 }, portions: 1, special: true },
  ...Object.fromEntries(
    HIVES.map((h) => [
      "snack-" + h.id,
      { inputs: { feed: 1, [h.honey]: 1 }, portions: 1, snack: h.honey },
    ]),
  ),
};
// Retain a small batch at the workshops so automatic sellers cannot make food impossible.
export function farmFoodReserve(s, id) {
  const f = s.village.farm;
  if (
    !f?.built ||
    f.food +
      f.storedFood +
      f.kitchen.ready +
      (f.kitchen.running ? FOOD_RECIPES[f.kitchen.recipe].portions : 0) >=
      2 ||
    !f.nursery.some((n) => n.growth < FARM.growSeconds)
  )
    return 0;
  return id === "bouquet" ? 3 : id === "tea" && s.village.beds[4] ? 1 : 0;
}
const productIDs = new Set(["bouquet", "tea"]);
export function foodIngredientCount(s, id) {
  if (id === "feed") return s.village.farm.food + s.village.farm.storedFood;
  if (id === "honey" || HIVES.some((h) => h.honey === id))
    return honeyCount(s, id === "honey" ? null : id);
  return productIDs.has(id)
    ? (s.productCargo?.items?.[id] ?? 0) +
        (availableProducts(s, id, true, { forFarm: true })+availableStoredProducts(s,id,{forFarm:true}))
    : rawCount(s, id);
}
function takeFoodIngredient(s, id, count) {
  if (id === "honey" || HIVES.some((h) => h.honey === id))
    return takeHoney(s, count, id === "honey" ? null : id);
  if (id === "feed") return takeBaseFood(s, count, "all");
  if (!productIDs.has(id)) return takeRaw(s, id, count);
  const cargo = s.productCargo,
    carried = Math.min(count, cargo?.items?.[id] ?? 0);
  let value = 0;
  if (carried) {
    value = (cargo.values[id] * carried) / cargo.items[id];
    cargo.items[id] -= carried;
    cargo.values[id] -= value;
    count -= carried;
  }
  if(count){const v=s.village,n=Math.min(count,availableProducts(s,id,true,{forFarm:true}));if(n){const cost=(v.finishedValues[id]??0)*n/v.finished[id];v.finished[id]-=n;v.finishedValues[id]-=cost;value+=cost;count-=n;}if(count)value+=takeStoredGood(v,id,count).value;}
  return value;
}
export function kitchenEmpty(k) {
  return !k.running && !k.ready && !Object.values(k.inputs).some((n) => n > 0);
}
export function selectFoodRecipe(s, recipe) {
  const f = s.village.farm;
  if (
    !f.built ||
    !Object.hasOwn(FOOD_RECIPES, recipe) ||
    (recipe === "fruit" && !s.village.beds[4]) ||
    !kitchenEmpty(f.kitchen)
  )
    return false;
  f.kitchen.recipe = recipe;
  return true;
}
export function kitchenIngredientCount(s, id, source = "all") {
  if (id === "feed")
    return (
      (source !== "storage" ? s.village.farm.food : 0) +
      (source !== "carried" ? s.village.farm.storedFood : 0)
    );
  if (id === "honey" || HIVES.some((h) => h.honey === id))
    return honeyCount(s, id === "honey" ? null : id, source);
  if (source === "carried")
    return productIDs.has(id)
      ? (s.productCargo?.items?.[id] ?? 0)
      : (s.cargo?.[id]?.count ?? 0);
  if (source === "storage")
    return productIDs.has(id)
      ? (availableProducts(s, id, true, { forFarm: true })+availableStoredProducts(s,id,{forFarm:true}))
      : (s.village.raw[id] ?? 0);
  return foodIngredientCount(s, id);
}
function takeKitchenIngredient(s, id, count, source) {
  if (id === "feed") return takeBaseFood(s, count, source);
  if (id === "honey" || HIVES.some((h) => h.honey === id))
    return takeHoney(s, count, id === "honey" ? null : id, source);
  if (source === "all") return takeFoodIngredient(s, id, count);
  if(source==='storage'&&productIDs.has(id)){const v=s.village,n=Math.min(count,availableProducts(s,id,true,{forFarm:true}));let value=0;if(n){value=(v.finishedValues[id]??0)*n/v.finished[id];v.finished[id]-=n;v.finishedValues[id]-=value;}return value+takeStoredGood(v,id,count-n).value;}
  if (source === "storage") {
    const v = s.village,
      quantities = productIDs.has(id) ? v.finished : v.raw,
      values = productIDs.has(id) ? v.finishedValues : v.rawValues;
    const value = ((values[id] ?? 0) * count) / quantities[id];
    quantities[id] -= count;
    values[id] = (values[id] ?? 0) - value;
    return value;
  }
  if (productIDs.has(id)) {
    const c = s.productCargo,
      value = (c.values[id] * count) / c.items[id];
    c.items[id] -= count;
    c.values[id] -= value;
    return value;
  }
  const c = s.cargo[id],
    value = (c.value * count) / c.count;
  c.count -= count;
  c.value -= value;
  s.bag = Math.max(0, s.bag - count);
  s.bagValue = Math.max(0, s.bagValue - value);
  if (c.count < 1e-8) delete s.cargo[id];
  return value;
}
export function supplyFoodKitchen(s, source = "carried") {
  const f = s.village.farm,
    k = f.kitchen,
    recipe = FOOD_RECIPES[k.recipe];
  if (
    !f.built ||
    k.running ||
    k.ready ||
    !["all", "carried", "storage"].includes(source) ||
    totalFarmFood(f) + recipe.portions - (recipe.inputs.feed ?? 0) >
      FARM.foodMax
  )
    return 0;
  let supplied = 0;
  for (const [id, needed] of Object.entries(recipe.inputs)) {
    const amount = Math.min(
      Math.max(0, needed - (k.inputs[id] ?? 0)),
      kitchenIngredientCount(s, id, source),
    );
    if (amount > 0) {
      const value = takeKitchenIngredient(s, id, amount, source);
      k.inputs[id] = (k.inputs[id] ?? 0) + amount;
      k.values[id] = (k.values[id] ?? 0) + value;
      supplied += amount;
    }
  }
  if (
    Object.entries(recipe.inputs).every(([id, n]) => (k.inputs[id] ?? 0) >= n)
  )
    k.running = true;
  return supplied;
}
// Explicit full-batch action; production remains timed and awaits collection.
export function makeSnailFood(s, recipe = "flowers") {
  const f = s.village.farm;
  if (
    !f.built ||
    !Object.hasOwn(FOOD_RECIPES, recipe) ||
    !kitchenEmpty(f.kitchen) ||
    totalFarmFood(f) +
      FOOD_RECIPES[recipe].portions -
      (FOOD_RECIPES[recipe].inputs.feed ?? 0) >
      FARM.foodMax ||
    !Object.entries(FOOD_RECIPES[recipe].inputs).every(
      ([id, n]) => foodIngredientCount(s, id) >= n,
    )
  )
    return false;
  f.kitchen.recipe = recipe;
  supplyFoodKitchen(s, "all");
  return true;
}
export function collectSnailFood(s) {
  const f = s.village.farm,
    k = f.kitchen;
  if (!f.built || !k.ready) return 0;
  const count = k.ready,
    recipe = FOOD_RECIPES[k.recipe];
  if (recipe.special) {
    f.honeyFood += count;
    f.honeyFoodValue += k.readyValue;
  } else if (recipe.snack) {
    const snack = (f.snacks[recipe.snack] ??= { count: 0, value: 0 });
    snack.count += count;
    snack.value += k.readyValue;
  } else {
    f.food += count;
    f.foodValue += k.readyValue;
  }
  f.kitchen = freshKitchen();
  f.kitchen.recipe = k.recipe;
  return count;
}
function takeBaseFood(s, count, source) {
  const f = s.village.farm;
  let value = 0;
  for (const key of ["food", "storedFood"]) {
    if (
      (source === "storage" && key === "food") ||
      (source === "carried" && key === "storedFood")
    )
      continue;
    const n = Math.min(count, f[key]);
    if (!n) continue;
    const v = (f[key + "Value"] * n) / f[key];
    f[key] -= n;
    f[key + "Value"] -= v;
    value += v;
    count -= n;
  }
  return value;
}
export function totalFarmFood(f) {
  return (
    f.food +
    f.storedFood +
    f.honeyFood +
    f.storedHoneyFood +
    Object.values(f.snacks).reduce((n, s) => n + s.count, 0) +
    Object.values(f.storedSnacks).reduce((n, s) => n + s.count, 0)
  );
}
export function storeSnailFood(s) {
  const f = s.village.farm,
    count =
      f.food +
      f.honeyFood +
      Object.values(f.snacks).reduce((n, x) => n + x.count, 0);
  if (!f.built || !count) return 0;
  f.storedHoneyFood += f.honeyFood;
  f.storedHoneyFoodValue += f.honeyFoodValue;
  f.honeyFood = 0;
  f.honeyFoodValue = 0;
  for (const [id, x] of Object.entries(f.snacks)) {
    const to = (f.storedSnacks[id] ??= { count: 0, value: 0 });
    to.count += x.count;
    to.value += x.value;
  }
  f.snacks = {};
  f.storedFood += f.food;
  f.storedFoodValue += f.foodValue;
  f.food = 0;
  f.foodValue = 0;
  return count;
}
export function withdrawSnailFood(s) {
  const f = s.village.farm,
    count =
      f.storedFood +
      f.storedHoneyFood +
      Object.values(f.storedSnacks).reduce((n, x) => n + x.count, 0);
  if (!f.built || !count) return 0;
  f.honeyFood += f.storedHoneyFood;
  f.honeyFoodValue += f.storedHoneyFoodValue;
  f.storedHoneyFood = 0;
  f.storedHoneyFoodValue = 0;
  for (const [id, x] of Object.entries(f.storedSnacks)) {
    const to = (f.snacks[id] ??= { count: 0, value: 0 });
    to.count += x.count;
    to.value += x.value;
  }
  f.storedSnacks = {};
  f.food += f.storedFood;
  f.foodValue += f.storedFoodValue;
  f.storedFood = 0;
  f.storedFoodValue = 0;
  return count;
}
export function feedNearbySnail(s, player, targets, radius = 3) {
  if (
    s.journey.asleep ||
    (s.journey.light ?? 0) >= 0.68 ||
    s.village.farm.food + s.village.farm.honeyFood < 1
  )
    return null;
  const nearby = targets
    .filter((n) => Math.hypot(player.x - n.x, player.z - n.z) <= radius)
    .sort(
      (a, b) =>
        Math.hypot(player.x - a.x, player.z - a.z) -
        Math.hypot(player.x - b.x, player.z - b.z),
    );
  for (const n of nearby) if (feedSnail(s, n.id)) return n;
  return null;
}
export function feedSnail(s, id) {
  const f = s.village.farm,
    n = f.nursery.find((n) => n.id === id);
  const special = n && n.growth >= 1800 && !n.honeyMeal,
    key = special ? "honeyFood" : "food";
  if (!n || n.growth >= FARM.growSeconds || n.meal > 0 || f[key] < 1)
    return false;
  const value = f[key + "Value"] / f[key];
  f[key + "Value"] = Math.max(0, f[key + "Value"] - value);
  f[key]--;
  n.investment += value;
  if (special) n.honeyMeal = true;
  n.meal = Math.min(
    FARM.mealSeconds,
    (n.honeyMeal ? FARM.growSeconds : 1800) - n.growth,
  );
  return true;
}
export function advanceFarm(s, dt) {
  const f = s.village.farm;
  if (!f?.built) return;
  const k = f.kitchen;
  if (k.running) {
    k.progress = Math.min(FARM.cookSeconds, k.progress + num(dt));
    if (k.progress >= FARM.cookSeconds) {
      k.running = false;
      k.ready = FOOD_RECIPES[k.recipe].portions;
      k.readyValue = Object.values(k.values).reduce((a, b) => a + b, 0);
      k.inputs = {};
      k.values = {};
    }
  }
  for (const n of f.nursery) {
    const growth = Math.min(
      Math.max(0, dt),
      n.meal,
      (n.honeyMeal ? FARM.growSeconds : 1800) - n.growth,
    );
    if (growth < 0) continue;
    n.growth += growth;
    n.meal -= growth;
  }
}
export function releaseSnail(s, id, mode) {
  const f = s.village.farm,
    i = f.nursery.findIndex((n) => n.id === id);
  if (i < 0 || f.nursery[i].growth < FARM.growSeconds) return false;
  const n = f.nursery[i];
  if (mode === "helper") {
    if (s.village.snails >= farmHelperLimit(s)) return false;
    s.village.snails++;
    s.helpers = s.village.snails;
    s.stats.helpers++;
    while (f.helpers.length < s.village.snails - 1) f.helpers.push(null);
    f.helpers[s.village.snails - 1] = n.species;
  } else if (mode === "sell") {
    // A shell is a collectible, never an unlimited money multiplier.
    credit(
      s,
      n.investment +
        Math.min(
          n.investment * 0.25,
          150 * Math.pow(1.055, Math.min(76, s.journey.round - 1)),
        ),
    );
    f.sold++;
  } else return false;
  f.nursery.splice(i, 1);
  return true;
}
